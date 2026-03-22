"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CITIES } from "@/lib/constants/cities";
import { findTransportOpportunities } from "@/lib/albion/calculations/transport";
import { PREMIUM_TAX_DIRECT, NON_PREMIUM_TAX_DIRECT } from "@/lib/constants/bonuses";
import { useAlbionItems } from "@/lib/hooks/useAlbionItems";
import { getItemNames } from "@/lib/utils/item-names";
import { formatSilver, formatPercent, getProfitColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ItemIcon } from "@/components/ui/item-icon";
import { RefreshCw, ArrowRight, TrendingUp, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { PriceData } from "@/lib/albion/api";
import type { TransportOpportunity } from "@/lib/albion/calculations/transport";

type SortCol = "itemName" | "buyCity" | "sellCity" | "buyPrice" | "sellPrice" | "profit" | "profitPercent" | "updatedAt";

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol; sortDir: "asc" | "desc" }) {
  if (sortCol !== col) return <ChevronsUpDown className="h-3 w-3 inline ml-1 opacity-40" />;
  return sortDir === "asc"
    ? <ChevronUp className="h-3 w-3 inline ml-1 text-albion-gold" />
    : <ChevronDown className="h-3 w-3 inline ml-1 text-albion-gold" />;
}

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "< 1 min";
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} h`;
  return `${Math.floor(diffH / 24)} j`;
}

export function TransportClient() {
  const t = useTranslations("transport");
  const locale = useLocale() as "en" | "fr";

  // T4-T8 avec tous les enchantements
  const { items: dbItems, isLoading: itemsLoading } = useAlbionItems({ minTier: 4, maxTier: 8, limit: 1000 });

  const [prices, setPrices] = useState<PriceData[]>([]);
  const [opportunities, setOpportunities] = useState<TransportOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minProfit, setMinProfit] = useState(10000);
  const [isPremium, setIsPremium] = useState(false);
  const [fromCity, setFromCity] = useState<string>("all");
  const [toCity, setToCity] = useState<string>("all");
  const [sortCol, setSortCol] = useState<SortCol>("profit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [itemNames, setItemNames] = useState<Record<string, string>>({});
  const [buyType, setBuyType] = useState<"direct" | "order">("direct");
  const [sellType, setSellType] = useState<"direct" | "order">("order");

  // useMemo pour stabiliser la référence et éviter des re-renders en boucle
  const itemIds = useMemo(() => dbItems.map((item) => item.id), [dbItems]);

  // Noms traduits depuis la DB selon la locale
  useEffect(() => {
    if (itemIds.length === 0) return;
    getItemNames(itemIds, locale).then(setItemNames);
  }, [itemIds, locale]);

  const loadPrices = useCallback(async () => {
    if (itemIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const BATCH = 50;
      const locationsStr = CITIES.join(",");
      const allPrices: PriceData[] = [];

      for (let i = 0; i < itemIds.length; i += BATCH) {
        const batch = itemIds.slice(i, i + BATCH);
        const params = new URLSearchParams({
          items: batch.join(","),
          locations: locationsStr,
          qualities: "1",
        });
        const res = await fetch(`/api/prices?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: PriceData[] = await res.json();
        allPrices.push(...data);

        // Petite pause entre les batches pour respecter le rate-limit AODP
        if (i + BATCH < itemIds.length) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      setPrices(allPrices);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }, [itemIds, t]);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  useEffect(() => {
    if (prices.length === 0) return;
    const tax = isPremium ? PREMIUM_TAX_DIRECT : NON_PREMIUM_TAX_DIRECT;

    let filtered = findTransportOpportunities(prices, itemNames, { tax, minProfit, buyType, sellType });

    if (fromCity !== "all") filtered = filtered.filter((o) => o.buyCity === fromCity);
    if (toCity !== "all") filtered = filtered.filter((o) => o.sellCity === toCity);

    setOpportunities(filtered.slice(0, 50));
  }, [prices, minProfit, isPremium, buyType, sellType, fromCity, toCity, itemNames]);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const sorted = [...opportunities].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    const av = a[sortCol] as string | number;
    const bv = b[sortCol] as string | number;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
    return String(av).localeCompare(String(bv)) * mul;
  });

  const Th = ({ col, children }: { col: SortCol; children: React.ReactNode }) => (
    <th
      className="cursor-pointer select-none hover:text-albion-gold transition-colors whitespace-nowrap"
      onClick={() => handleSort(col)}
    >
      {children}
      <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("filters.minProfit")}</label>
              <Input
                type="number"
                value={minProfit}
                onChange={(e) => setMinProfit(Number(e.target.value))}
                placeholder="10000"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Checkbox
                id="isPremium"
                checked={isPremium}
                onCheckedChange={(v) => setIsPremium(v as boolean)}
              />
              <Label htmlFor="isPremium" className="cursor-pointer text-sm">
                Premium
                <span className="block text-xs text-muted-foreground font-normal">
                  {isPremium ? "Taxe 4%" : "Taxe 8%"}
                </span>
              </Label>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type d&apos;achat</label>
              <Select value={buyType} onValueChange={(v) => setBuyType(v as "direct" | "order")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Achat direct</SelectItem>
                  <SelectItem value="order">Ordre d&apos;achat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type de vente</label>
              <Select value={sellType} onValueChange={(v) => setSellType(v as "direct" | "order")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Vente directe</SelectItem>
                  <SelectItem value="order">Ordre de vente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("filters.fromCity")}</label>
              <Select value={fromCity} onValueChange={setFromCity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allCities")}</SelectItem>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("filters.toCity")}</label>
              <Select value={toCity} onValueChange={setToCity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allCities")}</SelectItem>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button onClick={loadPrices} disabled={loading || itemsLoading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${(loading || itemsLoading) ? "animate-spin" : ""}`} />
              {itemsLoading ? "Chargement items..." : loading ? t("loading") : "Refresh"}
            </Button>
            <span className="text-xs text-muted-foreground">
              {opportunities.length} opportunité(s) trouvée(s)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-4 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}

      {!loading && opportunities.length === 0 && !error && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {t("noData")}
          </CardContent>
        </Card>
      )}

      {sorted.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="albion-table">
              <thead>
                <tr>
                  <Th col="itemName">{t("table.item")}</Th>
                  <Th col="buyCity">{t("table.from")}</Th>
                  <th className="hidden md:table-cell"></th>
                  <Th col="sellCity">{t("table.to")}</Th>
                  <Th col="buyPrice">{t("table.buyPrice")}</Th>
                  <Th col="sellPrice">{t("table.sellPrice")}</Th>
                  <Th col="profit">{t("table.profit")}</Th>
                  <Th col="profitPercent">{t("table.profitPercent")}</Th>
                  <Th col="updatedAt">Actualisé</Th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((opp, i) => (
                  <tr key={i}>
                    <td className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        <ItemIcon item={opp.itemId} size={28} showTooltip={false} showLoading={false} />
                        <span className="max-w-[160px] truncate">{opp.itemName}</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant="outline" className="text-xs">{opp.buyCity}</Badge>
                    </td>
                    <td className="hidden md:table-cell text-muted-foreground">
                      <ArrowRight className="h-4 w-4" />
                    </td>
                    <td>
                      <Badge variant="outline" className="text-xs">{opp.sellCity}</Badge>
                    </td>
                    <td className="text-gray-300">{formatSilver(opp.buyPrice)}</td>
                    <td className="text-gray-300">{formatSilver(opp.sellPrice)}</td>
                    <td className={`font-semibold ${getProfitColor(opp.profit)}`}>
                      {formatSilver(opp.profit)}
                    </td>
                    <td>
                      <span className={`flex items-center gap-1 ${getProfitColor(opp.profitPercent)}`}>
                        <TrendingUp className="h-3 w-3" />
                        {formatPercent(opp.profitPercent)}
                      </span>
                    </td>
                    <td className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatUpdatedAt(opp.updatedAt)}
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
