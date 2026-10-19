import { NextRequest } from "next/server";
import { getSessionUser, getMyHousehold } from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { walletSchema, zodErrorMessage, toErrorResponse } from "@/lib/validation";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const wallets = await prisma.wallet.findMany({ where: { householdId: household.id }, orderBy: { createdAt: "asc" }, include: { transactions: true } });
  // Số dư thực tế của ví = initialBalance + tổng giao dịch của ví.
  const withBalance = wallets.map((w) => ({
    id: w.id, name: w.name, type: w.type, initialBalance: w.initialBalance,
    balance: w.initialBalance + w.transactions.reduce((s, t) => s + (t.type === "INCOME" ? t.amount : -t.amount), 0),
    createdAt: w.createdAt,
  }));
  return Response.json({ wallets: withBalance });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = walletSchema.safeParse(body);
  if (!parsed.success) return toErrorResponse(zodErrorMessage(parsed.error));
  const w = await prisma.wallet.create({ data: { householdId: household.id, ...parsed.data } });
  return Response.json({ wallet: w }, { status: 201 });
}
