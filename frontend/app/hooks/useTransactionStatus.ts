"use client";

import { useReducer } from "react";

export type TransactionStatus = "idle" | "pending" | "signing" | "submitting" | "success" | "failed";

export interface TransactionState {
  status: TransactionStatus;
  txHash: string | null;
  error: string | null;
}

export const initialTransactionState: TransactionState = {
  status: "idle",
  txHash: null,
  error: null,
};

export type TransactionAction =
  | { type: "STATUS"; status: Exclude<TransactionStatus, "success" | "failed"> }
  | { type: "SUCCESS"; txHash: string }
  | { type: "FAILED"; error: string }
  | { type: "RESET" };

export function transactionStatusReducer(
  state: TransactionState,
  action: TransactionAction
): TransactionState {
  switch (action.type) {
    case "STATUS":
      return { ...state, status: action.status, txHash: null, error: null };
    case "SUCCESS":
      return { status: "success", txHash: action.txHash, error: null };
    case "FAILED":
      return { ...state, status: "failed", error: action.error };
    case "RESET":
      return initialTransactionState;
    default:
      return state;
  }
}

export function useTransactionStatus() {
  const [state, dispatch] = useReducer(transactionStatusReducer, initialTransactionState);

  return {
    ...state,
    isInProgress: ["pending", "signing", "submitting"].includes(state.status),
    start: () => dispatch({ type: "STATUS", status: "pending" }),
    setStatus: (status: Exclude<TransactionStatus, "idle" | "success" | "failed">) =>
      dispatch({ type: "STATUS", status }),
    succeed: (txHash: string) => dispatch({ type: "SUCCESS", txHash }),
    fail: (error: string) => dispatch({ type: "FAILED", error }),
    reset: () => dispatch({ type: "RESET" }),
  };
}
