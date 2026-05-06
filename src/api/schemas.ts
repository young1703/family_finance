import { z } from "zod";
import type { infer as ZodInfer } from "zod";

export const currencyCodeSchema = z
  .string()
  .trim()
  .length(3)
  .transform((v) => v.toUpperCase());

export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const householdCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  baseCurrencyCode: currencyCodeSchema.default("KRW")
});

export const memberInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "editor", "viewer"]).default("viewer")
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  parentCategoryId: z.string().uuid().optional()
});

export const nodeCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  nodeType: z.enum(["income", "account", "saving", "expense", "subscription", "custom"]),
  categoryId: z.string().uuid().optional(),
  currencyCode: currencyCodeSchema,
  currentBalance: z.number().finite().default(0),
  monthlyInflow: z.number().finite().default(0),
  posX: z.number().finite().optional(),
  posY: z.number().finite().optional()
});

export const nodePositionSchema = z.object({
  posX: z.number().finite(),
  posY: z.number().finite()
});

export const flowCreateSchema = z
  .object({
    fromNodeId: z.string().uuid(),
    toNodeId: z.string().uuid(),
    amount: z.number().nonnegative(),
    currencyCode: currencyCodeSchema,
    cycle: z.enum(["monthly", "weekly", "daily", "once"]),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    autoTransfer: z.boolean().default(false),
    startDate: z.string().date(),
    endDate: z.string().date().optional(),
    note: z.string().max(500).optional()
  })
  .superRefine((v, ctx) => {
    const fromNodeId = v.fromNodeId as string;
    const toNodeId = v.toNodeId as string;
    const endDate = v.endDate as string | undefined;
    const startDate = v.startDate as string;
    const cycle = v.cycle as string;
    const dayOfMonth = v.dayOfMonth as number | undefined;

    if (fromNodeId === toNodeId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "fromNodeId and toNodeId must differ" });
    }
    if (endDate && endDate < startDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "endDate must be after startDate" });
    }
    if (cycle === "monthly" && !dayOfMonth) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "dayOfMonth is required for monthly flows" });
    }
  });

export const dashboardQuerySchema = z.object({
  month: monthSchema
});

export const fxQuerySchema = z.object({
  base: currencyCodeSchema,
  quote: currencyCodeSchema
});

export type HouseholdCreateInput = ZodInfer<typeof householdCreateSchema>;
export type MemberInviteInput = ZodInfer<typeof memberInviteSchema>;
export type CategoryCreateInput = ZodInfer<typeof categoryCreateSchema>;
export type NodeCreateInput = ZodInfer<typeof nodeCreateSchema>;
export type NodePositionInput = ZodInfer<typeof nodePositionSchema>;
export type FlowCreateInput = ZodInfer<typeof flowCreateSchema>;
