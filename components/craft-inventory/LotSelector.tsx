"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { InventoryItem } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw, Settings2 } from "lucide-react";
import { formatSilver } from "@/lib/utils";

interface ConsumedLot {
  lotId: string;
  quantityUsed: number;
  pricePerUnit: number;
}

interface LotSelectorProps {
  materialId: string;
  availableLots: InventoryItem[];
  selectedLots: ConsumedLot[];
  manualSelection?: string[];
  onSelectionChange: (lotIds: string[]) => void;
}

export function LotSelector({
  materialId,
  availableLots,
  selectedLots,
  manualSelection,
  onSelectionChange,
}: LotSelectorProps) {
  const t = useTranslations("craftInventory");
  const [open, setOpen] = useState(false);

  const isManual = manualSelection && manualSelection.length > 0;
  const selectedLotIds = selectedLots.map(l => l.lotId);

  const handleToggleLot = (lotId: string) => {
    if (!manualSelection) {
      // First time: initialize with current FIFO selection
      const newSelection = selectedLotIds.includes(lotId)
        ? selectedLotIds.filter(id => id !== lotId)
        : [...selectedLotIds, lotId];
      onSelectionChange(newSelection);
    } else {
      // Toggle lot in manual selection
      const newSelection = manualSelection.includes(lotId)
        ? manualSelection.filter(id => id !== lotId)
        : [...manualSelection, lotId];
      onSelectionChange(newSelection);
    }
  };

  const handleReset = () => {
    onSelectionChange([]);
    setOpen(false);
  };

  // Sort lots by date (FIFO order)
  const sortedLots = [...availableLots].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-2"
        onClick={() => setOpen(true)}
      >
        <Settings2 className="h-3 w-3" />
        <Badge variant={isManual ? "default" : "secondary"} className="text-xs px-1.5 py-0">
          {isManual ? "Manuel" : "FIFO"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {selectedLots.length} lot{selectedLots.length > 1 ? "s" : ""}
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sélection des lots</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {sortedLots.map((lot, index) => {
                const isSelected = manualSelection
                  ? manualSelection.includes(lot.id)
                  : selectedLotIds.includes(lot.id);
                const isUsedInFIFO = selectedLotIds.includes(lot.id);

                return (
                  <div
                    key={lot.id}
                    className={`flex items-start gap-2 p-2 rounded-md border ${
                      isSelected
                        ? "border-albion-gold bg-albion-gold/5"
                        : "border-border bg-background"
                    }`}
                  >
                    <Checkbox
                      id={`lot-${lot.id}`}
                      checked={isSelected}
                      onCheckedChange={() => handleToggleLot(lot.id)}
                      className="mt-1"
                    />
                    <label
                      htmlFor={`lot-${lot.id}`}
                      className="flex-1 cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {formatSilver(lot.pricePerUnit)}/u
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {lot.source}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Qté: {lot.quantity}</span>
                        <span>{new Date(lot.createdAt).toLocaleDateString()}</span>
                      </div>
                      {!isManual && isUsedInFIFO && (
                        <Badge variant="secondary" className="text-xs">
                          FIFO #{index + 1}
                        </Badge>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>

            {!isManual && (
              <p className="text-xs text-muted-foreground">
                Mode FIFO actif : les lots sont consommés du plus ancien au plus récent
              </p>
            )}
          </div>

          <DialogFooter>
            {isManual && (
              <Button
                variant="outline"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser FIFO
              </Button>
            )}
            <Button onClick={() => setOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
