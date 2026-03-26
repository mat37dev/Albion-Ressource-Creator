import type { PriceData } from "../api";
import type { City } from "../../constants/cities";

export type TradeMode = "direct" | "order";

export interface FlipOpportunity {
  itemId: string;
  itemName: string;
  city: City;
  buyOrderPrice: number;
  sellOrderPrice: number;
  margin: number;
  marginPercent: number;
  roi: number;
  quality: number;
  lastUpdated?: string; // ISO date string of the oldest price between buy and sell
}

const MARKET_TAX = 0.045;
const SETUP_FEE = 0.025;

export function calculateFlipMargin(
  buyOrder: number,
  sellOrder: number
): number {
  // Margin = Sell_order - Buy_order - (Sell_order × 4.5%)
  return Math.round(sellOrder - buyOrder - sellOrder * MARKET_TAX);
}

export function calculateFlipMarginPercent(
  buyOrder: number,
  sellOrder: number
): number {
  if (buyOrder === 0) return 0;
  const margin = calculateFlipMargin(buyOrder, sellOrder);
  return Math.round((margin / buyOrder) * 100 * 10) / 10;
}

export function findFlipOpportunities(
  prices: PriceData[],
  itemNames: Record<string, string>,
  city: City,
  minMargin: number = 1000
): FlipOpportunity[] {
  const opportunities: FlipOpportunity[] = [];

  const cityPrices = prices.filter(
    (p) => p.city.toLowerCase() === city.toLowerCase()
  );

  for (const price of cityPrices) {
    const buyOrder = price.buy_price_max; // Highest buy order
    const sellOrder = price.sell_price_min; // Lowest sell order

    if (!buyOrder || !sellOrder || buyOrder === 0 || sellOrder === 0) continue;
    if (buyOrder >= sellOrder) continue; // No flip opportunity

    const margin = calculateFlipMargin(buyOrder, sellOrder);
    if (margin < minMargin) continue;

    const marginPercent = calculateFlipMarginPercent(buyOrder, sellOrder);
    const roi = buyOrder > 0 ? Math.round((margin / buyOrder) * 100 * 10) / 10 : 0;

    opportunities.push({
      itemId: price.item_id,
      itemName: itemNames[price.item_id] || price.item_id,
      city,
      buyOrderPrice: buyOrder,
      sellOrderPrice: sellOrder,
      margin,
      marginPercent,
      roi,
      quality: price.quality,
    });
  }

  return opportunities.sort((a, b) => b.margin - a.margin);
}

export function findBlackMarketOpportunities(
  localPrices: PriceData[],
  blackMarketPrices: PriceData[],
  itemNames: Record<string, string>,
  minProfit: number = 1000,
  buyMode: TradeMode = "direct",
  sellMode: TradeMode = "direct"
): FlipOpportunity[] {
  const opportunities: FlipOpportunity[] = [];

  const bmPriceMap = new Map<string, PriceData>(
    blackMarketPrices.map((p) => [`${p.item_id}_${p.quality}`, p])
  );

  for (const localPrice of localPrices) {
    const bmPrice = bmPriceMap.get(`${localPrice.item_id}_${localPrice.quality}`);
    if (!bmPrice) continue;

    // Buy side: direct = fill local sell order, order = place buy order (use current buy_price_max)
    const buyPrice =
      buyMode === "direct"
        ? localPrice.sell_price_min
        : localPrice.buy_price_max;

    // Sell side: direct = fill BM buy order immediately, order = post sell order (BM sell_price_min)
    const sellPrice =
      sellMode === "direct"
        ? bmPrice.buy_price_max
        : bmPrice.sell_price_min;

    if (!buyPrice || !sellPrice || buyPrice === 0 || sellPrice === 0) continue;

    const profit = Math.round(
      sellPrice * (1 - MARKET_TAX) - buyPrice * (1 + SETUP_FEE)
    );
    if (profit < minProfit) continue;

    const profitPercent =
      buyPrice > 0 ? Math.round((profit / buyPrice) * 100 * 10) / 10 : 0;

    // Pick the relevant date for each side based on the trade mode
    const buyDate =
      buyMode === "direct"
        ? localPrice.sell_price_min_date
        : localPrice.buy_price_max_date;
    const sellDate =
      sellMode === "direct"
        ? bmPrice.buy_price_max_date
        : bmPrice.sell_price_min_date;

    // Keep the oldest date (most stale) so the user knows the worst-case freshness
    const lastUpdated =
      buyDate && sellDate
        ? new Date(buyDate) < new Date(sellDate)
          ? buyDate
          : sellDate
        : buyDate || sellDate;

    opportunities.push({
      itemId: localPrice.item_id,
      itemName: itemNames[localPrice.item_id] || localPrice.item_id,
      city: localPrice.city as City,
      buyOrderPrice: buyPrice,
      sellOrderPrice: sellPrice,
      margin: profit,
      marginPercent: profitPercent,
      roi: profitPercent,
      quality: localPrice.quality,
      lastUpdated,
    });
  }

  return opportunities.sort((a, b) => b.margin - a.margin);
}
