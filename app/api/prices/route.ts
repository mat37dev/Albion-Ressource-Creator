import { NextRequest, NextResponse } from "next/server";
import { fetchPrices } from "@/lib/albion/api";

export const revalidate = 0; // Toujours frais — l'utilisateur upload lui-même les prix via le client AODP

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const items = searchParams.get("items")?.split(",") ?? [];
  const locations = searchParams.get("locations")?.split(",");
  const qualities = searchParams.get("qualities")?.split(",").map(Number);

  if (items.length === 0) {
    return NextResponse.json(
      { error: "No items specified" },
      { status: 400 }
    );
  }

  try {
    const prices = await fetchPrices({
      items,
      locations,
      qualities,
    });

    return NextResponse.json(prices, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Price fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
