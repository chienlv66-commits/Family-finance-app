import { NextRequest } from "next/server";
import { getSessionUser, getMyHousehold, requireHouseholdAccess } from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { transactionSchema, zodErrorMessage, toErrorResponse } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const sp = req.nextUrl.searchParams;
  const month = sp.get("month");
  const type = sp.get("type");
  const q = (sp.get("q") ?? "").trim();
  const categoryId = sp.get("categoryId");
  const where: Record<string, unknown> = { householdId: household.id };
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }
  if (type === "INCOME" || type === "EXPENSE") where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (q) where.note = { contains: q, mode: "insensitive" };
  const txns = await prisma.transaction.findMany({
    where: where as never,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { category: true, wallet: true },
    take: 500,
  });
  return Response.json({ transactions: txns });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) return toErrorResponse(zodErrorMessage(parsed.error));
  const d = parsed.data;
  // Bảo mật: category + wallet phải thuộc household này.
  const category = await prisma.category.findFirst({ where: { id: d.categoryId, householdId: household.id } });
  if (!category) return toErrorResponse("Danh mục không thuộc hộ gia đình này", 403);
  if (category.type !== d.type) return toErrorResponse("Loại giao dịch không khớp danh mục", 400);
  if (d.walletId) {
    const wallet = await prisma.wallet.findFirst({ where: { id: d.walletId, householdId: household.id } });
    if (!wallet) return toErrorResponse("Ví không thuộc hộ gia đình này", 403);
  }
  const txn = await prisma.transaction.create({
    data: {
      householdId: household.id,
      walletId: d.walletId ?? null,
      categoryId: d.categoryId,
      type: d.type,
      amount: d.amount,
      date: new Date(d.date),
      note: d.note ?? null,
      isChildExpense: d.isChildExpense ?? false,
      createdById: user.id,
    },
    include: { category: true, wallet: true },
  });
  return Response.json({ transaction: txn }, { status: 201 });
}
