import { prisma, TransactionClient } from "../../../config/db";
import { CreateAllocationInput } from "../validator/allocation.validator";
import { BusinessRuleError } from "../../../utils/errors";

export class AllocationRepository {
  async create(data: CreateAllocationInput) {
    return prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Atomically lock and update asset status to ALLOCATED if it is currently AVAILABLE
      const updatedAsset = await tx.asset.updateMany({
        where: { id: data.assetId, status: "AVAILABLE" },
        data: { status: "ALLOCATED" },
      });

      if (updatedAsset.count === 0) {
        // Fallback read for precise business rule errors
        const asset = await tx.asset.findUnique({ where: { id: data.assetId } });
        if (!asset) {
          throw new BusinessRuleError("Target asset does not exist", "ASSET_NOT_FOUND");
        }
        throw new BusinessRuleError(
          `Asset ${asset.tag} cannot be allocated. Current status: ${asset.status}`,
          "ASSET_002"
        );
      }

      // 2. Insert allocation record
      const allocation = await tx.allocation.create({
        data: {
          assetId: data.assetId,
          employeeId: data.employeeId || null,
          departmentId: data.departmentId || null,
          expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
          notes: data.notes || null,
          status: "ACTIVE",
        },
        include: {
          asset: true,
          employee: true,
          department: true,
        },
      });

      return allocation;
    });
  }

  async findById(id: string) {
    return prisma.allocation.findUnique({
      where: { id },
      include: {
        asset: true,
        employee: true,
        department: true,
      },
    });
  }

  async findActiveByAssetId(assetId: string) {
    return prisma.allocation.findFirst({
      where: {
        assetId,
        status: "ACTIVE",
      },
    });
  }

  async list(params: {
    page: number;
    limit: number;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
    employeeId?: string;
    departmentId?: string;
    assetId?: string;
    status?: string;
  }) {
    const { page, limit, search, sort, order, employeeId, departmentId, assetId, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (departmentId) where.departmentId = departmentId;
    if (assetId) where.assetId = assetId;

    if (search) {
      where.OR = [
        { asset: { name: { contains: search } } },
        { asset: { tag: { contains: search } } },
        { employee: { name: { contains: search } } },
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
      prisma.allocation.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          asset: true,
          employee: true,
          department: true,
        },
      }),
      prisma.allocation.count({ where }),
    ]);

    return {
      items,
      totalCount,
    };
  }
}

export const allocationRepository = new AllocationRepository();
export default allocationRepository;
