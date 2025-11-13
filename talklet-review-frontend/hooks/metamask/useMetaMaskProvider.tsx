"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BrowserProvider } from "ethers";
import { useEip6963 } from "./useEip6963";

interface WalletState {
  accounts: string[];
  chainId: number | null;
  isConnected: boolean;
  error: string | null;
}

const WALLET_STORAGE_KEYS = {
  connected: "wallet.connected",
  lastConnectorId: "wallet.lastConnectorId",
  lastAccounts: "wallet.lastAccounts",
  lastChainId: "wallet.lastChainId",
};

export function useMetaMaskProvider() {
  const { providers } = useEip6963();
  const [provider, setProvider] = useState<any>(null); // Eip1193Provider
  const [walletState, setWalletState] = useState<WalletState>({
    accounts: [],
    chainId: null,
    isConnected: false,
    error: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const listenersSetup = useRef(false);

  // Silent reconnect on page load
  useEffect(() => {
    silentReconnect();
  }, [providers]);

  // Silent reconnect (using eth_accounts)
  const silentReconnect = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const wasConnected = localStorage.getItem(WALLET_STORAGE_KEYS.connected) === "true";
      if (!wasConnected) return;

      const lastConnectorId = localStorage.getItem(WALLET_STORAGE_KEYS.lastConnectorId);
      let targetProvider: any = null;

      // Try to find last used provider
      if (lastConnectorId && providers.size > 0) {
        const providerDetail = Array.from(providers.values()).find(
          (p) => p.info.uuid === lastConnectorId
        );
        if (providerDetail) {
          targetProvider = providerDetail.provider;
        }
      }

      // Fallback to first available or window.ethereum
      if (!targetProvider) {
        if (providers.size > 0) {
          targetProvider = Array.from(providers.values())[0].provider;
        } else if ((window as any).ethereum) {
          targetProvider = (window as any).ethereum;
        }
      }

      if (!targetProvider) return;

      // Use eth_accounts (no user prompt)
      const accounts = await targetProvider.request({ method: "eth_accounts" });
      
      if (accounts && accounts.length > 0) {
        const chainIdHex = await targetProvider.request({ method: "eth_chainId" });
        const chainId = parseInt(chainIdHex, 16);

        // Store the raw Eip1193Provider (not BrowserProvider)
        setProvider(targetProvider);

        setWalletState({
          accounts,
          chainId,
          isConnected: true,
          error: null,
        });

        // Persist
        localStorage.setItem(WALLET_STORAGE_KEYS.connected, "true");
        localStorage.setItem(WALLET_STORAGE_KEYS.lastAccounts, JSON.stringify(accounts));
        localStorage.setItem(WALLET_STORAGE_KEYS.lastChainId, String(chainId));

        // Setup listeners
        setupListeners(targetProvider);
      } else {
        // No accounts, clear persisted state
        clearPersistedState();
      }
    } catch (error) {
      console.warn("Silent reconnect failed:", error);
      clearPersistedState();
    }
  }, [providers]);

  // Connect wallet (using eth_requestAccounts)
  const connect = useCallback(async (connectorId?: string) => {
    setIsConnecting(true);
    setWalletState((prev) => ({ ...prev, error: null }));

    try {
      let targetProvider: any = null;

      // Find provider by connector ID
      if (connectorId && providers.size > 0) {
        const providerDetail = Array.from(providers.values()).find(
          (p) => p.info.uuid === connectorId
        );
        if (providerDetail) {
          targetProvider = providerDetail.provider;
        }
      }

      // Fallback to first available or window.ethereum
      if (!targetProvider) {
        if (providers.size > 0) {
          targetProvider = Array.from(providers.values())[0].provider;
        } else if ((window as any).ethereum) {
          targetProvider = (window as any).ethereum;
        } else {
          throw new Error("No Ethereum provider found");
        }
      }

      // Request accounts (user prompt)
      const accounts = await targetProvider.request({ method: "eth_requestAccounts" });
      const chainIdHex = await targetProvider.request({ method: "eth_chainId" });
      const chainId = parseInt(chainIdHex, 16);

      // Store the raw Eip1193Provider (not BrowserProvider)
      setProvider(targetProvider);

      setWalletState({
        accounts,
        chainId,
        isConnected: true,
        error: null,
      });

      // Persist
      localStorage.setItem(WALLET_STORAGE_KEYS.connected, "true");
      localStorage.setItem(WALLET_STORAGE_KEYS.lastConnectorId, connectorId || "default");
      localStorage.setItem(WALLET_STORAGE_KEYS.lastAccounts, JSON.stringify(accounts));
      localStorage.setItem(WALLET_STORAGE_KEYS.lastChainId, String(chainId));

      // Setup listeners
      setupListeners(targetProvider);
    } catch (error: any) {
      setWalletState((prev) => ({
        ...prev,
        error: error.message || "Failed to connect wallet",
      }));
    } finally {
      setIsConnecting(false);
    }
  }, [providers]);

  // Disconnect
  const disconnect = useCallback(() => {
    setProvider(null);
    setWalletState({
      accounts: [],
      chainId: null,
      isConnected: false,
      error: null,
    });
    clearPersistedState();
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (chainId: number) => {
    if (!provider) return;

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        throw new Error("Network not added to wallet");
      }
      throw error;
    }
  }, [provider]);

  // Setup event listeners
  const setupListeners = useCallback((targetProvider: any) => {
    if (listenersSetup.current) return;
    listenersSetup.current = true;

    // accountsChanged
    targetProvider.on?.("accountsChanged", (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setWalletState((prev) => ({ ...prev, accounts }));
        localStorage.setItem(WALLET_STORAGE_KEYS.lastAccounts, JSON.stringify(accounts));
        
        // Clear old account's decryption signature
        // (handled by parent component)
      }
    });

    // chainChanged
    targetProvider.on?.("chainChanged", (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      setWalletState((prev) => ({ ...prev, chainId }));
      localStorage.setItem(WALLET_STORAGE_KEYS.lastChainId, String(chainId));
      
      // Reload page on chain change (recommended by MetaMask)
      window.location.reload();
    });

    // disconnect
    targetProvider.on?.("disconnect", () => {
      disconnect();
    });
  }, [disconnect]);

  return {
    provider,
    ...walletState,
    isConnecting,
    connect,
    disconnect,
    switchNetwork,
  };
}

function clearPersistedState() {
  Object.values(WALLET_STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

