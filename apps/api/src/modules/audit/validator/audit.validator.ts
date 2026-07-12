import { z } from "zod";

export const createAuditSchema = z.object({
  name: z.string().min(3, "Audit name must be at least 3 characters").max(100, "Audit name cannot exceed 100 characters"),
  departmentId: z.string().uuid("Invalid department ID"),
  location: z.string().min(2, "Location must be provided"),
  startDate: z.string().datetime("Start date must be a valid ISO datetime"),
  endDate: z.string().datetime("End date must be a valid ISO datetime"),
  auditorId: z.string().uuid("Invalid auditor user ID"),
}).refine((data) => {
  return new Date(data.endDate).getTime() > new Date(data.startDate).getTime();
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const verifyAuditItemSchema = z.object({
  status: z.enum(["VERIFIED", "MISSING", "DAMAGED"]),
  discrepancyNotes: z.string().max(200, "Discrepancy notes cannot exceed 200 characters").nullable().optional(),
});

export type CreateAuditInput = z.infer<typeof createAuditSchema>;
export type VerifyAuditItemInput = z.infer<typeof verifyAuditItemSchema>;
