import { auditRepository } from "../repository/audit.repository";
import { CreateAuditInput, VerifyAuditItemInput } from "../validator/audit.validator";
import { NotFoundError, BusinessRuleError, ForbiddenError } from "../../../utils/errors";
import { prisma } from "../../../config/db";
import eventBus from "../../../events/event-bus";
import logger from "../../../utils/logger";

export class AuditService {
  async createCycle(input: CreateAuditInput) {
    // 1. Verify auditor exists and is active
    const auditorUser = await prisma.user.findUnique({
      where: { id: input.auditorId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!auditorUser || auditorUser.status !== "ACTIVE") {
      throw new BusinessRuleError("Target auditor record does not exist or is inactive", "USER_002");
    }

    const isAuditor = auditorUser.userRoles.some((ur) => ur.role.code === "AUDITOR" || ur.role.code === "ADMIN");
    if (!isAuditor) {
      throw new BusinessRuleError("Target user is not registered as an auditor", "AUDIT_001");
    }

    // 2. Verify target department exists and is active
    const dept = await prisma.department.findUnique({
      where: { id: input.departmentId },
    });

    if (!dept || dept.status !== "ACTIVE") {
      throw new BusinessRuleError("Target department does not exist or is inactive", "DEPT_003");
    }

    // 3. Create cycle inside transaction
    const audit = await auditRepository.create(input);
    logger.info(`[Audit] Created audit cycle: ${audit?.name} for department ${dept.name}`);
    return audit;
  }

  async getById(id: string) {
    const audit = await auditRepository.findById(id);
    if (!audit) {
      throw new NotFoundError("Audit cycle not found");
    }
    return audit;
  }

  async verifyItem(itemId: string, input: VerifyAuditItemInput, operatorId: string) {
    const item = await auditRepository.findItemById(itemId);

    if (!item) {
      throw new NotFoundError("Audit checklist item not found");
    }

    // Enforce that only the assigned auditor can execute verification checks
    if (item.audit.auditorId !== operatorId) {
      throw new ForbiddenError("Only the assigned auditor can verify this checklist item");
    }

    if (item.audit.status === "CLOSED") {
      throw new BusinessRuleError("Cannot verify items on a closed audit cycle", "AUDIT_002");
    }

    const updated = await auditRepository.updateItem(itemId, input);
    logger.info(`[Audit] Verified item ${updated.asset.tag} as ${input.status}`);
    
    // Auto-update audit cycle state to VERIFICATION if it was CREATED/ASSIGNED
    if (item.audit.status === "ASSIGNED") {
      await auditRepository.updateStatus(item.auditId, "VERIFICATION");
    }

    return updated;
  }

  async closeCycle(id: string, operatorId: string) {
    const audit = await this.getById(id);

    if (audit.status === "CLOSED") {
      throw new BusinessRuleError("Audit cycle is already closed", "AUDIT_002");
    }

    if (audit.auditorId !== operatorId) {
      throw new ForbiddenError("Only the assigned auditor can close this audit cycle");
    }

    const result = await auditRepository.close(id);

    // Publish completed domain event
    eventBus.publish("AuditCompleted", {
      auditId: result.audit.id,
      name: result.audit.name,
      departmentId: result.audit.departmentId,
      departmentName: result.audit.department.name,
      hasDiscrepancy: result.hasDiscrepancy,
      auditorId: result.audit.auditorId,
    });

    logger.info(`[Audit] Closed audit cycle ${result.audit.name}. Has Discrepancies: ${result.hasDiscrepancy}`);
    return result.audit;
  }

  async list(query: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: string;
    departmentId?: string;
    auditorId?: string;
    status?: string;
  }) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "10", 10);
    const search = query.search;
    const sort = query.sort;
    const order = query.order === "desc" ? "desc" : "asc";
    const departmentId = query.departmentId;
    const auditorId = query.auditorId;
    const status = query.status;

    return auditRepository.list({
      page,
      limit,
      search,
      sort,
      order,
      departmentId,
      auditorId,
      status,
    });
  }
}

export const auditService = new AuditService();
export default auditService;
