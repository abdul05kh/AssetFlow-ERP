import { bookingRepository } from "../repository/booking.repository";
import { CreateBookingInput, ApproveBookingInput } from "../validator/booking.validator";
import { NotFoundError, BusinessRuleError, ForbiddenError } from "../../../utils/errors";
import { prisma } from "../../../config/db";
import eventBus from "../../../events/event-bus";
import logger from "../../../utils/logger";

export class BookingService {
  async book(input: CreateBookingInput, employeeId: string) {
    // 1. Verify employee exists and is active
    const user = await prisma.user.findUnique({
      where: { id: employeeId },
    });
    if (!user || user.status !== "ACTIVE") {
      throw new BusinessRuleError("Employee does not exist or is inactive", "USER_002");
    }

    // 2. Enforce reservation duration boundaries (e.g., max 24 hours)
    const start = new Date(input.startTime);
    const end = new Date(input.endTime);
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    const maxDurationSetting = await prisma.systemSetting.findUnique({
      where: { key: "max_booking_hours" },
    });
    const maxHours = maxDurationSetting ? parseInt(maxDurationSetting.value, 10) : 24;

    if (diffHours > maxHours) {
      throw new BusinessRuleError(
        `Reservation block length (${diffHours.toFixed(1)} hours) exceeds maximum allowed duration limit (${maxHours} hours)`,
        "BOOKING_004"
      );
    }

    // 3. Create booking inside transaction
    const booking = await bookingRepository.create({
      ...input,
      employeeId,
    });

    // 4. Publish request event
    eventBus.publish("BookingRequested", {
      bookingId: booking.id,
      resourceId: booking.resourceId,
      resourceTag: booking.resource.tag,
      employeeId: booking.employeeId,
      employeeName: booking.employee.name,
      startTime: booking.startTime,
      endTime: booking.endTime,
    });

    logger.info(`[Booking] New reservation request: ${booking.resource.tag} by ${booking.employee.name}`);

    return booking;
  }

  async getById(id: string) {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError("Booking record not found");
    }
    return booking;
  }

  async approve(id: string, input: ApproveBookingInput, operatorRole: string, operatorId: string) {
    const booking = await this.getById(id);

    // Only DEPT_HEAD or ASSET_MANAGER can approve/decline (transition to CONFIRMED)
    if (input.status === "CONFIRMED" && !["ADMIN", "ASSET_MANAGER", "DEPT_HEAD"].includes(operatorRole)) {
      throw new ForbiddenError("Only department managers or inventory administrators can approve bookings");
    }

    // Employee can only cancel their own booking before ongoing
    if (input.status === "CANCELLED" && booking.employeeId !== operatorId && !["ADMIN", "ASSET_MANAGER", "DEPT_HEAD"].includes(operatorRole)) {
      throw new ForbiddenError("You are not authorized to cancel this booking");
    }

    if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
      throw new BusinessRuleError(`Cannot update booking status. Current status: ${booking.status}`, "BOOKING_005");
    }

    const updated = await bookingRepository.updateStatus(id, input.status);

    if (input.status === "CONFIRMED") {
      eventBus.publish("BookingApproved", {
        bookingId: updated.id,
        resourceId: updated.resourceId,
        resourceTag: updated.resource.tag,
        employeeId: updated.employeeId,
        employeeName: updated.employee.name,
        startTime: updated.startTime,
        endTime: updated.endTime,
      });
      logger.info(`[Booking] Reservation approved: ${updated.resource.tag} for ${updated.employee.name}`);
    }

    return updated;
  }

  async list(query: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: string;
    resourceId?: string;
    employeeId?: string;
    status?: string;
  }) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "10", 10);
    const search = query.search;
    const sort = query.sort;
    const order = query.order === "desc" ? "desc" : "asc";
    const resourceId = query.resourceId;
    const employeeId = query.employeeId;
    const status = query.status;

    return bookingRepository.list({
      page,
      limit,
      search,
      sort,
      order,
      resourceId,
      employeeId,
      status,
    });
  }
}

export const bookingService = new BookingService();
export default bookingService;
