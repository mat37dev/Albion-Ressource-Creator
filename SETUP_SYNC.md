# Configuration du Système de Synchronisation des Items

## Phase 1 Complétée ✅

Vous avez maintenant :
- ✅ Schema DB avec tables `albion_items` et `albion_sync_metadata`
- ✅ Script de synchronisation `scripts/sync-items.ts`
- ✅ GitHub Action pour sync automatique quotidien

## Prochaines Étapes

### 1. Configurer la Base de Données

#### Option A : Via Supabase Dashboard (Recommandé)

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Collez et exécutez le contenu de `drizzle/0000_steep_shriek.sql`
5. Les tables seront créées avec les index

#### Option B : Via CLI Drizzle

```bash
# 1. Configurez DATABASE_URL dans .env.local
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres

# 2. Poussez le schéma
npm run db:push
```

### 2. Tester le Script de Sync

#### Mode Dry Run (Test sans écrire en DB)

```bash
npm run sync:items:dry
```

Cela va :
- ✅ Télécharger les items depuis GitHub
- ✅ Télécharger les localisations
- ✅ Parser et traiter tous les items
- ❌ **NE PAS** écrire dans la DB

Vous verrez quelque chose comme :
```
🚀 Starting Albion Items Sync
   Mode: DRY RUN (no DB writes)

📥 Fetching items list from GitHub...
   Found 15000 item IDs
📥 Fetching localizations from GitHub...
   Found 25000 localized entries

🔄 Processing items...
   Progress: 50.0% (7500/15000 items)
   Progress: 100.0% (15000/15000 items)

✅ Sync completed successfully!
   Processed: 14500 items
   Inserted/Updated: 0 items (dry run)
   Skipped: 500 items
   Duration: 45.23s
```

#### Mode Live (Écriture réelle)

```bash
npm run sync:items
```

⚠️ **Attention** : Cela va vraiment écrire dans la DB!

### 3. Configurer GitHub Actions

Pour activer le sync automatique quotidien :

1. Allez dans **Settings** → **Secrets and variables** → **Actions**
2. Ajoutez le secret `DATABASE_URL` avec votre connexion Supabase
3. Le workflow `.github/workflows/sync-items.yml` se lancera :
   - Automatiquement tous les jours à 2h du matin
   - Manuellement depuis l'onglet Actions

### 4. Vérifier la DB

Après le premier sync réussi, vérifiez dans Supabase :

```sql
-- Nombre total d'items
SELECT COUNT(*) FROM albion_items;

-- Items par catégorie
SELECT category, COUNT(*) as count
FROM albion_items
GROUP BY category
ORDER BY count DESC;

-- Items par tier
SELECT tier, COUNT(*) as count
FROM albion_items
GROUP BY tier
ORDER BY tier;

-- Dernière synchro
SELECT *
FROM albion_sync_metadata
ORDER BY synced_at DESC
LIMIT 5;
```

Vous devriez voir environ :
- **~15,000 items** au total
- Catégories : weapon (~4000), armor (~3000), resource (~500), etc.
- Tiers : T1-T8

## Prochaine Phase : API Routes

Une fois que la DB contient des items, on peut passer à la **Phase 2** :
- Créer `/api/items` pour lister les items
- Créer `/api/items/[id]` pour un item spécifique
- Créer les hooks React `useAlbionItems()`

Prêt pour la Phase 2 ? 🚀
