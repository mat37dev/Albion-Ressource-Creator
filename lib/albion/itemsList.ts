/**
 * Comprehensive Albion Online item list generator
 * Covers T1-T8 resources, T2-T8 refined, T4-T8 equipment with @1/@2/@3 enchantments
 */

export interface AlbionItemDef {
  id: string;
  nameEN: string;
  nameFR: string;
  tier: number;
  enchant: number; // 0 = base, 1/2/3 = enchanted
  category: ItemCategory;
  subcategory: string;
}

export type ItemCategory =
  | "resource_raw"
  | "resource_refined"
  | "weapon"
  | "armor"
  | "offhand"
  | "cape"
  | "bag"
  | "consumable"
  | "mount";

// ─────────────────────────────────────────────
// RAW RESOURCES T1-T8 (no enchantments)
// ─────────────────────────────────────────────

const RAW_RESOURCE_NAMES: Record<string, { en: string[]; fr: string[] }> = {
  ORE: {
    en: ["Rough Stone", "Limestone", "Iron Ore", "Titanium Ore", "Runite Ore", "Meteorite Ore", "Adamantium Ore", "Astralite"],
    fr: ["Pierre brute", "Calcaire", "Minerai de fer", "Minerai de titane", "Minerai de runite", "Minerai météorite", "Minerai d'adamantium", "Astralite"],
  },
  WOOD: {
    en: ["Rough Log", "Birch", "Chestnut", "Ash", "Whitewood", "Bloodoak", "Treewood", "Primeval Wood"],
    fr: ["Bûche brute", "Bouleau", "Châtaignier", "Frêne", "Bois blanc", "Chêne de sang", "Bois d'arbre", "Bois primordial"],
  },
  FIBER: {
    en: ["Rough Fiber", "Cotton", "Neat Cloth", "Simple Cloth", "Elegant Cloth", "Otherworldly Fiber", "Wild Vine", "Stone Blossom"],
    fr: ["Fibre brute", "Coton", "Tissu propre", "Tissu simple", "Tissu élégant", "Fibre d'un autre monde", "Vigne sauvage", "Fleur de pierre"],
  },
  HIDE: {
    en: ["Tiny Animal Hide", "Rugged Hide", "Thick Hide", "Robust Hide", "Resilient Hide", "Thick Leather", "Forbidden Claw", "Undead Hide"],
    fr: ["Peau minuscule", "Peau robuste", "Peau épaisse", "Peau résistante", "Peau résiliente", "Cuir épais", "Griffe interdite", "Peau morte-vivante"],
  },
  ROCK: {
    en: ["Rough Stone", "Limestone", "Sandstone", "Travertine", "Granite", "Slate", "Basalt", "Obsidian"],
    fr: ["Pierre brute", "Calcaire", "Grès", "Travertin", "Granite", "Ardoise", "Basalte", "Obsidienne"],
  },
};

function generateRawResources(): AlbionItemDef[] {
  const items: AlbionItemDef[] = [];
  for (const [type, names] of Object.entries(RAW_RESOURCE_NAMES)) {
    for (let tier = 1; tier <= 8; tier++) {
      items.push({
        id: `T${tier}_${type}`,
        nameEN: `T${tier} ${names.en[tier - 1]}`,
        nameFR: `T${tier} ${names.fr[tier - 1]}`,
        tier,
        enchant: 0,
        category: "resource_raw",
        subcategory: type.toLowerCase(),
      });
    }
  }
  return items;
}

// ─────────────────────────────────────────────
// REFINED RESOURCES T2-T8 (no enchantments)
// ─────────────────────────────────────────────

