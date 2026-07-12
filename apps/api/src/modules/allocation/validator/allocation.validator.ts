import { z } from "zod";

export const createAllocationSchema = z.object({
  assetId: z.string().uuid("Invalid asset ID"),
  employeeId: z.string().uuid("Invalid employee ID").nullable().optional(),
  departmentId: z.string().uuid("Invalid department ID").nullable().optional(),
  expectedReturnDate: z.string().datetime("Expected return date must be a valid ISO datetime").nullable().optional(),
  notes: z.string().max(200, "Notes cannot exceed 200 characters").nullable().optional(),
}).refine((data) => {
  const hasEmployee = !!data.employeeId;
  const hasDepartment = !!data.departmentId;
  return (hasEmployee || hasDepartment) && !(hasEmployee && hasDepartment);
}, {
  message: "Allocation must target either an employee OR a department, but not both",
  path: ["employeeId"],
});

export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;
