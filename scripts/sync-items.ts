/**
 * Script de synchronisation des items Albion Online
 *
 * Source: https://github.com/ao-data/ao-bin-dumps
 *
 * Usage:
 *   npm run sync:items
 *   npm run sync:items -- --dry-run  (pour tester sans écrire en DB)
 */

import { db } from '../lib/db/index';
import { albionItems, albionSyncMetadata } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

const GITHUB_RAW = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master';
const DRY_RUN = process.argv.includes('--dry-run');

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface LocalizationData {
  [key: string]: {
    'EN-US'?: string;
    'FR-FR'?: string;
    'DE-DE'?: string;
    'ES-ES'?: string;
    'PT-BR'?: string;
    'RU-RU'?: string;
    'PL-PL'?: string;
    'ZH-CN'?: string;
  };
}

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────

function parseItemId(id: string): { tier: number; enchant: number; baseId: string } {
  const enchantMatch = id.match(/@(\d)$/);
  const enchant = enchantMatch ? parseInt(enchantMatch[1]) : 0;
  const baseId = enchantMatch ? id.replace(/@\d$/, '') : id;
  const tierMatch = id.match(/^T(\d+)_/);
  const tier = tierMatch ? parseInt(tierMatch[1]) : 0;
  return { tier, baseId, enchant };
}

function detectCategory(id: string): string {
  const upper = id.toUpperCase();

  // Resources
  if (upper.includes('_ORE') || upper.includes('_WOOD') || upper.includes('_FIBER') ||
      upper.includes('_HIDE') || upper.includes('_ROCK')) {
    return 'resource_raw';
  }
  if (upper.includes('_METALBAR') || upper.includes('_PLANKS') || upper.includes('_CLOTH') ||
      upper.includes('_LEATHER') || upper.includes('_STONEBLOCK')) {
    return 'resource_refined';
  }

  // Weapons
  if (upper.includes('_MAIN_') || upper.includes('_2H_')) {
    if (upper.includes('SWORD') || upper.includes('AXE') || upper.includes('MACE') ||
        upper.includes('HAMMER') || upper.includes('SPEAR') || upper.includes('DAGGER') ||
        upper.includes('BOW') || upper.includes('CROSSBOW') || upper.includes('STAFF') ||
        upper.includes('QUARTERSTAFF')) {
      return 'weapon';
    }
  }

  // Armor
  if (upper.includes('_HEAD_') || upper.includes('_ARMOR_') || upper.includes('_SHOES_')) {
    return 'armor';
  }

  // Offhand
  if (upper.includes('_OFF_')) {
    return 'offhand';
  }

  // Consumables
  if (upper.includes('_MEAL_') || upper.includes('_POTION_')) {
    return 'consumable';
  }

  return 'other';
}

function detectSubcategory(id: string): string {
  const upper = id.toUpperCase();

  // Resources
  if (upper.includes('_ORE')) return 'ore';
  if (upper.includes('_WOOD')) return 'wood';
  if (upper.includes('_FIBER')) return 'fiber';
  if (upper.includes('_HIDE')) return 'hide';
  if (upper.includes('_ROCK')) return 'rock';
  if (upper.includes('_METALBAR')) return 'metalbar';
  if (upper.includes('_PLANKS')) return 'planks';
  if (upper.includes('_CLOTH')) return 'cloth';
  if (upper.includes('_LEATHER')) return 'leather';
  if (upper.includes('_STONEBLOCK')) return 'stoneblock';

  // Weapons
  if (upper.includes('SWORD')) return 'sword';
  if (upper.includes('AXE')) return 'axe';
  if (upper.includes('MACE')) return 'mace';
  if (upper.includes('HAMMER')) return 'hammer';
  if (upper.includes('SPEAR')) return 'spear';
  if (upper.includes('DAGGER')) return 'dagger';
  if (upper.includes('BOW')) return 'bow';
  if (upper.includes('CROSSBOW')) return 'crossbow';
  if (upper.includes('QUARTERSTAFF')) return 'quarterstaff';
  if (upper.includes('FIRESTAFF')) return 'fire';
  if (upper.includes('FROSTSTAFF')) return 'frost';
  if (upper.includes('ARCANESTAFF')) return 'arcane';
  if (upper.includes('CURSEDSTAFF')) return 'curse';
  if (upper.includes('HOLYSTAFF')) return 'holy';
  if (upper.includes('NATURESTAFF')) return 'nature';

  // Armor
  if (upper.includes('_PLATE_')) return 'plate';
  if (upper.includes('_LEATHER_')) return 'leather';
  if (upper.includes('_CLOTH_')) return 'cloth';

  // Consumables
  if (upper.includes('_MEAL_')) return 'food';
  if (upper.includes('_POTION_')) return 'potion';

  return 'other';
}

function isArtifact(id: string): boolean {
  const upper = id.toUpperCase();
  return upper.includes('_MORGANA') || upper.includes('_KEEPER') ||
         upper.includes('_HELL') || upper.includes('_UNDEAD') ||
         upper.includes('_AVALON') || upper.includes('_ROYAL') ||
         upper.includes('_CRYSTAL');
}

// ─────────────────────────────────────────────
// FETCHERS
// ─────────────────────────────────────────────

