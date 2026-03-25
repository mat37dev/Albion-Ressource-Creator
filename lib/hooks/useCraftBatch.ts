import { useState, useCallback } from "react";
import { CraftBatchState, CraftBatchItem, MaterialRequirement } from "@/lib/albion/types/craft-batch";
import { City, CITIES } from "@/lib/constants/cities";
import { PriceData } from "@/lib/albion/api";

/**
 * Recompute le map des matériaux à partir de la liste d'items (synchrone).
 * Préserve buyCity, buyType, pricePerUnit des matériaux existants.
 */
function computeMaterialsFromItems(
  items: CraftBatchItem[],
  existingMaterials: Record<string, MaterialRequirement>
): Record<string, MaterialRequirement> {
  const materialsMap: Record<string, MaterialRequirement> = {};

  for (const item of items) {
    if (!item.recipeMaterials) continue;

    for (const material of item.recipeMaterials) {
      const totalNeeded = material.quantity * item.quantity;

      if (materialsMap[material.materialItemId]) {
        materialsMap[material.materialItemId].totalQuantity += totalNeeded;
        materialsMap[material.materialItemId].usedInItems.push(item.id);
      } else {
        const existing = existingMaterials[material.materialItemId];
        materialsMap[material.materialItemId] = {
          materialId: material.materialItemId,
          totalQuantity: totalNeeded,
          effectiveQuantity: totalNeeded,
          buyCity: existing?.buyCity ?? "Lymhurst",
          buyType: existing?.buyType ?? "buy",
          pricePerUnit: existing?.pricePerUnit ?? 0,
          totalCost: 0,
          usedInItems: [item.id],
        };
      }
    }
  }

  return materialsMap;
}

