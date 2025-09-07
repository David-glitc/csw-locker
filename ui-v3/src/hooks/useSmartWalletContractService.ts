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
  const [deployedContracts, setDeployedContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches both smart wallets and extension contracts for the given wallet address
   * @param address - The wallet address to fetch contracts for
   */
  const fetchWalletData = useCallback(async (address: string) => {
    if (!address) {
      setDeployedContracts([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const smartWalletService = new SmartWalletContractService();
      const balanceService = new AccountBalanceService();

      // Fetch smart wallets only
      const allWallets = await smartWalletService.getSmartWallets(address);

      // Use smart wallets as the contracts array
      const allContracts = allWallets;

      // Update all contract objects with actual balances
      const updatedContracts = await Promise.all(
        allContracts.map(async (contract) => {
          try {
            // Use contractId for smart wallets, or construct address for extensions
            const contractAddress = (contract as any).contractId || `${address}.${contract.name}`;

            // Fetch balance for this specific contract address
            const balances = await balanceService.getAccountBalances(contractAddress);

            // Update the contract object with actual balances
            return {
              ...contract,
              stxHolding: balances?.stx?.balance ? Number(balances.stx.balance) : 0,
              btcHolding: balances?.sbtc?.balance ? Number(balances.sbtc.balance) : 0,
            };
          } catch (error) {
            // Return contract with original values if balance fetch fails
            return contract;
          }
        })
      );

                  setDeployedContracts(updatedContracts);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet data';
      setError(errorMessage);

      // Reset data on error
      setDeployedContracts([]);
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
   * Validates a smart contract
   */
  const validateSmartContract = useCallback(async (contractAddress: string): Promise<any | null> => {
    try {
      const smartWalletService = new SmartWalletContractService();
      const result = await smartWalletService.validateSmartContract(contractAddress);
      return result;
    } catch (error) {
      return null;
    }
  }, []);

  /**
   * Clears all wallet data
   */
  const clearData = useCallback(() => {
    setDeployedContracts([]);
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
    deployedContracts,

    // State
    loading,
    error,

    // Actions
    refetch,
    clearData,
    fetchWalletData,
    validateSmartContract,

    // Computed properties
    hasDeployedContracts: deployedContracts.length > 0,
    deployedContractCount: deployedContracts.length,
    smartWallets: deployedContracts.filter(contract => !contract.ext),
    extensions: deployedContracts.filter(contract => contract.ext),
    hasSmartWallets: deployedContracts.some(contract => !contract.ext),
    hasExtensions: deployedContracts.some(contract => contract.ext),
    smartWalletCount: deployedContracts.filter(contract => !contract.ext).length,
    extensionCount: deployedContracts.filter(contract => contract.ext).length,
  };
};

export default useSmartWalletContractService;
