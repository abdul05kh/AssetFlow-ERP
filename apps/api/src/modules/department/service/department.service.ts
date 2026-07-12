import { departmentRepository } from "../repository/department.repository";
import { CreateDepartmentInput, UpdateDepartmentInput } from "../validator/department.validator";
import { ConflictError, NotFoundError, BusinessRuleError } from "../../../utils/errors";
import { prisma } from "../../../config/db";

export class DepartmentService {
  async create(input: CreateDepartmentInput) {
    // 1. Unique code check
    const existingCode = await departmentRepository.findByCode(input.code);
    if (existingCode) {
      throw new ConflictError(`Department code ${input.code} is already in use`, "DEPT_001");
    }

    // 2. Unique name check
    const existingName = await departmentRepository.findByName(input.name);
    if (existingName) {
      throw new ConflictError(`Department name ${input.name} is already in use`, "DEPT_002");
    }

    // 3. Parent department check
    if (input.parentDepartmentId) {
      const parent = await departmentRepository.findById(input.parentDepartmentId);
      if (!parent) {
        throw new NotFoundError("Parent department not found");
      }
    }

    // 4. Department head check
    if (input.departmentHeadId) {
      const headUser = await prisma.user.findUnique({
        where: { id: input.departmentHeadId },
      });
      if (!headUser || headUser.status !== "ACTIVE") {
        throw new BusinessRuleError("Department head must be an active employee", "DEPT_003");
      }
    }

    return departmentRepository.create(input);
  }

  async getById(id: string) {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw new NotFoundError("Department not found");
    }
    return department;
  }

  async update(id: string, input: UpdateDepartmentInput) {
    const dept = await this.getById(id);

    // 1. Unique name check if changed
    if (input.name && input.name !== dept.name) {
      const existingName = await departmentRepository.findByName(input.name);
      if (existingName) {
        throw new ConflictError(`Department name ${input.name} is already in use`, "DEPT_002");
      }
    }

    // 2. Parent check if changed
    if (input.parentDepartmentId) {
      if (input.parentDepartmentId === id) {
        throw new BusinessRuleError("A department cannot be its own parent", "DEPT_004");
      }
      const parent = await departmentRepository.findById(input.parentDepartmentId);
      if (!parent) {
        throw new NotFoundError("Parent department not found");
      }
    }

    // 3. Head check if changed
    if (input.departmentHeadId) {
      const headUser = await prisma.user.findUnique({
        where: { id: input.departmentHeadId },
      });
      if (!headUser || headUser.status !== "ACTIVE") {
        throw new BusinessRuleError("Department head must be an active employee", "DEPT_003");
      }
    }

    // 4. Deactivation check: if setting to INACTIVE, check if referenced by active employees or assets
    if (input.status === "INACTIVE" && dept.status === "ACTIVE") {
      const references = await departmentRepository.countReferencingUsersOrAssets(id);
      if (references.usersCount > 0 || references.assetsCount > 0) {
        throw new BusinessRuleError(
          `Cannot deactivate department containing ${references.usersCount} users and ${references.assetsCount} assets`,
          "DEPT_005"
        );
      }
    }

    return departmentRepository.update(id, input);
  }

  async list(query: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: string;
    status?: string;
  }) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "10", 10);
    const search = query.search;
    const sort = query.sort;
    const order = query.order === "desc" ? "desc" : "asc";
    const status = query.status;

    return departmentRepository.list({
      page,
      limit,
      search,
      sort,
      order,
      status,
    });
  }
}

export const departmentService = new DepartmentService();
export default departmentService;