const REFINED_NAMES: Record<string, { id: string; en: string[]; fr: string[] }> = {
  METALBAR: {
    id: "METALBAR",
    en: ["Bronze Bar", "Steel Bar", "Meteorite Steel Bar", "Titanium Steel Bar", "Runite Steel Bar", "Meteorite Steel Bar", "Adamantium Steel Bar"],
    fr: ["Barre de bronze", "Barre d'acier", "Barre d'acier météorite", "Barre d'acier titane", "Barre d'acier runite", "Barre d'acier météorite", "Barre d'acier adamantium"],
  },
  PLANKS: {
    id: "PLANKS",
    en: ["Birch Planks", "Chestnut Planks", "Ash Planks", "Whitewood Planks", "Bloodoak Planks", "Treewood Planks", "Primeval Planks"],
    fr: ["Planches de bouleau", "Planches de châtaignier", "Planches de frêne", "Planches de bois blanc", "Planches de chêne de sang", "Planches d'arbre", "Planches primordiales"],
  },
  CLOTH: {
    id: "CLOTH",
    en: ["Wool Cloth", "Neat Cloth", "Simple Cloth", "Elegant Cloth", "Otherworldly Cloth", "Wild Cloth", "Stone Blossom Cloth"],
    fr: ["Tissu de laine", "Tissu propre", "Tissu simple", "Tissu élégant", "Tissu d'un autre monde", "Tissu sauvage", "Tissu de fleur de pierre"],
  },
  LEATHER: {
    id: "LEATHER",
    en: ["Cured Leather", "Hardened Leather", "Reinforced Leather", "Reinforced Leather", "Thick Leather", "Forbidden Leather", "Undead Leather"],
    fr: ["Cuir traité", "Cuir durci", "Cuir renforcé", "Cuir renforcé", "Cuir épais", "Cuir interdit", "Cuir mort-vivant"],
  },
  STONEBLOCK: {
    id: "STONEBLOCK",
    en: ["Limestone Block", "Sandstone Block", "Travertine Block", "Granite Block", "Slate Block", "Basalt Block", "Obsidian Block"],
    fr: ["Bloc de calcaire", "Bloc de grès", "Bloc de travertin", "Bloc de granite", "Bloc d'ardoise", "Bloc de basalte", "Bloc d'obsidienne"],
  },
};

function generateRefinedResources(): AlbionItemDef[] {
  const items: AlbionItemDef[] = [];
  for (const [, data] of Object.entries(REFINED_NAMES)) {
    for (let tier = 2; tier <= 8; tier++) {
      const nameIdx = tier - 2;
      items.push({
        id: `T${tier}_${data.id}`,
        nameEN: `T${tier} ${data.en[nameIdx]}`,
        nameFR: `T${tier} ${data.fr[nameIdx]}`,
        tier,
        enchant: 0,
        category: "resource_refined",
        subcategory: data.id.toLowerCase(),
      });
    }
  }
  return items;
}

// ─────────────────────────────────────────────
// EQUIPMENT T4-T8 with @0/@1/@2/@3
// ─────────────────────────────────────────────

interface WeaponDef {
  id: string;
  nameEN: string;
  nameFR: string;
  subcategory: string;
}

