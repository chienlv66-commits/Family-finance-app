import { NextRequest } from "next/server";
import { getSessionUser, getMyHousehold } from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { inviteSchema, zodErrorMessage, toErrorResponse } from "@/lib/validation";

// Mời vợ/chồng bằng email Gmail. Chỉ OWNER mới mời được.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const membership = await prisma.householdMember.findFirst({ where: { householdId: household.id, userId: user.id, status: "ACCEPTED" } });
  if (!membership || membership.role !== "OWNER") return toErrorResponse("Chỉ chủ hộ mới mời được thành viên", 403);
  const body = await req.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return toErrorResponse(zodErrorMessage(parsed.error));
  const email = parsed.data.email;
  if (email === user.email?.toLowerCase()) return toErrorResponse("Không thể mời chính mình", 400);
  const existing = await prisma.householdMember.findFirst({ where: { householdId: household.id, invitedEmail: email } });
  if (existing) return toErrorResponse("Email này đã được mời", 409);
  // Nếu người được mời đã có tài khoản -> gắn userId luôn, vẫn chờ họ chấp nhận.
  const invitedUser = await prisma.user.findUnique({ where: { email } });
  const invite = await prisma.householdMember.create({
    data: { householdId: household.id, userId: invitedUser?.id ?? null, invitedEmail: email, role: "MEMBER", status: "PENDING" },
  });
  return Response.json({ invite }, { status: 201 });
}

// Thu hồi lời mời (OWNER)
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return toErrorResponse("Thiếu id lời mời", 400);
  const membership = await prisma.householdMember.findFirst({ where: { householdId: household.id, userId: user.id, status: "ACCEPTED" } });
  if (!membership || membership.role !== "OWNER") return toErrorResponse("Chỉ chủ hộ mới thu hồi được", 403);
  await prisma.householdMember.deleteMany({ where: { id, householdId: household.id, status: "PENDING" } });
  return Response.json({ ok: true });
}
