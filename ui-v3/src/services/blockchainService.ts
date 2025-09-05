import { TransactionParams, ExtensionCallParams } from './interfaces';

export class BlockchainService {
   async getTransactionStatus(txHash: string): Promise<string> {
      // Simulate status check
      return new Promise((resolve) => {
         setTimeout(() => {
            const statuses = ["pending", "confirmed", "failed"];
            const randomStatus =
               statuses[Math.floor(Math.random() * statuses.length)];
            resolve(randomStatus);
         }, 1000);
      });
   }
}
