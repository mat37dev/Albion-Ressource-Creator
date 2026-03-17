# Proposition : Système d'Items Dynamique

## Problème Actuel

Les items sont hardcodés dans le code TypeScript :
- ❌ Maintenance manuelle nécessaire à chaque patch du jeu
- ❌ Risque d'erreurs de traduction
- ❌ Difficile de rester à jour avec les nouveaux items
- ❌ Impossible d'ajouter des métadonnées sans recompiler

## Solution Proposée : Approche Hybride

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Source de Vérité : ao-data/ao-bin-dumps (GitHub)          │
│  - items.json (définitions d'items)                         │
│  - localization.json (EN, FR, DE, ES, etc.)                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   ┌────────────────┐
                   │  Script Sync   │
                   │  (cron job)    │
                   └────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Supabase PostgreSQL                                        │
│                                                              │
│  Table: albion_items                                        │
│  ├─ id (T4_MAIN_SWORD)                                      │
│  ├─ name_en (Broadsword)                                    │
│  ├─ name_fr (Épée large)                                    │
│  ├─ tier (4)                                                │
│  ├─ enchant (0)                                             │
│  ├─ category (weapon)                                       │
│  ├─ subcategory (sword)                                     │
│  ├─ icon_url (auto-generated)                               │
│  └─ updated_at                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Next.js API Routes                                         │
│  - /api/items (list with filters)                           │
│  - /api/items/[id] (single item)                            │
│  - Cache: 1 heure (revalidate)                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Frontend Components                                        │
│  - Utilise SWR/React Query pour cache client                │
│  - Fallback sur données statiques si API indisponible       │
└─────────────────────────────────────────────────────────────┘
```

---

## Phases d'Implémentation

### Phase 1 : Schema DB + Script de Sync (2-3h)

#### 1.1 Schéma DB Supabase

```sql
-- Table principale des items
CREATE TABLE albion_items (
  id TEXT PRIMARY KEY,                    -- Ex: T4_MAIN_SWORD
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
  category TEXT NOT NULL,                 -- weapon, armor, resource_raw, etc.
  subcategory TEXT NOT NULL,              -- sword, axe, ore, etc.
  is_artifact BOOLEAN DEFAULT false,
  icon_url TEXT,                          -- URL CDN pré-calculée
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherches rapides
CREATE INDEX idx_items_category ON albion_items(category);
CREATE INDEX idx_items_tier ON albion_items(tier);
CREATE INDEX idx_items_enchant ON albion_items(enchant);
CREATE INDEX idx_items_search_en ON albion_items USING gin(to_tsvector('english', name_en));
CREATE INDEX idx_items_search_fr ON albion_items USING gin(to_tsvector('french', name_fr));

-- Metadata sur la dernière synchro
CREATE TABLE albion_sync_metadata (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,                   -- 'ao-data/ao-bin-dumps'
  version TEXT,                           -- commit SHA ou version
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  items_count INTEGER,
  status TEXT                             -- 'success', 'error'
);
```

#### 1.2 Script Node.js de Synchronisation

```typescript
// scripts/sync-items.ts
import { db } from '@/lib/db';
import { albionItems } from '@/lib/db/schema';

const GITHUB_RAW = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master';

interface RawItem {
  UniqueName: string;
  Index: number;
  // ... autres props
}

interface LocalizationData {
  [key: string]: {
    'EN-US'?: string;
    'FR-FR'?: string;
    // ... autres langues
  };
}

async function fetchItems() {
  // Fetch items.json (peut être gros, utiliser streaming si nécessaire)
  const response = await fetch(`${GITHUB_RAW}/formatted/items.txt`);
  const text = await response.text();
  return parseItemsFile(text);
}

async function fetchLocalizations() {
  const response = await fetch(`${GITHUB_RAW}/formatted/localization.txt`);
  const text = await response.text();
  return parseLocalizationFile(text);
}

async function syncItems() {
  console.log('🔄 Début de la synchronisation...');

  const items = await fetchItems();
  const localizations = await fetchLocalizations();

  let processed = 0;

  for (const item of items) {
    const itemId = item.UniqueName;

    // Extraire tier, enchant, etc.
    const { tier, enchant } = parseItemId(itemId);

    // Récupérer les noms localisés
    const nameEN = localizations[itemId]?.['EN-US'] || itemId;
    const nameFR = localizations[itemId]?.['FR-FR'] || nameEN;

    // Déterminer catégorie
    const category = detectCategory(itemId);
    const subcategory = detectSubcategory(itemId);

    // Upsert dans la DB
    await db.insert(albionItems).values({
      id: itemId,
      name_en: nameEN,
      name_fr: nameFR,
      tier,
      enchant,
      category,
      subcategory,
      is_artifact: isArtifact(itemId),
      icon_url: `https://render.albiononline.com/v1/item/${itemId}.png`,
      updated_at: new Date(),
    }).onConflictDoUpdate({
      target: albionItems.id,
      set: {
        name_en: nameEN,
        name_fr: nameFR,
        tier,
        enchant,
        updated_at: new Date(),
      },
    });

    processed++;
    if (processed % 100 === 0) {
      console.log(`  Processed ${processed} items...`);
    }
  }

  console.log(`✅ Synchronisation terminée : ${processed} items`);
}

// Exécuter
syncItems().catch(console.error);
```

#### 1.3 Automatisation (Cron Job)

```yaml
# .github/workflows/sync-items.yml
name: Sync Albion Items

on:
  schedule:
    - cron: '0 2 * * *'  # Tous les jours à 2h du matin
  workflow_dispatch:      # Trigger manuel

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run sync:items
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

### Phase 2 : API Routes Next.js (1-2h)

```typescript
// app/api/items/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { albionItems } from '@/lib/db/schema';
import { eq, and, like, sql } from 'drizzle-orm';

export const revalidate = 3600; // Cache 1 heure

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category');
  const tier = searchParams.get('tier');
  const search = searchParams.get('search');
  const locale = searchParams.get('locale') || 'en';
  const limit = parseInt(searchParams.get('limit') || '100');

  let query = db.select().from(albionItems);

  // Filters
  const conditions = [];
  if (category) conditions.push(eq(albionItems.category, category));
  if (tier) conditions.push(eq(albionItems.tier, parseInt(tier)));
  if (search) {
    const nameField = locale === 'fr' ? albionItems.name_fr : albionItems.name_en;
    conditions.push(like(nameField, `%${search}%`));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const items = await query.limit(limit);

  return NextResponse.json({
    items,
    count: items.length,
  });
}
```

```typescript
// app/api/items/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { albionItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const revalidate = 3600;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const item = await db
    .select()
    .from(albionItems)
    .where(eq(albionItems.id, params.id))
    .limit(1);

  if (!item.length) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  return NextResponse.json(item[0]);
}
```

---

### Phase 3 : Hooks React (30min)

```typescript
// lib/hooks/useAlbionItems.ts
import useSWR from 'swr';

interface ItemFilters {
  category?: string;
  tier?: number;
  search?: string;
  locale?: string;
  limit?: number;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useAlbionItems(filters?: ItemFilters) {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.tier) params.set('tier', filters.tier.toString());
  if (filters?.search) params.set('search', filters.search);
  if (filters?.locale) params.set('locale', filters.locale);
  if (filters?.limit) params.set('limit', filters.limit.toString());

  const { data, error, isLoading } = useSWR(
    `/api/items?${params.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    items: data?.items || [],
    count: data?.count || 0,
    isLoading,
    error,
  };
}

export function useAlbionItem(id: string) {
  const { data, error, isLoading } = useSWR(
    id ? `/api/items/${id}` : null,
    fetcher
  );

  return {
    item: data,
    isLoading,
    error,
  };
}
```

---

### Phase 4 : Migration Progressive (1-2h)

#### Stratégie de Migration

1. **Garder l'ancien système comme fallback**
2. **Migrer composant par composant**
3. **Feature flag pour basculer entre ancien/nouveau**

```typescript
// lib/albion/items-provider.ts
import { getAllItems as getStaticItems } from './items/index';
import { useAlbionItems } from '@/lib/hooks/useAlbionItems';

const USE_DYNAMIC_ITEMS = process.env.NEXT_PUBLIC_USE_DYNAMIC_ITEMS === 'true';

export function useItems(filters?: ItemFilters) {
  const dynamicResult = useAlbionItems(filters);
  const staticItems = getStaticItems();

  if (!USE_DYNAMIC_ITEMS) {
    // Mode statique (ancien système)
    return {
      items: filterItems(staticItems, filters),
      isLoading: false,
      error: null,
    };
  }

  // Mode dynamique avec fallback
  if (dynamicResult.error) {
    console.warn('Dynamic items failed, using static fallback');
    return {
      items: filterItems(staticItems, filters),
      isLoading: false,
      error: dynamicResult.error,
    };
  }

  return dynamicResult;
}
```

---

## Avantages de Cette Approche

### ✅ Pour le Développement
- Toujours à jour avec le jeu (sync quotidien)
- Pas de maintenance manuelle
- Métadonnées extensibles (stats, recettes, etc.)
- Support multilingue facile

### ✅ Pour les Utilisateurs
- Données exactes et à jour
- Recherche rapide (index DB)
- Pas de latence (cache Next.js)
- Fallback si API down

### ✅ Performance
- Cache Next.js (1h revalidate)
- Cache client (SWR)
- Index DB optimisés
- CDN pour les icônes

---

## Coûts et Considérations

### Supabase Free Tier
- ✅ 500 MB de stockage (largement suffisant pour ~50k items)
- ✅ Unlimited API requests
- ✅ Pas de coût additionnel

### Maintenance
- Script sync : automatique (GitHub Actions)
- DB : 0 maintenance
- Monitoring : logs GitHub Actions

---

## Plan d'Action Proposé

### Sprint 1 (4-6h)
1. ✅ Créer schéma DB (`albion_items` table)
2. ✅ Script de sync depuis ao-data
3. ✅ Tester sync avec 100 items
4. ✅ GitHub Action pour sync quotidien

### Sprint 2 (2-3h)
1. ✅ API routes `/api/items`
2. ✅ Hooks React `useAlbionItems`
3. ✅ Feature flag pour basculer

### Sprint 3 (2-3h)
1. ✅ Migrer AdminItemsBrowser
2. ✅ Tests E2E
3. ✅ Déploiement production

**Total estimé : 8-12 heures de dev**

---

## Alternative Plus Simple (si besoin rapide)

Si vous voulez quelque chose de plus simple pour commencer :

### Build-Time Generation Only

```typescript
// scripts/generate-items.ts
// Télécharge items.json + localization.json
// Génère lib/albion/items-generated.ts
// Exécuté à chaque build npm run build
```

**Avantages** :
- ✅ Pas de DB nécessaire
- ✅ Toujours à jour (si régénéré)
- ✅ Performance maximale (code statique)

**Inconvénients** :
- ❌ Nécessite rebuild pour mettre à jour
- ❌ Pas de métadonnées dynamiques

---

## Recommandation Finale

Je recommande l'**approche hybride complète** car :

1. Votre app va grandir (stats, crafts, builds)
2. Vous avez déjà Supabase configuré
3. La flexibilité future vaut l'investissement initial
4. Le fallback statique assure la résilience

Voulez-vous que je commence l'implémentation ? On peut faire Phase 1 ensemble maintenant.
