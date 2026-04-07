/**
 * Migration script to add missing columns to craft_recipes table
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log("🔄 Adding missing columns to craft_recipes table...\n");

  try {
    // Add enchantment_level column
    console.log("➕ Adding enchantment_level column...");
    await db.execute(sql`
      ALTER TABLE craft_recipes
      ADD COLUMN IF NOT EXISTS enchantment_level INTEGER NOT NULL DEFAULT 0
    `);
    console.log("   ✅ enchantment_level added\n");

    // Add crafting_time column
    console.log("➕ Adding crafting_time column...");
    await db.execute(sql`
      ALTER TABLE craft_recipes
      ADD COLUMN IF NOT EXISTS crafting_time REAL
    `);
    console.log("   ✅ crafting_time added\n");

    // Add crafting_focus column
    console.log("➕ Adding crafting_focus column...");
    await db.execute(sql`
      ALTER TABLE craft_recipes
      ADD COLUMN IF NOT EXISTS crafting_focus INTEGER
    `);
    console.log("   ✅ crafting_focus added\n");

    // Add silver_cost column
    console.log("➕ Adding silver_cost column...");
    await db.execute(sql`
      ALTER TABLE craft_recipes
      ADD COLUMN IF NOT EXISTS silver_cost REAL
    `);
    console.log("   ✅ silver_cost added\n");

    console.log("✅ Migration completed successfully!\n");

  } catch (error) {
    console.error("\n❌ Migration failed:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }

  process.exit(0);
}

migrate();
