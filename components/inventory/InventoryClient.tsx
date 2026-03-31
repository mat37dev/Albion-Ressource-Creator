"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useInventory } from "@/lib/hooks/useInventory";
import { getItemNames } from "@/lib/utils/item-names";
import { ItemIcon } from "@/components/ui/item-icon";
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
import { Loader2, Plus, Trash2, Hammer, AlertCircle } from "lucide-react";
import { formatSilver, formatQuantity } from "@/lib/utils";
import type { InventoryItem } from "@/lib/db/schema";

interface Props {
  locale: string;
}

type SourceFilter = "all" | "bought" | "crafted";

export function InventoryClient({ locale }: Props) {
  const t = useTranslations("inventory");
  const localeCode = useLocale() as "fr" | "en";

  const { inventory, isLoading, error, mutate } = useInventory();

  // Item names lookup
  const [itemNames, setItemNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const itemIds = [...new Set(inventory.map((i) => i.itemId))];
    if (itemIds.length > 0) {
      getItemNames(itemIds, localeCode).then(setItemNames);
    }
  }, [inventory, localeCode]);

  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Edit modal state
  const [editModal, setEditModal] = useState<{
    item: InventoryItem;
    quantity: string;
    pricePerUnit: string;
    notes: string;
  } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (sourceFilter === "all") return inventory;
    return inventory.filter((i) => i.source === sourceFilter);
  }, [inventory, sourceFilter]);

  const openEditModal = (item: InventoryItem) => {
    setEditModal({
      item,
      quantity: String(item.quantity),
      pricePerUnit: String(item.pricePerUnit),
      notes: item.notes ?? "",
    });
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setIsSavingEdit(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/inventory/${editModal.item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(editModal.quantity),
          pricePerUnit: Number(editModal.pricePerUnit),
          notes: editModal.notes || null,
        }),
      });

      if (!res.ok) throw new Error("edit_failed");
      await mutate();
      setEditModal(null);
    } catch {
      setEditError(t("errors.updateFailed"));
    } finally {
      setIsSavingEdit(false);
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

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      // Delete all items one by one
      for (const item of inventory) {
        await fetch(`/api/inventory/${item.id}`, { method: "DELETE" });
      }
      await mutate();
      setShowDeleteAllConfirm(false);
    } catch {
      // silent fail
    } finally {
      setIsDeletingAll(false);
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
          <Button asChild size="sm">
            <Link href={`/${locale}/inventory/add`}>
              <Plus className="h-4 w-4 mr-2" />
              {t("addItem")}
            </Link>
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
                  <th>
                    {filtered.length > 0 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive/70 hover:text-destructive"
                        onClick={() => setShowDeleteAllConfirm(true)}
                        title="Tout supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer hover:bg-secondary/20 transition-colors"
                    onClick={() => openEditModal(row)}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <ItemIcon item={row.itemId} size={28} showTooltip={false} showLoading={false} />
                        <span className="text-white text-sm max-w-[180px] truncate">
                          {itemNames[row.itemId] ?? row.itemId}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span>{formatQuantity(row.quantity)}</span>
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
                    <td onClick={(e) => e.stopPropagation()}>
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

      {/* Edit Modal */}
      <Dialog open={!!editModal} onOpenChange={(open) => !open && setEditModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editModal.title")}</DialogTitle>
          </DialogHeader>

          {editModal && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border">
                <ItemIcon item={editModal.item.itemId} size={36} />
                <div className="font-medium text-white">
                  {itemNames[editModal.item.itemId] ?? editModal.item.itemId}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-qty">{t("editModal.quantity")}</Label>
                <Input
                  id="edit-qty"
                  type="number"
                  min="1"
                  step="1"
                  value={editModal.quantity}
                  onChange={(e) => setEditModal({ ...editModal, quantity: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-price">{t("editModal.pricePerUnit")}</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0"
                  step="1"
                  value={editModal.pricePerUnit}
                  onChange={(e) => setEditModal({ ...editModal, pricePerUnit: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-notes">{t("editModal.notes")}</Label>
                <Input
                  id="edit-notes"
                  value={editModal.notes}
                  onChange={(e) => setEditModal({ ...editModal, notes: e.target.value })}
                  placeholder="..."
                />
              </div>

              {editError && <p className="text-destructive text-sm">{editError}</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal(null)}>
              {t("editModal.cancel")}
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("editModal.saving")}</>
              ) : (
                t("editModal.save")
              )}
            </Button>
          </DialogFooter>
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

      {/* Delete All Confirmation Modal */}
      <Dialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer tout l'inventaire ?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Cette action supprimera tous les {inventory.length} items de votre inventaire. Cette action est irréversible.
            </p>
            <Card className="border-destructive/40 bg-destructive/10">
              <CardContent className="py-3 flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Attention : Cette action ne peut pas être annulée</span>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAllConfirm(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll} disabled={isDeletingAll}>
              {isDeletingAll ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Suppression...</>
              ) : (
                <>Tout supprimer</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
