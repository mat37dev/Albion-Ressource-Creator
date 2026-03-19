"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { useAlbionItems } from "@/lib/hooks/useAlbionItems";
import type { AlbionItem } from "@/lib/db/schema";
import { ItemFilters, type ItemFiltersState } from "./ItemFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, CheckCircle2 } from "lucide-react";
import { ItemIcon } from "@/components/ui/item-icon";
import { cn } from "@/lib/utils";

interface ItemSelectorProps {
  onItemSelect?: (item: AlbionItem) => void;
  selectedItems?: Set<string>;
  multiSelect?: boolean;
  showAddButton?: boolean;
  translationKey?: string;
  limit?: number;
  className?: string;
  craftable?: boolean;
  showCraftableFilter?: boolean;
}

export function ItemSelector({
  onItemSelect,
  selectedItems = new Set(),
  showAddButton = true,
  translationKey = "admin.items",
  limit = 1000,
  className,
  craftable = false,
  showCraftableFilter = false
}: ItemSelectorProps) {
  const locale = useLocale();
  const localeCode = locale === "fr" ? "fr" : "en";

  const [filters, setFilters] = useState<ItemFiltersState>({
    category: undefined,
    subcategory: undefined,
    tier: undefined,
    enchant: undefined,
    search: "",
    craftable: craftable
  });

  // Load items from DB
  const { items, isLoading, error } = useAlbionItems({
    category: filters.category,
    subcategory: filters.subcategory,
    tier: filters.tier,
    enchant: filters.enchant,
    search: filters.search.length > 0 ? filters.search : undefined,
    locale: localeCode,
    limit,
    craftable: filters.craftable,
  });

  // Group items by tier
  const itemsByTier = useMemo(() => {
    const grouped: Record<number, AlbionItem[]> = {};
    items.forEach((item) => {
      if (!grouped[item.tier]) grouped[item.tier] = [];
      grouped[item.tier].push(item);
    });
    return grouped;
  }, [items]);

  const sortedTiers = Object.keys(itemsByTier)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6", className)}>
      {/* Filters Panel */}
      <div className="lg:col-span-1">
        <ItemFilters
          filters={filters}
          onFiltersChange={setFilters}
          translationKey={translationKey + ".filters"}
          showCraftable={showCraftableFilter}
        />
      </div>

      {/* Results Panel */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Résultats
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement...
                  </div>
                ) : (
                  <span>{items.length} item(s) trouvé(s)</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-sm text-destructive py-4">
                Erreur lors du chargement
              </div>
            )}

            {!isLoading && items.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Aucun item trouvé avec ces filtres
              </div>
            )}

            {/* Items grouped by tier */}
            <div className="space-y-6">
              {sortedTiers.map((tier) => (
                <div key={tier}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      Tier {tier}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ({itemsByTier[tier].length} items)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {itemsByTier[tier].map((item) => {
                      const isSelected = selectedItems.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:border-albion-gold/50",
                            isSelected
                              ? "border-albion-gold bg-albion-gold/10"
                              : "border-border bg-secondary/30"
                          )}
                          onClick={() => onItemSelect?.(item)}
                        >
                          <ItemIcon item={item.id} size={32} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {localeCode === "fr" ? item.nameFR : item.nameEN}
                            </div>
                          </div>
                          {showAddButton && (
                            <div className="shrink-0">
                              {isSelected ? (
                                <CheckCircle2 className="h-5 w-5 text-albion-gold" />
                              ) : (
                                <Plus className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
