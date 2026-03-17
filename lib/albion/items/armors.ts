/**
 * Armures T4-T8 - 9 variantes par type × 3 slots
 */

import type { AlbionItem } from "./types";

// ─────────────────────────────────────────────
// ARMOR DEFINITIONS - 9 variantes par type
// ─────────────────────────────────────────────

interface ArmorVariantDef {
  id: string;
  nameEN: string;
  nameFR: string;
}

// PLATE - 9 variantes
const PLATE_VARIANTS: ArmorVariantDef[] = [
  { id: "SET1", nameEN: "Soldier", nameFR: "Soldat" },
  { id: "SET2", nameEN: "Knight", nameFR: "Chevalier" },
  { id: "SET3", nameEN: "Guardian", nameFR: "Gardien" },
  { id: "ROYAL", nameEN: "Royal", nameFR: "Royal" },
  { id: "UNDEAD", nameEN: "Graveguard", nameFR: "Garde-tombe" },
  { id: "HELL", nameEN: "Demon", nameFR: "Démon" },
  { id: "KEEPER", nameEN: "Judicator", nameFR: "Juge" },
  { id: "AVALON", nameEN: "Armor of Valor", nameFR: "Armure de Valeur" },
  { id: "CRYSTAL", nameEN: "Duskweaver", nameFR: "Tissecrépuscule" },
];

// LEATHER - 9 variantes
const LEATHER_VARIANTS: ArmorVariantDef[] = [
  { id: "SET1", nameEN: "Mercenary", nameFR: "Mercenaire" },
  { id: "SET2", nameEN: "Hunter", nameFR: "Chasseur" },
  { id: "SET3", nameEN: "Assassin", nameFR: "Assassin" },
  { id: "ROYAL", nameEN: "Royal", nameFR: "Royal" },
  { id: "UNDEAD", nameEN: "Stalker", nameFR: "Traqueur" },
  { id: "HELL", nameEN: "Hellion", nameFR: "Démon" },
  { id: "KEEPER", nameEN: "Specter", nameFR: "Spectre" },
  { id: "AVALON", nameEN: "Armor of Tenacity", nameFR: "Armure de Ténacité" },
  { id: "CRYSTAL", nameEN: "Mistwalker", nameFR: "Marcheur de brume" },
];

// CLOTH - 9 variantes
const CLOTH_VARIANTS: ArmorVariantDef[] = [
  { id: "SET1", nameEN: "Mage", nameFR: "Mage" },
  { id: "SET2", nameEN: "Cleric", nameFR: "Clerc" },
  { id: "SET3", nameEN: "Scholar", nameFR: "Érudit" },
  { id: "ROYAL", nameEN: "Royal", nameFR: "Royal" },
  { id: "UNDEAD", nameEN: "Druid", nameFR: "Druide" },
  { id: "HELL", nameEN: "Fiend", nameFR: "Démon" },
  { id: "KEEPER", nameEN: "Cultist", nameFR: "Cultiste" },
  { id: "AVALON", nameEN: "Armor of Purity", nameFR: "Armure de Pureté" },
  { id: "CRYSTAL", nameEN: "Feyscale", nameFR: "Écaille féerique" },
];

type ArmorSlot = "HEAD" | "ARMOR" | "SHOES";

const SLOT_NAMES: Record<ArmorSlot, { en: string; fr: string }> = {
  HEAD: { en: "Helmet", fr: "Casque" },
  ARMOR: { en: "Armor", fr: "Armure" },
  SHOES: { en: "Boots", fr: "Bottes" },
};

const TIER_PREFIX_EN: Record<number, string> = {
  4: "Adept's",
  5: "Expert's",
  6: "Master's",
  7: "Grandmaster's",
  8: "Elder's",
};

const TIER_PREFIX_FR: Record<number, string> = {
  4: "d'Adepte",
  5: "d'Expert",
  6: "de Maître",
  7: "de Grand Maître",
  8: "d'Ancien",
};

const ENCHANT_LABELS = ["", ".1", ".2", ".3", ".4"];

function tierLabel(tier: number, enchant: number): string {
  return `T${tier}${ENCHANT_LABELS[enchant]}`;
}

// ─────────────────────────────────────────────
// GENERATION
// ─────────────────────────────────────────────

function generateArmorSet(
  armorType: "PLATE" | "LEATHER" | "CLOTH",
  variants: ArmorVariantDef[]
): AlbionItem[] {
  const items: AlbionItem[] = [];
  const slots: ArmorSlot[] = ["HEAD", "ARMOR", "SHOES"];

  for (const variant of variants) {
    for (const slot of slots) {
      for (let tier = 4; tier <= 8; tier++) {
        for (let enchant = 0; enchant <= 4; enchant++) {
          const suffix = enchant > 0 ? `@${enchant}` : "";
          const label = tierLabel(tier, enchant);
          const tierPrefix = tier >= 4 ? TIER_PREFIX_EN[tier] : "";
          const tierPrefixFR = tier >= 4 ? TIER_PREFIX_FR[tier] : "";

          const slotName = SLOT_NAMES[slot];
          const nameEN = `${label} ${tierPrefix} ${variant.nameEN} ${slotName.en}`;
          const nameFR = `${label} ${slotName.fr} ${variant.nameFR} ${tierPrefixFR}`;

          items.push({
            id: `T${tier}_${slot}_${armorType}_${variant.id}${suffix}`,
            nameEN: nameEN.trim(),
            nameFR: nameFR.trim(),
            tier,
            enchant,
            category: "armor",
            subcategory: armorType.toLowerCase(),
          });
        }
      }
    }
  }

  return items;
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────

export function getAllArmors(): AlbionItem[] {
  return [
    ...generateArmorSet("PLATE", PLATE_VARIANTS),
    ...generateArmorSet("LEATHER", LEATHER_VARIANTS),
    ...generateArmorSet("CLOTH", CLOTH_VARIANTS),
  ];
}

export function getPlateArmors(): AlbionItem[] {
  return generateArmorSet("PLATE", PLATE_VARIANTS);
}

export function getLeatherArmors(): AlbionItem[] {
  return generateArmorSet("LEATHER", LEATHER_VARIANTS);
}

export function getClothArmors(): AlbionItem[] {
  return generateArmorSet("CLOTH", CLOTH_VARIANTS);
}
