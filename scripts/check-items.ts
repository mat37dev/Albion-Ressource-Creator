import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db } from '../lib/db/index';
import { albionItems } from '../lib/db/schema';
import { like } from 'drizzle-orm';

async function checkItems() {
  console.log('🔍 Checking CROSSBOW items...');
  const crossbows = await db
    .select()
    .from(albionItems)
    .where(like(albionItems.id, '%CROSSBOW%'))
    .limit(10);

  console.log(`Found ${crossbows.length} crossbow items:`);
  crossbows.forEach(item => {
    console.log(`  ${item.id} | ${item.nameEN} | category: ${item.category} | subcategory: ${item.subcategory}`);
  });

  console.log('\n🔍 Checking SHAPESHIFTER items...');
  const shapeshifters = await db
    .select()
    .from(albionItems)
    .where(like(albionItems.id, '%SHAPESHIFTER%'))
    .limit(10);

  console.log(`Found ${shapeshifters.length} shapeshifter items:`);
  shapeshifters.forEach(item => {
    console.log(`  ${item.id} | ${item.nameEN} | category: ${item.category} | subcategory: ${item.subcategory}`);
  });

  process.exit(0);
}

checkItems().catch(console.error);
