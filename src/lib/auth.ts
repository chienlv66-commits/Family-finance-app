import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { ensureHouseholdForUser } from "./household-setup";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 60 * 24 * 60 * 60, // Ghi nhớ đăng nhập trong 60 ngày
    updateAge: 24 * 60 * 60, // Tự động gia hạn thêm mỗi ngày khi bạn mở app
  },
  providers: [
    // Chỉ cho phép đăng nhập bằng Gmail (Google). Không có Credentials, không có provider khác.
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = (token.id as string) ?? (token.sub as string);
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        try {
          await ensureHouseholdForUser(user.id, user.name);
        } catch (e) {
          console.error("Lỗi khởi tạo household cho user:", e);
        }
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
