"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const LINKS = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/transactions", label: "Giao dịch" },
  { href: "/budgets", label: "Ngân sách" },
  { href: "/goals", label: "Mục tiêu" },
  { href: "/analysis", label: "Phân tích" },
  { href: "/reports", label: "Báo cáo" },
  { href: "/settings", label: "Cài đặt" },
];

export default function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  if (pathname === "/login" || pathname === "/") return null;
  return (
    <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="mr-2 text-lg font-bold text-brand-600">💰 Gia Đình Tài Chính</Link>
        <nav className="flex flex-1 flex-wrap gap-1">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`rounded-full px-3 py-1.5 text-sm font-medium ${pathname.startsWith(l.href) ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {session?.user?.email && <span className="hidden max-w-[180px] truncate text-xs text-slate-500 sm:block">{session.user.email}</span>}
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-full border px-3 py-1.5 text-sm hover:bg-slate-50">Đăng xuất</button>
        </div>
      </div>
    </header>
  );
}
