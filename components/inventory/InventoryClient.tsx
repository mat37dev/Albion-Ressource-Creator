"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useInventory } from "@/lib/hooks/useInventory";
import { useAlbionItems } from "@/lib/hooks/useAlbionItems";
import { ItemIcon } from "@/components/ui/item-icon";
import { ItemSelector } from "@/components/shared/ItemSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Pencil, Check, X, Hammer } from "lucide-react";
import { formatSilver } from "@/lib/utils";
import type { AlbionItem } from "@/lib/db/schema";

interface Props {
  locale: string;
}

type SourceFilter = "all" | "bought" | "crafted";

export function InventoryClient({ locale }: Props) {
  const t = useTranslations("inventory");
  const localeCode = useLocale() as "fr" | "en";

  const { inventory, isLoading, error, mutate } = useInventory();

  // Item names lookup
  const itemIds = useMemo(() => [...new Set(inventory.map((i) => i.itemId))], [inventory]);
  const { items: dbItems } = useAlbionItems({ limit: 5000 });
  const itemNames = useMemo(
    () => Object.fromEntries(dbItems.map((item) => [item.id, localeCode === "fr" ? item.nameFR : item.nameEN])),
    [dbItems, localeCode]
  );

  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState<"select" | "details">("select");
  const [selectedItem, setSelectedItem] = useState<AlbionItem | null>(null);
  const [addQty, setAddQty] = useState("1");
  const [addPrice, setAddPrice] = useState("0");
  const [addSource, setAddSource] = useState<"bought" | "crafted" | "rrr_return">("bought");
  const [addNotes, setAddNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    if (sourceFilter === "all") return inventory;
    return inventory.filter((i) => i.source === sourceFilter);
  }, [inventory, sourceFilter]);

  const handleOpenAdd = () => {
    setSelectedItem(null);
    setAddStep("select");
    setAddQty("1");
    setAddPrice("0");
    setAddSource("bought");
    setAddNotes("");
    setAddError(null);
    setShowAddModal(true);
  };

  const handleItemSelect = (item: AlbionItem) => {
    setSelectedItem(item);
    setAddStep("details");
  };

  const handleAdd = async () => {
    if (!selectedItem) return;
    setIsAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedItem.id,
          quantity: Number(addQty),
          pricePerUnit: Number(addPrice),
          source: addSource,
          notes: addNotes || null,
        }),
      });
      if (!res.ok) throw new Error("add_failed");
      await mutate();
      setShowAddModal(false);
    } catch {
      setAddError(t("errors.addFailed"));
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/inventory/${deleteId}`, { method: "DELETE" });
      await mutate();
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const startEdit = (id: string, qty: number) => {
    setEditId(id);
    setEditQty(String(qty));
  };

  const handleSaveEdit = async (id: string) => {
    setIsSaving(true);
    try {
      await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: Number(editQty) }),
      });
      await mutate();
      setEditId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const sourceBadgeVariant = (source: string) => {
    if (source === "bought") return "default";
    if (source === "crafted") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-albion-gold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("description")}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/craft-inventory`}>
              <Hammer className="h-4 w-4 mr-2" />
              {t("craftFromInventory")}
            </Link>
          </Button>
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t("addItem")}
          </Button>
        </div>
      </div>

      {/* Source filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "bought", "crafted"] as SourceFilter[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={sourceFilter === s ? "default" : "outline"}
            onClick={() => setSourceFilter(s)}
          >
            {s === "all" ? t("filterAll") : s === "bought" ? t("filterBought") : t("filterCrafted")}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <CardContent className="py-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        ) : error ? (
          <CardContent className="py-8 text-center text-destructive text-sm">
            {t("errors.loadFailed")}
          </CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("noItems")}
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="albion-table">
              <thead>
                <tr>
                  <th>{t("columns.item")}</th>
                  <th>{t("columns.quantity")}</th>
                  <th>{t("columns.pricePerUnit")}</th>
                  <th>{t("columns.total")}</th>
                  <th>{t("columns.source")}</th>
                  <th>{t("columns.date")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <ItemIcon item={row.itemId} size={28} showTooltip={false} showLoading={false} />
                        <span className="text-white text-sm max-w-[180px] truncate">
                          {itemNames[row.itemId] ?? row.itemId}
                        </span>
                      </div>
                    </td>
                    <td>
                      {editId === row.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            className="w-20 h-7 text-xs"
                            min="0.01"
                            step="0.01"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={isSaving}
                            onClick={() => handleSaveEdit(row.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setEditId(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1 cursor-pointer group"
                          onClick={() => startEdit(row.id, row.quantity)}
                        >
                          <span>{row.quantity % 1 === 0 ? row.quantity : row.quantity.toFixed(2)}</span>
                          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        </div>
                      )}
                    </td>
                    <td className="text-gray-300">{formatSilver(row.pricePerUnit)}</td>
                    <td className="text-gray-300">{formatSilver(row.quantity * row.pricePerUnit)}</td>
                    <td>
                      <Badge variant={sourceBadgeVariant(row.source)} className="text-xs">
                        {t(`sources.${row.source}` as any)}
                      </Badge>
                    </td>
                    <td className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleDateString(localeCode === "fr" ? "fr-FR" : "en-US")}
                    </td>
                    <td>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive/70 hover:text-destructive"
                        onClick={() => setDeleteId(row.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className={addStep === "select" ? "max-w-4xl" : "max-w-md"}>
          <DialogHeader>
            <DialogTitle>{t("addModal.title")}</DialogTitle>
          </DialogHeader>

          {addStep === "select" ? (
            <ItemSelector
              onItemSelect={handleItemSelect}
              showAddButton={true}
              limit={2000}
            />
          ) : (
            <div className="space-y-4">
              {selectedItem && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                  <ItemIcon item={selectedItem.id} size={36} />
                  <div>
                    <div className="font-medium text-white">
                      {localeCode === "fr" ? selectedItem.nameFR : selectedItem.nameEN}
                    </div>
                    <div className="text-xs text-muted-foreground">{selectedItem.id}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-xs"
                    onClick={() => setAddStep("select")}
                  >
                    Changer
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="add-qty">{t("addModal.quantity")}</Label>
                  <Input
                    id="add-qty"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={addQty}
                    onChange={(e) => setAddQty(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="add-price">{t("addModal.pricePerUnit")}</Label>
                  <Input
                    id="add-price"
                    type="number"
                    min="0"
                    step="1"
                    value={addPrice}
                    onChange={(e) => setAddPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>{t("addModal.source")}</Label>
                <Select value={addSource} onValueChange={(v) => setAddSource(v as typeof addSource)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bought">{t("sources.bought")}</SelectItem>
                    <SelectItem value="crafted">{t("sources.crafted")}</SelectItem>
                    <SelectItem value="rrr_return">{t("sources.rrr_return")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="add-notes">{t("addModal.notes")}</Label>
                <Input
                  id="add-notes"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="..."
                />
              </div>

              {addError && (
                <p className="text-destructive text-sm">{addError}</p>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  {t("addModal.cancel")}
                </Button>
                <Button onClick={handleAdd} disabled={isAdding || !selectedItem}>
                  {isAdding ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("addModal.adding")}</>
                  ) : (
                    t("addModal.confirm")
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("deleteConfirm")}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {t("deleteCancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("deleting")}</>
              ) : (
                t("deleteConfirmBtn")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
