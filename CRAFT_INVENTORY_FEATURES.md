# Améliorations du Système de Craft depuis l'Inventaire

## ✅ Fonctionnalités Implémentées

### 1. Bouton Recalculer les Prix du Marché ✅
**Fichiers modifiés:**
- `components/craft-inventory/CraftInventoryClient.tsx` (ajout état `loadingRecalculate`, fonction `handleRecalculatePrices`)
- `messages/fr.json` & `messages/en.json` (clé `results.recalculate`)

**Fonctionnement:**
- Bouton dans l'onglet Résultats (uniquement si `toBuy.length > 0`)
- Spinner animé pendant le chargement
- Recharge les prix depuis l'API Albion Online Data Project
- Met à jour `toBuyPrices` et `toBuyCities`

**Tests:**
1. Ajouter un item à crafter sans stock suffisant
2. Vérifier que le bouton "Recalculer les prix" apparaît
3. Cliquer → spinner doit s'animer
4. Prix doivent se mettre à jour dans la table "Achats complémentaires"

---

### 2. Statistiques Enrichies ✅
**Fichiers modifiés:**
- `components/craft-inventory/CraftInventoryClient.tsx` (nouvelle table après RRR breakdown)
- `messages/fr.json` & `messages/en.json` (clés `results.materialsSummary`, `results.rawQty`, etc.)

**Fonctionnement:**
- Table "Résumé des matériaux" affichant pour chaque ressource :
  - Quantité brute (avant RRR)
  - Quantité RRR (après RRR)
  - Quantité depuis inventaire (vert)
  - Quantité à acheter (jaune)
  - Prix moyen pondéré
  - Coût total

**Tests:**
1. Configurer un craft avec mix inventaire + achats
2. Onglet Résultats → vérifier table "Résumé des matériaux"
3. Vérifier calcul du prix moyen pondéré
4. Vérifier code couleur (vert/jaune)

---

### 3. Workflow avec 2 Boutons (Valider Craft → Vendre Craft) ✅
**Fichiers modifiés:**
- `components/craft-inventory/CraftInventoryClient.tsx` (états workflow, fonctions `handleValidate`, `handleSellCraft`, `confirmSell`)
- `app/api/inventory/craft/route.ts` (retour `craftedItemIds`)
- `messages/fr.json` & `messages/en.json` (section `sellModal`)

**Fonctionnement:**
- **État initial:** Bouton "Valider le craft" actif, "Vendre Craft" caché
- **Après validation:**
  - Items craftés ajoutés à l'inventaire
  - "Valider le craft" → grisé + texte "Déjà validé"
  - "Vendre Craft" → apparaît (rouge)
- **Modal de vente:**
  - Liste les items à supprimer
  - Message d'avertissement (pas de suivi monétaire)
  - Confirmation → supprime les items de l'inventaire
- **Auto-reset:** Validation se réactive si changement de :
  - Quantités d'items
  - Prix de vente
  - Prix d'achat
  - Sélection de lots

**Tests:**
1. Valider un craft → vérifier items dans inventaire
2. Vérifier bouton "Valider" grisé + "Vendre" actif
3. Cliquer "Vendre" → modal doit s'ouvrir
4. Confirmer → items supprimés de l'inventaire
5. Modifier une quantité → "Valider" doit se réactiver
6. Refresh page → états réinitialisés

---

### 4. Sélection Manuelle des Lots avec Override FIFO ✅
**Fichiers créés/modifiés:**
- `components/craft-inventory/LotSelector.tsx` (nouveau composant)
- `lib/albion/utils/inventory-craft.ts` (paramètre `manualSelection` dans `splitMaterialNeeds`)
- `components/craft-inventory/CraftInventoryClient.tsx` (état `manualLotSelection`, intégration LotSelector)

**Fonctionnement:**
- **Colonne "Lots"** dans table "Depuis l'inventaire"
- **Badge FIFO/Manuel:**
  - Gris "FIFO" par défaut
  - Bleu "Manuel" si sélection personnalisée
- **Dialog de sélection:**
  - Liste tous les lots avec prix, source, date
  - Checkboxes pour sélection multiple
  - Badge "FIFO #X" pour lots utilisés en mode FIFO
  - Bouton "Réinitialiser FIFO" en mode manuel
- **Comportement:**
  - Par défaut: FIFO automatique (plus ancien → plus récent)
  - Sélection manuelle: ordre de consommation défini par l'utilisateur
  - Reset → retour au FIFO

**Logique RRR:**
Le système respecte automatiquement la règle de prix :
- RRR d'un matériau d'inventaire → prix pondéré inventaire
- RRR d'un matériau acheté → prix d'achat
- Mix inventaire + achat → split proportionnel avec prix respectifs

**Tests:**
1. Avoir plusieurs lots d'un même matériau avec prix différents
2. Cliquer bouton "Lots" → dialog s'ouvre
3. Vérifier badge FIFO par défaut
4. Décocher un lot → badge passe en "Manuel"
5. Vérifier calculs mis à jour (prix pondéré change)
6. Cliquer "Réinitialiser FIFO" → retour état initial
7. Fermer dialog → sélection conservée

---

## 📊 Résumé Technique

### États Ajoutés (CraftInventoryClient)
```typescript
loadingRecalculate: boolean
isCraftValidated: boolean
craftedItemIds: string[]
showSellModal: boolean
isSelling: boolean
sellError: string | null
manualLotSelection: Record<string, string[]>
```

### Fonctions Ajoutées
- `handleRecalculatePrices()` - Recharge prix marché
- `handleSellCraft()` - Ouvre modal vente
- `confirmSell()` - Supprime items craftés
- `LotSelector` component - Gestion sélection lots

### API Modifiée
- `POST /api/inventory/craft` → retourne `{ success: true, craftedItemIds: string[] }`

### Traductions Ajoutées (FR/EN)
- `results.recalculate`
- `results.alreadyValidated`
- `results.sellCraft`
- `results.materialsSummary`
- `results.rawQty`, `results.rrrQty`, etc.
- `sellModal.title`, `sellModal.explanation`, etc.

---

## 🔍 Points d'Attention

### Code Dupliqué
`handleLoadPrices` et `handleRecalculatePrices` sont identiques. Acceptable pour la clarté, mais peuvent être refactorisés en une seule fonction si besoin.

### Persistance
Les états `isCraftValidated` et `manualLotSelection` sont **en mémoire uniquement**. Un refresh de page réinitialise tout. Pour persistance, ajouter un champ `status` dans la table `inventory_items`.

### Suppression Sans Historique
La vente supprime physiquement les items sans tracer l'historique. Pour suivi futur, créer une table `sales_history`.

---

## 🚀 Prochaines Évolutions Possibles

1. **Suivi monétaire:** Ajouter une table `transactions` pour tracker les gains/pertes
2. **Historique des crafts:** Conserver un log des crafts effectués
3. **Persistance des sélections:** Sauvegarder les préférences de lots en DB
4. **Statistiques avancées:** Graphiques de profit par matériau, évolution des prix
5. **Batch operations:** Vendre plusieurs crafts d'un coup
6. **Export CSV:** Exporter l'historique des crafts

---

## 📝 Notes de Développement

- Toutes les modifications suivent les patterns Next.js 15 App Router
- Respect du système i18n avec next-intl
- Composants UI utilisant Shadcn/ui (Dialog, Button, Badge, Checkbox)
- Logique métier isolée dans `lib/albion/utils/`
- Pas de migration DB nécessaire (changements uniquement front + API)

**Estimation totale:** ~6-8h développement + tests
**Risques:** Faibles, implémentation incrémentale testée
