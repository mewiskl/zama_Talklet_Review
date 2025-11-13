"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { FhevmInstance, FhevmProvider } from "./fhevmTypes";
import { initializeFhevm, clearFhevmCache } from "./internal/fhevm";

interface FhevmContextValue {
  instance: FhevmInstance | null;
  isInitializing: boolean;
  error: Error | null;
  initialize: (provider: FhevmProvider, chainId: number) => Promise<void>;
  clear: () => void;
}

const FhevmContext = createContext<FhevmContextValue | undefined>(undefined);

export function FhevmProvider({ children }: { children: ReactNode }) {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initialize = useCallback(async (provider: FhevmProvider, chainId: number) => {
    console.log("[useFhevm] Initializing FHEVM with chainId:", chainId);
    setIsInitializing(true);
    setError(null);

    try {
      const fhevmInstance = await initializeFhevm(provider, { chainId });
      console.log("[useFhevm] FHEVM instance created successfully");
      console.log("[useFhevm] Instance type:", fhevmInstance.constructor.name);
      
      // Test encryption to diagnose issues
      try {
        const testInput = fhevmInstance.createEncryptedInput("0xd4B5327816E08cce36F7D537c43939f5229572D1", "0xb9e9a901a78f70c08dbfeac5f050dc55431c7d4e");
        testInput.add16(1);
        const testEnc = await testInput.encrypt();
        console.log("[useFhevm] Test encryption successful:", {
          handleLength: testEnc.handles[0].length,
          proofLength: testEnc.inputProof.length,
          handleSample: Array.from(testEnc.handles[0].slice(0, 10)),
        });
      } catch (testErr) {
        console.error("[useFhevm] Test encryption failed:", testErr);
      }
      
      setInstance(fhevmInstance);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("[useFhevm] Failed to initialize FHEVM:", error);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const clear = useCallback(() => {
    clearFhevmCache();
    setInstance(null);
    setError(null);
  }, []);

  return (
    <FhevmContext.Provider value={{ instance, isInitializing, error, initialize, clear }}>
      {children}
    </FhevmContext.Provider>
  );
}

export function useFhevm() {
  const context = useContext(FhevmContext);
  if (!context) {
    throw new Error("useFhevm must be used within FhevmProvider");
  }
  return context;
}

