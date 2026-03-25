"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCraftBatch } from "@/lib/hooks/useCraftBatch";
import { ItemSelectionTab } from "./ItemSelectionTab";
import { ResourceConfigTab } from "./ResourceConfigTab";
import { SettingsTab } from "./SettingsTab";
import { ResultsTab } from "./ResultsTab";

export function CraftBatchClient() {
  const craftBatch = useCraftBatch();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-albion-gold mb-2">Calculateur Craft Batch</h1>
        <p className="text-muted-foreground">
          Calculez les profits pour plusieurs items en masse avec gestion automatique des ressources
        </p>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="items">
            <span className="flex items-center gap-2">
              1. Items
              {craftBatch.batchState.items.length > 0 && (
                <span className="text-xs bg-albion-gold text-albion-dark px-2 py-0.5 rounded-full font-bold">
                  {craftBatch.batchState.items.length}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="settings" disabled={craftBatch.batchState.items.length === 0}>
            2. Paramétrage
          </TabsTrigger>
          <TabsTrigger value="resources" disabled={craftBatch.batchState.items.length === 0}>
            3. Ressources
          </TabsTrigger>
          <TabsTrigger value="results" disabled={craftBatch.batchState.items.length === 0}>
            4. Résultats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <ItemSelectionTab craftBatch={craftBatch} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab craftBatch={craftBatch} />
        </TabsContent>

        <TabsContent value="resources">
          <ResourceConfigTab craftBatch={craftBatch} />
        </TabsContent>

        <TabsContent value="results">
          <ResultsTab craftBatch={craftBatch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
