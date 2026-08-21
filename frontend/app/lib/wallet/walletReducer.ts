export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

export interface WalletState {
  status: WalletStatus;
  publicKey: string | null;
  balance: string | null;
  isLoadingBalance: boolean;
  error: string | null;
}

export const initialWalletState: WalletState = {
  status: "disconnected",
  publicKey: null,
  balance: null,
  isLoadingBalance: false,
  error: null,
};

export type WalletAction =
  | { type: "CONNECT_START" }
  | { type: "CONNECT_SUCCESS"; publicKey: string }
  | { type: "CONNECT_ERROR"; error: string }
  | { type: "DISCONNECT" }
  | { type: "BALANCE_LOADING" }
  | { type: "BALANCE_SUCCESS"; balance: string }
  | { type: "BALANCE_ERROR"; error: string };

export function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case "CONNECT_START":
      return { ...state, status: "connecting", error: null };
    case "CONNECT_SUCCESS":
      return { ...state, status: "connected", publicKey: action.publicKey, error: null };
    case "CONNECT_ERROR":
      return { ...state, status: "error", publicKey: null, balance: null, error: action.error };
    case "DISCONNECT":
      return { ...initialWalletState };
    case "BALANCE_LOADING":
      return { ...state, isLoadingBalance: true };
    case "BALANCE_SUCCESS":
      return { ...state, isLoadingBalance: false, balance: action.balance };
    case "BALANCE_ERROR":
      return { ...state, isLoadingBalance: false, balance: null };
    default:
      return state;
  }
}
