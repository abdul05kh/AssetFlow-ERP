import { prisma } from "../../../config/db";
import { CreateDepartmentInput, UpdateDepartmentInput } from "../validator/department.validator";

export class DepartmentRepository {
  async create(data: CreateDepartmentInput) {
    return prisma.department.create({
      data: {
        code: data.code,
        name: data.name,
        parentDepartmentId: data.parentDepartmentId || null,
        departmentHeadId: data.departmentHeadId || null,
        description: data.description || null,
      },
    });
  }

  async findById(id: string) {
    return prisma.department.findUnique({
      where: { id },
      include: {
        parentDepartment: true,
        childDepartments: true,
        users: true,
      },
    });
  }

  async findByCode(code: string) {
    return prisma.department.findUnique({
      where: { code },
    });
  }

  async findByName(name: string) {
    return prisma.department.findUnique({
      where: { name },
    });
  }

  async update(id: string, data: UpdateDepartmentInput) {
    return prisma.department.update({
      where: { id },
      data,
    });
  }

  async list(params: {
    page: number;
    limit: number;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
    status?: string;
  }) {
    const { page, limit, search, sort, order, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const orderBy: any = {};
    if (sort) {
      orderBy[sort] = order || "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [items, totalCount] = await Promise.all([
      prisma.department.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          parentDepartment: true,
        },
      }),
      prisma.department.count({ where }),
    ]);

    return {
      items,
      totalCount,
    };
  }

  async countReferencingUsersOrAssets(id: string): Promise<{ usersCount: number; assetsCount: number }> {
    const [usersCount, assetsCount] = await Promise.all([
      prisma.user.count({ where: { departmentId: id } }),
      prisma.asset.count({ where: { departmentId: id } }),
    ]);
    return { usersCount, assetsCount };
  }
}

export const departmentRepository = new DepartmentRepository();
export default departmentRepository;
