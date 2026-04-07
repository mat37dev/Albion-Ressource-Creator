"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ItemIcon } from "@/components/ui/item-icon";
import { Settings2, BookOpen } from "lucide-react";
import { getItemNames } from "@/lib/utils/item-names";

interface SettingsTabProps {
  craftBatch: ReturnType<typeof import("@/lib/hooks/useCraftBatch").useCraftBatch>;
}

export function SettingsTab({ craftBatch }: SettingsTabProps) {
  const locale = useLocale();
  const [itemRRR, setItemRRR] = useState<Record<string, number>>({});
  const [globalRRR, setGlobalRRR] = useState(18);
  const [globalRRRInput, setGlobalRRRInput] = useState("18");
  const [itemRRRInputs, setItemRRRInputs] = useState<Record<string, string>>({});
  const [itemNames, setItemNames] = useState<Record<string, string>>({});

  // Load item names
  useEffect(() => {
    const itemIds = craftBatch.batchState.items.map(i => i.itemId);
    if (itemIds.length > 0) {
      getItemNames(itemIds, locale as "en" | "fr").then(setItemNames);
    }
  }, [craftBatch.batchState.items, locale]);

  // Initialize item RRR from batch state
  useEffect(() => {
    const newItemRRR: Record<string, number> = {};
    const newItemRRRInputs: Record<string, string> = {};
    craftBatch.batchState.items.forEach(item => {
      const val = item.rrr !== undefined ? item.rrr : 18;
      newItemRRR[item.id] = val;
      newItemRRRInputs[item.id] = String(val);
    });
    setItemRRR(newItemRRR);
    setItemRRRInputs(newItemRRRInputs);
  }, [craftBatch.batchState.items]);

  // Apply global RRR to all items
  const applyGlobalRRR = () => {
    const newItemRRR: Record<string, number> = {};
    const newItemRRRInputs: Record<string, string> = {};
    craftBatch.batchState.items.forEach(item => {
      craftBatch.updateItemConfig(item.id, { rrr: globalRRR });
      newItemRRR[item.id] = globalRRR;
      newItemRRRInputs[item.id] = String(globalRRR);
    });
    setItemRRR(newItemRRR);
    setItemRRRInputs(newItemRRRInputs);
  };

  // Update individual item RRR
  const updateItemRRR = (itemId: string, rrr: number) => {
    const clamped = Math.min(95, Math.max(0, rrr));
    setItemRRR(prev => ({ ...prev, [itemId]: clamped }));
    setItemRRRInputs(prev => ({ ...prev, [itemId]: String(clamped) }));
    craftBatch.updateItemConfig(itemId, { rrr: clamped });
  };

  const handleGlobalRRRInput = (raw: string) => {
    setGlobalRRRInput(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      const clamped = Math.min(95, Math.max(0, parsed));
      setGlobalRRR(clamped);
    }
  };

  const handleGlobalRRRSlider = (value: number) => {
    setGlobalRRR(value);
    setGlobalRRRInput(String(value));
  };

  const handleItemRRRInput = (itemId: string, raw: string) => {
    setItemRRRInputs(prev => ({ ...prev, [itemId]: raw }));
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      const clamped = Math.min(95, Math.max(0, parsed));
      setItemRRR(prev => ({ ...prev, [itemId]: clamped }));
      craftBatch.updateItemConfig(itemId, { rrr: clamped });
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: RRR par item */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-albion-gold" />
            <CardTitle>Configuration RRR (Resource Return Rate)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* RRR Global */}
          <div className="p-4 border rounded-lg bg-albion-blue/5">
            <Label className="text-base font-semibold mb-2 block">
              RRR pour tous les items
            </Label>
            <p className="text-xs text-muted-foreground mb-3">
              Le taux de retour de ressources (RRR) réduit la quantité de matériaux consommés lors du craft.
              RRR par défaut: 18% (sans focus)
            </p>
            <div className="flex gap-3 items-center">
              <Slider
                value={[globalRRR]}
                onValueChange={([value]) => handleGlobalRRRSlider(value)}
                min={0}
                max={95}
                step={0.1}
                className="flex-1"
              />
              <Input
                type="number"
                min={0}
                max={95}
                step={0.1}
                value={globalRRRInput}
                onChange={(e) => handleGlobalRRRInput(e.target.value)}
                className="w-20 text-right"
              />
              <span className="text-sm text-muted-foreground">%</span>
              <Button onClick={applyGlobalRRR} size="sm" className="bg-albion-gold text-albion-dark hover:bg-albion-gold/90">
                Appliquer à tous
              </Button>
            </div>
          </div>

          {/* RRR par item */}
          {craftBatch.batchState.items.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">
                RRR individuel par item
              </h3>
              <div className="space-y-2">
                {craftBatch.batchState.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg bg-secondary/20">
                    <ItemIcon item={item.itemId} size={32} />
                    <span className="flex-1 font-medium">
                      {itemNames[item.itemId] || item.itemId}
                    </span>
                    <div className="flex items-center gap-2 min-w-[260px]">
                      <Slider
                        value={[itemRRR[item.id] ?? 18]}
                        onValueChange={([value]) => {
                          setItemRRR(prev => ({ ...prev, [item.id]: value }));
                          setItemRRRInputs(prev => ({ ...prev, [item.id]: String(value) }));
                          craftBatch.updateItemConfig(item.id, { rrr: value });
                        }}
                        min={0}
                        max={95}
                        step={0.1}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min={0}
                        max={95}
                        step={0.1}
                        value={itemRRRInputs[item.id] ?? "18"}
                        onChange={(e) => handleItemRRRInput(item.id, e.target.value)}
                        className="w-16 text-right px-2"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Settings2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Aucun item sélectionné</p>
              <p className="text-sm mt-1">Ajoutez des items dans l&apos;onglet 1 pour configurer leur RRR</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Frais de station */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-albion-gold" />
            <CardTitle>Frais de station de craft</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-albion-blue/5">
            <Label htmlFor="craftingFeePerNutrition" className="text-base font-semibold mb-2 block">
              Prix pour 100 nutritions (silver)
            </Label>
            <p className="text-xs text-muted-foreground mb-3">
              Entrez le coût en silver pour 100 points de nutrition de la station.
              Laissez à 0 si vous utilisez votre propre station (gratuit).
              Le coût total = (nutrition de la recette / 100) × prix pour 100 nutritions × quantité craftée.
            </p>
            <Input
              id="craftingFeePerNutrition"
              type="number"
              min={0}
              step={0.001}
              value={craftBatch.batchState.globalSettings.craftingFeePerNutrition ?? 0}
              onChange={(e) =>
                craftBatch.updateGlobalSettings({
                  craftingFeePerNutrition: parseFloat(e.target.value) || 0,
                })
              }
              className="w-48"
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Exemple : 3 silver/100 nutrition × 300 nutrition = 9 silver de frais par craft
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Registres (Journals) - Feature preview */}
      <Card className="border-dashed opacity-60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-albion-gold" />
            <CardTitle>Registres de craft (Journals)</CardTitle>
            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">Bientôt disponible</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les registres permettent de gagner de la renommée et peuvent être revendus remplis pour un profit supplémentaire.
            Cette fonctionnalité sera disponible dans une future mise à jour.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
