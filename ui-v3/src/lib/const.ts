export type SmartWalletTypes = {
  label: string;
  name: string;
  extensions: string[];
  ext: boolean;
  recomended: boolean;
};

export const ContractTypes: SmartWalletTypes[] = [
  {
    label: "Personal Wallet",
    name: "smart-wallet",
    extensions: ["Delegate STX"],
    ext: false,
    recomended: true,
  },
  {
    label: "Delegate STX",
    name: "ext-delegate-stx-pox-4",
    extensions: [],
    ext: true,
    recomended: false,
  },
];

// Documentation URLs
export const DOCS_URL =
  "https://polimartlabs.gitbook.io/smart-wallet/csw-locker-smart-wallet-for-bitcoin-and-stacks/why-smart-wallet";
