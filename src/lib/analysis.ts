// Phân tích 50/30/20 + gợi ý chi tiêu — RULE-BASED, không cần API key AI.
// Danh mục thiết yếu (needs) mặc định: ăn uống, đi chợ, nhà ở, điện nước, đi lại, con cái, sức khỏe, giáo dục.
// Phần còn lại tính là linh hoạt (wants). Người dùng có thể đổi tỉ lệ trong Cài đặt.

export const ESSENTIAL_KEYWORDS = [
  "ăn", "chợ", "siêu thị", "nhà", "thuê", "điện", "nước", "internet", "đi lại", "xăng", "xe",
  "con", "học", "giáo dục", "sức khỏe", "thuốc", "bệnh", "bảo hiểm",
];

export function isEssentialCategory(name: string): boolean {
  const lower = name.toLowerCase();
  return ESSENTIAL_KEYWORDS.some((k) => lower.includes(k));
}

export type AnalysisInput = {
  income: number;
  expenseByCategory: { name: string; total: number }[];
  budgets: { categoryName: string; limit: number; spent: number }[];
  goalsMonthlyNeeded: number; // tổng số cần để dành mỗi tháng cho các mục tiêu
  allocation: { needs: number; wants: number; savings: number };
};

export type AnalysisResult = {
  income: number;
  totalExpense: number;
  savingsAmount: number;
  savingsRate: number; // % tiết kiệm (thu - chi) / thu
  needs: { actual: number; actualPct: number; target: number; targetPct: number; diff: number };
  wants: { actual: number; actualPct: number; target: number; targetPct: number; diff: number };
  savings: { actual: number; actualPct: number; target: number; targetPct: number; diff: number };
  overBudget: { categoryName: string; limit: number; spent: number; overBy: number }[];
  suggestions: string[];
  warnings: string[];
};

