import { isRRRExempt } from "./rrr";
import type { InventoryItem } from "@/lib/db/schema";

/**
 * Represents a material needed for crafting, with RRR already applied
 */
export interface CraftMaterial {
  materialId: string;
  /** Effective quantity needed (after RRR) */
  effectiveQuantity: number;
}

/**
 * A lot from inventory that will be consumed (partially or fully)
 */
export interface ConsumedLot {
  lotId: string;
  itemId: string;
  quantityUsed: number;
  pricePerUnit: number;
}

/**
 * Result of splitting material needs between inventory and market
 */
export interface FromInventoryItem {
  materialId: string;
  /** Total quantity this material contributes from inventory */
  quantityUsed: number;
  /** Weighted average price per unit across consumed lots */
  weightedPricePerUnit: number;
  /** Individual lot consumptions (for the FIFO validation payload) */
  lots: ConsumedLot[];
}

export interface ToBuyItem {
  materialId: string;
  quantityNeeded: number;
  /** Editable market price */
  pricePerUnit: number;
}

/**
 * Splits material requirements between inventory stock and additional purchases.
 * Consumes inventory lots in FIFO order (earliest createdAt first).
 */
export function splitMaterialNeeds(
  materials: CraftMaterial[],
  inventory: InventoryItem[]
): { fromInventory: FromInventoryItem[]; toBuy: ToBuyItem[] } {
  const fromInventory: FromInventoryItem[] = [];
  const toBuy: ToBuyItem[] = [];

  for (const mat of materials) {
    // Get all inventory lots for this material, sorted FIFO (already sorted by createdAt ASC from API)
    const lots = inventory.filter((inv) => inv.itemId === mat.materialId);

    let remaining = mat.effectiveQuantity;
    const consumedLots: ConsumedLot[] = [];
    let totalCostFromInventory = 0;

    for (const lot of lots) {
      if (remaining <= 0) break;
      const consume = Math.min(lot.quantity, remaining);
      consumedLots.push({
        lotId: lot.id,
        itemId: lot.itemId,
        quantityUsed: consume,
        pricePerUnit: lot.pricePerUnit,
      });
      totalCostFromInventory += consume * lot.pricePerUnit;
      remaining -= consume;
    }

    const quantityUsed = mat.effectiveQuantity - remaining;
    if (quantityUsed > 0) {
      const weightedPrice = quantityUsed > 0 ? totalCostFromInventory / quantityUsed : 0;
      fromInventory.push({
        materialId: mat.materialId,
        quantityUsed,
        weightedPricePerUnit: weightedPrice,
        lots: consumedLots,
      });
    }

    if (remaining > 0) {
      toBuy.push({
        materialId: mat.materialId,
        quantityNeeded: remaining,
        pricePerUnit: 0,
      });
    }
  }

  return { fromInventory, toBuy };
}

/**
 * Computes the total inventory cost for consumed lots
 */
export function computeInventoryCost(fromInventory: FromInventoryItem[]): number {
  return fromInventory.reduce(
    (sum, item) => sum + item.quantityUsed * item.weightedPricePerUnit,
    0
  );
}

export interface RRRReturn {
  materialId: string;
  quantity: number;
  pricePerUnit: number;
  source: "inventory" | "market";
}

/**
 * Computes RRR returns attributed by source (inventory price vs market price).
 * The RRR quantity = totalNeeded - effectiveQuantity (what gets returned).
 * We attribute proportionally between inventory and market.
 */
export function computeRRRReturns(
  rawMaterials: Array<{ materialId: string; rawQuantity: number; effectiveQuantity: number }>,
  fromInventory: FromInventoryItem[],
  toBuy: ToBuyItem[]
): RRRReturn[] {
  const returns: RRRReturn[] = [];

  for (const mat of rawMaterials) {
    if (isRRRExempt(mat.materialId)) continue;

    const rrrTotal = mat.rawQuantity - mat.effectiveQuantity;
    if (rrrTotal <= 0) continue;

    const invItem = fromInventory.find((f) => f.materialId === mat.materialId);
    const buyItem = toBuy.find((b) => b.materialId === mat.materialId);

    const totalEffective = mat.effectiveQuantity;
    const invUsed = invItem?.quantityUsed ?? 0;
    const buyUsed = buyItem ? mat.effectiveQuantity - invUsed : 0;

    if (totalEffective > 0) {
      const invRatio = invUsed / totalEffective;
      const buyRatio = Math.max(0, 1 - invRatio);

      if (invItem && invRatio > 0) {
        returns.push({
          materialId: mat.materialId,
          quantity: rrrTotal * invRatio,
          pricePerUnit: invItem.weightedPricePerUnit,
          source: "inventory",
        });
      }

      if (buyItem && buyRatio > 0) {
        returns.push({
          materialId: mat.materialId,
          quantity: rrrTotal * buyRatio,
          pricePerUnit: buyItem.pricePerUnit,
          source: "market",
        });
      }
    }
  }

  return returns;
}