const WEAPONS: WeaponDef[] = [
  // Swords
  { id: "MAIN_SWORD", nameEN: "Broadsword", nameFR: "Épée large", subcategory: "sword" },
  { id: "2H_CLAYMORE", nameEN: "Claymore", nameFR: "Claymore", subcategory: "sword" },
  { id: "MAIN_1H_DUALSCIMITAR_SET1", nameEN: "Dual Swords", nameFR: "Doubles épées", subcategory: "sword" },
  // Axes
  { id: "MAIN_AXE", nameEN: "Battleaxe", nameFR: "Hache de bataille", subcategory: "axe" },
  { id: "2H_AXE", nameEN: "Great Axe", nameFR: "Grande hache", subcategory: "axe" },
  { id: "2H_HALBERD", nameEN: "Halberd", nameFR: "Hallebarde", subcategory: "axe" },
  // Maces
  { id: "MAIN_MACE", nameEN: "Mace", nameFR: "Masse", subcategory: "mace" },
  { id: "2H_MACE", nameEN: "Heavy Mace", nameFR: "Masse lourde", subcategory: "mace" },
  { id: "2H_FLAIL", nameEN: "Flail", nameFR: "Fléau", subcategory: "mace" },
  // Hammers
  { id: "2H_HAMMER", nameEN: "Great Hammer", nameFR: "Grand marteau", subcategory: "hammer" },
  { id: "2H_POLEHAMMER", nameEN: "Polehammer", nameFR: "Marteau d'arme d'hast", subcategory: "hammer" },
  // Crossbows
  { id: "MAIN_CROSSBOW", nameEN: "Crossbow", nameFR: "Arbalète", subcategory: "crossbow" },
  { id: "2H_CROSSBOW", nameEN: "Heavy Crossbow", nameFR: "Arbalète lourde", subcategory: "crossbow" },
  { id: "2H_REPEATINGCROSSBOW", nameEN: "Repeating Crossbow", nameFR: "Arbalète répétition", subcategory: "crossbow" },
  // Bows
  { id: "2H_BOW", nameEN: "Bow", nameFR: "Arc", subcategory: "bow" },
  { id: "2H_WARBOW", nameEN: "Warbow", nameFR: "Arc de guerre", subcategory: "bow" },
  { id: "2H_LONGBOW", nameEN: "Longbow", nameFR: "Arc long", subcategory: "bow" },
  // Spears
  { id: "MAIN_SPEAR", nameEN: "Spear", nameFR: "Lance", subcategory: "spear" },
  { id: "2H_SPEAR", nameEN: "Pike", nameFR: "Pique", subcategory: "spear" },
  { id: "2H_GLAIVE", nameEN: "Glaive", nameFR: "Glaive", subcategory: "spear" },
  // Daggers
  { id: "MAIN_DAGGER", nameEN: "Dagger", nameFR: "Dague", subcategory: "dagger" },
  { id: "2H_DUALSPELL_DAGGER_SET1", nameEN: "Dagger Pair", nameFR: "Paire de dagues", subcategory: "dagger" },
  { id: "2H_CLAWPAIR_SET1", nameEN: "Claws", nameFR: "Griffes", subcategory: "dagger" },
  // Quarterstaffs
  { id: "2H_QUARTERSTAFF", nameEN: "Quarterstaff", nameFR: "Bâton de combat", subcategory: "staff" },
  { id: "2H_IRONCLADEDSTAFF", nameEN: "Iron-Clad Staff", nameFR: "Bâton de fer", subcategory: "staff" },
  // Fire Staffs
  { id: "MAIN_FIRESTAFF", nameEN: "Fire Staff", nameFR: "Bâton de feu", subcategory: "firestaff" },
  { id: "2H_FIRESTAFF", nameEN: "Great Fire Staff", nameFR: "Grand bâton de feu", subcategory: "firestaff" },
  // Frost Staffs
  { id: "MAIN_FROSTSTAFF", nameEN: "Frost Staff", nameFR: "Bâton de givre", subcategory: "froststaff" },
  { id: "2H_FROSTSTAFF", nameEN: "Great Frost Staff", nameFR: "Grand bâton de givre", subcategory: "froststaff" },
  // Curse Staffs
  { id: "MAIN_CURSEDSTAFF", nameEN: "Cursed Staff", nameFR: "Bâton maudit", subcategory: "cursestaff" },
  { id: "2H_CURSEDSTAFF", nameEN: "Great Cursed Staff", nameFR: "Grand bâton maudit", subcategory: "cursestaff" },
  // Arcane Staffs
  { id: "MAIN_ARCANESTAFF", nameEN: "Arcane Staff", nameFR: "Bâton arcanique", subcategory: "arcanestaff" },
  { id: "2H_ARCANESTAFF", nameEN: "Great Arcane Staff", nameFR: "Grand bâton arcanique", subcategory: "arcanestaff" },
  // Holy Staffs
  { id: "MAIN_HOLYSTAFF", nameEN: "Holy Staff", nameFR: "Bâton saint", subcategory: "holystaff" },
  { id: "2H_HOLYSTAFF", nameEN: "Great Holy Staff", nameFR: "Grand bâton saint", subcategory: "holystaff" },
  // Nature Staffs
  { id: "MAIN_NATURESTAFF", nameEN: "Nature Staff", nameFR: "Bâton de nature", subcategory: "naturestaff" },
  { id: "2H_NATURESTAFF", nameEN: "Great Nature Staff", nameFR: "Grand bâton de nature", subcategory: "naturestaff" },
];

