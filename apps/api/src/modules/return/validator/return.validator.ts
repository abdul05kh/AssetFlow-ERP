import { z } from "zod";

export const returnAssetSchema = z.object({
  assetId: z.string().uuid("Invalid asset ID"),
  conditionOnReturn: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]),
  notes: z.string().max(200, "Notes cannot exceed 200 characters").nullable().optional(),
});

export type ReturnAssetInput = z.infer<typeof returnAssetSchema>;
