# Albion Online Custom Agents

Ces agents sont spécialisés pour le développement d'Albion Ressource Creator.

## 🤖 Agents Disponibles

### 1. **albion-data-validator** 🟢
**Rôle:** Valide la cohérence des données statiques Albion (items, recipes, bonuses, cities)

**Quand l'utiliser:**
- Après avoir ajouté de nouveaux items dans `lib/albion/items.ts`
- Après avoir modifié des recettes dans `lib/albion/recipes.ts`
- Avant de commiter des changements de données
- Pour vérifier que toutes les traductions sont présentes

**Commande:**
```
@albion-data-validator validate all data files
```

**Ce qu'il vérifie:**
- ✅ Tous les items dans les recettes existent dans items.ts
- ✅ Tous les UniqueNames suivent le format Albion (T4_2H_SWORD)
- ✅ Les traductions existent dans en.json ET fr.json
- ✅ Les 7 villes sont correctement définies
- ✅ Pas de doublons dans les items
- ✅ Les bonus de villes sont valides

---

### 2. **albion-feature-builder** 🔵
**Rôle:** Génère rapidement de nouvelles features (calculateurs, pages) en suivant les patterns existants

**Quand l'utiliser:**
- Pour créer un nouveau calculateur (refining, farming, gathering, etc.)
- Pour ajouter une nouvelle page d'analyse
- Pour étendre les fonctionnalités du site

**Commande:**
```
@albion-feature-builder create a refining profit calculator
```

**Ce qu'il génère:**
1. **Calculation Logic:** `lib/albion/calculations/[feature].ts`
2. **Client Component:** `components/[Feature]Client.tsx`
3. **Route:** `app/[locale]/[route]/page.tsx`
4. **Translations:** Mise à jour de `messages/en.json` et `messages/fr.json`

**Patterns suivis:**
- Next.js 15 App Router avec i18n
- Composants Client avec "use client"
- TypeScript strict
- Shadcn/ui components
- Style Tailwind existant

---

### 3. **albion-calculation-tester** 🟡
**Rôle:** Crée et exécute des tests pour valider l'exactitude des formules de profit

**Quand l'utiliser:**
- Après avoir modifié une formule de calcul
- Avant de déployer une nouvelle feature
- Pour vérifier que les calculs correspondent aux mécaniques du jeu

**Commande:**
```
@albion-calculation-tester test the craft profit calculations
```

**Ce qu'il teste:**
- ✅ Cas normaux (profits standards)
- ✅ Cas limites (prix à 0, taxes max)
- ✅ Scénarios de perte
- ✅ Break-even points
- ✅ Formules avec RRR et bonus

**Formules validées:**
- **Transport:** `Profit = Sell × (1 - tax) - Buy × (1 + tax)`
- **Flip:** `Margin = SellOrder - BuyOrder - SellOrder × 4.5%`
- **Craft:** Profit avec RRR (18% base + 40% city + 59% focus max)

---

## 🚀 Workflow Recommandé

### Ajouter une Nouvelle Feature

1. **Scaffolding** avec `albion-feature-builder`
   ```
   @albion-feature-builder create a farming profit calculator
   ```

2. **Validation des Données** avec `albion-data-validator`
   ```
   @albion-data-validator check all items and recipes
   ```

3. **Tests des Calculs** avec `albion-calculation-tester`
   ```
   @albion-calculation-tester test farming profit calculations
   ```

4. **Commit & Deploy** 🎉

---

## 📊 Comparaison avec les Skills Installés

| Besoin | Agent Custom | Skill Externe |
|--------|-------------|---------------|
| Valider données Albion | ✅ `albion-data-validator` | ❌ Aucun |
| Créer nouvelle feature | ✅ `albion-feature-builder` | ⚠️ Generic (pas Albion-specific) |
| Tester calculs | ✅ `albion-calculation-tester` | ⚠️ `e2e-testing-automation` (E2E, pas unit tests) |
| i18n général | ❌ | ✅ `i18n-localization` |
| Next.js optimizations | ❌ | ✅ `nextjs-react-typescript` |

**Les agents custom sont complémentaires aux skills génériques !**

---

## 🔧 Configuration

Ces agents sont automatiquement détectés par Claude Code depuis le dossier `.agents/albion/`.

Pour les utiliser, mentionnez-les avec `@agent-name` dans vos conversations avec Claude Code.

---

## 📝 Notes de Développement

- **Model:** Tous les agents héritent du modèle parent (inherit)
- **Tools:** Chaque agent a accès aux outils nécessaires (Read, Write, Edit, Bash, Glob, Grep)
- **Colors:** Utilisées pour identifier visuellement les agents dans l'interface
  - 🟢 Validator (green)
  - 🔵 Builder (blue)
  - 🟡 Tester (yellow)

---

## 🛠️ Maintenance

Pour modifier un agent, éditez directement son fichier `.md` dans `.agents/albion/`.

Les changements sont pris en compte immédiatement par Claude Code.
