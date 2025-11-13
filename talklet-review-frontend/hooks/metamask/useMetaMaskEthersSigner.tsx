"use client";

import { useState, useEffect } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useMetaMaskProvider } from "./useMetaMaskProvider";

export function useMetaMaskEthersSigner() {
  const { provider, accounts, isConnected, chainId } = useMetaMaskProvider();
  const [ethersSigner, setEthersSigner] = useState<JsonRpcSigner | null>(null);
  const [browserProvider, setBrowserProvider] = useState<BrowserProvider | null>(null);

  useEffect(() => {
    if (!provider || !isConnected || !chainId || accounts.length === 0) {
      setEthersSigner(null);
      setBrowserProvider(null);
      return;
    }

    // Validate that provider has the required EIP-1193 methods
    if (typeof provider.request !== 'function') {
      console.warn("[useMetaMaskEthersSigner] Provider does not have request method");
      setEthersSigner(null);
      setBrowserProvider(null);
      return;
    }

    try {
      const bp = new BrowserProvider(provider);
      const signer = new JsonRpcSigner(bp, accounts[0]);
      setBrowserProvider(bp);
      setEthersSigner(signer);
      console.log("[useMetaMaskEthersSigner] Signer created successfully for", accounts[0]);
    } catch (error) {
      console.error("[useMetaMaskEthersSigner] Failed to create signer:", error);
      setEthersSigner(null);
      setBrowserProvider(null);
    }
  }, [provider, isConnected, chainId, accounts]);

  return { 
    ethersSigner, 
    browserProvider,
    address: accounts[0] || null 
  };
}

