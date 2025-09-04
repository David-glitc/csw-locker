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
<<<<<<< HEAD

   async depositSTX(params: {
      to: string;
      amount: string;
   }): Promise<{ txid: string; network: string }> {

      const { network } = getClientConfig(params.to);

      const data = await request(
         "stx_transferStx",
         {
            recipient: params.to,
            amount: Number(params.amount),
            network,
         }
      );
      // Assume data.txid and network are returned
      return { txid: data.txid, network };
   }

   async depositFT(params: {
    token: string;
    to: string;
    amount: string; 
    decimals: number;
    sender:string
  }): Promise<{ txid: string; network: string }> {
    

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [contract, tokenName] = params.token.split('::') as any;
    const [address, contractName] = contract.split('.');
    const { network } = getClientConfig(params.to);
    
    const amount = params.amount;
    const sender = params.sender || params.to.split('.')[0];
   const postConditions = [Pc.principal(sender).willSendLte(amount).ft(contract, tokenName)]

    const data = await request(
      "stx_callContract",
      {
        contract: `${address}.${contractName}`,
        functionName: "transfer",
        functionArgs: [
          Cl.uint(amount),
          Cl.principal(sender), 
          Cl.principal(params.to),
          Cl.none()
        ],
        network,
        postConditions,
         postConditionMode: "deny"
      }
    );
    return { txid: data.txid, network };
  }
=======
>>>>>>> 6632ce3 (Review 2025-07-04 #77)
}
