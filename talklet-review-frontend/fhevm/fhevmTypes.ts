import type { Eip1193Provider } from "ethers";

// Using the actual FhevmInstance type from @zama-fhe/relayer-sdk or @fhevm/mock-utils
// This is a minimal compatible interface - using 'any' for methods that differ between implementations
export interface FhevmInstance {
  getPublicKey(): any; // Returns different types for Mock vs Real
  getPublicParams?(size: number): any; // Returns different types for Mock vs Real
  createEncryptedInput(contractAddress: string, userAddress: string): EncryptedInput;
  userDecrypt(
    handles: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ): Promise<any>; // Returns different types for Mock vs Real
  createEIP712(
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ): EIP712Type;
  generateKeypair(): { publicKey: string; privateKey: string };
}

export interface EncryptedInput {
  add16(value: number): void;
  add32(value: number): void;
  encrypt(): Promise<any>; // Returns different types for Mock vs Real (handles and inputProof may be Uint8Array or string)
}

export interface FhevmConfig {
  chainId: number;
  publicKey?: string;
  relayerUrl?: string;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  publicKey?: string;
  relayerUrl?: string;
  isMockNetwork: boolean;
}

export type FhevmProvider = Eip1193Provider;

export type FhevmDecryptionSignatureType = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number; // Unix timestamp in seconds
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
};

export type EIP712Type = {
  domain: {
    chainId: number;
    name: string;
    verifyingContract: `0x${string}`;
    version: string;
  };
  message: any;
  primaryType: string;
  types: {
    [key: string]: {
      name: string;
      type: string;
    }[];
  };
};
