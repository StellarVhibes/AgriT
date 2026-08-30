"use client";

import {
  Contract,
  rpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
  StrKey,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";
import type { TransactionStatus } from "../hooks/useTransactionStatus";
import { mapVycStatus } from "../lib/vyc";

// Environment configuration
export const SOROBAN_CONFIG = {
  RPC_URL: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",
  NETWORK_PASSPHRASE: process.env.NEXT_PUBLIC_STELLAR_NETWORK === "MAINNET"
    ? Networks.PUBLIC
    : Networks.TESTNET,
  CONTRACT_ID: process.env.NEXT_PUBLIC_VYC_CONTRACT_ID || "",
};

export function isValidContractId(contractId?: string): boolean {
  if (!contractId || typeof contractId !== "string") return false;
  try {
    return StrKey.isValidContract(contractId.trim());
  } catch {
    return false;
  }
}

export interface MintVycParams {
  adminAddress: string;
  farmerAddress: string;
  score: number;
  expectedYield: string; // in micro-USDC
  crop: string;
  region: string;
  activityHash: string;
}

export interface VycRecord {
  id: string;
  farmer: string;
  score: number;
  expectedYield: string;
  crop: string;
  region: string;
  activityHash: string;
  status: "Active" | "Redeemed" | "Expired" | "Cancelled";
  createdAt: number;
  updatedAt: number;
}

export interface MintResult {
  success: boolean;
  vycId?: string;
  txHash?: string;
  error?: string;
}

export interface TransactionLifecycle {
  onStatus?: (status: Exclude<TransactionStatus, "idle" | "success" | "failed">) => void;
}

function getTransactionError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("reject") || normalizedMessage.includes("declin") || normalizedMessage.includes("cancel")) {
    return "Transaction rejected by wallet. Please approve the request and try again.";
  }

  if (normalizedMessage.includes("insufficient") || normalizedMessage.includes("underfunded")) {
    return "Insufficient balance to submit this transaction. Fund your wallet and try again.";
  }

  if (normalizedMessage.includes("timeout")) {
    return "Request timed out. Please try again.";
  }

  return message || "Unable to mint the certificate. Please try again.";
}

export interface QueryResult {
  success: boolean;
  data?: VycRecord;
  error?: string;
}

/**
 * Initialize the Soroban RPC server
 */
export function getSorobanServer(): rpc.Server {
  return new rpc.Server(SOROBAN_CONFIG.RPC_URL, {
    allowHttp: SOROBAN_CONFIG.RPC_URL.startsWith("http://"),
  });
}

/**
 * Build and prepare a contract call transaction
 */
async function buildTransaction(
  publicKey: string,
  contractId: string,
  method: string,
  params: xdr.ScVal[]
): Promise<ReturnType<rpc.Server["prepareTransaction"]>> {
  if (!isValidContractId(contractId)) {
    throw new Error("Contract ID is not configured or invalid. Please set NEXT_PUBLIC_VYC_CONTRACT_ID.");
  }
  const server = getSorobanServer();
  const sourceAccount = await server.getAccount(publicKey);

  const contract = new Contract(contractId);

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: SOROBAN_CONFIG.NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...params))
    .setTimeout(300)
    .build();

  return await server.prepareTransaction(transaction);
}

function validateMintParams(params: MintVycParams): string | null {
  if (!params.adminAddress || !params.farmerAddress) {
    return "Invalid addresses";
  }
  if (params.score < 0 || params.score > 100) {
    return "Score must be between 0 and 100";
  }
  if (!params.expectedYield || BigInt(params.expectedYield) <= 0) {
    return "Expected yield must be positive";
  }
  if (!params.crop || !params.region || !params.activityHash) {
    return "Missing required fields";
  }
  return null;
}

function decodeMintReturnVal(returnValue: xdr.ScVal | undefined, txHash: string): MintResult {
  if (!returnValue) {
    return { success: false, error: "Contract returned an empty result", txHash };
  }
  const decoded = scValToNative(returnValue);
  if (Array.isArray(decoded)) {
    if (decoded[0] === "Ok") {
      return { success: true, vycId: String(decoded[1]), txHash };
    }
    if (decoded[0] === "Err") {
      return { success: false, error: `Mint rejected by contract: ${String(decoded[1])}`, txHash };
    }
  }
  if (decoded !== undefined && decoded !== null) {
    return { success: true, vycId: String(decoded), txHash };
  }
  return { success: false, error: "Contract returned an empty result", txHash };
}

async function pollTransactionResult(server: rpc.Server, hash: string): Promise<rpc.Api.GetTransactionResponse> {
  const maxAttempts = 30;
  let attempts = 0;
  let getResponse = await server.getTransaction(hash);

  while (getResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    getResponse = await server.getTransaction(hash);
    attempts++;
  }
  return getResponse;
}

/**
 * Mint a new Verifiable Yield Certificate
 * This function requires admin authorization
 */
