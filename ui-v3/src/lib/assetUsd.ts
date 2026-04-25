import { getRates } from "@/services/getRates";
import { fetchStxUsdPrice } from "@/lib/stxPrice";
import { getBtcUsdPrice } from "@/services/btcMempoolService";

/** Prefer Charisma index price when valid, else CoinGecko STX/USD. */
export function selectStxUsd(
  charismaUsd: number | null | undefined,
  coingeckoUsd: number | null | undefined
): number | null {
  if (charismaUsd != null && +charismaUsd > 0) return +charismaUsd;
  if (coingeckoUsd != null && +coingeckoUsd > 0) return +coingeckoUsd;
  return null;
}

export async function fetchStxSpotUsd(): Promise<{
  usd: number | null;
  fromCharisma: boolean;
}> {
  const fromApi = await getRates(".stx");
  const c = fromApi?.usdPrice;
  if (c != null && +c > 0) return { usd: +c, fromCharisma: true };
  const cg = await fetchStxUsdPrice();
  if (cg != null && cg > 0) return { usd: cg, fromCharisma: false };
  return { usd: null, fromCharisma: false };
}

export async function fetchAllAssetSpotUsd(): Promise<{
  stxUsd: number | null;
  btcUsd: number | null;
}> {
  const [stx, btc] = await Promise.all([fetchStxSpotUsd(), getBtcUsdPrice()]);
  return { stxUsd: stx.usd, btcUsd: btc != null && btc > 0 ? btc : null };
}
