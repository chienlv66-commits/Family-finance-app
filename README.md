# Gia Đình Tài Chính — App Ghi Chép Chi Tiêu & Thu Nhập Gia Đình

App dành riêng cho **vợ chồng hoặc cá nhân**. Chỉ đăng nhập bằng **Gmail (Google)** mới dùng được.
Mỗi tài khoản có dữ liệu riêng theo hộ gia đình (Household). Một người tạo hộ, mời vợ/chồng bằng email Gmail để dùng chung dữ liệu.

## Tính năng

- **Dashboard tháng:** tổng thu, tổng chi, còn lại, **số tiền thực tế hiện có** (cộng dồn tất cả các tháng), số dư đầu tháng, chi theo danh mục, thu–chi 6 tháng gần đây.
- **Giao dịch:** thêm / sửa / xóa thu–chi (VND, số nguyên — không lỗi thập phân), chọn danh mục, ví, ngày, ghi chú, đánh dấu **chi phí con cái**, lọc Thu/Chi, tìm theo ghi chú, nhóm theo ngày, chuyển tháng.
- **Danh mục & Ví:** thêm / xóa danh mục (mặc định tiếng Việt: Lương, Ăn uống, Đi chợ, Nhà ở, Điện nước, Đi lại, Con cái…), ví Tiền mặt / Ngân hàng / Thẻ / Vàng / Khác với số dư ban đầu + số dư thực tế.
- **Ngân sách:** đặt hạn mức theo danh mục + tháng, thanh tiến độ, cảnh báo khi vượt / sắp vượt.
- **Mục tiêu tiết kiệm:** tên, số tiền mục tiêu, tháng hoàn thành; app tự tính **số cần để dành mỗi tháng** để kịp hạn; ghi tiền vào / rút ra; cảnh báo quá hạn / nguy cơ trễ.
- **Phân tích & gợi ý chi tiêu:** đối chiếu chi thiết yếu / linh hoạt / tiết kiệm với tỉ lệ phân bổ (mặc định 50/30/20, tùy chỉnh trong Cài đặt) theo thu nhập thật; gợi ý + cảnh báo **rule-based, không cần API key AI**.
- **Báo cáo tháng / quý:** tổng thu, tổng chi, còn lại, chi phí con cái, chi theo danh mục, **xuất CSV**.
- **Hộ gia đình:** tạo hộ, mời vợ/chồng bằng Gmail (chỉ Owner mời được), người được mời đăng nhập Gmail đó rồi bấm Chấp nhận trong Cài đặt. Chỉ Owner/Member của hộ mới thấy dữ liệu hộ đó (kiểm tra ở mọi API).

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS, UI tiếng Việt
- Auth: NextAuth.js (Auth.js v4) — **chỉ Google Provider**, chặn truy cập khi chưa đăng nhập (middleware)
- Database: Prisma + PostgreSQL (tương thích Neon / Supabase / Vercel Postgres)
- Validation: Zod (mọi API)
- Tiền VND: lưu số nguyên (đồng), không dùng float

## Cấu trúc

```
family-finance-app/
├── prisma/schema.prisma      # User, Household, HouseholdMember, Wallet, Category, Transaction, Budget, Goal, GoalContribution, AllocationSetting
├── prisma/seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/login/     # Trang đăng nhập Gmail
│   │   ├── dashboard/         # Tổng quan tháng
│   │   ├── transactions/      # Giao dịch
│   │   ├── budgets/           # Ngân sách
│   │   ├── goals/             # Mục tiêu
│   │   ├── analysis/          # Phân tích 50/30/20 + gợi ý
│   │   ├── reports/           # Báo cáo tháng/quý + xuất CSV
│   │   ├── settings/          # Hộ gia đình, mời vợ/chồng, tỉ lệ, danh mục, ví
│   │   └── api/               # REST API: auth, dashboard, transactions, categories, wallets, budgets, goals, household, settings, analysis, export
│   ├── components/            # Nav, Providers
│   ├── lib/                   # auth, prisma, household, household-setup, money, validation, analysis
│   └── middleware.ts          # Chặn route chưa đăng nhập
├── .env.example
├── vercel.json
└── README.md
```

## 1. Chạy local

```bash
cd family-finance-app
cp .env.example .env
# Điền .env (xem mục 2 + 3)
npm install
npx prisma migrate dev --name init   # hoặc: npx prisma db push
npm run dev
# Mở http://localhost:3000 -> Đăng nhập bằng Gmail
```

> Lưu ý: `npm run build` tự chạy `prisma generate` trước khi build. Không cần DB thật để build, nhưng để chạy app thì cần `DATABASE_URL` hợp lệ.

## 2. Tạo Google OAuth Client (đăng nhập bằng Gmail)

