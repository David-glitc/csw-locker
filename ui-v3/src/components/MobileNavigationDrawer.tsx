import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Wallet, Send, History, ArrowDown, ArrowUp, X, Lock } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useBtcWallet } from "@/contexts/BtcWalletContext";
import { formatBtcFromSats, formatNumber } from "@/utils/numbers";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import PrimaryButton from "./ui/primary-button";

type NavEntry = { path: string; label: string; icon: typeof Wallet };

interface MobileNavigationDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentWallet: {
    name: string;
    contractId: string;
    balance: string;
    usdValue: string;
    extensions?: string[];
  };
  walletId?: string;
}

const MobileNavigationDrawer = ({ isOpen, onOpenChange, currentWallet, walletId }: MobileNavigationDrawerProps) => {
  const location = useLocation();
  const { walletData } = useWalletConnection();
  const stx = walletData?.preferredStx?.address ?? walletData?.addresses.stx[0]?.address;
  const {
    activeBtcAddress,
    balanceSats,
    usdPrice: btcUsd,
    loadingBalance: btcLoading,
    connectBtcWallet,
    connecting: btcConnecting,
  } = useBtcWallet();

  const isStackingActive = currentWallet.extensions?.some(
    (ext) => ext.toLowerCase().includes("stacking") || ext.toLowerCase().includes("stack")
  );

  const afterCore: NavEntry[] = [
    { path: `/locks/${walletId}`, label: "Locks", icon: Lock },
    { path: `/actions/${walletId}`, label: "Extensions", icon: Wallet },
    { path: `/contract-actions/${walletId}`, label: "Contract Actions", icon: Wallet },
    { path: `/history/${walletId}`, label: "History", icon: History },
    { path: `/contract-details/${walletId}`, label: "Contract Details", icon: Wallet },
  ];

  const core: NavEntry[] = [
    { path: `/dashboard/${walletId}`, label: "Dashboard", icon: Wallet },
    { path: `/send/${walletId}`, label: "Send", icon: Send },
    { path: `/receive/${walletId}`, label: "Receive", icon: ArrowDown },
  ];

  const navItems: NavEntry[] = isStackingActive
    ? [...core, { path: `/stacking/${walletId}`, label: "Stacking", icon: ArrowUp }, ...afterCore]
    : [...core, ...afterCore];

  const btcLine =
    balanceSats != null && activeBtcAddress
      ? `${formatBtcFromSats(balanceSats)} BTC`
      : null;

  const truncateAddr = (addr: string) =>
    addr.length > 16 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
  const btcUsdLine =
    balanceSats != null && btcUsd != null
      ? `$${formatNumber((balanceSats / 1e8) * btcUsd, 2)}`
      : null;

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-slate-800 border-slate-700">
        <DrawerHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-white">Navigation</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-sm text-slate-400">Current Wallet</div>
            <div className="text-white font-medium">{currentWallet.name}</div>
            <div className="text-xs text-slate-400 mt-1 font-mono break-all">{currentWallet.contractId}</div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-sm text-slate-400">STX</div>
                <div className="text-lg font-bold text-white">{currentWallet.balance}</div>
                <div className="text-sm text-green-400">{currentWallet.usdValue}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">BTC</div>
                {btcLoading && activeBtcAddress ? (
                  <div className="text-slate-500 text-sm">…</div>
                ) : btcLine ? (
                  <>
                    <div className="text-lg font-bold text-amber-200">{btcLine}</div>
                    <div className="text-sm text-amber-100/80">{btcUsdLine}</div>
                    {stx && activeBtcAddress && (
                      <div className="text-[10px] font-mono text-slate-400 mt-1 break-all">
                        {truncateAddr(activeBtcAddress)}
                      </div>
                    )}
                  </>
                ) : (
                  <PrimaryButton
                    className="w-full text-xs h-8 mt-1"
                    onClick={() => {
                      void connectBtcWallet();
                    }}
                    disabled={btcConnecting}
                  >
                    {btcConnecting ? "…" : "Connect BTC"}
                  </PrimaryButton>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <DrawerClose key={item.path} asChild>
                  <Button
                    asChild
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start font-medium",
                      isActive
                        ? "bg-purple-600/30 text-purple-200 border border-purple-600/50"
                        : "text-slate-200 hover:bg-slate-700/60 hover:text-white"
                    )}
                  >
                    <Link to={item.path}>
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </Button>
                </DrawerClose>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileNavigationDrawer;
