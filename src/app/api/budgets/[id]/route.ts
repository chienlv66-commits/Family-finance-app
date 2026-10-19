import { NextRequest } from "next/server";
import { getSessionUser, getMyHousehold } from "@/lib/household";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const b = await prisma.budget.findFirst({ where: { id: params.id, householdId: household.id } });
  if (!b) return Response.json({ error: "Không tìm thấy ngân sách" }, { status: 404 });
  await prisma.budget.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
