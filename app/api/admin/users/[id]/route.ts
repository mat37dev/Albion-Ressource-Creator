import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";

const VALID_ROLES = ["free", "premium", "admin"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { email, name, role } = body;

  // Validate role if provided
  if (role !== undefined && !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }

  // Prevent admin from demoting themselves
  if (id === session.user.id && role !== undefined && role !== "admin") {
    return NextResponse.json({ error: "cannot_demote_self" }, { status: 400 });
  }

  // Check email uniqueness if changing email
  if (email !== undefined) {
    const [conflict] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, id)))
      .limit(1);
    if (conflict) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (email !== undefined) updates.email = email;
  if (name !== undefined) updates.name = name;
  if (role !== undefined) updates.role = role;

  await db.update(users).set(updates).where(eq(users.id, id));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "cannot_delete_self" }, { status: 400 });
  }

  await db.delete(users).where(eq(users.id, id));

  return NextResponse.json({ success: true });
}
