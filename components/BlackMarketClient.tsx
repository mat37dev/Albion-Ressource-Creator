"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CITIES, type City } from "@/lib/constants/cities";
import { findBlackMarketOpportunities } from "@/lib/albion/calculations/flip";
import { useAlbionItems } from "@/lib/hooks/useAlbionItems";
import { formatSilver, formatPercent, getProfitColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, TrendingUp, Store } from "lucide-react";
import type { PriceData } from "@/lib/albion/api";
import type { FlipOpportunity } from "@/lib/albion/calculations/flip";

export function BlackMarketClient() {
  const t = useTranslations("blackMarket");

  // Load items from DB (weapons, armor, consumables for BM)
  const { items: dbItems, isLoading: itemsLoading } = useAlbionItems({ limit: 100 });

  const [fromCity, setFromCity] = useState<City>("Lymhurst");
  const [minProfit, setMinProfit] = useState(5000);
  const [opportunities, setOpportunities] = useState<FlipOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build item names from DB items
  const itemNames = Object.fromEntries(
    dbItems.map((item) => [item.id, item.nameEN])
  );
  const itemIds = dbItems.map((item) => item.id);

  const loadAndCalculate = useCallback(async () => {
    if (itemIds.length === 0) return; // Wait for items to load
    setLoading(true);
    setError(null);
    try {
      // Fetch prices from selected city AND Caerleon (Black Market)
      const params = new URLSearchParams({
        items: itemIds.join(","),
        locations: `${fromCity},Caerleon`,
        qualities: "1",
      });
      const res = await fetch(`/api/prices?${params}`);
      if (!res.ok) throw new Error("Failed");
      const prices: PriceData[] = await res.json();

      const localPrices = prices.filter(
        (p) => p.city.toLowerCase() === fromCity.toLowerCase()
      );
      const caerleonPrices = prices.filter(
        (p) => p.city.toLowerCase() === "caerleon"
      );

      const opps = findBlackMarketOpportunities(
        localPrices,
        caerleonPrices,
        itemNames,
        minProfit
      );
      setOpportunities(opps.slice(0, 50));
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }, [fromCity, minProfit, itemIds, itemNames, t]);

  const nonCaerleonCities = CITIES.filter((c) => c !== "Caerleon");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("filters.fromCity")}</label>
              <Select value={fromCity} onValueChange={(v) => setFromCity(v as City)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nonCaerleonCities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("filters.minProfit")}</label>
              <Input
                type="number"
                value={minProfit}
                onChange={(e) => setMinProfit(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={loadAndCalculate}
                disabled={loading || itemsLoading}
                className="w-full bg-red-500 hover:bg-red-600 text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(loading || itemsLoading) ? "animate-spin" : ""}`} />
                {itemsLoading ? "Chargement items..." : loading ? t("loading") : "Analyser BM"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-4 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}

      {opportunities.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Cliquez sur &quot;Analyser BM&quot; pour trouver des opportunités Black Market.</p>
          </CardContent>
        </Card>
      )}

      {opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {opportunities.length} opportunités — {fromCity} → Caerleon BM
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="albion-table">
              <thead>
                <tr>
                  <th>{t("table.item")}</th>
                  <th>{t("table.localPrice")}</th>
                  <th>{t("table.bmBuyOrder")}</th>
                  <th>{t("table.profit")}</th>
                  <th>{t("table.profitPercent")}</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp, i) => (
                  <tr key={i}>
                    <td className="font-medium text-white max-w-[200px] truncate">{opp.itemName}</td>
                    <td className="text-gray-300">{formatSilver(opp.buyOrderPrice)}</td>
                    <td className="text-gray-300">{formatSilver(opp.sellOrderPrice)}</td>
                    <td className={`font-semibold ${getProfitColor(opp.margin)}`}>
                      {formatSilver(opp.margin)}
                    </td>
                    <td>
                      <span className={`flex items-center gap-1 ${getProfitColor(opp.marginPercent)}`}>
                        <TrendingUp className="h-3 w-3" />
                        {formatPercent(opp.marginPercent)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
