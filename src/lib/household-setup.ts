import { prisma } from "./prisma";
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS } from "./analysis";

/** Tạo household mới + thành viên owner + danh mục/ví mặc định + tỉ lệ 50/30/20. */
export async function createHouseholdWithDefaults(ownerUserId: string, name: string) {
  return prisma.$transaction(async (tx) => {
    const household = await tx.household.create({ data: { name, ownerId: ownerUserId } });
    await tx.householdMember.create({
      data: { householdId: household.id, userId: ownerUserId, role: "OWNER", status: "ACCEPTED" },
    });
    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ householdId: household.id, ...c, isDefault: true })),
    });
    await tx.wallet.createMany({
      data: DEFAULT_WALLETS.map((w) => ({ householdId: household.id, ...w, initialBalance: 0 })),
    });
    await tx.allocationSetting.create({
      data: { householdId: household.id, needs: 50, wants: 30, savings: 20 },
    });
    return household;
  });
}

/**
 * Khi user đăng nhập lần đầu mà chưa có household: tự tạo household cá nhân
 * để user dùng ngay, vẫn mời vợ/chồng sau được.
 */
export async function ensureHouseholdForUser(userId: string, userName?: string | null) {
  const existing = await prisma.householdMember.findFirst({
    where: { userId, status: "ACCEPTED" },
    include: { household: true },
  });
  if (existing) return existing.household;
  // Nếu có lời mời pending khớp email -> chấp nhận vào household đó thay vì tạo mới.
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.email) {
    const invite = await prisma.householdMember.findFirst({
      where: { invitedEmail: user.email.toLowerCase(), status: "PENDING" },
      include: { household: true },
    });
    if (invite) {
      await prisma.householdMember.update({
        where: { id: invite.id },
        data: { userId, status: "ACCEPTED" },
      });
      return invite.household;
    }
  }
  return createHouseholdWithDefaults(userId, `Gia đình ${userName ?? "của tôi"}`);
}
