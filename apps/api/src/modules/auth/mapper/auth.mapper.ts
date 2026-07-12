import { UserProfileDto } from "../dto/auth.dto";

export class AuthMapper {
  static toProfileDto(user: any): UserProfileDto {
    const primaryRole = user.userRoles?.[0]?.role || {
      id: "unknown",
      name: "Employee",
      code: "EMPLOYEE",
    };

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      designation: user.designation,
      status: user.status,
      role: {
        id: primaryRole.id,
        name: primaryRole.name,
        code: primaryRole.code,
      },
      department: {
        id: user.department.id,
        name: user.department.name,
        code: user.department.code,
      },
    };
  }
}
