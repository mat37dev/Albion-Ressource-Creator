'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getItemIconUrl } from '@/lib/albion/items';
import type { AlbionItem as NewAlbionItem } from '@/lib/albion/items/index';
import type { ItemIconOptions } from '@/lib/albion/items/types';
import { cn } from '@/lib/utils';

// Type qui accepte les deux formats d'AlbionItem (ancien et nouveau)
type AlbionItemLike =
  | { UniqueName: string; LocalizedNames?: Record<string, string> | null } // Ancien format
  | NewAlbionItem // Nouveau format
  | string;

interface ItemIconProps {
  /** L'item Albion ou son ID */
  item: AlbionItemLike;
  /** Taille de l'icône en pixels (défaut: 64) */
  size?: number;
  /** Options additionnelles pour l'icône */
  options?: Omit<ItemIconOptions, 'size'>;
  /** Classes CSS additionnelles */
  className?: string;
  /** Afficher le nom de l'item en tooltip */
  showTooltip?: boolean;
  /** Locale pour le nom (défaut: 'en') */
  locale?: 'en' | 'fr';
  /** Afficher un indicateur de loading */
  showLoading?: boolean;
}

/**
 * Composant pour afficher l'icône d'un item Albion Online
 *
 * @example
 * ```tsx
 * // Avec un ID d'item
 * <ItemIcon item="T4_MAIN_SWORD" size={64} />
 *
 * // Avec un objet AlbionItem
 * <ItemIcon item={myItem} size={100} showTooltip />
 *
 * // Avec options personnalisées
 * <ItemIcon
 *   item="T5_HEAD_PLATE_SET1@2"
 *   size={128}
 *   options={{ quality: 4 }}
 *   className="border-2 border-gold"
 * />
 * ```
 */
export function ItemIcon({
  item,
  size = 64,
  options,
  className,
  showTooltip = true,
  locale = 'en',
  showLoading = true,
}: ItemIconProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Extraire l'ID de l'item pour l'URL
  let itemId = '';
  let itemName = '';

  if (typeof item === 'string') {
    itemId = item;
    itemName = item;
  } else if ('id' in item) {
    // Nouveau format
    itemId = item.id;
    itemName = locale === 'fr' ? item.nameFR : item.nameEN;
  } else if ('UniqueName' in item) {
    // Ancien format
    itemId = item.UniqueName;
    itemName = locale === 'fr'
      ? item.LocalizedNames?.['FR-FR'] || item.LocalizedNames?.['EN-US'] || item.UniqueName
      : item.LocalizedNames?.['EN-US'] || item.UniqueName;
  }

  const iconUrl = getItemIconUrl(itemId, { ...options, size });

  // Afficher un placeholder en cas d'erreur
  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded',
          className
        )}
        style={{ width: size, height: size }}
        title={showTooltip ? itemName : undefined}
      >
        <span className="text-xs text-gray-500">?</span>
      </div>
    );
  }

  return (
    <div
      className={cn('relative inline-block', className)}
      style={{ width: size, height: size }}
      title={showTooltip ? itemName : undefined}
    >
      {/* Loading placeholder */}
      {showLoading && !isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      )}

      {/* Image */}
      <Image
        src={iconUrl}
        alt={itemName}
        width={size}
        height={size}
        className={cn(
          'rounded transition-opacity duration-200',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        unoptimized // CDN externe, pas d'optimisation Next.js
      />
    </div>
  );
}

/**
 * Composant pour afficher une grille d'icônes d'items avec leurs noms
 */
interface ItemGridProps {
  items: AlbionItemLike[];
  iconSize?: number;
  locale?: 'en' | 'fr';
  columns?: number;
  onItemClick?: (item: AlbionItemLike) => void;
  className?: string;
}

export function ItemGrid({
  items,
  iconSize = 64,
  locale = 'en',
  columns = 5,
  onItemClick,
  className,
}: ItemGridProps) {
  return (
    <div
      className={cn('grid gap-4', className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {items.map((item, index) => {
        let itemId = '';
        let itemName = '';

        if (typeof item === 'string') {
          itemId = item;
          itemName = item;
        } else if ('id' in item) {
          // Nouveau format
          itemId = item.id;
          itemName = locale === 'fr' ? item.nameFR : item.nameEN;
        } else if ('UniqueName' in item) {
          // Ancien format
          itemId = item.UniqueName;
          itemName = locale === 'fr'
            ? item.LocalizedNames?.['FR-FR'] || item.LocalizedNames?.['EN-US'] || item.UniqueName
            : item.LocalizedNames?.['EN-US'] || item.UniqueName;
        }

        return (
          <div
            key={itemId + index}
            className={cn(
              'flex flex-col items-center gap-2',
              onItemClick && 'cursor-pointer hover:opacity-80 transition-opacity'
            )}
            onClick={() => onItemClick?.(item)}
          >
            <ItemIcon item={item} size={iconSize} locale={locale} />
            <span className="text-xs text-center line-clamp-2 w-full">
              {itemName}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Composant pour afficher un item avec son icône et des informations détaillées
 */
interface ItemCardProps {
  item: AlbionItemLike;
  locale?: 'en' | 'fr';
  iconSize?: number;
  showTier?: boolean;
  showEnchant?: boolean;
  className?: string;
}

export function ItemCard({
  item,
  locale = 'en',
  iconSize = 80,
  showTier = true,
  showEnchant = true,
  className,
}: ItemCardProps) {
  let itemName = '';
  let tier = 0;
  let enchant = 0;
  let itemId = '';

  if (typeof item === 'string') {
    itemId = item;
    itemName = item;
    // Parse tier et enchant depuis l'ID
    const tierMatch = item.match(/^T(\d+)_/);
    const enchantMatch = item.match(/@(\d)$/);
    tier = tierMatch ? parseInt(tierMatch[1]) : 0;
    enchant = enchantMatch ? parseInt(enchantMatch[1]) : 0;
  } else if ('id' in item) {
    // Nouveau format
    itemId = item.id;
    itemName = locale === 'fr' ? item.nameFR : item.nameEN;
    tier = item.tier;
    enchant = item.enchant;
  } else if ('UniqueName' in item) {
    // Ancien format
    itemId = item.UniqueName;
    itemName = locale === 'fr'
      ? item.LocalizedNames?.['FR-FR'] || item.LocalizedNames?.['EN-US'] || item.UniqueName
      : item.LocalizedNames?.['EN-US'] || item.UniqueName;
    // Parse tier et enchant depuis l'ID
    const tierMatch = itemId.match(/^T(\d+)_/);
    const enchantMatch = itemId.match(/@(\d)$/);
    tier = tierMatch ? parseInt(tierMatch[1]) : 0;
    enchant = enchantMatch ? parseInt(enchantMatch[1]) : 0;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors',
        className
      )}
    >
      <ItemIcon item={item} size={iconSize} locale={locale} showTooltip={false} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{itemName}</p>
        <div className="flex gap-2 mt-1">
          {showTier && tier > 0 && (
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
              T{tier}
            </span>
          )}
          {showEnchant && enchant > 0 && (
            <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
              +{enchant}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
