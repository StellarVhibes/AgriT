# Stellar Frontend Integration Guide: Building dApps on Stellar 🌐

This guide covers how to build a modern frontend that interacts with Stellar smart contracts (Soroban). We will focus on using the **Freighter Wallet** and the **Stellar SDK**.

---

## 1. The Stack 🥞

To build a robust Stellar dApp, you'll typically use:
- **Frontend Framework:** Next.js (React) is standard.
- **Wallet Connection:** `@stellar/freighter-api`.
- **Blockchain Interaction:** `@stellar/stellar-sdk` (handles XDR encoding/decoding and RPC calls).
- **Network:** Testnet or Mainnet (during development).

---

## 1.5 Contract Deployment 🚀

The AgriTrust VYC contract must be deployed to Stellar testnet before frontend integration.

### Deploy the Contract

```bash
cd smartcontract
make deploy-testnet
```

Or manually:

```bash
# Build the contract
cargo build --target wasm32-unknown-unknown --release

# Deploy to testnet (requires soroban-cli and funded testnet identity)
soroban contract deploy \
    --wasm target/wasm32-unknown-unknown/release/agritrust_vyc.wasm \
    --source <your-identity> \
    --network testnet
```

### Initialize the Contract

After deployment, initialize with admin and oracle addresses:

```bash
soroban contract invoke \
    --id <CONTRACT_ID> \
    --source <admin> \
    --network testnet \
    -- \
    init \
    --admin <admin-address> \
    --oracle <oracle-address>
```

### Update Environment Variables

Once deployed, update `backend/.env.example` with the contract ID:

```env
TESTNET_CONTRACT_ID=CD4WR3SGKTBCXDSNOWMAIYH6NZXICPD4EKOAGF6ZS6RCPEYZGKVDGOOV
```

**Deployed Contract Details:**
- Contract ID: `CD4WR3SGKTBCXDSNOWMAIYH6NZXICPD4EKOAGF6ZS6RCPEYZGKVDGOOV`
- Deploy Transaction: `d7715e84e8e7a53c9bf6cc244688317e5267af106bad64d6e0abde32300765d9`
- stellar.expert: https://stellar.expert/explorer/testnet/tx/d7715e84e8e7a53c9bf6cc244688317e5267af106bad64d6e0abde32300765d9
- Stellar Lab: https://lab.stellar.org/r/testnet/contract/CD4WR3SGKTBCXDSNOWMAIYH6NZXICPD4EKOAGF6ZS6RCPEYZGKVDGOOV

### Verify Deployment

```bash
# Check admin
soroban contract invoke \
    --id <CONTRACT_ID> \
    --network testnet \
    -- \
    get_admin

# Check VYC count
soroban contract invoke \
    --id <CONTRACT_ID> \
    --network testnet \
    -- \
    get_vyc_count
```

---

## 2. Installation 📦

Add the necessary packages to your project:
```bash
npm install @stellar/freighter-api @stellar/stellar-sdk
```

### 2.1 Prerequisites: Funding Your Test Wallet 💸

Before you can send any transaction, your Freighter wallet needs testnet XLM.

