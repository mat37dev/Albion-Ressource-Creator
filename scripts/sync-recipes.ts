/**
 * Script de synchronisation des recettes de craft Albion Online
 *
 * Source: https://github.com/ao-data/ao-bin-dumps (items.json)
 *
 * Usage:
 *   npm run sync:recipes
 *   npm run sync:recipes -- --dry-run  (pour tester sans écrire en DB)
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db } from '../lib/db/index';
import { craftRecipes, craftRecipeMaterials } from '../lib/db/schema';
import { eq, and } from 'drizzle-orm';

const GITHUB_RAW = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master';
const DRY_RUN = process.argv.includes('--dry-run');

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface CraftResource {
  '@uniquename': string;
  '@count': string;
}

interface CraftingRequirements {
  '@time'?: string;
  '@craftingfocus'?: string;
  '@silver'?: string;
  '@amountcrafted'?: string;
  craftresource?: CraftResource | CraftResource[];
}

interface AlbionItemData {
  '@uniquename': string;
  craftingrequirements?: CraftingRequirements | CraftingRequirements[];
  enchantments?: {
    enchantment?: Array<{
      '@enchantmentlevel': string;
      craftingrequirements?: CraftingRequirements | CraftingRequirements[];
    }>;
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

function detectVariantInfo(id: string): { variantGroup?: string; variantName?: string } {
  const upper = id.toUpperCase();

  // Royal items
  if (upper.includes('_ROYAL')) {
    const baseId = id.split('_ROYAL')[0] + '_ROYAL';
    return {
      variantGroup: baseId,
      variantName: 'Royal',
    };
  }

  // Faction items (Keeper, Undead, Morgana, Avalon, etc.)
  const factionPatterns = [
    { pattern: '_UNDEAD', name: 'Undead' },
    { pattern: '_HELL', name: 'Morgana' },
    { pattern: '_KEEPER', name: 'Keeper' },
    { pattern: '_AVALON', name: 'Avalonian' },
    { pattern: '_CRYSTAL', name: 'Crystalline' },
  ];

  for (const { pattern, name } of factionPatterns) {
    if (upper.includes(pattern)) {
      const baseId = id.split(pattern)[0] + pattern;
      return {
        variantGroup: baseId,
        variantName: name,
      };
    }
  }

  return {};
}

function normalizeCraftResources(craftresource: CraftResource | CraftResource[]): CraftResource[] {
  return Array.isArray(craftresource) ? craftresource : [craftresource];
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function syncRecipes() {
  console.log("🔄 Synchronisation des recettes de craft depuis ao-bin-dumps...\n");

  if (DRY_RUN) {
    console.log("⚠️  MODE DRY-RUN : Aucune écriture en base de données\n");
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // 1. Fetch items.json (root, not formatted - contains crafting data)
    console.log("📥 Téléchargement de items.json...");
    const itemsUrl = `${GITHUB_RAW}/items.json`;
    const response = await fetch(itemsUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const rawData = await response.json();

    // The JSON structure is: { items: { simpleitem: [...], equipmentitem: [...], ... } }
    const itemsRoot = rawData.items || {};
    const allItems: AlbionItemData[] = [
      ...(Array.isArray(itemsRoot.simpleitem) ? itemsRoot.simpleitem : []),
      ...(Array.isArray(itemsRoot.equipmentitem) ? itemsRoot.equipmentitem : []),
      ...(Array.isArray(itemsRoot.weapon) ? itemsRoot.weapon : []),
      ...(Array.isArray(itemsRoot.consumableitem) ? itemsRoot.consumableitem : []),
      ...(Array.isArray(itemsRoot.farmableitem) ? itemsRoot.farmableitem : []),
    ];

    console.log(`✅ ${allItems.length} items chargés\n`);

    // 2. Filter items with crafting requirements
    const craftableItems = allItems.filter(item => item.craftingrequirements);
    console.log(`🔧 ${craftableItems.length} items craftables trouvés\n`);

    // 3. Process each craftable item
    for (const item of craftableItems) {
      const itemId = item['@uniquename'];
      const { tier, baseId, enchant } = parseItemId(itemId);
      const category = detectCategory(itemId);
      const { variantGroup, variantName } = detectVariantInfo(itemId);

      // Skip non-standard items
      if (tier === 0 || category === 'other') {
        skipped++;
        continue;
      }

      try {
        // Process base recipe (enchant 0)
        if (item.craftingrequirements) {
          // craftingrequirements can be an array (multiple recipes) - take the first one
          const reqs = Array.isArray(item.craftingrequirements)
            ? item.craftingrequirements
            : [item.craftingrequirements];

          const req = reqs[0]; // Use first recipe (main one)
          const materials = req.craftresource ? normalizeCraftResources(req.craftresource) : [];

          if (materials.length > 0) {
            await insertOrUpdateRecipe({
              outputItemId: itemId,
              outputQuantity: parseInt(req['@amountcrafted'] || '1'),
              category,
              tier,
              enchantmentLevel: 0,
              craftingTime: req['@time'] ? parseFloat(req['@time']) : null,
              craftingFocus: req['@craftingfocus'] ? parseInt(req['@craftingfocus']) : null,
              silverCost: req['@silver'] ? parseFloat(req['@silver']) : null,
              variantGroup,
              variantName,
              materials: materials.map((m, idx) => ({
                materialItemId: m['@uniquename'],
                quantity: parseInt(m['@count']),
                sortOrder: idx,
              })),
            });

            inserted++;
            if (inserted % 100 === 0) {
              console.log(`   ... ${inserted} recettes traitées`);
            }
          }
        }

        // Process enchanted recipes (enchant 1-4)
        if (item.enchantments?.enchantment) {
          const enchantments = Array.isArray(item.enchantments.enchantment)
            ? item.enchantments.enchantment
            : [item.enchantments.enchantment];

          for (const enchant of enchantments) {
            const enchantLevel = parseInt(enchant['@enchantmentlevel']);
            const craftReqs = enchant.craftingrequirements;

            if (craftReqs) {
              // craftingrequirements can be an array - take the first one
              const reqs = Array.isArray(craftReqs) ? craftReqs : [craftReqs];
              const req = reqs[0];

              if (req && req.craftresource) {
                const materials = normalizeCraftResources(req.craftresource);
                const enchantedItemId = `${itemId}@${enchantLevel}`;

                await insertOrUpdateRecipe({
                  outputItemId: enchantedItemId,
                  outputQuantity: parseInt(req['@amountcrafted'] || '1'),
                  category,
                  tier,
                  enchantmentLevel: enchantLevel,
                  craftingTime: req['@time'] ? parseFloat(req['@time']) : null,
                  craftingFocus: req['@craftingfocus'] ? parseInt(req['@craftingfocus']) : null,
                  silverCost: req['@silver'] ? parseFloat(req['@silver']) : null,
                  variantGroup,
                  variantName,
                  materials: materials.map((m, idx) => ({
                    materialItemId: m['@uniquename'],
                    quantity: parseInt(m['@count']),
                    sortOrder: idx,
                  })),
                });

                inserted++;
              }
            }
          }
        }

      } catch (error) {
        errors++;
        console.error(`❌ Erreur pour ${itemId}:`, error instanceof Error ? error.message : error);
      }
    }

    console.log("\n✅ Synchronisation terminée !");
    console.log(`   📊 Recettes insérées/mises à jour: ${inserted}`);
    console.log(`   ⏭️  Recettes ignorées: ${skipped}`);
    console.log(`   ❌ Erreurs: ${errors}`);

  } catch (error) {
    console.error("\n❌ Erreur lors de la synchronisation:");
    console.error(error);
    process.exit(1);
  }
}

async function insertOrUpdateRecipe(recipe: {
  outputItemId: string;
  outputQuantity: number;
  category: string;
  tier: number;
  enchantmentLevel: number;
  craftingTime: number | null;
  craftingFocus: number | null;
  silverCost: number | null;
  variantGroup?: string;
  variantName?: string;
  materials: Array<{
    materialItemId: string;
    quantity: number;
    sortOrder: number;
  }>;
}) {
  if (DRY_RUN) return;

  try {
    // Check if recipe exists
    const existing = await db
      .select()
      .from(craftRecipes)
      .where(
        and(
          eq(craftRecipes.outputItemId, recipe.outputItemId),
          eq(craftRecipes.enchantmentLevel, recipe.enchantmentLevel)
        )
      )
      .limit(1);

    let recipeId: string;

    if (existing.length > 0) {
      // Update existing recipe
      recipeId = existing[0].id;
      await db
        .update(craftRecipes)
        .set({
          outputQuantity: recipe.outputQuantity,
          category: recipe.category,
          tier: recipe.tier,
          craftingTime: recipe.craftingTime,
          craftingFocus: recipe.craftingFocus,
          silverCost: recipe.silverCost,
          variantGroup: recipe.variantGroup || null,
          variantName: recipe.variantName || null,
          updatedAt: new Date(),
        })
        .where(eq(craftRecipes.id, recipeId));

      // Delete old materials
      await db
        .delete(craftRecipeMaterials)
        .where(eq(craftRecipeMaterials.recipeId, recipeId));

    } else {
      // Insert new recipe
      const [newRecipe] = await db
        .insert(craftRecipes)
        .values({
          outputItemId: recipe.outputItemId,
          outputQuantity: recipe.outputQuantity,
          category: recipe.category,
          tier: recipe.tier,
          enchantmentLevel: recipe.enchantmentLevel,
          craftingTime: recipe.craftingTime,
          craftingFocus: recipe.craftingFocus,
          silverCost: recipe.silverCost,
          variantGroup: recipe.variantGroup || null,
          variantName: recipe.variantName || null,
          isDefault: recipe.enchantmentLevel === 0,
        })
        .returning();

      recipeId = newRecipe.id;
    }

    // Insert materials
    for (const material of recipe.materials) {
      await db.insert(craftRecipeMaterials).values({
        recipeId,
        materialItemId: material.materialItemId,
        quantity: material.quantity,
        sortOrder: material.sortOrder,
      });
    }

  } catch (error) {
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  syncRecipes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error syncing recipes:", error);
      process.exit(1);
    });
}

export { syncRecipes };