export async function mintVyc(params: MintVycParams, lifecycle: TransactionLifecycle = {}): Promise<MintResult> {
  let txHash: string | undefined;

  try {
    lifecycle.onStatus?.("pending");

    const validationError = validateMintParams(params);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const { adminAddress, farmerAddress, score, expectedYield, crop, region, activityHash } = params;
    const yieldBigInt = BigInt(expectedYield);
    const regionSymbol = region.replace(/-/g, "_");

    const contractParams = [
      new Address(adminAddress).toScVal(),
      new Address(farmerAddress).toScVal(),
      nativeToScVal(score, { type: "u32" }),
      nativeToScVal(yieldBigInt, { type: "i128" }),
      nativeToScVal(crop, { type: "symbol" }),
      nativeToScVal(regionSymbol, { type: "symbol" }),
      nativeToScVal(activityHash, { type: "string" }),
    ];

    const preparedTx = await buildTransaction(
      adminAddress,
      SOROBAN_CONFIG.CONTRACT_ID,
      "mint_vyc",
      contractParams
    );

    lifecycle.onStatus?.("signing");
    const signedXdr = await signTransaction(preparedTx.toXDR(), {
      networkPassphrase: SOROBAN_CONFIG.NETWORK_PASSPHRASE,
      accountToSign: adminAddress,
    });

    const server = getSorobanServer();
    const tx = TransactionBuilder.fromXDR(signedXdr, SOROBAN_CONFIG.NETWORK_PASSPHRASE);

    lifecycle.onStatus?.("submitting");
    const sendResponse = await server.sendTransaction(tx);
    txHash = sendResponse.hash;

    if (sendResponse.status === "PENDING") {
      const getResponse = await pollTransactionResult(server, sendResponse.hash);

      if (getResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        return decodeMintReturnVal(getResponse.returnValue, sendResponse.hash);
      }
      return {
        success: false,
        error: `Transaction failed with status: ${getResponse.status}`,
        txHash,
      };
    }

    return {
      success: false,
      error: "Transaction submission failed",
      txHash,
    };
  } catch (error) {
    console.error("Error minting VYC:", error);
    return {
      success: false,
      error: getTransactionError(error),
      txHash,
    };
  }
}

/**
 * Get a VYC record by ID
 */
export async function getVyc(vycId: string): Promise<QueryResult> {
  try {
    if (!vycId || Number.isNaN(Number(vycId)) || Number(vycId) <= 0) {
      return { success: false, error: "Invalid certificate ID" };
    }

    if (!isValidContractId(SOROBAN_CONFIG.CONTRACT_ID)) {
      return { success: false, error: "Contract ID is not configured" };
    }

    const server = getSorobanServer();

    // Use a dummy account for read-only queries
    const dummyAccount = await server.getAccount(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
    ).catch(() => null);

    if (!dummyAccount) {
      return { success: false, error: "Failed to initialize query" };
    }

    const contract = new Contract(SOROBAN_CONFIG.CONTRACT_ID);
    const params = [nativeToScVal(vycId, { type: "u64" })];

    const transaction = new TransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase: SOROBAN_CONFIG.NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("get_vyc", ...params))
      .setTimeout(300)
      .build();

    const simResponse = await server.simulateTransaction(transaction);

    if (rpc.Api.isSimulationSuccess(simResponse) && simResponse.result) {
      const resultVal = simResponse.result.retval;
      const vycData = scValToNative(resultVal);

      if (!vycData) {
        return { success: false, error: `Certificate #${vycId} was not found on-chain.` };
      }

      const vyc: VycRecord = {
        id: vycData.id !== undefined ? vycData.id.toString() : String(vycId),
        farmer: vycData.farmer || "",
        score: Number(vycData.score || 0),
        expectedYield: vycData.expected_yield !== undefined ? vycData.expected_yield.toString() : "0",
        crop: String(vycData.crop || "UNKNOWN"),
        region: String(vycData.region || ""),
        activityHash: String(vycData.activity_hash || ""),
        status: mapVycStatus(vycData.status),
        createdAt: Number(vycData.created_at || 0),
        updatedAt: Number(vycData.updated_at || 0),
      };

      return { success: true, data: vyc };
    }

    return { success: false, error: `Failed to query certificate #${vycId}` };
  } catch (error) {
    console.error("Error querying VYC:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to query VYC",
    };
  }
}

/**
 * Get all VYC IDs for a farmer
 */
export async function getFarmerVycs(farmerAddress: string): Promise<string[]> {
  try {
    if (!isValidContractId(SOROBAN_CONFIG.CONTRACT_ID)) {
      return [];
    }

    const server = getSorobanServer();

    const dummyAccount = await server.getAccount(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
    ).catch(() => null);

    if (!dummyAccount) {
      return [];
    }

    const contract = new Contract(SOROBAN_CONFIG.CONTRACT_ID);
    const params = [new Address(farmerAddress).toScVal()];

    const transaction = new TransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase: SOROBAN_CONFIG.NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("get_farmer_vycs", ...params))
      .setTimeout(300)
      .build();

    const simResponse = await server.simulateTransaction(transaction);

    if (rpc.Api.isSimulationSuccess(simResponse) && simResponse.result) {
      const resultVal = simResponse.result.retval;
      const vycIds = scValToNative(resultVal);
      return vycIds.map((id: bigint) => id.toString());
    }

    return [];
  } catch (error) {
    console.error("Error querying farmer VYCs:", error);
    return [];
  }
}

/**
 * Get the total number of VYCs minted
 */
export async function getVycCount(): Promise<number> {
  try {
    if (!isValidContractId(SOROBAN_CONFIG.CONTRACT_ID)) {
      return 0;
    }

    const server = getSorobanServer();

    const dummyAccount = await server.getAccount(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
    ).catch(() => null);

    if (!dummyAccount) {
      return 0;
    }

    const contract = new Contract(SOROBAN_CONFIG.CONTRACT_ID);

    const transaction = new TransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase: SOROBAN_CONFIG.NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("get_vyc_count"))
      .setTimeout(300)
      .build();

    const simResponse = await server.simulateTransaction(transaction);

    if (rpc.Api.isSimulationSuccess(simResponse) && simResponse.result) {
      const resultVal = simResponse.result.retval;
      return Number(scValToNative(resultVal));
    }

    return 0;
  } catch (error) {
    console.error("Error querying VYC count:", error);
    return 0;
  }
}