export function useCraftBatch() {
  const [batchState, setBatchState] = useState<CraftBatchState>({
    items: [],
    materials: {},
    globalSettings: {
      useFocus: false,
      isPremium: false,
      craftingFeePerNutrition: 0,
    },
    journals: {
      use: false,
      items: [],
    },
    priceCache: new Map(),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ajouter un item au batch (fetch recette + recalcul matériaux)
  const addItem = useCallback(async (itemId: string, recipeId: string, quantity: number = 1) => {
    // Fetch la recette pour stocker les matériaux
    let recipeMaterials: CraftBatchItem['recipeMaterials'] = undefined;
    let craftingFeeBase: number | undefined = undefined;

    try {
      const recipeRes = await fetch(`/api/recipes/${itemId}`);
      if (recipeRes.ok) {
        const recipe = await recipeRes.json();
        recipeMaterials = recipe.materials?.map((m: any) => ({
          materialItemId: m.materialItemId,
          quantity: m.quantity,
        }));
        craftingFeeBase = recipe.craftingFeeBase ?? undefined;
      }
    } catch {
      // pas de recette — item ajouté sans matériaux
    }

    const newItem: CraftBatchItem = {
      id: crypto.randomUUID(),
      itemId,
      recipeId,
      quantity,
      sellCity: "Lymhurst",
      sellType: "order",
      recipeMaterials,
      craftingFeeBase,
    };

    setBatchState(prev => {
      const newItems = [...prev.items, newItem];
      const newMaterials = computeMaterialsFromItems(newItems, prev.materials);
      return { ...prev, items: newItems, materials: newMaterials };
    });

    return newItem.id;
  }, []);

  // Supprimer un item + recalcul matériaux
  const removeItem = useCallback((batchItemId: string) => {
    setBatchState(prev => {
      const newItems = prev.items.filter(item => item.id !== batchItemId);
      const newMaterials = computeMaterialsFromItems(newItems, prev.materials);
      return { ...prev, items: newItems, materials: newMaterials };
    });
  }, []);

  // Mettre à jour la config d'un item (recalcul matériaux si quantité change)
  const updateItemConfig = useCallback((
    batchItemId: string,
    updates: Partial<CraftBatchItem>
  ) => {
    setBatchState(prev => {
      const newItems = prev.items.map(item =>
        item.id === batchItemId ? { ...item, ...updates } : item
      );
      // Recalcul matériaux seulement si la quantité a changé
      if ('quantity' in updates) {
        const newMaterials = computeMaterialsFromItems(newItems, prev.materials);
        return { ...prev, items: newItems, materials: newMaterials };
      }
      return { ...prev, items: newItems };
    });
  }, []);

  // Mettre à jour les settings globaux
  const updateGlobalSettings = useCallback((
    updates: Partial<CraftBatchState['globalSettings']>
  ) => {
    setBatchState(prev => ({
      ...prev,
      globalSettings: { ...prev.globalSettings, ...updates },
    }));
  }, []);

  // Agréger les matériaux (fallback si recipeMaterials manquant — fetch API)
  const aggregateMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const materialsMap: Record<string, MaterialRequirement> = {};

      for (const batchItem of batchState.items) {
        // Utiliser les recipeMaterials cachés si disponibles
        let materials = batchItem.recipeMaterials;

        if (!materials) {
          const recipeRes = await fetch(`/api/recipes/${batchItem.itemId}`);
          if (!recipeRes.ok) continue;
          const recipe = await recipeRes.json();
          materials = recipe.materials?.map((m: any) => ({
            materialItemId: m.materialItemId,
            quantity: m.quantity,
          }));
        }

        if (materials) {
          for (const material of materials) {
            const totalNeeded = material.quantity * batchItem.quantity;

            if (materialsMap[material.materialItemId]) {
              materialsMap[material.materialItemId].totalQuantity += totalNeeded;
              materialsMap[material.materialItemId].usedInItems.push(batchItem.id);
            } else {
              const existing = batchState.materials[material.materialItemId];
              materialsMap[material.materialItemId] = {
                materialId: material.materialItemId,
                totalQuantity: totalNeeded,
                effectiveQuantity: totalNeeded,
                buyCity: existing?.buyCity ?? "Lymhurst",
                buyType: existing?.buyType ?? "buy",
                pricePerUnit: existing?.pricePerUnit ?? 0,
                totalCost: 0,
                usedInItems: [batchItem.id],
              };
            }
          }
        }
      }

      setBatchState(prev => ({ ...prev, materials: materialsMap }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to aggregate materials");
    } finally {
      setLoading(false);
    }
  }, [batchState.items, batchState.materials]);

  // Mettre à jour la config d'un matériau
  const updateMaterialConfig = useCallback((
    materialId: string,
    updates: Partial<MaterialRequirement>
  ) => {
    setBatchState(prev => ({
      ...prev,
      materials: {
        ...prev.materials,
        [materialId]: {
          ...prev.materials[materialId],
          ...updates,
        },
      },
    }));
  }, []);

  // Fetch prices pour tous les items + matériaux
  const fetchAllPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const outputItemIds = batchState.items.map(i => i.itemId);
      const materialIds = Object.keys(batchState.materials);
      const allItemIds = [...new Set([...outputItemIds, ...materialIds])];

      if (allItemIds.length === 0) return;

      const batches: string[][] = [];
      for (let i = 0; i < allItemIds.length; i += 50) {
        batches.push(allItemIds.slice(i, i + 50));
      }

      const allPrices: PriceData[] = [];
      for (const batch of batches) {
        const params = new URLSearchParams({
          items: batch.join(","),
          locations: CITIES.join(","),
          qualities: "1",
        });
        const res = await fetch(`/api/prices?${params}`);
        if (!res.ok) throw new Error("Failed to fetch prices");
        const prices = await res.json();
        allPrices.push(...prices);
      }

      const priceMap = new Map<string, PriceData[]>();
      for (const price of allPrices) {
        if (!priceMap.has(price.item_id)) {
          priceMap.set(price.item_id, []);
        }
        priceMap.get(price.item_id)!.push(price);
      }

      setBatchState(prev => ({ ...prev, priceCache: priceMap }));
      autoSelectBestPrices(priceMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prices");
    } finally {
      setLoading(false);
    }
  }, [batchState.items, batchState.materials]);

  // Sélection automatique des meilleures villes/prix
  const autoSelectBestPrices = useCallback((priceMap: Map<string, PriceData[]>) => {
    setBatchState(prev => {
      const { isPremium } = prev.globalSettings;
      const directTax = isPremium ? 0.04 : 0.08;
      const orderTax  = isPremium ? 0.065 : 0.105;

      const updatedItems = prev.items.map(item => {
        const prices = priceMap.get(item.itemId) || [];

        const bestDirect = prices
          .filter(p => p.buy_price_max > 0)
          .sort((a, b) => b.buy_price_max - a.buy_price_max)[0];

        const bestOrder = prices
          .filter(p => p.sell_price_min > 0)
          .sort((a, b) => b.sell_price_min - a.sell_price_min)[0];

        const directNet = bestDirect ? bestDirect.buy_price_max * (1 - directTax) : 0;
        const orderNet  = bestOrder  ? bestOrder.sell_price_min * (1 - orderTax)  : 0;

        if (directNet >= orderNet && bestDirect) {
          return {
            ...item,
            sellCity: bestDirect.city as City,
            sellType: 'direct' as const,
            customSellPrice: bestDirect.buy_price_max,
          };
        } else if (bestOrder) {
          return {
            ...item,
            sellCity: bestOrder.city as City,
            sellType: 'order' as const,
            customSellPrice: bestOrder.sell_price_min,
          };
        }
        return item;
      });

      const updatedMaterials = { ...prev.materials };
      for (const [matId, matReq] of Object.entries(updatedMaterials)) {
        const prices = priceMap.get(matId) || [];
        const bestBuyPrice = prices
          .filter(p => p.sell_price_min > 0)
          .sort((a, b) => a.sell_price_min - b.sell_price_min)[0];

        if (bestBuyPrice) {
          updatedMaterials[matId] = {
            ...matReq,
            buyCity: bestBuyPrice.city as City,
            pricePerUnit: bestBuyPrice.sell_price_min,
          };
        }
      }

      return { ...prev, items: updatedItems, materials: updatedMaterials };
    });
  }, []);

  return {
    batchState,
    loading,
    error,
    addItem,
    removeItem,
    updateItemConfig,
    updateGlobalSettings,
    updateMaterialConfig,
    aggregateMaterials,
    fetchAllPrices,
  };
}
