/**
 * Utility functions for resolving item names from the database
 */

const itemNamesCache = new Map<string, { nameEN: string; nameFR: string }>();

export async function getItemName(
  itemId: string,
  locale: "en" | "fr" = "en"
): Promise<string> {
  if (itemNamesCache.has(itemId)) {
    const cached = itemNamesCache.get(itemId)!;
    return locale === "fr" ? cached.nameFR : cached.nameEN;
  }

  try {
    const res = await fetch(`/api/items/${itemId}`);
    if (!res.ok) return itemId; // Fallback to ID
    const item = await res.json();
    itemNamesCache.set(itemId, {
      nameEN: item.nameEN || itemId,
      nameFR: item.nameFR || itemId,
    });
    return locale === "fr" ? item.nameFR : item.nameEN;
  } catch {
    return itemId; // Fallback on error
  }
}

export async function getItemNames(
  itemIds: string[],
  locale: "en" | "fr" = "en"
): Promise<Record<string, string>> {
  const names: Record<string, string> = {};

  // Collect items already in cache
  const cachedIds: string[] = [];
  const missingIds: string[] = [];

  for (const id of itemIds) {
    if (itemNamesCache.has(id)) {
      cachedIds.push(id);
    } else {
      missingIds.push(id);
    }
  }

  // Batch fetch missing items
  if (missingIds.length > 0) {
    try {
      const res = await fetch(`/api/items?ids=${missingIds.join(",")}`);
      if (res.ok) {
        const { items } = await res.json();
        items.forEach((item: any) => {
          itemNamesCache.set(item.id, {
            nameEN: item.nameEN || item.id,
            nameFR: item.nameFR || item.id,
          });
        });
      }
    } catch (error) {
      console.error("Failed to fetch item names:", error);
    }
  }

  // Fill result from cache
  for (const id of itemIds) {
    const cached = itemNamesCache.get(id);
    if (cached) {
      names[id] = locale === "fr" ? cached.nameFR : cached.nameEN;
    } else {
      names[id] = id; // Fallback to ID if not found
    }
  }

  return names;
}

/**
 * Clear the cache (useful for testing or when data is updated)
 */
export function clearItemNamesCache() {
  itemNamesCache.clear();
}
