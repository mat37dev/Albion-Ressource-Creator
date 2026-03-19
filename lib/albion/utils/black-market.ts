/**
 * Black Market utility functions
 *
 * The Black Market in Caerleon has special rules:
 * - Only accepts weapons, armor, consumables, accessories
 * - Does NOT accept raw resources or refined materials
 * - Sells only (no buying)
 * - Game buys at fixed price (buy_price_max)
 * - 4.5% market tax applies
 */

export function canSellToBlackMarket(itemId: string): boolean {
  // Exclure les ressources brutes
  if (
    itemId.includes("_ORE") ||
    itemId.includes("_WOOD") ||
    itemId.includes("_HIDE") ||
    itemId.includes("_FIBER") ||
    itemId.includes("_ROCK") ||
    itemId.includes("_STONE")
  ) {
    return false;
  }

  // Exclure les ressources raffinées
  if (
    itemId.includes("_METALBAR") ||
    itemId.includes("_PLANKS") ||
    itemId.includes("_LEATHER") ||
    itemId.includes("_CLOTH")
  ) {
    return false;
  }

  // Les catégories acceptées incluent :
  // - Weapons (MAIN_, 2H_, OFF_)
  // - Armor (HEAD_, ARMOR_, SHOES_)
  // - Consumables (MEAL_, POTION_)
  // - Accessories (BAG_, CAPE_)

  const acceptedPrefixes = [
    "MAIN_",
    "2H_",
    "OFF_",
    "HEAD_",
    "ARMOR_",
    "SHOES_",
    "MEAL_",
    "POTION_",
    "BAG_",
    "CAPE_",
  ];

  return acceptedPrefixes.some((prefix) => itemId.includes(prefix));
}

export function isBlackMarketAvailable(city: string): boolean {
  // Black Market n'est disponible qu'à Caerleon
  return city.toLowerCase() === "caerleon";
}
