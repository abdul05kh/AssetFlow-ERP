import { prisma, TransactionClient } from "../../../config/db";
import { CreateMaintenanceInput, ResolveMaintenanceInput, CloseMaintenanceInput } from "../validator/maintenance.validator";
import { Decimal } from "@prisma/client/runtime/library";

export class MaintenanceRepository {
  async create(data: CreateMaintenanceInput & { requestedById: string }) {
    return prisma.maintenanceRequest.create({
      data: {
        assetId: data.assetId,
        requestedById: data.requestedById,
        description: data.description,
        priority: data.priority || "MEDIUM",
        status: "PENDING",
      },
      include: {
        asset: true,
        requestedBy: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        asset: true,
        requestedBy: true,
        technician: true,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return prisma.maintenanceRequest.update({
      where: { id },
      data: { status },
      include: {
        asset: true,
        requestedBy: true,
        technician: true,
      },
    });
  }

  async assignTechnician(id: string, technicianId: string) {
    return prisma.maintenanceRequest.update({
      where: { id },
      data: {
        technicianId,
        status: "TECHNICIAN_ASSIGNED",
      },
      include: {
        asset: true,
        requestedBy: true,
        technician: true,
      },
    });
  }

  async resolve(id: string, data: ResolveMaintenanceInput) {
    const costVal = data.cost !== undefined ? new Decimal(data.cost) : null;
    return prisma.maintenanceRequest.update({
      where: { id },
      data: {
        cost: costVal,
        notes: data.notes || null,
        resolvedAt: new Date(),
        status: "RESOLVED",
      },
      include: {
        asset: true,
        requestedBy: true,
        technician: true,
      },
    });
  }

  async close(id: string, data: CloseMaintenanceInput) {
    return prisma.$transaction(async (tx: TransactionClient) => {
      const request = await tx.maintenanceRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw new Error("Maintenance request not found");
      }

      // 1. Close maintenance ticket
      const updatedRequest = await tx.maintenanceRequest.update({
        where: { id },
        data: { status: "CLOSED" },
        include: {
          asset: true,
          requestedBy: true,
          technician: true,
        },
      });

      // 2. Restore asset status and condition after repair
      await tx.asset.update({
        where: { id: request.assetId },
        data: {
          status: data.assetStatusAfterRepair,
          condition: data.assetConditionAfterRepair,
        },
      });

      return updatedRequest;
    });
  }

  async list(params: {
    page: number;
    limit: number;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
    assetId?: string;
    requestedById?: string;
    technicianId?: string;
    status?: string;
    priority?: string;
  }) {
    const { page, limit, search, sort, order, assetId, requestedById, technicianId, status, priority } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assetId) where.assetId = assetId;
    if (requestedById) where.requestedById = requestedById;
    if (technicianId) where.technicianId = technicianId;

    if (search) {
      where.OR = [
        { asset: { name: { contains: search } } },
        { asset: { tag: { contains: search } } },
        { description: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const orderBy: any = {};
    if (sort) {
      orderBy[sort] = order || "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [items, totalCount] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          asset: true,
          requestedBy: true,
          technician: true,
        },
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);

    return {
      items,
      totalCount,
    };
  }
}

export const maintenanceRepository = new MaintenanceRepository();
export default maintenanceRepository;
