import {db} from "@/lib/db";
import {craftRecipeMaterials, craftRecipes} from "@/lib/db/schema";
import {and, eq} from "drizzle-orm";

export interface RecipeWithMaterials {
  id: string;
  outputItemId: string;
  outputQuantity: number;
  category: string;
  tier: number;
  enchantmentLevel: number;
  craftingFeeBase: number;
  craftingTime: number | null;
  craftingFocus: number | null;
  silverCost: number | null;
  variantGroup: string | null;
  variantName: string | null;
  isDefault: boolean | null;
  materials: Array<{
    id: string;
    materialItemId: string;
    quantity: number;
    sortOrder: number | null;
  }>;
}

/**
 * Récupère la recette par défaut pour un item (enchantement 0)
 */
export async function getRecipeForItem(itemId: string): Promise<RecipeWithMaterials | null> {
  // Remove enchantment suffix if present
  const baseItemId = itemId.replace(/@\d$/, '');

  const recipes = await db
    .select()
    .from(craftRecipes)
    .where(
      and(
        eq(craftRecipes.outputItemId, baseItemId),
        eq(craftRecipes.enchantmentLevel, 0),
        eq(craftRecipes.isDefault, true)
      )
    )
    .limit(1);

  if (recipes.length === 0) return null;

  const recipe = recipes[0];
  const materials = await db
    .select()
    .from(craftRecipeMaterials)
    .where(eq(craftRecipeMaterials.recipeId, recipe.id))
    .orderBy(craftRecipeMaterials.sortOrder);

  return { ...recipe, materials };
}

/**
 * Récupère toutes les variantes de recettes pour un item (incluant les enchantements)
 */
export async function getRecipeVariants(itemId: string): Promise<RecipeWithMaterials[]> {
  // Remove enchantment suffix if present
  const baseItemId = itemId.replace(/@\d$/, '');

  // Get all recipes with same base ID (different enchantment levels)
  const recipes = await db
    .select()
    .from(craftRecipes)
    .where(eq(craftRecipes.outputItemId, baseItemId));

  // Also get enchanted versions
  const enchantedRecipes = await db
    .select()
    .from(craftRecipes)
    .where(eq(craftRecipes.outputItemId, `${baseItemId}@1`));

  const allRecipes = [...recipes, ...enchantedRecipes];

  return await Promise.all(
      allRecipes.map(async (recipe) => {
        const materials = await db
            .select()
            .from(craftRecipeMaterials)
            .where(eq(craftRecipeMaterials.recipeId, recipe.id))
            .orderBy(craftRecipeMaterials.sortOrder);
        return {...recipe, materials};
      })
  );
}

/**
 * Récupère une recette par son ID
 */
export async function getRecipeById(recipeId: string): Promise<RecipeWithMaterials | null> {
  const recipes = await db
    .select()
    .from(craftRecipes)
    .where(eq(craftRecipes.id, recipeId))
    .limit(1);

  if (recipes.length === 0) return null;

  const materials = await db
    .select()
    .from(craftRecipeMaterials)
    .where(eq(craftRecipeMaterials.recipeId, recipeId))
    .orderBy(craftRecipeMaterials.sortOrder);

  return { ...recipes[0], materials };
}

/**
 * Récupère une recette pour un item avec un niveau d'enchantement spécifique
 */
export async function getRecipeByItemAndEnchant(
  itemId: string,
  enchantLevel: number
): Promise<RecipeWithMaterials | null> {
  const outputId = enchantLevel > 0 ? `${itemId}@${enchantLevel}` : itemId;

  const recipes = await db
    .select()
    .from(craftRecipes)
    .where(
      and(
        eq(craftRecipes.outputItemId, outputId),
        eq(craftRecipes.enchantmentLevel, enchantLevel)
      )
    )
    .limit(1);

  if (recipes.length === 0) return null;

  const materials = await db
    .select()
    .from(craftRecipeMaterials)
    .where(eq(craftRecipeMaterials.recipeId, recipes[0].id))
    .orderBy(craftRecipeMaterials.sortOrder);

  return { ...recipes[0], materials };
}

/**
 * Vérifie si un item est un item royal/faction (multiple variantes)
 */
export async function isRoyalItem(itemId: string): Promise<boolean> {
  return (
    itemId.includes("_ROYAL") ||
    itemId.includes("_UNDEAD") ||
    itemId.includes("_HELL") ||
    itemId.includes("_KEEPER") ||
    itemId.includes("_AVALON") ||
    itemId.includes("_CRYSTAL")
  );
}

/**
 * Récupère toutes les variantes royales pour un groupe d'items
 */
export async function getRoyalVariants(variantGroup: string): Promise<RecipeWithMaterials[]> {
  const recipes = await db
    .select()
    .from(craftRecipes)
    .where(eq(craftRecipes.variantGroup, variantGroup));

  return await Promise.all(
      recipes.map(async (recipe) => {
        const materials = await db
            .select()
            .from(craftRecipeMaterials)
            .where(eq(craftRecipeMaterials.recipeId, recipe.id))
            .orderBy(craftRecipeMaterials.sortOrder);
        return {...recipe, materials};
      })
  );
}
