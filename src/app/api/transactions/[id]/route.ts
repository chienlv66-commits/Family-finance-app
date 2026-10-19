import { NextRequest } from "next/server";
import { getSessionUser, getMyHousehold } from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { transactionSchema, zodErrorMessage, toErrorResponse } from "@/lib/validation";

async function load(userId: string, id: string) {
  const household = await getMyHousehold(userId);
  if (!household) return null;
  const txn = await prisma.transaction.findFirst({ where: { id, householdId: household.id } });
  return txn ? { household, txn } : null;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const loaded = await load(user.id, params.id);
  if (!loaded) return Response.json({ error: "Không tìm thấy giao dịch" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) return toErrorResponse(zodErrorMessage(parsed.error));
  const d = parsed.data;
  const category = await prisma.category.findFirst({ where: { id: d.categoryId, householdId: loaded.household.id } });
  if (!category || category.type !== d.type) return toErrorResponse("Danh mục không hợp lệ", 400);
  const updated = await prisma.transaction.update({
    where: { id: params.id },
    data: { type: d.type, amount: d.amount, date: new Date(d.date), categoryId: d.categoryId, walletId: d.walletId ?? null, note: d.note ?? null, isChildExpense: d.isChildExpense ?? false },
    include: { category: true, wallet: true },
  });
  return Response.json({ transaction: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const loaded = await load(user.id, params.id);
  if (!loaded) return Response.json({ error: "Không tìm thấy giao dịch" }, { status: 404 });
  await prisma.transaction.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
