import { useState, useCallback } from "react";
import { CraftBatchState, CraftBatchItem, MaterialRequirement } from "@/lib/albion/types/craft-batch";
import { City, CITIES } from "@/lib/constants/cities";
import { PriceData } from "@/lib/albion/api";

export function useCraftBatch() {
  const [batchState, setBatchState] = useState<CraftBatchState>({
    items: [],
    materials: {},
    globalSettings: {
      useFocus: false,
      isPremium: false,
      craftingFeePercent: 0,
    },
    journals: {
      use: false,
      items: [],
    },
    priceCache: new Map(),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ajouter un item au batch
  const addItem = useCallback(async (itemId: string, recipeId: string, quantity: number = 1) => {
    const newItem: CraftBatchItem = {
      id: crypto.randomUUID(),
      itemId,
      recipeId,
      quantity,
      sellCity: "Lymhurst", // Default, will be updated to best city
      sellType: "order",
    };

    setBatchState(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    // Return the new item ID for reference
    return newItem.id;
  }, []);

  // Supprimer un item du batch
  const removeItem = useCallback((batchItemId: string) => {
    setBatchState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== batchItemId),
    }));
  }, []);

  // Mettre à jour la config d'un item
  const updateItemConfig = useCallback((
    batchItemId: string,
    updates: Partial<CraftBatchItem>
  ) => {
    setBatchState(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === batchItemId ? { ...item, ...updates } : item
      ),
    }));
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

  // Agréger les matériaux requis pour tous les items
  const aggregateMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const materialsMap: Record<string, MaterialRequirement> = {};

      // Pour chaque item du batch, récupérer sa recette et agréger les matériaux
      for (const batchItem of batchState.items) {
        const recipeRes = await fetch(`/api/recipes/${batchItem.itemId}`);
        if (!recipeRes.ok) continue;

        const recipe = await recipeRes.json();

        if (recipe.materials) {
          for (const material of recipe.materials) {
            const totalNeeded = material.quantity * batchItem.quantity;

            if (materialsMap[material.materialItemId]) {
              materialsMap[material.materialItemId].totalQuantity += totalNeeded;
              materialsMap[material.materialItemId].usedInItems.push(batchItem.id);
            } else {
              materialsMap[material.materialItemId] = {
                materialId: material.materialItemId,
                totalQuantity: totalNeeded,
                effectiveQuantity: totalNeeded, // Sera ajusté par RRR
                buyCity: "Lymhurst", // Default
                buyType: "buy",
                pricePerUnit: 0,
                totalCost: 0,
                usedInItems: [batchItem.id],
              };
            }
          }
        }
      }

      setBatchState(prev => ({
        ...prev,
        materials: materialsMap,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to aggregate materials");
    } finally {
      setLoading(false);
    }
  }, [batchState.items]);

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
      // Collecter tous les item IDs (outputs + materials)
      const outputItemIds = batchState.items.map(i => i.itemId);
      const materialIds = Object.keys(batchState.materials);
      const allItemIds = [...new Set([...outputItemIds, ...materialIds])];

      if (allItemIds.length === 0) {
        return;
      }

      // Batch par groupes de 50 (limite API)
      const batches: string[][] = [];
      for (let i = 0; i < allItemIds.length; i += 50) {
        batches.push(allItemIds.slice(i, i + 50));
      }

      // Fetch toutes les villes en une fois
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

      // Mettre en cache
      const priceMap = new Map<string, PriceData[]>();
      for (const price of allPrices) {
        if (!priceMap.has(price.item_id)) {
          priceMap.set(price.item_id, []);
        }
        priceMap.get(price.item_id)!.push(price);
      }

      setBatchState(prev => ({
        ...prev,
        priceCache: priceMap,
      }));

      // Auto-select meilleurs villes/prix
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
      const directTax = isPremium ? 0.04 : 0.08;   // vente instantanée à un ordre d'achat
      const orderTax  = isPremium ? 0.065 : 0.105; // listing au prix minimum du marché

      const updatedItems = prev.items.map(item => {
        const prices = priceMap.get(item.itemId) || [];

        // Vente directe = on remplit le meilleur ordre d'achat existant (buy_price_max)
        const bestDirect = prices
          .filter(p => p.buy_price_max > 0)
          .sort((a, b) => b.buy_price_max - a.buy_price_max)[0];

        // Ordre de vente = on liste au prix compétitif (sell_price_min)
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

      // Pour chaque matériau: trouver ville avec meilleur buy price
      const updatedMaterials = { ...prev.materials };
      for (const [matId, matReq] of Object.entries(updatedMaterials)) {
        const prices = priceMap.get(matId) || [];
        const bestBuyPrice = prices
          .filter(p => p.sell_price_min > 0) // buy from sell orders
          .sort((a, b) => a.sell_price_min - b.sell_price_min)[0];

        if (bestBuyPrice) {
          updatedMaterials[matId] = {
            ...matReq,
            buyCity: bestBuyPrice.city as City,
            pricePerUnit: bestBuyPrice.sell_price_min,
          };
        }
      }

      return {
        ...prev,
        items: updatedItems,
        materials: updatedMaterials,
      };
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
