"use client";

import { useState, useEffect } from "react";
import type { EIP6963ProviderDetail } from "./Eip6963Types";

export function useEip6963() {
  const [providers, setProviders] = useState<Map<string, EIP6963ProviderDetail>>(new Map());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const providerMap = new Map<string, EIP6963ProviderDetail>();

    const handleAnnouncement = (event: any) => {
      const detail = event.detail as EIP6963ProviderDetail;
      providerMap.set(detail.info.uuid, detail);
      setProviders(new Map(providerMap));
    };

    // Listen for provider announcements
    window.addEventListener("eip6963:announceProvider", handleAnnouncement);

    // Request providers to announce themselves
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener("eip6963:announceProvider", handleAnnouncement);
    };
  }, []);

  return { providers };
}

