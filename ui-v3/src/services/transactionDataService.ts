import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { getClientConfig } from "../utils/chain-config";
import { TxAssetInfo, TxInfo, Transaction, Recipient } from "./interfaces";
import { RecipientStorageService } from "./recipientStorageService";

interface StacksTransactionEvent {
  events: Record<string, unknown>;
  stx_received: string;
  stx_sent: string;
  tx: {
    token_transfer?: {
      amount: string;
    };
    tx_id: string;
    tx_status: string;
    tx_type: string;
    block_time_iso: string;
    sender_address: string;
    nonce?: number;
    contract_call?: {
      function_name: string;
      function_args: Array<{
        repr: string;
      }>;
    };
    post_conditions: Array<{
      asset?: {
        asset_name: string;
        contract_address: string;
        contract_name: string;
      };
      amount?: string;
      principal: {
        address: string;
        contract_name?: string;
      };
    }>;
  };
}

interface PostConditionAsset {
  name: string;
  amount: string;
  asset: string;
  symbol: string;
}

interface TransactionCache {
  [address: string]: {
    transactions: Transaction[];
    lastFetched: number;
  };
}

interface SwTxCache {
  [address: string]: {
    transactions: TxInfo[];
    lastFetched: number;
  };
}

export class TransactionDataService {
  private cache: TransactionCache = {};
  private readonly CACHE_TTL = 30000; // 30 seconds cache TTL
  private swTxCache: SwTxCache = {};
  private readonly SW_TX_CACHE_TTL = 30000; // 30 seconds
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second minimum between requests

  private isCacheValid(address: string): boolean {
    const cached = this.cache[address];
    if (!cached) return false;
    return Date.now() - cached.lastFetched < this.CACHE_TTL;
  }

