import { db } from "@/lib/db";
import { craftRecipes } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

/**
 * Récupère la liste des IDs d'items qui ont au moins une recette de craft
 */
export async function getCraftableItemIds(): Promise<string[]> {
  const recipes = await db
    .selectDistinct({ outputItemId: craftRecipes.outputItemId })
    .from(craftRecipes);

  return recipes.map(r => r.outputItemId);
}

/**
 * Compte le nombre d'items craftables
 */
export async function getCraftableItemsCount(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(distinct ${craftRecipes.outputItemId})` })
    .from(craftRecipes);

  return Number(result[0]?.count || 0);
}
