export interface CreateDepartmentDto {
  code: string;
  name: string;
  parentDepartmentId?: string | null;
  departmentHeadId?: string | null;
  description?: string | null;
}

export interface UpdateDepartmentDto {
  name?: string;
  parentDepartmentId?: string | null;
  departmentHeadId?: string | null;
  status?: "ACTIVE" | "INACTIVE";
  description?: string | null;
}

export interface DepartmentResponseDto {
  id: string;
  code: string;
  name: string;
  parentDepartmentId: string | null;
  departmentHeadId: string | null;
  status: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
