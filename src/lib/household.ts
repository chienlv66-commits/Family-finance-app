import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { ensureHouseholdForUser } from "./household-setup";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  return user;
}

/** Household mà user hiện thuộc về (ưu tiên household mới nhất). Null nếu chưa có. */
export async function getMyHousehold(userId: string) {
  const membership = await prisma.householdMember.findFirst({
    where: { userId, status: "ACCEPTED" },
    orderBy: { createdAt: "desc" },
    include: { household: true },
  });
  if (membership?.household) return membership.household;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  return ensureHouseholdForUser(userId, user?.name);
}

/**
 * Kiểm tra user có quyền trên householdId hay không.
 * Trả về household + role, hoặc null nếu không có quyền.
 */
export async function requireHouseholdAccess(userId: string, householdId: string) {
  const membership = await prisma.householdMember.findFirst({
    where: { householdId, userId, status: "ACCEPTED" },
    include: { household: true },
  });
  return membership;
}

/** Lấy household của user, hoặc lỗi 403/404 để API trả về. */
export async function getHouseholdForUser(userId: string) {
  const household = await getMyHousehold(userId);
  return household;
}
