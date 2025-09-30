import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MenuIcon,
    Wallet,
    User,
    Globe,
    Settings,
    ChevronDown,
    Menu,
    LogOut
} from "lucide-react";
import { Link } from "react-router-dom";
import { useUserWalletConnection } from "@/hooks/useWalletConnection";
import GreenButton from "./ui/green-button";
import SecondaryButton from "./ui/secondary-button";
import PrimaryButton from "./ui/primary-button";
import UnifiedMobileDrawer from "./UnifiedMobileDrawer";
import { DOCS_URL } from "@/lib/const";
import { useState } from "react";

export type HeaderVariant = "default" | "landing" | "wallet-selector" | "wallet-management";

interface BaseHeaderProps {
    variant: HeaderVariant;
}

interface DefaultHeaderProps extends BaseHeaderProps {
    variant: "default";
}

interface LandingHeaderProps extends BaseHeaderProps {
    variant: "landing";
}

interface WalletSelectorHeaderProps extends BaseHeaderProps {
    variant: "wallet-selector";
    totalBalance: string;
    usdValue: string;
}

interface WalletManagementHeaderProps extends BaseHeaderProps {
    variant: "wallet-management";
    currentWallet: {
        name: string;
        contractId: string;
        balance: string;
        usdValue: string;
    };
    selectedNetwork: "mainnet" | "testnet";
}

type UnifiedHeaderProps = DefaultHeaderProps | LandingHeaderProps | WalletSelectorHeaderProps | WalletManagementHeaderProps;

