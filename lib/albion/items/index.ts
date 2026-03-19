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
  const enchantMatch = id.match(/@(\d)$/);
  const enchant = enchantMatch ? parseInt(enchantMatch[1]) : 0;
  const baseId = enchantMatch ? id.replace(/@\d$/, "") : id;
  const tierMatch = id.match(/^T(\d+)_/);
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
  nameEN: string;
  nameFR: string;
  subcategories: SubcategoryInfo[];
}

export interface SubcategoryInfo {
  id: string;
  nameEN: string;
  nameFR: string;
}

/**
 * Returns static metadata about item categories and subcategories.
 * This is NOT dynamic data - it's the canonical category structure.
 */
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
