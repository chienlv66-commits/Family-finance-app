export function formatVND(n: number): string {
  const v = Number.isFinite(n) ? Math.round(n) : 0;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n));
}

/** "2026-10" -> "Tháng 10/2026" */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  if (!y || !m) return month;
  return `Tháng ${Number(m)}/${y}`;
}

/** Tháng hiện tại dạng YYYY-MM theo giờ Việt Nam (UTC+7, xấp xỉ bằng local). */
export function currentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Dịch tháng YYYY-MM +/- n tháng. */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Số tháng còn lại từ tháng hiện tại đến deadline (deadline - hiện tại). */
export function monthsUntil(deadlineMonth: string, fromMonth?: string): number {
  const from = fromMonth ?? currentMonth();
  const [fy, fm] = from.split("-").map(Number);
  const [dy, dm] = deadlineMonth.split("-").map(Number);
  return (dy - fy) * 12 + (dm - fm);
}

/** Số tiền cần để dành mỗi tháng để kịp mục tiêu. Trả về 0 nếu đã đủ hoặc đã quá hạn mà vẫn chưa đủ (kèm flag quá hạn). */
export function monthlyNeededForGoal(target: number, saved: number, deadlineMonth: string, fromMonth?: string): { perMonth: number; monthsLeft: number; overdue: boolean } {
  const monthsLeft = monthsUntil(deadlineMonth, fromMonth);
  const remaining = Math.max(0, target - saved);
  if (remaining === 0) return { perMonth: 0, monthsLeft, overdue: false };
  if (monthsLeft <= 0) return { perMonth: remaining, monthsLeft, overdue: true };
  return { perMonth: Math.ceil(remaining / monthsLeft), monthsLeft, overdue: false };
}

/** Parse chuỗi tiền người dùng gõ (có thể chứa dấu chấm, phẩy, "đ", khoảng trắng) -> số nguyên VND. */
export function parseVND(input: string): number | null {
  if (typeof input !== "string") return null;
  const cleaned = input.replace(/[^\d-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

/** Lấy khoảng [start, end) của 1 tháng YYYY-MM. */
export function monthRange(month: string): { start: Date; end: Date } {
  const [y, m] = month.split("-").map(Number);
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
}

/** Lấy khoảng [start, end) của 1 quý: quarter 1-4, year. */
export function quarterRange(year: number, quarter: number): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3;
  return { start: new Date(year, startMonth, 1), end: new Date(year, startMonth + 3, 1) };
}
