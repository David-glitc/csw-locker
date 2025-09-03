import axios from "axios";
import {
  AddressBalanceResponse,
  StxResponseBalance,
  FtResponseBalance,
  NftResponseBalance,
  FungibleType,
  AccountBalanceType,
  ftInfoType,
  nftInfoType,
  metaDataType,
  nftAssetType,
  GetFungibleTokenMeta,
  GetNoneFungibleTokenMeta,
  NftMetadataResponse
} from "./types";

/**
 * Configuration interface for API requests
 * @interface ApiConfig
 */
interface ApiConfig {
  baseUrl: string;                    // Base URL for the API (e.g., https://api.hiro.so)
  timeout?: number;                   // Request timeout in milliseconds (default: 10000)
  headers?: Record<string, string>;   // Additional headers for requests
}

/**
 * Service class for fetching and managing account balance data from Stacks blockchain
 * Handles STX, FT (Fungible Token), and NFT (Non-Fungible Token) balances
 * Includes metadata fetching for enhanced token information
 */
export class AccountBalanceService {
  // Default configuration for API requests
  private defaultConfig: ApiConfig = {
    baseUrl: "https://api.hiro.so",   // Default to Hiro API
    timeout: 10000,                   // 10 second timeout
    headers: {
      "Content-Type": "application/json",
    },
  };

  /**
   * Constructor to initialize the service with custom configuration
   * @param config - Optional configuration to override defaults
   */
  constructor(config?: Partial<ApiConfig>) {
    if (config) {
      this.defaultConfig = { ...this.defaultConfig, ...config };
    }
  }

