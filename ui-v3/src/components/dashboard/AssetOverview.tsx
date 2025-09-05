
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FtResponseBalance, FungibleType, NftResponseBalance, NftMetadataResponse } from "@/services/types";
import { ArrowUpRight, Coins, Icon, Image, SendIcon, TrendingUp, View } from "lucide-react";
import { formatNumber } from "@/utils/numbers";
import { CharismaTokenData } from "@/services/types";
import { useAccountBalanceService } from "@/hooks/useAccountBalanceService";
import useGetRates from "@/hooks/useGetRates";
import { Button } from "../ui/button";
import SecondaryButton from "../ui/secondary-button";
import { Link } from "react-router-dom";

const AssetOverview = ({ smartWalletAddress, walletAddress }: { smartWalletAddress: string, walletAddress: string }) => {
	// Use the hooks directly in the component
	const { stxBalance, sBtcBalance, nftBalance, ftBalance, nftMetadata, ftMetadata } = useAccountBalanceService(smartWalletAddress);
	const { rates: stxRates } = useGetRates(".stx");
	const { rates: sbtcRates } = useGetRates("SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token");
	console.log({ sbtcRates })
	return (
		<Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<CardTitle className="text-lg font-medium text-white flex items-center">
					<TrendingUp className="mr-2 h-5 w-5 text-purple-400" />
					Asset Overview
				</CardTitle>
				<div className="text-right">
					<div className="text-sm text-slate-400">Total Value</div>
					<div className="text-lg font-bold text-green-400">
						{/* ${totalUsdValue.toLocaleString()} */}
					</div>
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<div className="space-y-3">
					<div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
						<div className="flex items-center space-x-3">
							<div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center">
								{stxRates?.image ? (
									<img src={stxRates?.image} alt="sBtc" loading="lazy" className="h-full w-full rounded-full" />
								) : (
									<Coins className="h-4 w-4 text-purple-400" />
								)}
							</div>
							<div>
								<div className="text-white font-medium">{stxBalance?.symbol || "STX"}</div>
								<div className="text-slate-400 text-sm">
									{!isNaN(Number(stxBalance?.balance)) && !isNaN(Number(stxBalance?.decimal))
										? Number(formatNumber(Number(stxBalance?.balance), stxBalance?.decimal)).toFixed(4)
										: "0.0000"} {stxBalance?.symbol || stxRates?.symbol || "STX"}
								</div>
							</div>
						</div>
						<div className="text-right">
							<div className="text-white text-sm font-medium">
								{stxBalance && stxRates ? <p>${formatNumber(Number(stxBalance?.balance) * Number(stxRates?.usdPrice), 2)}</p> : <p>$0.00</p>}
							</div>
						</div>
					</div>
				</div>

				<div className="space-y-3">
					<div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
						<div className="flex items-center space-x-3">
							<div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center">
								{sbtcRates?.image ? (
									<img src={sbtcRates?.image} alt="sBTC" loading="eager" className="h-full w-full rounded-full" />
								) : (
									<Coins className="h-4 w-4 text-purple-400" />
								)}
							</div>
							<div>
								<div className="text-white font-medium">{sBtcBalance?.symbol || sbtcRates?.symbol || "sBTC"}</div>
								<div className="text-slate-400 text-sm">
									{!isNaN(Number(sBtcBalance?.balance)) && !isNaN(Number(sBtcBalance?.decimal))
										? Number(formatNumber(Number(sBtcBalance?.balance), sBtcBalance?.decimal)).toFixed(4)
										: "0.0000"} {sBtcBalance?.symbol || sbtcRates?.symbol || "sBTC"}
								</div>
							</div>
						</div>
						<div className="text-right">
							<div className="text-white text-sm font-medium">
								{sBtcBalance && sbtcRates ? <p>${formatNumber(Number(sBtcBalance?.balance) * Number(sbtcRates?.usdPrice), 2)}</p> : <p>$0.00</p>}
							</div>
						</div>
					</div>
				</div>

				<div className="space-y-3">
					<div
						className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
					>
						<div className="flex items-center space-x-3">
							<div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center">
								<Coins className="h-4 w-4 text-purple-400" />
							</div>
							<div>
								<div className="text-white font-medium">Assets</div>
								<div className="text-slate-400 text-sm">{ftBalance?.length}</div>
							</div>
						</div>
						<div className="text-right">
							<SecondaryButton asChild variant={undefined}>
								<Link to={`/send/${smartWalletAddress}`}>
									<ArrowUpRight className="mr-2 h-4 w-4" />
									Send Assets
								</Link>
							</SecondaryButton>
						</div>
					</div>
				</div>

				<div className="space-y-3">
					<div
						className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
					>
						<div className="flex items-center space-x-3">
							<div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center">
								<Image className="h-4 w-4 text-purple-400" />
							</div>
							<div>
								<div className="text-white font-medium">Collectibles</div>
								<div className="text-slate-400 text-sm">{nftBalance?.length}</div>
							</div>
						</div>
						<div className="text-right">
							<Button variant="secondary" className="flex items-center justify-center text-slate-200 bg-slate-800/50">
								<View className="mr-2 h-4 w-4" /> View All
							</Button>
						</div>
					</div>
				</div>

			</CardContent>
		</Card>
	);
};

export default AssetOverview;
