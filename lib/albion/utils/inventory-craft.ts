import { isRRRExempt } from "./rrr";
import type { InventoryItem } from "@/lib/db/schema";

/**
 * Represents a material needed for crafting
 */
export interface CraftMaterial {
  materialId: string;
  /** Raw quantity needed (before RRR) - used for cost calculation */
  rawQuantity: number;
  /** Effective quantity needed (after RRR) - used for inventory consumption */
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
  /** Weighted average price per unit across consumed lots (adjusted for RRR for cost calculation) */
  weightedPricePerUnit: number;
  /** Original weighted price (not adjusted by RRR, used for RRR returns valuation) */
  originalWeightedPrice: number;
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
 * Uses effectiveQuantity for physical consumption, but adjusts cost to reflect rawQuantity.
 * @param manualSelection Optional manual lot selection override (key: materialId, value: ordered lotIds)
 */
export function splitMaterialNeeds(
  materials: CraftMaterial[],
  inventory: InventoryItem[],
  manualSelection?: Record<string, string[]>
): { fromInventory: FromInventoryItem[]; toBuy: ToBuyItem[] } {
  const fromInventory: FromInventoryItem[] = [];
  const toBuy: ToBuyItem[] = [];

  for (const mat of materials) {
    // Get all inventory lots for this material
    let lots = inventory.filter((inv) => inv.itemId === mat.materialId);

    // Apply manual selection if provided for this material
    if (manualSelection?.[mat.materialId]) {
      const selectedLotIds = manualSelection[mat.materialId];
      lots = selectedLotIds
        .map(id => lots.find(l => l.id === id))
        .filter((l): l is InventoryItem => l !== undefined);
    }
    // Otherwise: use default FIFO (already sorted by createdAt ASC from API)

    // Consume according to rawQuantity (what we actually put in the craft)
    // The RRR will be returned separately
    let remaining = mat.rawQuantity;
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

    const quantityUsed = mat.rawQuantity - remaining;
    if (quantityUsed > 0) {
      const originalWeightedPrice = quantityUsed > 0 ? totalCostFromInventory / quantityUsed : 0;

      fromInventory.push({
        materialId: mat.materialId,
        quantityUsed,
        weightedPricePerUnit: originalWeightedPrice,
        originalWeightedPrice,
        lots: consumedLots,
      });
    }

    if (remaining > 0) {
      toBuy.push({
        materialId: mat.materialId,
        quantityNeeded: remaining,
        pricePerUnit: 0, // Will be set by user
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
          pricePerUnit: invItem.originalWeightedPrice, // Use original price, not adjusted
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
