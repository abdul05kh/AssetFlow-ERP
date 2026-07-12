import { z } from "zod";

export const createDepartmentSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters").max(10, "Code cannot exceed 10 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
  parentDepartmentId: z.string().uuid().nullable().optional(),
  departmentHeadId: z.string().uuid().nullable().optional(),
  description: z.string().max(200, "Description cannot exceed 200 characters").nullable().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters").optional(),
  parentDepartmentId: z.string().uuid().nullable().optional(),
  departmentHeadId: z.string().uuid().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  description: z.string().max(200, "Description cannot exceed 200 characters").nullable().optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
