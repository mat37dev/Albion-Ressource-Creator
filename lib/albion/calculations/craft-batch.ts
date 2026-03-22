import { CraftBatchState, CraftBatchResult, CraftItemResult, MaterialSummary } from "@/lib/albion/types/craft-batch";
import {
  PREMIUM_TAX_DIRECT,
  PREMIUM_TAX_ORDER,
  NON_PREMIUM_TAX_DIRECT,
  NON_PREMIUM_TAX_ORDER
} from "@/lib/constants/bonuses";
import { getItemNames } from "@/lib/utils/item-names";

export async function calculateBatchProfit(
  batchState: CraftBatchState,
  locale: "en" | "fr" = "en"
): Promise<CraftBatchResult> {
  const itemResults: CraftItemResult[] = [];
  const { isPremium, craftingFeePercent = 0 } = batchState.globalSettings;

  // Fetch all item names in one batch request
  const allItemIds = [
    ...batchState.items.map((i) => i.itemId),
    ...Object.keys(batchState.materials),
  ];
  const itemNames = await getItemNames(allItemIds, locale);

  // Calculer le profit pour chaque item
  for (const item of batchState.items) {
    // Récupérer la recette
    const recipeRes = await fetch(`/api/recipes/${item.itemId}`);
    if (!recipeRes.ok) {
      console.error(`Failed to fetch recipe for ${item.itemId}`);
      continue;
    }
    const recipe = await recipeRes.json();

    // RRR spécifique à cet item (ou défaut 18%)
    const itemRRR = (item.rrr !== undefined ? item.rrr : 18) / 100;

    // Calculer coût matériaux pour cet item AVEC son RRR spécifique
    let itemMaterialCost = 0;
    if (recipe.materials) {
      for (const material of recipe.materials) {
        const matReq = batchState.materials[material.materialItemId];
        if (matReq) {
          const effectiveQty = material.quantity * item.quantity * (1 - itemRRR);
          itemMaterialCost += effectiveQty * matReq.pricePerUnit;
        }
      }
    }

    // Prix de vente avec taxes Premium
    let sellPrice = item.customSellPrice || 0;
    let taxRate = 0;

    if (item.sellType === 'direct') {
      taxRate = isPremium ? PREMIUM_TAX_DIRECT : NON_PREMIUM_TAX_DIRECT;
    } else if (item.sellType === 'order') {
      taxRate = isPremium ? PREMIUM_TAX_ORDER : NON_PREMIUM_TAX_ORDER;
    } else if (item.sellType === 'blackmarket') {
      // Black Market: same as direct
      taxRate = isPremium ? PREMIUM_TAX_DIRECT : NON_PREMIUM_TAX_DIRECT;
    }

    const netSellPrice = sellPrice * (1 - taxRate);

    // Frais de station (% du prix de vente brut, payé au moment du craft)
    const craftingFeePerUnit = sellPrice * (craftingFeePercent / 100);
    const totalCraftingFee = craftingFeePerUnit * item.quantity;

    // Profit
    const totalNetRevenue = netSellPrice * item.quantity;
    const totalCost = itemMaterialCost + totalCraftingFee;
    const totalProfit = totalNetRevenue - totalCost;
    const unitProfit = totalProfit / item.quantity;
    const profitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

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

  // Agréger les totaux
  const totalProfit = itemResults.reduce((sum, r) => sum + r.totalProfit, 0) + journalProfit;
  const totalCost = itemResults.reduce((sum, r) => sum + r.materialCost, 0);
  const totalRevenue = itemResults.reduce((sum, r) => sum + r.netSellPrice, 0) + journalProfit;

  // Résumé des matériaux (affichage brut sans RRR appliqué)
  const aggregatedMaterials: MaterialSummary[] = Object.entries(batchState.materials).map(
    ([matId, matReq]) => ({
      materialId: matId,
      materialName: itemNames[matId] || matId,
      totalQuantity: matReq.totalQuantity,
      effectiveQuantity: matReq.totalQuantity, // Affichage brut, RRR appliqué par item
      pricePerUnit: matReq.pricePerUnit,
      totalCost: matReq.totalQuantity * matReq.pricePerUnit,
      buyCity: matReq.buyCity,
      buyType: matReq.buyType,
    })
  );

  return {
    itemResults,
    totalProfit,
    totalCost,
    totalRevenue,
    aggregatedMaterials,
    rrr: 0.18, // RRR moyen indicatif
    journalProfit: journalProfit > 0 ? journalProfit : undefined,
  };
}
