import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters").max(50, "Category name cannot exceed 50 characters"),
  description: z.string().max(200, "Description cannot exceed 200 characters").nullable().optional(),
  sharedResource: z.boolean().default(false),
  defaultMaintenanceInterval: z.number().int().min(1, "Maintenance interval must be at least 1 day").default(30),
});

export const createAssetSchema = z.object({
  name: z.string().min(2, "Asset name must be at least 2 characters").max(100, "Asset name cannot exceed 100 characters"),
  serialNumber: z.string().max(50, "Serial number cannot exceed 50 characters").nullable().optional(),
  categoryId: z.string().uuid("Invalid category ID"),
  departmentId: z.string().uuid("Invalid department ID"),
  acquisitionDate: z.string().datetime("Acquisition date must be a valid ISO datetime"),
  acquisitionCost: z.number().min(0, "Acquisition cost cannot be negative"),
  currentLocation: z.string().min(2, "Current location must be provided"),
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]).default("NEW"),
  sharedResource: z.boolean().default(false),
  warrantyExpiry: z.string().datetime("Warranty expiry date must be a valid ISO datetime").nullable().optional(),
  description: z.string().max(500, "Description cannot exceed 500 characters").nullable().optional(),
  images: z.array(z.string().url("Invalid image URL")).optional(),
});

export const updateAssetSchema = z.object({
  name: z.string().min(2, "Asset name must be at least 2 characters").max(100, "Asset name cannot exceed 100 characters").optional(),
  serialNumber: z.string().max(50, "Serial number cannot exceed 50 characters").nullable().optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  departmentId: z.string().uuid("Invalid department ID").optional(),
  acquisitionDate: z.string().datetime("Acquisition date must be a valid ISO datetime").optional(),
  acquisitionCost: z.number().min(0, "Acquisition cost cannot be negative").optional(),
  currentLocation: z.string().min(2, "Current location must be provided").optional(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]).optional(),
  status: z.enum(["AVAILABLE", "ALLOCATED", "RESERVED", "UNDER_MAINTENANCE", "LOST", "RETIRED", "DISPOSED"]).optional(),
  warrantyExpiry: z.string().datetime("Warranty expiry date must be a valid ISO datetime").nullable().optional(),
  description: z.string().max(500, "Description cannot exceed 500 characters").nullable().optional(),
  images: z.array(z.string().url("Invalid image URL")).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
