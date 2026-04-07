"use client";

import useSWR from "swr";
import type { InventoryItem } from "@/lib/db/schema";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useInventory() {
  const { data, error, mutate, isLoading } = useSWR<InventoryItem[]>(
    "/api/inventory",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  return {
    inventory: data ?? [],
    isLoading,
    error,
    mutate,
  };
}
