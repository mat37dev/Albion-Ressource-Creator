"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CITIES, type City } from "@/lib/constants/cities";
import { CITY_BONUSES } from "@/lib/constants/bonuses";
import { COMMON_RECIPES, getRecipeForItem } from "@/lib/albion/recipes";
import { COMMON_ITEMS, getItemName } from "@/lib/albion/items";
import { calculateCraftProfit } from "@/lib/albion/calculations/craft";
import { formatSilver, formatPercent, getProfitColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Hammer, TrendingUp, TrendingDown } from "lucide-react";
import type { PriceData } from "@/lib/albion/api";

export function CraftCalculatorClient() {
  const t = useTranslations("craft");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<City>("Lymhurst");
  const [useFocus, setUseFocus] = useState(false);
  const [specialization, setSpecialization] = useState(0);
  const [materialPrices, setMaterialPrices] = useState<Record<string, number>>({});
  const [sellPrice, setSellPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateCraftProfit> | null>(null);

  const availableItems = COMMON_RECIPES.map((r) => {
    const item = COMMON_ITEMS.find((i) => i.UniqueName === r.outputItem);
    return {
      id: r.outputItem,
      name: item ? getItemName(item, "en") : r.outputItem,
    };
  });

  const currentRecipe = selectedItem ? getRecipeForItem(selectedItem) : null;

  const loadPrices = async () => {
    if (!currentRecipe) return;
    setLoading(true);
    try {
      const allItems = [
        selectedItem,
        ...currentRecipe.materials.map((m) => m.itemId),
      ];
      const params = new URLSearchParams({
        items: allItems.join(","),
        locations: selectedCity,
        qualities: "1",
      });
      const res = await fetch(`/api/prices?${params}`);
      if (!res.ok) throw new Error("Failed");
      const prices: PriceData[] = await res.json();

      const priceMap: Record<string, number> = {};
      for (const p of prices) {
        if (p.city.toLowerCase() === selectedCity.toLowerCase() && p.sell_price_min > 0) {
          priceMap[p.item_id] = p.sell_price_min;
        }
      }

      const craftedItemPrice = priceMap[selectedItem] || 0;
      setSellPrice(craftedItemPrice);

      const newMaterialPrices: Record<string, number> = {};
      for (const mat of currentRecipe.materials) {
        newMaterialPrices[mat.itemId] = priceMap[mat.itemId] || 0;
      }
      setMaterialPrices(newMaterialPrices);
    } finally {
      setLoading(false);
    }
  };

  const calculate = () => {
    if (!currentRecipe) return;

    const cityBonuses = CITY_BONUSES[selectedCity];
    const hasCityBonus = cityBonuses.refine40.length > 0 || cityBonuses.craft15.length > 0;

    const craftResult = calculateCraftProfit({
      outputItemId: selectedItem,
      materials: currentRecipe.materials.map((m) => ({
        itemId: m.itemId,
        quantity: m.quantity,
        pricePerUnit: materialPrices[m.itemId] || 0,
      })),
      sellPrice,
      city: selectedCity,
      useFocus,
      specialization,
      craftingFee: 0,
      hasCityRefineBonus: hasCityBonus,
    });

    setResult(craftResult);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hammer className="h-5 w-5 text-orange-400" />
            {t("form.calculate")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t("form.item")}</label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger>
                <SelectValue placeholder={t("form.selectItem")} />
              </SelectTrigger>
              <SelectContent>
                {availableItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t("form.city")}</label>
            <Select value={selectedCity} onValueChange={(v) => setSelectedCity(v as City)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                    {CITY_BONUSES[city].craft15.length > 0 && (
                      <span className="text-green-400 ml-1">+15%</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t("form.specialization")}</label>
            <Input
              type="number"
              value={specialization}
              onChange={(e) => setSpecialization(Number(e.target.value))}
              min={0}
              max={100}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="focus"
              checked={useFocus}
              onChange={(e) => setUseFocus(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="focus" className="text-sm text-muted-foreground cursor-pointer">
              {t("form.focus")}
            </label>
          </div>

          {currentRecipe && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Matériaux requis:</p>
              {currentRecipe.materials.map((mat) => {
                const item = COMMON_ITEMS.find((i) => i.UniqueName === mat.itemId);
                return (
                  <div key={mat.itemId} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-300">
                      {item ? getItemName(item, "en") : mat.itemId} × {mat.quantity}
                    </span>
                    <Input
                      type="number"
                      className="w-32 h-7 text-xs"
                      value={materialPrices[mat.itemId] || ""}
                      onChange={(e) => setMaterialPrices(prev => ({
                        ...prev,
                        [mat.itemId]: Number(e.target.value)
                      }))}
                      placeholder="Prix"
                    />
                  </div>
                );
              })}
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-300">Prix de vente</span>
                <Input
                  type="number"
                  className="w-32 h-7 text-xs"
                  value={sellPrice || ""}
                  onChange={(e) => setSellPrice(Number(e.target.value))}
                  placeholder="Prix"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {selectedItem && (
              <Button variant="outline" size="sm" onClick={loadPrices} disabled={loading}>
                {loading ? "Chargement..." : "Charger prix"}
              </Button>
            )}
            <Button
              onClick={calculate}
              disabled={!currentRecipe || sellPrice === 0}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {t("form.calculate")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Résultats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="text-center text-muted-foreground py-8">
              <Hammer className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Configurez et calculez pour voir les résultats</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: t("results.materialCost"), value: formatSilver(result.materialCost), color: "text-red-400" },
                { label: t("results.returnRate"), value: `${result.resourceReturnRate}%`, color: "text-blue-400" },
                { label: t("results.materialsReturned"), value: formatSilver(result.materialsReturned), color: "text-green-400" },
                { label: t("results.craftingFee"), value: formatSilver(result.craftingFee), color: "text-yellow-400" },
                { label: t("results.totalCost"), value: formatSilver(result.totalCost), color: "text-orange-400", bold: true },
                { label: t("results.sellPrice"), value: formatSilver(result.sellPrice), color: "text-purple-400" },
              ].map(({ label, value, color, bold }) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className={`text-sm ${color} ${bold ? "font-bold" : ""}`}>{value}</span>
                </div>
              ))}

              <div className="flex justify-between items-center py-2 rounded-lg bg-secondary/50 px-3">
                <span className="font-semibold text-white">{t("results.profit")}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getProfitColor(result.profit)}`}>
                    {formatSilver(result.profit)}
                  </span>
                  {result.profit >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-muted-foreground">{t("results.roi")}</span>
                <Badge variant={result.roi >= 100 ? "success" : "destructive"}>
                  {formatPercent(result.roi - 100)}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
