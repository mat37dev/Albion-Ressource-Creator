import type { City } from "./cities";

export type ResourceType =
  | "ore"
  | "wood"
  | "fiber"
  | "hide"
  | "stone"
  | "metal"
  | "cloth"
  | "leather"
  | "planks";

export type WeaponCategory =
  | "sword"
  | "axe"
  | "mace"
  | "spear"
  | "bow"
  | "crossbow"
  | "staff"
  | "support"
  | "shield";

export type ArmorCategory = "plate" | "leather" | "cloth";

export interface CityBonuses {
  refine40: ResourceType[];
  craft15: (WeaponCategory | ArmorCategory)[];
}

export const CITY_BONUSES: Record<City, CityBonuses> = {
  Thetford: {
    refine40: ["ore"],
    craft15: ["sword", "mace", "spear"],
  },
  Bridgewatch: {
    refine40: ["stone"],
    craft15: ["plate", "crossbow"],
  },
  Lymhurst: {
    refine40: ["fiber"],
    craft15: ["cloth", "bow", "leather"],
  },
  "Fort Sterling": {
    refine40: ["wood"],
    craft15: ["support", "cloth"],
  },
  Martlock: {
    refine40: ["hide"],
    craft15: ["axe", "cloth"],
  },
  Caerleon: {
    refine40: [],
    craft15: [],
  },
  Brecilien: {
    refine40: [],
    craft15: [],
  },
};

// Base resource return rate
export const BASE_RRR = 0.18;
// City refine bonus
export const CITY_REFINE_BONUS = 0.40;
// City craft bonus
export const CITY_CRAFT_BONUS = 0.15;
// Focus usage bonus (max)
export const FOCUS_BONUS_MAX = 0.59;
// Tax rates
export const DEFAULT_TAX = 0.08;
export const MARKET_TAX = 0.045;
export const SETUP_FEE = 0.025;

// Premium tax rates
export const PREMIUM_TAX_DIRECT = 0.04;      // 4% vente directe premium
export const PREMIUM_TAX_ORDER = 0.065;      // 6.5% ordre de vente premium (2.5% setup + 4%)
export const NON_PREMIUM_TAX_DIRECT = 0.08;  // 8% vente directe standard
export const NON_PREMIUM_TAX_ORDER = 0.105;  // 10.5% ordre de vente standard (2.5% setup + 8%)
