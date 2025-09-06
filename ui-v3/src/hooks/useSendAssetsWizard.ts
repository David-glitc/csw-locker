import { useState, useEffect } from "react";
import { useSelectedWallet } from "@/hooks/useSelectedWallet";
import { useTxServices } from "@/hooks/useTxServices";
import { useBlockchainService } from "@/hooks/useBlockchainService";
import { TransactionParams } from "@/services/txServices";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { RecipientStorageService } from "@/services/recipientStorageService";
import { Recipient } from "@/services/interfaces";

type WizardStep = "assetType" | "assetDetails" | "recipient" | "summary";

export const useSendAssetsWizard = () => {
   const [currentStep, setCurrentStep] = useState<WizardStep>("assetType");
   const [amount, setAmount] = useState("");
   const [recipient, setRecipient] = useState("");
   const [asset, setAsset] = useState("");
   const [assetType, setAssetType] = useState<"ft" | "nft">("ft");
   const [tokenId, setTokenId] = useState("");
   const [contractAddress, setContractAddress] = useState("");
   const [decimal, setDecimal] = useState<number>(0);
   const [recipients, setRecipients] = useState<Recipient[]>([]);
   const { walletId } = useParams<{ walletId: `${string}.${string}` }>()


   const { selectedWallet } = useSelectedWallet();
   const { sendTransaction: txSendTransaction, isLoading: txLoading } = useTxServices();
   const { toast } = useToast();

   // Get recent recipients from localStorage
   const getRecentRecipientsFromStorage = (): Recipient[] => {
      try {
         const frequencyData = RecipientStorageService.getRecipientFrequency();
         const removedRecipients = RecipientStorageService.getRemovedRecipients();

         return Object.entries(frequencyData)
            .filter(([address]) => !removedRecipients.includes(address))
            .map(([address, data]) => ({
               address,
               lastSent: formatLastSent(data.lastSent),
               frequency: data.count
            }))
            .sort((a, b) => new Date(b.lastSent).getTime() - new Date(a.lastSent).getTime())
            .slice(0, 10);
      } catch (error) {
         console.error('Error getting recent recipients from storage:', error);
         return [];
      }
   };

   // Format timestamp to human-readable format
   const formatLastSent = (timestamp: string): string => {
      try {
         const date = new Date(timestamp);
         const now = new Date();
         const diffMs = now.getTime() - date.getTime();
         const diffMins = Math.floor(diffMs / (1000 * 60));
         const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
         const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

         if (diffMins < 60) {
            return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
         } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
         } else {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
         }
      } catch (error) {
         return 'Unknown';
      }
   };

   // Fetch recipients from storage on component mount
   useEffect(() => {
      const fetchRecipients = () => {
         const recentRecipients = getRecentRecipientsFromStorage();
         setRecipients(recentRecipients);
      };

      fetchRecipients();

      // Listen for storage changes to update recipients list
      const handleStorageChange = () => {
         fetchRecipients();
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
         window.removeEventListener('storage', handleStorageChange);
      };
   }, []);

   const handleAssetTypeChange = (type: "ft" | "nft") => {
      setAssetType(type);
      setAsset("");
      setAmount("");
      setTokenId("");
      setContractAddress("");
      setDecimal(0); // Reset to default decimal
   };

   const resetForm = () => {
      setCurrentStep("assetType");
      setAmount("");
      setRecipient("");
      setAsset("");
      setTokenId("");
      setContractAddress("");
      setDecimal(0);
   };

   const handleRemoveRecipient = (address: string) => {
      try {
         // Remove recipient from localStorage
         RecipientStorageService.removeRecipient(address);

         // Refresh recipients list
         const recentRecipients = getRecentRecipientsFromStorage();
         setRecipients(recentRecipients);

         // Show success toast
         toast({
            title: "Recipient Removed",
            description: `Removed ${address} from recent recipients`,
         });

         console.log('Successfully removed recipient:', address);
         console.log('Storage stats:', RecipientStorageService.getStorageStats());
      } catch (error) {
         console.error('Error removing recipient:', error);
         toast({
            title: "Error",
            description: "Failed to remove recipient. Please try again.",
            variant: "destructive",
         });
      }
   };

   const handleSendTransaction = async () => {
      if (!selectedWallet) return;
      const transactionParams: TransactionParams = {
         from: walletId,
         to: recipient,
         amount: (+amount * Math.pow(10, decimal)).toString(),
         asset: asset,
         assetType: assetType,
         contractAddress: contractAddress,
         ...(assetType === "nft" && { tokenId }),
      };
      console.log({ transactionParams });
      try {
         const result = await txSendTransaction(transactionParams);

         if (result) {
            // Save transaction to localStorage for recipient tracking
            RecipientStorageService.saveTransaction(
               selectedWallet.address,
               recipient,
               amount,
               asset,
               result.txid || result.transaction
            );

            // Refresh recipients list
            const recentRecipients = getRecentRecipientsFromStorage();
            setRecipients(recentRecipients);

            console.log('Transaction saved to localStorage:', {
               from: selectedWallet.address,
               to: recipient,
               amount,
               asset,
               txHash: result.txid || result.transaction
            });

            resetForm();
         }
      } catch (error) {
         console.error('Transaction error:', error);
      }
   };

   return {
      // State
      currentStep,
      amount,
      recipient,
      asset,
      assetType,
      tokenId,
      contractAddress,
      decimal,
      selectedWallet,
      recipients,
      isLoading: txLoading,
      // isDemoMode,

      // Actions
      setCurrentStep,
      setAmount,
      setRecipient,
      setAsset,
      setTokenId,
      setContractAddress,
      setDecimal,
      handleAssetTypeChange,
      handleRemoveRecipient,
      handleSendTransaction,
      resetForm,
   };
};