  /**
   * Generic function to fetch balance data from the Stacks API
   * @param address - The wallet address to fetch balances for
   * @param config - Optional configuration override
   * @returns Promise resolving to balance data or null if failed
   */
  private async getBalance<T>(address: string, config?: Partial<ApiConfig>): Promise<T | null> {
    const apiConfig = { ...this.defaultConfig, ...config };

    try {
      const response = await axios.get(
        `${apiConfig.baseUrl}/extended/v1/address/${address}/balances`,
        {
          timeout: apiConfig.timeout,
          headers: apiConfig.headers,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch balance data:", error);
      return null;
    }
  }

  /**
   * Fetches STX (Stacks) balance for a given address
   * @param address - The wallet address to fetch STX balance for
   * @param config - Optional configuration override
   * @returns Promise resolving to STX balance data or null if failed
   */
  async getStxBalance(address: string, config?: Partial<ApiConfig>): Promise<StxResponseBalance | null> {
    const balanceData = await this.getBalance<AddressBalanceResponse>(address, config);
    return balanceData?.stx || null;
  }

  /**
   * Fetches all Fungible Token (FT) balances for a given address
   * @param address - The wallet address to fetch FT balances for
   * @param config - Optional configuration override
   * @returns Promise resolving to array of FT balance data
   */
  async getFtBalance(address: string, config?: Partial<ApiConfig>): Promise<FtResponseBalance[]> {
    const balanceData = await this.getBalance<AddressBalanceResponse>(address, config);

    // Return empty array if no fungible tokens found
    if (!balanceData?.fungible_tokens) {
      return [];
    }

    // Transform the fungible_tokens object into an array with asset_identifier
    return Object.keys(balanceData.fungible_tokens).map((key) => ({
      ...balanceData.fungible_tokens[key],
      asset_identifier: key, // Add the asset identifier for easier access
    }));
  }

  /**
   * Fetches all Non-Fungible Token (NFT) balances for a given address
   * @param address - The wallet address to fetch NFT balances for
   * @param config - Optional configuration override
   * @returns Promise resolving to array of NFT balance data
   */
  async getNftBalance(address: string, config?: Partial<ApiConfig>): Promise<NftResponseBalance[]> {
    const balanceData = await this.getBalance<AddressBalanceResponse>(address, config);

    // Return empty array if no non-fungible tokens found
    if (!balanceData?.non_fungible_tokens) {
      return [];
    }

    // Transform the non_fungible_tokens object into an array with asset_identifier
    return Object.keys(balanceData.non_fungible_tokens).map((key) => ({
      ...balanceData.non_fungible_tokens[key],
      asset_identifier: key, // Add the asset identifier for easier access
    }));
  }

  /**
 * Get complete account balances (STX, FT, NFT)
 */
  async getAccountBalances(address: string, config?: Partial<ApiConfig>): Promise<AccountBalanceType | null> {
    if (!address) return null;

    const balanceData = await this.getBalance<AddressBalanceResponse>(address, config);

    if (!balanceData) {
      return null;
    }

    const ftBalance = await this.getFtBalance(address, config);
    const nftBalance = await this.getNftBalance(address, config);
    const stxBalance = this.constructStxBalance(balanceData.stx);

    // Find sBTC balance if it exists
    const sbtcToken = ftBalance.find((token) => token.asset_identifier === "SN69P7RZRKK8ERQCCABHT2JWKB2S4DHH9H74231T.sbtc-token::sbtc-token");
    console.log('sbtcToken', { sbtcToken, ftBalance })
    const sBtcBalance = sbtcToken ? await this.constructFtBalance(address, sbtcToken, config) : null;
    
    return {
      raw: balanceData,
      ft: ftBalance,
      nft: nftBalance,
      stx: stxBalance,
      sbtc: sBtcBalance,
    };
  }

  /**
   * Get complete account balances with metadata (STX, FT, NFT)
   */
  async getAccountBalancesWithMetadata(address: string, config?: Partial<ApiConfig>): Promise<{
    balances: AccountBalanceType | null;
    nftMetadata: Record<string, NftMetadataResponse>;
    ftMetadata: Record<string, any>;
  }> {
    if (!address) {
      return {
        balances: null,
        nftMetadata: {},
        ftMetadata: {}
      };
    }

    // Get balances first
    const balances = await this.getAccountBalances(address, config);

    if (!balances) {
      return {
        balances: null,
        nftMetadata: {},
        ftMetadata: {}
      };
    }

    // Fetch metadata in parallel
    const [nftMetadata, ftMetadata] = await Promise.all([
      this.fetchAllNftMetadata(balances.nft, address, config),
      this.fetchAllFtMetadata(balances.ft, address, config)
    ]);

    return {
      balances,
      nftMetadata,
      ftMetadata
    };
  }

  /**
   * Format decimal values
   */
  private formatDecimals(value: number | string, decimals: number, isUmicro: boolean): string {
    if (isUmicro) {
      return (Number(value) * 10 ** decimals).toFixed(0);
    } else {
      return (Number(value) / 10 ** decimals).toFixed(4);
    }
  }

  /**
   * Construct STX balance object
   */
  private constructStxBalance(stxRes: StxResponseBalance): FungibleType {
    return {
      umicro: stxRes.balance,
      balance: this.formatDecimals(stxRes.balance, 6, false),
      decimal: 6,
      name: "Stacks",
      symbol: "STX",
      icon: "/icons/stx.png",
      contract: ".stacks",
      asset_identifier: ".stacks::stx",
    };
  }

  /**
   * Get FT metadata from Hiro API
   */
  private async handleGetFtMeta(
    address: string,
    assetIdentifier: string,
    config?: Partial<ApiConfig>
  ): Promise<any | null> {
    const apiConfig = { ...this.defaultConfig, ...config };

    try {
      const response = await axios.get(
        `${apiConfig.baseUrl}/metadata/v1/ft/${assetIdentifier?.split("::")[0]}`,
        {
          timeout: apiConfig.timeout,
          headers: apiConfig.headers,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch FT metadata:", error);
      return null;
    }
  }

  /**
   * Fetch metadata for all NFT collections
   */
  private async fetchAllNftMetadata(
    nfts: NftResponseBalance[],
    address: string,
    config?: Partial<ApiConfig>
  ): Promise<Record<string, NftMetadataResponse>> {
    if (!nfts || nfts.length === 0) return {};

    const apiConfig = { ...this.defaultConfig, ...config };
    const metadataPromises = nfts.map(async (nft) => {
      // Safety check for asset_identifier
      if (!nft.asset_identifier) {
        console.warn('NFT token missing asset_identifier:', nft);
        return { [nft.asset_identifier]: null };
      }

      const principal = nft.asset_identifier?.split("::")[0];
      try {
        const response = await axios.get(
          `${apiConfig.baseUrl}/metadata/v1/nft/${principal}/1`,
          {
            timeout: apiConfig.timeout,
            headers: apiConfig.headers,
          }
        );
        return { [nft.asset_identifier]: response.data };
      } catch (error) {
        console.error(`Failed to fetch NFT metadata for ${nft.asset_identifier}:`, error);
        return { [nft.asset_identifier]: null };
      }
    });

    const results = await Promise.all(metadataPromises);
    return results.reduce((acc, result) => ({ ...acc, ...result }), {});
  }

  /**
   * Fetch metadata for all FT tokens
   */
  private async fetchAllFtMetadata(
    fts: FtResponseBalance[],
    address: string,
    config?: Partial<ApiConfig>
  ): Promise<Record<string, any>> {
    if (!fts || fts.length === 0) return {};

    const apiConfig = { ...this.defaultConfig, ...config };
    const metadataPromises = fts.map(async (ft) => {
      // Safety check for asset_identifier
      if (!ft.asset_identifier) {
        console.warn('FT token missing asset_identifier:', ft);
        return { [ft.asset_identifier]: null };
      }

      try {
        const principal = ft.asset_identifier?.split("::")[0];
        const response = await axios.get(
          `${apiConfig.baseUrl}/metadata/v1/ft/${principal}`,
          {
            timeout: apiConfig.timeout,
            headers: apiConfig.headers,
          }
        );
        return { [ft.asset_identifier]: response.data };
      } catch (error) {
        console.error(`Failed to fetch FT metadata for ${ft.asset_identifier}:`, error);
        return { [ft.asset_identifier]: null };
      }
    });

    const results = await Promise.all(metadataPromises);
    return results.reduce((acc, result) => ({ ...acc, ...result }), {});
  }

  /**
   * Get NFT metadata from Hiro API
   */
  private async handleGetNftMeta(
    principal: string,
    tokenId: string,
    config?: Partial<ApiConfig>
  ): Promise<NftMetadataResponse | null> {
    const apiConfig = { ...this.defaultConfig, ...config };

    try {
      const response = await axios.get(
        `${apiConfig.baseUrl}/metadata/v1/nft/${principal}/${tokenId}`,
        {
          timeout: apiConfig.timeout,
          headers: apiConfig.headers,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch NFT metadata:", error);
      return null;
    }
  }

  /**
   * Construct FT balance object
   */
  private async constructFtBalance(
    address: string,
    ftRes: FtResponseBalance,
    config?: Partial<ApiConfig>
  ): Promise<FungibleType | null> {
    console.log('tokenMeta', { address, ftRes, config })
    const tokenMeta = await this.handleGetFtMeta(address, ftRes.asset_identifier, config);
    if (!tokenMeta) {
      // Fallback to basic info if metadata fetch fails
      return {
        umicro: ftRes.balance,
        balance: this.formatDecimals(ftRes.balance, 6, false),
        decimal: 6,
        name: ftRes.asset_identifier?.split("::")[1],
        symbol: ftRes.asset_identifier?.split("::")[1],
        icon: "",
        contract: ftRes.asset_identifier?.split("::")[0],
        asset_identifier: ftRes.asset_identifier,
      };
    }

    return {
      umicro: ftRes.balance,
      balance: this.formatDecimals(ftRes.balance, tokenMeta.decimals || 6, false),
      decimal: tokenMeta.decimals || 6,
      name: tokenMeta.name || ftRes.asset_identifier?.split("::")[1],
      symbol: tokenMeta.symbol || ftRes.asset_identifier?.split("::")[1],
      icon: tokenMeta.image_thumbnail_uri || tokenMeta.image_uri || "",
      contract: tokenMeta.asset_identifier?.split("::")[0],
      asset_identifier: tokenMeta.asset_identifier,
    };
  }

  /**
   * Construct NFT balance object
   */
  private async constructNftBalance(
    address: string,
    nftRes: NftResponseBalance,
    config?: Partial<ApiConfig>
  ): Promise<nftInfoType | null> {
    const apiConfig = { ...this.defaultConfig, ...config };

    // Extract principal (contract address) from asset_identifier
    const principal = nftRes.asset_identifier?.split("::")[0];

    // For now, we'll use token_id "1" as a default, but this should be dynamic
    // based on the actual NFT holdings
    const nftMeta = await this.handleGetNftMeta(principal, "1", config);
    console.log({ nftMeta })
    if (!nftMeta) {
      return null;
    }

    try {
      const assetsResponse = await axios.get(
        `${apiConfig.baseUrl}/extended/v1/tokens/nft/holdings?principal=${address}&asset_identifiers=${nftRes.asset_identifier}&offset=0`,
        {
          timeout: apiConfig.timeout,
          headers: apiConfig.headers,
        }
      );

      return {
        count: nftRes.count,
        token_uri: nftMeta.token_uri,
        metadata: {
          name: nftMeta.metadata?.name,
          description: nftMeta.metadata?.description || "",
          image: nftMeta.metadata?.cached_image || nftMeta.metadata?.image || "",
          attributes: nftMeta.metadata?.attributes || [],
        },
        assets: Promise.resolve(assetsResponse.data),
      };
    } catch (error) {
      console.error("Failed to fetch NFT assets:", error);
      return null;
    }
  }
}