"use client";
import { useEffect, useState } from "react";
import { formatVND, currentMonth, shiftMonth, monthLabel, parseVND } from "@/lib/money";

type Cat = { id: string; name: string; type: "INCOME" | "EXPENSE"; color: string };
type Wallet = { id: string; name: string; type: string; balance: number };
type Txn = { id: string; type: "INCOME" | "EXPENSE"; amount: number; date: string; note: string | null; isChildExpense: boolean; category: Cat; wallet: Wallet | null };

export default function TransactionsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [filter, setFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [q, setQ] = useState("");
  const [txns, setTxns] = useState<Txn[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "EXPENSE" as "INCOME" | "EXPENSE", amount: "", date: new Date().toISOString().slice(0, 10), categoryId: "", walletId: "", note: "", isChildExpense: false });

  async function load() {
    setLoading(true);
    const [t, c, w] = await Promise.all([
      fetch(`/api/transactions?month=${month}${filter !== "ALL" ? `&type=${filter}` : ""}&q=${encodeURIComponent(q)}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/wallets").then((r) => r.json()),
    ]);
    setTxns(t.transactions ?? []); setCats(c.categories ?? []); setWallets(w.wallets ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [month, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit(t: Txn) {
    setEditingId(t.id);
    setForm({ type: t.type, amount: String(t.amount), date: t.date.slice(0, 10), categoryId: t.category.id, walletId: t.wallet?.id ?? "", note: t.note ?? "", isChildExpense: t.isChildExpense });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function resetForm() { setEditingId(null); setForm({ type: "EXPENSE", amount: "", date: new Date().toISOString().slice(0, 10), categoryId: "", walletId: "", note: "", isChildExpense: false }); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const amount = parseVND(form.amount);
    if (!amount || amount <= 0) { setMsg("Số tiền phải lớn hơn 0."); return; }
    if (!form.categoryId) { setMsg("Vui lòng chọn danh mục."); return; }
    const body = { type: form.type, amount, date: form.date, categoryId: form.categoryId, walletId: form.walletId || null, note: form.note || null, isChildExpense: form.isChildExpense };
    const res = await fetch(editingId ? `/api/transactions/${editingId}` : "/api/transactions", { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { setMsg((await res.json().catch(() => ({}))).error || "Lưu không thành công"); return; }
    setMsg(editingId ? "Đã cập nhật giao dịch." : "Đã ghi giao dịch mới.");
    resetForm(); load();
  }

  async function remove(id: string) {
    if (!confirm("Xóa giao dịch này?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (!res.ok) setMsg("Xóa không thành công"); else { setMsg("Đã xóa giao dịch."); load(); }
  }

  const catsForType = cats.filter((c) => c.type === form.type);
  // Nhóm theo ngày
  const grouped = new Map<string, Txn[]>();
  for (const t of txns) { const d = t.date.slice(0, 10); grouped.set(d, [...(grouped.get(d) ?? []), t]); }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Giao dịch</h1>
      <form onSubmit={submit} className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">{editingId ? "Sửa giao dịch" : "Ghi khoản mới"}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">Loại<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "INCOME" | "EXPENSE", categoryId: "" })} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="EXPENSE">Chi</option><option value="INCOME">Thu</option></select></label>
          <label className="text-sm">Số tiền (VND)<input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Ví dụ: 200000" inputMode="numeric" className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm">Ngày<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm">Danh mục<select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">— Chọn danh mục —</option>{catsForType.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="text-sm">Ví<select value={form.walletId} onChange={(e) => setForm({ ...form, walletId: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">— Không chọn ví —</option>{wallets.map((w) => <option key={w.id} value={w.id}>{w.name} ({formatVND(w.balance)})</option>)}</select></label>
          <label className="text-sm">Ghi chú<input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Ví dụ: Đi chợ tuần" className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isChildExpense} onChange={(e) => setForm({ ...form, isChildExpense: e.target.checked })} /> Đây là chi phí con cái</label>
        <div className="mt-4 flex gap-2"><button className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white">{editingId ? "Lưu thay đổi" : "Ghi khoản"}</button>{editingId && <button type="button" onClick={resetForm} className="rounded-xl border px-4 py-2">Hủy sửa</button>}</div>
        {msg && <p className="mt-2 text-sm text-slate-600">{msg}</p>}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setMonth(shiftMonth(month, -1))} className="rounded-full border bg-white px-3 py-1.5 text-sm">← Tháng trước</button>
        <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold">{monthLabel(month)}</span>
        <button onClick={() => setMonth(shiftMonth(month, 1))} className="rounded-full border bg-white px-3 py-1.5 text-sm">Tháng sau →</button>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="rounded-full border bg-white px-3 py-1.5 text-sm"><option value="ALL">Tất cả</option><option value="INCOME">Chỉ thu</option><option value="EXPENSE">Chỉ chi</option></select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo ghi chú…" className="rounded-full border bg-white px-3 py-1.5 text-sm" />
        <button onClick={() => load()} className="rounded-full bg-slate-900 px-3 py-1.5 text-sm text-white">Tìm</button>
      </div>

      {loading ? <p className="rounded-xl bg-white p-6 text-slate-500">Đang tải…</p> : txns.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm"><p className="font-semibold">Chưa có giao dịch nào trong tháng này</p><p className="mt-1 text-sm text-slate-500">Hãy ghi khoản thu / chi đầu tiên ở mẫu phía trên.</p></div>
      ) : (
        <div className="space-y-4">{[...grouped.entries()].map(([date, list]) => (
          <div key={date} className="rounded-2xl bg-white p-4 shadow-sm"><p className="font-semibold">{new Date(date + "T00:00:00").toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</p>
            <ul className="mt-2 divide-y">{list.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 py-2"><div><p className="font-medium">{t.category.name}{t.isChildExpense ? " • Con cái" : ""}</p><p className="text-xs text-slate-500">{t.note || "—"}{t.wallet ? ` • ${t.wallet.name}` : ""}</p></div><div className="flex items-center gap-2"><span className={`font-bold ${t.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}>{t.type === "INCOME" ? "+" : "−"}{formatVND(t.amount)}</span><button onClick={() => startEdit(t)} className="rounded-full border px-2 py-1 text-xs">Sửa</button><button onClick={() => remove(t.id)} className="rounded-full border px-2 py-1 text-xs text-red-600">Xóa</button></div></li>
            ))}</ul></div>
        ))}</div>
      )}
    </div>
  );
}
