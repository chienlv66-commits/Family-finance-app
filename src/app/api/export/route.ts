import { NextRequest } from "next/server";
import { getSessionUser, getMyHousehold } from "@/lib/household";
import { prisma } from "@/lib/prisma";

// Xuất CSV giao dịch của household (lọc theo tháng / quý).
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const household = await getMyHousehold(user.id);
  if (!household) return Response.json({ error: "Chưa có hộ gia đình" }, { status: 404 });
  const sp = req.nextUrl.searchParams;
  const month = sp.get("month");
  const year = sp.get("year");
  const quarter = sp.get("quarter");
  let where: Record<string, unknown> = { householdId: household.id };
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  } else if (year && quarter) {
    const y = Number(year); const q = Number(quarter);
    const sm = (q - 1) * 3;
    where.date = { gte: new Date(y, sm, 1), lt: new Date(y, sm + 3, 1) };
  }
  const txns = await prisma.transaction.findMany({ where: where as never, orderBy: { date: "asc" }, include: { category: true, wallet: true } });
  const header = "Ngày,Loại,Số tiền (VND),Danh mục,Ví,Ghi chú,Chi phí con cái\n";
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows = txns.map((t) => [
    t.date.toISOString().slice(0, 10),
    t.type === "INCOME" ? "Thu" : "Chi",
    String(t.amount),
    escape(t.category.name),
    escape(t.wallet?.name ?? ""),
    escape(t.note ?? ""),
    t.isChildExpense ? "Có" : "Không",
  ].join(","));
  const csv = "\uFEFF" + header + rows.join("\n");
  const suffix = month ? month : year && quarter ? `${year}-Q${quarter}` : "tat-ca";
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="chi-tieu-${suffix}.csv"` } });
}
