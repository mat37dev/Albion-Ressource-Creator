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
import { OpportunityTable, type ColumnDef } from "@/components/OpportunityTable";
import { ItemIcon } from "@/components/ui/item-icon";
import { RefreshCw, TrendingUp } from "lucide-react";
import type { PriceData } from "@/lib/albion/api";
import type { FlipOpportunity } from "@/lib/albion/calculations/flip";

const BATCH_SIZE = 50;

const qualityLabels: Record<number, string> = {
  1: "Normal",
  2: "Good",
  3: "Outstanding",
  4: "Excellent",
  5: "Masterpiece",
};

export function FlipperClient() {
  const t = useTranslations("flipper");

  const { items: dbItems, isLoading: itemsLoading } = useAlbionItems({
    categories: ["weapon", "armor", "offhand", "accessory"],
  });

  const [city, setCity] = useState<City>("Caerleon");
  const [minMargin, setMinMargin] = useState(5000);
  const [opportunities, setOpportunities] = useState<FlipOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const itemNames = Object.fromEntries(
    dbItems.map((item) => [item.id, item.nameEN])
  );
  const itemIds = dbItems.map((item) => item.id);

  const loadAndCalculate = useCallback(async () => {
    if (itemIds.length === 0) return;
    setLoading(true);
    setProgress(null);
    setError(null);
    setOpportunities([]);

    try {
      const batches: string[][] = [];
      for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
        batches.push(itemIds.slice(i, i + BATCH_SIZE));
      }

      const allPrices: PriceData[] = [];
      setProgress({ current: 0, total: batches.length });

      for (let i = 0; i < batches.length; i++) {
        const params = new URLSearchParams({
          items: batches[i].join(","),
          locations: city,
          qualities: "1,2,3",
        });
        const res = await fetch(`/api/prices?${params}`);
        if (!res.ok) throw new Error("Failed");
        const prices: PriceData[] = await res.json();
        allPrices.push(...prices);
        setProgress({ current: i + 1, total: batches.length });
      }

      const opps = findFlipOpportunities(allPrices, itemNames, city, minMargin);
      setOpportunities(opps.slice(0, 50));
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [city, minMargin, itemIds, itemNames, t]);

  const columns: ColumnDef<FlipOpportunity>[] = [
    {
      key: "item",
      header: t("table.item"),
      render: (opp) => (
        <div className="flex items-center gap-2">
          <ItemIcon item={opp.itemId} size={32} showTooltip={false} />
          <span className="font-medium text-white max-w-[160px] truncate">{opp.itemName}</span>
        </div>
      ),
    },
    {
      key: "quality",
      header: t("table.quality"),
      render: (opp) => (
        <Badge variant="outline" className="text-xs">
          {qualityLabels[opp.quality] || opp.quality}
        </Badge>
      ),
    },
    {
      key: "buyOrder",
      header: t("table.buyOrder"),
      render: (opp) => <span className="text-gray-300">{formatSilver(opp.buyOrderPrice)}</span>,
    },
    {
      key: "sellOrder",
      header: t("table.sellOrder"),
      render: (opp) => <span className="text-gray-300">{formatSilver(opp.sellOrderPrice)}</span>,
    },
    {
      key: "margin",
      header: t("table.margin"),
      render: (opp) => (
        <span className={`font-semibold ${getProfitColor(opp.margin)}`}>
          {formatSilver(opp.margin)}
        </span>
      ),
    },
    {
      key: "marginPercent",
      header: t("table.marginPercent"),
      render: (opp) => (
        <span className={`flex items-center gap-1 ${getProfitColor(opp.marginPercent)}`}>
          <TrendingUp className="h-3 w-3" />
          {formatPercent(opp.marginPercent)}
        </span>
      ),
    },
  ];

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
            <div className="flex flex-col gap-2">
              <Button onClick={loadAndCalculate} disabled={loading || itemsLoading} className="w-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${(loading || itemsLoading) ? "animate-spin" : ""}`} />
                {itemsLoading
                  ? "Chargement items..."
                  : loading && progress
                  ? `Analyse... (${progress.current}/${progress.total} lots)`
                  : loading
                  ? t("loading")
                  : "Analyser"}
              </Button>
              {loading && progress && (
                <div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
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

      <OpportunityTable
        rows={opportunities}
        columns={columns}
        title={opportunities.length > 0 ? `${opportunities.length} opportunités — ${city}` : undefined}
      />
    </div>
  );
}
