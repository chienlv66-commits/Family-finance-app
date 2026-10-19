import { NextRequest } from "next/server";
import { getSessionUser, getMyHousehold } from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { budgetSchema, zodErrorMessage, toErrorResponse } from "@/lib/validation";
import { monthRange } from "@/lib/money";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const month = req.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const budgets = await prisma.budget.findMany({ where: { householdId: household.id, month }, include: { category: true } });
  const { start, end } = monthRange(month);
  const txns = await prisma.transaction.findMany({ where: { householdId: household.id, type: "EXPENSE", date: { gte: start, lt: end } } });
  const withSpent = budgets.map((b) => ({
    ...b,
    spent: txns.filter((t) => t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0),
  }));
  return Response.json({ budgets: withSpent });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) return toErrorResponse(zodErrorMessage(parsed.error));
  const cat = await prisma.category.findFirst({ where: { id: parsed.data.categoryId, householdId: household.id } });
  if (!cat) return toErrorResponse("Danh mục không thuộc hộ gia đình này", 403);
  const b = await prisma.budget.upsert({
    where: { householdId_categoryId_month: { householdId: household.id, categoryId: parsed.data.categoryId, month: parsed.data.month } },
    create: { householdId: household.id, ...parsed.data },
    update: { limit: parsed.data.limit },
    include: { category: true },
  });
  return Response.json({ budget: b }, { status: 201 });
}
