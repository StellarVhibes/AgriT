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

## 4. Sending Payments (IntentRemit) 💸

IntentRemit sends USDC/XLM with programmable goals and conditional splits.

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

## 5. Interacting with Growth Vaults 📦

Call the Soroban contract to create a time-locked vault.

```typescript
import { 
  Contract, 
  SorobanRpc, 
  xdr, 
  TimeoutInfinite 
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

const VAULT_CONTRACT_ID = "C...";
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

async function createGrowthVault(
  userAddress: string,
  lockedAmount: number,
  unlockTime: number,
  goal: string
) {
  const server = new SorobanRpc.Server(RPC_URL);
  const account = await server.getAccount(userAddress);
  
  const contract = new Contract(VAULT_CONTRACT_ID);
  
  // Encode parameters
  const unlockTimeArg = xdr.ScVal.scvU64(unlockTime);
  const amountArg = xdr.ScVal.scvI128(lockedAmount);
  const goalArg = xdr.ScVal.scvSymbol(goal);
  
  const tx = new TransactionBuilder(account, { 
    fee: "100", 
    networkPassphrase: NETWORK_PASSPHRASE 
  })
  .addOperation(contract.call("create_vault", [amountArg, unlockTimeArg, goalArg]))
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

---

## 6. Querying Vault Status 📊

Read the vault to display locked amount and unlock countdown.

```typescript
async function getVaultStatus(vaultId: string) {
  const server = new SorobanRpc.Server(RPC_URL);
  const contract = new Contract(VAULT_CONTRACT_ID);

  const tx = new TransactionBuilder(
    new Account("G...", "0"), 
    { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
  )
  .addOperation(contract.call("get_vault_status", [
    xdr.ScVal.scvAddress(vaultId)
  ]))
  .build();

  const sim = await server.simulateTransaction(tx);
  
  if (SorobanRpc.isSimulationSuccess(sim)) {
    // Parse result to get locked_amount, unlock_time, goal
    const result = sim.result.retval;
    return {
      lockedAmount: result[0].i128(),
      unlockTime: result[1].u64(),
      goal: result[2].sym()
    };
  }
}
```

---

## 7. AI Allocation Suggestions 🧠

IntentRemit uses rule-based AI to suggest optimal splits.

```typescript
type Goal = "SchoolFees" | "Rent" | "BusinessCapital" | "Custom";

interface AllocationSuggestion {
  immediatePercent: number;
  lockedPercent: number;
  reasoning: string;
}

function getAllocationSuggestion(goal: Goal, amount: number): AllocationSuggestion {
  const suggestions: Record<Goal, AllocationSuggestion> = {
    SchoolFees: { 
      immediatePercent: 55, 
      lockedPercent: 45, 
      reasoning: "Keep portion locked for semester continuity" 
    },
    Rent: { 
      immediatePercent: 70, 
      lockedPercent: 30, 
      reasoning: "Priority to immediate rent payment" 
    },
    BusinessCapital: { 
      immediatePercent: 50, 
      lockedPercent: 50, 
      reasoning: "Balance immediate needs with growth capital" 
    },
    Custom: { 
      immediatePercent: 60, 
      lockedPercent: 40, 
      reasoning: "Default split for flexibility" 
    }
  };
  
  return suggestions[goal];
}

// Usage
const suggestion = getAllocationSuggestion("SchoolFees", 1000);
console.log(`${suggestion.immediatePercent}% now, ${suggestion.lockedPercent}% locked`);
// Output: 55% now, 45% locked
```

---

## 8. Checklist for Integration ✅

- [ ] **Network Config:** Ensure your app points to the right RPC (Testnet vs Mainnet).
- [ ] **Passphrase:** Use the correct Network Passphrase.
- [ ] **Simulation:** ALWAYS simulate before asking the user to sign. It catches errors early and calculates gas.
- [ ] **XDR:** Familiarize yourself with Stellar's data format (XDR) if you aren't using generated bindings.
- [ ] **Vault Security:** Verify unlock time hasn't passed before allowing withdrawal.

---

*Ready to build the future of programmable remittances? 🚀*