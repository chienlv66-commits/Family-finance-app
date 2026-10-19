import { NextRequest } from "next/server";
import { getSessionUser, getMyHousehold } from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { allocationSchema, zodErrorMessage, toErrorResponse } from "@/lib/validation";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const setting = await prisma.allocationSetting.findUnique({ where: { householdId: household.id } });
  return Response.json({ allocation: setting ?? { needs: 50, wants: 30, savings: 20 } });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = allocationSchema.safeParse(body);
  if (!parsed.success) return toErrorResponse(zodErrorMessage(parsed.error));
  const setting = await prisma.allocationSetting.upsert({
    where: { householdId: household.id },
    create: { householdId: household.id, ...parsed.data },
    update: parsed.data,
  });
  return Response.json({ allocation: setting });
}
