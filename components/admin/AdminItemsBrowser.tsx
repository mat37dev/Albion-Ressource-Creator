"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getCategoriesMetadata } from "@/lib/albion/items";
import { useAlbionItems } from "@/lib/hooks/useAlbionItems";
import type { AlbionItem } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, Filter, Loader2 } from "lucide-react";
import { ItemIcon } from "@/components/ui/item-icon";

export function AdminItemsBrowser() {
  const t = useTranslations("admin.items");
  const tItems = useTranslations("items");
  const locale = useLocale();
  const localeCode = locale === "fr" ? "fr" : "en";
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [subcategory, setSubcategory] = useState<string | undefined>(undefined);
  const [tier, setTier] = useState<number | undefined>(undefined);
  const [enchant, setEnchant] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<AlbionItem | null>(null);

  const categories = getCategoriesMetadata();
  const selectedCategory = categories.find((c) => c.id === category);

  // Charger les items depuis la DB via l'API
  const { items, total, isLoading, error } = useAlbionItems({
    category,
    subcategory,
    tier,
    enchant,
    search: search.length > 0 ? search : undefined,
    locale: localeCode,
    limit: 1000,
  });

  const itemsByTier = useMemo(() => {
    const grouped: Record<string, AlbionItem[]> = {};
    items.forEach((item) => {
      const key = `${item.tier}-${item.enchant}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  }, [items]);

  const resetFilters = () => {
    setCategory(undefined);
    setSubcategory(undefined);
    setTier(undefined);
    setEnchant(undefined);
    setSearch("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Filters Panel */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-albion-gold" />
                <CardTitle className="text-lg">{t("filters.title")}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                {t("filters.reset")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {t("filters.search")}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("filters.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {t("filters.category")}
              </label>
              <Select
                value={category || "all"}
                onValueChange={(value) => {
                  setCategory(value === "all" ? undefined : value);
                  setSubcategory(undefined);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.allCategories")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allCategories")}</SelectItem>
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
                  {t("filters.subcategory")}
                </label>
                <Select
                  value={subcategory || "all"}
                  onValueChange={(value) =>
                    setSubcategory(value === "all" ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("filters.allSubcategories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allSubcategories")}</SelectItem>
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
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {t("filters.tier")}
              </label>
              <Select
                value={tier?.toString() || "all"}
                onValueChange={(value) =>
                  setTier(value === "all" ? undefined : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.allTiers")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allTiers")}</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((tier) => (
                    <SelectItem key={tier} value={tier.toString()}>
                      Tier {tier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Enchant */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {t("filters.enchant")}
              </label>
              <Select
                value={enchant?.toString() || "all"}
                onValueChange={(value) =>
                  setEnchant(value === "all" ? undefined : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.allEnchants")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allEnchants")}</SelectItem>
                  <SelectItem value="0">{t("filters.base")} (T4)</SelectItem>
                  <SelectItem value="1">.1 (T4.1)</SelectItem>
                  <SelectItem value="2">.2 (T4.2)</SelectItem>
                  <SelectItem value="3">.3 (T4.3)</SelectItem>
                  <SelectItem value="4">.4 (T4.4)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stats */}
            <div className="pt-4 border-t border-border">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("filters.totalItems")}</span>
                  <span className="font-semibold text-albion-gold">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("filters.displayed")}</span>
                  <span className="font-semibold">{items.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {items.length} {t("results.found")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-albion-gold" />
                <span className="ml-2 text-muted-foreground">Chargement...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <p>❌ Erreur lors du chargement des items</p>
                <p className="text-sm mt-2">{error.message}</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>{t("results.noResults")}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(itemsByTier)
                  .sort(([a], [b]) => {
                    const [at, ae] = a.split("-").map(Number);
                    const [bt, be] = b.split("-").map(Number);
                    if (at !== bt) return at - bt;
                    return ae - be;
                  })
                  .map(([key, tierItems]) => {
                    const [tier, enchant] = key.split("-").map(Number);
                    return (
                    <div key={key}>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                        Tier {tier}{enchant > 0 ? ` .${enchant}` : ""} ({tierItems.length} items)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tierItems.slice(0, 100).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`text-left p-3 rounded-lg border transition-all hover:border-albion-gold/50 hover:bg-secondary/50 ${
                              selectedItem?.id === item.id
                                ? "border-albion-gold bg-secondary"
                                : "border-border"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Item Icon */}
                              <ItemIcon
                                item={item.id}
                                size={48}
                                locale={localeCode}
                                showTooltip={false}
                                className="shrink-0"
                              />

                              <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">
                                    {localeCode === "fr" ? item.nameFR : item.nameEN}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-mono truncate mt-1">
                                    {item.id}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1 shrink-0">
                                  {item.enchant > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      .{item.enchant}
                                    </Badge>
                                  )}
                                  {item.isArtifact && (
                                    <Badge variant="outline" className="text-xs text-purple-400 border-purple-400">
                                      {t("details.artifact")}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      {tierItems.length > 100 && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          ... et {tierItems.length - 100} autres items
                        </p>
                      )}
                    </div>
                  );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Item Details */}
        {selectedItem && (
          <Card className="border-albion-gold/30">
            <CardHeader>
              <div className="flex items-center gap-4">
                <ItemIcon
                  item={selectedItem.id}
                  size={80}
                  locale={localeCode}
                  showTooltip={false}
                  className="shrink-0"
                />
                <CardTitle className="text-albion-gold">{t("details.title")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">{t("details.nameFR")}</label>
                <p className="text-lg font-semibold text-white">{selectedItem.nameFR}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t("details.nameEN")}</label>
                <p className="text-lg font-semibold text-white">{selectedItem.nameEN}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t("details.id")}</label>
                <p className="font-mono text-sm bg-secondary p-2 rounded">
                  {selectedItem.id}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">{t("details.tier")}</label>
                  <p className="text-sm font-medium">T{selectedItem.tier}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t("details.enchant")}</label>
                  <p className="text-sm font-medium">
                    {selectedItem.enchant === 0 ? t("filters.base") : `.${selectedItem.enchant}`}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t("details.category")}</label>
                  <p className="text-sm font-medium">
                    {tItems(`categories.${selectedItem.category}`)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t("details.subcategory")}</label>
                  <p className="text-sm font-medium">
                    {tItems(`subcategories.${selectedItem.subcategory}`)}
                  </p>
                </div>
                {selectedItem.isArtifact && (
                  <div>
                    <label className="text-xs text-muted-foreground">Type</label>
                    <Badge variant="outline" className="text-purple-400 border-purple-400">
                      {t("details.artifact")}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