1.  Open Freighter and switch to **Testnet**.
2.  Copy your wallet address.
3.  Go to the [Stellar Laboratory Account Creator](https://laboratory.stellar.org/#account-creator?network=test).
4.  Paste your address into the "Friendbot" section and click "Get Test Network XLM".

---

## 3. Wallet Connection (Freighter) 👛

Freighter is the "MetaMask" of Stellar. You need to check if it's installed and request access.

### Hook: `useFreighter.ts`
```typescript
import { isConnected, requestAccess, setAllowed } from "@stellar/freighter-api";
import { useState, useEffect } from "react";

export function useFreighter() {
  const [address, setAddress] = useState<string>("");
  
  useEffect(() => {
    async function checkConnection() {
      const connected = await isConnected();
      if (connected) {
        const addr = await requestAccess();
        if (addr) setAddress(addr);
      }
    }
    checkConnection();
  }, []);

  const connect = async () => {
    if (!await isConnected()) {
      alert("Please install Freighter!");
      return;
    }
    const addr = await requestAccess();
    if (addr) {
      await setAllowed();
      setAddress(addr);
    }
  };

  return { address, connect };
}
```

---

## 4. Sending USDC Payouts 💸

AgriTrust settles farmer payout proceeds in USDC/XLM on Stellar. Here is a standard Stellar payment as a baseline:

```typescript
import { 
  Keypair, 
  TransactionBuilder, 
  Asset, 
  Operation,
  TimeoutInfinite 
} from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";

async function sendWithGoal(
  senderKeypair: Keypair,
  recipientAddress: string,
  amount: string,
  goal: string
) {
  const server = new Server(HORIZON_URL);
  const account = await server.loadAccount(senderKeypair.publicKey());
  
  const transaction = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: "Test SDF Network ; September 2015"
  })
  .addOperation(Operation.payment({
    destination: recipientAddress,
    asset: Asset.native(), // or USDC
    amount: amount
  }))
  .setTimeout(TimeoutInfinite)
  .build();

  // Sign and submit
  transaction.sign(senderKeypair);
  const result = await server.submitTransaction(transaction);
  
  return result;
}
```

---

## 5. Interacting with Yield Certificates (VYCs) 🌾

Call the AgriTrust Soroban contract to mint a **Verifiable Yield Certificate**.
`mint_vyc` is admin/backend-only (it requires the protocol admin to auth), so this
call typically lives in the backend dashboard flow after proof-of-activity is verified.

```typescript
import { 
  Contract, 
  SorobanRpc, 
  xdr, 
  TimeoutInfinite 
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

const VYC_CONTRACT_ID = "C...";
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

async function mintVyc(
  adminAddress: string,
  farmerAddress: string,
  score: number,
  expectedYieldMicroUsdc: bigint,
  crop: string,
  region: string,
  activityHash: string
) {
  const server = new SorobanRpc.Server(RPC_URL);
  const account = await server.getAccount(adminAddress);
  
  const contract = new Contract(VYC_CONTRACT_ID);
  
  // Encode parameters
  const adminArg = xdr.ScVal.scvContractAddress(
    xdr.PublicKey.publicKeyTypeEd25519(xdr.Uint256.fromXdr(
      Buffer.from(adminAddress.replace("C", "").slice(0, 32), "hex")
    ))
  );
  const farmerArg = xdr.ScVal.scvAddress(farmerAddress);
  const scoreArg = xdr.ScVal.scvU32(score);
  const expectedYieldArg = xdr.ScVal.scvI128(xdr.Int128Parts.fromBigInt(expectedYieldMicroUsdc));
  const cropArg = xdr.ScVal.scvSymbol(crop);
  const regionArg = xdr.ScVal.scvSymbol(region);
  const activityHashArg = xdr.ScVal.scvString(activityHash);
  
  const tx = new TransactionBuilder(account, { 
    fee: "100", 
    networkPassphrase: NETWORK_PASSPHRASE 
  })
  .addOperation(contract.call("mint_vyc", [
    adminArg, farmerArg, scoreArg, expectedYieldArg,
    cropArg, regionArg, activityHashArg
  ]))
  .setTimeout(TimeoutInfinite)
  .build();

  const sim = await server.simulateTransaction(tx);
  if (!SorobanRpc.isSimulationSuccess(sim)) {
    throw new Error("Simulation failed");
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, sim);
  const signedXdr = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE
  });

  const result = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  );

  return result;
}
```

The RPC URL and passphrase must match the network the contract was deployed to.

---

## 6. Querying Certificate Status 📊

Read a farmer's VYCs to display status, expected yield, and harvest countdown.

```typescript
async function getVycStatus(vycId: bigint) {
  const server = new SorobanRpc.Server(RPC_URL);
  const contract = new Contract(VYC_CONTRACT_ID);

  const tx = new TransactionBuilder(
    new Account("G...", "0"), 
    { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
  )
  .addOperation(contract.call("get_vyc", [
    xdr.ScVal.scvU64(xdr.Uint64.fromString(vycId.toString())) 
  ]))
  .build();

  const sim = await server.simulateTransaction(tx);
  
  if (SorobanRpc.isSimulationSuccess(sim)) {
    // Parse the VycRecord struct fields:
    //   [0] id, [1] farmer, [2] score, [3] expected_yield,
    //   [4] crop, [5] region, [6] activity_hash, [7] status, [8] created_at, [9] updated_at
    const result = sim.result.retval;
    return {
      id: result[0].u64().toString(),
      score: result[2].u32(),
      expectedYield: result[3].i128().toString(),
      crop: result[4].sym().toString(),
      region: result[5].sym().toString(),
      status: result[7].map()
    };
  }
}

// Farmers query their own certificates with get_farmer_vycs(farmer),
// which returns the list of VYC IDs to fetch individually.
```

---

## 7. Credit Scoring & Yield Insights 🧠

Before a VYC is minted, the AgriTrust **backend** computes the farmer's credit
score (0-100) with the FluxID scoring engine and stores a proof-of-activity hash.
The frontend can surface this score via `get_vyc`. A simple client-side
illustration of how the score feeds the yield decision:

```typescript
type ScoreBand = "low" | "medium" | "high";

function scoreBand(score: number): ScoreBand {
  return score >= 70 ? "high" : score >= 40 ? "medium" : "low";
}

function eligibilityMessage(score: number, expectedYieldMicroUsdc: bigint): string {
  const band = scoreBand(score);
  if (band === "high") {
    return `Eligible: expected yield ${expectedYieldMicroUsdc.toString()} micro-USDC qualifies for full liquidity matching.`;
  }
  if (band === "medium") {
    return `Partial eligibility: conservative liquidity matched against expected yield.`;
  }
  return `Not yet eligible: improved proof-of-activity history raises the score.`;
}
```

The score itself comes from the backend — never compute it client-side.

---

## 8. Checklist for Integration ✅

- [ ] **Network Config:** Ensure your app points to the right RPC (Testnet vs Mainnet).
- [ ] **Passphrase:** Use the correct Network Passphrase.
- [ ] **Simulation:** ALWAYS simulate before asking the user to sign. It catches errors early and calculates gas.
- [ ] **XDR:** Familiarize yourself with Stellar's data format (XDR) if you aren't using generated bindings.
- [ ] **VYC Access Control:** Only the protocol admin can mint or update a VYC; the farmer frontend only reads certificates.

---

*Ready to build the trust layer for verifiable agricultural finance? 🌾*