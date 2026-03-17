"use client";

import React, { useState, useCallback } from "react";
import { getPopularScanItems } from "@/lib/albion/itemsList";
import { getItemDefById } from "@/lib/albion/itemsList";
import { findTransportOpportunities } from "@/lib/albion/calculations/transport";
import { findFlipOpportunities, findBlackMarketOpportunities } from "@/lib/albion/calculations/flip";
import { formatSilver, formatPercent } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CITIES } from "@/lib/constants/cities";
import type { PriceData } from "@/lib/albion/api";
import {
  RefreshCw,
  TrendingUp,
  ArrowRight,
  Repeat,
  Store,
  ArrowLeftRight,
  Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type OpportunityType = "transport" | "flip" | "blackmarket";

interface UnifiedOpportunity {
  type: OpportunityType;
  itemId: string;
  itemName: string;
  detail: string; // e.g. "Thetford → Caerleon" or "Flip @ Caerleon"
  profit: number;
  profitPercent: number;
  score: number; // normalized score for ranking
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildItemNames(ids: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const id of ids) {
    const def = getItemDefById(id);
    map[id] = def ? def.nameEN : id;
  }
  return map;
}

const TYPE_CONFIG: Record<
  OpportunityType,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  transport: {
    label: "Transport",
    icon: ArrowLeftRight,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  flip: {
    label: "Flip",
    icon: Repeat,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  blackmarket: {
    label: "Black Market",
    icon: Store,
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TopOpportunities() {
  const [opportunities, setOpportunities] = useState<UnifiedOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const scanItems = getPopularScanItems(); // ~200 items (T4-T6 resources + equipment)
      const itemNames = buildItemNames(scanItems);

      // Fetch prices for all cities in one call (batched internally)
      const params = new URLSearchParams({
        items: scanItems.join(","),
        locations: CITIES.join(","),
        qualities: "1",
      });
      const res = await fetch(`/api/prices?${params}`);
      if (!res.ok) throw new Error("API error");
      const prices: PriceData[] = await res.json();

      const all: UnifiedOpportunity[] = [];

      // ── Transport ──────────────────────────────────────────────────────────
      const transportOpps = findTransportOpportunities(prices, itemNames, {
        tax: 0.08,
        minProfit: 5000,
      }).slice(0, 30);

      for (const opp of transportOpps) {
        all.push({
          type: "transport",
          itemId: opp.itemId,
          itemName: opp.itemName,
          detail: `${opp.buyCity} → ${opp.sellCity}`,
          profit: opp.profit,
          profitPercent: opp.profitPercent,
          score: opp.profit * (1 + opp.profitPercent / 100),
        });
      }

      // ── Flip (all cities) ──────────────────────────────────────────────────
      for (const city of CITIES) {
        const flipOpps = findFlipOpportunities(prices, itemNames, city, 3000).slice(0, 10);
        for (const opp of flipOpps) {
          all.push({
            type: "flip",
            itemId: opp.itemId,
            itemName: opp.itemName,
            detail: `Flip @ ${opp.city}`,
            profit: opp.margin,
            profitPercent: opp.marginPercent,
            score: opp.margin * (1 + opp.marginPercent / 100),
          });
        }
      }

      // ── Black Market ───────────────────────────────────────────────────────
      for (const city of CITIES.filter((c) => c !== "Caerleon")) {
        const localPrices = prices.filter(
          (p) => p.city.toLowerCase() === city.toLowerCase()
        );
        const caerleonPrices = prices.filter(
          (p) => p.city.toLowerCase() === "caerleon"
        );
        const bmOpps = findBlackMarketOpportunities(
          localPrices,
          caerleonPrices,
          itemNames,
          3000
        ).slice(0, 5);
        for (const opp of bmOpps) {
          all.push({
            type: "blackmarket",
            itemId: opp.itemId,
            itemName: opp.itemName,
            detail: `${city} → BM Caerleon`,
            profit: opp.margin,
            profitPercent: opp.marginPercent,
            score: opp.margin * (1 + opp.marginPercent / 100),
          });
        }
      }

      // Sort by score and deduplicate by itemId+type
      const seen = new Set<string>();
      const deduped = all
        .sort((a, b) => b.score - a.score)
        .filter((o) => {
          const key = `${o.type}_${o.itemId}_${o.detail}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 20);

      setOpportunities(deduped);
      setLastUpdate(new Date());
    } catch {
      setError("Erreur lors du chargement. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Card className="border-albion-gold/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-albion-gold/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-albion-gold" />
            </div>
            <div>
              <CardTitle className="text-albion-gold">Meilleures opportunités</CardTitle>
              {lastUpdate && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mis à jour à {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={scan}
            disabled={loading}
            className="bg-albion-gold text-albion-dark hover:bg-albion-gold/90 font-semibold"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Analyse en cours..." : "Scanner maintenant"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!loading && opportunities.length === 0 && !error && (
          <div className="text-center py-10 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Cliquez sur &quot;Scanner maintenant&quot;</p>
            <p className="text-sm mt-1">
              Analyse ~200 items sur 7 villes : transport, flip et Black Market
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin text-albion-gold" />
            <span>Récupération des prix sur l&apos;API AODP…</span>
          </div>
        )}

        {opportunities.length > 0 && (
          <div className="space-y-2">
            {opportunities.map((opp, i) => {
              const cfg = TYPE_CONFIG[opp.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  {/* Rank */}
                  <div className="w-7 text-center">
                    <span className={`text-sm font-bold ${i < 3 ? "text-albion-gold" : "text-muted-foreground"}`}>
                      #{i + 1}
                    </span>
                  </div>

                  {/* Type badge */}
                  <div className={`h-8 w-8 rounded-md ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>

                  {/* Item info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {opp.itemName}
                      </span>
                      <Badge variant="outline" className={`text-xs shrink-0 ${cfg.color} border-current`}>
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <ArrowRight className="h-3 w-3" />
                      {opp.detail}
                    </div>
                  </div>

                  {/* Profit */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-green-400">
                      +{formatSilver(opp.profit)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercent(opp.profitPercent)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
