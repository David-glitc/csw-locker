
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { SmartWallet } from "@/services/interfaces";
import useSmartWalletContractService from "./useSmartWalletContractService";
import { useWalletConnection } from "./useWalletConnection";
import { useTxServices } from "./useTxServices";

interface SelectedWallet extends SmartWallet {
  address: string;
  isAdmin: boolean;
  isImported?: boolean;
}

export const useSelectedWallet = () => {
  const [selectedWallet, setSelectedWallet] = useState<Partial<SelectedWallet> | null>(null);
  const { walletId } = useParams<{ walletId: `${string}.${string}` }>()
  const { walletData } = useWalletConnection()
  const { isAdmin: validateIsAdmin } = useTxServices()
  const { validateSmartContract } = useSmartWalletContractService()

  useEffect(() => {
    if (!walletId) {
      setSelectedWallet(null);
      return;
    }

    const validateWallet = async () => {
      try {
        const wallet = await validateSmartContract(walletId);
        if (!wallet) {
          setSelectedWallet(null);
          return;
        }

        const isAdmin = await validateIsAdmin(walletId.split('.')[0], walletId);

        const extendedWallet = {
          ...wallet,
          address: wallet.contractId,
          isAdmin: isAdmin,
          isImported: Boolean(wallet?.isImported),
        };

                    setSelectedWallet(extendedWallet);
      } catch (error) {
        console.error('Failed to validate wallet:', error);
        setSelectedWallet(null);
      }
    };

    validateWallet();
  }, [walletId]);

  const switchWallet = (walletId: string) => {
    // This would typically navigate to the new wallet or update the selected wallet
  };

  const updateSelectedWallet = async (wallet: Partial<SelectedWallet>) => {
    const isAdmin = await validateIsAdmin(walletData?.addresses.stx?.[0]?.address, wallet.contractId)
    const extendedWallet = {
      ...wallet,
      address: wallet.contractId,
      isAdmin: isAdmin,
      isImported: Boolean(wallet?.isImported),
    }
    setSelectedWallet(extendedWallet);
  };

  return {
    selectedWallet,
    switchWallet,
    updateSelectedWallet,
    isLoading: !selectedWallet
  };
};