1. Vào [Google Cloud Console](https://console.cloud.google.com/) → tạo Project mới (ví dụ `family-finance`).
2. **APIs & Services → OAuth consent screen:**
   - User type: **External**
   - App name: `Gia Đình Tài Chính`, User support email: email của Luu
   - Scopes: `openid`, `email`, `profile` (mặc định của Google Provider)
   - Test users: thêm Gmail của Luu + Gmail vợ/chồng (khi app còn ở chế độ Testing, chỉ test users mới đăng nhập được).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID:**
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://<ten-mien-vercel-cua-luu>.vercel.app`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://<ten-mien-vercel-cua-luu>.vercel.app/api/auth/callback/google`
4. Copy **Client ID** → `GOOGLE_CLIENT_ID`, **Client secret** → `GOOGLE_CLIENT_SECRET` trong `.env` / Vercel Env Vars.
5. Sinh `NEXTAUTH_SECRET`: `openssl rand -base64 32` (mỗi môi trường 1 secret riêng, không dùng chung).

## 3. Tạo Database PostgreSQL

Chọn 1 trong 3 (đều tương thích Prisma):

### Option A — Neon (khuyên dùng, miễn phí, nhanh nhất)
1. Vào [neon.tech](https://neon.tech) → tạo Project → tạo Database (ví dụ `family_finance`).
2. Copy connection string dạng `postgresql://...@ep-xxx...neon.tech/family_finance?sslmode=require` → `DATABASE_URL`.
3. Chạy: `npx prisma migrate dev --name init` (local) hoặc `npx prisma db push` (lần đầu trên Vercel cũng được, xem mục 5).

### Option B — Supabase
1. Tạo Project tại [supabase.com](https://supabase.com) → Settings → Database → copy **Connection string** (dùng `?pgbouncer=true` nếu dùng pooler, hoặc connection trực tiếp port 5432 cho migrate).
2. `DATABASE_URL` = connection string đó.

### Option C — Vercel Postgres (Storage)
1. Trong Vercel Dashboard → Project → **Storage → Create → Postgres** → tạo database → chọn **Connect**.
2. Vercel tự thêm `DATABASE_URL` (và `POSTGRES_*`) vào Env Vars của project. Dùng giá trị `DATABASE_URL` đó.
3. Vercel Postgres hiện dùng Neon bên dưới — connection string cũng dạng `postgresql://...`.

Sau khi có `DATABASE_URL`, tạo bảng:

```bash
npx prisma migrate dev --name init
# Nếu migrate dev gặp lỗi trên môi trường deploy, dùng:
npx prisma db push
```

## 4. Đẩy lên GitHub

```bash
cd family-finance-app
git init
git add .
git commit -m "feat: family finance app — Next.js + Google Auth + Prisma"
git branch -M main
git remote add origin https://github.com/<ten-tai-khoan>/<ten-repo>.git
git push -u origin main
```

Kiểm tra trước khi push: `.env` **không** được commit (đã có trong `.gitignore`). Chỉ commit `.env.example`. Không hardcode secret trong code.

## 5. Deploy lên Vercel

### Cách 1 — Import từ GitHub (khuyên dùng)
1. Vào [vercel.com](https://vercel.com) → **Add New → Project → Import** repo GitHub vừa push.
2. Framework: Vercel tự nhận **Next.js**. Root Directory: để mặc định (repo này chính là root của app).
3. **Environment Variables** — thêm đủ 5 biến:
   | Biến | Giá trị |
   |---|---|
   | `DATABASE_URL` | Connection string PostgreSQL (Neon/Supabase/Vercel Postgres) |
   | `NEXTAUTH_SECRET` | Chuỗi ngẫu nhiên (`openssl rand -base64 32`) |
   | `NEXTAUTH_URL` | `https://<ten-mien-vercel>.vercel.app` |
   | `GOOGLE_CLIENT_ID` | Từ Google Cloud Console |
   | `GOOGLE_CLIENT_SECRET` | Từ Google Cloud Console |
4. Bấm **Deploy**.
5. Sau khi deploy xong, quay lại Google Cloud Console → bổ sung Authorized redirect URI với domain Vercel thật: `https://<domain>.vercel.app/api/auth/callback/google`.
6. Mở domain → Đăng nhập bằng Gmail → dùng thử.

### Cách 2 — Vercel CLI
```bash
npm i -g vercel
vercel        # làm theo hướng dẫn, chọn project
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel --prod
```

### Migrate DB trên môi trường deploy
Nếu chưa chạy migrate ở local:
```bash
DATABASE_URL="<connection-string>" npx prisma migrate deploy
# hoặc
DATABASE_URL="<connection-string>" npx prisma db push
```

## 6. Cách mời vợ/chồng dùng chung

1. Luu đăng nhập bằng Gmail của mình → app tự tạo hộ gia đình riêng.
2. Vào **Cài đặt** → mục **Hộ gia đình** → nhập **email Gmail của vợ/chồng** → **Mời vào hộ gia đình**.
3. Vợ/chồng mở app → **Đăng nhập bằng Gmail** (đúng email vừa được mời) → vào **Cài đặt** → thấy lời mời → bấm **Chấp nhận**.
4. Từ lúc đó, cả 2 thấy chung: giao dịch, ngân sách, mục tiêu, ví, phân tích. Dùng 1 mình vẫn được — không bắt buộc mời.

## Bảo mật — những gì đã làm

- Middleware + mọi API đều yêu cầu session (chưa đăng nhập → 401 / redirect `/login`).
- Chỉ Google Provider — không có đăng nhập mật khẩu, không có tài khoản ẩn danh.
- Mọi API kiểm tra `categoryId / walletId / budget / goal` phải thuộc household của user (trả 403 nếu không).
- Chỉ Owner mới mời / thu hồi thành viên; chỉ đúng email được mời mới chấp nhận được.
- Zod validate mọi input API; tiền VND lưu `Int`.
- Không commit `.env`, không hardcode secret.

## Lệnh hay dùng

```bash
npm run dev          # chạy local
npm run build        # prisma generate + next build
npm run start        # chạy bản production
npx prisma studio    # mở giao diện xem DB
npx prisma migrate dev --name <ten>   # tạo migration mới sau khi sửa schema
```

## Giới hạn hiện tại (chưa làm trong bản này)

- Chưa có gửi email/Telegram khi mời (người được mời cần tự mở app để thấy lời mời trong Cài đặt).
- Chưa có upload biên lai lên Drive, chưa có vay / vàng định giá theo giá thị trường (ví chỉ lưu số dư VND).
- Gợi ý chi tiêu là rule-based, không gọi API AI bên ngoài.