interface ArmorDef {
  id: string;
  nameEN: string;
  nameFR: string;
  armorType: string;
}

const ARMOR_PIECES: ArmorDef[] = [
  // Plate
  { id: "HEAD_PLATE_SET1", nameEN: "Plate Helmet", nameFR: "Casque en plaques", armorType: "plate" },
  { id: "ARMOR_PLATE_SET1", nameEN: "Plate Armor", nameFR: "Armure en plaques", armorType: "plate" },
  { id: "SHOES_PLATE_SET1", nameEN: "Plate Boots", nameFR: "Bottes en plaques", armorType: "plate" },
  // Leather
  { id: "HEAD_LEATHER_SET1", nameEN: "Leather Helmet", nameFR: "Casque en cuir", armorType: "leather" },
  { id: "ARMOR_LEATHER_SET1", nameEN: "Leather Jacket", nameFR: "Veste en cuir", armorType: "leather" },
  { id: "SHOES_LEATHER_SET1", nameEN: "Leather Shoes", nameFR: "Chaussures en cuir", armorType: "leather" },
  // Cloth
  { id: "HEAD_CLOTH_SET1", nameEN: "Cloth Cowl", nameFR: "Cagoule en tissu", armorType: "cloth" },
  { id: "ARMOR_CLOTH_SET1", nameEN: "Cloth Robe", nameFR: "Robe en tissu", armorType: "cloth" },
  { id: "SHOES_CLOTH_SET1", nameEN: "Cloth Sandals", nameFR: "Sandales en tissu", armorType: "cloth" },
];

const OFFHANDS: WeaponDef[] = [
  { id: "OFF_SHIELD", nameEN: "Shield", nameFR: "Bouclier", subcategory: "shield" },
  { id: "OFF_TORCH", nameEN: "Torch", nameFR: "Torche", subcategory: "torch" },
  { id: "OFF_BOOK", nameEN: "Tome of Spells", nameFR: "Tome de sorts", subcategory: "book" },
  { id: "OFF_ORB", nameEN: "Muisak", nameFR: "Muisak", subcategory: "orb" },
];

const ENCHANT_LABELS = ["", ".1", ".2", ".3"];

function tierLabel(tier: number, enchant: number): string {
  return `T${tier}${ENCHANT_LABELS[enchant]}`;
}

