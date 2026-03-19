"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    craftBatch.batchState.items.forEach(item => {
      newItemRRR[item.id] = item.rrr !== undefined ? item.rrr : 18;
    });
    setItemRRR(newItemRRR);
  }, [craftBatch.batchState.items]);

  // Apply global RRR to all items
  const applyGlobalRRR = () => {
    const newItemRRR: Record<string, number> = {};
    craftBatch.batchState.items.forEach(item => {
      craftBatch.updateItemConfig(item.id, { rrr: globalRRR });
      newItemRRR[item.id] = globalRRR;
    });
    setItemRRR(newItemRRR);
  };

  // Update individual item RRR
  const updateItemRRR = (itemId: string, rrr: number) => {
    setItemRRR(prev => ({ ...prev, [itemId]: rrr }));
    craftBatch.updateItemConfig(itemId, { rrr });
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
              RRR pour tous les items: {globalRRR}%
            </Label>
            <p className="text-xs text-muted-foreground mb-3">
              Le taux de retour de ressources (RRR) réduit la quantité de matériaux consommés lors du craft.
              RRR par défaut: 18% (sans focus)
            </p>
            <div className="flex gap-3 items-center">
              <Slider
                value={[globalRRR]}
                onValueChange={([value]) => setGlobalRRR(value)}
                min={0}
                max={95}
                step={1}
                className="flex-1"
              />
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
                    <div className="flex items-center gap-2 min-w-[200px]">
                      <Label className="text-sm font-mono w-12 text-right">
                        {itemRRR[item.id] || 18}%
                      </Label>
                      <Slider
                        value={[itemRRR[item.id] || 18]}
                        onValueChange={([value]) => updateItemRRR(item.id, value)}
                        min={0}
                        max={95}
                        step={1}
                        className="flex-1"
                      />
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

      {/* Section 2: Registres (Journals) - Feature preview */}
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
