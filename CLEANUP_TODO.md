# Code Cleanup TODO

## Files to Clean/Remove

Now that we use the database for items, several hardcoded item files are no longer used:

### ❌ Can be Removed (Not Imported Anywhere)
- `lib/albion/items/weapons.ts` - Hardcoded weapon definitions
- `lib/albion/items/armors.ts` - Hardcoded armor definitions
- `lib/albion/items/resources.ts` - Hardcoded resource definitions
- `lib/albion/items/consumables.ts` - Hardcoded consumable definitions

### ⚠️ Still Used (Need Migration First)
- `lib/albion/itemsList.ts` - Used by `TopOpportunities.tsx`
  - **Action needed:** Migrate `TopOpportunities` to use DB via API
  - Functions used: `getPopularScanItems()`, `getItemDefById()`

### ✅ Keep (Still Needed)
- `lib/albion/items/types.ts` - Type definitions (used everywhere)
- `lib/albion/items/index.ts` - Exports `getCategoriesMetadata()` (used by AdminItemsBrowser)

## Migration Plan

1. ✅ Migrate `AdminItemsBrowser` to use DB → **DONE**
2. ⏳ Migrate `TopOpportunities` to use DB
3. ⏳ Remove unused hardcoded item files
4. ⏳ Remove `lib/albion/itemsList.ts` after TopOpportunities migration

## After Cleanup

The codebase will be much lighter:
- **Before:** ~15,000 items hardcoded in TypeScript files
- **After:** Only types and utilities, data in DB
- **Benefit:** Easier maintenance, always up-to-date data
