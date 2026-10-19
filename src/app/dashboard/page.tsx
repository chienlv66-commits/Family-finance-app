"use client";
import { useEffect, useState } from "react";
import { formatVND, monthLabel, currentMonth, shiftMonth } from "@/lib/money";
import Link from "next/link";

type Dashboard = {
  month: string; income: number; expense: number; remaining: number; openingBalance: number; actualBalance: number;
  expenseByCategory: { name: string; total: number }[];
  last6: { month: string; income: number; expense: number }[];
};

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true); setError("");
    fetch(`/api/dashboard?month=${month}`).then(async (r) => {
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Không tải được dữ liệu");
      return r.json();
    }).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [month]);

  const maxBar = Math.max(1, ...(data?.last6 ?? []).map((x) => Math.max(x.income, x.expense)));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tổng quan</h1>
          <p className="text-sm text-slate-500">{monthLabel(month)} — Chuyển tháng để xem lại các tháng trước.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(shiftMonth(month, -1))} className="rounded-full border bg-white px-3 py-1.5 text-sm">← Tháng trước</button>
          <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold">{monthLabel(month)}</span>
          <button onClick={() => setMonth(shiftMonth(month, 1))} className="rounded-full border bg-white px-3 py-1.5 text-sm">Tháng sau →</button>
        </div>
      </div>

      {loading && <p className="rounded-xl bg-white p-6 text-slate-500">Đang tải…</p>}
      {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Số tiền thực tế hiện có</p><p className="mt-1 text-2xl font-bold text-brand-600">{formatVND(data.actualBalance)}</p><p className="mt-1 text-xs text-slate-500">Cộng dồn tất cả các tháng. Đầu {monthLabel(month)}: {formatVND(data.openingBalance)} — tháng này {data.remaining >= 0 ? "tăng" : "giảm"} {formatVND(Math.abs(data.remaining))}.</p></div>
            <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Tổng thu tháng này</p><p className="mt-1 text-2xl font-bold text-emerald-600">{formatVND(data.income)}</p></div>
            <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Tổng chi tháng này</p><p className="mt-1 text-2xl font-bold text-rose-600">{formatVND(data.expense)}</p></div>
            <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Còn lại tháng này</p><p className="mt-1 text-2xl font-bold">{formatVND(data.remaining)}</p><p className="mt-1 text-xs text-slate-500">Thu − Chi trong tháng đang xem.</p></div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Chi theo danh mục — {monthLabel(month)}</h2>
              {data.expenseByCategory.length === 0 ? <p className="mt-3 text-sm text-slate-500">Chưa có khoản chi nào trong tháng này. Hãy ghi khoản chi đầu tiên ở trang Giao dịch.</p> : (
                <ul className="mt-3 space-y-2">{data.expenseByCategory.sort((a, b) => b.total - a.total).map((c) => (
                  <li key={c.name}><div className="flex justify-between text-sm"><span>{c.name}</span><b>{formatVND(c.total)}</b></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-rose-500" style={{ width: `${data.expense ? Math.min(100, (c.total / data.expense) * 100) : 0}%` }} /></div></li>
                ))}</ul>
              )}
              <Link href="/transactions" className="mt-4 inline-block text-sm font-medium text-brand-600">Ghi khoản mới →</Link>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Thu – Chi 6 tháng gần đây</h2>
              {data.last6.every((x) => x.income === 0 && x.expense === 0) ? <p className="mt-3 text-sm text-slate-500">Chưa có dữ liệu 6 tháng gần đây.</p> : (
                <ul className="mt-3 space-y-3">{data.last6.map((x) => (
                  <li key={x.month}><p className="text-sm font-medium">{monthLabel(x.month)}</p><div className="mt-1 space-y-1"><div className="flex items-center gap-2 text-xs"><span className="w-10 text-slate-500">Thu</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500" style={{ width: `${(x.income / maxBar) * 100}%` }} /></div><span className="w-24 text-right">{formatVND(x.income)}</span></div><div className="flex items-center gap-2 text-xs"><span className="w-10 text-slate-500">Chi</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-rose-500" style={{ width: `${(x.expense / maxBar) * 100}%` }} /></div><span className="w-24 text-right">{formatVND(x.expense)}</span></div></div></li>
                ))}</ul>
              )}
              <div className="mt-4 flex gap-2 text-sm"><Link href="/analysis" className="text-brand-600 font-medium">Xem phân tích & gợi ý →</Link><Link href="/reports" className="text-brand-600 font-medium">Báo cáo →</Link></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
