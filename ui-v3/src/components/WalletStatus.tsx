import React from 'react';
import { useGlobalWallet } from '@/hooks/useGlobalWallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, X, Loader2 } from 'lucide-react';

/**
 * Example component showing how to use global wallet state
 * This component will automatically update whenever wallet state changes
 */
export const WalletStatus: React.FC = () => {
  const {
    isWalletConnected,
    isConnecting,
    walletData,
    connectWallet,
    disconnectWallet,
    stxAddress,
    btcAddress,
    hasWallet
  } = useGlobalWallet();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <div className="flex items-center gap-2">
            {isConnecting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isWalletConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isConnecting ? 'Connecting...' : isWalletConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Wallet Data Display */}
        {hasWallet && (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">STX Address:</span>
              <div className="text-xs text-gray-600 font-mono break-all">
                {stxAddress || 'Not available'}
              </div>
            </div>
            <div className="text-sm">
              <span className="font-medium">BTC Address:</span>
              <div className="text-xs text-gray-600 font-mono break-all">
                {btcAddress || 'Not available'}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isWalletConnected ? (
            <Button 
              onClick={connectWallet} 
              disabled={isConnecting}
              className="flex-1"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </Button>
          ) : (
            <Button 
              onClick={disconnectWallet} 
              variant="destructive"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          )}
        </div>

        {/* Debug Info */}
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer">Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify({
              isWalletConnected,
              isConnecting,
              hasWallet,
              stxAddress,
              btcAddress,
              walletDataKeys: walletData ? Object.keys(walletData) : null
            }, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
};

export default WalletStatus;

