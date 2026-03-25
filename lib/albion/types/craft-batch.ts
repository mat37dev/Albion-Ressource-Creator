import { City, SellCity } from "@/lib/constants/cities";

export interface CraftBatchItem {
  id: string; // UUID unique pour ce batch item
  itemId: string; // T4_MAIN_SWORD
  recipeId: string; // UUID de la recette choisie
  quantity: number;
  sellCity: SellCity;
  sellType: 'direct' | 'order' | 'blackmarket';
  customSellPrice?: number;
  rrr?: number; // RRR spécifique à cet item (défaut 18%)
  recipeMaterials?: Array<{ materialItemId: string; quantity: number }>; // Cache recette
  craftingFeeBase?: number; // Nutrition requise pour le craft (depuis la recette)
}

export interface MaterialRequirement {
  materialId: string;
  totalQuantity: number; // Agrégé sur tous les items du batch
  effectiveQuantity: number; // Après RRR
  buyCity: City;
  buyType: 'buy' | 'order';
  customBuyPrice?: number;
  pricePerUnit: number;
  totalCost: number;
  usedInItems: string[]; // IDs des batch items qui utilisent ce matériau
}

export interface CraftBatchState {
  items: CraftBatchItem[];
  materials: Record<string, MaterialRequirement>;
  globalSettings: {
    useFocus: boolean;
    isPremium: boolean; // Compte Premium (taxes réduites)
    craftingFeePerNutrition: number; // Prix par nutrition à la station (en silver)
  };
  journals?: {
    use: boolean;
    items: Array<{
      journalId: string;
      buyPrice: number;
      sellPrice: number;
    }>;
  };
  priceCache: Map<string, any[]>; // PriceData from API
}

export interface CraftBatchResult {
  itemResults: CraftItemResult[];
  totalProfit: number;
  totalCost: number;
  totalRevenue: number;
  aggregatedMaterials: MaterialSummary[];
  rrr: number; // Resource Return Rate appliqué
  journalProfit?: number; // Profit des registres si activés
}

export interface CraftItemResult {
  batchItemId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitProfit: number;
  totalProfit: number;
  profitPercent: number;
  materialCost: number;
  sellPrice: number;
  netSellPrice: number; // Après taxes
  sellCity: SellCity;
  sellType: string;
}

export interface MaterialSummary {
  materialId: string;
  materialName: string;
  totalQuantity: number; // Quantité brute (sans RRR)
  effectiveQuantity: number; // Quantité avec RRR (ce qu'on doit acheter)
  rrrQuantity: number; // Alias explicite = effectiveQuantity arrondi au supérieur
  pricePerUnit: number;
  totalCost: number; // Coût basé sur rrrQuantity
  buyCity: City;
  buyType: string;
}
