import { NetworkConfig } from "../fhevmTypes";

export const LOCALHOST_CHAIN_ID = 31337;
export const SEPOLIA_CHAIN_ID = 11155111;

// Relayer SDK CDN URLs (v0.3.0-5)
export const SDK_CDN_URL = "https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs";
export const SDK_LOCAL_URL = "/relayer-sdk-js.umd.cjs";

export const NETWORK_CONFIGS: Record<number, NetworkConfig> = {
  [LOCALHOST_CHAIN_ID]: {
    chainId: LOCALHOST_CHAIN_ID,
    name: "Localhost",
    rpcUrl: "http://127.0.0.1:8545",
    isMockNetwork: true,
  },
  [SEPOLIA_CHAIN_ID]: {
    chainId: SEPOLIA_CHAIN_ID,
    name: "Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/",
    publicKey: "", // Will be fetched from Relayer
    relayerUrl: "https://relayer.sepolia.zama.ai",
    isMockNetwork: false,
  },
};

export const SUPPORTED_CHAIN_IDS = Object.keys(NETWORK_CONFIGS).map(Number);

export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return NETWORK_CONFIGS[chainId];
}

export function isMockNetwork(chainId: number): boolean {
  return chainId === LOCALHOST_CHAIN_ID;
}

