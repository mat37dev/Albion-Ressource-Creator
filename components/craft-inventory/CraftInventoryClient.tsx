"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useCraftBatch } from "@/lib/hooks/useCraftBatch";
import { useInventory } from "@/lib/hooks/useInventory";
import { splitMaterialNeeds, computeInventoryCost, computeRRRReturns } from "@/lib/albion/utils/inventory-craft";
import { isRRRExempt, computeRRRQuantity } from "@/lib/albion/utils/rrr";
import { ItemSelectionTab } from "@/components/craft-batch/ItemSelectionTab";
import { SettingsTab } from "@/components/craft-batch/SettingsTab";
import { ItemIcon } from "@/components/ui/item-icon";
import { LotSelector } from "@/components/craft-inventory/LotSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { CITIES, City } from "@/lib/constants/cities";
import { formatSilver, getProfitColor, formatQuantity } from "@/lib/utils";
import { getItemNames } from "@/lib/utils/item-names";
import { fetchClientPrices } from "@/lib/utils/fetch-prices";
import {
  PREMIUM_TAX_DIRECT,
  PREMIUM_TAX_ORDER,
  NON_PREMIUM_TAX_DIRECT,
  NON_PREMIUM_TAX_ORDER,
  SETUP_FEE,
} from "@/lib/constants/bonuses";

interface Props {
  locale: string;
}

