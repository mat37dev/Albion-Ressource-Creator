/**
 * Script de vérification des variables d'environnement
 */

import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

console.log("🔍 Vérification des variables d'environnement...\n");

const vars = [
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL",
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
];

let foundCorrect = false;
let foundIncorrect = false;

for (const varName of vars) {
  const value = process.env[varName];
  if (value) {
    // Masquer le mot de passe
    const maskedValue = value.replace(
      /(:\/\/)([^:]+):([^@]+)(@)/,
      "$1$2:***$4"
    );

    console.log(`${varName}:`);
    console.log(`  ${maskedValue}\n`);

    // Vérifier si c'est la bonne URL
    if (value.includes("vercel-storage.com")) {
      console.log(`  ✅ Bonne URL Vercel Postgres\n`);
      foundCorrect = true;
    } else if (value.includes("db.prisma.io") || value.includes("prisma.io")) {
      console.log(`  ❌ ERREUR: URL Prisma (ancienne infrastructure)\n`);
      foundIncorrect = true;
    } else if (value.includes("supabase.co")) {
      console.log(`  ℹ️  URL Supabase détectée\n`);
    } else {
      console.log(`  ⚠️  URL inconnue\n`);
    }
  }
}

console.log("\n" + "=".repeat(60) + "\n");

if (foundIncorrect) {
  console.log("❌ PROBLÈME DÉTECTÉ\n");
  console.log("Votre URL de base de données pointe vers l'ancienne infrastructure Prisma.");
  console.log("Cela ne fonctionnera pas avec le driver Neon Serverless.\n");
  console.log("📝 SOLUTION :\n");
  console.log("1. Allez sur https://vercel.com/dashboard");
  console.log("2. Sélectionnez votre projet");
  console.log("3. Allez dans Storage → Postgres");
  console.log("4. Cliquez sur votre base de données");
  console.log("5. Onglet '.env.local'");
  console.log("6. Copiez l'URL qui contient 'vercel-storage.com'\n");
  console.log("Ajoutez dans votre .env.local :");
  console.log('POSTGRES_URL_NON_POOLING="postgres://...vercel-storage.com..."');
  console.log('ou');
  console.log('POSTGRES_URL="postgres://...vercel-storage.com..."\n');
} else if (!foundCorrect) {
  console.log("⚠️  AUCUNE URL TROUVÉE\n");
  console.log("Vous devez configurer DATABASE_URL ou POSTGRES_URL dans .env.local\n");
  console.log("📝 SOLUTION :\n");
  console.log("1. Allez sur https://vercel.com/dashboard");
  console.log("2. Sélectionnez votre projet");
  console.log("3. Allez dans Storage → Postgres");
  console.log("4. Cliquez sur votre base de données");
  console.log("5. Onglet '.env.local'");
  console.log("6. Copiez TOUTES les variables POSTGRES_*\n");
  console.log("Collez-les dans votre .env.local à la racine du projet.\n");
} else {
  console.log("✅ Configuration correcte !");
  console.log("Vous pouvez maintenant tester la connexion avec: npm run db:connect\n");
}
