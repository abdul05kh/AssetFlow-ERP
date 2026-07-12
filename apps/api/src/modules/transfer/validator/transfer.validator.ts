import { z } from "zod";

export const requestTransferSchema = z.object({
  assetId: z.string().uuid("Invalid asset ID"),
  targetHolderId: z.string().uuid("Invalid target holder ID"),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(200, "Reason cannot exceed 200 characters"),
});

export const approveTransferSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type RequestTransferInput = z.infer<typeof requestTransferSchema>;
export type ApproveTransferInput = z.infer<typeof approveTransferSchema>;
