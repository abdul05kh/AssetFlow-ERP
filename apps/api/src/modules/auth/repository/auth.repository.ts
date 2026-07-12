import { prisma } from "../../../config/db";

export class AuthRepository {
  async findUserByEmail(email: string) {
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

  async findUserById(id: string) {
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
}

export const authRepository = new AuthRepository();
export default authRepository;
