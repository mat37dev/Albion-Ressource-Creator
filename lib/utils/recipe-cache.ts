export interface RecipeMaterial {
  materialItemId: string;
  quantity: number;
}

export interface RecipeResult {
  id: string;
  craftingFeeBase?: number;
  materials: RecipeMaterial[];
}

/**
 * Cache module-level pour les recettes.
 * Les recettes sont des données statiques — pas de TTL nécessaire.
 * Persiste pour toute la durée de la session navigateur.
 */
const recipeCache = new Map<string, RecipeResult>();

export async function fetchRecipe(itemId: string): Promise<RecipeResult | null> {
  if (recipeCache.has(itemId)) return recipeCache.get(itemId)!;

  const res = await fetch(`/api/recipes/${itemId}`);
  if (!res.ok) return null;

  const recipe: RecipeResult = await res.json();
  recipeCache.set(itemId, recipe);
  return recipe;
}
