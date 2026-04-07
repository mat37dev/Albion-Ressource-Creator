import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db } from '../lib/db';
import { albionItems } from '../lib/db/schema';
import { and, like, not } from 'drizzle-orm';

async function checkBaseItems() {
  console.log('🔍 Checking BASE CROSSBOW items (non-artefacts)...');
  const baseCrossbows = await db
    .select()
    .from(albionItems)
    .where(
      and(
        like(albionItems.id, '%CROSSBOW%'),
        not(like(albionItems.id, '%ARTEFACT%'))
      )
    )
    .limit(20);

  console.log(`Found ${baseCrossbows.length} base crossbow items:`);
  baseCrossbows.forEach(item => {
    console.log(`  ${item.id} | ${item.nameEN} | tier: ${item.tier}`);
  });

  console.log('\n🔍 Checking BASE SHAPESHIFTER items (non-artefacts)...');
  const baseShapeshifters = await db
    .select()
    .from(albionItems)
    .where(
      and(
        like(albionItems.id, '%SHAPESHIFTER%'),
        not(like(albionItems.id, '%ARTEFACT%'))
      )
    )
    .limit(20);

  console.log(`Found ${baseShapeshifters.length} base shapeshifter items:`);
  baseShapeshifters.forEach(item => {
    console.log(`  ${item.id} | ${item.nameEN} | tier: ${item.tier}`);
  });

  process.exit(0);
}

checkBaseItems().catch(console.error);
