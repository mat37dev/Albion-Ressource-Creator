import type { PriceData } from "../api";
import type { City } from "../../constants/cities";

export interface TransportOpportunity {
  itemId: string;
  itemName: string;
  buyCity: City;
  sellCity: City;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  profitPercent: number;
  tax: number;
}

export interface TransportCalculationOptions {
  tax?: number; // Default 8%
  minProfit?: number;
  minVolume?: number;
}

export function calculateTransportProfit(
  buyPrice: number,
  sellPrice: number,
  tax: number = 0.08
): number {
  // Profit = Sell_price × (1 - tax) - Buy_price × (1 + tax)
  const effectiveSell = sellPrice * (1 - tax);
  const effectiveBuy = buyPrice * (1 + tax);
  return Math.round(effectiveSell - effectiveBuy);
}

export function calculateTransportProfitPercent(
  buyPrice: number,
  sellPrice: number,
  tax: number = 0.08
): number {
  const profit = calculateTransportProfit(buyPrice, sellPrice, tax);
  const cost = buyPrice * (1 + tax);
  if (cost === 0) return 0;
  return Math.round((profit / cost) * 100 * 10) / 10;
}

export function findTransportOpportunities(
  prices: PriceData[],
  itemNames: Record<string, string>,
  options: TransportCalculationOptions = {}
): TransportOpportunity[] {
  const { tax = 0.08, minProfit = 1000 } = options;
  const opportunities: TransportOpportunity[] = [];

  // Group prices by item
  const byItem: Record<string, PriceData[]> = {};
  for (const price of prices) {
    if (!byItem[price.item_id]) byItem[price.item_id] = [];
    byItem[price.item_id].push(price);
  }

  for (const [itemId, itemPrices] of Object.entries(byItem)) {
    // Compare all city pairs
    for (const buyData of itemPrices) {
      if (!buyData.sell_price_min || buyData.sell_price_min === 0) continue;

      for (const sellData of itemPrices) {
        if (sellData.city === buyData.city) continue;
        if (!sellData.sell_price_min || sellData.sell_price_min === 0) continue;

        const profit = calculateTransportProfit(
          buyData.sell_price_min,
          sellData.sell_price_min,
          tax
        );

        if (profit < minProfit) continue;

        const profitPercent = calculateTransportProfitPercent(
          buyData.sell_price_min,
          sellData.sell_price_min,
          tax
        );

        opportunities.push({
          itemId,
          itemName: itemNames[itemId] || itemId,
          buyCity: buyData.city as City,
          sellCity: sellData.city as City,
          buyPrice: buyData.sell_price_min,
          sellPrice: sellData.sell_price_min,
          profit,
          profitPercent,
          tax,
        });
      }
    }
  }

  // Sort by profit descending
  return opportunities.sort((a, b) => b.profit - a.profit);
}
