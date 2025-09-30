import { defaultUrlFromNetwork, StacksNetworkName } from "@stacks/network";

export function getClientConfig(address: string) {
  // Automatic detection based on address prefix
  // Mainnet: SP, SM; Testnet: ST, SN
  const network: StacksNetworkName = address.startsWith("SP")
    ? "mainnet"
    : "testnet";
  return {
    network,
    api: defaultUrlFromNetwork(network),
    explorer: (path: string) =>
      `https://explorer.hiro.so/${path}?chain=${network}`,
    chain: network,
  };
}
