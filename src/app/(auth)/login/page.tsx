"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function LoginForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const errorParam = searchParams.get("error");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      await signIn("google", { callbackUrl });
    } catch {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        <p className="mt-4 text-sm text-slate-500">Đang kiểm tra phiên đăng nhập...</p>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-800">Đã đăng nhập thành công!</p>
        <p className="mt-1 text-xs text-slate-500">{session?.user?.email}</p>
        <p className="mt-4 text-xs text-brand-600 animate-pulse">Đang chuyển tiếp vào hệ thống...</p>
        <a
          href={callbackUrl}
          className="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-brand-700"
        >
          Bấm vào đây nếu không tự chuyển →
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl shadow-sm">
          💰
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          Gia Đình Tài Chính
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sổ tay quản lý chi tiêu & thu nhập dành cho vợ chồng và gia đình
        </p>
      </div>

      {errorParam && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
          <div className="flex items-center gap-2 font-medium">
            <svg className="h-4 w-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Đăng nhập chưa hoàn tất</span>
          </div>
          <p className="mt-1 text-red-600">
            {errorParam === "AccessDenied"
              ? "Tài khoản của bạn chưa được cấp quyền đăng nhập thử nghiệm trên Google Cloud Console."
              : "Có lỗi kết nối trong quá trình đăng nhập. Vui lòng bấm thử lại."}
          </p>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 active:scale-[0.99] disabled:opacity-60"
        >
          {isSubmitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          ) : (
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{isSubmitting ? "Đang kết nối Google..." : "Đăng nhập bằng Gmail (Google)"}</span>
        </button>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-3.5">
        <div className="flex items-start gap-2">
          <svg className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-700">Tự động ghi nhớ đăng nhập:</strong> Sau khi đăng nhập, hệ thống sẽ lưu phiên của bạn. Các lần sau mở app bạn sẽ vào thẳng trang mà không cần chọn lại tài khoản.
          </p>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Dữ liệu tài chính được phân quyền riêng biệt theo từng hộ gia đình.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto mt-10 max-w-md rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-100">
      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Đang tải...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
