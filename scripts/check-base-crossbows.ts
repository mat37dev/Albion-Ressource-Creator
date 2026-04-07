import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db } from '../lib/db/index';
import { albionItems, craftRecipes } from '../lib/db/schema';
import { and, like, not, inArray } from 'drizzle-orm';

async function checkBaseCrossbows() {
  // Get all base crossbow items (T4-T8, no enchant)
  console.log('🔍 Looking for T4-T8 base crossbow items (no enchant)...');
  const baseCrossbows = await db
    .select()
    .from(albionItems)
    .where(
      and(
        like(albionItems.id, '%CROSSBOW%'),
        not(like(albionItems.id, '%@%')),
        not(like(albionItems.id, '%ARTEFACT%'))
      )
    );

  console.log(`Found ${baseCrossbows.length} base crossbow items (T4+, no enchant):`);

  // Filter for T4+ and group by tier
  const t4Plus = baseCrossbows
    .filter(item => item.tier >= 4 && item.tier <= 8)
    .sort((a, b) => a.tier - b.tier);

  console.log(`\nT4-T8 base crossbows: ${t4Plus.length}`);
  for (const item of t4Plus) {
    const recipe = await db
      .select()
      .from(craftRecipes)
      .where(and(
        like(craftRecipes.outputItemId, `%${item.id}%`)
      ))
      .limit(1);

    const hasRecipe = recipe.length > 0 ? '✅' : '❌';
    console.log(`  ${hasRecipe} T${item.tier} ${item.id} | ${item.nameEN}`);
  }

  process.exit(0);
}

checkBaseCrossbows().catch(console.error);
