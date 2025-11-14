/**
 * FHEVM Core Implementation
 * Handles initialization of Mock or Real Relayer SDK based on network
 */

import type { FhevmInstance, FhevmConfig, FhevmProvider } from "../fhevmTypes";
import { isMockNetwork, getNetworkConfig } from "./constants";
import { PublicKeyStorage } from "./PublicKeyStorage";
import { loadRelayerSDK } from "./RelayerSDKLoader";
import { JsonRpcProvider } from "ethers";

let cachedInstance: FhevmInstance | null = null;
let currentChainId: number | null = null;

export async function initializeFhevm(
  provider: FhevmProvider,
  config: FhevmConfig
): Promise<FhevmInstance> {
  const { chainId } = config;

  // Return cached if same chain
  if (cachedInstance && currentChainId === chainId) {
    return cachedInstance;
  }

  // Clear cache on chain change
  cachedInstance = null;
  currentChainId = chainId;

  const networkConfig = getNetworkConfig(chainId);
  if (!networkConfig) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  // Mock mode (localhost)
  if (isMockNetwork(chainId)) {
    console.log("[initializeFhevm] Detected mock network, chainId:", chainId);
    const rpcUrl = networkConfig.rpcUrl;
    console.log("[initializeFhevm] RPC URL:", rpcUrl);
    
    // Check for fhevm_relayer_metadata
    const rpc = new JsonRpcProvider(rpcUrl);
    let metadata;
    try {
      metadata = await rpc.send("fhevm_relayer_metadata", []);
      console.log("[initializeFhevm] FHEVM metadata:", metadata);
      if (!metadata || !metadata.ACLAddress) {
        throw new Error("Invalid metadata");
      }
    } catch (error) {
      console.error("[initializeFhevm] Failed to get metadata:", error);
      throw new Error(
        `Mock FHEVM not available. Ensure Hardhat node is running with fhevm_relayer_metadata support. Error: ${error}`
      );
    } finally {
      rpc.destroy();
    }

    console.log("[initializeFhevm] Creating MockFhevmInstance with chainId:", chainId);
    // Dynamic import to avoid bundling in production
    const fhevmMock = await import("./mock/fhevmMock");
    cachedInstance = await fhevmMock.fhevmMockCreateInstance({
      rpcUrl,
      chainId,
      metadata: {
        ACLAddress: metadata.ACLAddress,
        InputVerifierAddress: metadata.InputVerifierAddress,
        KMSVerifierAddress: metadata.KMSVerifierAddress,
      },
    });
    console.log("[initializeFhevm] MockFhevmInstance created successfully");
    return cachedInstance;
  }

  // Real mode (Sepolia or other networks)
  return await createRealFhevmInstance(provider, config);
}

async function createRealFhevmInstance(
  provider: FhevmProvider,
  config: FhevmConfig
): Promise<FhevmInstance> {
  const { chainId, publicKey: providedPublicKey, relayerUrl } = config;

  // Try to get cached public key
  let publicKey = providedPublicKey || PublicKeyStorage.get(chainId) || undefined;

  // Load Relayer SDK
  const sdk = await loadRelayerSDK();

  // Create instance
  const instance = await sdk.createInstance({
    chainId,
    publicKey,
    relayerUrl,
  });

  // Cache public key
  try {
    const fetchedPublicKey = instance.getPublicKey();
    if (fetchedPublicKey && typeof fetchedPublicKey === 'string' && fetchedPublicKey !== publicKey) {
      PublicKeyStorage.set(chainId, fetchedPublicKey);
    }
  } catch {
    // Ignore if getPublicKey() fails or returns incompatible type
  }

  // Return the instance directly (it matches our interface)
  cachedInstance = instance;
  return instance;
}

export function clearFhevmCache(): void {
  cachedInstance = null;
  currentChainId = null;
  PublicKeyStorage.clear();
}

export function getFhevmInstance(): FhevmInstance | null {
  return cachedInstance;
}

