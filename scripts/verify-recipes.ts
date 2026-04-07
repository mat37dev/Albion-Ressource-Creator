/**
 * Script de vérification des recettes importées
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db } from '../lib/db';
import { craftRecipes, craftRecipeMaterials } from '../lib/db/schema';
import { sql, eq } from 'drizzle-orm';

async function verify() {
  console.log("🔍 Vérification des recettes importées...\n");

  try {
    // Total count
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(craftRecipes);
    console.log(`📊 Total recettes: ${totalCount[0].count}`);

    // By category
    const byCategory = await db
      .select({
        category: craftRecipes.category,
        count: sql<number>`count(*)`
      })
      .from(craftRecipes)
      .groupBy(craftRecipes.category);

    console.log("\n📂 Recettes par catégorie:");
    for (const row of byCategory) {
      console.log(`   ${row.category}: ${row.count}`);
    }

    // By tier
    const byTier = await db
      .select({
        tier: craftRecipes.tier,
        count: sql<number>`count(*)`
      })
      .from(craftRecipes)
      .groupBy(craftRecipes.tier)
      .orderBy(craftRecipes.tier);

    console.log("\n🎯 Recettes par tier:");
    for (const row of byTier) {
      console.log(`   T${row.tier}: ${row.count}`);
    }

    // By enchantment level
    const byEnchant = await db
      .select({
        enchantLevel: craftRecipes.enchantmentLevel,
        count: sql<number>`count(*)`
      })
      .from(craftRecipes)
      .groupBy(craftRecipes.enchantmentLevel)
      .orderBy(craftRecipes.enchantmentLevel);

    console.log("\n✨ Recettes par enchantement:");
    for (const row of byEnchant) {
      console.log(`   @${row.enchantLevel}: ${row.count}`);
    }

    // Sample recipe: T4_METALBAR
    console.log("\n📝 Exemple: T4_METALBAR");
    const recipe = await db
      .select()
      .from(craftRecipes)
      .where(eq(craftRecipes.outputItemId, 'T4_METALBAR'))
      .limit(1);

    if (recipe.length > 0) {
      const materials = await db
        .select()
        .from(craftRecipeMaterials)
        .where(eq(craftRecipeMaterials.recipeId, recipe[0].id));

      console.log(`   Output: ${recipe[0].outputItemId} x${recipe[0].outputQuantity}`);
      console.log(`   Category: ${recipe[0].category} | Tier: ${recipe[0].tier}`);
      console.log(`   Enchant: @${recipe[0].enchantmentLevel}`);
      console.log(`   Time: ${recipe[0].craftingTime}s | Focus: ${recipe[0].craftingFocus}`);
      console.log(`   Materials:`);
      for (const mat of materials) {
        console.log(`     - ${mat.materialItemId} x${mat.quantity}`);
      }
    }

    // Sample enchanted recipe
    console.log("\n✨ Exemple: T4_MAIN_SWORD@1");
    const enchantedRecipe = await db
      .select()
      .from(craftRecipes)
      .where(eq(craftRecipes.outputItemId, 'T4_MAIN_SWORD@1'))
      .limit(1);

    if (enchantedRecipe.length > 0) {
      const materials = await db
        .select()
        .from(craftRecipeMaterials)
        .where(eq(craftRecipeMaterials.recipeId, enchantedRecipe[0].id));

      console.log(`   Output: ${enchantedRecipe[0].outputItemId} x${enchantedRecipe[0].outputQuantity}`);
      console.log(`   Enchant: @${enchantedRecipe[0].enchantmentLevel}`);
      console.log(`   Materials:`);
      for (const mat of materials) {
        console.log(`     - ${mat.materialItemId} x${mat.quantity}`);
      }
    }

    console.log("\n✅ Vérification terminée !");

  } catch (error) {
    console.error("\n❌ Erreur:", error);
    process.exit(1);
  }

  process.exit(0);
}

verify();
