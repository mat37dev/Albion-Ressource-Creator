export const CITIES = [
  "Thetford",
  "Bridgewatch",
  "Lymhurst",
  "Fort Sterling",
  "Martlock",
  "Caerleon",
  "Brecilien",
] as const;

export type City = (typeof CITIES)[number];

// Emplacements de vente uniquement (inclut le Black Market de Caerleon)
export const SELL_LOCATIONS = [...CITIES, "Black Market"] as const;
export type SellCity = (typeof SELL_LOCATIONS)[number];

export const CITY_SLUGS: Record<City, string> = {
  Thetford: "thetford",
  Bridgewatch: "bridgewatch",
  Lymhurst: "lymhurst",
  "Fort Sterling": "fortsterling",
  Martlock: "martlock",
  Caerleon: "caerleon",
  Brecilien: "brecilien",
};

// Black Market is in Caerleon
export const BLACK_MARKET_CITY = "Caerleon";

export const CITY_COLORS: Record<City, string> = {
  Thetford: "#6B3E26",
  Bridgewatch: "#C17817",
  Lymhurst: "#228B22",
  "Fort Sterling": "#4A90D9",
  Martlock: "#7B68EE",
  Caerleon: "#DC143C",
  Brecilien: "#20B2AA",
};
