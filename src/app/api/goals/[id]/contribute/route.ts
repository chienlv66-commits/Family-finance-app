import { NextRequest } from "next/server";
import { getSessionUser, getMyHousehold } from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { goalContributionSchema, zodErrorMessage, toErrorResponse } from "@/lib/validation";

// POST /api/goals/[id]/contribute — ghi tiền vào / rút ra khỏi mục tiêu
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const goal = await prisma.goal.findFirst({ where: { id: params.id, householdId: household.id } });
  if (!goal) return Response.json({ error: "Không tìm thấy mục tiêu" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = goalContributionSchema.safeParse(body);
  if (!parsed.success) return toErrorResponse(zodErrorMessage(parsed.error));
  const delta = parsed.data.kind === "DEPOSIT" ? parsed.data.amount : -parsed.data.amount;
  if (goal.savedAmount + delta < 0) return toErrorResponse("Số tiền rút vượt quá số đã tiết kiệm", 400);
  const [updated] = await prisma.$transaction([
    prisma.goal.update({ where: { id: params.id }, data: { savedAmount: goal.savedAmount + delta } }),
    prisma.goalContribution.create({ data: { goalId: params.id, amount: parsed.data.amount, kind: parsed.data.kind, note: parsed.data.note ?? null } }),
  ]);
  return Response.json({ goal: updated }, { status: 201 });
}