async function fetchItemsList(): Promise<string[]> {
  console.log('📥 Fetching items list from GitHub...');

  const response = await fetch(`${GITHUB_RAW}/formatted/items.txt`);
  if (!response.ok) {
    throw new Error(`Failed to fetch items: ${response.statusText}`);
  }

  const text = await response.text();
  const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));

  console.log(`   Found ${lines.length} item IDs`);
  return lines;
}

async function fetchLocalizations(): Promise<LocalizationData> {
  console.log('📥 Fetching localizations from GitHub...');

  const response = await fetch(`${GITHUB_RAW}/formatted/localization.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch localizations: ${response.statusText}`);
  }

  const data = await response.json();
  const itemLocalizations: LocalizationData = {};

  // Filter only item-related localizations
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && value !== null && 'EN-US' in value) {
      itemLocalizations[key] = value as LocalizationData[string];
    }
  }

  console.log(`   Found ${Object.keys(itemLocalizations).length} localized entries`);
  return itemLocalizations;
}

// ─────────────────────────────────────────────
// SYNC
// ─────────────────────────────────────────────

async function syncItems() {
  const startTime = Date.now();
  let syncId: number | null = null;

  try {
    console.log('🚀 Starting Albion Items Sync');
    console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no DB writes)' : 'LIVE'}`);
    console.log('');

    // Create sync metadata entry
    if (!DRY_RUN) {
      const [metadata] = await db.insert(albionSyncMetadata).values({
        source: 'ao-data/ao-bin-dumps',
        status: 'running',
        syncedAt: new Date(),
      }).returning();
      syncId = metadata.id;
      console.log(`📝 Created sync record #${syncId}`);
    }

    // Fetch data
    const [itemIds, localizations] = await Promise.all([
      fetchItemsList(),
      fetchLocalizations(),
    ]);

    console.log('');
    console.log('🔄 Processing items...');

    let processed = 0;
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    const batchSize = 100;
    const batches = [];

    for (let i = 0; i < itemIds.length; i += batchSize) {
      const batch = itemIds.slice(i, i + batchSize);
      batches.push(batch);
    }

    for (const [batchIndex, batch] of batches.entries()) {
      const itemsToUpsert = [];

      for (const itemId of batch) {
        const { tier, enchant } = parseItemId(itemId);

        // Skip invalid items
        if (tier === 0 || tier > 8) {
          skipped++;
          continue;
        }

        const category = detectCategory(itemId);
        const subcategory = detectSubcategory(itemId);

        // Get localized names (use @ITEMS prefix for items)
        const locKey = `@ITEMS_${itemId}`;
        const loc = localizations[locKey] || localizations[itemId] || {};

        const nameEN = loc['EN-US'] || itemId;
        const nameFR = loc['FR-FR'] || nameEN;

        itemsToUpsert.push({
          id: itemId,
          nameEN,
          nameFR,
          nameDE: loc['DE-DE'] || null,
          nameES: loc['ES-ES'] || null,
          namePT: loc['PT-BR'] || null,
          nameRU: loc['RU-RU'] || null,
          namePL: loc['PL-PL'] || null,
          nameZH: loc['ZH-CN'] || null,
          tier,
          enchant,
          category,
          subcategory,
          isArtifact: isArtifact(itemId),
          iconUrl: `https://render.albiononline.com/v1/item/${itemId}.png`,
          updatedAt: new Date(),
        });

        processed++;
      }

      // Upsert batch
      if (!DRY_RUN && itemsToUpsert.length > 0) {
        for (const item of itemsToUpsert) {
          try {
            await db.insert(albionItems)
              .values(item)
              .onConflictDoUpdate({
                target: albionItems.id,
                set: {
                  nameEN: item.nameEN,
                  nameFR: item.nameFR,
                  nameDE: item.nameDE,
                  nameES: item.nameES,
                  namePT: item.namePT,
                  nameRU: item.nameRU,
                  namePL: item.namePL,
                  nameZH: item.nameZH,
                  tier: item.tier,
                  enchant: item.enchant,
                  category: item.category,
                  subcategory: item.subcategory,
                  isArtifact: item.isArtifact,
                  iconUrl: item.iconUrl,
                  updatedAt: item.updatedAt,
                },
              });
            inserted++;
          } catch (error) {
            console.error(`   ❌ Error upserting ${item.id}:`, error);
            skipped++;
          }
        }
      }

      if ((batchIndex + 1) % 10 === 0 || batchIndex === batches.length - 1) {
        const progress = ((batchIndex + 1) / batches.length * 100).toFixed(1);
        console.log(`   Progress: ${progress}% (${processed}/${itemIds.length} items)`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('✅ Sync completed successfully!');
    console.log(`   Processed: ${processed} items`);
    console.log(`   Inserted/Updated: ${inserted} items`);
    console.log(`   Skipped: ${skipped} items`);
    console.log(`   Duration: ${duration}s`);

    // Update sync metadata
    if (!DRY_RUN && syncId) {
      await db.update(albionSyncMetadata)
        .set({
          status: 'success',
          itemsCount: inserted,
        })
        .where(eq(albionSyncMetadata.id, syncId));
    }

  } catch (error) {
    console.error('');
    console.error('❌ Sync failed:', error);

    // Update sync metadata
    if (!DRY_RUN && syncId) {
      await db.update(albionSyncMetadata)
        .set({
          status: 'error',
          errorMessage: error instanceof Error ? error.message : String(error),
        })
        .where(eq(albionSyncMetadata.id, syncId));
    }

    process.exit(1);
  }
}

// ─────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────

syncItems().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
