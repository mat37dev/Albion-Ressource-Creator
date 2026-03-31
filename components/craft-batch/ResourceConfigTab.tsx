"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ItemIcon } from "@/components/ui/item-icon";
import { RefreshCw } from "lucide-react";
import { CITIES, City } from "@/lib/constants/cities";
import { formatSilver } from "@/lib/utils";
import { getItemNames } from "@/lib/utils/item-names";
import { isRRRExempt } from "@/lib/albion/utils/rrr";

interface ResourceConfigTabProps {
  craftBatch: ReturnType<typeof import("@/lib/hooks/useCraftBatch").useCraftBatch>;
}

export function ResourceConfigTab({ craftBatch }: ResourceConfigTabProps) {
  const locale = useLocale();
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [materialNames, setMaterialNames] = useState<Record<string, string>>({});

  useEffect(() => {
    // Agréger les matériaux si certains items n'ont pas de recipeMaterials (cas fallback)
    const missingRecipes = craftBatch.batchState.items.some(i => !i.recipeMaterials);
    if (craftBatch.batchState.items.length > 0 && missingRecipes) {
      craftBatch.aggregateMaterials();
    }
  }, [craftBatch.batchState.items.length]);

  // Load material names
  useEffect(() => {
    const matIds = Object.keys(craftBatch.batchState.materials);
    if (matIds.length > 0) {
      getItemNames(matIds, locale as "en" | "fr").then(setMaterialNames);
    }
  }, [craftBatch.batchState.materials, locale]);

  const handleLoadBestPrices = async () => {
    setLoadingPrices(true);
    await craftBatch.fetchAllPrices();
    setLoadingPrices(false);
  };

  const materials = Object.values(craftBatch.batchState.materials);
  const totalMaterialCost = materials.reduce(
    (sum, mat) => sum + mat.totalQuantity * mat.pricePerUnit,
    0
  );

  // Calcule la quantité RRR pour un matériau donné à partir des items du batch
  const computeRRRQty = (materialId: string): number => {
    let total = 0;
    for (const item of craftBatch.batchState.items) {
      if (!item.recipeMaterials) continue;
      const mat = item.recipeMaterials.find(m => m.materialItemId === materialId);
      if (!mat) continue;
      const rrr = isRRRExempt(materialId) ? 0 : (item.rrr ?? 18) / 100;
      total += Math.ceil(mat.quantity * item.quantity * (1 - rrr));
    }
    return total;
  };

  // Handle city change with dynamic price update
  const handleCityChange = async (materialId: string, newCity: City) => {
    craftBatch.updateMaterialConfig(materialId, { buyCity: newCity });

    // Update price based on cached data
    const prices = craftBatch.batchState.priceCache.get(materialId) || [];
    const cityPrice = prices.find((p: any) => p.city === newCity);
    if (cityPrice) {
      const material = craftBatch.batchState.materials[materialId];
      const newPrice = material.buyType === 'buy' ? cityPrice.sell_price_min : cityPrice.buy_price_max;
      craftBatch.updateMaterialConfig(materialId, { pricePerUnit: newPrice });
    }
  };

  // Handle buy type change with dynamic price update
  const handleTypeChange = async (materialId: string, newType: 'buy' | 'order') => {
    craftBatch.updateMaterialConfig(materialId, { buyType: newType });

    // Update price based on cached data
    const prices = craftBatch.batchState.priceCache.get(materialId) || [];
    const material = craftBatch.batchState.materials[materialId];
    const cityPrice = prices.find((p: any) => p.city === material.buyCity);
    if (cityPrice) {
      const newPrice = newType === 'buy' ? cityPrice.sell_price_min : cityPrice.buy_price_max;
      craftBatch.updateMaterialConfig(materialId, { pricePerUnit: newPrice });
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="border-albion-blue/30">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Le RRR (Resource Return Rate) sera appliqué individuellement par item dans l&apos;onglet Paramétrage.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Les coûts affichés ici sont <span className="font-semibold">bruts (sans RRR)</span>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Ressources nécessaires</CardTitle>
            <Button
              onClick={handleLoadBestPrices}
              disabled={loadingPrices || materials.length === 0}
              className="bg-albion-gold text-albion-dark hover:bg-albion-gold/90"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingPrices ? 'animate-spin' : ''}`} />
              Charger meilleurs prix
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Aucune ressource à afficher</p>
              <p className="text-sm mt-1">Ajoutez des items d&apos;abord</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matériau</TableHead>
                    <TableHead className="text-right">Qté nécessaire</TableHead>
                    <TableHead className="text-right">Qté avec RRR</TableHead>
                    <TableHead>Ville d&apos;achat</TableHead>
                    <TableHead>Type d&apos;achat</TableHead>
                    <TableHead className="text-right">Prix unitaire</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => {
                    const rrrQty = computeRRRQty(material.materialId);
                    return (
                    <TableRow key={material.materialId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ItemIcon item={material.materialId} size={32} />
                          <span className="font-medium">
                            {materialNames[material.materialId] || material.materialId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{material.totalQuantity}</TableCell>
                      <TableCell className="text-right font-semibold text-albion-gold">
                        {rrrQty > 0 ? rrrQty : material.totalQuantity}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={material.buyCity}
                          onValueChange={(city) => handleCityChange(material.materialId, city as City)}
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
                          value={material.buyType}
                          onValueChange={(type) => handleTypeChange(material.materialId, type as "buy" | "order")}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buy">Achat direct</SelectItem>
                            <SelectItem value="order">Ordre d&apos;achat</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={material.pricePerUnit}
                          onChange={(e) =>
                            craftBatch.updateMaterialConfig(material.materialId, {
                              pricePerUnit: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-28 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatSilver(material.totalQuantity * material.pricePerUnit)}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="mt-6 flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Coût total matériaux</p>
                  <p className="text-2xl font-bold text-albion-gold">
                    {formatSilver(totalMaterialCost)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (Le RRR sera appliqué dans les résultats finaux)
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
