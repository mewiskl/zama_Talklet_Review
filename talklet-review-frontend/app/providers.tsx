"use client";

import { ReactNode, useEffect } from "react";
import { FhevmProvider, useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";

function FhevmInitializer({ children }: { children: ReactNode }) {
  const { provider, chainId, isConnected } = useMetaMaskProvider();
  const { initialize, instance } = useFhevm();

  useEffect(() => {
    if (provider && chainId && isConnected && !instance) {
      // Use window.ethereum directly (it's the Eip1193Provider)
      const eip1193Provider = (window as any).ethereum;
      if (eip1193Provider) {
        initialize(eip1193Provider, chainId);
      }
    }
  }, [provider, chainId, isConnected, instance, initialize]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FhevmProvider>
      <FhevmInitializer>{children}</FhevmInitializer>
    </FhevmProvider>
  );
}

