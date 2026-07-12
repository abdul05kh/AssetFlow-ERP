import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").default("Password123"),
  phone: z.string().max(20, "Phone cannot exceed 20 characters").nullable().optional(),
  designation: z.string().max(50, "Designation cannot exceed 50 characters").nullable().optional(),
  departmentId: z.string().uuid("Invalid department identifier"),
  roleCode: z.string().min(2, "Role code must be provided"),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters").optional(),
  phone: z.string().max(20, "Phone cannot exceed 20 characters").nullable().optional(),
  designation: z.string().max(50, "Designation cannot exceed 50 characters").nullable().optional(),
  departmentId: z.string().uuid("Invalid department identifier").optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const promoteUserSchema = z.object({
  roleCode: z.string().min(2, "Role code is required"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type PromoteUserInput = z.infer<typeof promoteUserSchema>;
