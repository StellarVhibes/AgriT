import { describe, expect, it } from "vitest";
import { initialTransactionState, transactionStatusReducer } from "./useTransactionStatus";

describe("transactionStatusReducer", () => {
  it("moves from idle through signing and submission to success", () => {
    const pending = transactionStatusReducer(initialTransactionState, {
      type: "STATUS",
      status: "pending",
    });
    const signing = transactionStatusReducer(pending, { type: "STATUS", status: "signing" });
    const submitting = transactionStatusReducer(signing, { type: "STATUS", status: "submitting" });
    const success = transactionStatusReducer(submitting, {
      type: "SUCCESS",
      txHash: "abc123",
    });

    expect(pending.status).toBe("pending");
    expect(signing.status).toBe("signing");
    expect(submitting.status).toBe("submitting");
    expect(success).toEqual({ status: "success", txHash: "abc123", error: null });
  });

  it("captures a recoverable failure", () => {
    const signing = transactionStatusReducer(initialTransactionState, {
      type: "STATUS",
      status: "signing",
    });
    const failed = transactionStatusReducer(signing, {
      type: "FAILED",
      error: "Transaction rejected by wallet. Please try again.",
    });

    expect(failed.status).toBe("failed");
    expect(failed.error).toBe("Transaction rejected by wallet. Please try again.");
  });

  it("resets terminal states for another transaction", () => {
    const failed = transactionStatusReducer(initialTransactionState, {
      type: "FAILED",
      error: "Insufficient balance to submit this transaction.",
    });

    expect(transactionStatusReducer(failed, { type: "RESET" })).toEqual(initialTransactionState);
  });
});
