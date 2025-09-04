import { useEffect, useState } from "react";
import { AccountBalanceService } from "@/services/accountBalanceService";
import {
  FungibleType,
  NftResponseBalance,
  FtResponseBalance,
  AccountBalanceType,
  NftMetadataResponse
} from "@/services/types";
import { getClientConfig } from "@/utils/chain-config";
import { toast } from "./use-toast";

export function useAccountBalanceService(walletAddress: string) {
  const [stxBalance, setStxBalance] = useState<FungibleType | null>(null);
  const [sBtcBalance, setSBtcBalance] = useState<FungibleType | null>(null);
  const [nftBalance, setNftBalance] = useState<NftResponseBalance[]>([]);
  const [ftBalance, setFtBalance] = useState<FtResponseBalance[]>([]);
  const [rawBalance, setRawBalance] = useState<AccountBalanceType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nftMetadata, setNftMetadata] = useState<Record<string, NftMetadataResponse>>({});
  const [ftMetadata, setFtMetadata] = useState<Record<string, any>>({});



  useEffect(() => {
    if (!walletAddress) {
      // Reset state when no address
      setStxBalance(null);
      setSBtcBalance(null);
      setNftBalance([]);
      setFtBalance([]);
      setRawBalance(null);
      setNftMetadata({});
      setFtMetadata({});
      setError(null);
      return;
    }

    const balancesService = new AccountBalanceService();
    setLoading(true);
    setError(null);

    balancesService.getAccountBalancesWithMetadata(walletAddress, {
      baseUrl: getClientConfig(walletAddress).api
    })
      .then((result) => {
        if (result.balances) {
          setStxBalance(result.balances.stx);
          setSBtcBalance(result.balances.sbtc);
          setNftBalance(result.balances.nft || []);
          
          // Filter out tokens with 0 balance and include STX and sBTC
          const filteredFtBalance = (result.balances.ft || []).filter(ft => 
            ft.balance && ft.balance !== "0" && ft.balance !== "0.000000"
          );
          
          // Add STX and sBTC to ftBalance if they have non-zero balances
          const combinedFtBalance = [...filteredFtBalance];
          
          if (result.balances.stx && result.balances.stx.balance && result.balances.stx.balance !== "0") {
            combinedFtBalance.push({
              balance: result.balances.stx.balance,
              total_sent: result.balances.raw.stx.total_sent || "0",
              total_received: result.balances.raw.stx.total_received || "0",
              asset_identifier: ".stacks::stx"
            });
          }
          
          if (result.balances.sbtc && result.balances.sbtc.balance && result.balances.sbtc.balance !== "0") {
            combinedFtBalance.push({
              balance: result.balances.sbtc.balance,
              total_sent: "0",
              total_received: "0",
              asset_identifier: result.balances.sbtc.asset_identifier || "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token::sbtc-token"
            });
          }
          
          setFtBalance(combinedFtBalance);
          setRawBalance(result.balances);
          setNftMetadata(result.nftMetadata);
          setFtMetadata(result.ftMetadata);
          console.log('Metadata fetched:', { nftMetadata: result.nftMetadata, ftMetadata: result.ftMetadata });
        } else {
          setError("Failed to fetch account balances");
        }
      })
      .catch((e) => {
        const errorMessage = e?.message || "Failed to fetch account balances";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      })
      .finally(() => setLoading(false));
  }, [walletAddress]);

  return {
    stxBalance,
    sBtcBalance,
    nftBalance,
    ftBalance,
    rawBalance,
    loading,
    error,
    nftMetadata,
    ftMetadata
  };
}