  private isSwTxCacheValid(address: string): boolean {
    const cached = this.swTxCache[address];
    if (!cached) return false;
    return Date.now() - cached.lastFetched < this.SW_TX_CACHE_TTL;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const delay = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Retrieves transaction data from Hiro API with rate limiting to avoid CORS errors
   * @param walletAddress - The wallet address to fetch transactions for
   * @param offset - The offset for pagination (default: 0)
   * @returns Promise<StacksTransactionEvent[]> - Array of transaction events
   *
   * @example
   * ```typescript
   * const transactionService = new TransactionDataService();
   *
   * // Fetch first 20 transactions
   * const transactions = await transactionService.fetchTransactionsFromAPI('SP123...', 0);
   *
   * // Fetch next 20 transactions (pagination)
   * const nextPage = await transactionService.fetchTransactionsFromAPI('SP123...', 20);
   * ```
   */
  async fetchTransactionsFromAPI(
    walletAddress: string,
    offset: number = 0
  ): Promise<StacksTransactionEvent[]> {
    try {
      // Enforce rate limiting to avoid CORS errors
      await this.enforceRateLimit();

      const { api } = getClientConfig(walletAddress);
      const response = await axios.get<{ results: StacksTransactionEvent[] }>(
        `${api}/extended/v2/addresses/${walletAddress}/transactions?limit=20&offset=${offset}`,
        {
          timeout: 10000, // 10 second timeout
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response?.data?.results) {
        return response.data.results;
      }

      return [];
    } catch (error) {
      console.error(
        `Error fetching transactions for address ${walletAddress}:`,
        error
      );

      // If it's a rate limit error, wait a bit longer before throwing
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        console.warn("Rate limit exceeded, waiting 2 seconds before retry...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      throw error;
    }
  }

  private processTransactionData(tx: StacksTransactionEvent): Transaction {
    const { stx_sent, stx_received, tx: txData } = tx;
    const stxsent = Number(stx_sent);
    const stxreceived = Number(stx_received);

    const pcAssetsAndAmounts: PostConditionAsset[] =
      txData?.post_conditions?.length > 0
        ? txData.post_conditions.map((c) => ({
            name: c?.asset?.asset_name ?? "Stacks",
            amount: c.amount ?? "0",
            asset: c?.asset?.contract_address
              ? `${c.asset.contract_address}.${c.asset.contract_name}`
              : "STX",
            symbol: c?.asset?.asset_name?.replace("-token", "") ?? "STX",
          }))
        : txData?.tx_type === "token_transfer" && txData.token_transfer
        ? [
            {
              name: "Stacks",
              amount: txData.token_transfer.amount,
              asset: "STX",
              symbol: "STX",
            },
          ]
        : [];

    const pcSender = txData?.post_conditions?.[0]?.principal?.contract_name
      ? `${txData.post_conditions[0].principal.address}.${txData.post_conditions[0].principal.contract_name}`
      : txData.post_conditions?.[0]?.principal?.address;

    const txSender =
      txData?.contract_call?.function_args?.[1]?.repr?.replace("'", "") ??
      txData.sender_address;

    // Normalize status: treat 'success' as 'confirmed', and failed-like statuses as 'failed'
    let normalizedStatus = txData.tx_status;
    if (normalizedStatus === "success") normalizedStatus = "confirmed";
    const failedStatuses = [
      "abort_by_post_condition",
      "abort_by_response",
      "dropped",
      "error",
      "failed",
      "rejected",
      "abort",
    ];
    if (failedStatuses.includes(normalizedStatus)) {
      normalizedStatus = "failed";
    }
    return {
      id: txData.tx_id,
      action:
        stxsent > 0
          ? "sent"
          : stxreceived > 0
          ? "receive"
          : txData?.contract_call?.function_name ?? txData.tx_type,
      from: txSender,
      to: pcSender ?? "",
      amount: pcAssetsAndAmounts[0]?.amount ?? "0",
      asset: pcAssetsAndAmounts[0]?.symbol ?? "STX",
      assetType: "ft",
      timestamp: formatDistanceToNow(new Date(txData.block_time_iso)),
      status: normalizedStatus as "pending" | "confirmed" | "failed",
      txHash: txData.tx_id,
    };
  }

  async getRecentTransactions(
    walletAddress: string,
    offset = 0
  ): Promise<Transaction[]> {
    if (this.isCacheValid(walletAddress) && offset === 0) {
      return this.cache[walletAddress].transactions;
    }

    try {
      const results = await this.fetchTransactionsFromAPI(
        walletAddress,
        offset
      );
      const transactions = results.map((tx) => this.processTransactionData(tx));

      if (offset === 0) {
        this.cache[walletAddress] = {
          transactions,
          lastFetched: Date.now(),
        };
      } else if (this.cache[walletAddress]) {
        // Append new transactions to cache if they don't already exist
        const existingTxs = this.cache[walletAddress].transactions;
        const newTxs = transactions.filter(
          (tx) => !existingTxs.some((existing) => existing.id === tx.id)
        );
        this.cache[walletAddress].transactions = [...existingTxs, ...newTxs];
      }

      return transactions;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  }

  async getRecentRecipients(walletAddress: string): Promise<Recipient[]> {
    try {
      const transactions = await this.getRecentTransactions(walletAddress);
      const recipientMap = new Map<
        string,
        { lastSent: string; frequency: number }
      >();

      transactions
        .filter((tx) => tx.action === "sent")
        .forEach((tx) => {
          const existing = recipientMap.get(tx.to);
          if (existing) {
            recipientMap.set(tx.to, {
              lastSent: tx.timestamp,
              frequency: existing.frequency + 1,
            });
          } else {
            recipientMap.set(tx.to, {
              lastSent: tx.timestamp,
              frequency: 1,
            });
          }
        });

      const apiRecipients = Array.from(recipientMap.entries()).map(
        ([address, data]) => ({
          address,
          lastSent: data.lastSent,
          frequency: data.frequency,
        })
      );

      // Get recipients from localStorage
      const storageRecipients =
        RecipientStorageService.getRecentRecipientsFromStorage();

      // Combine and deduplicate recipients (localStorage takes precedence for frequency)
      const combinedRecipients = new Map();

      // Add API recipients first
      apiRecipients.forEach((recipient) => {
        combinedRecipients.set(recipient.address, recipient);
      });

      // Add/update with localStorage recipients (they have more accurate frequency data)
      storageRecipients.forEach((recipient) => {
        combinedRecipients.set(recipient.address, recipient);
      });

      const allRecipients = Array.from(combinedRecipients.values());

      // Filter out removed recipients using localStorage
      return RecipientStorageService.filterRemovedRecipients(allRecipients);
    } catch (error) {
      console.error("Error fetching recipients:", error);
      return [];
    }
  }

  handleGetSwTx = async (
    address: string,
    offset: number,
    setSwTx: (cb: (prev: TxInfo[]) => TxInfo[]) => TxInfo[]
  ) => {
    if (this.isSwTxCacheValid(address) && offset === 0) {
      setSwTx(
        () => this.swTxCache[address].transactions as unknown as TxInfo[]
      );
      return;
    }

    try {
      const results = await this.fetchTransactionsFromAPI(address, offset);
      if (results) {
        const constructTx = results.map((info: StacksTransactionEvent) => {
          const { stx_sent, stx_received, tx } = info;
          const stxsent = Number(stx_sent);
          const stxreceived = Number(stx_received);
          let normalizedStatus = tx.tx_status;
          if (normalizedStatus === "success") normalizedStatus = "confirmed";
          const failedStatuses = [
            "abort_by_post_condition",
            "abort_by_response",
            "dropped",
            "error",
            "failed",
            "rejected",
            "abort",
          ];
          if (failedStatuses.includes(normalizedStatus)) {
            normalizedStatus = "failed";
          }
          const pcAssetsAndAmounts =
            tx?.post_conditions?.length > 0
              ? tx?.post_conditions.map((c) => {
                  const asset = c?.asset?.contract_address
                    ? `${c?.asset?.contract_address}.${c?.asset?.contract_name}`
                    : "STX";
                  const symbol = c?.asset?.asset_name?.replace("-token", "");
                  return {
                    name: c?.asset?.asset_name ?? "Stacks",
                    amount: c.amount ?? "0",
                    asset,
                    symbol: symbol ?? "STX",
                  };
                })
              : tx?.tx_type === "token_transfer"
              ? [
                  {
                    name: "Stacks",
                    amount: tx?.token_transfer?.amount ?? "0",
                    asset: "STX",
                    symbol: "STX",
                  },
                ]
              : [];
          const pcSender = tx?.post_conditions?.[0]?.principal?.contract_name
            ? `${tx?.post_conditions?.[0]?.principal?.address}.${tx?.post_conditions?.[0]?.principal?.contract_name}`
            : tx?.post_conditions?.[0]?.principal?.address;
          const txSender =
            tx?.contract_call?.function_args[1]?.repr?.replace("'", "") ??
            tx?.sender_address;
          const isStx = stxsent > 0 || stxreceived > 0;
          // Special handling for contract_deploy
          if (tx.tx_type === "contract_deploy") {
            if (normalizedStatus !== "confirmed") {
              return {
                action: tx?.contract_call?.function_name ?? tx.tx_type,
                sender: txSender,
                stamp: formatDistanceToNow(tx?.block_time_iso),
                time: tx?.block_time_iso,
                assets: [],
                tx: tx?.tx_id,
                tx_status: normalizedStatus,
                tx_type: tx.tx_type,
              };
            }
          }
          if (isStx) {
            return {
              action: stxsent > 0 ? "sent" : "receive",
              sender:
                stxreceived > 0 ? txSender : stxsent > 0 ? txSender : pcSender,
              stamp: formatDistanceToNow(tx?.block_time_iso),
              time: tx?.block_time_iso,
              assets: pcAssetsAndAmounts,
              tx: tx?.tx_id,
              tx_status: normalizedStatus,
              tx_type: tx.tx_type,
            };
          } else {
            return {
              action:
                tx?.post_conditions?.length === 0
                  ? tx?.contract_call?.function_name
                    ? tx?.contract_call?.function_name
                    : tx?.tx_type
                  : pcSender === address
                  ? "sent"
                  : "receive",
              sender: tx?.post_conditions?.length > 0 ? pcSender : txSender,
              stamp: formatDistanceToNow(tx?.block_time_iso),
              time: tx?.block_time_iso,
              assets: pcAssetsAndAmounts,
              tx: tx?.tx_id,
              tx_status: normalizedStatus,
              tx_type: tx.tx_type,
            };
          }
        });
        if (offset === 0) {
          this.swTxCache[address] = {
            transactions: constructTx,
            lastFetched: Date.now(),
          };
          setSwTx(() => constructTx);
        } else if (this.swTxCache[address]) {
          const existingTxs = this.swTxCache[address].transactions;
          const newTxs = (constructTx ?? []).filter(
            (tx: TxInfo) =>
              !existingTxs.some((existing) => existing?.tx === tx.tx)
          );
          this.swTxCache[address].transactions = [...existingTxs, ...newTxs];
          setSwTx((prev) => [...prev, ...newTxs]);
        } else {
          setSwTx((prev) => {
            const newTxs = (constructTx ?? []).filter(
              (tx: TxInfo) => !prev.some((existing) => existing?.tx === tx.tx)
            );
            return [...prev, ...newTxs];
          });
        }
      }
    } catch (e) {
      // Handle error silently
    }
  };

  async getTransactionCount(walletAddress: string): Promise<number> {
    try {
      const { api } = getClientConfig(walletAddress);

      // First, get the total count by making a request to count all transactions
      // We'll make multiple requests with increasing offsets until we find no more transactions
      let totalCount = 0;
      let offset = 0;
      const limit = 50; // Use a larger limit for efficiency
      let hasMoreTransactions = true;

      while (hasMoreTransactions) {
        const response = await axios.get<{ results: StacksTransactionEvent[] }>(
          `${api}/extended/v2/addresses/${walletAddress}/transactions?limit=${limit}&offset=${offset}`,
          {
            timeout: 10000,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        if (response?.data?.results && response.data.results.length > 0) {
          totalCount += response.data.results.length;

          // If we got fewer results than the limit, we've reached the end
          if (response.data.results.length < limit) {
            hasMoreTransactions = false;
          } else {
            offset += limit;
          }
        } else {
          hasMoreTransactions = false;
        }

        // Add a small delay to avoid rate limiting
        if (hasMoreTransactions) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      return totalCount;
    } catch (error) {
      console.error("Error fetching transaction count:", error);
      return 0;
    }
  }
}
