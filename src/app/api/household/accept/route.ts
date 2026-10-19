import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/household";
import { prisma } from "@/lib/prisma";

// Chấp nhận lời mời vào household (người được mời bấm Chấp nhận trong Cài đặt).
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const inviteId = body?.inviteId as string | undefined;
  if (!inviteId) return Response.json({ error: "Thiếu inviteId" }, { status: 400 });
  const invite = await prisma.householdMember.findUnique({ where: { id: inviteId } });
  if (!invite) return Response.json({ error: "Không tìm thấy lời mời" }, { status: 404 });
  if (invite.status !== "PENDING") return Response.json({ error: "Lời mời đã được xử lý" }, { status: 400 });
  // Chỉ đúng email được mời mới chấp nhận được.
  if (invite.invitedEmail && invite.invitedEmail.toLowerCase() !== user.email?.toLowerCase()) {
    return Response.json({ error: "Lời mời này không dành cho tài khoản của bạn" }, { status: 403 });
  }
  await prisma.householdMember.update({ where: { id: inviteId }, data: { userId: user.id, status: "ACCEPTED" } });
  return Response.json({ ok: true });
}

// Liệt kê lời mời pending dành cho user hiện tại.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const invites = await prisma.householdMember.findMany({
    where: { invitedEmail: user.email?.toLowerCase(), status: "PENDING" },
    include: { household: { select: { id: true, name: true } } },
  });
  return Response.json({ invites });
}
