import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed: không tạo dữ liệu mẫu tự động. Danh mục/ví mặc định được tạo khi user tạo household (xem src/lib/household-setup.ts).");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
