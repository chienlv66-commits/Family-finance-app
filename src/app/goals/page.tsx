"use client";
import { useEffect, useState } from "react";
import { formatVND, monthLabel, parseVND } from "@/lib/money";

type Goal = { id: string; name: string; targetAmount: number; savedAmount: number; deadlineMonth: string; note: string | null; progress: number; perMonth: number; monthsLeft: number; overdue: boolean };

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ name: "", targetAmount: "", deadlineMonth: "", note: "" });
  const [contrib, setContrib] = useState<Record<string, { amount: string; kind: "DEPOSIT" | "WITHDRAW" }>>({});

  async function load() { setLoading(true); const r = await fetch("/api/goals").then((x) => x.json()); setGoals(r.goals ?? []); setLoading(false); }
  useEffect(() => { load(); }, []);

  async function createGoal(e: React.FormEvent) {
    e.preventDefault();
    const targetAmount = parseVND(form.targetAmount);
    if (!form.name.trim() || !targetAmount || targetAmount <= 0 || !form.deadlineMonth) { setMsg("Vui lòng nhập đủ tên, số tiền mục tiêu và tháng hoàn thành."); return; }
    const res = await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, targetAmount, deadlineMonth: form.deadlineMonth, note: form.note || null }) });
    if (!res.ok) { setMsg((await res.json().catch(() => ({}))).error || "Tạo mục tiêu không thành công"); return; }
    setMsg("Đã tạo mục tiêu."); setForm({ name: "", targetAmount: "", deadlineMonth: "", note: "" }); load();
  }

  async function contribute(id: string) {
    const c = contrib[id] ?? { amount: "", kind: "DEPOSIT" };
    const amount = parseVND(c.amount);
    if (!amount || amount <= 0) { setMsg("Số tiền ghi vào / rút ra phải lớn hơn 0."); return; }
    const res = await fetch(`/api/goals/${id}/contribute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount, kind: c.kind }) });
    if (!res.ok) { setMsg((await res.json().catch(() => ({}))).error || "Ghi không thành công"); return; }
    setMsg("Đã ghi tiền vào mục tiêu."); setContrib({ ...contrib, [id]: { amount: "", kind: "DEPOSIT" } }); load();
  }

  async function remove(id: string) { if (!confirm("Xóa mục tiêu này?")) return; await fetch(`/api/goals/${id}`, { method: "DELETE" }); load(); }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Mục tiêu tiết kiệm</h1>
      <form onSubmit={createGoal} className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-semibold">Tạo mục tiêu mới</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tên mục tiêu (VD: Quỹ mua nhà)" className="rounded-lg border px-3 py-2" /><input value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder="Số tiền mục tiêu (VND)" inputMode="numeric" className="rounded-lg border px-3 py-2" /><input type="month" value={form.deadlineMonth} onChange={(e) => setForm({ ...form, deadlineMonth: e.target.value })} className="rounded-lg border px-3 py-2" /><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Ghi chú (tùy chọn)" className="rounded-lg border px-3 py-2" /></div>
        <button className="mt-3 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white">Tạo mục tiêu</button>{msg && <p className="mt-2 text-sm text-slate-600">{msg}</p>}</form>

      {loading ? <p className="rounded-xl bg-white p-6 text-slate-500">Đang tải…</p> : goals.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm"><p className="font-semibold">Chưa có mục tiêu nào</p><p className="mt-1 text-sm text-slate-500">Tạo mục tiêu với số tiền và tháng hoàn thành — app sẽ tự tính số cần để dành mỗi tháng.</p></div>
      ) : (
        <ul className="space-y-4">{goals.map((g) => (
          <li key={g.id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-2"><div><b>{g.name}</b><p className="text-sm text-slate-500">Hạn: {monthLabel(g.deadlineMonth)}{g.note ? ` • ${g.note}` : ""}</p></div><button onClick={() => remove(g.id)} className="text-sm text-red-600">Xóa</button></div>
            <p className="mt-2 text-sm">Đã tiết kiệm {formatVND(g.savedAmount)} / {formatVND(g.targetAmount)} — {g.progress.toFixed(0)}%</p>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-brand-600" style={{ width: `${Math.min(100, g.progress)}%` }} /></div>
            {g.savedAmount >= g.targetAmount ? <p className="mt-2 text-sm font-medium text-emerald-600">Đã đạt mục tiêu 🎉</p> : g.overdue ? <p className="mt-2 text-sm font-medium text-red-600">Đã quá hạn — còn thiếu {formatVND(g.targetAmount - g.savedAmount)}. Cân nhắc dời hạn hoặc tăng tiền để dành.</p> : <p className="mt-2 text-sm text-slate-600">Cần để dành <b>{formatVND(g.perMonth)}/tháng</b> trong {g.monthsLeft} tháng còn lại để kịp hạn.</p>}
            <div className="mt-3 flex flex-wrap gap-2"><input value={contrib[g.id]?.amount ?? ""} onChange={(e) => setContrib({ ...contrib, [g.id]: { amount: e.target.value, kind: contrib[g.id]?.kind ?? "DEPOSIT" } })} placeholder="Số tiền" inputMode="numeric" className="rounded-lg border px-3 py-2" /><select value={contrib[g.id]?.kind ?? "DEPOSIT"} onChange={(e) => setContrib({ ...contrib, [g.id]: { amount: contrib[g.id]?.amount ?? "", kind: e.target.value as "DEPOSIT" | "WITHDRAW" } })} className="rounded-lg border px-3 py-2"><option value="DEPOSIT">Ghi tiền vào</option><option value="WITHDRAW">Rút ra</option></select><button onClick={() => contribute(g.id)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Ghi</button></div></li>
        ))}</ul>
      )}
    </div>
  );
}
