import { useState, useEffect } from "react";
import { connect, disconnect, isConnected, getLocalStorage, } from "@stacks/connect";
import { useNavigate } from "react-router-dom";
// Define the wallet data interface based on what @stacks/connect actually returns
interface WalletData {
  addresses: {
    stx: Array<{
      address: string;
      publicKey?: string;
    }>;
    btc: Array<{
      address: string;
      publicKey?: string;
    }>;
  };
  profile?: any;
  publicKey?: string;
}

export const useWalletConnection = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const nav = useNavigate()

  useEffect(() => {
    // Check if user is already connected on component mount
    const connected = isConnected();
    if (connected) {
      try {
        const userData = getLocalStorage();
        // Transform the data to match our interface
        if (userData && userData.addresses) {
          const transformedData: WalletData = {
            addresses: {
              stx: Array.isArray(userData.addresses.stx)
                ? userData.addresses.stx
                : [],
              btc: Array.isArray(userData.addresses.btc)
                ? userData.addresses.btc
                : [],
            },
          }
          setWalletData(transformedData)
          setIsWalletConnected(connected);
        }
      } catch (error) {
        console.error("Error getting wallet data:", error)
      }
    }
  }, [isConnected()]);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      const response = await connect();
      setIsWalletConnected(true);

      // Transform the response to match our interface
      if (response && response.addresses) {
        const stx = response.addresses.find((addr) => addr.symbol.toLowerCase() === "stx");
        const btc = response.addresses.find((addr) => addr.symbol.toLowerCase() === "btc");
        const transformedData: WalletData = {
          addresses: {
            stx: [stx],
            btc: [btc],
          },
        };
        setWalletData(transformedData);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  }
  const disconnectWallet = () => {
    disconnect()
    setIsWalletConnected(isConnected())
    setWalletData(null)
    console.log("Wallet disconnected")
    nav('/')
  }

  return {
    isWalletConnected,
    walletData,
    isConnecting,
    connectWallet,
    disconnectWallet
  }
};
