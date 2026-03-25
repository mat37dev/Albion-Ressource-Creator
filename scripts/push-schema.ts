/**
 * Script de migration personnalisé utilisant le driver Serverless
 * Alternative à `drizzle-kit push` qui ne supporte pas WebSocket
 */

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function pushSchema() {
  console.log("🚀 Création des tables via le driver Serverless...\n");

  try {
    // Table: users
    console.log("📦 Création de la table 'users'...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        role TEXT NOT NULL DEFAULT 'free',
        patreon_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("   ✅ Table 'users' créée\n");

    // Migration: add password_hash column if missing
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT
    `);

    // Table: favorites
    console.log("📦 Création de la table 'favorites'...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id TEXT NOT NULL,
        type TEXT NOT NULL,
        config TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("   ✅ Table 'favorites' créée\n");

    // Table: price_alerts
    console.log("📦 Création de la table 'price_alerts'...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS price_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id TEXT NOT NULL,
        city TEXT NOT NULL,
        target_price INTEGER NOT NULL,
        direction TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("   ✅ Table 'price_alerts' créée\n");

    // Table: albion_items
    console.log("📦 Création de la table 'albion_items'...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS albion_items (
        id TEXT PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_fr TEXT NOT NULL,
        name_de TEXT,
        name_es TEXT,
        name_pt TEXT,
        name_ru TEXT,
        name_pl TEXT,
        name_zh TEXT,
        tier INTEGER NOT NULL,
        enchant INTEGER NOT NULL DEFAULT 0,
        category TEXT NOT NULL,
        subcategory TEXT NOT NULL,
        is_artifact BOOLEAN DEFAULT false,
        icon_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("   ✅ Table 'albion_items' créée\n");

    // Table: albion_sync_metadata
    console.log("📦 Création de la table 'albion_sync_metadata'...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS albion_sync_metadata (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        source TEXT NOT NULL,
        version TEXT,
        synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
        items_count INTEGER,
        status TEXT NOT NULL,
        error_message TEXT
      )
    `);
    console.log("   ✅ Table 'albion_sync_metadata' créée\n");

    // Table: craft_recipes
    console.log("📦 Création de la table 'craft_recipes'...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS craft_recipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        output_item_id TEXT NOT NULL,
        output_quantity INTEGER NOT NULL DEFAULT 1,
        category TEXT NOT NULL,
        tier INTEGER NOT NULL,
        enchantment_level INTEGER NOT NULL DEFAULT 0,
        crafting_fee_base REAL NOT NULL DEFAULT 0.1125,
        crafting_time REAL,
        crafting_focus INTEGER,
        silver_cost REAL,
        variant_group TEXT,
        variant_name TEXT,
        is_default BOOLEAN DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("   ✅ Table 'craft_recipes' créée\n");

    // Table: craft_recipe_materials
    console.log("📦 Création de la table 'craft_recipe_materials'...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS craft_recipe_materials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_id UUID NOT NULL REFERENCES craft_recipes(id) ON DELETE CASCADE,
        material_item_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        sort_order INTEGER DEFAULT 0
      )
    `);
    console.log("   ✅ Table 'craft_recipe_materials' créée\n");

    // Indexes
    console.log("📊 Création des indexes...");

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_craft_recipes_output
      ON craft_recipes(output_item_id)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_craft_recipes_variant
      ON craft_recipes(variant_group)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_recipe_materials_recipe
      ON craft_recipe_materials(recipe_id)
    `);

    console.log("   ✅ Indexes créés\n");

    console.log("✨ Toutes les tables ont été créées avec succès !");
    console.log("\n📝 Prochaines étapes :");
    console.log("   1. npm run seed:recipes    (ajouter les recettes de craft)");
    console.log("   2. npm run sync:items      (synchroniser les items Albion)");
    console.log("   3. npm run dev             (lancer l'application)\n");

  } catch (error) {
    console.error("\n❌ Erreur lors de la création des tables:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }

  process.exit(0);
}

pushSchema();
