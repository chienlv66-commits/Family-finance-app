import { NextRequest } from "next/server";
import { getSessionUser, getMyHousehold } from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { goalSchema, zodErrorMessage, toErrorResponse } from "@/lib/validation";
import { monthlyNeededForGoal, currentMonth } from "@/lib/money";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const goals = await prisma.goal.findMany({ where: { householdId: household.id }, orderBy: { deadlineMonth: "asc" }, include: { contributions: { orderBy: { date: "desc" }, take: 20 } } });
  const withCalc = goals.map((g) => ({
    ...g,
    progress: g.targetAmount > 0 ? (g.savedAmount / g.targetAmount) * 100 : 0,
    ...monthlyNeededForGoal(g.targetAmount, g.savedAmount, g.deadlineMonth, currentMonth()),
  }));
  return Response.json({ goals: withCalc });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) return toErrorResponse(zodErrorMessage(parsed.error));
  const g = await prisma.goal.create({ data: { householdId: household.id, ...parsed.data } });
  return Response.json({ goal: g }, { status: 201 });
}
