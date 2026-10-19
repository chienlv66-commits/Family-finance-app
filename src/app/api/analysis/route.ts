import { NextRequest } from "next/server";
import { getSessionUser, getMyHousehold } from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { analyzeFinance } from "@/lib/analysis";
import { currentMonth, monthRange, monthlyNeededForGoal } from "@/lib/money";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const month = req.nextUrl.searchParams.get("month") ?? currentMonth();
  const { start, end } = monthRange(month);
  const [txns, budgets, goals, allocation] = await Promise.all([
    prisma.transaction.findMany({ where: { householdId: household.id, date: { gte: start, lt: end } }, include: { category: true } }),
    prisma.budget.findMany({ where: { householdId: household.id, month }, include: { category: true } }),
    prisma.goal.findMany({ where: { householdId: household.id } }),
    prisma.allocationSetting.findUnique({ where: { householdId: household.id } }),
  ]);
  const income = txns.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const byCat = new Map<string, number>();
  for (const t of txns.filter((x) => x.type === "EXPENSE")) byCat.set(t.category.name, (byCat.get(t.category.name) ?? 0) + t.amount);
  const expenseByCategory = [...byCat.entries()].map(([name, total]) => ({ name, total }));
  const budgetInputs = budgets.map((b) => ({
    categoryName: b.category.name,
    limit: b.limit,
    spent: txns.filter((t) => t.type === "EXPENSE" && t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0),
  }));
  const goalsMonthlyNeeded = goals.reduce((s, g) => s + monthlyNeededForGoal(g.targetAmount, g.savedAmount, g.deadlineMonth, month).perMonth, 0);
  const result = analyzeFinance({
    income, expenseByCategory, budgets: budgetInputs, goalsMonthlyNeeded,
    allocation: allocation ?? { needs: 50, wants: 30, savings: 20 },
  });
  return Response.json({ month, analysis: result, goalsMonthlyNeeded });
}
