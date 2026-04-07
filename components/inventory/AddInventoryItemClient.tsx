"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ItemIcon } from "@/components/ui/item-icon";
import { ItemSelector } from "@/components/shared/ItemSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import type { AlbionItem } from "@/lib/db/schema";

interface Props {
  locale: string;
}

export function AddInventoryItemClient({ locale }: Props) {
  const t = useTranslations("inventory");
  const localeCode = useLocale() as "fr" | "en";
  const router = useRouter();

  const [step, setStep] = useState<"select" | "details">("select");
  const [selectedItem, setSelectedItem] = useState<AlbionItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [pricePerUnit, setPricePerUnit] = useState("0");
  const [source, setSource] = useState<"bought" | "crafted" | "rrr_return">("bought");
  const [notes, setNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleItemSelect = (item: AlbionItem) => {
    setSelectedItem(item);
    setStep("details");
  };

  const handleAdd = async () => {
    if (!selectedItem) return;
    setIsAdding(true);
    setError(null);

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedItem.id,
          quantity: Number(quantity),
          pricePerUnit: Number(pricePerUnit),
          source,
          notes: notes || null,
        }),
      });

      if (!res.ok) throw new Error("add_failed");
      router.push(`/${locale}/inventory`);
    } catch {
      setError(t("errors.addFailed"));
    } finally {
      setIsAdding(false);
    }
  };

  if (step === "select") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/inventory`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("title")}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-albion-gold">{t("addModal.title")}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("addModal.selectItem")}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <ItemSelector onItemSelect={handleItemSelect} showAddButton={true} limit={2000} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${locale}/inventory`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("title")}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-albion-gold">{t("addModal.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("description")}</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t("addModal.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedItem && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
              <ItemIcon item={selectedItem.id} size={36} />
              <div className="flex-1">
                <div className="font-medium text-white">
                  {localeCode === "fr" ? selectedItem.nameFR : selectedItem.nameEN}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setStep("select")}
              >
                {t("changeItem")}
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="add-qty">{t("addModal.quantity")}</Label>
              <Input
                id="add-qty"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-price">{t("addModal.pricePerUnit")}</Label>
              <Input
                id="add-price"
                type="number"
                min="0"
                step="1"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t("addModal.source")}</Label>
            <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="..."
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => router.push(`/${locale}/inventory`)}>
              {t("addModal.cancel")}
            </Button>
            <Button onClick={handleAdd} disabled={isAdding || !selectedItem}>
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("addModal.adding")}
                </>
              ) : (
                t("addModal.confirm")
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
