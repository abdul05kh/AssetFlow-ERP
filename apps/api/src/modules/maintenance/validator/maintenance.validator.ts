import { z } from "zod";

export const createMaintenanceSchema = z.object({
  assetId: z.string().uuid("Invalid asset ID"),
  description: z.string().min(5, "Description must be at least 5 characters").max(500, "Description cannot exceed 500 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

export const assignTechnicianSchema = z.object({
  technicianId: z.string().uuid("Invalid technician ID"),
});

export const resolveMaintenanceSchema = z.object({
  cost: z.number().min(0, "Cost cannot be negative").optional(),
  notes: z.string().max(300, "Notes cannot exceed 300 characters").nullable().optional(),
});

export const closeMaintenanceSchema = z.object({
  assetStatusAfterRepair: z.enum(["AVAILABLE", "RETIRED", "DISPOSED"]).default("AVAILABLE"),
  assetConditionAfterRepair: z.enum(["NEW", "GOOD", "FAIR", "POOR"]).default("GOOD"),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type AssignTechnicianInput = z.infer<typeof assignTechnicianSchema>;
export type ResolveMaintenanceInput = z.infer<typeof resolveMaintenanceSchema>;
export type CloseMaintenanceInput = z.infer<typeof closeMaintenanceSchema>;
