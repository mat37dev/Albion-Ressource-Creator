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
import { CITIES, type City } from "@/lib/constants/cities";
import { getItemNames } from "@/lib/utils/item-names";

interface ItemSelectionTabProps {
  craftBatch: ReturnType<typeof import("@/lib/hooks/useCraftBatch").useCraftBatch>;
}

export function ItemSelectionTab({ craftBatch }: ItemSelectionTabProps) {
  const locale = useLocale();
  const [globalQuantity, setGlobalQuantity] = useState(1);
  const [itemNames, setItemNames] = useState<Record<string, string>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

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
      // Add item with quantity 1
      try {
        const res = await fetch(`/api/recipes/${item.id}`);
        if (!res.ok) {
          alert("Aucune recette trouvée pour cet item");
          return;
        }
        const recipe = await res.json();
        await craftBatch.addItem(item.id, recipe.id || item.id, 1);
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

  // Load best sell prices for ALL items
  const handleLoadAllBestPrices = async () => {
    setLoadingPrices(true);
    try {
      const isPremium = craftBatch.batchState.globalSettings.isPremium;

      for (const batchItem of craftBatch.batchState.items) {
        const params = new URLSearchParams({
          items: batchItem.itemId,
          locations: CITIES.join(","),
          qualities: "1",
        });
        const res = await fetch(`/api/prices?${params}`);
        if (!res.ok) continue;

        const prices = await res.json();

        // Find best direct sell and best order (ignore prices = 0)
        let bestDirect = { price: 0, city: "Lymhurst" as City };
        let bestOrder = { price: 0, city: "Lymhurst" as City };

        prices.forEach((p: any) => {
          // Ignore prices at 0 (no data from API)
          if (p.sell_price_min > 0 && p.sell_price_min > bestDirect.price) {
            bestDirect = { price: p.sell_price_min, city: p.city as City };
          }
          if (p.sell_price_max > 0 && p.sell_price_max > bestOrder.price) {
            bestOrder = { price: p.sell_price_max, city: p.city as City };
          }
        });

        // If no valid prices found, skip
        if (bestDirect.price === 0 && bestOrder.price === 0) continue;

        // Compare net prices (after taxes)
        const directNet = bestDirect.price * (isPremium ? 0.96 : 0.92); // -4% or -8%
        const orderNet = bestOrder.price * (isPremium ? 0.935 : 0.895); // -6.5% or -10.5%

        if (directNet > orderNet && bestDirect.price > 0) {
          craftBatch.updateItemConfig(batchItem.id, {
            sellCity: bestDirect.city,
            sellType: "direct",
            customSellPrice: bestDirect.price,
          });
        } else if (bestOrder.price > 0) {
          craftBatch.updateItemConfig(batchItem.id, {
            sellCity: bestOrder.city,
            sellType: "order",
            customSellPrice: bestOrder.price,
          });
        }
      }
    } catch (error) {
      console.error("Error loading best prices:", error);
    } finally {
      setLoadingPrices(false);
    }
  };

  // Update price when city or type changes
  const handleCityChange = async (batchItemId: string, itemId: string, newCity: City) => {
    craftBatch.updateItemConfig(batchItemId, { sellCity: newCity });

    // Fetch prices and update based on current sell type
    try {
      const params = new URLSearchParams({
        items: itemId,
        locations: CITIES.join(","),
        qualities: "1",
      });
      const res = await fetch(`/api/prices?${params}`);
      if (!res.ok) return;

      const prices = await res.json();
      const cityPrice = prices.find((p: any) => p.city === newCity);
      if (!cityPrice) return;

      const batchItem = craftBatch.batchState.items.find(i => i.id === batchItemId);
      if (!batchItem) return;

      let newPrice = 0;
      if (batchItem.sellType === 'direct' && cityPrice.sell_price_min > 0) {
        newPrice = cityPrice.sell_price_min;
      } else if (batchItem.sellType === 'order' && cityPrice.sell_price_max > 0) {
        newPrice = cityPrice.sell_price_max;
      } else if (batchItem.sellType === 'blackmarket' && cityPrice.buy_price_max > 0) {
        newPrice = cityPrice.buy_price_max;
      }

      if (newPrice > 0) {
        craftBatch.updateItemConfig(batchItemId, { customSellPrice: newPrice });
      }
    } catch (error) {
      console.error("Error updating price:", error);
    }
  };

  const handleTypeChange = async (batchItemId: string, itemId: string, newType: 'direct' | 'order' | 'blackmarket') => {
    craftBatch.updateItemConfig(batchItemId, { sellType: newType });

    // Fetch prices and update based on new type
    try {
      const params = new URLSearchParams({
        items: itemId,
        locations: CITIES.join(","),
        qualities: "1",
      });
      const res = await fetch(`/api/prices?${params}`);
      if (!res.ok) return;

      const prices = await res.json();
      const batchItem = craftBatch.batchState.items.find(i => i.id === batchItemId);
      if (!batchItem) return;

      const cityPrice = prices.find((p: any) => p.city === batchItem.sellCity);
      if (!cityPrice) return;

      let newPrice = 0;
      if (newType === 'direct' && cityPrice.sell_price_min > 0) {
        newPrice = cityPrice.sell_price_min;
      } else if (newType === 'order' && cityPrice.sell_price_max > 0) {
        newPrice = cityPrice.sell_price_max;
      } else if (newType === 'blackmarket' && cityPrice.buy_price_max > 0) {
        newPrice = cityPrice.buy_price_max;
      }

      if (newPrice > 0) {
        craftBatch.updateItemConfig(batchItemId, { customSellPrice: newPrice });
      }
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

          {/* Use Focus */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useFocus"
              checked={craftBatch.batchState.globalSettings.useFocus}
              onCheckedChange={(checked) =>
                craftBatch.updateGlobalSettings({ useFocus: checked as boolean })
              }
            />
            <Label
              htmlFor="useFocus"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Utiliser le focus pour améliorer le RRR (Resource Return Rate)
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
                disabled={loadingPrices}
                className="bg-albion-gold text-albion-dark hover:bg-albion-gold/90"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingPrices ? 'animate-spin' : ''}`} />
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
                        onValueChange={(city) => handleCityChange(item.id, item.itemId, city as City)}
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
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.sellType}
                        onValueChange={(type) => handleTypeChange(item.id, item.itemId, type as 'direct' | 'order' | 'blackmarket')}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="direct">Vente directe</SelectItem>
                          <SelectItem value="order">Ordre de vente</SelectItem>
                          <SelectItem value="blackmarket">Black Market</SelectItem>
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
