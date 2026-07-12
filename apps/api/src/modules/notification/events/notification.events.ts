import eventBus from "../../../events/event-bus";
import { notificationService } from "../service/notification.service";
import logger from "../../../utils/logger";

export const registerNotificationEvents = () => {
  // Asset Allocated
  eventBus.subscribe("AssetAllocated", async (data: {
    allocationId: string;
    assetId: string;
    assetTag: string;
    employeeId?: string | null;
    departmentId?: string | null;
    employeeName?: string | null;
    departmentName?: string | null;
  }) => {
    if (data.employeeId) {
      try {
        await notificationService.createAndSend({
          userId: data.employeeId,
          message: `The physical asset ${data.assetTag} has been assigned to you. Allocation ID: ${data.allocationId}`,
          eventType: "ALLOCATION",
          referenceId: data.allocationId,
        });
        logger.info(`[NotificationEvents] Dispatched allocation notice for: ${data.assetTag}`);
      } catch (err) {
        logger.error("[NotificationEvents] Failed to send allocation notice", err);
      }
    }
  });

  // Booking Approved
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
      await notificationService.createAndSend({
        userId: data.employeeId,
        message: `Your reservation request for ${data.resourceTag} has been approved from ${data.startTime.toISOString()} to ${data.endTime.toISOString()}. Booking ID: ${data.bookingId}`,
        eventType: "RESERVATION",
        referenceId: data.bookingId,
      });
      logger.info(`[NotificationEvents] Dispatched booking confirmation notice for: ${data.resourceTag}`);
    } catch (err) {
      logger.error("[NotificationEvents] Failed to send booking notice", err);
    }
  });

  // Transfer Approved
  eventBus.subscribe("TransferApproved", async (data: {
    transferId: string;
    assetId: string;
    assetTag: string;
    currentHolderId: string;
    targetHolderId: string;
    currentHolderName: string;
    targetHolderName: string;
  }) => {
    try {
      // Notify target holder
      await notificationService.createAndSend({
        userId: data.targetHolderId,
        message: `Asset ${data.assetTag} transfer ownership has been approved. You are now the active holder of this asset. Transfer ID: ${data.transferId}`,
        eventType: "TRANSFER",
        referenceId: data.transferId,
      });

      // Notify current holder
      await notificationService.createAndSend({
        userId: data.currentHolderId,
        message: `Asset ${data.assetTag} has been successfully handed over to ${data.targetHolderName}. Transfer ID: ${data.transferId}`,
        eventType: "TRANSFER",
        referenceId: data.transferId,
      });

      logger.info(`[NotificationEvents] Dispatched transfer confirmation notices for: ${data.assetTag}`);
    } catch (err) {
      logger.error("[NotificationEvents] Failed to send transfer notices", err);
    }
  });
};
