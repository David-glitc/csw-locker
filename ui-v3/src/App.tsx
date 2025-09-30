
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import WalletSelector from "./pages/WalletSelector";
import CreateWallet from "./pages/CreateWallet";
import WalletDetails from "./pages/WalletDetails";
import SendAssets from "./pages/SendAssets";
import ReceiveAssets from "./pages/ReceiveAssets";
import Stacking from "./pages/Stacking";
import GenericActions from "./pages/GenericActions";
import ContractActions from "./pages/ContractActions";
import ActionHistory from "./pages/ActionHistory";
import ContractDetails from "./pages/ContractDetails";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import Products from "./pages/Products";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <WalletProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/products" element={<Products />} />
            <Route path="/wallet-selector" element={<WalletSelector />} />
            <Route path="/create-wallet" element={<CreateWallet />} />
            <Route path="/wallet-details/:walletId" element={<WalletDetails />} />
            <Route path="/dashboard/:walletId" element={<Dashboard />} />
            <Route path="/send/:walletId?" element={<SendAssets />} />
            <Route path="/receive/:walletId?" element={<ReceiveAssets />} />
            <Route path="/stacking/:walletId?" element={<Stacking />} />
            <Route path="/history/:walletId?" element={<ActionHistory />} />
            <Route path="/actions/:walletId?" element={<GenericActions />} />
            <Route path="/contract-actions/:walletId?" element={<ContractActions />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </WalletProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
