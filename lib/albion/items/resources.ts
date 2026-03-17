/**
 * Ressources brutes et raffinées
 *
 * IMPORTANT: Toutes les ressources ne commencent pas à T1!
 * - T1: WOOD, ROCK, HIDE uniquement
 * - T2+: ORE, FIBER commencent à T2
 */

import type { AlbionItem } from "./types";

// ─────────────────────────────────────────────
// RAW RESOURCES
// ─────────────────────────────────────────────

// Ressources T1-T8 (Wood, Rock, Hide)
const RAW_RESOURCE_NAMES_T1: Record<string, { en: string[]; fr: string[] }> = {
  WOOD: {
    en: ["Rough Logs", "Birch Logs", "Chestnut Logs", "Pine Logs", "Cedar Logs", "Bloodoak Logs", "Ashenbark Logs", "Whitewood Logs"],
    fr: ["Bûches brutes", "Bûches de bouleau", "Bûches de châtaignier", "Bûches de pin", "Bûches de cèdre", "Bûches de chêne de sang", "Bûches de frêne", "Bûches de bois blanc"],
  },
  ROCK: {
    en: ["Rough Stone", "Limestone", "Sandstone", "Travertine", "Granite", "Slate", "Basalt", "Marble"],
    fr: ["Pierre brute", "Calcaire", "Grès", "Travertin", "Granite", "Ardoise", "Basalte", "Marbre"],
  },
  HIDE: {
    en: ["Scraps of Hide", "Rugged Hide", "Thin Hide", "Medium Hide", "Heavy Hide", "Robust Hide", "Thick Hide", "Resilient Hide"],
    fr: ["Morceaux de peau", "Peau robuste", "Peau fine", "Peau moyenne", "Peau lourde", "Peau robuste", "Peau épaisse", "Peau résiliente"],
  },
};

// Ressources T2-T8 (Ore, Fiber)
const RAW_RESOURCE_NAMES_T2: Record<string, { en: string[]; fr: string[] }> = {
  ORE: {
    en: ["Copper Ore", "Iron Ore", "Titanium Ore", "Runite Ore", "Meteorite Ore", "Adamantium Ore", "Astralite Ore"],
    fr: ["Minerai de cuivre", "Minerai de fer", "Minerai de titane", "Minerai de runite", "Minerai de météorite", "Minerai d'adamantium", "Minerai d'astralite"],
  },
  FIBER: {
    en: ["Cotton", "Flax", "Hemp", "Skyflower", "Amberleaf Cotton", "Elven Cotton", "Ghostweave Cotton"],
    fr: ["Coton", "Lin", "Chanvre", "Fleur céleste", "Coton d'ambreleaf", "Coton elven", "Coton fantôme"],
  },
};

function generateRawResources(): AlbionItem[] {
  const items: AlbionItem[] = [];

  // Ressources T1-T8 (Wood, Rock, Hide)
  for (const [type, names] of Object.entries(RAW_RESOURCE_NAMES_T1)) {
    for (let tier = 1; tier <= 8; tier++) {
      items.push({
        id: `T${tier}_${type}`,
        nameEN: names.en[tier - 1],
        nameFR: names.fr[tier - 1],
        tier,
        enchant: 0,
        category: "resource_raw",
        subcategory: type.toLowerCase(),
      });
    }
  }

  // Ressources T2-T8 (Ore, Fiber)
  for (const [type, names] of Object.entries(RAW_RESOURCE_NAMES_T2)) {
    for (let tier = 2; tier <= 8; tier++) {
      const nameIdx = tier - 2;
      items.push({
        id: `T${tier}_${type}`,
        nameEN: names.en[nameIdx],
        nameFR: names.fr[nameIdx],
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
// REFINED RESOURCES T2-T8
// ─────────────────────────────────────────────

const REFINED_NAMES: Record<string, { id: string; en: string[]; fr: string[] }> = {
  METALBAR: {
    id: "METALBAR",
    en: ["Bronze Bar", "Steel Bar", "Titanium Bar", "Runite Bar", "Meteorite Bar", "Adamantium Bar", "Astralite Bar"],
    fr: ["Barre de bronze", "Barre d'acier", "Barre de titane", "Barre de runite", "Barre de météorite", "Barre d'adamantium", "Barre d'astralite"],
  },
  PLANKS: {
    id: "PLANKS",
    en: ["Birch Planks", "Chestnut Planks", "Pine Planks", "Cedar Planks", "Bloodoak Planks", "Ashenbark Planks", "Whitewood Planks"],
    fr: ["Planches de bouleau", "Planches de châtaignier", "Planches de pin", "Planches de cèdre", "Planches de chêne de sang", "Planches de frêne", "Planches de bois blanc"],
  },
  CLOTH: {
    id: "CLOTH",
    en: ["Cotton", "Linen", "Wool", "Silk", "Skyweave", "Amberleaf Cloth", "Elven Cloth", "Ghostweave Cloth"],
    fr: ["Coton", "Lin", "Laine", "Soie", "Tissu céleste", "Tissu d'ambreleaf", "Tissu elven", "Tissu fantôme"],
  },
  LEATHER: {
    id: "LEATHER",
    en: ["Cured Leather", "Worked Leather", "Cured Leather", "Hardened Leather", "Reinforced Leather", "Fortified Leather", "Hardened Leather", "Reinforced Leather"],
    fr: ["Cuir tanné", "Cuir travaillé", "Cuir tanné", "Cuir durci", "Cuir renforcé", "Cuir fortifié", "Cuir durci", "Cuir renforcé"],
  },
  STONEBLOCK: {
    id: "STONEBLOCK",
    en: ["Limestone Block", "Sandstone Block", "Travertine Block", "Granite Block", "Slate Block", "Basalt Block", "Marble Block"],
    fr: ["Bloc de calcaire", "Bloc de grès", "Bloc de travertin", "Bloc de granite", "Bloc d'ardoise", "Bloc de basalte", "Bloc de marbre"],
  },
};

function generateRefinedResources(): AlbionItem[] {
  const items: AlbionItem[] = [];
  for (const [, data] of Object.entries(REFINED_NAMES)) {
    for (let tier = 2; tier <= 8; tier++) {
      const nameIdx = tier - 2;
      items.push({
        id: `T${tier}_${data.id}`,
        nameEN: data.en[nameIdx],
        nameFR: data.fr[nameIdx],
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
// EXPORTS
// ─────────────────────────────────────────────

export function getAllResources(): AlbionItem[] {
  return [...generateRawResources(), ...generateRefinedResources()];
}

export function getRawResources(): AlbionItem[] {
  return generateRawResources();
}

export function getRefinedResources(): AlbionItem[] {
  return generateRefinedResources();
}
