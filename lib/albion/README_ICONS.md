# Albion Online Item Icons

Ce guide explique comment utiliser les icônes d'items dans l'application.

## Source des Icônes

Les icônes proviennent du CDN officiel d'Albion Online :
```
https://render.albiononline.com/v1/item/{identifier}.png
```

## Utilisation

### Import

```typescript
import { getItemIconUrl, getItemIconUrlsByTier } from '@/lib/albion/items';
```

### Exemples de Base

```typescript
// Icône par défaut (217x217px)
const url1 = getItemIconUrl('T4_MAIN_SWORD');
// => https://render.albiononline.com/v1/item/T4_MAIN_SWORD.png

// Avec enchantement
const url2 = getItemIconUrl('T4_MAIN_SWORD@2');
// => https://render.albiononline.com/v1/item/T4_MAIN_SWORD@2.png

// Depuis un objet AlbionItem
const item = getItemById('T5_HEAD_PLATE_SET1');
const url3 = getItemIconUrl(item);
// => https://render.albiononline.com/v1/item/T5_HEAD_PLATE_SET1.png
```

### Options de Personnalisation

```typescript
// Icône plus petite (64x64px)
const smallIcon = getItemIconUrl('T4_MAIN_SWORD', { size: 64 });
// => https://render.albiononline.com/v1/item/T4_MAIN_SWORD.png?size=64

// Avec qualité spécifique (1-5)
const qualityIcon = getItemIconUrl('T4_MAIN_SWORD', {
  size: 100,
  quality: 3  // Outstanding
});
// => https://render.albiononline.com/v1/item/T4_MAIN_SWORD.png?size=100&quality=3

// Sans enchantement (même si l'ID a @2)
const baseIcon = getItemIconUrl('T4_MAIN_SWORD@2', {
  includeEnchant: false
});
// => https://render.albiononline.com/v1/item/T4_MAIN_SWORD.png
```

### Paramètres Disponibles

| Paramètre | Type | Range | Défaut | Description |
|-----------|------|-------|--------|-------------|
| `size` | `number` | 1-217 | 217 | Taille de l'icône en pixels |
| `quality` | `number` | 1-5 | - | Niveau de qualité (1=Normal, 2=Good, 3=Outstanding, 4=Excellent, 5=Masterpiece) |
| `includeEnchant` | `boolean` | - | `true` | Inclure le niveau d'enchantement (@1, @2, etc.) |

### Génération Multi-Tiers

Pour générer les URLs de plusieurs tiers d'un même item :

```typescript
const swordIcons = getItemIconUrlsByTier('MAIN_SWORD', [4, 5, 6]);
// => {
//   4: 'https://render.albiononline.com/v1/item/T4_MAIN_SWORD.png',
//   5: 'https://render.albiononline.com/v1/item/T5_MAIN_SWORD.png',
//   6: 'https://render.albiononline.com/v1/item/T6_MAIN_SWORD.png'
// }

// Avec options
const smallIcons = getItemIconUrlsByTier('MAIN_SWORD', [4, 5, 6], { size: 64 });
```

## Utilisation dans les Composants React

### Image Simple

```tsx
import { getItemIconUrl } from '@/lib/albion/items';
import Image from 'next/image';

export function ItemIcon({ itemId }: { itemId: string }) {
  const iconUrl = getItemIconUrl(itemId, { size: 64 });

  return (
    <Image
      src={iconUrl}
      alt={itemId}
      width={64}
      height={64}
      className="rounded"
    />
  );
}
```

### Avec Loading State

```tsx
'use client';

import { useState } from 'react';
import { getItemIconUrl } from '@/lib/albion/items';

export function ItemIconWithLoading({ itemId }: { itemId: string }) {
  const [loaded, setLoaded] = useState(false);
  const iconUrl = getItemIconUrl(itemId, { size: 100 });

  return (
    <div className="relative w-[100px] h-[100px]">
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        src={iconUrl}
        alt={itemId}
        className={`w-full h-full transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
```

### Liste d'Items avec Icônes

```tsx
import { getAllItems, getItemIconUrl } from '@/lib/albion/items';

export function ItemList() {
  const items = getAllItems().slice(0, 20); // Premiers 20 items

  return (
    <div className="grid grid-cols-5 gap-4">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col items-center">
          <img
            src={getItemIconUrl(item, { size: 64 })}
            alt={item.nameEN}
            className="w-16 h-16"
          />
          <span className="text-sm text-center mt-2">{item.nameEN}</span>
        </div>
      ))}
    </div>
  );
}
```

## Notes Importantes

1. **CDN Officiel** : Les icônes sont servies directement depuis le CDN d'Albion Online, aucune copie locale n'est nécessaire.

2. **Performance** : Pour optimiser les performances, utilisez l'option `size` pour charger des versions plus petites si nécessaire.

3. **Disponibilité** : Toutes les icônes sont disponibles pour les items T1-T8 avec enchantements @0-@4.

4. **Caching** : Le navigateur met automatiquement en cache les images du CDN.

## Références

- [API Documentation Officielle](https://wiki.albiononline.com/wiki/API:Render_service)
- CDN Endpoint: https://render.albiononline.com/v1/item/
