'use client';

/**
 * Exemples d'utilisation des icônes d'items Albion
 * Ce fichier démontre différentes façons d'utiliser les composants d'icônes
 */

import { ItemIcon, ItemGrid, ItemCard } from '@/components/ui/item-icon';
import { getItemIconUrl, getItemIconUrlsByTier } from '@/lib/albion/items';

export function BasicIconExample() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Icônes de Base</h3>

      <div className="flex gap-4">
        {/* Icône simple */}
        <ItemIcon item="T4_MAIN_SWORD" size={64} />

        {/* Avec enchantement */}
        <ItemIcon item="T4_MAIN_SWORD@2" size={64} />

        {/* Différentes tailles */}
        <ItemIcon item="T5_HEAD_PLATE_SET1" size={32} />
        <ItemIcon item="T5_HEAD_PLATE_SET1" size={64} />
        <ItemIcon item="T5_HEAD_PLATE_SET1" size={128} />
      </div>
    </div>
  );
}

export function WeaponTierExample() {
  // Générer les URLs pour tous les tiers d'une épée
  const tiers = [4, 5, 6, 7, 8];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Tiers d'une Épée Large</h3>

      <div className="flex gap-4">
        {tiers.map((tier) => (
          <div key={tier} className="flex flex-col items-center gap-2">
            <ItemIcon item={`T${tier}_MAIN_SWORD`} size={64} />
            <span className="text-sm">T{tier}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EnchantmentLevelsExample() {
  const enchantments = [0, 1, 2, 3, 4];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Niveaux d'Enchantement</h3>

      <div className="flex gap-4">
        {enchantments.map((enchant) => (
          <div key={enchant} className="flex flex-col items-center gap-2">
            <ItemIcon
              item={`T6_2H_CLAYMORE${enchant > 0 ? `@${enchant}` : ''}`}
              size={64}
            />
            <span className="text-sm">{enchant === 0 ? 'Base' : `+${enchant}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ItemGridExample() {
  // Liste d'armes populaires
  const weapons = [
    'T4_MAIN_SWORD',
    'T4_2H_CLAYMORE',
    'T4_MAIN_AXE',
    'T4_2H_HAMMER',
    'T4_2H_BOW',
    'T4_MAIN_CROSSBOW',
    'T4_MAIN_SPEAR',
    'T4_MAIN_DAGGER',
    'T4_2H_QUARTERSTAFF',
    'T4_MAIN_FIRESTAFF',
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Grille d'Items</h3>

      <ItemGrid
        items={weapons}
        iconSize={64}
        columns={5}
        locale="fr"
        onItemClick={(item) => {
          console.log('Item cliqué:', item);
          alert(`Vous avez cliqué sur ${item}`);
        }}
      />
    </div>
  );
}

export function ItemCardExample() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Cartes d'Items</h3>

      <div className="grid grid-cols-2 gap-4">
        <ItemCard item="T4_MAIN_SWORD" locale="fr" />
        <ItemCard item="T6_2H_CLAYMORE@2" locale="fr" />
        <ItemCard item="T5_HEAD_PLATE_SET1" locale="en" />
        <ItemCard item="T8_2H_BOW@4" locale="en" />
      </div>
    </div>
  );
}

export function DirectURLExample() {
  // Utilisation directe des URLs (sans composant React)
  const swordUrl = getItemIconUrl('T4_MAIN_SWORD', { size: 100 });
  const armorUrls = getItemIconUrlsByTier('HEAD_PLATE_SET1', [4, 5, 6], { size: 64 });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">URLs Directes</h3>

      <div className="space-y-2">
        <p className="text-sm">
          <strong>URL d'épée:</strong>
          <br />
          <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded">{swordUrl}</code>
        </p>

        <img src={swordUrl} alt="Épée T4" className="w-24 h-24" />
      </div>

      <div className="space-y-2">
        <p className="text-sm">
          <strong>URLs multi-tiers:</strong>
        </p>
        <div className="flex gap-4">
          {Object.entries(armorUrls).map(([tier, url]) => (
            <div key={tier} className="flex flex-col items-center gap-2">
              <img src={url} alt={`Tier ${tier}`} className="w-16 h-16" />
              <span className="text-xs">T{tier}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Composant principal affichant tous les exemples
 */
export default function ItemIconExamples() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Exemples d'Icônes d'Items Albion</h1>

      <BasicIconExample />
      <hr className="border-gray-200 dark:border-gray-700" />

      <WeaponTierExample />
      <hr className="border-gray-200 dark:border-gray-700" />

      <EnchantmentLevelsExample />
      <hr className="border-gray-200 dark:border-gray-700" />

      <ItemGridExample />
      <hr className="border-gray-200 dark:border-gray-700" />

      <ItemCardExample />
      <hr className="border-gray-200 dark:border-gray-700" />

      <DirectURLExample />
    </div>
  );
}
