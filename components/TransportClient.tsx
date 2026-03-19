"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CITIES } from "@/lib/constants/cities";
import { findTransportOpportunities } from "@/lib/albion/calculations/transport";
import { useAlbionItems } from "@/lib/hooks/useAlbionItems";
import { formatSilver, formatPercent, getProfitColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, ArrowRight, TrendingUp } from "lucide-react";
import type { PriceData } from "@/lib/albion/api";
import type { TransportOpportunity } from "@/lib/albion/calculations/transport";

export function TransportClient() {
  const t = useTranslations("transport");

  // Load items from DB
  const { items: dbItems, isLoading: itemsLoading } = useAlbionItems({ limit: 30 });

  const [prices, setPrices] = useState<PriceData[]>([]);
  const [opportunities, setOpportunities] = useState<TransportOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minProfit, setMinProfit] = useState(10000);
  const [tax, setTax] = useState(8);
  const [fromCity, setFromCity] = useState<string>("all");
  const [toCity, setToCity] = useState<string>("all");

  // Build item names from DB items
  const itemNames = Object.fromEntries(
    dbItems.map((item) => [item.id, item.nameEN])
  );
  const itemIds = dbItems.map((item) => item.id);

  const loadPrices = useCallback(async () => {
    if (itemIds.length === 0) return; // Wait for items to load
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        items: itemIds.join(","),
        locations: CITIES.join(","),
        qualities: "1",
      });
      const res = await fetch(`/api/prices?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: PriceData[] = await res.json();
      setPrices(data);
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

    let filtered = findTransportOpportunities(prices, itemNames, {
      tax: tax / 100,
      minProfit,
    });

    if (fromCity !== "all") {
      filtered = filtered.filter((o) => o.buyCity === fromCity);
    }
    if (toCity !== "all") {
      filtered = filtered.filter((o) => o.sellCity === toCity);
    }

    setOpportunities(filtered.slice(0, 50));
  }, [prices, minProfit, tax, fromCity, toCity]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("filters.minProfit")}</label>
              <Input
                type="number"
                value={minProfit}
                onChange={(e) => setMinProfit(Number(e.target.value))}
                placeholder="10000"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("filters.tax")} (%)</label>
              <Input
                type="number"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
                min={0}
                max={100}
                step={0.5}
              />
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

      {/* Results Table */}
      {!loading && opportunities.length === 0 && !error && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {t("noData")}
          </CardContent>
        </Card>
      )}

      {opportunities.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="albion-table">
              <thead>
                <tr>
                  <th>{t("table.item")}</th>
                  <th>{t("table.from")}</th>
                  <th className="hidden md:table-cell"></th>
                  <th>{t("table.to")}</th>
                  <th>{t("table.buyPrice")}</th>
                  <th>{t("table.sellPrice")}</th>
                  <th>{t("table.profit")}</th>
                  <th>{t("table.profitPercent")}</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp, i) => (
                  <tr key={i}>
                    <td className="font-medium text-white max-w-[200px] truncate">
                      {opp.itemName}
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
