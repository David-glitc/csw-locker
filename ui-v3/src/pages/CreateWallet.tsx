import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import PrimaryButton from "@/components/ui/primary-button";
import { Textarea } from "@/components/ui/textarea";
import UnifiedHeader from "@/components/UnifiedHeader";
import { getVerifiedContracts, type ContractType } from "@/data/walletTypes";
import { useTxServices } from "@/hooks/useTxServices";
import { useUserWalletConnection } from "@/hooks/useWalletConnection";
import axios from "axios";
import { Check, Clock, Plus, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

const CreateWallet = () => {
  const { userData, isWalletConnected, connectWallet, isConnecting } = useUserWalletConnection()
  const { deployContract, isLoading, error } = useTxServices()
  const [description, setDescription] = useState("")
  const [selectedContract, setSelectedContract] = useState<ContractType>()
  const [isCreating, setIsCreating] = useState(false)
  const [verifiedContracts, setVerifiedContracts] = useState<ContractType[]>([]);

  const handleExtensionToggle = (contract: ContractType) => {
    setSelectedContract(contract)
  };

  const handleCreateWallet = async () => {
    if (!selectedContract) {
      return;
    }

    setIsCreating(true);

    try {
      // Fetch the Clarity code from the contract source
      const clarityCode: string = (await axios.get(selectedContract.src)).data;

      // Deploy the contract using the useTxServices hook
      await deployContract({
        name: selectedContract.name,
        clarityCode: clarityCode,
        clarityVersion: 3
      });

      // Optionally navigate to the new wallet or show success message
    } catch (error) {
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    async function init() {
      const vContracts = await getVerifiedContracts(userData?.addresses?.stx[0]?.address)
      setVerifiedContracts(vContracts)
    }
    init()
  }, [userData])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <UnifiedHeader variant="default" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Smart Wallet</h1>
            <p className="text-slate-400">Deploy a new smart contract wallet with custom extensions.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Wallet Configuration */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Wallet className="mr-2 h-5 w-5 text-purple-400" />
                  Wallet Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-slate-300 text-sm">Wallet Name</label>
                  <Input
                    disabled
                    value={selectedContract?.name}
                    placeholder="e.g., My Personal Wallet"
                    className="bg-slate-700/50 border-slate-600 text-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-slate-300 text-sm">Description (Optional)</label>
                  <Textarea
                    disabled
                    value={selectedContract?.description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this wallet's purpose..."
                    className="bg-slate-700/50 border-slate-600 text-white mt-1"
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="pt-4">
                    <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
                      <p className="text-red-400 text-sm">
                        <strong>Deployment Error:</strong> {error}
                      </p>
                    </div>
                  </div>
                )}

                {!isWalletConnected && (
                  <div className="pt-4">
                    <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-400 text-sm font-medium">
                            Wallet Not Connected
                          </p>
                          <p className="text-yellow-300 text-xs mt-1">
                            Connect your wallet to deploy smart contracts
                          </p>
                        </div>
                        <Wallet className="h-6 w-6 text-yellow-400" />
                      </div>
                    </div>
                    <PrimaryButton
                      onClick={connectWallet}
                      disabled={isConnecting}
                      className="w-full"
                    >
                      {isConnecting ? (
                        "Connecting..."
                      ) : (
                        <>
                          <Wallet className="mr-2 h-4 w-4" />
                          Connect Wallet
                        </>
                      )}
                    </PrimaryButton>
                  </div>
                )}

                {isWalletConnected && (
                  <div className="pt-4">
                    <PrimaryButton
                      onClick={handleCreateWallet}
                      disabled={isCreating || isLoading || !selectedContract}
                      className="w-full"
                    >
                      {isCreating || isLoading ? (
                        "Creating Wallet..."
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Smart Wallet
                        </>
                      )}
                    </PrimaryButton>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Extensions Selection */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Select Extensions</CardTitle>
                <p className="text-slate-400 text-sm">Choose extensions to add to your smart wallet</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {verifiedContracts.map((contract) => (
                    <div
                      key={contract.name}
                      className={`p-3 rounded-lg border transition-colors ${contract.comingSoon
                        ? "border-slate-600 bg-slate-700/20 opacity-60 cursor-not-allowed"
                        : selectedContract?.name === contract.name
                          ? "border-purple-600/50 bg-purple-600/10 cursor-pointer"
                          : "border-slate-600 bg-slate-700/30 hover:border-slate-500 cursor-pointer"
                        }`}
                      onClick={contract.isDeployed ? null : () => handleExtensionToggle(contract)}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedContract?.name === contract.name}
                          disabled={contract.isDeployed}
                          onChange={() => handleExtensionToggle(contract)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{contract.icon}</span>
                            <span className={`font-medium ${contract.comingSoon ? 'text-slate-400' : 'text-white'}`}>
                              {contract.name}
                            </span>
                            {contract.comingSoon && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-slate-600/50 rounded-full">
                                <Clock className="h-3 w-3 text-slate-400" />
                                <span className="text-xs text-slate-400">Coming Soon</span>
                              </div>
                            )}
                            {selectedContract?.name === contract.name && !contract.comingSoon && (
                              <Check className="h-4 w-4 text-green-400" />
                            )}
                          </div>
                          <p className={`text-sm mt-1 ${contract.comingSoon ? 'text-slate-500' : 'text-slate-400'}`}>
                            {contract.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}

          <Card className="bg-blue-900/20 border-blue-700/50">
            <CardContent className="p-6">
              <h3 className="text-blue-300 font-medium mb-3">Creation Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="text-blue-200">
                  <span className="text-blue-300">Name:</span> {selectedContract?.label}
                </div>

                <div className="text-blue-200">
                  <span className="text-blue-300">Contract Name:</span> {selectedContract?.name}
                </div>

                <div className="text-blue-200">
                  <span className="text-blue-300">Estimated Gas:</span> ~0.05 STX
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default CreateWallet;
