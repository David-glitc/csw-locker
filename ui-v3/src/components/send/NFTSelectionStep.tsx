import PrimaryButton from "@/components/ui/primary-button";
import SecondaryButton from "@/components/ui/secondary-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { useAccountBalanceService } from "@/hooks/useAccountBalanceService";
import { useParams } from "react-router-dom";

interface NFTSelectionStepProps {
   asset: string;
   tokenId: string;
   contractAddress: string;
   onAssetChange: (asset: string) => void;
   onTokenIdChange: (tokenId: string) => void;
   onContractAddressChange: (contractAddress: string) => void;
   onNext: () => void;
   onBack: () => void;
}

const NFTSelectionStep = ({
   asset,
   tokenId,
   contractAddress,
   onAssetChange,
   onTokenIdChange,
   onContractAddressChange,
   onNext,
   onBack,
}: NFTSelectionStepProps) => {
   const isValid = asset && tokenId && contractAddress;
   const { walletId } = useParams<{ walletId: `${string}.${string}` }>();
   
   // Use the hook to get NFT balances and metadata
   const { nftBalance, nftMetadata, loading } = useAccountBalanceService(walletId);
   
   // Create processed NFT tokens with metadata
   const processedNftTokens = nftBalance.map(nft => {
      const metadata = nftMetadata[nft.asset_identifier];
      console.log('Processing NFT:', { nft, metadata, assetIdentifier: nft.asset_identifier });
      return {
         ...nft,
         name: metadata?.metadata?.name || nft.asset_identifier.split("::")[1] || "Unknown NFT",
         description: metadata?.metadata?.description || "",
         image: metadata?.metadata?.cached_image || metadata?.metadata?.image || "",
         contract: nft.asset_identifier.split("::")[0]
      };
   });

   return (
      <div className="space-y-6">
         <h3 className="text-lg font-semibold text-white">
            Select NFT Details
         </h3>

         {processedNftTokens.length > 0 ? (
            <>
               <div className="space-y-2">
                  <Label htmlFor="nftAsset" className="text-slate-300">
                     Select NFT
                  </Label>
                  <Select
                     value={asset}
                     onValueChange={(value) => {
                        const nft = processedNftTokens.find((nft) => nft.asset_identifier === value);

                        if (!nft) return;
                        onAssetChange(nft.asset_identifier);
                        onTokenIdChange("1"); // Default token ID, could be enhanced
                        onContractAddressChange(nft.contract);
                     }}
                     required={true}
                     disabled={loading}
                  >
                     <SelectTrigger className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500">
                        <SelectValue placeholder={loading ? "Loading NFTs..." : "Choose an NFT to send"} />
                     </SelectTrigger>
                     <SelectContent className="bg-slate-700 border-slate-600">
                        {processedNftTokens.map((nft) => (
                           <SelectItem
                              value={nft.asset_identifier}
                              key={nft.asset_identifier}
                              className="text-white hover:bg-slate-600 focus:bg-slate-600"
                           >
                              {nft.name} ({nft.count} available)
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label htmlFor="tokenId" className="text-slate-300">
                        Token ID
                     </Label>
                     <Input
                        id="tokenId"
                        value={tokenId}
                        onChange={(e) => onTokenIdChange(e.target.value)}
                        placeholder="123"
                        disabled={true} // Token ID is auto-filled based on selected NFT
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 hover:bg-slate-600 hover:border-slate-500"
                     />
                  </div>

                  <div className="space-y-2">
                     <Label
                        htmlFor="contractAddress"
                        className="text-slate-300"
                     >
                        Contract Address
                     </Label>
                     <Input
                        id="contractAddress"
                        value={contractAddress}
                        onChange={(e) =>
                           onContractAddressChange(e.target.value)
                        }
                        placeholder="SP1ABC...XYZ123.nft-contract"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 hover:bg-slate-600 hover:border-slate-500"
                     />
                  </div>
               </div>
            </>
         ) : (
            <div className="text-center py-8">
               <p className="text-slate-400 text-lg">
                  {loading ? "Loading NFTs..." : "No NFTs available in this wallet."}
               </p>
            </div>
         )}

         <div className="flex gap-3">
            <SecondaryButton className="flex-1" onClick={onBack}>
               Back
            </SecondaryButton>
            <PrimaryButton
               className="flex-1"
               disabled={!isValid || processedNftTokens.length === 0}
               onClick={onNext}
            >
               Next
            </PrimaryButton>
         </div>
      </div>
   );
};

export default NFTSelectionStep;
