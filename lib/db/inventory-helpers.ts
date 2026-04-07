/**
 * Helper functions for inventory operations
 */

import { db } from "@/lib/db";
import { inventoryItems } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

/**
 * Adds an item to inventory, merging with existing lot if identical
 * (same itemId, pricePerUnit, and notes)
 */
export async function addOrMergeInventoryItem(
  tx: any, // Transaction object
  data: {
    userId: string;
    itemId: string;
    quantity: number;
    pricePerUnit: number;
    source: string;
    notes?: string | null;
  }
): Promise<string> {
  // Find existing lot with same itemId, pricePerUnit, and notes
  const conditions = [
    eq(inventoryItems.userId, data.userId),
    eq(inventoryItems.itemId, data.itemId),
    eq(inventoryItems.pricePerUnit, data.pricePerUnit),
    eq(inventoryItems.source, data.source),
  ];

  // Handle notes comparison (both null or both equal)
  if (data.notes === null || data.notes === undefined) {
    conditions.push(isNull(inventoryItems.notes));
  } else {
    conditions.push(eq(inventoryItems.notes, data.notes));
  }

  const existingLot = await tx
    .select()
    .from(inventoryItems)
    .where(and(...conditions))
    .limit(1);

  if (existingLot.length > 0) {
    // Merge: update quantity
    await tx
      .update(inventoryItems)
      .set({
        quantity: existingLot[0].quantity + data.quantity,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, existingLot[0].id));

    return existingLot[0].id;
  } else {
    // Create new lot
    const [inserted] = await tx
      .insert(inventoryItems)
      .values({
        userId: data.userId,
        itemId: data.itemId,
        quantity: data.quantity,
        pricePerUnit: data.pricePerUnit,
        source: data.source,
        notes: data.notes || null,
      })
      .returning({ id: inventoryItems.id });

    return inserted.id;
  }
}
