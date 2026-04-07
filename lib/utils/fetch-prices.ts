import type { PriceData } from "@/lib/albion/api";
import { CITIES } from "@/lib/constants/cities";

const BATCH_SIZE = 50;

export interface FetchClientPricesOptions {
  items: string[];
  locations?: string[];
  qualities?: string;
  onProgress?: (completed: number, total: number) => void;
  /** Délai entre batches en ms. Défaut: 0. Passer 300 pour les appels sensibles au rate-limit. */
  delayMs?: number;
}

/**
 * Batch fetch client-side vers /api/prices.
 * Découpe les items par tranches de 50 pour respecter les limites de l'API.
 * Fonction async pure — utilisable dans des useCallback / event handlers.
 */
export async function fetchClientPrices({
  items,
  locations = [...CITIES],
  qualities = "1",
  onProgress,
  delayMs = 0,
}: FetchClientPricesOptions): Promise<PriceData[]> {
  const allPrices: PriceData[] = [];
  const totalBatches = Math.ceil(items.length / BATCH_SIZE);

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const params = new URLSearchParams({
      items: batch.join(","),
      locations: locations.join(","),
      qualities,
    });

    const res = await fetch(`/api/prices?${params}`);
    if (!res.ok) throw new Error(`Price fetch failed: ${res.status}`);
    allPrices.push(...((await res.json()) as PriceData[]));

    const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
    onProgress?.(batchIndex, totalBatches);

    if (delayMs > 0 && i + BATCH_SIZE < items.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return allPrices;
}
