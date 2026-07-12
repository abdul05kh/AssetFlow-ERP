import { maintenanceRepository } from "../repository/maintenance.repository";
import {
  CreateMaintenanceInput,
  AssignTechnicianInput,
  ResolveMaintenanceInput,
  CloseMaintenanceInput,
} from "../validator/maintenance.validator";
import { NotFoundError, BusinessRuleError, ForbiddenError } from "../../../utils/errors";
import { prisma } from "../../../config/db";
import eventBus from "../../../events/event-bus";
import logger from "../../../utils/logger";

export class MaintenanceService {
  async raiseRequest(input: CreateMaintenanceInput, requestedById: string) {
    // 1. Fetch asset details
    const asset = await prisma.asset.findUnique({
      where: { id: input.assetId },
    });

    if (!asset) {
      throw new NotFoundError("Target asset does not exist");
    }

    // Disposed, retired or lost assets cannot be repaired
    if (["RETIRED", "DISPOSED", "LOST"].includes(asset.status)) {
      throw new BusinessRuleError(
        `Asset ${asset.tag} cannot be placed in maintenance. Current status: ${asset.status}`,
        "MAINT_002"
      );
    }

    const request = await maintenanceRepository.create({
      ...input,
      requestedById,
    });

    // Publish event
    eventBus.publish("MaintenanceCreated", {
      requestId: request.id,
      assetId: request.assetId,
      assetTag: request.asset.tag,
      requestedById: request.requestedById,
      priority: request.priority,
    });

    logger.info(`[Maintenance] Maintenance requested for ${request.asset.tag}. Priority: ${request.priority}`);
    return request;
  }

  async getById(id: string) {
    const request = await maintenanceRepository.findById(id);
    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }
    return request;
  }

  async approveRequest(id: string, approve: boolean, operatorRole: string) {
    const request = await this.getById(id);

    if (request.status !== "PENDING") {
      throw new BusinessRuleError(`Request must be in PENDING status. Current status: ${request.status}`, "MAINT_003");
    }

    if (!["ADMIN", "ASSET_MANAGER"].includes(operatorRole)) {
      throw new ForbiddenError("Only Asset Managers or Administrators can approve maintenance requests");
    }

    if (!approve) {
      const updated = await maintenanceRepository.updateStatus(id, "REJECTED");
      logger.info(`[Maintenance] Request ${id} was REJECTED by Asset Manager`);
      return updated;
    }

    // Approve the request
    const updated = await prisma.$transaction(async (tx) => {
      // Update ticket status
      const req = await tx.maintenanceRequest.update({
        where: { id },
        data: { status: "APPROVED" },
        include: { asset: true, requestedBy: true, technician: true },
      });

      // Automatically update asset status to UNDER_MAINTENANCE
      await tx.asset.update({
        where: { id: req.assetId },
        data: { status: "UNDER_MAINTENANCE" },
      });

      return req;
    });

    logger.info(`[Maintenance] Request ${id} approved. Asset status set to UNDER_MAINTENANCE.`);
    return updated;
  }

  async assignTechnician(id: string, input: AssignTechnicianInput, operatorRole: string) {
    const request = await this.getById(id);

    if (!["APPROVED", "PENDING"].includes(request.status)) {
      throw new BusinessRuleError(`Cannot assign technician to request in status: ${request.status}`, "MAINT_003");
    }

    if (!["ADMIN", "ASSET_MANAGER"].includes(operatorRole)) {
      throw new ForbiddenError("Only Asset Managers or Administrators can assign technicians");
    }

    // Verify technician user exists and has the TECHNICIAN role
    const techUser = await prisma.user.findUnique({
      where: { id: input.technicianId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!techUser || techUser.status !== "ACTIVE") {
      throw new BusinessRuleError("Target technician is inactive or does not exist", "USER_002");
    }

    const isTechnician = techUser.userRoles.some((ur) => ur.role.code === "TECHNICIAN");
    if (!isTechnician && techUser.userRoles[0]?.role.code !== "ADMIN") {
      throw new BusinessRuleError("User is not registered as a technician", "MAINT_004");
    }

    // If request was PENDING, auto-approve it during assignment
    if (request.status === "PENDING") {
      await prisma.asset.update({
        where: { id: request.assetId },
        data: { status: "UNDER_MAINTENANCE" },
      });
    }

    const updated = await maintenanceRepository.assignTechnician(id, input.technicianId);
    logger.info(`[Maintenance] Technician ${techUser.name} assigned to ticket ${id}`);
    return updated;
  }

  async startWork(id: string, operatorId: string) {
    const request = await this.getById(id);

    if (request.status !== "TECHNICIAN_ASSIGNED") {
      throw new BusinessRuleError(`Cannot start work. Status must be TECHNICIAN_ASSIGNED. Current: ${request.status}`, "MAINT_003");
    }

    // Enforce that only the assigned technician can start the work
    if (request.technicianId !== operatorId) {
      throw new ForbiddenError("Only the assigned technician can start the repair work");
    }

    const updated = await maintenanceRepository.updateStatus(id, "IN_PROGRESS");
    logger.info(`[Maintenance] Technician started work on ticket ${id}`);
    return updated;
  }

  async resolveWork(id: string, input: ResolveMaintenanceInput, operatorId: string) {
    const request = await this.getById(id);

    if (request.status !== "IN_PROGRESS") {
      throw new BusinessRuleError(`Cannot resolve repair. Ticket status must be IN_PROGRESS. Current: ${request.status}`, "MAINT_003");
    }

    if (request.technicianId !== operatorId) {
      throw new ForbiddenError("Only the assigned technician can resolve this ticket");
    }

    const updated = await maintenanceRepository.resolve(id, input);

    eventBus.publish("MaintenanceResolved", {
      requestId: updated.id,
      assetId: updated.assetId,
      assetTag: updated.asset.tag,
      technicianId: updated.technicianId,
      cost: input.cost || 0,
    });

    logger.info(`[Maintenance] Repair resolved for ${updated.asset.tag} by technician`);
    return updated;
  }

  async closeRequest(id: string, input: CloseMaintenanceInput, operatorRole: string) {
    const request = await this.getById(id);

    if (request.status !== "RESOLVED") {
      throw new BusinessRuleError(`Ticket must be RESOLVED before it can be closed. Current: ${request.status}`, "MAINT_003");
    }

    if (!["ADMIN", "ASSET_MANAGER"].includes(operatorRole)) {
      throw new ForbiddenError("Only Asset Managers or Administrators can close maintenance requests");
    }

    const updated = await maintenanceRepository.close(id, input);
    logger.info(`[Maintenance] Request ${id} CLOSED by Asset Manager. Asset status set to ${input.assetStatusAfterRepair}`);
    return updated;
  }

  async list(query: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: string;
    assetId?: string;
    requestedById?: string;
    technicianId?: string;
    status?: string;
    priority?: string;
  }) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "10", 10);
    const search = query.search;
    const sort = query.sort;
    const order = query.order === "desc" ? "desc" : "asc";
    const assetId = query.assetId;
    const requestedById = query.requestedById;
    const technicianId = query.technicianId;
    const status = query.status;
    const priority = query.priority;

    return maintenanceRepository.list({
      page,
      limit,
      search,
      sort,
      order,
      assetId,
      requestedById,
      technicianId,
      status,
      priority,
    });
  }
}

export const maintenanceService = new MaintenanceService();
export default maintenanceService;
