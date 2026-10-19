"use client";
import { useEffect, useState } from "react";
import { formatVND, currentMonth, shiftMonth, monthLabel } from "@/lib/money";

type Analysis = {
  income: number; totalExpense: number; savingsAmount: number; savingsRate: number;
  needs: { actual: number; actualPct: number; target: number; targetPct: number };
  wants: { actual: number; actualPct: number; target: number; targetPct: number };
  savings: { actual: number; actualPct: number; target: number; targetPct: number };
  suggestions: string[]; warnings: string[];
};

export default function AnalysisPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<{ analysis: Analysis; goalsMonthlyNeeded: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true); setError("");
    fetch(`/api/analysis?month=${month}`).then(async (r) => { if (!r.ok) throw new Error("Không tải được phân tích"); return r.json(); }).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [month]);

  async function applySuggestions() {
    if (!data) return;
    // Áp dụng hạn mức gợi ý cho 3 nhóm lớn: dùng API budgets với danh mục tương ứng nếu có.
    // Đơn giản: thông báo hướng dẫn — người dùng đặt hạn mức ở trang Ngân sách.
    alert("Hạn mức gợi ý theo tỉ lệ đã hiển thị ở dưới. Hãy vào trang Ngân sách để đặt hạn mức cho từng danh mục.");
  }

  const a = data?.analysis;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Phân tích & gợi ý chi tiêu</h1>
        <div className="flex gap-2"><button onClick={() => setMonth(shiftMonth(month, -1))} className="rounded-full border bg-white px-3 py-1.5 text-sm">← Tháng trước</button><span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold">{monthLabel(month)}</span><button onClick={() => setMonth(shiftMonth(month, 1))} className="rounded-full border bg-white px-3 py-1.5 text-sm">Tháng sau →</button></div></div>
      <p className="text-sm text-slate-500">Gợi ý tính theo thu nhập thật trong tháng và tỉ lệ phân bổ (mặc định 50/30/20, đổi được trong Cài đặt). Không dùng AI bên ngoài — toàn bộ tính toán rule-based trong app.</p>
      {loading && <p className="rounded-xl bg-white p-6 text-slate-500">Đang tải…</p>}
      {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {a && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Thu nhập tháng</p><p className="text-xl font-bold">{formatVND(a.income)}</p><p className="mt-1 text-xs text-slate-500">Tổng chi: {formatVND(a.totalExpense)} • Tiết kiệm: {formatVND(a.savingsAmount)} ({a.savingsRate.toFixed(0)}%)</p></div>
            <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Cần để dành cho mục tiêu</p><p className="text-xl font-bold">{formatVND(data?.goalsMonthlyNeeded ?? 0)}/tháng</p><p className="mt-1 text-xs text-slate-500">Tổng các mục tiêu đang theo dõi.</p></div>
            <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Tỉ lệ tiết kiệm</p><p className="text-xl font-bold">{a.savingsRate.toFixed(0)}%</p><p className="mt-1 text-xs text-slate-500">Mục tiêu tiết kiệm: {a.savings.targetPct}% thu nhập.</p></div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-semibold">Đối chiếu với tỉ lệ phân bổ</h2>
            {[{ label: "Chi thiết yếu (Needs)", v: a.needs }, { label: "Chi linh hoạt (Wants)", v: a.wants }, { label: "Tiết kiệm (Savings)", v: a.savings }].map((row) => (
              <div key={row.label} className="mt-3"><div className="flex justify-between text-sm"><span>{row.label}</span><span>Thực tế {formatVND(row.v.actual)} ({row.v.actualPct.toFixed(0)}%) • Gợi ý {formatVND(row.v.target)} ({row.v.targetPct}%)</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-brand-600" style={{ width: `${Math.min(100, row.v.actualPct)}%` }} /></div></div>
            ))}
            <button onClick={applySuggestions} className="mt-4 rounded-xl border px-4 py-2 text-sm font-medium">Cách áp dụng hạn mức gợi ý</button>
          </div>
          {a.warnings.length > 0 && <div className="rounded-2xl bg-red-50 p-5"><h2 className="font-semibold text-red-800">⚠️ Cảnh báo</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">{a.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></div>}
          <div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-semibold">Gợi ý chi tiêu</h2>{a.suggestions.length === 0 ? <p className="mt-2 text-sm text-slate-500">Chưa có gợi ý — hãy ghi thêm thu / chi trong tháng này.</p> : <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">{a.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>}</div>
        </>
      )}
    </div>
  );
}
