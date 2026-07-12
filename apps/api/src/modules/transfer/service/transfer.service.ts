import { transferRepository } from "../repository/transfer.repository";
import { RequestTransferInput, ApproveTransferInput } from "../validator/transfer.validator";
import { NotFoundError, BusinessRuleError, ForbiddenError } from "../../../utils/errors";
import { prisma } from "../../../config/db";
import eventBus from "../../../events/event-bus";
import logger from "../../../utils/logger";

export class TransferService {
  async requestTransfer(input: RequestTransferInput, requestedById: string) {
    // 1. Fetch asset details
    const asset = await prisma.asset.findUnique({
      where: { id: input.assetId },
    });

    if (!asset) {
      throw new NotFoundError("Target asset does not exist");
    }

    // Enforce that only allocated assets can be transferred
    if (asset.status !== "ALLOCATED") {
      throw new BusinessRuleError(
        `Asset ${asset.tag} is in status ${asset.status} and cannot be transferred. It must be currently ALLOCATED`,
        "TRANSFER_001"
      );
    }

    // 2. Fetch target holder details
    const targetUser = await prisma.user.findUnique({
      where: { id: input.targetHolderId },
    });

    if (!targetUser || targetUser.status !== "ACTIVE") {
      throw new BusinessRuleError("Target employee record does not exist or is inactive", "USER_002");
    }

    // 3. Find current active allocation
    const activeAlloc = await prisma.allocation.findFirst({
      where: {
        assetId: input.assetId,
        status: "ACTIVE",
      },
    });

    if (!activeAlloc || !activeAlloc.employeeId) {
      throw new BusinessRuleError("Target asset does not have an active employee allocation", "TRANSFER_003");
    }

    const currentHolderId = activeAlloc.employeeId;

    // Enforce that target user cannot be the current holder
    if (currentHolderId === input.targetHolderId) {
      throw new BusinessRuleError("Cannot transfer asset to its current holder employee", "TRANSFER_004");
    }

    const transfer = await transferRepository.create({
      ...input,
      currentHolderId,
      allocationId: activeAlloc.id,
      requestedById,
    });

    logger.info(`[Transfer] Transfer request created: ${asset.tag} from ${currentHolderId} to ${input.targetHolderId}`);
    return transfer;
  }

  async getById(id: string) {
    const transfer = await transferRepository.findById(id);
    if (!transfer) {
      throw new NotFoundError("Transfer request not found");
    }
    return transfer;
  }

  async approve(id: string, input: ApproveTransferInput, operatorRole: string, operatorId: string) {
    const transfer = await this.getById(id);

    if (transfer.status !== "PENDING") {
      throw new BusinessRuleError(`Transfer request is already ${transfer.status}`, "TRANSFER_002");
    }

    // Only DEPT_HEAD or ASSET_MANAGER can approve
    if (!["ADMIN", "ASSET_MANAGER", "DEPT_HEAD"].includes(operatorRole)) {
      throw new ForbiddenError("Only department heads or asset inventory managers can approve ownership transfers");
    }

    const updated = await transferRepository.updateStatus(id, input.status, operatorId);

    if (input.status === "APPROVED") {
      eventBus.publish("TransferApproved", {
        transferId: updated.id,
        assetId: updated.assetId,
        assetTag: updated.asset.tag,
        currentHolderId: updated.currentHolderId,
        targetHolderId: updated.targetHolderId,
        currentHolderName: updated.currentHolder.name,
        targetHolderName: updated.targetHolder.name,
      });
      logger.info(`[Transfer] Ownership transfer approved: ${updated.asset.tag} assigned to ${updated.targetHolder.name}`);
    } else {
      logger.info(`[Transfer] Ownership transfer rejected: ${updated.asset.tag} for ${updated.targetHolder.name}`);
    }

    return updated;
  }

  async list(query: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: string;
    assetId?: string;
    currentHolderId?: string;
    targetHolderId?: string;
    status?: string;
  }) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "10", 10);
    const search = query.search;
    const sort = query.sort;
    const order = query.order === "desc" ? "desc" : "asc";
    const assetId = query.assetId;
    const currentHolderId = query.currentHolderId;
    const targetHolderId = query.targetHolderId;
    const status = query.status;

    return transferRepository.list({
      page,
      limit,
      search,
      sort,
      order,
      assetId,
      currentHolderId,
      targetHolderId,
      status,
    });
  }
}

export const transferService = new TransferService();
export default transferService;
