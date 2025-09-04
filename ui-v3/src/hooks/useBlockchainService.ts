
import { useState } from 'react';
import { BlockchainService } from '@/services/blockchainService';
import { Transaction, Recipient, SmartWallet } from '@/services/interfaces';

export const useBlockchainService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [smartWallets, setSmartWallets] = useState<SmartWallet[]>([]);

  // const { isDemMode } = useWalletConnection();

  // Select the appropriate services based on demo mode
  const blockchainService = new BlockchainService();

  const getTransactionStatus = async (txHash: string) => {
    try {
      return await blockchainService.getTransactionStatus(txHash);
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      throw error;
    }
  };

  return {
    getTransactionStatus,
    transactions,
    recipients,
    smartWallets,
    isLoading,
<<<<<<< HEAD
    addAdmin: blockchainService.addAdmin,
    transferOwnership: blockchainService.transferOwnership,
    depositSTX: blockchainService.depositSTX,
    depositFT: blockchainService.depositFT,
=======
>>>>>>> 6632ce3 (Review 2025-07-04 #77)
    // isDemoMode
  };
};