function generateEquipment(): AlbionItemDef[] {
  const items: AlbionItemDef[] = [];

  for (const weapon of WEAPONS) {
    for (let tier = 4; tier <= 8; tier++) {
      for (let enchant = 0; enchant <= 3; enchant++) {
        const suffix = enchant > 0 ? `@${enchant}` : "";
        const label = tierLabel(tier, enchant);
        items.push({
          id: `T${tier}_${weapon.id}${suffix}`,
          nameEN: `${label} ${weapon.nameEN}`,
          nameFR: `${label} ${weapon.nameFR}`,
          tier,
          enchant,
          category: "weapon",
          subcategory: weapon.subcategory,
        });
      }
    }
  }

  for (const armor of ARMOR_PIECES) {
    for (let tier = 4; tier <= 8; tier++) {
      for (let enchant = 0; enchant <= 3; enchant++) {
        const suffix = enchant > 0 ? `@${enchant}` : "";
        const label = tierLabel(tier, enchant);
        items.push({
          id: `T${tier}_${armor.id}${suffix}`,
          nameEN: `${label} ${armor.nameEN}`,
          nameFR: `${label} ${armor.nameFR}`,
          tier,
          enchant,
          category: "armor",
          subcategory: armor.armorType,
        });
      }
    }
  }

  for (const offhand of OFFHANDS) {
    for (let tier = 4; tier <= 8; tier++) {
      for (let enchant = 0; enchant <= 3; enchant++) {
        const suffix = enchant > 0 ? `@${enchant}` : "";
        const label = tierLabel(tier, enchant);
        items.push({
          id: `T${tier}_${offhand.id}${suffix}`,
          nameEN: `${label} ${offhand.nameEN}`,
          nameFR: `${label} ${offhand.nameFR}`,
          tier,
          enchant,
          category: "offhand",
          subcategory: offhand.subcategory,
        });
      }
    }
  }

  // Capes T4-T8
  const capeNames = {
    en: ["", "", "", "Adept's Cape", "Expert's Cape", "Master's Cape", "Grandmaster's Cape", "Elder's Cape"],
    fr: ["", "", "", "Cape d'adepte", "Cape d'expert", "Cape de maître", "Cape de grand maître", "Cape d'ancien"],
  };
  for (let tier = 4; tier <= 8; tier++) {
    for (let enchant = 0; enchant <= 3; enchant++) {
      const suffix = enchant > 0 ? `@${enchant}` : "";
      const label = tierLabel(tier, enchant);
      items.push({
        id: `T${tier}_CAPE${suffix}`,
        nameEN: `${label} ${capeNames.en[tier]}`,
        nameFR: `${label} ${capeNames.fr[tier]}`,
        tier,
        enchant,
        category: "cape",
        subcategory: "cape",
      });
    }
  }

  // Bags T4-T8
  const bagNames = {
    en: ["", "", "", "Adept's Bag", "Expert's Bag", "Master's Bag", "Grandmaster's Bag", "Elder's Bag"],
    fr: ["", "", "", "Sac d'adepte", "Sac d'expert", "Sac de maître", "Sac de grand maître", "Sac d'ancien"],
  };
  for (let tier = 4; tier <= 8; tier++) {
    items.push({
      id: `T${tier}_BAG`,
      nameEN: `T${tier} ${bagNames.en[tier]}`,
      nameFR: `T${tier} ${bagNames.fr[tier]}`,
      tier,
      enchant: 0,
      category: "bag",
      subcategory: "bag",
    });
  }

  return items;
}

// ─────────────────────────────────────────────
// FULL ITEM LIST (lazy generated)
// ─────────────────────────────────────────────

let _allItems: AlbionItemDef[] | null = null;

export function getAllItems(): AlbionItemDef[] {
  if (_allItems) return _allItems;
  _allItems = [
    ...generateRawResources(),
    ...generateRefinedResources(),
    ...generateEquipment(),
  ];
  return _allItems;
}

export function searchItemDefs(query: string, locale: "fr" | "en" = "en"): AlbionItemDef[] {
  const all = getAllItems();
  if (!query.trim()) return all.slice(0, 100);
  const q = query.toLowerCase();
  return all
    .filter((item) => {
      const name = locale === "fr" ? item.nameFR : item.nameEN;
      return name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
    })
    .slice(0, 100);
}

export function getItemDefById(id: string): AlbionItemDef | undefined {
  return getAllItems().find((item) => item.id === id);
}

export function getItemsByCategory(category: ItemCategory): AlbionItemDef[] {
  return getAllItems().filter((item) => item.category === category);
}

/** Returns only base items (enchant 0) for a given tier */
export function getBaseItemsByTier(tier: number): AlbionItemDef[] {
  return getAllItems().filter((item) => item.tier === tier && item.enchant === 0);
}

/** Popular items for quick market scans (T4-T6, base + .1) */
export function getPopularScanItems(): string[] {
  const all = getAllItems();
  return all
    .filter((item) => {
      // All T4-T6 resources (raw + refined)
      if (
        (item.category === "resource_raw" || item.category === "resource_refined") &&
        item.tier >= 4 && item.tier <= 7
      ) return true;
      // T4-T6 base weapons and armor (enchant 0 and 1)
      if (
        (item.category === "weapon" || item.category === "armor") &&
        item.tier >= 4 && item.tier <= 6 &&
        item.enchant <= 1
      ) return true;
      return false;
    })
    .map((item) => item.id);
}
