import { useState, useEffect, useCallback } from 'react';
import { SmartWalletContractService } from '@/services/smartWalletContractService';
import { AccountBalanceService } from '@/services/accountBalanceService';
import type { ContractType } from '@/data/walletTypes';

/**
 * Hook for managing smart wallet contract service operations
 * Provides loading state, error handling, and automatic refetching capabilities
 */
export const useSmartWalletContractService = (walletAddress?: string) => {
  // State management
  const [smartWallets, setSmartWallets] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<ContractType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches both smart wallets and extension contracts for the given wallet address
   * @param address - The wallet address to fetch contracts for
   */
  const fetchWalletData = useCallback(async (address: string) => {
    if (!address) {
      setSmartWallets([]);
      setExtensions([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const smartWalletService = new SmartWalletContractService();
      const balanceService = new AccountBalanceService();

      // Fetch smart wallets and extension contracts in parallel
      const [allWallets, extensionContracts] = await Promise.all([
        smartWalletService.getSmartWallets(address),
        smartWalletService.getSmartWalletExtensionContracts(address)
      ]);

      // Filter out extension wallets from smart wallets (keep only main wallets)
      const smartWalletsOnly = allWallets.filter(wallet => !wallet.ext);

      // Update smart wallet objects with actual balances
      const updatedSmartWallets = await Promise.all(
        smartWalletsOnly.map(async (wallet) => {
          try {
            // Fetch balance for this specific wallet address
            const balances = await balanceService.getAccountBalances(wallet.contractId);

            // Update the wallet object with actual balances
            return {
              ...wallet,
              stxHolding: balances?.stx?.balance ? Number(balances.stx.balance) : 0,
              btcHolding: balances?.sbtc?.balance ? Number(balances.sbtc.balance) : 0,
            };
          } catch (error) {
            console.error(`Failed to fetch balance for wallet ${wallet.contractId}:`, error);
            // Return wallet with original values if balance fetch fails
            return wallet;
          }
        })
      );

      // Update extension contracts with actual balances
      const updatedExtensions = await Promise.all(
        extensionContracts.map(async (extension) => {
          try {
            // Construct the full contract address for the extension
            const contractAddress = `${address}.${extension.name}`;
            // Fetch balance for this specific extension contract
            const balances = await balanceService.getAccountBalances(contractAddress);
            console.log({ contractAddress, extension, balances });

            // Update the extension object with actual balances
            return {
              ...extension,
              stxHolding: balances?.stx?.balance ? Number(balances.stx.balance) : 0,
              btcHolding: balances?.sbtc?.balance ? Number(balances.sbtc.balance) : 0,
            };
          } catch (error) {
            console.error(`Failed to fetch balance for extension ${extension.name}:`, error);
            // Return extension with original values if balance fetch fails
            return extension;
          }
        })
      );

      setSmartWallets(updatedSmartWallets);
      setExtensions(updatedExtensions);
      console.log(`Successfully fetched ${updatedSmartWallets.length} smart wallets with updated balances and ${extensionContracts.length} extension contracts`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet data';
      setError(errorMessage);
      console.error('Error fetching wallet data:', err);

      // Reset data on error
      setSmartWallets([]);
      setExtensions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refetches wallet data for the current wallet address
   */
  const refetch = useCallback(() => {
    if (walletAddress) {
      fetchWalletData(walletAddress);
    }
  }, [walletAddress, fetchWalletData]);

  /**
   * Clears all wallet data
   */
  const clearData = useCallback(() => {
    setSmartWallets([]);
    setExtensions([]);
    setError(null);
    setLoading(false);
  }, []);

  // Auto-fetch when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      fetchWalletData(walletAddress);
    } else {
      // Clear data when no wallet address is provided
      clearData();
    }
  }, [walletAddress, fetchWalletData, clearData]);

  return {
    // Data
    smartWallets,
    extensions,

    // State
    loading,
    error,

    // Actions
    refetch,
    clearData,
    fetchWalletData,

    // Computed properties
    hasSmartWallets: smartWallets.length > 0,
    hasExtensions: extensions.length > 0,
    smartWalletCount: smartWallets.length,
    extensionCount: extensions.length,
  };
};

export default useSmartWalletContractService;
