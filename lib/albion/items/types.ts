/**
 * Types partagés pour le système d'items Albion Online
 */

export type ItemCategory =
  | "resource_raw"
  | "resource_refined"
  | "weapon"
  | "armor"
  | "offhand"
  | "cape"
  | "bag"
  | "consumable"
  | "mount"
  | "accessory";

export type WeaponSubcategory =
  // Melee
  | "sword"
  | "axe"
  | "mace"
  | "hammer"
  | "spear"
  | "dagger"
  | "quarterstaff"
  // Ranged
  | "bow"
  | "crossbow"
  // Magic
  | "arcane"
  | "curse"
  | "fire"
  | "frost"
  | "holy"
  | "nature"
  // Shapeshifter
  | "shapeshifter";

export type ArmorSubcategory = "plate" | "leather" | "cloth";

export type ArmorSet = "SET1" | "SET2" | "SET3";

export type ResourceSubcategory =
  | "ore"
  | "wood"
  | "fiber"
  | "hide"
  | "rock"
  | "metalbar"
  | "planks"
  | "cloth"
  | "leather"
  | "stoneblock";

export type ConsumableSubcategory =
  | "food"
  | "potion"
  | "other";

export interface AlbionItem {
  id: string;
  nameEN: string;
  nameFR: string;
  tier: number;
  enchant: number; // 0 = base, 1/2/3/4 = enchanted
  category: ItemCategory;
  subcategory: string;
  /** Pour les armures : SET1, SET2, SET3 */
  set?: ArmorSet;
  /** Pour identifier les artefacts */
  isArtifact?: boolean;
}

/**
 * Options pour la génération d'URL d'icône d'item
 */
export interface ItemIconOptions {
  /** Taille de l'icône en pixels (1-217, défaut: 217) */
  size?: number;
  /** Niveau de qualité (1-5, défaut: aucun) */
  quality?: number;
  /** Inclure le niveau d'enchantement dans l'URL (défaut: true) */
  includeEnchant?: boolean;
}

export interface ItemFilters {
  category?: ItemCategory;
  subcategory?: string;
  tier?: number;
  enchant?: number;
  set?: ArmorSet;
  search?: string;
}
