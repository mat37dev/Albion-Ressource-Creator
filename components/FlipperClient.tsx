"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CITIES, type City } from "@/lib/constants/cities";
import { findFlipOpportunities } from "@/lib/albion/calculations/flip";
import { useAlbionItems } from "@/lib/hooks/useAlbionItems";
import { formatSilver, formatPercent, getProfitColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, TrendingUp } from "lucide-react";
import type { PriceData } from "@/lib/albion/api";
import type { FlipOpportunity } from "@/lib/albion/calculations/flip";

export function FlipperClient() {
  const t = useTranslations("flipper");

  // Load items from DB
  const { items: dbItems, isLoading: itemsLoading } = useAlbionItems({ limit: 100 });

  const [city, setCity] = useState<City>("Caerleon");
  const [minMargin, setMinMargin] = useState(5000);
  const [opportunities, setOpportunities] = useState<FlipOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build item names from DB items
  const itemNames = Object.fromEntries(
    dbItems.map((item) => [item.id, item.nameEN])
  );
  const itemIds = dbItems.map((item) => item.id);

  const qualityLabels: Record<number, string> = {
    1: "Normal",
    2: "Good",
    3: "Outstanding",
    4: "Excellent",
    5: "Masterpiece",
  };

  const loadAndCalculate = useCallback(async () => {
    if (itemIds.length === 0) return; // Wait for items to load
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        items: itemIds.join(","),
        locations: city,
        qualities: "1,2,3",
      });
      const res = await fetch(`/api/prices?${params}`);
      if (!res.ok) throw new Error("Failed");
      const prices: PriceData[] = await res.json();

      const opps = findFlipOpportunities(prices, itemNames, city, minMargin);
      setOpportunities(opps.slice(0, 50));
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }, [city, minMargin, itemIds, itemNames, t]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("filters.city")}</label>
              <Select value={city} onValueChange={(v) => setCity(v as City)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("filters.minMargin")}</label>
              <Input
                type="number"
                value={minMargin}
                onChange={(e) => setMinMargin(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadAndCalculate} disabled={loading || itemsLoading} className="w-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${(loading || itemsLoading) ? "animate-spin" : ""}`} />
                {itemsLoading ? "Chargement items..." : loading ? t("loading") : "Analyser"}
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
            Cliquez sur &quot;Analyser&quot; pour charger les opportunités de flip.
          </CardContent>
        </Card>
      )}

      {opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{opportunities.length} opportunités — {city}</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="albion-table">
              <thead>
                <tr>
                  <th>{t("table.item")}</th>
                  <th>{t("table.quality")}</th>
                  <th>{t("table.buyOrder")}</th>
                  <th>{t("table.sellOrder")}</th>
                  <th>{t("table.margin")}</th>
                  <th>{t("table.marginPercent")}</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp, i) => (
                  <tr key={i}>
                    <td className="font-medium text-white max-w-[180px] truncate">{opp.itemName}</td>
                    <td>
                      <Badge variant="outline" className="text-xs">
                        {qualityLabels[opp.quality] || opp.quality}
                      </Badge>
                    </td>
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
