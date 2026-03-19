"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface ItemSearchComboboxProps {
  onSelect: (itemId: string) => void;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  nameEN: string;
  nameFR: string;
  tier: number;
  category: string;
}

export function ItemSearchCombobox({ onSelect, onClose }: ItemSearchComboboxProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchItems = async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/items/search?q=${encodeURIComponent(searchTerm)}&limit=20`);
        if (res.ok) {
          const items = await res.json();
          setResults(items);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchItems, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Rechercher un item à crafter</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un item (ex: T4_SWORD)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-1">
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Recherche en cours...
              </div>
            )}

            {!loading && searchTerm.length < 2 && (
              <div className="text-center py-8 text-muted-foreground">
                Entrez au moins 2 caractères pour rechercher
              </div>
            )}

            {!loading && searchTerm.length >= 2 && results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun résultat trouvé
              </div>
            )}

            {results.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => onSelect(item.id)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1">
                    <div className="font-medium">{item.nameFR || item.nameEN}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.id} • T{item.tier} • {item.category}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
