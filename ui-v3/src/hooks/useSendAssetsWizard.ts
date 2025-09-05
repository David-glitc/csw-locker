import { useState, useEffect } from "react";
import { useSelectedWallet } from "@/hooks/useSelectedWallet";
import { useTxServices } from "@/hooks/useTxServices";
import { useBlockchainService } from "@/hooks/useBlockchainService";
import { TransactionParams } from "@/services/txServices";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { RecipientStorageService } from "@/services/recipientStorageService";

type WizardStep = "assetType" | "assetDetails" | "recipient" | "summary";

export const useSendAssetsWizard = () => {
   const [currentStep, setCurrentStep] = useState<WizardStep>("assetType");
   const [amount, setAmount] = useState("");
   const [recipient, setRecipient] = useState("");
   const [asset, setAsset] = useState("");
   const [assetType, setAssetType] = useState<"ft" | "nft">("ft");
   const [tokenId, setTokenId] = useState("");
   const [contractAddress, setContractAddress] = useState("");
   const [decimal, setDecimal] = useState<number>(6);
   const { walletId } = useParams<{ walletId: `${string}.${string}` }>()


   const { selectedWallet } = useSelectedWallet();
   const { sendTransaction: txSendTransaction, isLoading: txLoading } = useTxServices();
   const {
      recipients,
      isLoading: blockchainLoading,
      // isDemoMode,
   } = useBlockchainService();
   const { toast } = useToast();

   const handleAssetTypeChange = (type: "ft" | "nft") => {
      setAssetType(type);
      setAsset("");
      setAmount("");
      setTokenId("");
      setContractAddress("");
      setDecimal(6); // Reset to default decimal
   };

   const resetForm = () => {
      setCurrentStep("assetType");
      setAmount("");
      setRecipient("");
      setAsset("");
      setTokenId("");
      setContractAddress("");
      setDecimal(6);
   };

   const handleRemoveRecipient = (address: string) => {
      try {
         // Remove recipient from localStorage
         RecipientStorageService.removeRecipient(address);

         // Show success toast
         toast({
            title: "Recipient Removed",
            description: `Removed ${address} from recent recipients`,
         });

         // Note: Recipient list will be refreshed automatically via localStorage

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
      console.log("Sending transaction:", { amount, decimal })
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

            // Note: Recipient list will be refreshed automatically via localStorage

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
