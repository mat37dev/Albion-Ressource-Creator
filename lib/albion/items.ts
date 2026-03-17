/**
 * Compatibility layer — wraps the new itemsList.ts for use in existing components.
 * Components that already use AlbionItem / COMMON_ITEMS continue to work unchanged.
 */

import { getAllItems, searchItemDefs, type AlbionItemDef } from "./itemsList";

export interface AlbionItem {
  UniqueName: string;
  LocalizedNames: Record<string, string> | null;
  LocalizedDescriptions: Record<string, string> | null;
}

function defToItem(def: AlbionItemDef): AlbionItem {
  return {
    UniqueName: def.id,
    LocalizedNames: {
      "EN-US": def.nameEN,
      "FR-FR": def.nameFR,
    },
    LocalizedDescriptions: null,
  };
}

/** Full list of ~1 700 items (resources T1-T8 + equipment T4-T8 with enchants) */
export const COMMON_ITEMS: AlbionItem[] = getAllItems().map(defToItem);

export async function loadItems(): Promise<AlbionItem[]> {
  return COMMON_ITEMS;
}

export function searchItems(
  items: AlbionItem[],
  query: string,
  locale: string = "EN-US"
): AlbionItem[] {
  const l = locale === "fr" || locale === "FR-FR" ? "fr" : "en";
  return searchItemDefs(query, l).map(defToItem);
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
  const enchantMatch = id.match(/@(\d)$/);
  const enchant = enchantMatch ? parseInt(enchantMatch[1]) : 0;
  const baseId = enchantMatch ? id.replace(/@\d$/, "") : id;
  const tierMatch = id.match(/^T(\d+)_/);
  const tier = tierMatch ? parseInt(tierMatch[1]) : 0;
  return { tier, baseId, enchant };
}
