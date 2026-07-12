import { allocationRepository } from "../repository/allocation.repository";
import { CreateAllocationInput } from "../validator/allocation.validator";
import { NotFoundError, BusinessRuleError } from "../../../utils/errors";
import { prisma } from "../../../config/db";
import eventBus from "../../../events/event-bus";
import logger from "../../../utils/logger";

export class AllocationService {
  async allocate(input: CreateAllocationInput) {
    // 1. Verify target Employee if provided
    if (input.employeeId) {
      const user = await prisma.user.findUnique({
        where: { id: input.employeeId },
      });
      if (!user || user.status !== "ACTIVE") {
        throw new BusinessRuleError("Allocation target employee does not exist or is inactive", "USER_002");
      }
    }

    // 2. Verify target Department if provided
    if (input.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: input.departmentId },
      });
      if (!dept || dept.status !== "ACTIVE") {
        throw new BusinessRuleError("Allocation target department does not exist or is inactive", "DEPT_003");
      }
    }

    // 3. Perform allocation inside transaction
    const allocation = await allocationRepository.create(input);

    // 4. Publish allocation domain event
    eventBus.publish("AssetAllocated", {
      allocationId: allocation.id,
      assetId: allocation.assetId,
      assetTag: allocation.asset.tag,
      employeeId: allocation.employeeId,
      departmentId: allocation.departmentId,
      employeeName: allocation.employee?.name || null,
      departmentName: allocation.department?.name || null,
    });

    logger.info(
      `[Allocation] Asset ${allocation.asset.tag} allocated to ` +
        (allocation.employee ? `Employee: ${allocation.employee.name}` : `Department: ${allocation.department?.name}`)
    );

    return allocation;
  }

  async getById(id: string) {
    const allocation = await allocationRepository.findById(id);
    if (!allocation) {
      throw new NotFoundError("Allocation record not found");
    }
    return allocation;
  }

  async list(query: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: string;
    employeeId?: string;
    departmentId?: string;
    assetId?: string;
    status?: string;
  }) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "10", 10);
    const search = query.search;
    const sort = query.sort;
    const order = query.order === "desc" ? "desc" : "asc";
    const employeeId = query.employeeId;
    const departmentId = query.departmentId;
    const assetId = query.assetId;
    const status = query.status;

    return allocationRepository.list({
      page,
      limit,
      search,
      sort,
      order,
      employeeId,
      departmentId,
      assetId,
      status,
    });
  }
}

export const allocationService = new AllocationService();
export default allocationService;
