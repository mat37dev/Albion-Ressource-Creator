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
import { formatSilver, getProfitColor } from "@/lib/utils";
import { getItemNames } from "@/lib/utils/item-names";
import {
  PREMIUM_TAX_DIRECT,
  PREMIUM_TAX_ORDER,
  NON_PREMIUM_TAX_DIRECT,
  NON_PREMIUM_TAX_ORDER,
} from "@/lib/constants/bonuses";
import type { ToBuyItem, FromInventoryItem } from "@/lib/albion/utils/inventory-craft";

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

  // Compute effective materials (with RRR applied)
  const effectiveMaterials = useMemo(() => {
    const result: Array<{ materialId: string; rawQuantity: number; effectiveQuantity: number }> = [];
    for (const [matId, matReq] of Object.entries(craftBatch.batchState.materials)) {
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
    () =>
      splitMaterialNeeds(
        effectiveMaterials.map((m) => ({ materialId: m.materialId, effectiveQuantity: m.effectiveQuantity })),
        inventory
      ),
    [effectiveMaterials, inventory]
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
  useEffect(() => {
    setToBuyPrices((prev) => {
      const next = { ...prev };
      for (const item of toBuy) {
        if (next[item.materialId] === undefined) next[item.materialId] = 0;
      }
      return next;
    });
    setToBuyCities((prev) => {
      const next = { ...prev };
      for (const item of toBuy) {
        if (!next[item.materialId]) next[item.materialId] = "Lymhurst";
      }
      return next;
    });
  }, [toBuy]);

  const handleLoadPrices = async () => {
    if (toBuy.length === 0) return;
    setLoadingPrices(true);
    try {
      const ids = toBuy.map((m) => m.materialId);
      const BATCH = 50;
      const allPrices: any[] = [];
      for (let i = 0; i < ids.length; i += BATCH) {
        const batch = ids.slice(i, i + BATCH);
        const params = new URLSearchParams({
          items: batch.join(","),
          locations: CITIES.join(","),
          qualities: "1",
        });
        const res = await fetch(`/api/prices?${params}`);
        if (!res.ok) continue;
        const data = await res.json();
        allPrices.push(...data);
      }
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
      let tax = 0;
      if (item.sellType === "direct") tax = isPremium ? PREMIUM_TAX_DIRECT : NON_PREMIUM_TAX_DIRECT;
      else if (item.sellType === "order") tax = isPremium ? PREMIUM_TAX_ORDER : NON_PREMIUM_TAX_ORDER;
      else tax = isPremium ? PREMIUM_TAX_DIRECT : NON_PREMIUM_TAX_DIRECT;
      return sum + price * (1 - tax) * item.quantity;
    }, 0);
  }, [craftBatch.batchState.items, craftBatch.batchState.globalSettings]);

  const totalProfit = totalRevenue - inventoryCost - additionalCost + rrrValue;

  // Build craft payload
  const buildCraftPayload = () => {
    const craftedItems = craftBatch.batchState.items.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
      totalCost: (inventoryCost + additionalCost) * (item.quantity / Math.max(1, craftBatch.batchState.items.reduce((s, i) => s + i.quantity, 0))),
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
      await mutateInventory();
      setValidateSuccess(true);
      setShowConfirm(false);
    } catch (err) {
      setValidateError(err instanceof Error ? err.message : t("error"));
    } finally {
      setIsValidating(false);
    }
  };

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
                          <th className="text-right">{t("resources.stockQty")}</th>
                          <th className="text-right">{t("resources.qtyUsed")}</th>
                          <th className="text-right">{t("resources.pricePerUnit")}</th>
                          <th className="text-right">Total</th>
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
                              {inventory.filter((i) => i.itemId === item.materialId).reduce((s, i) => s + i.quantity, 0).toFixed(0)}
                            </td>
                            <td className="text-right font-semibold text-white">
                              {item.quantityUsed % 1 === 0 ? item.quantityUsed : item.quantityUsed.toFixed(2)}
                            </td>
                            <td className="text-right text-gray-300">
                              {formatSilver(item.weightedPricePerUnit)}
                            </td>
                            <td className="text-right font-semibold text-albion-gold">
                              {formatSilver(item.quantityUsed * item.weightedPricePerUnit)}
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
                        onClick={handleLoadPrices}
                        disabled={loadingPrices}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loadingPrices ? "animate-spin" : ""}`} />
                        Charger prix
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
                              {item.quantityNeeded % 1 === 0 ? item.quantityNeeded : item.quantityNeeded.toFixed(2)}
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
                  Certains items n&apos;ont pas de prix de vente. Utilisez &quot;Charger meilleurs prix&quot; dans l&apos;onglet Items.
                </CardContent>
              </Card>
            )}

            {/* Per-item results table */}
            <Card>
              <CardHeader>
                <CardTitle>Résultats par item</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="albion-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="text-right">Qté</th>
                        <th className="text-right">Prix vente net</th>
                        <th className="text-right">Revenu total</th>
                        <th className="text-right">Coût matériaux</th>
                        <th className="text-right">Profit net</th>
                        <th className="text-right">Marge %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {craftBatch.batchState.items.map((item) => {
                        const { isPremium } = craftBatch.batchState.globalSettings;
                        let tax = 0;
                        if (item.sellType === "direct") tax = isPremium ? PREMIUM_TAX_DIRECT : NON_PREMIUM_TAX_DIRECT;
                        else if (item.sellType === "order") tax = isPremium ? PREMIUM_TAX_ORDER : NON_PREMIUM_TAX_ORDER;
                        else tax = isPremium ? PREMIUM_TAX_DIRECT : NON_PREMIUM_TAX_DIRECT;
                        const netUnit = (item.customSellPrice ?? 0) * (1 - tax);
                        const itemRevenue = netUnit * item.quantity;
                        const totalItems = craftBatch.batchState.items.reduce((s, i) => s + i.quantity, 0);
                        const itemCost = totalItems > 0 ? (inventoryCost + additionalCost) * (item.quantity / totalItems) : 0;
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
                            <td className="text-right">{item.quantity}</td>
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

            {/* Cost breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            </div>

            {/* Total profit */}
            <Card className="border-albion-gold/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("results.totalProfit")}</p>
                    <p className={`text-3xl font-bold mt-1 ${getProfitColor(totalProfit)}`}>
                      {formatSilver(totalProfit)}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    disabled={!session || !hasItems || isValidating}
                    onClick={() => { setValidateError(null); setShowConfirm(true); }}
                    className="bg-albion-gold text-albion-dark hover:bg-albion-gold/90"
                  >
                    {!session
                      ? t("results.loginRequired")
                      : t("results.validate")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* RRR breakdown */}
            {rrrReturns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t("results.rrrReturns")}</CardTitle>
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
                          +{r.quantity.toFixed(2)} ({formatSilver(r.quantity * r.pricePerUnit)})
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
                        -{item.quantityUsed.toFixed(2)} ({formatSilver(item.quantityUsed * item.weightedPricePerUnit)})
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
                        {item.quantityNeeded.toFixed(2)} × {formatSilver(toBuyPrices[item.materialId] ?? 0)}
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
                        <span>{item.itemId}</span>
                      </div>
                      <span className="text-green-400">+{item.quantity}</span>
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
                      <span className="text-green-400">+{r.quantity.toFixed(2)}</span>
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
    </div>
  );
}
