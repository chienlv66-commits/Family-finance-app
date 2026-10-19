"use client";
import { useEffect, useState } from "react";
import { formatVND, currentMonth, shiftMonth, monthLabel, parseVND } from "@/lib/money";

type Cat = { id: string; name: string; type: string };
type Budget = { id: string; categoryId: string; limit: number; spent: number; category: Cat };

export default function BudgetsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [cats, setCats] = useState<Cat[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ categoryId: "", limit: "" });

  async function load() {
    const [c, b] = await Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch(`/api/budgets?month=${month}`).then((r) => r.json()),
    ]);
    setCats((c.categories ?? []).filter((x: Cat) => x.type === "EXPENSE"));
    setBudgets(b.budgets ?? []);
  }
  useEffect(() => { load(); }, [month]); // eslint-disable-line

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const limit = parseVND(form.limit);
    if (!form.categoryId || limit === null || limit < 0) { setMsg("Vui lòng chọn danh mục và nhập hạn mức hợp lệ."); return; }
    const res = await fetch("/api/budgets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId: form.categoryId, month, limit }) });
    if (!res.ok) { setMsg((await res.json().catch(() => ({}))).error || "Lưu không thành công"); return; }
    setMsg("Đã lưu hạn mức."); setForm({ categoryId: "", limit: "" }); load();
  }
  async function remove(id: string) { if (!confirm("Xóa hạn mức này?")) return; await fetch(`/api/budgets/${id}`, { method: "DELETE" }); load(); }
  async function applySuggestion(limit: number, categoryId: string) {
    await fetch("/api/budgets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId, month, limit }) });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Ngân sách</h1>
        <div className="flex gap-2"><button onClick={() => setMonth(shiftMonth(month, -1))} className="rounded-full border bg-white px-3 py-1.5 text-sm">← Tháng trước</button><span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold">{monthLabel(month)}</span><button onClick={() => setMonth(shiftMonth(month, 1))} className="rounded-full border bg-white px-3 py-1.5 text-sm">Tháng sau →</button></div></div>
      <form onSubmit={submit} className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-semibold">Đặt hạn mức cho {monthLabel(month)}</h2>
        <div className="mt-3 flex flex-wrap gap-2"><select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="rounded-lg border px-3 py-2"><option value="">— Chọn danh mục chi —</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} placeholder="Hạn mức (VND)" inputMode="numeric" className="rounded-lg border px-3 py-2" /><button className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white">Lưu hạn mức</button></div>{msg && <p className="mt-2 text-sm text-slate-600">{msg}</p>}</form>
      {budgets.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center shadow-sm"><p className="font-semibold">Chưa đặt hạn mức nào cho {monthLabel(month)}</p><p className="mt-1 text-sm text-slate-500">Đặt hạn mức theo từng danh mục để app cảnh báo khi sắp vượt.</p></div> : (
        <ul className="space-y-3">{budgets.map((b) => { const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0; const over = b.spent > b.limit; return (
          <li key={b.id} className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex justify-between gap-2"><b>{b.category.name}</b><button onClick={() => remove(b.id)} className="text-sm text-red-600">Xóa</button></div><p className="mt-1 text-sm text-slate-600">Đã chi {formatVND(b.spent)} / Hạn mức {formatVND(b.limit)} — {pct.toFixed(0)}%</p><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${over ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, pct)}%` }} /></div>{over && <p className="mt-2 text-sm font-medium text-red-600">Đã vượt ngân sách {formatVND(b.spent - b.limit)}.</p>}{pct > 80 && !over && <p className="mt-2 text-sm text-amber-600">Sắp vượt hạn mức — hãy cân nhắc giảm chi danh mục này.</p>}</li>); })}</ul>
      )}
      <p className="text-sm text-slate-500">Gợi ý: vào trang Phân tích để xem hạn mức gợi ý theo thu nhập thật, rồi áp dụng nhanh vào ngân sách.</p>
    </div>
  );
}
