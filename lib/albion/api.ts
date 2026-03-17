const AODP_BASE_URL = "https://europe.albion-online-data.com/api/v2/stats/prices";

export interface PriceData {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
}

export interface FetchPricesOptions {
  items: string[];
  locations?: string[];
  qualities?: number[];
}

// Batch size to stay within API limits
const BATCH_SIZE = 50;

async function fetchBatch(
  items: string[],
  locations: string[],
  qualities: number[]
): Promise<PriceData[]> {
  const itemsParam = items.join(",");
  const locationsParam = locations.join(",");
  const qualitiesParam = qualities.join(",");

  const url = `${AODP_BASE_URL}/${itemsParam}?locations=${locationsParam}&qualities=${qualitiesParam}`;

  const response = await fetch(url, {
    next: { revalidate: 1800 }, // 30 min cache
  });

  if (!response.ok) {
    throw new Error(`AODP API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function fetchPrices({
  items,
  locations = ["Thetford", "Bridgewatch", "Lymhurst", "Fort Sterling", "Martlock", "Caerleon", "Brecilien"],
  qualities = [1],
}: FetchPricesOptions): Promise<PriceData[]> {
  // Split items into batches
  const batches: string[][] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }

  // Fetch all batches
  const results = await Promise.allSettled(
    batches.map((batch) => fetchBatch(batch, locations, qualities))
  );

  const allPrices: PriceData[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allPrices.push(...result.value);
    } else {
      console.error("Batch fetch failed:", result.reason);
    }
  }

  return allPrices;
}

export function getPriceForCity(
  prices: PriceData[],
  itemId: string,
  city: string,
  quality: number = 1
): PriceData | undefined {
  return prices.find(
    (p) =>
      p.item_id === itemId &&
      p.city.toLowerCase() === city.toLowerCase() &&
      p.quality === quality
  );
}

export function groupPricesByItem(
  prices: PriceData[]
): Record<string, PriceData[]> {
  return prices.reduce(
    (acc, price) => {
      if (!acc[price.item_id]) {
        acc[price.item_id] = [];
      }
      acc[price.item_id].push(price);
      return acc;
    },
    {} as Record<string, PriceData[]>
  );
}
