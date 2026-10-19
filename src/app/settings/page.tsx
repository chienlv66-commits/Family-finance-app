"use client";
import { useEffect, useState } from "react";
import { formatVND, parseVND } from "@/lib/money";

type Member = { id: string; role: string; status: string; invitedEmail: string | null; user: { name: string | null; email: string | null } | null };
type Cat = { id: string; name: string; type: string };
type Wallet = { id: string; name: string; type: string; balance: number; initialBalance: number };

export default function SettingsPage() {
  const [household, setHousehold] = useState<{ id: string; name: string; ownerId: string } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<{ id: string; household: { name: string } }[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [alloc, setAlloc] = useState({ needs: 50, wants: 30, savings: 20 });
  const [msg, setMsg] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [newCat, setNewCat] = useState({ name: "", type: "EXPENSE" as "INCOME" | "EXPENSE" });
  const [newWallet, setNewWallet] = useState({ name: "", type: "CASH" as "CASH" | "BANK" | "CARD" | "GOLD" | "OTHER", initialBalance: "" });

  async function load() {
    const [h, c, w, a, inv] = await Promise.all([
      fetch("/api/household").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/wallets").then((r) => r.json()),
      fetch("/api/settings/allocation").then((r) => r.json()),
      fetch("/api/household/accept").then((r) => r.json()),
    ]);
    setHousehold(h.household); setMembers(h.members ?? []);
    setCats(c.categories ?? []); setWallets(w.wallets ?? []);
    if (a.allocation) setAlloc(a.allocation);
    setInvites(inv.invites ?? []);
  }
  useEffect(() => { load(); }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/household/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: inviteEmail }) });
    setMsg(res.ok ? `Đã gửi lời mời đến ${inviteEmail}. Người được mời đăng nhập bằng Gmail đó rồi bấm Chấp nhận trong Cài đặt.` : (await res.json().catch(() => ({}))).error || "Mời không thành công");
    setInviteEmail(""); load();
  }
  async function acceptInvite(id: string) { const res = await fetch("/api/household/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inviteId: id }) }); setMsg(res.ok ? "Đã tham gia hộ gia đình." : "Chấp nhận không thành công"); load(); }
  async function saveAlloc(e: React.FormEvent) {
    e.preventDefault();
    if (alloc.needs + alloc.wants + alloc.savings !== 100) { setMsg("Tổng tỉ lệ phải bằng 100%."); return; }
    const res = await fetch("/api/settings/allocation", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(alloc) });
    setMsg(res.ok ? "Đã lưu tỉ lệ phân bổ." : (await res.json().catch(() => ({}))).error || "Lưu không thành công");
  }
  async function addCat(e: React.FormEvent) {
    e.preventDefault(); if (!newCat.name.trim()) return;
    await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCat.name.trim(), type: newCat.type }) });
    setNewCat({ name: "", type: "EXPENSE" }); load();
  }
  async function delCat(id: string) { if (!confirm("Xóa danh mục này?")) return; const r = await fetch(`/api/categories/${id}`, { method: "DELETE" }); if (!r.ok) setMsg((await r.json().catch(() => ({}))).error || "Xóa không thành công"); load(); }
  async function addWallet(e: React.FormEvent) {
    e.preventDefault(); if (!newWallet.name.trim()) return;
    await fetch("/api/wallets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newWallet.name.trim(), type: newWallet.type, initialBalance: parseVND(newWallet.initialBalance) ?? 0 }) });
    setNewWallet({ name: "", type: "CASH", initialBalance: "" }); load();
  }
  async function delWallet(id: string) { if (!confirm("Xóa ví này? Các giao dịch của ví sẽ giữ lại nhưng không còn gắn ví.")) return; await fetch(`/api/wallets/${id}`, { method: "DELETE" }); load(); }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Cài đặt</h1>
      {msg && <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{msg}</p>}

      {invites.length > 0 && <div className="rounded-2xl bg-amber-50 p-5"><h2 className="font-semibold">Lời mời tham gia hộ gia đình</h2>{invites.map((inv) => <div key={inv.id} className="mt-2 flex items-center justify-between"><span className="text-sm">Bạn được mời vào “{inv.household.name}”.</span><button onClick={() => acceptInvite(inv.id)} className="rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white">Chấp nhận</button></div>)}</div>}

      <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-semibold">Hộ gia đình — {household?.name ?? "…"}</h2><p className="mt-1 text-sm text-slate-500">Mỗi tài khoản có dữ liệu riêng theo hộ gia đình. Chỉ owner / member của hộ mới thấy dữ liệu của hộ đó.</p>
        <ul className="mt-3 divide-y">{members.map((m) => <li key={m.id} className="py-2 text-sm flex justify-between"><span>{m.user?.name ?? m.invitedEmail ?? "—"} {m.user?.email ? `(${m.user.email})` : ""}</span><span className="text-slate-500">{m.role === "OWNER" ? "Chủ hộ" : "Thành viên"} • {m.status === "ACCEPTED" ? "Đã tham gia" : "Chờ chấp nhận"}</span></li>)}</ul>
        <form onSubmit={invite} className="mt-3 flex flex-wrap gap-2"><input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Email Gmail của vợ/chồng (VD: vochong@gmail.com)" type="email" className="min-w-[260px] flex-1 rounded-lg border px-3 py-2" /><button className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Mời vào hộ gia đình</button></form>
        <p className="mt-2 text-xs text-slate-500">Người được mời đăng nhập bằng Gmail đó, vào Cài đặt → bấm Chấp nhận là dùng chung dữ liệu ngay.</p>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-semibold">Tỉ lệ phân bổ thu nhập (50/30/20 tùy chỉnh)</h2>
        <form onSubmit={saveAlloc} className="mt-3 grid gap-3 sm:grid-cols-3"><label className="text-sm">Thiết yếu (%)<input type="number" value={alloc.needs} onChange={(e) => setAlloc({ ...alloc, needs: Number(e.target.value) })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label><label className="text-sm">Linh hoạt (%)<input type="number" value={alloc.wants} onChange={(e) => setAlloc({ ...alloc, wants: Number(e.target.value) })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label><label className="text-sm">Tiết kiệm (%)<input type="number" value={alloc.savings} onChange={(e) => setAlloc({ ...alloc, savings: Number(e.target.value) })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label></form>
        <p className="mt-2 text-sm text-slate-500">Tổng hiện tại: {alloc.needs + alloc.wants + alloc.savings}% — phải bằng 100%.</p>
        <button onClick={saveAlloc} className="mt-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Lưu tỉ lệ</button>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-semibold">Danh mục</h2>
        <form onSubmit={addCat} className="mt-3 flex flex-wrap gap-2"><input value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} placeholder="Tên danh mục mới" className="rounded-lg border px-3 py-2" /><select value={newCat.type} onChange={(e) => setNewCat({ ...newCat, type: e.target.value as "INCOME" | "EXPENSE" })} className="rounded-lg border px-3 py-2"><option value="EXPENSE">Chi</option><option value="INCOME">Thu</option></select><button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Thêm</button></form>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">{cats.map((c) => <li key={c.id} className="flex justify-between rounded-lg border px-3 py-2 text-sm"><span>{c.name} • {c.type === "INCOME" ? "Thu" : "Chi"}</span><button onClick={() => delCat(c.id)} className="text-red-600">Xóa</button></li>)}</ul>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-semibold">Ví tiền</h2>
        <form onSubmit={addWallet} className="mt-3 flex flex-wrap gap-2"><input value={newWallet.name} onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })} placeholder="Tên ví (VD: Vietcombank)" className="rounded-lg border px-3 py-2" /><select value={newWallet.type} onChange={(e) => setNewWallet({ ...newWallet, type: e.target.value as typeof newWallet.type })} className="rounded-lg border px-3 py-2"><option value="CASH">Tiền mặt</option><option value="BANK">Ngân hàng</option><option value="CARD">Thẻ</option><option value="GOLD">Vàng</option><option value="OTHER">Khác</option></select><input value={newWallet.initialBalance} onChange={(e) => setNewWallet({ ...newWallet, initialBalance: e.target.value })} placeholder="Số dư ban đầu (VND)" inputMode="numeric" className="rounded-lg border px-3 py-2" /><button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Thêm ví</button></form>
        <ul className="mt-3 space-y-2">{wallets.map((w) => <li key={w.id} className="flex justify-between rounded-lg border px-3 py-2 text-sm"><span>{w.name} • Số dư thực tế: <b>{formatVND(w.balance)}</b></span><button onClick={() => delWallet(w.id)} className="text-red-600">Xóa</button></li>)}</ul>
        <p className="mt-2 text-xs text-slate-500">Số dư ví = số dư ban đầu + tổng giao dịch của ví đó.</p>
      </section>
    </div>
  );
}
