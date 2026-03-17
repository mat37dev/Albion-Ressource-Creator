import { BASE_RRR, CITY_REFINE_BONUS } from "../../constants/bonuses";
import type { City } from "../../constants/cities";
import type { ResourceType, WeaponCategory, ArmorCategory } from "../../constants/bonuses";

export interface CraftMaterial {
  itemId: string;
  quantity: number;
  pricePerUnit: number;
}

export interface CraftCalculationInput {
  outputItemId: string;
  materials: CraftMaterial[];
  sellPrice: number;
  city: City;
  useFocus: boolean;
  specialization: number; // 0-100
  craftingFee?: number; // flat fee
  resourceType?: ResourceType;
  itemCategory?: WeaponCategory | ArmorCategory;
  hasCityRefineBonus?: boolean;
  hasCityCraftBonus?: boolean;
}

export interface CraftCalculationResult {
  materialCost: number;
  resourceReturnRate: number;
  materialsReturned: number;
  effectiveMaterialCost: number;
  craftingFee: number;
  totalCost: number;
  sellPrice: number;
  profit: number;
  profitPercent: number;
  roi: number;
}

export function calculateRRR(
  useFocus: boolean,
  specialization: number,
  hasCityBonus: boolean
): number {
  // Base RRR: 18%
  let rrr = BASE_RRR;

  // City refine bonus: +40%
  if (hasCityBonus) {
    rrr += CITY_REFINE_BONUS;
  }

  // Focus bonus scales with specialization (0% at spec 0, +59% at spec 100 with focus)
  if (useFocus) {
    const focusBonus = (specialization / 100) * 0.59 + (1 - specialization / 100) * 0.15;
    rrr += focusBonus;
  }

  // Cap at 95%
  return Math.min(rrr, 0.95);
}

export function calculateCraftProfit(
  input: CraftCalculationInput
): CraftCalculationResult {
  const { materials, sellPrice, useFocus, specialization, craftingFee = 0 } = input;
  const hasCityBonus = input.hasCityRefineBonus || false;

  // Total material cost
  const materialCost = materials.reduce(
    (sum, m) => sum + m.quantity * m.pricePerUnit,
    0
  );

  // Resource return rate
  const rrr = calculateRRR(useFocus, specialization, hasCityBonus);

  // Materials returned value
  const materialsReturned = materialCost * rrr;

  // Effective material cost
  const effectiveMaterialCost = materialCost - materialsReturned;

  // Total cost
  const totalCost = effectiveMaterialCost + craftingFee;

  // Profit (accounting for market tax 4.5%)
  const netSellPrice = sellPrice * (1 - 0.045);
  const profit = Math.round(netSellPrice - totalCost);

  const profitPercent = totalCost > 0 ? Math.round((profit / totalCost) * 100 * 10) / 10 : 0;
  const roi = totalCost > 0 ? Math.round((netSellPrice / totalCost) * 100 * 10) / 10 : 0;

  return {
    materialCost: Math.round(materialCost),
    resourceReturnRate: Math.round(rrr * 1000) / 10,
    materialsReturned: Math.round(materialsReturned),
    effectiveMaterialCost: Math.round(effectiveMaterialCost),
    craftingFee: Math.round(craftingFee),
    totalCost: Math.round(totalCost),
    sellPrice: Math.round(netSellPrice),
    profit,
    profitPercent,
    roi,
  };
}
