import { useWalletContext } from '@/contexts/WalletContext';

/**
 * Hook to access global wallet connection state
 * Provides reactive access to wallet connection status, data, and actions
 */
export const useGlobalWallet = () => {
  const context = useWalletContext();
  
  return {
    // Connection states
    isWalletConnected: context.isWalletConnected,
    isConnecting: context.isConnecting,
    
    // Wallet data
    walletData: context.walletData,
    
    // Actions
    connectWallet: context.connectWallet,
    disconnectWallet: context.disconnectWallet,
    
    // Convenience getters
    get stxAddress() {
      return context.walletData?.addresses.stx[0]?.address || null;
    },
    
    get btcAddress() {
      return context.walletData?.addresses.btc[0]?.address || null;
    },
    
    get hasWallet() {
      return context.isWalletConnected && context.walletData !== null;
    }
  };
};

