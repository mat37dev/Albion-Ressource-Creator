/**
 * Export central pour les types et utilitaires Albion Online
 *
 * NOTE: Les données hardcodées ont été migrées vers la base de données.
 * Utilisez les APIs /api/items/* et les hooks useAlbionItems() pour charger les données.
 */

import type { AlbionItem, ItemCategory } from "./types";

// ─────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────

export * from "./types";

// ─────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Parse an Albion item ID to extract tier, base ID, and enchantment
 */
export function parseItemId(id: string): {
  tier: number;
  baseId: string;
  enchant: number;
} {
  // Try @ format (e.g. T5_CLOTH@1)
  let enchantMatch = id.match(/@(\d)$/);
  let enchant = enchantMatch ? parseInt(enchantMatch[1]) : 0;
  let baseId = enchantMatch ? id.replace(/@\d$/, "") : id;

  // Try _LEVEL format if @ not found (e.g. T5_CLOTH_LEVEL1)
  if (enchant === 0) {
    enchantMatch = id.match(/_LEVEL(\d)$/);
    if (enchantMatch) {
      enchant = parseInt(enchantMatch[1]);
      baseId = id.replace(/_LEVEL\d$/, "");
    }
  }

  const tierMatch = baseId.match(/^T(\d+)_/);
  const tier = tierMatch ? parseInt(tierMatch[1]) : 0;
  return { tier, baseId, enchant };
}

// ─────────────────────────────────────────────
// ITEM ICON UTILITIES
// ─────────────────────────────────────────────

/**
 * Génère l'URL de l'icône d'un item depuis le CDN officiel d'Albion Online
 *
 * @param itemOrId - L'item Albion ou son ID
 * @param options - Options de personnalisation de l'icône
 * @returns URL de l'icône PNG
 *
 * @example
 * ```ts
 * // Icône par défaut (217px)
 * getItemIconUrl('T4_MAIN_SWORD')
 * // => https://render.albiononline.com/v1/item/T4_MAIN_SWORD.png
 *
 * // Avec enchantement
 * getItemIconUrl('T4_MAIN_SWORD@2')
 * // => https://render.albiononline.com/v1/item/T4_MAIN_SWORD@2.png
 *
 * // Icône personnalisée
 * getItemIconUrl('T5_HEAD_PLATE_SET1', { size: 64, quality: 3 })
 * // => https://render.albiononline.com/v1/item/T5_HEAD_PLATE_SET1.png?size=64&quality=3
 * ```
 */
export function getItemIconUrl(
  itemOrId: AlbionItem | string,
  options?: import("./types").ItemIconOptions
): string {
  const id = typeof itemOrId === "string" ? itemOrId : itemOrId.id;

  // Parse options avec valeurs par défaut
  const {
    size,
    quality,
    includeEnchant = true,
  } = options || {};

  // Construire l'identifiant (avec ou sans enchantement)
  let identifier = id;
  if (!includeEnchant) {
    identifier = identifier.replace(/@\d+$/, "");
  }

  // Construire les query parameters
  const params = new URLSearchParams();
  if (size !== undefined && size >= 1 && size <= 217) {
    params.set("size", size.toString());
  }
  if (quality !== undefined && quality >= 1 && quality <= 5) {
    params.set("quality", quality.toString());
  }

  // Construire l'URL finale
  const queryString = params.toString();
  const baseUrl = `https://render.albiononline.com/v1/item/${identifier}.png`;

  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Génère plusieurs URLs d'icônes pour différents tiers d'un même item
 *
 * @param baseItemId - ID de base sans tier (ex: "MAIN_SWORD")
 * @param tiers - Array de tiers à générer (défaut: [4,5,6,7,8])
 * @param options - Options de personnalisation
 * @returns Map de tier vers URL d'icône
 *
 * @example
 * ```ts
 * getItemIconUrlsByTier('MAIN_SWORD', [4, 5, 6])
 * // => {
 * //   4: 'https://render.albiononline.com/v1/item/T4_MAIN_SWORD.png',
 * //   5: 'https://render.albiononline.com/v1/item/T5_MAIN_SWORD.png',
 * //   6: 'https://render.albiononline.com/v1/item/T6_MAIN_SWORD.png'
 * // }
 * ```
 */
export function getItemIconUrlsByTier(
  baseItemId: string,
  tiers: number[] = [4, 5, 6, 7, 8],
  options?: import("./types").ItemIconOptions
): Record<number, string> {
  const result: Record<number, string> = {};

  for (const tier of tiers) {
    const itemId = `T${tier}_${baseItemId}`;
    result[tier] = getItemIconUrl(itemId, options);
  }

  return result;
}

// ─────────────────────────────────────────────
// CATEGORIES METADATA (Static Data)
// ─────────────────────────────────────────────

export interface CategoryInfo {
  id: ItemCategory;
  subcategories: string[];
}

/**
 * Returns the canonical category/subcategory structure.
 * Use the "items.categories" and "items.subcategories" translation keys for labels.
 */
export function getCategoriesMetadata(): CategoryInfo[] {
  return [
    { id: "resource_raw",      subcategories: ["ore", "wood", "fiber", "hide", "rock"] },
    { id: "resource_refined",  subcategories: ["metalbar", "planks", "cloth", "leather", "stoneblock"] },
    { id: "weapon",            subcategories: ["sword", "axe", "mace", "hammer", "spear", "dagger", "quarterstaff", "bow", "crossbow", "fire", "frost", "arcane", "curse", "holy", "nature", "shapeshifter"] },
    { id: "armor",             subcategories: ["plate", "leather", "cloth"] },
    { id: "offhand",           subcategories: ["shield", "tome", "orb", "torch"] },
    { id: "consumable",        subcategories: ["food", "potion"] },
    { id: "accessory",         subcategories: ["bag", "cape"] },
  ];
}
