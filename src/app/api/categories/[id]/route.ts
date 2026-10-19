import { NextRequest } from "next/server";
import { getSessionUser, getMyHousehold } from "@/lib/household";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const cat = await prisma.category.findFirst({ where: { id: params.id, householdId: household.id } });
  if (!cat) return Response.json({ error: "Không tìm thấy danh mục" }, { status: 404 });
  const used = await prisma.transaction.count({ where: { categoryId: params.id } });
  if (used > 0) return Response.json({ error: `Danh mục đang có ${used} giao dịch, không thể xóa` }, { status: 400 });
  await prisma.category.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
