import { NextRequest, NextResponse } from "next/server";
import { COMMON_ITEMS, searchItems } from "@/lib/albion/items";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") ?? "";
  const locale = searchParams.get("locale") ?? "EN-US";

  const results = searchItems(COMMON_ITEMS, query, locale);

  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "public, s-maxage=86400",
    },
  });
}
