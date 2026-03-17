/**
 * Hooks React pour charger les items Albion depuis la DB
 */

import useSWR from 'swr';
import type { AlbionItem } from '@/lib/db/schema';

interface ItemFilters {
  category?: string;
  subcategory?: string;
  tier?: number;
  enchant?: number;
  search?: string;
  locale?: string;
  limit?: number;
  offset?: number;
}

interface ItemsResponse {
  items: AlbionItem[];
  total: number;
  limit: number;
  offset: number;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

/**
 * Hook pour charger une liste d'items avec filtres
 */
export function useAlbionItems(filters?: ItemFilters) {
  const params = new URLSearchParams();

  if (filters?.category) params.set('category', filters.category);
  if (filters?.subcategory) params.set('subcategory', filters.subcategory);
  if (filters?.tier !== undefined) params.set('tier', filters.tier.toString());
  if (filters?.enchant !== undefined) params.set('enchant', filters.enchant.toString());
  if (filters?.search) params.set('search', filters.search);
  if (filters?.locale) params.set('locale', filters.locale);
  if (filters?.limit) params.set('limit', filters.limit.toString());
  if (filters?.offset) params.set('offset', filters.offset.toString());

  const { data, error, isLoading, mutate } = useSWR<ItemsResponse>(
    `/api/items?${params.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
      keepPreviousData: true,
    }
  );

  return {
    items: data?.items || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook pour charger un item spécifique par ID
 */
export function useAlbionItem(id: string | null) {
  const { data, error, isLoading } = useSWR<AlbionItem>(
    id ? `/api/items/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  return {
    item: data,
    isLoading,
    error,
  };
}
