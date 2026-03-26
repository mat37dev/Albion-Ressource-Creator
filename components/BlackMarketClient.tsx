"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CITIES, type City } from "@/lib/constants/cities";
import { findBlackMarketOpportunities, type TradeMode } from "@/lib/albion/calculations/flip";
import { useAlbionItems } from "@/lib/hooks/useAlbionItems";
import { formatSilver, formatPercent, getProfitColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OpportunityTable, type ColumnDef } from "@/components/OpportunityTable";
import { ItemIcon } from "@/components/ui/item-icon";
import { RefreshCw, TrendingUp, Store, Loader2, Clock } from "lucide-react";
import type { PriceData } from "@/lib/albion/api";
import type { FlipOpportunity } from "@/lib/albion/calculations/flip";

const BATCH_SIZE = 50;

function formatRelativeTime(isoDate: string): { label: string; color: string } {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  let label: string;
  if (diffMin < 1) label = "< 1min";
  else if (diffMin < 60) label = `${diffMin}min`;
  else if (diffMin < 1440) label = `${Math.floor(diffMin / 60)}h`;
  else label = `${Math.floor(diffMin / 1440)}j`;

  let color: string;
  if (diffMin < 60) color = "text-green-400";
  else if (diffMin < 720) color = "text-yellow-400";
  else color = "text-red-400";

  return { label, color };
}

interface Progress {
  current: number;
  total: number;
}

export function BlackMarketClient() {
  const t = useTranslations("blackMarket");
  const locale = useLocale() as "en" | "fr";

  const { items: dbItems, isLoading: itemsLoading } = useAlbionItems({
    categories: ["weapon", "armor", "offhand", "accessory"],
  });

  const [fromCity, setFromCity] = useState<City>("Lymhurst");
  const [minProfit, setMinProfit] = useState(5000);
  const [buyMode, setBuyMode] = useState<TradeMode>("direct");
  const [sellMode, setSellMode] = useState<TradeMode>("direct");
  const [opportunities, setOpportunities] = useState<FlipOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const itemNames = useMemo(
    () => Object.fromEntries(dbItems.map((item) => [item.id, locale === "fr" ? item.nameFR : item.nameEN])),
    [dbItems, locale]
  );
  const itemIds = useMemo(() => dbItems.map((item) => item.id), [dbItems]);

  const loadAndCalculate = useCallback(async () => {
    if (itemIds.length === 0) return;
    setLoading(true);
    setProgress(null);
    setError(null);
    setOpportunities([]);

    try {
      // Split item IDs into batches to avoid 431 Request Header Fields Too Large
      const batches: string[][] = [];
      for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
        batches.push(itemIds.slice(i, i + BATCH_SIZE));
      }

      const allPrices: PriceData[] = [];
      setProgress({ current: 0, total: batches.length });

      for (let i = 0; i < batches.length; i++) {
        const params = new URLSearchParams({
          items: batches[i].join(","),
          locations: `${fromCity},Black Market`,
          qualities: "1",
        });
        const res = await fetch(`/api/prices?${params}`);
        if (!res.ok) throw new Error("Failed");
        const prices: PriceData[] = await res.json();
        allPrices.push(...prices);
        setProgress({ current: i + 1, total: batches.length });
      }

      const localPrices = allPrices.filter(
        (p) => p.city.toLowerCase() === fromCity.toLowerCase()
      );
      const bmPrices = allPrices.filter(
        (p) => p.city.toLowerCase() === "black market"
      );

      const opps = findBlackMarketOpportunities(
        localPrices,
        bmPrices,
        itemNames,
        minProfit,
        buyMode,
        sellMode
      );
      setOpportunities(opps.slice(0, 50));
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [fromCity, minProfit, buyMode, sellMode, itemIds, itemNames, t]);

  const nonCaerleonCities = CITIES.filter((c) => c !== "Caerleon");

  const localPriceHeader =
    buyMode === "direct" ? t("table.localPriceDirect") : t("table.localPriceOrder");
  const bmPriceHeader =
    sellMode === "direct" ? t("table.bmPriceDirect") : t("table.bmPriceOrder");

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
      key: "localPrice",
      header: localPriceHeader,
      render: (opp) => <span className="text-gray-300">{formatSilver(opp.buyOrderPrice)}</span>,
    },
    {
      key: "bmPrice",
      header: bmPriceHeader,
      render: (opp) => <span className="text-gray-300">{formatSilver(opp.sellOrderPrice)}</span>,
    },
    {
      key: "profit",
      header: t("table.profit"),
      render: (opp) => (
        <span className={`font-semibold ${getProfitColor(opp.margin)}`}>
          {formatSilver(opp.margin)}
        </span>
      ),
    },
    {
      key: "profitPercent",
      header: t("table.profitPercent"),
      render: (opp) => (
        <span className={`flex items-center gap-1 ${getProfitColor(opp.marginPercent)}`}>
          <TrendingUp className="h-3 w-3" />
          {formatPercent(opp.marginPercent)}
        </span>
      ),
    },
    {
      key: "lastUpdated",
      header: t("table.lastUpdated"),
      render: (opp) => {
        if (!opp.lastUpdated) return <span className="text-gray-500">—</span>;
        const { label, color } = formatRelativeTime(opp.lastUpdated);
        return (
          <span className={`flex items-center gap-1 ${color}`}>
            <Clock className="h-3 w-3" />
            {label}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">{t("filters.buyMode")}</label>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={buyMode === "direct" ? "default" : "outline"}
                  className="flex-1 text-xs"
                  onClick={() => setBuyMode("direct")}
                >
                  {t("filters.buyDirect")}
                </Button>
                <Button
                  size="sm"
                  variant={buyMode === "order" ? "default" : "outline"}
                  className="flex-1 text-xs"
                  onClick={() => setBuyMode("order")}
                >
                  {t("filters.buyOrder")}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">{t("filters.sellMode")}</label>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={sellMode === "direct" ? "default" : "outline"}
                  className="flex-1 text-xs"
                  onClick={() => setSellMode("direct")}
                >
                  {t("filters.sellDirect")}
                </Button>
                <Button
                  size="sm"
                  variant={sellMode === "order" ? "default" : "outline"}
                  className="flex-1 text-xs"
                  onClick={() => setSellMode("order")}
                >
                  {t("filters.sellOrder")}
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={loadAndCalculate}
              disabled={loading || itemsLoading}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(loading || itemsLoading) ? "animate-spin" : ""}`} />
              {itemsLoading
                ? "Chargement items..."
                : loading && progress
                ? `Analyse en cours... (${progress.current}/${progress.total} lots)`
                : loading
                ? t("loading")
                : "Analyser BM"}
            </Button>
            {loading && progress && (
              <div className="mt-2">
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {Math.round((progress.current / progress.total) * 100)}% — {itemIds.length} items analysés par lots de {BATCH_SIZE}
                </p>
              </div>
            )}
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

      {loading && progress && progress.current > 0 && opportunities.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin opacity-50" />
            <p className="text-sm">Récupération des prix en cours...</p>
          </CardContent>
        </Card>
      )}

      <OpportunityTable
        rows={opportunities}
        columns={columns}
        title={
          opportunities.length > 0
            ? `${opportunities.length} opportunités — ${fromCity} → Black Market`
            : undefined
        }
      />
    </div>
  );
}
