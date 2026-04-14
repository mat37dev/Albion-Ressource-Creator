import { CraftBatchState, CraftBatchResult, CraftItemResult, MaterialSummary } from "@/lib/albion/types/craft-batch";
import {
  PREMIUM_TAX_DIRECT,
  PREMIUM_TAX_ORDER,
  NON_PREMIUM_TAX_DIRECT,
  NON_PREMIUM_TAX_ORDER,
  SETUP_FEE,
} from "@/lib/constants/bonuses";
import { getItemNames } from "@/lib/utils/item-names";
import { isRRRExempt } from "@/lib/albion/utils/rrr";

export async function calculateBatchProfit(
  batchState: CraftBatchState,
  locale: "en" | "fr" = "en"
): Promise<CraftBatchResult> {
  const itemResults: CraftItemResult[] = [];
  const { isPremium, craftingFeePerNutrition = 0 } = batchState.globalSettings;

  // Fetch all item names in one batch request
  const allItemIds = [
    ...batchState.items.map((i) => i.itemId),
    ...Object.keys(batchState.materials),
  ];
  const itemNames = await getItemNames(allItemIds, locale);

  // Accumulateur RRR par matériau (pour le résumé)
  const rrrQuantityMap: Record<string, number> = {};

  // Calculer le profit pour chaque item
  for (const item of batchState.items) {
    // Utiliser les recipeMaterials cachés ou refetch
    let recipeMaterials = item.recipeMaterials;
    let craftingFeeBase = item.craftingFeeBase ?? 0;

    if (!recipeMaterials) {
      const recipeRes = await fetch(`/api/recipes/${item.itemId}`);
      if (!recipeRes.ok) {
        console.error(`Failed to fetch recipe for ${item.itemId}`);
        continue;
      }
      const recipe = await recipeRes.json();
      recipeMaterials = recipe.materials?.map((m: any) => ({
        materialItemId: m.materialItemId,
        quantity: m.quantity,
      }));
      craftingFeeBase = recipe.craftingFeeBase ?? 0;
    }

    // RRR spécifique à cet item (ou défaut 18%)
    const itemRRR = (item.rrr !== undefined ? item.rrr : 18) / 100;

    // Nombre d'actions de craft nécessaires (1 craft = outputQuantity items)
    const outputQuantity = item.outputQuantity ?? 1;
    const numCraftActions = item.quantity / outputQuantity;

    // Calculer coût matériaux pour cet item AVEC son RRR spécifique
    let itemMaterialCost = 0;
    if (recipeMaterials) {
      for (const material of recipeMaterials) {
        const matReq = batchState.materials[material.materialItemId];
        if (matReq) {
          const rrr = isRRRExempt(material.materialItemId) ? 0 : itemRRR;
          const effectiveQty = Math.ceil(material.quantity * numCraftActions * (1 - rrr));
          itemMaterialCost += effectiveQty * matReq.pricePerUnit;

          // Accumuler la quantité RRR globale par matériau
          rrrQuantityMap[material.materialItemId] =
            (rrrQuantityMap[material.materialItemId] ?? 0) + effectiveQty;
        }
      }
    }

    // Prix de vente avec taxes
    const sellPrice = item.customSellPrice || 0;
    let taxRate = 0;

    if (item.sellType === 'direct') {
      taxRate = isPremium ? PREMIUM_TAX_DIRECT : NON_PREMIUM_TAX_DIRECT;
    } else if (item.sellType === 'order') {
      taxRate = isPremium ? PREMIUM_TAX_ORDER : NON_PREMIUM_TAX_ORDER;
    } else if (item.sellType === 'blackmarket') {
      taxRate = isPremium ? PREMIUM_TAX_DIRECT : NON_PREMIUM_TAX_DIRECT;
    } else if (item.sellType === 'exchange') {
      taxRate = 0; // Échange : pas de taxe marché
    }

    const netSellPrice = sellPrice * (1 - taxRate);

    // Frais de station (nutrition × prix par nutrition × nombre d'actions de craft)
    const craftingFeePerUnit = craftingFeeBase * craftingFeePerNutrition;
    const totalCraftingFee = craftingFeePerUnit * numCraftActions;

    // Profit
    const totalNetRevenue = netSellPrice * item.quantity;
    const totalCost = itemMaterialCost + totalCraftingFee;
    const totalProfit = totalNetRevenue - totalCost;
    const unitProfit = totalProfit / item.quantity;
    const profitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    const totalTaxForItem = sellPrice * taxRate * item.quantity;

    itemResults.push({
      batchItemId: item.id,
      itemId: item.itemId,
      itemName: itemNames[item.itemId] || item.itemId,
      quantity: item.quantity,
      unitProfit,
      totalProfit,
      profitPercent,
      materialCost: totalCost,
      sellPrice: sellPrice * item.quantity,
      netSellPrice: totalNetRevenue,
      taxPaid: totalTaxForItem,
      taxRate,
      craftingFee: totalCraftingFee,
      sellCity: item.sellCity,
      sellType: item.sellType,
    });
  }

  // Ajouter profit des registres si activés
  let journalProfit = 0;
  if (batchState.journals?.use && batchState.journals.items.length > 0) {
    journalProfit = batchState.journals.items.reduce((sum, journal) => {
      return sum + (journal.sellPrice - journal.buyPrice);
    }, 0);
  }

  const totalProfit = itemResults.reduce((sum, r) => sum + r.totalProfit, 0) + journalProfit;
  const totalCost = itemResults.reduce((sum, r) => sum + r.materialCost, 0);
  const totalRevenue = itemResults.reduce((sum, r) => sum + r.netSellPrice, 0) + journalProfit;
  const totalTaxPaid = itemResults.reduce((sum, r) => sum + r.taxPaid, 0);
  const totalCraftingFees = itemResults.reduce((sum, r) => sum + (r.craftingFee ?? 0), 0);

  // Résumé des matériaux avec quantités brutes ET RRR + taxe d'achat
  const aggregatedMaterials: MaterialSummary[] = Object.entries(batchState.materials).map(
    ([matId, matReq]) => {
      const rrrQty = rrrQuantityMap[matId] ?? matReq.totalQuantity;
      const matCost = rrrQty * matReq.pricePerUnit;
      // Setup fee 2.5% si ordre d'achat
      const buyTaxPaid = matReq.buyType === 'order' ? matCost * SETUP_FEE : 0;
      return {
        materialId: matId,
        materialName: itemNames[matId] || matId,
        totalQuantity: matReq.totalQuantity,
        effectiveQuantity: rrrQty,
        rrrQuantity: rrrQty,
        pricePerUnit: matReq.pricePerUnit,
        totalCost: matCost,
        buyTaxPaid,
        buyCity: matReq.buyCity,
        buyType: matReq.buyType,
      };
    }
  );

  const totalBuyTaxPaid = aggregatedMaterials.reduce((sum, m) => sum + m.buyTaxPaid, 0);

  return {
    itemResults,
    totalProfit,
    totalCost,
    totalRevenue,
    totalTaxPaid,
    totalBuyTaxPaid,
    totalCraftingFees,
    aggregatedMaterials,
    rrr: 0.18,
    journalProfit: journalProfit > 0 ? journalProfit : undefined,
  };
}
