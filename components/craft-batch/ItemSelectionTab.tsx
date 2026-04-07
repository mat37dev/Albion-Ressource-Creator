"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import type { AlbionItem } from "@/lib/db/schema";
import { ItemSelector } from "@/components/shared/ItemSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ItemIcon } from "@/components/ui/item-icon";
import { Trash2, Settings, Package, RefreshCw } from "lucide-react";
import { SELL_LOCATIONS, type SellCity } from "@/lib/constants/cities";
import { getItemNames } from "@/lib/utils/item-names";
import { fetchRecipe } from "@/lib/utils/recipe-cache";

interface ItemSelectionTabProps {
  craftBatch: ReturnType<typeof import("@/lib/hooks/useCraftBatch").useCraftBatch>;
}

export function ItemSelectionTab({ craftBatch }: ItemSelectionTabProps) {
  const locale = useLocale();
  const [globalQuantity, setGlobalQuantity] = useState(1);
  const [itemNames, setItemNames] = useState<Record<string, string>>({});
  const selectedItemIds = new Set(craftBatch.batchState.items.map(i => i.itemId));

  // Load item names for display
  useEffect(() => {
    const itemIds = craftBatch.batchState.items.map(i => i.itemId);
    if (itemIds.length > 0) {
      getItemNames(itemIds, locale as "en" | "fr").then(setItemNames);
    }
  }, [craftBatch.batchState.items, locale]);

  // Handle direct click to toggle item (add/remove)
  const handleItemClick = async (item: AlbionItem) => {
    const isSelected = selectedItemIds.has(item.id);

    if (isSelected) {
      // Remove item
      const batchItem = craftBatch.batchState.items.find(i => i.itemId === item.id);
      if (batchItem) {
        craftBatch.removeItem(batchItem.id);
      }
    } else {
      // Add item with quantity 1 — passe la recette déjà fetchée pour éviter un double appel
      try {
        const recipe = await fetchRecipe(item.id);
        if (!recipe) {
          alert("Aucune recette trouvée pour cet item");
          return;
        }
        await craftBatch.addItem(item.id, recipe.id || item.id, 1, {
          materials: recipe.materials,
          craftingFeeBase: recipe.craftingFeeBase,
        });
      } catch (error) {
        console.error("Error adding item:", error);
        alert("Erreur lors de l'ajout de l'item");
      }
    }
  };

  // Apply global quantity to all items
  const applyGlobalQuantity = () => {
    craftBatch.batchState.items.forEach(item => {
      craftBatch.updateItemConfig(item.id, { quantity: globalQuantity });
    });
  };

  // Load best sell prices for ALL items — délègue à fetchAllPrices qui batch + auto-sélectionne
  const handleLoadAllBestPrices = () => craftBatch.fetchAllPrices();

  // Retourne le prix depuis le cache si disponible, sinon fetch l'API
  const getPriceForCity = async (
    itemId: string,
    city: SellCity,
    sellType: 'direct' | 'order' | 'blackmarket'
  ): Promise<number> => {
    const useBuyPrice = city === "Black Market" || sellType === "direct" || sellType === "blackmarket";
    const cached = craftBatch.batchState.priceCache.get(itemId);
    if (cached) {
      const entry = cached.find(p => p.city === city);
      if (entry) {
        return useBuyPrice ? entry.buy_price_max : entry.sell_price_min;
      }
    }
    // Fallback : fetch si pas en cache
    const params = new URLSearchParams({ items: itemId, locations: city, qualities: "1" });
    const res = await fetch(`/api/prices?${params}`);
    if (!res.ok) return 0;
    const prices = await res.json();
    const cityPrice = prices[0];
    return cityPrice ? (useBuyPrice ? cityPrice.buy_price_max : cityPrice.sell_price_min) : 0;
  };

  // Update price when city changes
  const handleCityChange = async (batchItemId: string, itemId: string, newCity: SellCity) => {
    const batchItem = craftBatch.batchState.items.find(i => i.id === batchItemId);
    const sellType = batchItem?.sellType ?? "order";
    craftBatch.updateItemConfig(batchItemId, { sellCity: newCity });
    try {
      const newPrice = await getPriceForCity(itemId, newCity, sellType);
      craftBatch.updateItemConfig(batchItemId, { customSellPrice: newPrice });
    } catch (error) {
      console.error("Error updating price:", error);
    }
  };

  const handleTypeChange = async (batchItemId: string, itemId: string, newType: 'direct' | 'order') => {
    const batchItem = craftBatch.batchState.items.find(i => i.id === batchItemId);
    if (!batchItem) return;
    craftBatch.updateItemConfig(batchItemId, { sellType: newType });
    try {
      const newPrice = await getPriceForCity(itemId, batchItem.sellCity, newType);
      craftBatch.updateItemConfig(batchItemId, { customSellPrice: newPrice });
    } catch (error) {
      console.error("Error updating price:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Craft Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-albion-gold" />
            <CardTitle>Configuration Craft Globale</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Premium Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPremium"
              checked={craftBatch.batchState.globalSettings.isPremium}
              onCheckedChange={(checked) =>
                craftBatch.updateGlobalSettings({ isPremium: checked as boolean })
              }
            />
            <Label
              htmlFor="isPremium"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Compte Premium (taxes réduites : 4% vente directe, 6.5% ordre de vente)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Item Selector */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-albion-gold" />
          Sélectionner des items à crafter (cliquez pour ajouter/retirer)
        </h3>
        <ItemSelector
          onItemSelect={handleItemClick}
          selectedItems={selectedItemIds}
          multiSelect={true}
          showAddButton={true}
          translationKey="admin.items"
          limit={15}
          craftable={true}
          showCraftableFilter={true}
        />
      </div>

      {/* Global Quantity Control */}
      {craftBatch.batchState.items.length > 0 && (
        <Card className="border-albion-gold/50">
          <CardHeader>
            <CardTitle className="text-sm">Quantité globale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Label htmlFor="globalQuantity" className="text-sm">
                Appliquer à tous les items:
              </Label>
              <Input
                id="globalQuantity"
                type="number"
                min={1}
                value={globalQuantity}
                onChange={(e) => setGlobalQuantity(Number(e.target.value))}
                className="w-24"
              />
              <Button onClick={applyGlobalQuantity} variant="outline" size="sm">
                Appliquer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Items Configuration */}
      {craftBatch.batchState.items.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Configuration des items ({craftBatch.batchState.items.length})</CardTitle>
              <Button
                onClick={handleLoadAllBestPrices}
                disabled={craftBatch.loading}
                className="bg-albion-gold text-albion-dark hover:bg-albion-gold/90"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${craftBatch.loading ? 'animate-spin' : ''}`} />
                Charger meilleurs prix
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead>Ville de vente</TableHead>
                  <TableHead>Type de vente</TableHead>
                  <TableHead className="text-right">Prix unitaire</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {craftBatch.batchState.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ItemIcon item={item.itemId} size={32} />
                        <span className="font-medium">
                          {itemNames[item.itemId] || item.itemId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => craftBatch.updateItemConfig(item.id, { quantity: Number(e.target.value) })}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.sellCity}
                        onValueChange={(city) => handleCityChange(item.id, item.itemId, city as SellCity)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SELL_LOCATIONS.map((city) => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.sellType}
                        onValueChange={(type) => handleTypeChange(item.id, item.itemId, type as 'direct' | 'order')}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="direct">Vente directe</SelectItem>
                          <SelectItem value="order">Ordre de vente</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={item.customSellPrice || 0}
                        onChange={(e) =>
                          craftBatch.updateItemConfig(item.id, {
                            customSellPrice: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-28 text-right"
                        placeholder="Prix"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => craftBatch.removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
