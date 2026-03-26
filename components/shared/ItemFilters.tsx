"use client";

import { useTranslations } from "next-intl";
import { getCategoriesMetadata } from "@/lib/albion/items";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, X, Filter } from "lucide-react";

export interface ItemFiltersState {
  category?: string;
  subcategory?: string;
  tier?: number;
  enchant?: number;
  search: string;
  craftable?: boolean;
}

interface ItemFiltersProps {
  filters: ItemFiltersState;
  onFiltersChange: (filters: ItemFiltersState) => void;
  showSearch?: boolean;
  showTier?: boolean;
  showEnchant?: boolean;
  showCraftable?: boolean;
  translationKey?: string;
}

export function ItemFilters({
  filters,
  onFiltersChange,
  showSearch = true,
  showTier = true,
  showEnchant = true,
  showCraftable = false,
  translationKey = "admin.items.filters"
}: ItemFiltersProps) {
  const t = useTranslations(translationKey);
  const tItems = useTranslations("items");

  const categories = getCategoriesMetadata();
  const selectedCategory = categories.find((c) => c.id === filters.category);

  const updateFilter = (key: keyof ItemFiltersState, value: any) => {
    const newFilters = { ...filters, [key]: value };

    // Reset subcategory if category changes
    if (key === "category") {
      newFilters.subcategory = undefined;
    }

    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    onFiltersChange({
      category: undefined,
      subcategory: undefined,
      tier: undefined,
      enchant: undefined,
      search: "",
      craftable: undefined
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-albion-gold" />
            <CardTitle className="text-lg">{t("title")}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            {t("reset")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        {showSearch && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {t("search")}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Category */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {t("category")}
          </label>
          <Select
            value={filters.category || "all"}
            onValueChange={(value) => updateFilter("category", value === "all" ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("allCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCategories")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {tItems(`categories.${cat.id}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subcategory */}
        {selectedCategory && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {t("subcategory")}
            </label>
            <Select
              value={filters.subcategory || "all"}
              onValueChange={(value) => updateFilter("subcategory", value === "all" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("allSubcategories")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allSubcategories")}</SelectItem>
                {selectedCategory.subcategories.map((subId) => (
                  <SelectItem key={subId} value={subId}>
                    {tItems(`subcategories.${subId}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tier */}
        {showTier && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {t("tier")}
            </label>
            <Select
              value={filters.tier?.toString() || "all"}
              onValueChange={(value) => updateFilter("tier", value === "all" ? undefined : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("allTiers")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allTiers")}</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((t) => (
                  <SelectItem key={t} value={t.toString()}>
                    Tier {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Enchant */}
        {showEnchant && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {t("enchant")}
            </label>
            <Select
              value={filters.enchant?.toString() || "all"}
              onValueChange={(value) => updateFilter("enchant", value === "all" ? undefined : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("allEnchants")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allEnchants")}</SelectItem>
                <SelectItem value="0">{t("base")}</SelectItem>
                {[1, 2, 3, 4].map((e) => (
                  <SelectItem key={e} value={e.toString()}>
                    @{e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Craftable Only */}
        {showCraftable && (
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="craftable"
              checked={filters.craftable || false}
              onCheckedChange={(checked) => updateFilter("craftable", checked)}
            />
            <Label
              htmlFor="craftable"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Items craftables uniquement
            </Label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
