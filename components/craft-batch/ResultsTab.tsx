"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ItemIcon } from "@/components/ui/item-icon";
import { Calculator, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { formatSilver } from "@/lib/utils";
import { calculateBatchProfit } from "@/lib/albion/calculations/craft-batch";
import { CraftBatchResult } from "@/lib/albion/types/craft-batch";

interface ResultsTabProps {
  craftBatch: ReturnType<typeof import("@/lib/hooks/useCraftBatch").useCraftBatch>;
}

export function ResultsTab({ craftBatch }: ResultsTabProps) {
  const locale = useLocale();
  const [result, setResult] = useState<CraftBatchResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = useCallback(async () => {
    setCalculating(true);
    setError(null);
    try {
      const batchResult = await calculateBatchProfit(craftBatch.batchState, locale as "en" | "fr");
      setResult(batchResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du calcul");
    } finally {
      setCalculating(false);
    }
  }, [craftBatch.batchState, locale]);

  // Auto-calcul à l'ouverture de l'onglet
  useEffect(() => {
    handleCalculate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  const getProfitColor = (profit: number) => {
    if (profit > 0) return "text-green-500";
    if (profit < 0) return "text-red-500";
    return "text-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Résultats du batch</CardTitle>
          <Button
            onClick={handleCalculate}
            disabled={calculating}
            className="bg-albion-gold text-albion-dark hover:bg-albion-gold/90"
          >
            <Calculator className={`w-4 h-4 mr-2 ${calculating ? 'animate-pulse' : ''}`} />
            Recalculer
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-500">Erreur de calcul</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        )}

        {!result ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calculator className={`w-12 h-12 mx-auto mb-3 opacity-20 ${calculating ? 'animate-pulse' : ''}`} />
            <p className="font-medium">{calculating ? "Calcul en cours…" : "En attente des données"}</p>
          </div>
        ) : (
          <>
            {/* Résumé global */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Coût total</p>
                  <p className="text-2xl font-bold text-red-500">{formatSilver(result.totalCost)}</p>
                </CardContent>
              </Card>

              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Revenu total</p>
                  <p className="text-2xl font-bold text-blue-500">{formatSilver(result.totalRevenue)}</p>
                </CardContent>
              </Card>

              <Card className={`${result.totalProfit >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Profit net</p>
                  <p className={`text-2xl font-bold flex items-center gap-2 ${result.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {result.totalProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    {formatSilver(result.totalProfit)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-albion-blue/10 border-albion-blue/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <p className="text-xl font-bold text-albion-gold">
                    {craftBatch.batchState.globalSettings.isPremium ? "Premium ✓" : "Standard"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {craftBatch.batchState.globalSettings.isPremium
                      ? "Taxes réduites appliquées"
                      : "Taxes standards appliquées"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Profit des registres */}
            {result.journalProfit && result.journalProfit > 0 && (
              <Card className="mb-6 border-purple-500/30 bg-purple-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Profit des registres (journals)</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Profit net de l&apos;achat et revente des registres
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-green-500">
                      +{formatSilver(result.journalProfit)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Détail par item */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Détail par item</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qté</TableHead>
                    <TableHead className="text-right">Coût mat.</TableHead>
                    <TableHead className="text-right">Prix net/unité</TableHead>
                    <TableHead>Ville vente</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Profit/unité</TableHead>
                    <TableHead className="text-right">Profit total</TableHead>
                    <TableHead className="text-right">Marge %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.itemResults.map((item) => (
                    <TableRow key={item.batchItemId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ItemIcon item={item.itemId} size={32} />
                          <span className="font-medium">{item.itemName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatSilver(item.materialCost)}</TableCell>
                      <TableCell className="text-right">{formatSilver(item.netSellPrice / item.quantity)}</TableCell>
                      <TableCell>{item.sellCity}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          item.sellType === 'direct' ? 'bg-blue-500/20 text-blue-400' :
                          item.sellType === 'blackmarket' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {item.sellType === 'direct' ? 'Direct' :
                           item.sellType === 'blackmarket' ? 'BM' : 'Ordre'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{formatSilver(item.unitProfit)}</TableCell>
                      <TableCell className={`text-right font-bold ${getProfitColor(item.totalProfit)}`}>
                        {formatSilver(item.totalProfit)}
                      </TableCell>
                      <TableCell className="text-right">{formatPercent(item.profitPercent)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Résumé des matériaux */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Résumé des matériaux</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matériau</TableHead>
                    <TableHead className="text-right">Qté totale</TableHead>
                    <TableHead className="text-right">Qté total RRR</TableHead>
                    <TableHead className="text-right">Prix unitaire</TableHead>
                    <TableHead className="text-right">Coût Total RRR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.aggregatedMaterials.map((mat) => (
                    <TableRow key={mat.materialId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ItemIcon item={mat.materialId} size={32} />
                          <span className="font-medium">{mat.materialName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{mat.totalQuantity}</TableCell>
                      <TableCell className="text-right font-semibold text-albion-gold">
                        {mat.rrrQuantity}
                      </TableCell>
                      <TableCell className="text-right">{formatSilver(mat.pricePerUnit)}</TableCell>
                      <TableCell className="text-right font-bold">{formatSilver(mat.totalCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
