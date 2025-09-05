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
          setFtBalance(result.balances.ft || []);
          setRawBalance(result.balances);
          setNftMetadata(result.nftMetadata);
          setFtMetadata(result.ftMetadata);
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