/**
 * Public Key Storage
 * Manages caching of FHEVM public keys with expiration
 */

const PUBLIC_KEY_PREFIX = "fhevm.publicKey";
const EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface StoredPublicKey {
  key: string;
  timestamp: number;
}

export class PublicKeyStorage {
  private static getStorageKey(chainId: number): string {
    return `${PUBLIC_KEY_PREFIX}.${chainId}`;
  }

  static get(chainId: number): string | null {
    try {
      const stored = localStorage.getItem(this.getStorageKey(chainId));
      if (!stored) return null;

      const { key, timestamp }: StoredPublicKey = JSON.parse(stored);
      const now = Date.now();

      // Check if expired
      if (now - timestamp > EXPIRATION_MS) {
        this.remove(chainId);
        return null;
      }

      return key;
    } catch {
      return null;
    }
  }

  static set(chainId: number, publicKey: string): void {
    try {
      const data: StoredPublicKey = {
        key: publicKey,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.getStorageKey(chainId), JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to store public key:", error);
    }
  }

  static remove(chainId: number): void {
    try {
      localStorage.removeItem(this.getStorageKey(chainId));
    } catch {
      // Ignore
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(PUBLIC_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // Ignore
    }
  }
}

