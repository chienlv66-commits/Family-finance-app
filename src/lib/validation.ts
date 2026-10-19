import { z } from "zod";

export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Tháng phải dạng YYYY-MM");

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().int("Số tiền phải là số nguyên").positive("Số tiền phải lớn hơn 0").max(1_000_000_000_000, "Số tiền quá lớn"),
  date: z.string().min(1, "Vui lòng chọn ngày"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  walletId: z.string().optional().nullable(),
  note: z.string().max(500, "Ghi chú tối đa 500 ký tự").optional().nullable(),
  isChildExpense: z.boolean().optional().default(false),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên danh mục").max(100),
  type: z.enum(["INCOME", "EXPENSE"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Màu không hợp lệ").optional().default("#2563eb"),
});

export const walletSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên ví").max(100),
  type: z.enum(["CASH", "BANK", "CARD", "GOLD", "OTHER"]).default("CASH"),
  initialBalance: z.number().int().min(-1_000_000_000_000).max(1_000_000_000_000).default(0),
});

export const budgetSchema = z.object({
  categoryId: z.string().min(1),
  month: monthSchema,
  limit: z.number().int().min(0, "Hạn mức không được âm").max(1_000_000_000_000),
});

export const goalSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên mục tiêu").max(200),
  targetAmount: z.number().int().positive("Số tiền mục tiêu phải lớn hơn 0"),
  deadlineMonth: monthSchema,
  note: z.string().max(500).optional().nullable(),
});

export const goalContributionSchema = z.object({
  amount: z.number().int().positive("Số tiền phải lớn hơn 0"),
  kind: z.enum(["DEPOSIT", "WITHDRAW"]),
  note: z.string().max(500).optional().nullable(),
});

export const allocationSchema = z
  .object({
    needs: z.number().int().min(0).max(100),
    wants: z.number().int().min(0).max(100),
    savings: z.number().int().min(0).max(100),
  })
  .refine((v) => v.needs + v.wants + v.savings === 100, { message: "Tổng tỉ lệ phải bằng 100%" });

export const householdSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên hộ gia đình").max(200),
});

export const inviteSchema = z.object({
  email: z.string().email("Email Gmail không hợp lệ").transform((s) => s.trim().toLowerCase()),
});

export function toErrorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function zodErrorMessage(e: z.ZodError): string {
  return e.errors.map((x) => x.message).join("; ");
}
