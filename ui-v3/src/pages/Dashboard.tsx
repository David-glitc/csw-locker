import WalletLayout from "@/components/WalletLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, TrendingUp, Activity, DollarSign, Settings } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useSelectedWallet } from "@/hooks/useSelectedWallet";
import ActiveExtensions from "@/components/dashboard/ActiveExtensions";
import AssetOverview from "@/components/dashboard/AssetOverview";
import RecentActivity from "@/components/dashboard/RecentActivity";
import SecondaryButton from "@/components/ui/secondary-button";
import { useAccountBalanceService } from "@/hooks/useAccountBalanceService";
import { useSmartWalletContractService } from "@/hooks/useSmartWalletContractService";
import { formatNumber, formatBtcFromSats } from "@/utils/numbers";
import { useAssetPrices } from "@/contexts/AssetPricesContext";
import { useBtcWallet } from "@/contexts/BtcWalletContext";
import { useEffect, useMemo, useState } from "react";
import { TransactionDataService } from "@/services/transactionDataService";
import { Skeleton } from "@/components/ui/skeleton";

const service = new TransactionDataService();

const Dashboard = () => {
  const { walletId } = useParams<{ walletId: `${string}.${string}` }>()
  const { selectedWallet: walletData, isLoading } = useSelectedWallet();
  const { stxBalance, sBtcBalance, loading } = useAccountBalanceService(walletId)
  const { extensions } = useSmartWalletContractService(walletId?.split('.')[0])

  const { stxUsd, btcUsd, loading: pricesLoading } = useAssetPrices();
  const { activeBtcAddress, balanceSats, loadingBalance: btcLoading } = useBtcWallet();

  const [txCount, setTxCount] = useState<number | null>(null);

  useEffect(() => {
    if (!walletId) return;
    service.getTransactionCount(walletId).then(setTxCount);
  }, [walletId]);

  // Aggregate USD value across STX + sBTC + native BTC. Each component is added only
  // when both the balance and the spot price are known — partial sums avoid the
  // "tiny number flickering up to the real total" effect during initial load.
  const totalUsdValue = useMemo(() => {
    let total = 0;
    if (stxBalance?.balance && stxUsd != null) total += Number(stxBalance.balance) * stxUsd;
    if (sBtcBalance?.balance && btcUsd != null) total += Number(sBtcBalance.balance) * btcUsd;
    if (balanceSats != null && btcUsd != null) total += (balanceSats / 1e8) * btcUsd;
    return total;
  }, [stxBalance, sBtcBalance, balanceSats, stxUsd, btcUsd]);

  const balanceSummary = useMemo(() => {
    const parts: string[] = [];
    if (stxBalance?.balance) parts.push(`${formatNumber(Number(stxBalance.balance), 2)} STX`);
    if (sBtcBalance?.balance && Number(sBtcBalance.balance) > 0) {
      parts.push(`${formatNumber(Number(sBtcBalance.balance), 4)} sBTC`);
    }
    if (activeBtcAddress && balanceSats != null && balanceSats > 0) {
      parts.push(`${formatBtcFromSats(balanceSats)} BTC`);
    }
    return parts.length ? parts.join(" · ") : "0.00 STX";
  }, [stxBalance, sBtcBalance, balanceSats, activeBtcAddress]);

  const aggregateLoading = loading || pricesLoading || (!!activeBtcAddress && btcLoading);

  if (!isLoading && !walletData) {
    return (
      <WalletLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Wallet not found</div>
        </div>
      </WalletLayout>
    );
  }

  const isStackingActive = walletData?.extensions?.some(ext =>
    ext.toLowerCase().includes('stacking') || ext.toLowerCase().includes('stack')
  );

  return (
    <WalletLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400">Manage your smart wallet assets and activities</p>
          </div>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Holdings</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white truncate">
                {loading ? (
                  <Skeleton className="h-7 w-32" />
                ) : (
                  <p title={balanceSummary}>{balanceSummary}</p>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">
                {walletId ? `${walletId.slice(0, 4)}...${walletId.slice(walletId.length - 15, walletId.length)}` : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total USD value</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {aggregateLoading && totalUsdValue === 0 ? (
                  <Skeleton className="h-8 w-20" />
                ) : totalUsdValue > 0 ? (
                  <p>${formatNumber(totalUsdValue, 2)}</p>
                ) : (
                  <p>$0.00</p>
                )}
              </div>
              <p className="text-xs text-slate-400">
                STX + sBTC + BTC L1
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Activity</CardTitle>
              <Activity className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {txCount !== null ? txCount : <Skeleton className="h-8 w-8" />}
              </div>
              <p className="text-xs text-slate-400">Total transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SecondaryButton asChild variant={undefined} className="h-20 flex-col">
              <Link to={`/send/${walletId}`}>
                <ArrowUpRight className="h-6 w-6 mb-2" />
                Send
              </Link>
            </SecondaryButton>
            <SecondaryButton asChild variant={undefined} className="h-20 flex-col">
              <Link to={`/receive/${walletId}`}>
                <ArrowUpRight className="h-6 w-6 mb-2 rotate-180" />
                Receive
              </Link>
            </SecondaryButton>
            {isStackingActive && (
              <SecondaryButton asChild variant={undefined} className="h-20 flex-col">
                <Link to={`/stacking/${walletId}`}>
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Stack
                </Link>
              </SecondaryButton>
            )}
            <SecondaryButton asChild variant={undefined} className="h-20 flex-col">
              <Link to={`/history/${walletId}`}>
                <Activity className="h-6 w-6 mb-2" />
                History
              </Link>
            </SecondaryButton>
            <SecondaryButton asChild variant={undefined} className="h-20 flex-col">
              <Link to={`/wallet-details/${walletId}`}>
                <Settings className="h-6 w-6 mb-2" />
                Settings
              </Link>
            </SecondaryButton>
          </CardContent>
        </Card>

        {/* Asset Overview and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AssetOverview smartWalletAddress={walletId} walletAddress={walletData?.address || ''} />
          <RecentActivity walletAddress={walletData?.address || ''} smartWalletAddress={walletId} />
        </div>

        {/* Active Extensions Section */}
        {extensions && extensions.length > 0 && (
          <ActiveExtensions extensions={extensions} />
        )}
      </div>
    </WalletLayout>
  );
};

export default Dashboard;
