/**
 * Resolve the 33-byte compressed secp256k1 public key for the connected Bitcoin address.
 *
 * Priority:
 * 1. The publicKey already on `preferredBtc` / `taprootBtc` (returned by `connect()`).
 * 2. A fresh `getAddresses` RPC round-trip (some wallets populate pubkeys only here).
 */

import { request as stacksRequest } from "@stacks/connect";
import type { WalletSessionData } from "@/lib/walletSession";
import { getClientConfig } from "@/utils/chain-config";

export type OwnerPubkeyResult = {
  address: string;
  publicKeyHex: string;
};

function pick(session: WalletSessionData, address: string): string | undefined {
  const all = [
    session.preferredBtc,
    session.taprootBtc,
    ...session.addresses.btc,
  ].filter(Boolean);
  return all.find((a) => a && a.address === address && a.publicKey)?.publicKey;
}

export async function resolveOwnerPubkey(
  session: WalletSessionData | null,
  address: string
): Promise<OwnerPubkeyResult> {
  if (!address) throw new Error("No Bitcoin address selected.");
  const fromSession = session ? pick(session, address) : undefined;
  if (fromSession) {
    return { address, publicKeyHex: fromSession };
  }
  const network = getClientConfig(address).network;
  const res = await stacksRequest("getAddresses", { network });
  const entries = res?.addresses ?? [];
  const match = entries.find((e) => e.address === address && e.publicKey);
  if (!match) {
    throw new Error(
      "Wallet did not return a public key for this Bitcoin address. Reconnect or switch accounts and try again."
    );
  }
  return { address, publicKeyHex: match.publicKey };
}
