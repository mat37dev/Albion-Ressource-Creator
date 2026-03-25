/**
 * Crée ou promeut un utilisateur admin.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts <email> [password] [pseudo]
 *
 * - Si l'utilisateur existe déjà → son rôle est mis à jour en "admin"
 * - Sinon → un nouveau compte admin est créé (password requis)
 */

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const [, , email, password, name] = process.argv;

if (!email) {
  console.error("Usage: npx tsx scripts/create-admin.ts <email> [password] [pseudo]");
  process.exit(1);
}

async function main() {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ role: "admin", updatedAt: new Date() })
      .where(eq(users.id, existing.id));
    console.log(`✅ Utilisateur "${email}" promu admin.`);
  } else {
    if (!password) {
      console.error("❌ Utilisateur introuvable. Fournis un mot de passe pour créer le compte.");
      console.error("   npx tsx scripts/create-admin.ts <email> <password> [pseudo]");
      process.exit(1);
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await db.insert(users).values({
      email,
      passwordHash,
      name: name ?? null,
      role: "admin",
    });
    console.log(`✅ Compte admin créé pour "${email}"${name ? ` (pseudo: ${name})` : ""}.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
