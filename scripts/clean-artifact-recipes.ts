import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db } from '../lib/db';
import { craftRecipes, craftRecipeMaterials } from '../lib/db/schema';
import { like, eq } from 'drizzle-orm';

async function cleanArtifactRecipes() {
  console.log('🧹 Cleaning artifact recipes from database...\n');

  // Find all artifact recipes
  const artifactRecipes = await db
    .select()
    .from(craftRecipes)
    .where(like(craftRecipes.outputItemId, '%ARTEFACT%'));

  console.log(`Found ${artifactRecipes.length} artifact recipes to delete`);

  for (const recipe of artifactRecipes) {
    console.log(`  Deleting: ${recipe.outputItemId}`);

    // Delete materials first (foreign key)
    await db
      .delete(craftRecipeMaterials)
      .where(eq(craftRecipeMaterials.recipeId, recipe.id));

    // Delete recipe
    await db
      .delete(craftRecipes)
      .where(eq(craftRecipes.id, recipe.id));
  }

  console.log(`\n✅ Deleted ${artifactRecipes.length} artifact recipes`);
  process.exit(0);
}

cleanArtifactRecipes().catch(console.error);
