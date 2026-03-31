import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { inventoryItems } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const updates: { quantity?: number; pricePerUnit?: number; notes?: string | null; updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (body.quantity !== undefined) {
    if (typeof body.quantity !== "number" || body.quantity <= 0 || !Number.isInteger(body.quantity)) {
      return NextResponse.json({ error: "quantity_must_be_integer" }, { status: 400 });
    }
    updates.quantity = body.quantity;
  }
  if (body.pricePerUnit !== undefined) {
    if (typeof body.pricePerUnit !== "number" || body.pricePerUnit < 0) {
      return NextResponse.json({ error: "invalid_price" }, { status: 400 });
    }
    updates.pricePerUnit = body.pricePerUnit;
  }
  if (body.notes !== undefined) {
    updates.notes = body.notes || null;
  }

  const [updated] = await db
    .update(inventoryItems)
    .set(updates)
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, session.user.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(inventoryItems)
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, session.user.id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
