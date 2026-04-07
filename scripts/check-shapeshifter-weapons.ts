import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db } from '../lib/db/index';
import { albionItems, craftRecipes } from '../lib/db/schema';
import { and, like, not } from 'drizzle-orm';

async function checkShapeshifterWeapons() {
  // Check artifacts vs weapons
  console.log('🔍 ARTEFACTS (materials):');
  const artifacts = await db
    .select()
    .from(albionItems)
    .where(
      and(
        like(albionItems.id, '%ARTEFACT%SHAPESHIFTER%'),
        not(like(albionItems.id, '%@%'))
      )
    )
    .limit(10);

  artifacts.forEach(item => {
    console.log(`  ${item.id} | ${item.nameEN}`);
  });

  console.log('\n🔍 WEAPONS (craftable final items):');
  const weapons = await db
    .select()
    .from(albionItems)
    .where(
      and(
        like(albionItems.id, '%2H_SHAPESHIFTER%'),
        not(like(albionItems.id, '%ARTEFACT%')),
        not(like(albionItems.id, '%@%'))
      )
    )
    .limit(20);

  weapons.forEach(item => {
    console.log(`  ${item.id} | ${item.nameEN} | cat: ${item.category} | subcat: ${item.subcategory}`);
  });

  console.log('\n🔍 Checking recipes for WEAPONS (should have recipes):');
  for (const weapon of weapons.slice(0, 5)) {
    const recipe = await db
      .select()
      .from(craftRecipes)
      .where(like(craftRecipes.outputItemId, weapon.id))
      .limit(1);

    const hasRecipe = recipe.length > 0 ? '✅' : '❌';
    console.log(`  ${hasRecipe} ${weapon.id}`);
  }

  console.log('\n🔍 Checking recipes for ARTIFACTS (should NOT have recipes):');
  for (const artifact of artifacts.slice(0, 5)) {
    const recipe = await db
      .select()
      .from(craftRecipes)
      .where(like(craftRecipes.outputItemId, artifact.id))
      .limit(1);

    const hasRecipe = recipe.length > 0 ? '⚠️ YES' : '✅ NO';
    console.log(`  ${hasRecipe} ${artifact.id}`);
  }

  process.exit(0);
}

checkShapeshifterWeapons().catch(console.error);
