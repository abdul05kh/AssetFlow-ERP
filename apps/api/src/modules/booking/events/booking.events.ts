import eventBus from "../../../events/event-bus";
import { prisma } from "../../../config/db";
import logger from "../../../utils/logger";

export const registerBookingEvents = () => {
  eventBus.subscribe("BookingRequested", async (data: {
    bookingId: string;
    resourceId: string;
    resourceTag: string;
    employeeId: string;
    employeeName: string;
    startTime: Date;
    endTime: Date;
  }) => {
    try {
      await prisma.activityLog.create({
        data: {
          userId: data.employeeId,
          action: "BOOKING_REQUEST",
          targetType: "Asset",
          targetId: data.resourceId,
          currentState: "RESERVED",
          remarks: `Resource ${data.resourceTag} reservation requested by ${data.employeeName} from ${data.startTime.toISOString()} to ${data.endTime.toISOString()}. Booking ID: ${data.bookingId}`,
        },
      });
      logger.info(`[BookingEvents] Activity log written for booking request: ${data.resourceTag}`);
    } catch (err) {
      logger.error("[BookingEvents] Failed to write booking request log", err);
    }
  });

  eventBus.subscribe("BookingApproved", async (data: {
    bookingId: string;
    resourceId: string;
    resourceTag: string;
    employeeId: string;
    employeeName: string;
    startTime: Date;
    endTime: Date;
  }) => {
    try {
      await prisma.activityLog.create({
        data: {
          userId: data.employeeId,
          action: "BOOKING_CONFIRM",
          targetType: "Asset",
          targetId: data.resourceId,
          currentState: "RESERVED",
          remarks: `Resource ${data.resourceTag} reservation CONFIRMED for ${data.employeeName} from ${data.startTime.toISOString()} to ${data.endTime.toISOString()}. Booking ID: ${data.bookingId}`,
        },
      });
      logger.info(`[BookingEvents] Activity log written for booking confirmation: ${data.resourceTag}`);
    } catch (err) {
      logger.error("[BookingEvents] Failed to write booking confirm log", err);
    }
  });
};
