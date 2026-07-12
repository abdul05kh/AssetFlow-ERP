import { prisma } from "../../../config/db";
import { RequestTransferInput } from "../validator/transfer.validator";
import { BusinessRuleError } from "../../../utils/errors";

export class TransferRepository {
  async create(data: RequestTransferInput & { currentHolderId: string; allocationId: string; requestedById: string }) {
    return prisma.assetTransfer.create({
      data: {
        assetId: data.assetId,
        allocationId: data.allocationId,
        currentHolderId: data.currentHolderId,
        targetHolderId: data.targetHolderId,
        requestedById: data.requestedById,
        reason: data.reason,
        status: "PENDING",
      },
      include: {
        asset: true,
        currentHolder: true,
        targetHolder: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.assetTransfer.findUnique({
      where: { id },
      include: {
        asset: true,
        currentHolder: true,
        targetHolder: true,
        allocation: true,
      },
    });
  }

  async updateStatus(id: string, status: "APPROVED" | "REJECTED", approvedById?: string) {
    if (status === "REJECTED") {
      return prisma.assetTransfer.update({
        where: { id },
        data: { status, approvedById },
        include: {
          asset: true,
          currentHolder: true,
          targetHolder: true,
        },
      });
    }

    // APPROVED runs inside database transaction
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.assetTransfer.findUnique({
        where: { id },
        include: { targetHolder: true, asset: true },
      });

      if (!transfer) {
        throw new BusinessRuleError("Transfer request not found", "TRANSFER_NOT_FOUND");
      }

      if (transfer.status !== "PENDING") {
        throw new BusinessRuleError(`Transfer request is already ${transfer.status}`, "TRANSFER_002");
      }

      const now = new Date();

      // 1. Close current allocation
      await tx.allocation.update({
        where: { id: transfer.allocationId },
        data: {
          status: "RETURNED",
          actualReturnDate: now,
          conditionOnReturn: "GOOD",
        },
      });

      // 2. Open new allocation for target holder
      await tx.allocation.create({
        data: {
          assetId: transfer.assetId,
          employeeId: transfer.targetHolderId,
          departmentId: transfer.targetHolder.departmentId,
          allocationDate: now,
          status: "ACTIVE",
          notes: `Ownership transfer from ${transfer.currentHolderId}. Reason: ${transfer.reason}`,
        },
      });

      // 3. Update asset department and location to match new user
      await tx.asset.update({
        where: { id: transfer.assetId },
        data: {
          departmentId: transfer.targetHolder.departmentId,
          status: "ALLOCATED",
        },
      });

      // 4. Update transfer request record
      const updated = await tx.assetTransfer.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedById,
          transferDate: now,
        },
        include: {
          asset: true,
          currentHolder: true,
          targetHolder: true,
        },
      });

      return updated;
    });
  }

  async list(params: {
    page: number;
    limit: number;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
    assetId?: string;
    currentHolderId?: string;
    targetHolderId?: string;
    status?: string;
  }) {
    const { page, limit, search, sort, order, assetId, currentHolderId, targetHolderId, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (assetId) where.assetId = assetId;
    if (currentHolderId) where.currentHolderId = currentHolderId;
    if (targetHolderId) where.targetHolderId = targetHolderId;

    if (search) {
      where.OR = [
        { asset: { name: { contains: search } } },
        { asset: { tag: { contains: search } } },
        { reason: { contains: search } },
      ];
    }

    const orderBy: any = {};
    if (sort) {
      orderBy[sort] = order || "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [items, totalCount] = await Promise.all([
      prisma.assetTransfer.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          asset: true,
          currentHolder: true,
          targetHolder: true,
        },
      }),
      prisma.assetTransfer.count({ where }),
    ]);

    return {
      items,
      totalCount,
    };
  }
}

export const transferRepository = new TransferRepository();
export default transferRepository;
