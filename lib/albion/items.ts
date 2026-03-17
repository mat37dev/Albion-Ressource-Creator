/**
 * Compatibility layer — wraps the new items/ module for use in existing components.
 * Components that already use AlbionItem / COMMON_ITEMS continue to work unchanged.
 */

import {
  getAllItems,
  searchItems as searchNewItems,
  parseItemId as parseNewId,
  getItemIconUrl as getNewIconUrl,
  getItemIconUrlsByTier as getNewIconUrlsByTier,
  type AlbionItem as NewAlbionItem,
} from "./items/index";

export interface AlbionItem {
  UniqueName: string;
  LocalizedNames: Record<string, string> | null;
  LocalizedDescriptions: Record<string, string> | null;
}

function newToOld(item: NewAlbionItem): AlbionItem {
  return {
    UniqueName: item.id,
    LocalizedNames: {
      "EN-US": item.nameEN,
      "FR-FR": item.nameFR,
    },
    LocalizedDescriptions: null,
  };
}

/** Full list of all items */
export const COMMON_ITEMS: AlbionItem[] = getAllItems().map(newToOld);

export async function loadItems(): Promise<AlbionItem[]> {
  return COMMON_ITEMS;
}

export function searchItems(
  items: AlbionItem[],
  query: string,
  locale: string = "EN-US"
): AlbionItem[] {
  const l = locale === "fr" || locale === "FR-FR" ? "fr" : "en";
  return searchNewItems(query, l).map(newToOld);
}

export function getItemName(item: AlbionItem, locale: string = "EN-US"): string {
  const langKey = locale === "fr" ? "FR-FR" : "EN-US";
  return (
    item.LocalizedNames?.[langKey] ||
    item.LocalizedNames?.["EN-US"] ||
    item.UniqueName
  );
}

export function getItemsByTier(items: AlbionItem[], tier: number): AlbionItem[] {
  return items.filter((item) => item.UniqueName.startsWith(`T${tier}_`));
}

export function getItemsByCategory(items: AlbionItem[], category: string): AlbionItem[] {
  const upper = category.toUpperCase();
  return items.filter((item) => item.UniqueName.includes(upper));
}

/** Parses "T4_MAIN_SWORD@2" → { tier: 4, baseId: "T4_MAIN_SWORD", enchant: 2 } */
export function parseItemId(id: string): { tier: number; baseId: string; enchant: number } {
  return parseNewId(id);
}

/** Génère l'URL de l'icône d'un item depuis le CDN officiel d'Albion Online */
export function getItemIconUrl(
  itemOrId: AlbionItem | string,
  options?: import("./items/types").ItemIconOptions
): string {
  const id = typeof itemOrId === "string" ? itemOrId : itemOrId.UniqueName;
  return getNewIconUrl(id, options);
}

/** Génère plusieurs URLs d'icônes pour différents tiers d'un même item */
export function getItemIconUrlsByTier(
  baseItemId: string,
  tiers?: number[],
  options?: import("./items/types").ItemIconOptions
): Record<number, string> {
  return getNewIconUrlsByTier(baseItemId, tiers, options);
}
