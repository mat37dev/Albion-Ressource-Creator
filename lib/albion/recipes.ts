export interface CraftRecipe {
  outputItem: string;
  outputQuantity: number;
  materials: {
    itemId: string;
    quantity: number;
  }[];
  craftingFeeBase: number; // base fee as % of item value
  category: string;
  tier: number;
}

// Common T4-T6 recipes
export const COMMON_RECIPES: CraftRecipe[] = [
  // Refined materials - Metal bars (from ore)
  {
    outputItem: "T4_METALBAR",
    outputQuantity: 1,
    materials: [{ itemId: "T3_ORE", quantity: 8 }, { itemId: "T4_ORE", quantity: 2 }],
    craftingFeeBase: 0.1125,
    category: "resource",
    tier: 4,
  },
  {
    outputItem: "T5_METALBAR",
    outputQuantity: 1,
    materials: [{ itemId: "T4_ORE", quantity: 8 }, { itemId: "T5_ORE", quantity: 2 }],
    craftingFeeBase: 0.1125,
    category: "resource",
    tier: 5,
  },
  {
    outputItem: "T6_METALBAR",
    outputQuantity: 1,
    materials: [{ itemId: "T5_ORE", quantity: 8 }, { itemId: "T6_ORE", quantity: 2 }],
    craftingFeeBase: 0.1125,
    category: "resource",
    tier: 6,
  },
  // Planks (from wood)
  {
    outputItem: "T4_PLANKS",
    outputQuantity: 1,
    materials: [{ itemId: "T3_WOOD", quantity: 8 }, { itemId: "T4_WOOD", quantity: 2 }],
    craftingFeeBase: 0.1125,
    category: "resource",
    tier: 4,
  },
  {
    outputItem: "T5_PLANKS",
    outputQuantity: 1,
    materials: [{ itemId: "T4_WOOD", quantity: 8 }, { itemId: "T5_WOOD", quantity: 2 }],
    craftingFeeBase: 0.1125,
    category: "resource",
    tier: 5,
  },
  // Cloth (from fiber)
  {
    outputItem: "T4_CLOTH",
    outputQuantity: 1,
    materials: [{ itemId: "T3_FIBER", quantity: 8 }, { itemId: "T4_FIBER", quantity: 2 }],
    craftingFeeBase: 0.1125,
    category: "resource",
    tier: 4,
  },
  {
    outputItem: "T5_CLOTH",
    outputQuantity: 1,
    materials: [{ itemId: "T4_FIBER", quantity: 8 }, { itemId: "T5_FIBER", quantity: 2 }],
    craftingFeeBase: 0.1125,
    category: "resource",
    tier: 5,
  },
  // Leather (from hide)
  {
    outputItem: "T4_LEATHER",
    outputQuantity: 1,
    materials: [{ itemId: "T3_HIDE", quantity: 8 }, { itemId: "T4_HIDE", quantity: 2 }],
    craftingFeeBase: 0.1125,
    category: "resource",
    tier: 4,
  },
  // Weapons
  {
    outputItem: "T4_MAIN_SWORD",
    outputQuantity: 1,
    materials: [
      { itemId: "T4_METALBAR", quantity: 12 },
      { itemId: "T4_PLANKS", quantity: 4 },
    ],
    craftingFeeBase: 0.1125,
    category: "weapon",
    tier: 4,
  },
  {
    outputItem: "T5_MAIN_SWORD",
    outputQuantity: 1,
    materials: [
      { itemId: "T5_METALBAR", quantity: 12 },
      { itemId: "T5_PLANKS", quantity: 4 },
    ],
    craftingFeeBase: 0.1125,
    category: "weapon",
    tier: 5,
  },
  {
    outputItem: "T4_BOW",
    outputQuantity: 1,
    materials: [
      { itemId: "T4_PLANKS", quantity: 12 },
      { itemId: "T4_CLOTH", quantity: 4 },
    ],
    craftingFeeBase: 0.1125,
    category: "weapon",
    tier: 4,
  },
];

export function getRecipeForItem(itemId: string): CraftRecipe | undefined {
  return COMMON_RECIPES.find((r) => r.outputItem === itemId);
}

export function getRecipesByTier(tier: number): CraftRecipe[] {
  return COMMON_RECIPES.filter((r) => r.tier === tier);
}

export function getRecipesByCategory(category: string): CraftRecipe[] {
  return COMMON_RECIPES.filter((r) => r.category === category);
}
