import { NextRequest } from "next/server";
import { getSessionUser, getMyHousehold } from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { categorySchema, zodErrorMessage, toErrorResponse } from "@/lib/validation";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const categories = await prisma.category.findMany({ where: { householdId: household.id }, orderBy: [{ type: "asc" }, { name: "asc" }] });
  return Response.json({ categories });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return toErrorResponse(zodErrorMessage(parsed.error));
  try {
    const cat = await prisma.category.create({ data: { householdId: household.id, ...parsed.data } });
    return Response.json({ category: cat }, { status: 201 });
  } catch {
    return toErrorResponse("Danh mục này đã tồn tại", 409);
  }
}
