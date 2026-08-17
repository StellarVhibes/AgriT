const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";

export async function fetchXlmBalance(publicKey: string): Promise<string> {
  const res = await fetch(`${HORIZON_TESTNET_URL}/accounts/${publicKey}`);

  if (res.status === 404) {
    return "0";
  }
  if (!res.ok) {
    throw new Error(`Horizon request failed with status ${res.status}`);
  }

  const data = await res.json();
  const native = (data.balances as Array<{ asset_type: string; balance: string }>)?.find(
    (b) => b.asset_type === "native"
  );
  return native?.balance ?? "0";
}
