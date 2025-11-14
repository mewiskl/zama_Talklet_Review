/**
 * Relayer SDK Loader
 * Dynamically loads @zama-fhe/relayer-sdk from CDN (UMD format)
 */

import { SDK_CDN_URL, SDK_LOCAL_URL } from "./constants";

const GLOBAL_VAR_NAME = "relayerSDK";

export interface RelayerSDK {
  createInstance(config: {
    chainId: number;
    publicKey?: string;
    relayerUrl?: string;
  }): Promise<any>;
}

let cachedSDK: RelayerSDK | null = null;
let loadingPromise: Promise<RelayerSDK> | null = null;

export async function loadRelayerSDK(): Promise<RelayerSDK> {
  // Return cached if available
  if (cachedSDK) {
    return cachedSDK;
  }

  // Return ongoing load if in progress
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    // Check if already loaded globally
    if (typeof window !== "undefined" && (window as any)[GLOBAL_VAR_NAME]) {
      cachedSDK = (window as any)[GLOBAL_VAR_NAME];
      return cachedSDK!;
    }

    // Try loading from local first, fallback to CDN
    return new Promise<RelayerSDK>((resolve, reject) => {
      const script = document.createElement("script");
      script.type = "text/javascript"; // UMD format
      script.async = true;

      let triedLocal = false;
      const tryLoad = (url: string) => {
        console.log(`[RelayerSDKLoader] Attempting to load from: ${url}`);
        script.src = url;

        script.onload = () => {
          if ((window as any)[GLOBAL_VAR_NAME]) {
            cachedSDK = (window as any)[GLOBAL_VAR_NAME];
            console.log("[RelayerSDKLoader] Successfully loaded from", url);
            resolve(cachedSDK!);
          } else {
            reject(new Error("Relayer SDK loaded but not found in global scope"));
          }
        };

        script.onerror = () => {
          if (!triedLocal) {
            // Fallback to CDN
            triedLocal = true;
            console.warn("[RelayerSDKLoader] Local load failed, trying CDN");
            tryLoad(SDK_CDN_URL);
          } else {
            reject(new Error("Failed to load Relayer SDK from CDN"));
          }
        };

        document.head.appendChild(script);
      };

      tryLoad(SDK_LOCAL_URL);
    });
  })();

  return loadingPromise;
}

export function isRelayerSDKLoaded(): boolean {
  return cachedSDK !== null;
}

