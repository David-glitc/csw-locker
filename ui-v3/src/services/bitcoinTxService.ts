import { getClientConfig } from "@/utils/chain-config";

export type MempoolFeeEstimate = {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
};

type FeePresets = "fast" | "halfHour" | "economy";

const MEMPOOL_API = {
  mainnet: "https://mempool.space/api/v1/fees/recommended",
  testnet: "https://mempool.space/testnet/api/v1/fees/recommended",
} as const;

/**
 * Fetches recommended feerates (sat/vB) from the public Mempool instance.
 * For mainnet P2WPKH payment addresses, matches typical Leather/Xverse fee UX.
 */
export async function getRecommendedFeerates(
  btcAddress: string
): Promise<MempoolFeeEstimate | null> {
  const { network } = getClientConfig(btcAddress);
  const url = network === "mainnet" ? MEMPOOL_API.mainnet : MEMPOOL_API.testnet;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as MempoolFeeEstimate;
  } catch {
    return null;
  }
}

export function pickFeerateSatPerVb(
  estimate: MempoolFeeEstimate,
  preset: FeePresets
): number {
  switch (preset) {
    case "fast":
      return estimate.fastestFee;
    case "halfHour":
      return estimate.halfHourFee;
    case "economy":
      return Math.max(estimate.economyFee, estimate.minimumFee);
    default:
      return estimate.halfHourFee;
  }
}

const roughlyBlocksForPreset: Record<FeePresets, string> = {
  fast: "~1 block",
  halfHour: "~3 blocks",
  economy: "lower priority (longer wait)",
};

export function feePresetLabel(preset: FeePresets): string {
  return roughlyBlocksForPreset[preset];
}

export function getBitcoinTxExplorerUrl(txid: string, btcAddress: string): string {
  const { network } = getClientConfig(btcAddress);
  if (network === "mainnet") {
    return `https://mempool.space/tx/${txid}`;
  }
  return `https://mempool.space/testnet/tx/${txid}`;
}