export function CraftInventoryClient({ locale }: Props) {
  const t = useTranslations("craftInventory");
  const localeCode = useLocale() as "fr" | "en";
  const { data: session } = useSession();

  const craftBatch = useCraftBatch();
  const { inventory, mutate: mutateInventory } = useInventory();

  const [materialNames, setMaterialNames] = useState<Record<string, string>>({});
  const [toBuyPrices, setToBuyPrices] = useState<Record<string, number>>({});
  const [toBuyCities, setToBuyCities] = useState<Record<string, City>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Confirmation modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validateError, setValidateError] = useState<string | null>(null);
  const [validateSuccess, setValidateSuccess] = useState(false);

  // Workflow states (craft → sell)
  const [isCraftValidated, setIsCraftValidated] = useState(false);
  const [craftedItemIds, setCraftedItemIds] = useState<string[]>([]);
  const [showSellModal, setShowSellModal] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [sellError, setSellError] = useState<string | null>(null);

  // Manual lot selection (key: materialId, value: array of lotIds ordered by consumption preference)
  const [manualLotSelection, setManualLotSelection] = useState<Record<string, string[]>>({});

  // Compute effective materials (with RRR applied)
  const effectiveMaterials = useMemo(() => {
    const result: Array<{ materialId: string; rawQuantity: number; effectiveQuantity: number }> = [];
    for (const [matId] of Object.entries(craftBatch.batchState.materials)) {
      // Compute effective quantity using RRR from each item
      let rawQty = 0;
      let effectiveQty = 0;
      for (const item of craftBatch.batchState.items) {
        if (!item.recipeMaterials) continue;
        const mat = item.recipeMaterials.find((m) => m.materialItemId === matId);
        if (!mat) continue;
        const qty = mat.quantity * item.quantity;
        const rrr = isRRRExempt(matId) ? 0 : (item.rrr ?? 18) / 100;
        rawQty += qty;
        effectiveQty += computeRRRQuantity(matId, qty, rrr);
      }
      if (rawQty > 0) {
        result.push({ materialId: matId, rawQuantity: rawQty, effectiveQuantity: effectiveQty });
      }
    }
    return result;
  }, [craftBatch.batchState.materials, craftBatch.batchState.items]);

  // Split between inventory and market
  const { fromInventory, toBuy } = useMemo(
    () => splitMaterialNeeds(effectiveMaterials, inventory, manualLotSelection),
    [effectiveMaterials, inventory, manualLotSelection]
  );

  // Load material names + crafted item names
  useEffect(() => {
    const matIds = effectiveMaterials.map((m) => m.materialId);
    const craftedIds = craftBatch.batchState.items.map((i) => i.itemId);
    const allIds = [...new Set([...matIds, ...craftedIds])];
    if (allIds.length > 0) {
      getItemNames(allIds, localeCode).then(setMaterialNames);
    }
  }, [effectiveMaterials, craftBatch.batchState.items, localeCode]);

  // Initialize toBuy prices/cities when materials change
  const toBuyIds = useMemo(() => toBuy.map((m) => m.materialId).join(","), [toBuy]);

  useEffect(() => {
    if (toBuy.length === 0) return;

    setToBuyPrices((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const item of toBuy) {
        if (next[item.materialId] === undefined) {
          next[item.materialId] = 0;
          changed = true;
        }
      }
      return changed ? next : prev;
    });

    setToBuyCities((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const item of toBuy) {
        if (!next[item.materialId]) {
          next[item.materialId] = "Lymhurst";
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [toBuyIds, toBuy]);

  // Reset validation state when parameters change
  const itemsFingerprint = useMemo(
    () => JSON.stringify(craftBatch.batchState.items.map(i => ({ id: i.id, qty: i.quantity, price: i.customSellPrice }))),
    [craftBatch.batchState.items]
  );
  const pricesFingerprint = useMemo(() => JSON.stringify(toBuyPrices), [toBuyPrices]);
  const lotsFingerprint = useMemo(() => JSON.stringify(manualLotSelection), [manualLotSelection]);

  useEffect(() => {
    if (isCraftValidated) {
      setIsCraftValidated(false);
      setCraftedItemIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsFingerprint, pricesFingerprint, lotsFingerprint]);

  const handleFetchPrices = async () => {
    if (toBuy.length === 0) return;
    setLoadingPrices(true);
    try {
      const ids = toBuy.map((m) => m.materialId);
      const allPrices = await fetchClientPrices({ items: ids });
      const newPrices: Record<string, number> = {};
      const newCities: Record<string, City> = {};
      for (const mat of toBuy) {
        const prices = allPrices.filter((p) => p.item_id === mat.materialId && p.sell_price_min > 0);
        if (prices.length > 0) {
          const best = prices.sort((a: any, b: any) => a.sell_price_min - b.sell_price_min)[0];
          newPrices[mat.materialId] = best.sell_price_min;
          newCities[mat.materialId] = best.city as City;
        }
      }
      setToBuyPrices((prev) => ({ ...prev, ...newPrices }));
      setToBuyCities((prev) => ({ ...prev, ...newCities }));
    } finally {
      setLoadingPrices(false);
    }
  };

  // Cost calculations
  const inventoryCost = useMemo(() => computeInventoryCost(fromInventory), [fromInventory]);

  const additionalCost = useMemo(
    () => toBuy.reduce((sum, m) => sum + m.quantityNeeded * (toBuyPrices[m.materialId] ?? 0), 0),
    [toBuy, toBuyPrices]
  );

  const rrrReturns = useMemo(
    () => computeRRRReturns(effectiveMaterials, fromInventory, toBuy.map((m) => ({ ...m, pricePerUnit: toBuyPrices[m.materialId] ?? 0 }))),
    [effectiveMaterials, fromInventory, toBuy, toBuyPrices]
  );

  const rrrValue = useMemo(
    () => rrrReturns.reduce((sum, r) => sum + r.quantity * r.pricePerUnit, 0),
    [rrrReturns]
  );

  const totalRevenue = useMemo(() => {
    const { isPremium } = craftBatch.batchState.globalSettings;
    return craftBatch.batchState.items.reduce((sum, item) => {
      const price = item.customSellPrice ?? 0;
      let tax: number;
      if (item.sellType === "direct") tax = isPremium ? PREMIUM_TAX_DIRECT : NON_PREMIUM_TAX_DIRECT;
      else if (item.sellType === "order") tax = isPremium ? PREMIUM_TAX_ORDER : NON_PREMIUM_TAX_ORDER;
      else if (item.sellType === "exchange") tax = 0;
      else tax = isPremium ? PREMIUM_TAX_DIRECT : NON_PREMIUM_TAX_DIRECT;
      return sum + price * (1 - tax) * item.quantity;
    }, 0);
  }, [craftBatch.batchState.items, craftBatch.batchState.globalSettings]);

  const totalTaxPaid = useMemo(() => {
    const { isPremium } = craftBatch.batchState.globalSettings;
    return craftBatch.batchState.items.reduce((sum, item) => {
      const price = item.customSellPrice ?? 0;
      let tax: number;
      if (item.sellType === "direct") tax = isPremium ? PREMIUM_TAX_DIRECT : NON_PREMIUM_TAX_DIRECT;
      else if (item.sellType === "order") tax = isPremium ? PREMIUM_TAX_ORDER : NON_PREMIUM_TAX_ORDER;
      else if (item.sellType === "exchange") tax = 0;
      else tax = isPremium ? PREMIUM_TAX_DIRECT : NON_PREMIUM_TAX_DIRECT;
      return sum + price * tax * item.quantity;
    }, 0);
  }, [craftBatch.batchState.items, craftBatch.batchState.globalSettings]);

  // Calculate total crafting fees
  const totalCraftingFees = useMemo(() => {
    return craftBatch.batchState.items.reduce((sum, item) => {
      const craftingFeeBase = item.craftingFeeBase ?? 0;
      const craftingFeePerNutrition = craftBatch.batchState.globalSettings.craftingFeePerNutrition ?? 0;
      const craftingFeePerUnit = craftingFeeBase * craftingFeePerNutrition;
      return sum + (craftingFeePerUnit * item.quantity);
    }, 0);
  }, [craftBatch.batchState.items, craftBatch.batchState.globalSettings]);

  const totalProfit = totalRevenue - inventoryCost - additionalCost - totalCraftingFees + rrrValue;

  // Build craft payload
  const buildCraftPayload = () => {
    // Net cost = material cost minus RRR value plus crafting fees
    const netCost = inventoryCost + additionalCost - rrrValue + totalCraftingFees;

    const craftedItems = craftBatch.batchState.items.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
      totalCost: netCost * (item.quantity / Math.max(1, craftBatch.batchState.items.reduce((s, i) => s + i.quantity, 0))),
    }));

    return {
      fromInventory: fromInventory.flatMap((f) =>
        f.lots.map((lot) => ({ lotId: lot.lotId, quantityUsed: lot.quantityUsed }))
      ),
      toBuy: toBuy.map((m) => ({
        itemId: m.materialId,
        quantity: m.quantityNeeded,
        pricePerUnit: toBuyPrices[m.materialId] ?? 0,
      })),
      craftedItems,
      rrrReturns: rrrReturns.map((r) => ({
        itemId: r.materialId,
        quantity: r.quantity,
        pricePerUnit: r.pricePerUnit,
        source: r.source,
      })),
    };
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setValidateError(null);
    try {
      const payload = buildCraftPayload();
      const res = await fetch("/api/inventory/craft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "error");
      }
      const data = await res.json();
      await mutateInventory();
      setValidateSuccess(true);
      setShowConfirm(false);
      setIsCraftValidated(true);
      setCraftedItemIds(data.craftedItemIds || []);
    } catch (err) {
      setValidateError(err instanceof Error ? err.message : t("error"));
    } finally {
      setIsValidating(false);
    }
  };

  const handleSellCraft = () => {
    setSellError(null);
    setShowSellModal(true);
  };

  const confirmSell = async () => {
    setIsSelling(true);
    setSellError(null);
    try {
      const res = await fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: craftedItemIds }),
      });
      if (!res.ok) throw new Error("Failed to delete items");
      await mutateInventory();
      setShowSellModal(false);
      setIsCraftValidated(false);
      setCraftedItemIds([]);
      setValidateSuccess(false);
    } catch (err) {
      setSellError(err instanceof Error ? err.message : "Error deleting items");
    } finally {
      setIsSelling(false);
    }
  };

  // Pre-compute total stock per material to avoid repeated filter+reduce in JSX
  const stockByMaterialId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const inv of inventory) {
      map[inv.itemId] = (map[inv.itemId] ?? 0) + inv.quantity;
    }
    return map;
  }, [inventory]);

  const hasItems = craftBatch.batchState.items.length > 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-albion-gold mb-1">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {validateSuccess && (
        <Card className="border-green-500/50 bg-green-950/20">
          <CardContent className="py-4 flex items-center gap-3 text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span>{t("success")}</span>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="items">
            1. {t("tabs.items")}
            {hasItems && (
              <span className="ml-2 text-xs bg-albion-gold text-albion-dark px-2 py-0.5 rounded-full font-bold">
                {craftBatch.batchState.items.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" disabled={!hasItems}>
            2. {t("tabs.settings")}
          </TabsTrigger>
          <TabsTrigger value="resources" disabled={!hasItems}>
            3. {t("tabs.resources")}
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!hasItems}>
            4. {t("tabs.results")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <ItemSelectionTab craftBatch={craftBatch} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab craftBatch={craftBatch} />
        </TabsContent>

        <TabsContent value="resources">
          <div className="space-y-6">
            {/* Table A — From Inventory */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-albion-gold">{t("resources.fromInventory")}</CardTitle>
                  <Badge variant="outline">{fromInventory.length} item(s)</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {fromInventory.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">
                    {t("resources.noInventoryItems")}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="albion-table">
                      <thead>
                        <tr>
                          <th>{t("resources.material")}</th>
                          <th className="text-left">{t("resources.stockQty")}</th>
                          <th className="text-left">{t("resources.qtyUsed")}</th>
                          <th className="text-left">{t("resources.pricePerUnit")}</th>
                          <th className="text-left">Total</th>
                          <th className="text-left">Lots</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fromInventory.map((item) => (
                          <tr key={item.materialId}>
                            <td>
                              <div className="flex items-center gap-2">
                                <ItemIcon item={item.materialId} size={28} showTooltip={false} showLoading={false} />
                                <span className="text-sm">{materialNames[item.materialId] ?? item.materialId}</span>
                              </div>
                            </td>
                            <td className="text-right text-muted-foreground">
                              {formatQuantity(stockByMaterialId[item.materialId] ?? 0)}
                            </td>
                            <td className="text-right font-semibold text-white">
                              {formatQuantity(item.quantityUsed)}
                            </td>
                            <td className="text-right text-gray-300">
                              {formatSilver(item.weightedPricePerUnit)}
                            </td>
                            <td className="text-right font-semibold text-albion-gold">
                              {formatSilver(item.quantityUsed * item.weightedPricePerUnit)}
                            </td>
                            <td>
                              <LotSelector
                                materialId={item.materialId}
                                availableLots={inventory.filter(inv => inv.itemId === item.materialId)}
                                selectedLots={item.lots}
                                manualSelection={manualLotSelection[item.materialId]}
                                onSelectionChange={(lotIds) =>
                                  setManualLotSelection(prev => ({ ...prev, [item.materialId]: lotIds }))
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Table B — Additional Purchases */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t("resources.toBuy")}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{toBuy.length} item(s)</Badge>
                    {toBuy.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleFetchPrices}
                        disabled={loadingPrices}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loadingPrices ? "animate-spin" : ""}`} />
                        {t("resources.loadPrices")}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {toBuy.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">
                    {t("resources.noAdditionalPurchases")}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="albion-table">
                      <thead>
                        <tr>
                          <th>{t("resources.material")}</th>
                          <th className="text-right">{t("resources.qtyNeeded")}</th>
                          <th>{t("resources.buyCity")}</th>
                          <th className="text-right">{t("resources.pricePerUnit")}</th>
                          <th className="text-right">{t("resources.totalCost")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {toBuy.map((item) => (
                          <tr key={item.materialId}>
                            <td>
                              <div className="flex items-center gap-2">
                                <ItemIcon item={item.materialId} size={28} showTooltip={false} showLoading={false} />
                                <span className="text-sm">{materialNames[item.materialId] ?? item.materialId}</span>
                              </div>
                            </td>
                            <td className="text-right font-semibold text-white">
                              {formatQuantity(item.quantityNeeded)}
                            </td>
                            <td>
                              <Select
                                value={toBuyCities[item.materialId] ?? "Lymhurst"}
                                onValueChange={(v) =>
                                  setToBuyCities((prev) => ({ ...prev, [item.materialId]: v as City }))
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CITIES.map((city) => (
                                    <SelectItem key={city} value={city}>{city}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="text-right">
                              <Input
                                type="number"
                                min="0"
                                value={toBuyPrices[item.materialId] ?? 0}
                                onChange={(e) =>
                                  setToBuyPrices((prev) => ({
                                    ...prev,
                                    [item.materialId]: Number(e.target.value),
                                  }))
                                }
                                className="w-28 text-right"
                              />
                            </td>
                            <td className="text-right font-semibold text-albion-gold">
                              {formatSilver(item.quantityNeeded * (toBuyPrices[item.materialId] ?? 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results">
          <div className="space-y-6">
            {/* Warning if sell prices are missing */}
            {craftBatch.batchState.items.some((i) => !i.customSellPrice) && (
              <Card className="border-yellow-500/40 bg-yellow-950/10">
                <CardContent className="py-3 flex items-center gap-2 text-yellow-400 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {t("results.warnMissingPrices")}
                </CardContent>
              </Card>
            )}

            {/* Section 1: Global Results + Recalculate Button + Validation Buttons */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-albion-gold">{t("results.globalSummary")}</h2>
                {toBuy.length > 0 && (
                  <Button onClick={handleFetchPrices} disabled={loadingPrices} size="sm" variant="outline">
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingPrices ? 'animate-spin' : ''}`} />
                    {t("results.recalculate")}
                  </Button>
                )}
              </div>

              {/* Cost breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground mb-1">{t("results.inventoryCost")}</p>
                    <p className="text-xl font-bold text-white">{formatSilver(inventoryCost)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground mb-1">{t("results.additionalCost")}</p>
                    <p className="text-xl font-bold text-white">{formatSilver(additionalCost)}</p>
                  </CardContent>
                </Card>
                {totalCraftingFees > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-xs text-muted-foreground mb-1">{t("results.craftingFees")}</p>
                      <p className="text-xl font-bold text-white">{formatSilver(totalCraftingFees)}</p>
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground mb-1">{t("results.rrrReturns")}</p>
                    <p className="text-xl font-bold text-green-400">+{formatSilver(rrrValue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground mb-1">{t("results.totalRevenue")}</p>
                    <p className="text-xl font-bold text-white">{formatSilver(totalRevenue)}</p>
                  </CardContent>
                </Card>
                <Card className="border-albion-gold/30 bg-albion-gold/5">
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground mb-1">{t("results.totalProfit")}</p>
                    <p className={`text-xl font-bold ${getProfitColor(totalProfit)}`}>
                      {formatSilver(totalProfit)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Récapitulatif des coûts et taxes */}
              <Card className="border-orange-500/30 bg-orange-500/5">
                <CardContent className="pt-4">
                  <p className="text-sm font-semibold text-orange-400 mb-4">Récapitulatif des coûts</p>

                  {/* Tableau des postes de coût */}
                  <div className="space-y-2 mb-4">
                    {/* Coût inventaire */}
                    {inventoryCost > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                          Ressources depuis l&apos;inventaire
                        </span>
                        <span className="font-medium text-white">-{formatSilver(inventoryCost)}</span>
                      </div>
                    )}

                    {/* Coût achats supplémentaires */}
                    {additionalCost > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"></span>
                          Ressources à acheter (achat direct)
                        </span>
                        <span className="font-medium text-white">-{formatSilver(additionalCost)}</span>
                      </div>
                    )}

                    {/* Frais de station */}
                    {totalCraftingFees > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block"></span>
                          Frais de station de craft
                        </span>
                        <span className="font-medium text-purple-400">-{formatSilver(totalCraftingFees)}</span>
                      </div>
                    )}

                    {/* RRR (retour) */}
                    {rrrValue > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                          Retour RRR (ressources récupérées)
                        </span>
                        <span className="font-medium text-emerald-400">+{formatSilver(rrrValue)}</span>
                      </div>
                    )}

                    {/* Taxes de vente */}
                    {totalTaxPaid > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block"></span>
                          Taxes de vente
                        </span>
                        <span className="font-medium text-orange-400">-{formatSilver(totalTaxPaid)}</span>
                      </div>
                    )}

                    <div className="border-t border-white/10 pt-2 flex justify-between items-center text-sm font-semibold">
                      <span className="text-muted-foreground">Total des coûts et taxes</span>
                      <span className="text-red-400">
                        -{formatSilver(inventoryCost + additionalCost + totalCraftingFees + totalTaxPaid - rrrValue)}
                      </span>
                    </div>
                  </div>

                  {/* Détail des taxes de vente par item */}
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-xs text-muted-foreground mb-2">Taxes de vente par item crafté</p>
                    <div className="space-y-1">
                      {craftBatch.batchState.items.map((item) => {
                        const { isPremium } = craftBatch.batchState.globalSettings;
                        const price = item.customSellPrice ?? 0;
                        let taxRate = 0;
                        let taxLabel = "";
                        if (item.sellType === "direct") {
                          taxRate = isPremium ? PREMIUM_TAX_DIRECT : NON_PREMIUM_TAX_DIRECT;
                          taxLabel = `Vente directe — ${(taxRate * 100).toFixed(1)}%`;
                        } else if (item.sellType === "order") {
                          taxRate = isPremium ? PREMIUM_TAX_ORDER : NON_PREMIUM_TAX_ORDER;
                          taxLabel = `Ordre de vente — ${(taxRate * 100).toFixed(1)}% (2.5% setup + ${isPremium ? '4%' : '8%'})`;
                        } else if (item.sellType === "exchange") {
                          taxLabel = "Échange — aucune taxe";
                        }
                        const itemTax = price * taxRate * item.quantity;
                        const grossRevenue = price * item.quantity;
                        return (
                          <div key={item.id} className="flex justify-between text-xs">
                            <div className="text-muted-foreground">
                              <span>{materialNames[item.itemId] ?? item.itemId}</span>
                              <span className="ml-2 text-muted-foreground/60">×{item.quantity} — {taxLabel}</span>
                            </div>
                            <div className="flex gap-3 text-right">
                              <span className="text-muted-foreground/70">brut: {formatSilver(grossRevenue)}</span>
                              <span className="text-orange-400">{itemTax > 0 ? `-${formatSilver(itemTax)}` : "—"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Frais de station par item */}
                  {totalCraftingFees > 0 && (
                    <div className="border-t border-white/10 pt-3 mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Frais de station par item</p>
                      <div className="space-y-1">
                        {craftBatch.batchState.items.map((item) => {
                          const craftingFeeBase = item.craftingFeeBase ?? 0;
                          const craftingFeePerNutrition = craftBatch.batchState.globalSettings.craftingFeePerNutrition ?? 0;
                          const itemFee = craftingFeeBase * craftingFeePerNutrition * item.quantity;
                          if (itemFee === 0) return null;
                          return (
                            <div key={item.id} className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                {materialNames[item.itemId] ?? item.itemId} ×{item.quantity}
                                <span className="ml-2 text-muted-foreground/60">
                                  ({craftingFeeBase} nutrition × {craftingFeePerNutrition} silver)
                                </span>
                              </span>
                              <span className="text-purple-400">-{formatSilver(itemFee)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Validation buttons */}
              <div className="flex items-center justify-end gap-3">
                <Button
                  size="lg"
                  disabled={!session || !hasItems || isValidating || isCraftValidated}
                  onClick={() => { setValidateError(null); setShowConfirm(true); }}
                  className={isCraftValidated ? "bg-gray-500" : "bg-albion-gold text-albion-dark hover:bg-albion-gold/90"}
                >
                  {!session
                    ? t("results.loginRequired")
                    : isCraftValidated
                    ? t("results.alreadyValidated")
                    : t("results.validate")}
                </Button>
                {isCraftValidated && (
                  <Button
                    size="lg"
                    onClick={handleSellCraft}
                    disabled={isSelling}
                    variant="destructive"
                  >
                    {t("results.sellCraft")}
                  </Button>
                )}
              </div>
            </div>

            {/* Section 2: Per-Item Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t("results.itemDetails")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="albion-table">
                    <thead>
                      <tr>
                        <th>{t("results.itemHeaders.item")}</th>
                        <th className="text-right">{t("results.itemHeaders.qty")}</th>
                        <th className="text-right">{t("results.itemHeaders.netPrice")}</th>
                        <th className="text-right">{t("results.itemHeaders.totalRevenue")}</th>
                        <th className="text-right">{t("results.itemHeaders.materialCost")}</th>
                        <th className="text-right">{t("results.itemHeaders.netProfit")}</th>
                        <th className="text-right">{t("results.itemHeaders.margin")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {craftBatch.batchState.items.map((item) => {
                        const { isPremium } = craftBatch.batchState.globalSettings;
                        let tax: number;
                        if (item.sellType === "direct") tax = isPremium ? PREMIUM_TAX_DIRECT : NON_PREMIUM_TAX_DIRECT;
                        else if (item.sellType === "order") tax = isPremium ? PREMIUM_TAX_ORDER : NON_PREMIUM_TAX_ORDER;
                        else if (item.sellType === "exchange") tax = 0;
                        else tax = isPremium ? PREMIUM_TAX_DIRECT : NON_PREMIUM_TAX_DIRECT;
                        const netUnit = (item.customSellPrice ?? 0) * (1 - tax);
                        const itemRevenue = netUnit * item.quantity;
                        const totalItems = craftBatch.batchState.items.reduce((s, i) => s + i.quantity, 0);
                        // Net cost includes materials + crafting fees - RRR value
                        const netTotalCost = inventoryCost + additionalCost + totalCraftingFees - rrrValue;
                        const itemCost = totalItems > 0 ? netTotalCost * (item.quantity / totalItems) : 0;
                        const itemProfit = itemRevenue - itemCost;
                        const margin = itemRevenue > 0 ? (itemProfit / itemRevenue) * 100 : 0;
                        return (
                          <tr key={item.id}>
                            <td>
                              <div className="flex items-center gap-2">
                                <ItemIcon item={item.itemId} size={28} showTooltip={false} showLoading={false} />
                                <span className="text-sm text-white">{materialNames[item.itemId] ?? item.itemId}</span>
                              </div>
                            </td>
                            <td className="text-right">{formatQuantity(item.quantity)}</td>
                            <td className="text-right text-gray-300">{formatSilver(netUnit)}</td>
                            <td className="text-right text-gray-300">{formatSilver(itemRevenue)}</td>
                            <td className="text-right text-gray-300">{formatSilver(itemCost)}</td>
                            <td className={`text-right font-semibold ${getProfitColor(itemProfit)}`}>
                              {formatSilver(itemProfit)}
                            </td>
                            <td className={`text-right text-sm ${getProfitColor(margin)}`}>
                              {margin.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Materials Summary */}
            {effectiveMaterials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("results.resourceSummary")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="albion-table">
                      <thead>
                        <tr>
                          <th>{t("resources.material")}</th>
                          <th className="text-right">{t("results.rawQty")}</th>
                          <th className="text-right">{t("results.rrrQty")}</th>
                          <th className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="w-2 h-2 rounded-full bg-green-400"></span>
                              {t("results.fromInventory")}
                            </div>
                          </th>
                          <th className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                              {t("results.toBuyQty")}
                            </div>
                          </th>
                          <th className="text-right">{t("results.totalCostMat")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {effectiveMaterials.map((mat) => {
                          const invItem = fromInventory.find(f => f.materialId === mat.materialId);
                          const buyItem = toBuy.find(b => b.materialId === mat.materialId);
                          const invQty = invItem?.quantityUsed ?? 0;
                          const buyQty = buyItem?.quantityNeeded ?? 0;
                          const invCost = invQty * (invItem?.weightedPricePerUnit ?? 0);
                          const buyCost = buyQty * (toBuyPrices[mat.materialId] ?? 0);
                          const totalCost = invCost + buyCost;
                          return (
                            <tr key={mat.materialId}>
                              <td>
                                <div className="flex items-center gap-2">
                                  <ItemIcon item={mat.materialId} size={28} showTooltip={false} showLoading={false} />
                                  <span className="text-sm">{materialNames[mat.materialId] ?? mat.materialId}</span>
                                </div>
                              </td>
                              <td className="text-right text-muted-foreground">
                                {formatQuantity(mat.rawQuantity)}
                              </td>
                              <td className="text-right text-white">
                                {formatQuantity(mat.effectiveQuantity)}
                              </td>
                              <td className="text-right text-green-400">
                                {formatQuantity(invQty)}
                              </td>
                              <td className="text-right text-yellow-400">
                                {formatQuantity(buyQty)}
                              </td>
                              <td className="text-right font-semibold text-albion-gold">
                                {formatSilver(totalCost)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* RRR Returns Breakdown */}
            {rrrReturns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t("results.rrrBreakdown")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {rrrReturns.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <ItemIcon item={r.materialId} size={20} showTooltip={false} showLoading={false} />
                          <span className="text-muted-foreground">{materialNames[r.materialId] ?? r.materialId}</span>
                          <Badge variant="outline" className="text-xs">
                            {r.source === "inventory" ? t("results.rrrFromInventory") : t("results.rrrFromMarket")}
                          </Badge>
                        </div>
                        <span className="text-green-400 font-medium">
                          +{formatQuantity(r.quantity)} ({formatSilver(r.quantity * r.pricePerUnit)})
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirmation Modal */}
      <Dialog open={showConfirm} onOpenChange={(open) => !open && setShowConfirm(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("confirmModal.title")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {fromInventory.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  {t("confirmModal.consumedTitle")}
                </p>
                <div className="space-y-1">
                  {fromInventory.map((item) => (
                    <div key={item.materialId} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <ItemIcon item={item.materialId} size={20} showTooltip={false} showLoading={false} />
                        <span>{materialNames[item.materialId] ?? item.materialId}</span>
                      </div>
                      <span className="text-red-400">
                        -{formatQuantity(item.quantityUsed)} ({formatSilver(item.quantityUsed * item.weightedPricePerUnit)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {toBuy.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  {t("confirmModal.purchasesTitle")}
                </p>
                <div className="space-y-1">
                  {toBuy.map((item) => (
                    <div key={item.materialId} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <ItemIcon item={item.materialId} size={20} showTooltip={false} showLoading={false} />
                        <span>{materialNames[item.materialId] ?? item.materialId}</span>
                      </div>
                      <span className="text-gray-300">
                        {formatQuantity(item.quantityNeeded)} × {formatSilver(toBuyPrices[item.materialId] ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {craftBatch.batchState.items.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  {t("confirmModal.craftedTitle")}
                </p>
                <div className="space-y-1">
                  {craftBatch.batchState.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <ItemIcon item={item.itemId} size={20} showTooltip={false} showLoading={false} />
                        <span>{materialNames[item.itemId] ?? item.itemId}</span>
                      </div>
                      <span className="text-green-400">+{formatQuantity(item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rrrReturns.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  {t("confirmModal.rrrTitle")}
                </p>
                <div className="space-y-1">
                  {rrrReturns.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <ItemIcon item={r.materialId} size={20} showTooltip={false} showLoading={false} />
                        <span>{materialNames[r.materialId] ?? r.materialId}</span>
                      </div>
                      <span className="text-green-400">+{formatQuantity(r.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {validateError && (
            <div className="flex items-center gap-2 text-destructive text-sm mt-2">
              <AlertCircle className="h-4 w-4" />
              <span>{validateError}</span>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              {t("confirmModal.cancel")}
            </Button>
            <Button
              onClick={handleValidate}
              disabled={isValidating}
              className="bg-albion-gold text-albion-dark hover:bg-albion-gold/90"
            >
              {isValidating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("confirmModal.confirming")}</>
              ) : (
                t("confirmModal.confirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sell Modal */}
      <Dialog open={showSellModal} onOpenChange={setShowSellModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("sellModal.title")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("sellModal.explanation")}</p>

            <Card className="border-yellow-500/40 bg-yellow-950/10">
              <CardContent className="py-3 flex items-center gap-2 text-yellow-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{t("sellModal.noMoneyTracking")}</span>
              </CardContent>
            </Card>

            {craftBatch.batchState.items.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  {t("sellModal.itemsToRemove")}
                </p>
                <div className="space-y-1">
                  {craftBatch.batchState.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <ItemIcon item={item.itemId} size={20} showTooltip={false} showLoading={false} />
                        <span>{materialNames[item.itemId] ?? item.itemId}</span>
                      </div>
                      <span className="text-red-400">-{formatQuantity(item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {sellError && (
            <div className="flex items-center gap-2 text-destructive text-sm mt-2">
              <AlertCircle className="h-4 w-4" />
              <span>{sellError}</span>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSellModal(false)}>
              {t("sellModal.cancel")}
            </Button>
            <Button
              onClick={confirmSell}
              disabled={isSelling}
              variant="destructive"
            >
              {isSelling ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("sellModal.selling")}</>
              ) : (
                t("sellModal.confirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
