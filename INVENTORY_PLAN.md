# Inventaire Virtuel — Plan d'implémentation

> Fichier de suivi mis à jour au fil des avancées.
> Statuts : `[ ]` À faire · `[~]` En cours · `[x]` Terminé

---

## Vue d'ensemble

Système d'inventaire virtuel pour crafteurs. Les ressources achetées sont stockées dans un inventaire rattaché au compte. Une page "Craft Inventaire" permet de crafter en utilisant ces ressources à leur prix d'achat réel, avec gestion du RRR et validation qui met l'inventaire à jour.

---

## Architecture décidée

### Table DB — `inventory_items`
```
id            uuid PK
userId        uuid FK → users.id
itemId        text          -- ex: T4_METALBAR
quantity      real          -- peut être décimal (retours RRR)
pricePerUnit  real          -- silver payé à l'unité
source        text          -- 'bought' | 'crafted' | 'rrr_return'
notes         text nullable -- optionnel
createdAt     timestamp
updatedAt     timestamp
```

Un item peut avoir **plusieurs lignes** (lots achetés à des prix différents).
Lors de l'utilisation au craft, on consomme en **FIFO** (premier acheté = premier consommé).

### Règle de prix pour les retours RRR
- Ressources retournées issues d'un lot inventaire → même `pricePerUnit` que ce lot
- Ressources retournées issues d'un achat complémentaire → prix du marché utilisé

### Page dédiée
`/[locale]/craft-inventory` — accessible depuis un bouton dans l'inventaire.
La page craft existante (`/craft`) n'est **pas modifiée**.

---

## Phases

---

### Phase 1 — Infrastructure DB & API
**Objectif :** tables, routes API, hooks React

- [ ] Ajouter `inventoryItems` à `lib/db/schema.ts`
- [ ] Exporter les types `InventoryItem`, `NewInventoryItem`
- [ ] Mettre à jour `drizzle.config.ts` (ajouter `inventory_items` au `tablesFilter`)
- [ ] Créer `app/api/inventory/route.ts` — GET (liste) + POST (ajout)
- [ ] Créer `app/api/inventory/[id]/route.ts` — PATCH (quantité/prix) + DELETE
- [ ] Créer `lib/hooks/useInventory.ts` — hook SWR avec mutate
- [ ] Pousser la migration DB (`npm run db:push`)

---

### Phase 2 — UI Inventaire (profil / page dédiée)
**Objectif :** l'utilisateur peut consulter, ajouter et supprimer ses items

- [ ] Créer `app/[locale]/inventory/page.tsx`
- [ ] Créer `components/inventory/InventoryClient.tsx`
  - Tableau des items (icône, nom, quantité, prix/unité, total, source, date)
  - Bouton "Ajouter" → modal de sélection d'item + saisie quantité + prix
  - Bouton "Supprimer" par ligne (avec confirmation)
  - Bouton "Modifier quantité" inline
  - Filtre par catégorie
- [ ] Ajouter lien "Inventaire" dans `Header.tsx` (nav desktop + mobile)
- [ ] Ajouter bouton "Inventaire" sur la page profil (`/profile`)
- [ ] Ajouter bouton "Craft depuis l'inventaire" dans `InventoryClient` → lien vers `/craft-inventory`
- [ ] Traductions `fr.json` / `en.json` — clé `inventory.*`
- [ ] Protéger la route (redirect vers login si non connecté)

---

### Phase 3 — Page Craft Inventaire
**Objectif :** nouvelle page de craft qui exploite l'inventaire

Structure de la page :

```
[1] Sélection des items à crafter  (réutilise logique CraftBatch)
[2] Ressources
    ├── Tableau A : Items depuis l'inventaire   (quantité dispo, prix inventaire)
    └── Tableau B : Achats complémentaires      (quantité manquante, prix marché)
[3] Résultats
    ├── Section "Utilisation inventaire"        (coût réel inventaire)
    ├── Section "Achats supplémentaires"        (coût marché)
    ├── Profit total
    └── [Bouton "Valider le craft"]
```

