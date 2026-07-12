import { z } from "zod";

export const createBookingSchema = z.object({
  resourceId: z.string().uuid("Invalid resource ID"),
  startTime: z.string().datetime("Start time must be a valid ISO datetime"),
  endTime: z.string().datetime("End time must be a valid ISO datetime"),
  purpose: z.string().min(5, "Purpose must be at least 5 characters").max(200, "Purpose cannot exceed 200 characters"),
}).refine((data) => {
  return new Date(data.endTime).getTime() > new Date(data.startTime).getTime();
}, {
  message: "End time must be after start time",
  path: ["endTime"],
}).refine((data) => {
  // Allow a 1-minute grace buffer for system clock offsets
  return new Date(data.startTime).getTime() > Date.now() - 60000;
}, {
  message: "Start time must be in the future",
  path: ["startTime"],
});

export const approveBookingSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ApproveBookingInput = z.infer<typeof approveBookingSchema>;
