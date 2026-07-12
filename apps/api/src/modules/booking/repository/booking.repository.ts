import { prisma } from "../../../config/db";
import { CreateBookingInput } from "../validator/booking.validator";
import { BusinessRuleError } from "../../../utils/errors";

export class BookingRepository {
  async create(data: CreateBookingInput & { employeeId: string }) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch asset details
      const asset = await tx.asset.findUnique({
        where: { id: data.resourceId },
      });

      if (!asset) {
        throw new BusinessRuleError("Target resource does not exist", "RESOURCE_NOT_FOUND");
      }

      // Check if asset is marked as shared resource
      if (!asset.sharedResource) {
        throw new BusinessRuleError(
          `Asset ${asset.tag} is not registered as a shared resource and cannot be reserved`,
          "BOOKING_001"
        );
      }

      // Validate asset is not retired/disposed/lost
      if (["RETIRED", "DISPOSED", "LOST"].includes(asset.status)) {
        throw new BusinessRuleError(
          `Asset ${asset.tag} cannot be booked because it is ${asset.status}`,
          "BOOKING_003"
        );
      }

      const start = new Date(data.startTime);
      const end = new Date(data.endTime);

      // 2. Check for overlaps: StartA < EndB and EndA > StartB
      const overlapping = await tx.resourceBooking.findFirst({
        where: {
          resourceId: data.resourceId,
          status: { in: ["REQUESTED", "CONFIRMED", "ONGOING"] },
          startTime: { lt: end },
          endTime: { gt: start },
        },
      });

      if (overlapping) {
        throw new BusinessRuleError(
          `Resource booking overlap detected. The slot from ${start.toISOString()} to ${end.toISOString()} is already reserved`,
          "BOOKING_002"
        );
      }

      // 3. Insert reservation record
      const booking = await tx.resourceBooking.create({
        data: {
          resourceId: data.resourceId,
          employeeId: data.employeeId,
          startTime: start,
          endTime: end,
          purpose: data.purpose,
          status: "REQUESTED",
        },
        include: {
          resource: true,
          employee: true,
        },
      });

      return booking;
    });
  }

  async findById(id: string) {
    return prisma.resourceBooking.findUnique({
      where: { id },
      include: {
        resource: true,
        employee: true,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return prisma.resourceBooking.update({
      where: { id },
      data: { status },
      include: {
        resource: true,
        employee: true,
      },
    });
  }

  async list(params: {
    page: number;
    limit: number;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
    resourceId?: string;
    employeeId?: string;
    status?: string;
  }) {
    const { page, limit, search, sort, order, resourceId, employeeId, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (resourceId) where.resourceId = resourceId;

    if (search) {
      where.OR = [
        { resource: { name: { contains: search } } },
        { resource: { tag: { contains: search } } },
        { employee: { name: { contains: search } } },
        { purpose: { contains: search } },
      ];
    }

    const orderBy: any = {};
    if (sort) {
      orderBy[sort] = order || "asc";
    } else {
      orderBy.startTime = "asc";
    }

    const [items, totalCount] = await Promise.all([
      prisma.resourceBooking.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          resource: true,
          employee: true,
        },
      }),
      prisma.resourceBooking.count({ where }),
    ]);

    return {
      items,
      totalCount,
    };
  }
}

export const bookingRepository = new BookingRepository();
export default bookingRepository;