- [ ] Créer `app/[locale]/craft-inventory/page.tsx`
- [ ] Créer `components/craft-inventory/CraftInventoryClient.tsx`
- [ ] Créer `lib/albion/utils/inventory-craft.ts`
  - `splitMaterialNeeds(materials, inventory)` → `{ fromInventory, toBuy }`
  - `computeInventoryCost(fromInventory)` → coût réel
  - `computeRRRReturns(materials, rrr, fromInventory, toBuy)` → retours par source
- [ ] Afficher Tableau A (inventaire) — prix non modifiable, quantité limitée au stock
- [ ] Afficher Tableau B (compléments) — prix marché modifiable
- [ ] Section résultats avec les deux colonnes de coût
- [ ] Bouton "Valider le craft" (disabled si non connecté)
- [ ] Traductions `fr.json` / `en.json` — clé `craftInventory.*`

---

### Phase 4 — Validation du craft & mise à jour inventaire
**Objectif :** le bouton "Valider" applique les changements à l'inventaire

Logique de validation :
1. Consommer les ressources inventaire utilisées (FIFO, réduire quantités / supprimer lignes)
2. Créer des lignes pour les items craftés (`source: 'crafted'`, prix = coût de craft / quantité)
3. Créer des lignes pour les retours RRR :
   - Retour depuis inventaire → `source: 'rrr_return'`, `pricePerUnit` = prix du lot source
   - Retour depuis achats → `source: 'rrr_return'`, `pricePerUnit` = prix marché utilisé
4. Afficher un résumé de ce qui a changé (modal de confirmation avant d'appliquer)

- [ ] Créer `app/api/inventory/craft/route.ts` — POST avec payload complet
  - Valide que l'utilisateur possède bien les ressources nécessaires (double-check serveur)
  - Applique toutes les mutations dans une transaction DB
- [ ] Connecter le bouton "Valider" au endpoint
- [ ] Afficher modal de confirmation avec résumé avant envoi
- [ ] Afficher notification succès / erreur après validation
- [ ] Revalider le cache SWR de l'inventaire après succès

---

## Fichiers à créer (résumé)

| Fichier | Type |
|---|---|
| `lib/db/schema.ts` | Modification (ajout table) |
| `app/api/inventory/route.ts` | Nouveau |
| `app/api/inventory/[id]/route.ts` | Nouveau |
| `app/api/inventory/craft/route.ts` | Nouveau |
| `lib/hooks/useInventory.ts` | Nouveau |
| `lib/albion/utils/inventory-craft.ts` | Nouveau |
| `app/[locale]/inventory/page.tsx` | Nouveau |
| `app/[locale]/craft-inventory/page.tsx` | Nouveau |
| `components/inventory/InventoryClient.tsx` | Nouveau |
| `components/craft-inventory/CraftInventoryClient.tsx` | Nouveau |
| `messages/fr.json` + `messages/en.json` | Modification |
| `components/Header.tsx` | Modification |

---

## Points d'attention

- **Auth** : toutes les routes API inventory vérifient la session (unauthorized si pas connecté)
- **FIFO** : lors de la consommation, trier les lots par `createdAt` ASC
- **Atomicité** : la validation du craft passe par une transaction DB (tout ou rien)
- **RRR exempt** : certains matériaux sont exempts de RRR (`isRRRExempt()`), ne pas calculer de retour pour eux
- **Quantités décimales** : le RRR peut retourner 0.6 d'un item — stocker en `real`, afficher arrondi à l'entier inférieur pour les consommables

---

## Ordre d'implémentation recommandé

```
Phase 1 → Phase 2 → Phase 3 (sans validation) → Phase 4
```

La Phase 3 sans le bouton Valider permet de tester l'affichage et le calcul sans toucher l'inventaire. La Phase 4 ajoute l'écriture réelle.
