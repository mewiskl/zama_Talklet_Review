"use client";

import { useCallback, useEffect, useState } from "react";
import { Contract, BrowserProvider } from "ethers";
import { useMetaMaskProvider } from "./metamask/useMetaMaskProvider";
import { useFhevm } from "@/fhevm/useFhevm";
import { getTalkletReviewAddress } from "@/abi/TalkletReviewAddresses";
import { TalkletReviewABI } from "@/abi/TalkletReviewABI";

export interface Session {
  id: number;
  title: string;
  speaker: string;
  organizer: string;
  timestamp: number;
  isActive: boolean;
  reviewCount: number;
  isDecrypted: boolean;
  decryptedClarity: number;
  decryptedInnovation: number;
  decryptedInspiration: number;
}

export interface ReviewInput {
  clarity: number;
  innovation: number;
  inspiration: number;
  tags: number;
  qaDuration: number;
}

export function useTalkletReview() {
  const { provider, chainId, accounts, isConnected } = useMetaMaskProvider();
  const { instance: fhevmInstance } = useFhevm();
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize contract
  useEffect(() => {
    if (!provider || !chainId || !isConnected) {
      setContract(null);
      return;
    }

    const address = getTalkletReviewAddress(chainId);
    if (!address) {
      console.warn(`TalkletReview not deployed on chain ${chainId}`);
      setContract(null);
      return;
    }

    const initContract = async () => {
      try {
        // Wrap the raw Eip1193Provider with BrowserProvider
        const browserProvider = new BrowserProvider(provider);
        const signer = await browserProvider.getSigner(accounts[0]);
        const contractInstance = new Contract(address, TalkletReviewABI, signer);
        setContract(contractInstance);
      } catch (error) {
        console.error("Failed to initialize contract:", error);
      }
    };

    initContract();
  }, [provider, chainId, isConnected, accounts]);

  // Create session
  const createSession = useCallback(
    async (title: string, speakerAddress: string, attendees: string[]) => {
      if (!contract) throw new Error("Contract not initialized");

      setIsLoading(true);
      try {
        const tx = await contract.createSession(title, speakerAddress, attendees);
        const receipt = await tx.wait();
        
        // Extract session ID from event
        const event = receipt.logs.find((log: any) => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed?.name === "SessionCreated";
          } catch {
            return false;
          }
        });

        if (event) {
          const parsed = contract.interface.parseLog(event);
          return Number(parsed?.args.sessionId);
        }
        
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [contract]
  );

  // Submit review
  const submitReview = useCallback(
    async (sessionId: number, review: ReviewInput) => {
      if (!contract) throw new Error("Contract not initialized");
      if (!fhevmInstance) throw new Error("FHEVM not initialized");
      if (accounts.length === 0) throw new Error("No account connected");

      setIsLoading(true);
      try {
        const contractAddress = await contract.getAddress();
        const userAddress = accounts[0];
        
        console.log("[submitReview] Session ID:", sessionId);
        console.log("[submitReview] User address:", userAddress);
        console.log("[submitReview] Contract address:", contractAddress);

        // Check if user is authorized
        const authorized = await contract.isAuthorized(sessionId, userAddress);
        console.log("[submitReview] Is authorized:", authorized);
        if (!authorized) {
          throw new Error(`User ${userAddress} is not authorized for session ${sessionId}`);
        }

        console.log("[submitReview] Encrypting clarity:", review.clarity);
        // Create separate encrypted inputs for each value (each needs its own proof)
        const inputClarity = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
        inputClarity.add16(review.clarity);
        const encryptedClarity = await inputClarity.encrypt();
        console.log("[submitReview] Clarity encrypted:", encryptedClarity);

        console.log("[submitReview] Encrypting innovation:", review.innovation);
        const inputInnovation = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
        inputInnovation.add16(review.innovation);
        const encryptedInnovation = await inputInnovation.encrypt();
        console.log("[submitReview] Innovation encrypted:", encryptedInnovation);

        console.log("[submitReview] Encrypting inspiration:", review.inspiration);
        const inputInspiration = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
        inputInspiration.add16(review.inspiration);
                const encryptedInspiration = await inputInspiration.encrypt();
                console.log("[submitReview] Inspiration encrypted:", encryptedInspiration);

                console.log("[submitReview] Submitting transaction with Uint8Arrays:", {
                  clarityHandleLength: encryptedClarity.handles[0].length,
                  clarityProofLength: encryptedClarity.inputProof.length,
                  innovationHandleLength: encryptedInnovation.handles[0].length,
                  innovationProofLength: encryptedInnovation.inputProof.length,
                  inspirationHandleLength: encryptedInspiration.handles[0].length,
                  inspirationProofLength: encryptedInspiration.inputProof.length,
                });

                // Submit with Uint8Arrays directly (like the reference project)
                const tx = await contract.submitReview(
                  sessionId,
                  encryptedClarity.handles[0],
                  encryptedClarity.inputProof,
                  encryptedInnovation.handles[0],
                  encryptedInnovation.inputProof,
                  encryptedInspiration.handles[0],
                  encryptedInspiration.inputProof,
                  review.tags,
                  review.qaDuration
                );

        console.log("[submitReview] Transaction sent:", tx.hash);
        await tx.wait();
        console.log("[submitReview] Transaction confirmed!");
        return true;
      } catch (error) {
        console.error("[submitReview] Error:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contract, fhevmInstance, accounts]
  );

  // Request decryption
  const requestDecryption = useCallback(
    async (sessionId: number) => {
      if (!contract) throw new Error("Contract not initialized");

      setIsLoading(true);
      try {
        const tx = await contract.requestDecryption(sessionId);
        await tx.wait();
        return true;
      } finally {
        setIsLoading(false);
      }
    },
    [contract]
  );

  // Store decrypted scores
  const storeDecryptedScores = useCallback(
    async (
      sessionId: number,
      clarity: number,
      innovation: number,
      inspiration: number
    ) => {
      if (!contract) throw new Error("Contract not initialized");

      console.log("[storeDecryptedScores] Called with:", {
        sessionId,
        clarity,
        innovation,
        inspiration,
        types: {
          sessionId: typeof sessionId,
          clarity: typeof clarity,
          innovation: typeof innovation,
          inspiration: typeof inspiration,
        }
      });

      setIsLoading(true);
      try {
        const tx = await contract.storeDecryptedScores(
          sessionId,
          clarity,
          innovation,
          inspiration
        );
        console.log("[storeDecryptedScores] Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("[storeDecryptedScores] Transaction confirmed:", receipt.hash);
        return true;
      } finally {
        setIsLoading(false);
      }
    },
    [contract]
  );

  // Close session
  const closeSession = useCallback(
    async (sessionId: number) => {
      if (!contract) throw new Error("Contract not initialized");

      setIsLoading(true);
      try {
        const tx = await contract.closeSession(sessionId);
        await tx.wait();
        return true;
      } finally {
        setIsLoading(false);
      }
    },
    [contract]
  );

  // Authorize attendees
  const authorizeAttendees = useCallback(
    async (sessionId: number, attendees: string[]) => {
      if (!contract) throw new Error("Contract not initialized");

      setIsLoading(true);
      try {
        const tx = await contract.authorizeAttendees(sessionId, attendees);
        await tx.wait();
        return true;
      } finally {
        setIsLoading(false);
      }
    },
    [contract]
  );

  // Get session
  const getSession = useCallback(
    async (sessionId: number): Promise<Session | null> => {
      if (!contract) {
        console.log("[getSession] Contract not initialized");
        return null;
      }

      try {
        console.log(`[getSession] Fetching session ${sessionId}...`);
        const result = await contract.getSession(sessionId);
        console.log("[getSession] Result:", result);
        
        // Contract returns tuple: [title, speaker, organizer, timestamp, isActive, reviewCount, isDecrypted, decryptedClarity, decryptedInnovation, decryptedInspiration]
        return {
          id: sessionId,
          title: result[0],
          speaker: result[1],
          organizer: result[2],
          timestamp: Number(result[3]),
          isActive: result[4],
          reviewCount: Number(result[5]),
          isDecrypted: result[6],
          decryptedClarity: Number(result[7]),
          decryptedInnovation: Number(result[8]),
          decryptedInspiration: Number(result[9]),
        };
      } catch (error) {
        console.error("[getSession] Error:", error);
        return null;
      }
    },
    [contract]
  );

  // Get session count
  const getSessionCount = useCallback(async (): Promise<number> => {
    if (!contract) return 0;

    try {
      const count = await contract.getSessionCount();
      return Number(count);
    } catch {
      return 0;
    }
  }, [contract]);

  // Check if user has reviewed
  const hasReviewed = useCallback(
    async (sessionId: number, address?: string): Promise<boolean> => {
      if (!contract) return false;
      const addr = address || accounts[0];
      if (!addr) return false;

      try {
        return await contract.hasReviewed(sessionId, addr);
      } catch {
        return false;
      }
    },
    [contract, accounts]
  );

  // Check if user is authorized
  const isAuthorized = useCallback(
    async (sessionId: number, address?: string): Promise<boolean> => {
      if (!contract) return false;
      const addr = address || accounts[0];
      if (!addr) return false;

      try {
        return await contract.isAuthorized(sessionId, addr);
      } catch {
        return false;
      }
    },
    [contract, accounts]
  );

  // Get authorized attendees
  const getAuthorizedAttendees = useCallback(
    async (sessionId: number): Promise<string[]> => {
      if (!contract) return [];

      try {
        return await contract.getAuthorizedAttendees(sessionId);
      } catch {
        return [];
      }
    },
    [contract]
  );

  return {
    contract,
    isLoading,
    createSession,
    submitReview,
    requestDecryption,
    storeDecryptedScores,
    closeSession,
    authorizeAttendees,
    getSession,
    getSessionCount,
    hasReviewed,
    isAuthorized,
    getAuthorizedAttendees,
  };
}

