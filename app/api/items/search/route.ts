import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { albionItems } from "@/lib/db/schema";
import { or, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "20");

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // Search in ID, nameEN, and nameFR
    const results = await db
      .select({
        id: albionItems.id,
        nameEN: albionItems.nameEN,
        nameFR: albionItems.nameFR,
        tier: albionItems.tier,
        category: albionItems.category,
        subcategory: albionItems.subcategory,
      })
      .from(albionItems)
      .where(
        or(
          ilike(albionItems.id, `%${query}%`),
          ilike(albionItems.nameEN, `%${query}%`),
          ilike(albionItems.nameFR, `%${query}%`)
        )
      )
      .limit(limit);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
