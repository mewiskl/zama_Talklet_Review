"use client";

import { useMetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { truncateAddress } from "@/lib/utils";
import { useEip6963 } from "@/hooks/metamask/useEip6963";
import { useState } from "react";

export function WalletButton() {
  const { accounts, chainId, isConnected, isConnecting, connect, disconnect } =
    useMetaMaskProvider();
  const { providers } = useEip6963();
  const [showProviders, setShowProviders] = useState(false);

  if (isConnecting) {
    return (
      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg" disabled>
        Connecting...
      </button>
    );
  }

  if (isConnected && accounts.length > 0) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm">
          <NetworkIndicator chainId={chainId} />
          <span className="font-mono">{truncateAddress(accounts[0])}</span>
        </div>
        <button
          onClick={disconnect}
          className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (providers.size > 1) {
            setShowProviders(true);
          } else {
            connect();
          }
        }}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Connect Wallet
      </button>

      {showProviders && (
        <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg p-2 z-50">
          <div className="text-sm font-medium mb-2 px-2">Select Wallet</div>
          {Array.from(providers.values()).map((provider) => (
            <button
              key={provider.info.uuid}
              onClick={() => {
                connect(provider.info.uuid);
                setShowProviders(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg transition-colors"
            >
              {provider.info.icon && (
                <img
                  src={provider.info.icon}
                  alt={provider.info.name}
                  className="w-6 h-6"
                />
              )}
              <span className="text-sm">{provider.info.name}</span>
            </button>
          ))}
          <button
            onClick={() => setShowProviders(false)}
            className="w-full mt-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function NetworkIndicator({ chainId }: { chainId: number | null }) {
  if (!chainId) return null;

  const networks: Record<number, { name: string; color: string }> = {
    31337: { name: "Local", color: "bg-yellow-500" },
    11155111: { name: "Sepolia", color: "bg-green-500" },
  };

  const network = networks[chainId] || { name: "Unknown", color: "bg-gray-500" };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${network.color}`} />
      <span className="text-xs font-medium">{network.name}</span>
    </div>
  );
}

