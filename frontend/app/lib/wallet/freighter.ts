import { isConnected, requestAccess, getPublicKey, setAllowed } from "@stellar/freighter-api";

export class FreighterNotInstalledError extends Error {
  constructor() {
    super("Freighter wallet is not installed");
    this.name = "FreighterNotInstalledError";
  }
}

export class FreighterAccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FreighterAccessDeniedError";
  }
}

export async function isFreighterInstalled(): Promise<boolean> {
  return isConnected();
}

export async function connectFreighter(): Promise<string> {
  const installed = await isConnected();
  if (!installed) {
    throw new FreighterNotInstalledError();
  }

  let address: string;
  try {
    address = await requestAccess();
  } catch (err) {
    throw new FreighterAccessDeniedError(err instanceof Error ? err.message : "Access denied");
  }

  if (!address) {
    throw new FreighterAccessDeniedError("Access denied");
  }

  await setAllowed();
  return address;
}

export async function getFreighterAddress(): Promise<string | null> {
  const connected = await isConnected();
  if (!connected) {
    return null;
  }

  const address = await getPublicKey();
  return address || null;
}
