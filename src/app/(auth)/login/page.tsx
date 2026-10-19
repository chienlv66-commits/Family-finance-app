"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => { if (status === "authenticated") router.replace("/dashboard"); }, [status, router]);
  return (
    <main className="mx-auto mt-16 max-w-md rounded-2xl border bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold">Gia Đình Tài Chính</h1>
      <p className="mt-2 text-sm text-slate-600">App ghi chép chi tiêu & thu nhập dành riêng cho vợ chồng hoặc cá nhân. Chỉ đăng nhập bằng Gmail (Google) mới dùng được — dữ liệu của mỗi tài khoản / hộ gia đình là riêng tư.</p>
      <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="mt-6 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700">
        Đăng nhập bằng Gmail (Google)
      </button>
      {status === "authenticated" && (
        <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-center">
          <p className="text-sm font-medium text-emerald-800">
            Đã đăng nhập: {session?.user?.email}
          </p>
          <a
            href="/dashboard"
            className="mt-3 inline-block w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Vào Bảng Điều Khiển (Dashboard) →
          </a>
        </div>
      )}
    </main>
  );
}