const UnifiedHeader = (props: UnifiedHeaderProps) => {
    const { variant } = props;
    const { isWalletConnected, connectWallet, disconnectWallet, isConnecting, userData } = useUserWalletConnection();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleWalletAction = () => {
        if (isWalletConnected) {
            disconnectWallet();
        } else {
            connectWallet();
        }
    };

    const getButtonText = () => {
        if (isConnecting) return "Connecting...";
        if (isWalletConnected) {
            const address = userData?.addresses?.stx?.[0]?.address;
            return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connected";
        }
        return "Connect Wallet";
    };

    const scrollToFeatures = () => {
        const featuresSection = document.getElementById('features-section');
        if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const getConnectedWalletAddress = () => {
        if (userData?.addresses?.stx && userData.addresses.stx.length > 0) {
            const address = userData.addresses.stx[0].address;
            return `${address.slice(0, 6)}...${address.slice(-4)}`;
        }
        return "Not Connected";
    };

    const renderLogo = () => (
        <Link to="/" className="flex items-center space-x-2">
            <Wallet className="h-6 w-6 md:h-8 md:w-8 text-purple-400" />
            <span className="text-lg md:text-xl font-bold text-white">Smart Wallet</span>
        </Link>
    );

    const renderLandingNavigation = () => (
        <div className="hidden md:flex items-center space-x-6">
            <button
                onClick={scrollToFeatures}
                className="text-slate-300 hover:text-white transition-colors"
            >
                Features
            </button>
            <Link to="/products" className="text-slate-300 hover:text-white transition-colors">
                Products
            </Link>
            <Link to="/about" className="text-slate-300 hover:text-white transition-colors">
                About
            </Link>
        </div>
    );

    const renderLandingActions = () => (
        <>
            <div className="hidden md:flex items-center space-x-4">
                <SecondaryButton asChild>
                    <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                        Docs
                    </a>
                </SecondaryButton>
                {isWalletConnected ? (
                    <div className="flex items-center space-x-2">
                        <GreenButton asChild>
                            <Link to="/wallet-selector">My Wallets</Link>
                        </GreenButton>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SecondaryButton size="sm">
                                    <User className="mr-2 h-4 w-4" />
                                    <span className="hidden lg:inline">{getConnectedWalletAddress()}</span>
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </SecondaryButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 text-white">
                                <DropdownMenuItem className="hover:bg-slate-700 focus:bg-slate-700" onClick={disconnectWallet}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ) : (
                    <PrimaryButton onClick={handleWalletAction} disabled={isConnecting}>
                        {getButtonText()}
                    </PrimaryButton>
                )}
            </div>
            <div className="flex md:hidden items-center space-x-4">
                <SecondaryButton onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <MenuIcon className="h-4 w-4" />
                </SecondaryButton>
            </div>
        </>
    );

    const renderBalanceCard = (balance: string, usdValue: string, showUsd = true) => (
        <div className="hidden sm:flex items-center bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 h-9">
            <div className="flex items-center space-x-3">
                <div className="text-right">
                    <div className="text-xs text-slate-400 leading-none">
                        {variant === "wallet-selector" ? "Total" : "Balance"}
                    </div>
                    <div className="text-sm font-semibold text-white leading-none mt-0.5">{balance}</div>
                </div>
                {showUsd && (
                    <div className="text-right hidden lg:block">
                        <div className="text-xs text-slate-400 leading-none">USD</div>
                        <div className="text-sm font-semibold text-green-400 leading-none mt-0.5">{usdValue}</div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderWalletManagementActions = (props: WalletManagementHeaderProps) => (
        <>
            {/* Balance Card */}
            {renderBalanceCard(props.currentWallet.balance, props.currentWallet.usdValue)}

            {/* Mobile Navigation Trigger */}
            <div className="lg:hidden">
                <SecondaryButton size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <Menu className="h-4 w-4" />
                </SecondaryButton>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center space-x-2">
                {/* Network */}
                <SecondaryButton size="sm" disabled>
                    <Globe className="mr-2 h-4 w-4" />
                    <span className="hidden lg:inline">{props.selectedNetwork}</span>
                </SecondaryButton>

                {/* Connected Wallet Profile Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SecondaryButton size="sm">
                            <User className="mr-2 h-4 w-4" />
                            <span className="hidden lg:inline">{getConnectedWalletAddress()}</span>
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </SecondaryButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 text-white">
                        <DropdownMenuItem className="hover:bg-slate-700 focus:bg-slate-700" asChild>
                            <Link to="/wallet-selector">
                                <Wallet className="mr-2 h-4 w-4" />
                                Switch Wallet
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-slate-700 focus:bg-slate-700" asChild>
                            <Link to={`/wallet-details/${props.currentWallet.contractId}`}>
                                <Settings className="mr-2 h-4 w-4" />
                                Wallet Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem className="hover:bg-slate-700 focus:bg-slate-700" onClick={disconnectWallet}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    );



    return (
        <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4">
                <nav className="flex items-center justify-between">
                    {/* Left Side */}
                    <div className="flex items-center space-x-4">
                        {renderLogo()}

                        {/* Current Wallet Name - Only for wallet management */}
                        {variant === "wallet-management" && (
                            <div className="hidden lg:block">
                                <div className="text-sm text-slate-400">Current Wallet</div>
                                <div className="text-white font-medium">
                                    {(props as WalletManagementHeaderProps).currentWallet.name}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Center Navigation - Only for landing */}
                    {variant === "landing" && renderLandingNavigation()}

                    {/* Right Side */}
                    <div className="flex items-center space-x-2 md:space-x-4">
                        {(variant === "landing" || variant === "default") && renderLandingActions()}

                        {variant === "wallet-selector" && (
                            <>
                                {renderBalanceCard(
                                    (props as WalletSelectorHeaderProps).totalBalance,
                                    (props as WalletSelectorHeaderProps).usdValue,
                                )}

                                {/* Mobile Navigation Trigger */}
                                <div className="lg:hidden">
                                    <SecondaryButton size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                                        <Menu className="h-4 w-4" />
                                    </SecondaryButton>
                                </div>
                            </>
                        )}

                        {variant === "wallet-management" &&
                            renderWalletManagementActions(props as WalletManagementHeaderProps)
                        }
                    </div>
                </nav>
            </div>
            <UnifiedMobileDrawer
                isOpen={mobileMenuOpen}
                onOpenChange={setMobileMenuOpen}
                variant={variant}
                totalBalance={variant === "wallet-selector" ? (props as WalletSelectorHeaderProps).totalBalance : undefined}
                usdValue={variant === "wallet-selector" ? (props as WalletSelectorHeaderProps).usdValue : undefined}
                currentSmartWallet={variant === "wallet-management" ? (props as WalletManagementHeaderProps).currentWallet : undefined}
                isWalletConnected={isWalletConnected}
                onWalletConnect={connectWallet}
                onWalletDisconnect={disconnectWallet}
                isConnecting={isConnecting}
                connectButtonText="Connect Wallet"
                userData={userData}
            />
        </header>
    );
};

export default UnifiedHeader;