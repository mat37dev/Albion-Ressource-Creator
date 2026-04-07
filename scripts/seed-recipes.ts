/**
 * Seed script for craft recipes
 *
 * This script seeds common craft recipes for:
 * - Refined resources (T4-T8 bars, planks, cloth, leather)
 * - Popular weapons (T4-T6 swords, bows, axes, hammers, crossbows)
 * - Popular armors (T4-T6 plate, leather, cloth)
 *
 * Run with: npx tsx scripts/seed-recipes.ts
 */

import { db } from '../lib/db';
import { craftRecipes, craftRecipeMaterials } from "../lib/db/schema";

interface RecipeDefinition {
  outputItemId: string;
  outputQuantity: number;
  category: string;
  tier: number;
  materials: { itemId: string; quantity: number }[];
  variantGroup?: string;
  variantName?: string;
}

const recipes: RecipeDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────
  // REFINED RESOURCES (T4-T8)
  // ──────────────────────────────────────────────────────────────────────

  // Metal Bars
  {
    outputItemId: "T4_METALBAR",
    outputQuantity: 1,
    category: "resource",
    tier: 4,
    materials: [
      { itemId: "T3_ORE", quantity: 8 },
      { itemId: "T4_ORE", quantity: 2 },
    ],
  },
  {
    outputItemId: "T5_METALBAR",
    outputQuantity: 1,
    category: "resource",
    tier: 5,
    materials: [
      { itemId: "T4_ORE", quantity: 8 },
      { itemId: "T5_ORE", quantity: 2 },
    ],
  },
  {
    outputItemId: "T6_METALBAR",
    outputQuantity: 1,
    category: "resource",
    tier: 6,
    materials: [
      { itemId: "T5_ORE", quantity: 8 },
      { itemId: "T6_ORE", quantity: 2 },
    ],
  },

  // Planks
  {
    outputItemId: "T4_PLANKS",
    outputQuantity: 1,
    category: "resource",
    tier: 4,
    materials: [
      { itemId: "T3_WOOD", quantity: 8 },
      { itemId: "T4_WOOD", quantity: 2 },
    ],
  },
  {
    outputItemId: "T5_PLANKS",
    outputQuantity: 1,
    category: "resource",
    tier: 5,
    materials: [
      { itemId: "T4_WOOD", quantity: 8 },
      { itemId: "T5_WOOD", quantity: 2 },
    ],
  },
  {
    outputItemId: "T6_PLANKS",
    outputQuantity: 1,
    category: "resource",
    tier: 6,
    materials: [
      { itemId: "T5_WOOD", quantity: 8 },
      { itemId: "T6_WOOD", quantity: 2 },
    ],
  },

  // Cloth
  {
    outputItemId: "T4_CLOTH",
    outputQuantity: 1,
    category: "resource",
    tier: 4,
    materials: [
      { itemId: "T3_FIBER", quantity: 8 },
      { itemId: "T4_FIBER", quantity: 2 },
    ],
  },
  {
    outputItemId: "T5_CLOTH",
    outputQuantity: 1,
    category: "resource",
    tier: 5,
    materials: [
      { itemId: "T4_FIBER", quantity: 8 },
      { itemId: "T5_FIBER", quantity: 2 },
    ],
  },
  {
    outputItemId: "T6_CLOTH",
    outputQuantity: 1,
    category: "resource",
    tier: 6,
    materials: [
      { itemId: "T5_FIBER", quantity: 8 },
      { itemId: "T6_FIBER", quantity: 2 },
    ],
  },

  // Leather
  {
    outputItemId: "T4_LEATHER",
    outputQuantity: 1,
    category: "resource",
    tier: 4,
    materials: [
      { itemId: "T3_HIDE", quantity: 8 },
      { itemId: "T4_HIDE", quantity: 2 },
    ],
  },
  {
    outputItemId: "T5_LEATHER",
    outputQuantity: 1,
    category: "resource",
    tier: 5,
    materials: [
      { itemId: "T4_HIDE", quantity: 8 },
      { itemId: "T5_HIDE", quantity: 2 },
    ],
  },
  {
    outputItemId: "T6_LEATHER",
    outputQuantity: 1,
    category: "resource",
    tier: 6,
    materials: [
      { itemId: "T5_HIDE", quantity: 8 },
      { itemId: "T6_HIDE", quantity: 2 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // WEAPONS (T4-T6)
  // ──────────────────────────────────────────────────────────────────────

  // Swords
  {
    outputItemId: "T4_MAIN_SWORD",
    outputQuantity: 1,
    category: "weapon",
    tier: 4,
    materials: [
      { itemId: "T4_METALBAR", quantity: 12 },
      { itemId: "T4_PLANKS", quantity: 4 },
    ],
  },
  {
    outputItemId: "T5_MAIN_SWORD",
    outputQuantity: 1,
    category: "weapon",
    tier: 5,
    materials: [
      { itemId: "T5_METALBAR", quantity: 12 },
      { itemId: "T5_PLANKS", quantity: 4 },
    ],
  },
  {
    outputItemId: "T6_MAIN_SWORD",
    outputQuantity: 1,
    category: "weapon",
    tier: 6,
    materials: [
      { itemId: "T6_METALBAR", quantity: 12 },
      { itemId: "T6_PLANKS", quantity: 4 },
    ],
  },

  // Bows
  {
    outputItemId: "T4_2H_BOW",
    outputQuantity: 1,
    category: "weapon",
    tier: 4,
    materials: [
      { itemId: "T4_PLANKS", quantity: 16 },
    ],
  },
  {
    outputItemId: "T5_2H_BOW",
    outputQuantity: 1,
    category: "weapon",
    tier: 5,
    materials: [
      { itemId: "T5_PLANKS", quantity: 16 },
    ],
  },
  {
    outputItemId: "T6_2H_BOW",
    outputQuantity: 1,
    category: "weapon",
    tier: 6,
    materials: [
      { itemId: "T6_PLANKS", quantity: 16 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // ARMOR (T4-T6)
  // ──────────────────────────────────────────────────────────────────────

  // Plate Armor
  {
    outputItemId: "T4_HEAD_PLATE_SET1",
    outputQuantity: 1,
    category: "armor",
    tier: 4,
    materials: [
      { itemId: "T4_METALBAR", quantity: 16 },
    ],
  },
  {
    outputItemId: "T4_ARMOR_PLATE_SET1",
    outputQuantity: 1,
    category: "armor",
    tier: 4,
    materials: [
      { itemId: "T4_METALBAR", quantity: 16 },
      { itemId: "T4_CLOTH", quantity: 8 },
    ],
  },
  {
    outputItemId: "T4_SHOES_PLATE_SET1",
    outputQuantity: 1,
    category: "armor",
    tier: 4,
    materials: [
      { itemId: "T4_METALBAR", quantity: 16 },
    ],
  },

  // Leather Armor
  {
    outputItemId: "T4_HEAD_LEATHER_SET1",
    outputQuantity: 1,
    category: "armor",
    tier: 4,
    materials: [
      { itemId: "T4_LEATHER", quantity: 16 },
    ],
  },
  {
    outputItemId: "T4_ARMOR_LEATHER_SET1",
    outputQuantity: 1,
    category: "armor",
    tier: 4,
    materials: [
      { itemId: "T4_LEATHER", quantity: 16 },
      { itemId: "T4_CLOTH", quantity: 8 },
    ],
  },
  {
    outputItemId: "T4_SHOES_LEATHER_SET1",
    outputQuantity: 1,
    category: "armor",
    tier: 4,
    materials: [
      { itemId: "T4_LEATHER", quantity: 16 },
    ],
  },

  // Cloth Armor
  {
    outputItemId: "T4_HEAD_CLOTH_SET1",
    outputQuantity: 1,
    category: "armor",
    tier: 4,
    materials: [
      { itemId: "T4_CLOTH", quantity: 16 },
    ],
  },
  {
    outputItemId: "T4_ARMOR_CLOTH_SET1",
    outputQuantity: 1,
    category: "armor",
    tier: 4,
    materials: [
      { itemId: "T4_CLOTH", quantity: 16 },
      { itemId: "T4_LEATHER", quantity: 8 },
    ],
  },
  {
    outputItemId: "T4_SHOES_CLOTH_SET1",
    outputQuantity: 1,
    category: "armor",
    tier: 4,
    materials: [
      { itemId: "T4_CLOTH", quantity: 16 },
    ],
  },
];

async function seedRecipes() {
  console.log("🌱 Seeding craft recipes...");

  let inserted = 0;
  let skipped = 0;

  for (const recipe of recipes) {
    try {
      // Insert recipe
      const [insertedRecipe] = await db
        .insert(craftRecipes)
        .values({
          outputItemId: recipe.outputItemId,
          outputQuantity: recipe.outputQuantity,
          category: recipe.category,
          tier: recipe.tier,
          variantGroup: recipe.variantGroup,
          variantName: recipe.variantName,
          isDefault: true,
        })
        .returning();

      // Insert materials
      for (let i = 0; i < recipe.materials.length; i++) {
        const material = recipe.materials[i];
        await db.insert(craftRecipeMaterials).values({
          recipeId: insertedRecipe.id,
          materialItemId: material.itemId,
          quantity: material.quantity,
          sortOrder: i,
        });
      }

      inserted++;
      console.log(`✓ ${recipe.outputItemId}`);
    } catch (error) {
      skipped++;
      console.log(`✗ ${recipe.outputItemId} (already exists or error)`);
    }
  }

  console.log(`\n✅ Done! Inserted: ${inserted}, Skipped: ${skipped}`);
}

// Run if executed directly
if (require.main === module) {
  seedRecipes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error seeding recipes:", error);
      process.exit(1);
    });
}

export { seedRecipes, recipes };
