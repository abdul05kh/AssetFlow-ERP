import argon2 from "argon2";
import { userRepository } from "../repository/user.repository";
import { CreateUserInput, UpdateUserInput, PromoteUserInput } from "../validator/user.validator";
import { ConflictError, NotFoundError, BusinessRuleError } from "../../../utils/errors";
import { prisma } from "../../../config/db";
import eventBus from "../../../events/event-bus";

export class UserService {
  async create(input: CreateUserInput) {
    // 1. Email check
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError(`Email ${input.email} is already in use`, "USER_001");
    }

    // 2. Department check
    const department = await prisma.department.findUnique({
      where: { id: input.departmentId },
    });
    if (!department || department.status !== "ACTIVE") {
      throw new BusinessRuleError("Target department does not exist or is inactive", "USER_002");
    }

    // 3. Role check
    const role = await prisma.role.findUnique({
      where: { code: input.roleCode },
    });
    if (!role) {
      throw new NotFoundError(`Role with code ${input.roleCode} not found`);
    }

    // 4. Hash default password
    const passwordHash = await argon2.hash(input.password);

    const user = await userRepository.create({
      ...input,
      passwordHash,
      roleId: role.id,
    });

    // 5. Fire user created event
    eventBus.publish("UserCreated", { userId: user?.id, email: user?.email });

    return user;
  }

  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("Employee record not found");
    }
    return user;
  }

  async update(id: string, input: UpdateUserInput) {
    const user = await this.getById(id);

    // If department is changing, verify it is active
    if (input.departmentId && input.departmentId !== user.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: input.departmentId },
      });
      if (!department || department.status !== "ACTIVE") {
        throw new BusinessRuleError("Target department does not exist or is inactive", "USER_002");
      }
    }

    // If setting to INACTIVE, verify they do not hold any currently allocated assets
    if (input.status === "INACTIVE" && user.status === "ACTIVE") {
      const activeAllocationsCount = await prisma.allocation.count({
        where: {
          employeeId: id,
          status: "ACTIVE",
        },
      });
      if (activeAllocationsCount > 0) {
        throw new BusinessRuleError(
          `Cannot deactivate user with ${activeAllocationsCount} active asset allocations. Return assets first`,
          "USER_003"
        );
      }
    }

    return userRepository.update(id, input);
  }

  async promote(id: string, input: PromoteUserInput) {
    await this.getById(id);

    const role = await prisma.role.findUnique({
      where: { code: input.roleCode },
    });
    if (!role) {
      throw new NotFoundError(`Role code ${input.roleCode} not found`);
    }

    return userRepository.promote(id, role.id);
  }

  async list(query: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: string;
    departmentId?: string;
    roleCode?: string;
    status?: string;
  }) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "10", 10);
    const search = query.search;
    const sort = query.sort;
    const order = query.order === "desc" ? "desc" : "asc";
    const departmentId = query.departmentId;
    const roleCode = query.roleCode;
    const status = query.status;

    return userRepository.list({
      page,
      limit,
      search,
      sort,
      order,
      departmentId,
      roleCode,
      status,
    });
  }
}

export const userService = new UserService();
export default userService;
