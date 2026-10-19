"use client";
import { useEffect, useState } from "react";
import { formatVND, currentMonth, monthLabel, quarterRange } from "@/lib/money";

type Txn = { id: string; type: "INCOME" | "EXPENSE"; amount: number; date: string; note: string | null; isChildExpense: boolean; category: { name: string }; wallet: { name: string } | null };

export default function ReportsPage() {
  const [mode, setMode] = useState<"month" | "quarter">("month");
  const [month, setMonth] = useState(currentMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    if (mode === "month") {
      const r = await fetch(`/api/transactions?month=${month}`).then((x) => x.json());
      setTxns(r.transactions ?? []);
    } else {
      // Quý: lấy 3 tháng rồi gộp.
      const months: string[] = [];
      for (let i = 0; i < 3; i++) { const d = new Date(year, (quarter - 1) * 3 + i, 1); months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }
      const all: Txn[] = [];
      for (const m of months) { const r = await fetch(`/api/transactions?month=${m}`).then((x) => x.json()); all.push(...(r.transactions ?? [])); }
      setTxns(all);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, [mode, month, year, quarter]); // eslint-disable-line

  const income = txns.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const childExpense = txns.filter((t) => t.type === "EXPENSE" && t.isChildExpense).reduce((s, t) => s + t.amount, 0);
  const byCat = new Map<string, number>();
  for (const t of txns.filter((x) => x.type === "EXPENSE")) byCat.set(t.category.name, (byCat.get(t.category.name) ?? 0) + t.amount);

  const exportUrl = mode === "month" ? `/api/export?month=${month}` : `/api/export?year=${year}&quarter=${quarter}`;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Báo cáo tháng / quý</h1>
      <div className="flex flex-wrap items-center gap-2">
        <select value={mode} onChange={(e) => setMode(e.target.value as "month" | "quarter")} className="rounded-full border bg-white px-3 py-1.5 text-sm"><option value="month">Theo tháng</option><option value="quarter">Theo quý</option></select>
        {mode === "month" ? <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-full border bg-white px-3 py-1.5 text-sm" /> : (
          <><input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-24 rounded-full border bg-white px-3 py-1.5 text-sm" /><select value={quarter} onChange={(e) => setQuarter(Number(e.target.value))} className="rounded-full border bg-white px-3 py-1.5 text-sm"><option value={1}>Quý 1</option><option value={2}>Quý 2</option><option value={3}>Quý 3</option><option value={4}>Quý 4</option></select></>
        )}
        <a href={exportUrl} className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white">Xuất CSV</a>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Tổng thu</p><p className="text-xl font-bold text-emerald-600">{formatVND(income)}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Tổng chi</p><p className="text-xl font-bold text-rose-600">{formatVND(expense)}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Còn lại</p><p className="text-xl font-bold">{formatVND(income - expense)}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Chi phí con cái</p><p className="text-xl font-bold">{formatVND(childExpense)}</p></div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-semibold">Chi theo danh mục</h2>
        {loading ? <p className="mt-2 text-sm text-slate-500">Đang tải…</p> : byCat.size === 0 ? <p className="mt-2 text-sm text-slate-500">Chưa có khoản chi nào trong kỳ này.</p> : (
          <ul className="mt-3 space-y-2">{[...byCat.entries()].sort((a, b) => b[1] - a[1]).map(([name, total]) => (<li key={name} className="flex justify-between text-sm"><span>{name}</span><b>{formatVND(total)}</b></li>))}</ul>
        )}
        <p className="mt-3 text-xs text-slate-500">Kỳ báo cáo: {mode === "month" ? monthLabel(month) : `Quý ${quarter}/${year}`}. Số giao dịch: {txns.length}.</p>
      </div>
    </div>
  );
}
