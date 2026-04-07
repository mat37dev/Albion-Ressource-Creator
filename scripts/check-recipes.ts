import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db } from '../lib/db/index';
import { craftRecipes } from '../lib/db/schema';
import { like, and, not } from 'drizzle-orm';

async function checkRecipes() {
  console.log('🔍 Checking CROSSBOW recipes...');
  const crossbowRecipes = await db
    .select()
    .from(craftRecipes)
    .where(like(craftRecipes.outputItemId, '%CROSSBOW%'))
    .limit(10);

  console.log(`Found ${crossbowRecipes.length} crossbow recipes`);
  crossbowRecipes.forEach(r => {
    console.log(`  ${r.outputItemId}`);
  });

  console.log('\n🔍 Checking SHAPESHIFTER recipes...');
  const shapeshifterRecipes = await db
    .select()
    .from(craftRecipes)
    .where(like(craftRecipes.outputItemId, '%SHAPESHIFTER%'))
    .limit(10);

  console.log(`Found ${shapeshifterRecipes.length} shapeshifter recipes`);
  shapeshifterRecipes.forEach(r => {
    console.log(`  ${r.outputItemId}`);
  });

  // Check for base items (non-artefacts, non-enchanted)
  console.log('\n🔍 Checking BASE SHAPESHIFTER recipes (T4-T8, no enchant, non-artefact)...');
  const baseShapeshifterRecipes = await db
    .select()
    .from(craftRecipes)
    .where(
      and(
        like(craftRecipes.outputItemId, '%SHAPESHIFTER%'),
        not(like(craftRecipes.outputItemId, '%@%')),
        not(like(craftRecipes.outputItemId, '%ARTEFACT%'))
      )
    )
    .limit(20);

  console.log(`Found ${baseShapeshifterRecipes.length} base shapeshifter recipes`);
  baseShapeshifterRecipes.forEach(r => {
    console.log(`  ${r.outputItemId}`);
  });

  process.exit(0);
}

checkRecipes().catch(console.error);
