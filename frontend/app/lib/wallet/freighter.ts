import { isConnected, requestAccess, getAddress } from "@stellar/freighter-api";

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
  const result = await isConnected();
  return !result.error;
}

export async function connectFreighter(): Promise<string> {
  const connected = await isConnected();
  if (connected.error) {
    throw new FreighterNotInstalledError();
  }

  const access = await requestAccess();
  if (access.error) {
    throw new FreighterAccessDeniedError(access.error);
  }
  return access.address;
}

export async function getFreighterAddress(): Promise<string | null> {
  const connected = await isConnected();
  if (connected.error || !connected.isConnected) {
    return null;
  }

  const result = await getAddress();
  if (result.error || !result.address) {
    return null;
  }
  return result.address;
}
