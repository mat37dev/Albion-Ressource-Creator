import { City } from "@/lib/constants/cities";

export interface CraftBatchItem {
  id: string; // UUID unique pour ce batch item
  itemId: string; // T4_MAIN_SWORD
  recipeId: string; // UUID de la recette choisie
  quantity: number;
  sellCity: City;
  sellType: 'direct' | 'order' | 'blackmarket';
  customSellPrice?: number;
  rrr?: number; // RRR spécifique à cet item (défaut 18%)
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
  sellCity: City;
  sellType: string;
}

export interface MaterialSummary {
  materialId: string;
  materialName: string;
  totalQuantity: number;
  effectiveQuantity: number;
  pricePerUnit: number;
  totalCost: number;
  buyCity: City;
  buyType: string;
}
