/**
 * Script de test de connexion à la base de données
 *
 * Usage: tsx scripts/test-db.ts
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db } from '../lib/db/index';
import { albionItems, albionSyncMetadata } from '../lib/db/schema';
import { sql, count } from 'drizzle-orm';

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    console.log('');

    // Test 1: Count items
    console.log('Test 1: Check albion_items table');
    try {
      const itemCount = await db.select({ value: count() }).from(albionItems);
      console.log('✅ Items in database:', itemCount[0].value);

      if (itemCount[0].value > 0) {
        console.log('');
        console.log('Test 2: Sample items');
        const samples = await db.select().from(albionItems).limit(5);
        console.log('✅ Sample items:');
        samples.forEach((item) => {
          console.log(`   - ${item.id}: ${item.nameEN} (${item.nameFR})`);
        });

        console.log('');
        console.log('Test 3: Items by tier');
        const tiers = await db
          .select({
            tier: albionItems.tier,
            count: count(),
          })
          .from(albionItems)
          .groupBy(albionItems.tier)
          .orderBy(albionItems.tier);

        console.log('✅ Items per tier:');
        tiers.forEach((row) => {
          console.log(`   - T${row.tier}: ${row.count} items`);
        });
      } else {
        console.log('ℹ️  Database is empty. Run: npm run sync:items');
      }
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        console.log('⚠️  Table albion_items does not exist yet.');
        console.log('   Run the migration first: npm run db:push');
      } else {
        throw error;
      }
    }

    console.log('');
    console.log('Test 4: Check sync metadata');
    try {
      const syncs = await db
        .select()
        .from(albionSyncMetadata)
        .orderBy(sql`${albionSyncMetadata.syncedAt} DESC`)
        .limit(5);

      if (syncs.length > 0) {
        console.log('✅ Recent syncs:');
        syncs.forEach((sync) => {
          const date = sync.syncedAt?.toISOString().split('T')[0] || 'N/A';
          console.log(`   - ${date}: ${sync.status} (${sync.itemsCount || 0} items)`);
        });
      } else {
        console.log('ℹ️  No sync history yet');
      }
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        console.log('⚠️  Table albion_sync_metadata does not exist yet.');
      } else {
        throw error;
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('✅ All tests passed! Database is ready.');
    console.log('═══════════════════════════════════════');

  } catch (error) {
    console.error('');
    console.error('❌ Database connection failed!');
    console.error('');
    console.error('Error:', error);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check that DATABASE_URL is set in .env.local');
    console.error('2. Verify your Vercel Postgres credentials');
    console.error('3. Make sure you ran the migrations: npm run db:push');
    console.error('');
    process.exit(1);
  }
}

testConnection();
