import { NextRequest } from "next/server";
import { getSessionUser, getMyHousehold } from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { householdSchema, inviteSchema, zodErrorMessage, toErrorResponse } from "@/lib/validation";
import { createHouseholdWithDefaults, ensureHouseholdForUser } from "@/lib/household-setup";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await ensureHouseholdForUser(user.id, user.name);
  const members = await prisma.householdMember.findMany({ where: { householdId: household.id }, include: { user: { select: { id: true, name: true, email: true, image: true } } }, orderBy: { createdAt: "asc" } });
  return Response.json({ household: { id: household.id, name: household.name, ownerId: household.ownerId }, members });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = householdSchema.safeParse(body);
  if (!parsed.success) return toErrorResponse(zodErrorMessage(parsed.error));
  const household = await createHouseholdWithDefaults(user.id, parsed.data.name);
  return Response.json({ household }, { status: 201 });
}
