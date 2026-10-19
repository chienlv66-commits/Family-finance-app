import { NextRequest } from "next/server";
import { getSessionUser, getMyHousehold } from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { monthRange } from "@/lib/money";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });

  const month = req.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const { start, end } = monthRange(month);

  const [txnsInMonth, allTxns, wallets, goals] = await Promise.all([
    prisma.transaction.findMany({ where: { householdId: household.id, date: { gte: start, lt: end } }, include: { category: true, wallet: true } }),
    prisma.transaction.findMany({ where: { householdId: household.id }, select: { type: true, amount: true, date: true } }),
    prisma.wallet.findMany({ where: { householdId: household.id } }),
    prisma.goal.findMany({ where: { householdId: household.id } }),
  ]);

  const income = txnsInMonth.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = txnsInMonth.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  const initial = wallets.reduce((s, w) => s + w.initialBalance, 0);
  const beforeMonth = allTxns.filter((t) => t.date < start).reduce((s, t) => s + (t.type === "INCOME" ? t.amount : -t.amount), 0);
  const openingBalance = initial + beforeMonth;
  const actualBalance = initial + allTxns.reduce((s, t) => s + (t.type === "INCOME" ? t.amount : -t.amount), 0);

  // Chi theo danh mục trong tháng
  const byCategory = new Map<string, number>();
  for (const t of txnsInMonth.filter((x) => x.type === "EXPENSE")) {
    byCategory.set(t.category.name, (byCategory.get(t.category.name) ?? 0) + t.amount);
  }

  // Thu - chi 6 tháng gần đây
  const last6: { month: string; income: number; expense: number }[] = [];
  const [y, m] = month.split("-").map(Number);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    const mm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const { start: s, end: e } = monthRange(mm);
    const list = allTxns.filter((t) => t.date >= s && t.date < e);
    last6.push({
      month: mm,
      income: list.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0),
      expense: list.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0),
    });
  }

  return Response.json({
    household: { id: household.id, name: household.name },
    month, income, expense, remaining: income - expense, openingBalance, actualBalance,
    expenseByCategory: [...byCategory.entries()].map(([name, total]) => ({ name, total })),
    last6, goalsCount: goals.length,
  });
}
