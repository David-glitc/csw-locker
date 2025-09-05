// Account Balance Types
export interface StxResponseBalance {
  balance: string;
  estimated_balance: string;
  pending_balance_inbound: string;
  pending_balance_outbound: string;
  total_sent: string;
  total_received: string;
  total_fees_sent: string;
  total_miner_rewards_received: string;
  lock_tx_id: string;
  locked: string;
  lock_height: number;
  burnchain_lock_height: number;
  burnchain_unlock_height: number;
}

export interface FtResponseBalance {
  balance: string;
  total_sent: string;
  total_received: string;
  asset_identifier: string;
}

export interface NftResponseBalance {
  count: string;
  total_sent: string;
  total_received: string;
  asset_identifier: string;
}

export interface AddressUnlockSchedule {
  amount: string;
  block_height: number;
}

export interface AddressTokenOfferingLocked {
  total_locked: string;
  total_unlocked: string;
  unlock_schedule: AddressUnlockSchedule[];
}

export interface AddressBalanceResponse {
  stx: StxResponseBalance;
  fungible_tokens: Record<string, Omit<FtResponseBalance, 'asset_identifier'>>;
  non_fungible_tokens: Record<string, Omit<NftResponseBalance, 'asset_identifier'>>;
  token_offering_locked?: AddressTokenOfferingLocked;
}

export interface FungibleType {
  umicro: string;
  balance: string;
  decimal: number;
  name: string;
  symbol: string;
  icon: string;
  contract: string;
  asset_identifier: string;
}

export interface AccountBalanceType {
  raw: AddressBalanceResponse;
  ft: FtResponseBalance[];
  nft: NftResponseBalance[];
  stx: FungibleType;
  sbtc: FungibleType;
}

// NFT Types
export interface metaDataType {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface nftAssetType {
  asset_identifier: string;
  value: {
    hex: string;
    repr: string;
  };
  block_height: number;
  tx_id: string;
}

export interface nftInfoType {
  count: number | string;
  token_uri: string;
  metadata: metaDataType;
  assets: Promise<nftAssetType[]>;
}

// FT Types
export interface ftInfoType {
  name: string;
  symbol: string;
  decimals: number;
  total_supply: string;
  token_uri: string;
  description: string;
  image_uri: string;
  image_canonical_uri: string;
  tx_id: string;
  sender_address: string;
  symbol_key: string;
  image_thumbnail_uri: string;
  metadata_uri: string;
  metadata_hash: string;
  asset_identifier: string;
}

// Transaction Types
export interface TransactionParams {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: any[];
  fee?: number;
  nonce?: number;
}

export interface Transaction {
  txId: string;
  status: string;
  timestamp: number;
  amount: string;
  recipient: string;
  type: string;
}

export interface Recipient {
  address: string;
  label?: string;
  lastUsed: number;
}

// Smart Wallet Types
export interface SmartWallet {
  contractId: string;
  address: string;
  name?: string;
  balance?: string;
  isActive: boolean;
}

export interface WalletActivity {
  id: string;
  type: string;
  amount: string;
  timestamp: number;
  status: string;
  description: string;
}

// Service Response Types
export type GetFungibleTokenMeta = ftInfoType | null;
export type GetNoneFungibleTokenMeta = nftInfoType | null;

// Rate/Pricing Types
export interface CharismaTokenData {
  tokenId: string;
  symbol: string;
  name: string;
  decimals: number;
  image: string;
  usdPrice: number;
  sbtcRatio: number;
  confidence: number;
  lastUpdated: number;
  totalLiquidity: number;
  isLpToken: boolean;
  intrinsicValue: number;
  marketPrice: number;
}

export interface CharismaResponseMetadata {
  processingTimeMs: number;
  includeDetails: boolean;
  lakehouseData: boolean;
  lastUpdated: string;
}

export interface CharismaApiResponse {
  status: "success" | "error";
  data: CharismaTokenData;
  metadata: CharismaResponseMetadata;
}

// NFT Metadata from Hiro API
export interface NftMetadataResponse {
  token_uri?: string;
  metadata?: {
    sip?: number;
    name?: string;
    description?: string;
    image?: string;
    cached_image?: string;
    cached_thumbnail_image?: string;
    attributes?: Array<{
      trait_type: string;
      display_type?: string;
      value: any;
    }>;
    properties?: Record<string, any>;
    localization?: {
      uri: string;
      default: string;
      locales: string[];
    };
  };
}
