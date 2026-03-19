import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { albionItems } from "@/lib/db/schema";
import { and, gte, lte, inArray, or } from "drizzle-orm";

/**
 * GET /api/items/popular
 *
 * Retourne ~200 items populaires pour les scans de prix:
 * - T4-T7 resources (raw + refined)
 * - T4-T6 weapons/armor avec enchant ≤ 1
 */
export async function GET() {
  try {
    const results = await db
      .select({
        id: albionItems.id,
        nameEN: albionItems.nameEN,
        nameFR: albionItems.nameFR,
        tier: albionItems.tier,
        enchant: albionItems.enchant,
        category: albionItems.category,
        subcategory: albionItems.subcategory,
      })
      .from(albionItems)
      .where(
        or(
          // T4-T7 resources (raw + refined)
          and(
            inArray(albionItems.category, ["resource_raw", "resource_refined"]),
            gte(albionItems.tier, 4),
            lte(albionItems.tier, 7)
          ),
          // T4-T6 weapons/armor with enchant ≤ 1
          and(
            inArray(albionItems.category, ["weapon", "armor"]),
            gte(albionItems.tier, 4),
            lte(albionItems.tier, 6),
            lte(albionItems.enchant, 1)
          )
        )
      );

    // Return as array of item IDs for backwards compatibility
    const itemIds = results.map((item) => item.id);

    return NextResponse.json({
      items: results,
      itemIds, // For backwards compat with getPopularScanItems()
      count: results.length,
    });
  } catch (error) {
    console.error("Error fetching popular items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
