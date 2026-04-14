import { City, SellCity } from "@/lib/constants/cities";

export interface CraftBatchItem {
  id: string; // UUID unique pour ce batch item
  itemId: string; // T4_MAIN_SWORD
  recipeId: string; // UUID de la recette choisie
  quantity: number;
  sellCity: SellCity;
  sellType: 'direct' | 'order' | 'blackmarket' | 'exchange';
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
  buyType: 'buy' | 'order' | 'exchange';
  customBuyPrice?: number;
  pricePerUnit: number;
  totalCost: number;
  usedInItems: string[]; // IDs des batch items qui utilisent ce matériau
}

export interface CraftBatchState {
  items: CraftBatchItem[];
  materials: Record<string, MaterialRequirement>;
  globalSettings: {
    isPremium: boolean; // Compte Premium (taxes réduites)
    craftingFeePerNutrition: number; // Prix pour 100 nutritions à la station (en silver)
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
  totalTaxPaid: number;       // Taxes de vente (prélevées sur le revenu)
  totalBuyTaxPaid: number;    // Frais de mise en place ordres d'achat (2.5%)
  totalCraftingFees: number;  // Frais de station de craft
  aggregatedMaterials: MaterialSummary[];
  rrr: number;
  journalProfit?: number;
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
  taxPaid: number;     // Taxe de vente payée pour cet item
  taxRate: number;     // Taux de taxe de vente appliqué (ex: 0.04 pour 4%)
  craftingFee: number; // Frais de station de craft pour cet item
  sellCity: SellCity;
  sellType: string;
}

export interface MaterialSummary {
  materialId: string;
  materialName: string;
  totalQuantity: number;    // Quantité brute (sans RRR)
  effectiveQuantity: number; // Quantité avec RRR (ce qu'on doit acheter)
  rrrQuantity: number;      // Alias explicite = effectiveQuantity arrondi au supérieur
  pricePerUnit: number;
  totalCost: number;        // Coût basé sur rrrQuantity
  buyTaxPaid: number;       // Setup fee 2.5% si ordre d'achat, sinon 0
  buyCity: City;
  buyType: string;
}
