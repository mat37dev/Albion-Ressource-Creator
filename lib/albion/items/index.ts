/**
 * Export central pour tous les items Albion Online
 */

import type { AlbionItem, ItemCategory, ItemFilters } from "./types";
import { getAllResources, getRawResources, getRefinedResources } from "./resources";
import { getAllArmors, getPlateArmors, getLeatherArmors, getClothArmors } from "./armors";
import { getAllWeapons, getArtifactWeapons, getOffhands } from "./weapons";
import { getAllConsumables, getFood, getPotions } from "./consumables";

// ─────────────────────────────────────────────
// RE-EXPORTS
// ─────────────────────────────────────────────

export * from "./types";
export * from "./resources";
export * from "./armors";
export * from "./weapons";
export * from "./consumables";

// ─────────────────────────────────────────────
// CACHE
// ─────────────────────────────────────────────

let _allItemsCache: AlbionItem[] | null = null;

export function getAllItems(): AlbionItem[] {
  if (_allItemsCache) return _allItemsCache;

  _allItemsCache = [
    ...getAllResources(),
    ...getAllArmors(),
    ...getAllWeapons(),
    ...getAllConsumables(),
  ];

  return _allItemsCache;
}

// ─────────────────────────────────────────────
// FILTERING & SEARCH
// ─────────────────────────────────────────────

export function filterItems(filters: ItemFilters): AlbionItem[] {
  let items = getAllItems();

  if (filters.category) {
    items = items.filter((item) => item.category === filters.category);
  }

  if (filters.subcategory) {
    items = items.filter((item) => item.subcategory === filters.subcategory);
  }

  if (filters.tier !== undefined) {
    items = items.filter((item) => item.tier === filters.tier);
  }

  if (filters.enchant !== undefined) {
    items = items.filter((item) => item.enchant === filters.enchant);
  }

  if (filters.set) {
    items = items.filter((item) => item.set === filters.set);
  }

  if (filters.search) {
    const query = filters.search.toLowerCase();
    items = items.filter(
      (item) =>
        item.nameEN.toLowerCase().includes(query) ||
        item.nameFR.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
    );
  }

  return items;
}

export function searchItems(query: string, locale: "fr" | "en" = "en"): AlbionItem[] {
  if (!query.trim()) return [];

  const q = query.toLowerCase();
  const items = getAllItems();

  return items.filter((item) => {
    const name = locale === "fr" ? item.nameFR : item.nameEN;
    return name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
  });
}

export function getItemById(id: string): AlbionItem | undefined {
  return getAllItems().find((item) => item.id === id);
}

export function getItemsByCategory(category: ItemCategory): AlbionItem[] {
  return getAllItems().filter((item) => item.category === category);
}

export function getItemsBySubcategory(subcategory: string): AlbionItem[] {
  return getAllItems().filter((item) => item.subcategory === subcategory);
}

