import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { connect, disconnect, isConnected, getLocalStorage } from "@stacks/connect";
import {
  type WalletSessionData,
  walletSessionFromConnectResponse,
  walletSessionFromLocalStorage,
} from "@/lib/walletSession";

export type { WalletSessionData, NetworkAddress } from "@/lib/walletSession";

interface WalletContextType {
  isWalletConnected: boolean;
  walletData: WalletSessionData | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletData, setWalletData] = useState<WalletSessionData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      const connected = isConnected();
      if (connected) {
        try {
          const userData = getLocalStorage();
          const transformed = walletSessionFromLocalStorage(userData);
          if (transformed) {
            setWalletData(transformed);
            setIsWalletConnected(true);
          } else {
            setIsWalletConnected(false);
            setWalletData(null);
          }
        } catch (error) {
          console.error("Error getting wallet data:", error);
        }
      } else {
        setIsWalletConnected(false);
        setWalletData(null);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      const response = await connect();
      setIsWalletConnected(true);
      const transformed = walletSessionFromConnectResponse(response);
      if (transformed) {
        setWalletData(transformed);
      } else {
        setWalletData(null);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    disconnect();
    setIsWalletConnected(false);
    setWalletData(null);
  };

  const value: WalletContextType = {
    isWalletConnected,
    walletData,
    isConnecting,
    connectWallet,
    disconnectWallet,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
