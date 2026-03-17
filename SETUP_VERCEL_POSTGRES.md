# Configuration Vercel Postgres (Gratuit)

## Étape 1 : Créer la Database Vercel Postgres

### Via le Dashboard Vercel

1. **Allez sur Vercel** : https://vercel.com/dashboard
2. **Sélectionnez votre projet** (ou créez-en un si pas encore fait)
3. **Onglet "Storage"** → Cliquez sur **"Create Database"**
4. **Sélectionnez "Postgres"**
5. **Choisissez la région** : Europe (Paris) ou la plus proche de vous
6. **Cliquez sur "Create"**

✅ Vercel va automatiquement :
- Créer une base PostgreSQL
- Ajouter les variables d'environnement à votre projet
- Configurer `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, etc.

### Récupérer les Variables d'Environnement

Après création, allez dans **Settings → Environment Variables**.

Vous devriez voir ces variables auto-créées :
```
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
POSTGRES_USER
POSTGRES_HOST
POSTGRES_PASSWORD
POSTGRES_DATABASE
```

## Étape 2 : Configuration Locale (.env.local)

Copiez les variables dans votre `.env.local` :

```bash
# Vercel Postgres
POSTGRES_URL="postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb"
POSTGRES_PRISMA_URL="postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NON_POOLING="postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb"

# Pour Drizzle (utiliser la connexion poolée)
DATABASE_URL="${POSTGRES_PRISMA_URL}"
```

💡 **Astuce** : Vous pouvez télécharger le fichier `.env.local` directement depuis Vercel :
- Settings → Environment Variables → **"Download .env.local"**

## Étape 3 : Adapter la Configuration Drizzle

Vercel Postgres utilise **pgbouncer** (connection pooling), on doit adapter la config :

### Mise à jour de `lib/db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Pour Vercel Postgres avec pgbouncer
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL!;

const client = postgres(connectionString, {
  prepare: false,  // IMPORTANT pour pgbouncer
});

export const db = drizzle(client, { schema });
```

### Alternative avec @vercel/postgres (Recommandé)

Si vous voulez utiliser le client officiel Vercel :

```bash
npm install @vercel/postgres
```

Puis dans `lib/db/index.ts` :
```typescript
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

export const db = drizzle(sql, { schema });
```

## Étape 4 : Créer les Tables

### Option A : Via Vercel Dashboard (Le plus simple)

1. Dans Vercel → Storage → Votre DB Postgres
2. Onglet **"Query"**
3. Collez le contenu de `drizzle/0000_steep_shriek.sql`
4. Cliquez sur **"Execute"**

### Option B : Via CLI Locale

```bash
# Avec les variables d'env configurées
npm run db:push
```

## Étape 5 : Tester la Connexion

Créez un fichier de test :

```typescript
// scripts/test-db.ts
import { db } from '../lib/db';
import { albionItems } from '../lib/db/schema';

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');

    const result = await db.select().from(albionItems).limit(1);

    console.log('✅ Database connected successfully!');
    console.log('   Items count:', result.length);

  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

testConnection();
```

Exécutez :
```bash
tsx scripts/test-db.ts
```

## Étape 6 : Premier Sync

Une fois la DB configurée et les tables créées :

```bash
# Test sans écrire
npm run sync:items:dry

# Sync réel (va prendre ~2-3 minutes)
npm run sync:items
```

## Vérification

Après le sync, dans Vercel Dashboard → Storage → Query :

```sql
-- Nombre total d'items
SELECT COUNT(*) FROM albion_items;

-- Par catégorie
SELECT category, COUNT(*)
FROM albion_items
GROUP BY category;

-- Exemple d'items
SELECT id, name_en, name_fr, tier
FROM albion_items
LIMIT 10;
```

Vous devriez voir ~15,000 items!

## Limites du Free Tier

**Vercel Postgres (Hobby)** :
- ✅ 256 MB storage (suffisant pour ~15k items)
- ✅ 60 heures de compute/mois
- ✅ Unlimited requests depuis Vercel Functions
- ⚠️ Limité à 1 database par account

**Si vous dépassez 256 MB** (peu probable), alternatives gratuites :
- Neon.tech : 512 MB gratuit
- Supabase : 500 MB gratuit

## Déploiement sur Vercel

Vercel va automatiquement :
1. ✅ Utiliser les variables d'environnement configurées
2. ✅ Se connecter à la DB
3. ✅ Servir l'API `/api/items`

**Note** : Le script `sync:items` doit tourner via GitHub Actions (avec `DATABASE_URL` en secret), pas au build Vercel.

---

## Prochaines Étapes

Une fois la DB configurée :
1. ✅ Sync des items : `npm run sync:items`
2. ✅ Vérifier les données dans Vercel Dashboard
3. 🚀 Passer à la Phase 2 : API Routes + Hooks React
