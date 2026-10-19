import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Gia Đình Tài Chính — Ghi chép chi tiêu & thu nhập",
  description: "App ghi chép chi tiêu và thu nhập gia đình, dành cho vợ chồng hoặc cá nhân. Đăng nhập bằng Gmail.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>
          <Nav />
          <main className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
