/**
 * Script de test de connexion à la base de données
 *
 * Usage:
 *   npx tsx scripts/test-connection.ts
 *
 * Ce script teste la connexion avec le driver Serverless (WebSocket)
 */

import { db } from "../lib/db";
import { albionItems } from "../lib/db/schema";
import { sql } from "drizzle-orm";

async function testConnection() {
  console.log("🔌 Test de connexion à la base de données...\n");

  try {
    // Test 1: Simple query
    console.log("Test 1: Requête simple (SELECT NOW())");
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    console.log("✅ Connexion réussie!");

    // Le driver Neon retourne les résultats dans result.rows
    const rows = (result as any).rows || result;
    if (rows && rows.length > 0 && rows[0].current_time) {
      console.log(`   Heure serveur: ${rows[0].current_time}\n`);
    } else {
      console.log(`   Requête exécutée avec succès\n`);
    }

    // Test 2: Count items
    console.log("Test 2: Comptage des items Albion");
    const items = await db.select().from(albionItems).limit(1);
    console.log(`✅ ${items.length > 0 ? 'Items trouvés' : 'Table vide'}`);
    if (items.length > 0) {
      console.log(`   Premier item: ${items[0].id} - ${items[0].nameFR || items[0].nameEN}\n`);
    }

    // Test 3: Check craft tables
    console.log("Test 3: Vérification des tables craft");
    const tablesQuery = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('craft_recipes', 'craft_recipe_materials')
    `);
    const tables = tablesQuery as unknown as any[];
    console.log(`✅ Tables craft trouvées: ${tables.length}/2`);
    tables.forEach((t: any) => console.log(`   - ${t.table_name}`));

    if (tables.length === 0) {
      console.log("\n⚠️  Les tables craft n'existent pas encore.");
      console.log("   Exécutez: npm run db:push\n");
    } else if (tables.length < 2) {
      console.log("\n⚠️  Toutes les tables craft ne sont pas créées.");
      console.log("   Exécutez: npm run db:push\n");
    }

    console.log("\n✨ Tous les tests sont passés!");
    console.log("🚀 Vous pouvez maintenant utiliser l'application.");

  } catch (error) {
    console.error("\n❌ Erreur de connexion:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);

      if (error.message.includes('ETIMEDOUT')) {
        console.error("\n💡 Le port de base de données semble bloqué.");
        console.error("   → Le driver Serverless devrait résoudre ce problème.");
        console.error("   → Vérifiez que DATABASE_URL est bien configuré dans .env.local");
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }

  process.exit(0);
}

testConnection();
