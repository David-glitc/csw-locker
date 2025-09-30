import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Activity, ExternalLink, Clock, FileCode, RefreshCw, Send, Wallet, History } from "lucide-react";
import { TxInfo } from "@/services/interfaces";
import { formatAmount } from "@/lib/txFormatUtils";
import { getClientConfig } from "@/utils/chain-config";

interface TransactionItemProps {
    tx: TxInfo;
    stxUsd?: number | null;
    walletId?: string;
    assetDecimals?: Record<string, number>;
    showFullDetails?: boolean;
}

const TransactionItem = ({
    tx,
    stxUsd,
    walletId,
    assetDecimals = {},
    showFullDetails = false
}: TransactionItemProps) => {
    const config = walletId ? getClientConfig(walletId) : null;

    const getActivityIcon = (action: string, tx_type?: string) => {
        if (action === "sent") return Send;
        if (action === "receive") return Send;
        if (action === "pending") return Clock;
        if (action === "contract_call" || action === "smart_contract" || tx_type === "contract_call" || tx_type === "smart_contract") return FileCode;
        if (action === "refresh") return RefreshCw;
        if (action === "stacking") return TrendingUp;
        return History;
    };

    const getActivityColor = (action: string) => {
        switch (action) {
            case 'sent':
                return 'text-red-400';
            case 'receive':
                return 'text-green-400';
            case 'stacking':
                return 'text-purple-400';
            default:
                return 'text-slate-400';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
            case 'confirmed':
                return 'text-green-400';
            case 'pending':
                return 'text-yellow-400';
            case 'failed':
                return 'text-red-400';
            default:
                return 'text-slate-400';
        }
    };

    const getTxLabel = (tx: TxInfo, asset: string) => {
        if (tx.action === 'sent') return `Send ${asset}`;
        if (tx.action === 'receive') return `Receive ${asset}`;
        if (tx.action === 'contract_call') return `Contract Call`;
        if (tx.action === 'contract_deploy') return `Contract Deploy`;
        return tx.action?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Other';
    };

    const getDecimalPlaces = (symbol: string) => {
        return assetDecimals[symbol] ?? (symbol === 'SBTC' ? 8 : 6);
    };

    const Icon = getActivityIcon(tx.action, tx.tx_type);
    const activityColor = getActivityColor(tx.action);
    const statusColor = getStatusColor(tx.tx_status);
    const asset = tx.assets[0]?.symbol || 'STX';
    const amount = tx.assets[0]?.amount || '0';
    const amountPrefix = tx.action === "sent" ? '-' : tx.action === "receive" ? '+' : ''
    const isSmartContractCall = tx.tx_type === 'contract_call' || tx.tx_type === 'smart_contract';
    const isContractDeploy = tx.action === 'contract_deploy';
    const hideAmount = (isSmartContractCall && (!amount || amount === '0'));

    return (
        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center space-x-3">
                <div className={`${showFullDetails ? 'w-10 h-10' : 'w-8 h-8'} rounded-full ${showFullDetails ? 'bg-slate-600/20' : 'bg-slate-600/50'} flex items-center justify-center`}>
                    <Icon className={`${showFullDetails ? 'h-5 w-5' : 'h-4 w-4'} ${tx.action === 'receive' ? 'text-green-400 rotate-180' : activityColor}`} />
                </div>
                <div>
                    <div className="text-white font-medium capitalize">
                        <>
                            {getTxLabel(tx, asset)}
                        </>
                    </div>

                    {showFullDetails ? (
                        <>
                            <div className="text-slate-400 text-sm whitespace-pre-line">
                                {tx.action === 'sent'
                                    ? <>
                                        <span className="hidden md:block text-green-400">To: {tx.sender}</span>
                                        <span className="block md:hidden text-green-400">To: {`${tx.sender.slice(0, 4)}...${tx.sender.slice(-4)}`}</span>
                                    </>
                                    : <>
                                        <span className="hidden md:block text-red-400">From: {tx.sender}</span>
                                        <span className="block md:hidden text-red-400">From: {`${tx.sender.slice(0, 4)}...${tx.sender.slice(-4)}`}</span>
                                    </>}
                                {' • '}{tx.stamp}
                            </div>
                            <div className="text-slate-500 text-xs flex items-center gap-2 hidden md:flex">
                                TX: {tx.tx}
                                {config && (
                                    <Link to={`${config.explorer(`txid/${tx.tx}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-white">
                                        <ExternalLink className="w-4 h-4 text-slate-400 hover:text-white" />
                                    </Link>
                                )}
                            </div>
                            <div className="text-slate-500 text-xs flex items-center gap-2 flex md:hidden">
                                TX: {`${tx.tx.slice(0, 4)}...${tx.tx.slice(-4)}`}
                                {config && (
                                    <Link to={`${config.explorer(`txid/${tx.tx}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-white">
                                        <ExternalLink className="w-4 h-4 text-slate-400 hover:text-white" />
                                    </Link>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-slate-400 text-sm">{tx.stamp}</div>
                    )}
                </div>
            </div>
            <div className="text-right">
                {!hideAmount && (tx.action === "sent" || tx.action === "receive" || (tx.tx_type !== "contract_call" && tx.tx_type !== "smart_contract")) && (
                    <div className={`font-medium ${activityColor}`}>
                        {amountPrefix}{formatAmount(amount, getDecimalPlaces(asset))} {asset}
                        {asset === 'STX' && stxUsd && (
                            <span className="text-xs text-slate-400 ml-2">
                                (${((Number(amount) / Math.pow(10, getDecimalPlaces(asset))) * stxUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD)
                            </span>
                        )}
                    </div>
                )}
                <div className={`text-sm capitalize ${statusColor}`}>
                    {tx.tx_status}
                </div>
            </div>
        </div>
    );
};

export default TransactionItem;