import { prisma } from "../../../config/db";
import { CreateUserInput, UpdateUserInput } from "../validator/user.validator";

export class UserRepository {
  async create(data: CreateUserInput & { passwordHash: string; roleId: string }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          name: data.name,
          phone: data.phone || null,
          designation: data.designation || null,
          departmentId: data.departmentId,
          status: "ACTIVE",
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: data.roleId,
        },
      });

      return tx.user.findUnique({
        where: { id: user.id },
        include: {
          department: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        department: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateUserInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        department: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async promote(userId: string, newRoleId: string) {
    return prisma.$transaction(async (tx) => {
      // Delete existing roles
      await tx.userRole.deleteMany({
        where: { userId },
      });

      // Insert new role mapping
      await tx.userRole.create({
        data: {
          userId,
          roleId: newRoleId,
        },
      });

      return tx.user.findUnique({
        where: { id: userId },
        include: {
          department: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    });
  }

  async list(params: {
    page: number;
    limit: number;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
    departmentId?: string;
    roleCode?: string;
    status?: string;
  }) {
    const { page, limit, search, sort, order, departmentId, roleCode, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (roleCode) {
      where.userRoles = {
        some: {
          role: {
            code: roleCode,
          },
        },
      };
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { designation: { contains: search } },
      ];
    }

    const orderBy: any = {};
    if (sort) {
      orderBy[sort] = order || "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [items, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          department: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      totalCount,
    };
  }
}

export const userRepository = new UserRepository();
export default userRepository;
