import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Wallet,
  X,
  FileText,
  Info,
  Package,
  Star,
  ExternalLink
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import GreenButton from "../ui/green-button";
import SecondaryButton from "../ui/secondary-button";
import PrimaryButton from "../ui/primary-button";
import { DOCS_URL } from "@/lib/const";

interface MobileMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileMenu = ({
  isOpen,
  onOpenChange,
}: MobileMenuProps) => {
  const location = useLocation();
  const { isWalletConnected, connectWallet, disconnectWallet, isConnecting, walletData } = useWalletConnection();

  const handleWalletAction = () => {
    if (isWalletConnected) {
      disconnectWallet();
    } else {
      connectWallet();
    }
    onOpenChange(false);
  };

  const getButtonText = () => {
    if (isConnecting) return "Connecting...";
    if (isWalletConnected) {
      const address = walletData?.addresses?.stx?.[0]?.address;
      return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connected";
    }
    return "Connect Wallet";
  };

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
    onOpenChange(false);
  };

  const navItems = [
    {
      label: "Features",
      icon: Star,
      action: scrollToFeatures,
      isButton: true
    },
    {
      path: "/products",
      label: "Products",
      icon: Package
    },
    {
      path: "/about",
      label: "About",
      icon: Info
    },
    {
      href: DOCS_URL,
      label: "Docs",
      icon: FileText,
      external: true
    },
  ];

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-slate-800 border-slate-700">
        <DrawerHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-white flex items-center">
              <Wallet className="h-5 w-5 text-purple-400 mr-2" />
              Smart Wallet
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-4">
          {/* Wallet Connection Status */}
          {isWalletConnected && walletData?.addresses?.stx?.[0]?.address && (
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-sm text-slate-400">Connected Wallet</div>
              <div className="text-white font-medium">Wallet Connected</div>
              <div className="text-xs text-slate-400 mt-1 font-mono break-all">
                {`${walletData.addresses.stx[0].address.slice(0, 4)}...${walletData.addresses.stx[0].address.slice(-20)}`}
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path ? location.pathname === item.path : false;

              if (item.isButton) {
                return (
                  <Button
                    key={item.label}
                    onClick={item.action}
                    variant="ghost"
                    className="w-full justify-start font-medium text-slate-200 hover:bg-slate-700/60 hover:text-white"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              }

              if (item.external) {
                return (
                  <Button
                    key={item.label}
                    asChild
                    variant="ghost"
                    className="w-full justify-start font-medium text-slate-200 hover:bg-slate-700/60 hover:text-white"
                  >
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                      <ExternalLink className="ml-auto h-3 w-3 text-slate-400" />
                    </a>
                  </Button>
                );
              }

              return (
                <DrawerClose key={item.path} asChild>
                  <Button
                    asChild
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start font-medium ${isActive
                      ? "bg-purple-600/30 text-purple-200 border border-purple-600/50"
                      : "text-slate-200 hover:bg-slate-700/60 hover:text-white"
                      }`}
                  >
                    <Link to={item.path!}>
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </Button>
                </DrawerClose>
              );
            })}
          </div>

          {/* Wallet Actions */}
          <div className="pt-4 border-t border-slate-700">
            {isWalletConnected ? (
              <div className="space-y-3">
                <GreenButton asChild className="w-full">
                  <Link to="/wallet-selector" onClick={() => onOpenChange(false)}>
                    <Wallet className="mr-2 h-4 w-4" />
                    My Wallets
                  </Link>
                </GreenButton>
                <SecondaryButton
                  onClick={handleWalletAction}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {getButtonText()}
                </SecondaryButton>
              </div>
            ) : (
              <PrimaryButton
                onClick={handleWalletAction}
                disabled={isConnecting}
                className="w-full"
              >
                {getButtonText()}
              </PrimaryButton>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileMenu;
