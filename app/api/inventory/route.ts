import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { inventoryItems } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { addOrMergeInventoryItem } from "@/lib/db/inventory-helpers";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const items = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.userId, session.user.id))
    .orderBy(asc(inventoryItems.createdAt));

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { itemId, quantity, pricePerUnit, source, notes } = body;

  if (!itemId || typeof itemId !== "string") {
    return NextResponse.json({ error: "invalid_item_id" }, { status: 400 });
  }
  if (typeof quantity !== "number" || quantity <= 0 || !Number.isInteger(quantity)) {
    return NextResponse.json({ error: "quantity_must_be_integer" }, { status: 400 });
  }
  if (typeof pricePerUnit !== "number" || pricePerUnit < 0) {
    return NextResponse.json({ error: "invalid_price" }, { status: 400 });
  }
  const validSources = ["bought", "crafted", "rrr_return"];
  if (!source || !validSources.includes(source)) {
    return NextResponse.json({ error: "invalid_source" }, { status: 400 });
  }

  let insertedId: string;

  await db.transaction(async (tx) => {
    insertedId = await addOrMergeInventoryItem(tx, {
      userId: session.user.id,
      itemId,
      quantity,
      pricePerUnit,
      source,
      notes: notes ?? null,
    });
  });

  // Fetch the final item to return
  const [item] = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.id, insertedId!))
    .limit(1);

  return NextResponse.json(item, { status: 201 });
}
