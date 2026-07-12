export interface CreateUserDto {
  email: string;
  name: string;
  password?: string;
  phone?: string | null;
  designation?: string | null;
  departmentId: string;
  roleCode: string;
}

export interface UpdateUserDto {
  name?: string;
  phone?: string | null;
  designation?: string | null;
  departmentId?: string;
  status?: "ACTIVE" | "INACTIVE";
}

export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  designation: string | null;
  status: string;
  departmentId: string;
  createdAt: Date;
  updatedAt: Date;
}
