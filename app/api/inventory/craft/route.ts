import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { inventoryItems } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { addOrMergeInventoryItem } from "@/lib/db/inventory-helpers";

interface CraftPayload {
  fromInventory: Array<{ lotId: string; quantityUsed: number }>;
  toBuy: Array<{ itemId: string; quantity: number; pricePerUnit: number }>;
  craftedItems: Array<{ itemId: string; quantity: number; totalCost: number }>;
  rrrReturns: Array<{
    itemId: string;
    quantity: number;
    pricePerUnit: number;
    source: "inventory" | "market";
  }>;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body: CraftPayload = await req.json();
  const { fromInventory, craftedItems, rrrReturns } = body;

  if (!fromInventory || !craftedItems) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // Load the lots to validate ownership and available quantity
  const lotIds = fromInventory.map((f) => f.lotId);
  const existingLots = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.userId, session.user.id));

  const lotMap = new Map(existingLots.map((lot) => [lot.id, lot]));

  // Server-side validation: ensure user owns each lot and has enough quantity
  for (const consume of fromInventory) {
    const lot = lotMap.get(consume.lotId);
    if (!lot) {
      return NextResponse.json(
        { error: "lot_not_found", lotId: consume.lotId },
        { status: 400 }
      );
    }
    if (lot.quantity < consume.quantityUsed - 0.0001) {
      return NextResponse.json(
        { error: "insufficient_quantity", lotId: consume.lotId },
        { status: 400 }
      );
    }
  }

  // Execute all mutations in a transaction
  const craftedItemIds: string[] = [];

  await db.transaction(async (tx) => {
    // 1. Reduce / delete consumed inventory lots
    for (const consume of fromInventory) {
      const lot = lotMap.get(consume.lotId)!;
      const remaining = lot.quantity - consume.quantityUsed;
      if (remaining <= 0.0001) {
        await tx.delete(inventoryItems).where(eq(inventoryItems.id, consume.lotId));
      } else {
        await tx
          .update(inventoryItems)
          .set({ quantity: remaining, updatedAt: new Date() })
          .where(eq(inventoryItems.id, consume.lotId));
      }
    }

    // 2. Insert or merge crafted items
    for (const crafted of craftedItems) {
      if (crafted.quantity <= 0) continue;
      const pricePerUnit = crafted.quantity > 0 ? crafted.totalCost / crafted.quantity : 0;
      const itemId = await addOrMergeInventoryItem(tx, {
        userId: session.user.id,
        itemId: crafted.itemId,
        quantity: crafted.quantity,
        pricePerUnit,
        source: "crafted",
        notes: null,
      });
      craftedItemIds.push(itemId);
    }

    // 3. Insert or merge RRR return rows
    for (const rrr of rrrReturns) {
      if (rrr.quantity <= 0.0001) continue;

      const quantityToAdd = Math.floor(rrr.quantity);

      await addOrMergeInventoryItem(tx, {
        userId: session.user.id,
        itemId: rrr.itemId,
        quantity: quantityToAdd,
        pricePerUnit: rrr.pricePerUnit,
        source: "rrr_return",
        notes: null,
      });
    }
  });

  return NextResponse.json({ success: true, craftedItemIds });
}
