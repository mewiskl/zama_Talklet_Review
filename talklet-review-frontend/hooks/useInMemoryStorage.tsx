"use client";

import { useState, useCallback } from "react";

/**
 * Simple in-memory storage hook for client-side data
 * Used to cache review data locally (not persisted)
 */
export function useInMemoryStorage<T = any>() {
  const [storage, setStorage] = useState<Map<string, T>>(new Map());

  const getItem = useCallback((key: string): T | null => {
    return storage.get(key) || null;
  }, [storage]);

  const setItem = useCallback((key: string, value: T) => {
    setStorage((prev) => {
      const newMap = new Map(prev);
      newMap.set(key, value);
      return newMap;
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setStorage((prev) => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const clear = useCallback(() => {
    setStorage(new Map());
  }, []);

  return { storage, getItem, setItem, removeItem, clear };
}

