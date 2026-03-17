/**
 * Consommables : Nourriture et Potions T3-T8
 */

import type { AlbionItem } from "./types";

// ─────────────────────────────────────────────
// FOOD
// ─────────────────────────────────────────────

interface FoodDef {
  id: string;
  nameEN: string;
  nameFR: string;
}

const FOODS: FoodDef[] = [
  // Cooked food
  { id: "MEAL_FISH_STEW", nameEN: "Fish Stew", nameFR: "Ragoût de poisson" },
  { id: "MEAL_WHEAT_PORRIDGE", nameEN: "Wheat Porridge", nameFR: "Bouillie de blé" },
  { id: "MEAL_BEAN_SALAD", nameEN: "Bean Salad", nameFR: "Salade de haricots" },
  { id: "MEAL_CARROT_SOUP", nameEN: "Carrot Soup", nameFR: "Soupe de carottes" },
  { id: "MEAL_GOOSE_PIE", nameEN: "Goose Pie", nameFR: "Tourte à l'oie" },
  { id: "MEAL_ROAST_PORK", nameEN: "Pork Omelette", nameFR: "Omelette au porc" },
  { id: "MEAL_CABBAGE_SOUP", nameEN: "Cabbage Soup", nameFR: "Soupe au chou" },
  { id: "MEAL_POTATO_SALAD", nameEN: "Potato Salad", nameFR: "Salade de pommes de terre" },
  { id: "MEAL_CHICKEN_OMELETTE", nameEN: "Chicken Omelette", nameFR: "Omelette au poulet" },
  { id: "MEAL_GOAT_STEW", nameEN: "Goat Stew", nameFR: "Ragoût de chèvre" },
  { id: "MEAL_GOAT_SANDWICH", nameEN: "Goat Sandwich", nameFR: "Sandwich de chèvre" },
  { id: "MEAL_BEEF_STEW", nameEN: "Beef Stew", nameFR: "Ragoût de bœuf" },
  { id: "MEAL_PORK_PIE", nameEN: "Pork Pie", nameFR: "Tourte au porc" },
  { id: "MEAL_BREAD", nameEN: "Bread", nameFR: "Pain" },
  { id: "MEAL_SANDWICH", nameEN: "Sandwich", nameFR: "Sandwich" },
  { id: "MEAL_SALAD", nameEN: "Salad", nameFR: "Salade" },

  // Raw ingredients
  { id: "FISH_FRESHWATER", nameEN: "River Sturgeon", nameFR: "Esturgeon de rivière" },
  { id: "FISH_SALTWATER", nameEN: "Ocean Herring", nameFR: "Hareng océanique" },
  { id: "WHEAT", nameEN: "Wheat", nameFR: "Blé" },
  { id: "BREAD", nameEN: "Bread", nameFR: "Pain" },
  { id: "CABBAGE", nameEN: "Cabbage", nameFR: "Chou" },
  { id: "BEAN", nameEN: "Beans", nameFR: "Haricots" },
  { id: "MILK", nameEN: "Goat's Milk", nameFR: "Lait de chèvre" },
  { id: "MEAT", nameEN: "Raw Pork", nameFR: "Porc cru" },
  { id: "POTATO", nameEN: "Potato", nameFR: "Pomme de terre" },
  { id: "CARROT", nameEN: "Carrot", nameFR: "Carotte" },
  { id: "EGG", nameEN: "Chicken Eggs", nameFR: "Œufs de poule" },
  { id: "BUTTER", nameEN: "Goat's Butter", nameFR: "Beurre de chèvre" },
  { id: "CORN", nameEN: "Corn", nameFR: "Maïs" },
  { id: "PUMPKIN", nameEN: "Pumpkin", nameFR: "Citrouille" },
];

// ─────────────────────────────────────────────
// POTIONS
// ─────────────────────────────────────────────

const POTIONS: FoodDef[] = [
  { id: "POTION_HEAL", nameEN: "Healing Potion", nameFR: "Potion de soin" },
  { id: "POTION_ENERGY", nameEN: "Energy Potion", nameFR: "Potion d'énergie" },
  { id: "POTION_STONESKIN", nameEN: "Stoneskin Potion", nameFR: "Potion de peau de pierre" },
  { id: "POTION_RESISTANCE", nameEN: "Resistance Potion", nameFR: "Potion de résistance" },
  { id: "POTION_BERSERK", nameEN: "Berserk Potion", nameFR: "Potion de rage" },
  { id: "POTION_CLEANSE", nameEN: "Cleansing Potion", nameFR: "Potion de purification" },
  { id: "POTION_REVIVE", nameEN: "Gigantify Potion", nameFR: "Potion de gigantisme" },
  { id: "POTION_SLOW", nameEN: "Sticky Potion", nameFR: "Potion collante" },
  { id: "POTION_COOLDOWN", nameEN: "Cooldown Potion", nameFR: "Potion de récupération" },
  { id: "POTION_INVULNERABLE", nameEN: "Invulnerability Potion", nameFR: "Potion d'invulnérabilité" },
  { id: "POTION_INVISIBILITY", nameEN: "Invisibility Potion", nameFR: "Potion d'invisibilité" },
];

// ─────────────────────────────────────────────
// GENERATION
// ─────────────────────────────────────────────

function generateFood(): AlbionItem[] {
  const items: AlbionItem[] = [];

  for (const food of FOODS) {
    // Most food exists in T3-T8
    for (let tier = 3; tier <= 8; tier++) {
      items.push({
        id: `T${tier}_${food.id}`,
        nameEN: `T${tier} ${food.nameEN}`,
        nameFR: `T${tier} ${food.nameFR}`,
        tier,
        enchant: 0,
        category: "consumable",
        subcategory: "food",
      });
    }
  }

  return items;
}

function generatePotions(): AlbionItem[] {
  const items: AlbionItem[] = [];

  for (const potion of POTIONS) {
    // Potions exist in T4-T8
    for (let tier = 4; tier <= 8; tier++) {
      items.push({
        id: `T${tier}_${potion.id}`,
        nameEN: `T${tier} ${potion.nameEN}`,
        nameFR: `T${tier} ${potion.nameFR}`,
        tier,
        enchant: 0,
        category: "consumable",
        subcategory: "potion",
      });
    }
  }

  return items;
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────

export function getAllConsumables(): AlbionItem[] {
  return [...generateFood(), ...generatePotions()];
}

export function getFood(): AlbionItem[] {
  return generateFood();
}

export function getPotions(): AlbionItem[] {
  return generatePotions();
}