export function analyzeFinance(input: AnalysisInput): AnalysisResult {
  const { income, allocation } = input;
  const totalExpense = input.expenseByCategory.reduce((s, c) => s + c.total, 0);
  const savingsAmount = income - totalExpense;
  const savingsRate = income > 0 ? (savingsAmount / income) * 100 : 0;

  let needsActual = 0;
  for (const c of input.expenseByCategory) {
    if (isEssentialCategory(c.name)) needsActual += c.total;
  }
  const wantsActual = totalExpense - needsActual;

  const pct = (v: number) => (income > 0 ? (v / income) * 100 : 0);
  const needs = {
    actual: needsActual,
    actualPct: pct(needsActual),
    target: Math.round((income * allocation.needs) / 100),
    targetPct: allocation.needs,
    diff: needsActual - Math.round((income * allocation.needs) / 100),
  };
  const wants = {
    actual: wantsActual,
    actualPct: pct(wantsActual),
    target: Math.round((income * allocation.wants) / 100),
    targetPct: allocation.wants,
    diff: wantsActual - Math.round((income * allocation.wants) / 100),
  };
  const savings = {
    actual: savingsAmount,
    actualPct: pct(savingsAmount),
    target: Math.round((income * allocation.savings) / 100),
    targetPct: allocation.savings,
    diff: savingsAmount - Math.round((income * allocation.savings) / 100),
  };

  const overBudget = input.budgets
    .filter((b) => b.spent > b.limit)
    .map((b) => ({ categoryName: b.categoryName, limit: b.limit, spent: b.spent, overBy: b.spent - b.limit }));

  const suggestions: string[] = [];
  const warnings: string[] = [];

  if (income <= 0) {
    suggestions.push("Tháng này chưa ghi thu nhập. Hãy ghi thu nhập trước để phân tích và gợi ý chính xác hơn.");
  } else {
    if (needs.diff > 0) {
      suggestions.push(`Chi thiết yếu đang vượt gợi ý ${formatVNDShort(needs.diff)}. Xem lại các khoản ăn uống, đi chợ, nhà ở, đi lại để cắt phần chưa cần thiết.`);
    } else if (needs.actual > 0) {
      suggestions.push("Chi thiết yếu đang trong mức gợi ý. Giữ nguyên nhịp này là tốt.");
    }
    if (wants.diff > 0) {
      suggestions.push(`Chi linh hoạt đang vượt gợi ý ${formatVNDShort(wants.diff)}. Cân nhắc giảm mua sắm, ăn ngoài, giải trí trong phần còn lại của tháng.`);
    }
    if (savingsAmount < 0) {
      warnings.push(`Tháng này chi vượt thu ${formatVNDShort(-savingsAmount)}. Cần giảm chi linh hoạt ngay và tránh phát sinh thêm khoản chi lớn.`);
    } else if (savings.actualPct < allocation.savings) {
      suggestions.push(`Tỉ lệ tiết kiệm đang ${savings.actualPct.toFixed(0)}%, thấp hơn mục tiêu ${allocation.savings}%. Hãy chuyển ${formatVNDShort(savings.target - savingsAmount)} vào mục tiêu tiết kiệm ngay khi có thu nhập.`);
    } else {
      suggestions.push(`Tỉ lệ tiết kiệm đạt ${savings.actualPct.toFixed(0)}%, tốt hơn hoặc bằng mục tiêu ${allocation.savings}%. Có thể chuyển phần thừa vào mục tiêu dài hạn.`);
    }
  }

  if (overBudget.length > 0) {
    for (const b of overBudget) {
      warnings.push(`Danh mục "${b.categoryName}" đã vượt hạn mức ${formatVNDShort(b.overBy)}.`);
    }
  }

  if (input.goalsMonthlyNeeded > 0) {
    const avgRemaining = income > 0 ? savingsAmount : 0;
    if (avgRemaining < input.goalsMonthlyNeeded) {
      warnings.push(
        `Tổng số cần để dành cho mục tiêu là ${formatVNDShort(input.goalsMonthlyNeeded)}/tháng, nhưng tháng này chỉ còn ${formatVNDShort(Math.max(0, avgRemaining))}. Mục tiêu có nguy cơ trễ hạn — cân nhắc giảm chi linh hoạt hoặc dời hạn mục tiêu.`
      );
    } else {
      suggestions.push(`Số còn lại trong tháng đủ để dành ${formatVNDShort(input.goalsMonthlyNeeded)} cho các mục tiêu. Hãy ghi tiền vào mục tiêu sớm để không bị chi lố.`);
    }
  }

  // Top 2 danh mục chi nhiều nhất -> gợi ý cụ thể.
  const top = [...input.expenseByCategory].sort((a, b) => b.total - a.total).slice(0, 2);
  for (const t of top) {
    if (t.total > 0 && income > 0 && t.total / income > 0.25) {
      suggestions.push(`"${t.name}" chiếm ${( (t.total / income) * 100 ).toFixed(0)}% thu nhập — đây là khoản đáng rà soát đầu tiên nếu muốn tiết kiệm thêm.`);
    }
  }

  return { income, totalExpense, savingsAmount, savingsRate, needs, wants, savings, overBudget, suggestions, warnings };
}

function formatVNDShort(n: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Math.round(n));
}

/** Danh mục mặc định tiếng Việt khi tạo household mới. */
export const DEFAULT_CATEGORIES: { name: string; type: "INCOME" | "EXPENSE"; color: string }[] = [
  { name: "Lương", type: "INCOME", color: "#16a34a" },
  { name: "Thu nhập thêm", type: "INCOME", color: "#22c55e" },
  { name: "Bán hàng", type: "INCOME", color: "#059669" },
  { name: "Khác (Thu)", type: "INCOME", color: "#10b981" },
  { name: "Ăn uống", type: "EXPENSE", color: "#f97316" },
  { name: "Đi chợ", type: "EXPENSE", color: "#eab308" },
  { name: "Nhà ở", type: "EXPENSE", color: "#2563eb" },
  { name: "Điện nước", type: "EXPENSE", color: "#0ea5e9" },
  { name: "Đi lại", type: "EXPENSE", color: "#8b5cf6" },
  { name: "Con cái", type: "EXPENSE", color: "#ec4899" },
  { name: "Sức khỏe", type: "EXPENSE", color: "#ef4444" },
  { name: "Giáo dục", type: "EXPENSE", color: "#14b8a6" },
  { name: "Mua sắm", type: "EXPENSE", color: "#f43f5e" },
  { name: "Giải trí", type: "EXPENSE", color: "#a855f7" },
  { name: "Khác (Chi)", type: "EXPENSE", color: "#64748b" },
];

export const DEFAULT_WALLETS: { name: string; type: "CASH" | "BANK" | "CARD" | "GOLD" | "OTHER" }[] = [
  { name: "Tiền mặt", type: "CASH" },
  { name: "Ngân hàng", type: "BANK" },
];
