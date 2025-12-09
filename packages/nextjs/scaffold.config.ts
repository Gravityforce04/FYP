import * as chains from "viem/chains";

export type BaseConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  rpcOverrides?: Record<number, string>;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

export type ScaffoldConfig = BaseConfig;

export const DEFAULT_ALCHEMY_API_KEY = "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";

const scaffoldConfig = {
  // Add more than one network so the header dropdown can switch networks
  targetNetworks: [chains.arbitrumSepolia],
  pollingInterval: 30000,
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "fhaieAVmxt_bxI_cGykuQ",
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",
  onlyLocalBurnerWallet: false, // Enable external wallets
  rpcOverrides: {
    // Add custom RPC endpoints if needed
    // Override local hardhat to use the local node
    [chains.hardhat.id]: "http://127.0.0.1:8545",
    [chains.arbitrumSepolia.id]: "https://sepolia-rollup.arbitrum.io/rpc",
  },
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