export function getItemsByTier(tier: number): AlbionItem[] {
  return getAllItems().filter((item) => item.tier === tier);
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

export function getItemName(item: AlbionItem, locale: "fr" | "en" = "en"): string {
  return locale === "fr" ? item.nameFR : item.nameEN;
}

export function parseItemId(id: string): {
  tier: number;
  baseId: string;
  enchant: number;
} {
  const enchantMatch = id.match(/@(\d)$/);
  const enchant = enchantMatch ? parseInt(enchantMatch[1]) : 0;
  const baseId = enchantMatch ? id.replace(/@\d$/, "") : id;
  const tierMatch = id.match(/^T(\d+)_/);
  const tier = tierMatch ? parseInt(tierMatch[1]) : 0;
  return { tier, baseId, enchant };
}

// ─────────────────────────────────────────────
// ITEM ICONS
// ─────────────────────────────────────────────

/**
 * Génère l'URL de l'icône d'un item depuis le CDN officiel d'Albion Online
 *
 * @param item - L'item Albion ou son ID
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
 *
 * // Depuis un objet AlbionItem
 * const item = getItemById('T4_MAIN_SWORD@2');
 * getItemIconUrl(item, { size: 100 })
 * // => https://render.albiononline.com/v1/item/T4_MAIN_SWORD@2.png?size=100
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
// CATEGORIES METADATA
// ─────────────────────────────────────────────

export interface CategoryInfo {
  id: ItemCategory;
  nameEN: string;
  nameFR: string;
  subcategories: SubcategoryInfo[];
}

export interface SubcategoryInfo {
  id: string;
  nameEN: string;
  nameFR: string;
}

export function getCategoriesMetadata(): CategoryInfo[] {
  return [
    {
      id: "resource_raw",
      nameEN: "Raw Resources",
      nameFR: "Ressources brutes",
      subcategories: [
        { id: "ore", nameEN: "Ore", nameFR: "Minerai" },
        { id: "wood", nameEN: "Wood", nameFR: "Bois" },
        { id: "fiber", nameEN: "Fiber", nameFR: "Fibres" },
        { id: "hide", nameEN: "Hide", nameFR: "Peaux" },
        { id: "rock", nameEN: "Rock", nameFR: "Pierres" },
      ],
    },
    {
      id: "resource_refined",
      nameEN: "Refined Resources",
      nameFR: "Ressources raffinées",
      subcategories: [
        { id: "metalbar", nameEN: "Metal Bars", nameFR: "Barres de métal" },
        { id: "planks", nameEN: "Planks", nameFR: "Planches" },
        { id: "cloth", nameEN: "Cloth", nameFR: "Tissu" },
        { id: "leather", nameEN: "Leather", nameFR: "Cuir" },
        { id: "stoneblock", nameEN: "Stone Blocks", nameFR: "Blocs de pierre" },
      ],
    },
    {
      id: "weapon",
      nameEN: "Weapons",
      nameFR: "Armes",
      subcategories: [
        { id: "sword", nameEN: "Swords", nameFR: "Épées" },
        { id: "axe", nameEN: "Axes", nameFR: "Haches" },
        { id: "mace", nameEN: "Maces", nameFR: "Masses" },
        { id: "hammer", nameEN: "Hammers", nameFR: "Marteaux" },
        { id: "spear", nameEN: "Spears", nameFR: "Lances" },
        { id: "dagger", nameEN: "Daggers", nameFR: "Dagues" },
        { id: "quarterstaff", nameEN: "Quarterstaffs", nameFR: "Bâtons" },
        { id: "bow", nameEN: "Bows", nameFR: "Arcs" },
        { id: "crossbow", nameEN: "Crossbows", nameFR: "Arbalètes" },
        { id: "fire", nameEN: "Fire Staffs", nameFR: "Bâtons de feu" },
        { id: "frost", nameEN: "Frost Staffs", nameFR: "Bâtons de givre" },
        { id: "arcane", nameEN: "Arcane Staffs", nameFR: "Bâtons arcaniques" },
        { id: "curse", nameEN: "Curse Staffs", nameFR: "Bâtons maudits" },
        { id: "holy", nameEN: "Holy Staffs", nameFR: "Bâtons saints" },
        { id: "nature", nameEN: "Nature Staffs", nameFR: "Bâtons de nature" },
        { id: "shapeshifter", nameEN: "Shapeshifter", nameFR: "Métamorphe" },
      ],
    },
    {
      id: "armor",
      nameEN: "Armor",
      nameFR: "Armures",
      subcategories: [
        { id: "plate", nameEN: "Plate Armor", nameFR: "Armure en plaques" },
        { id: "leather", nameEN: "Leather Armor", nameFR: "Armure en cuir" },
        { id: "cloth", nameEN: "Cloth Armor", nameFR: "Armure en tissu" },
      ],
    },
    {
      id: "offhand",
      nameEN: "Offhand",
      nameFR: "Main gauche",
      subcategories: [
        { id: "shield", nameEN: "Shields", nameFR: "Boucliers" },
        { id: "tome", nameEN: "Tomes", nameFR: "Tomes" },
        { id: "orb", nameEN: "Orbs", nameFR: "Orbes" },
        { id: "torch", nameEN: "Torches", nameFR: "Torches" },
      ],
    },
    {
      id: "consumable",
      nameEN: "Consumables",
      nameFR: "Consommables",
      subcategories: [
        { id: "food", nameEN: "Food", nameFR: "Nourriture" },
        { id: "potion", nameEN: "Potions", nameFR: "Potions" },
      ],
    },
  ];
}

// ─────────────────────────────────────────────
// POPULAR ITEMS FOR SCANS
// ─────────────────────────────────────────────

export function getPopularScanItems(): string[] {
  const items = getAllItems();
  return items
    .filter((item) => {
      // All T4-T7 resources (raw + refined)
      if (
        (item.category === "resource_raw" || item.category === "resource_refined") &&
        item.tier >= 4 &&
        item.tier <= 7
      ) {
        return true;
      }
      // T4-T6 base weapons and armor (enchant 0 and 1)
      if (
        (item.category === "weapon" || item.category === "armor") &&
        item.tier >= 4 &&
        item.tier <= 6 &&
        item.enchant <= 1
      ) {
        return true;
      }
      return false;
    })
    .map((item) => item.id);
}
