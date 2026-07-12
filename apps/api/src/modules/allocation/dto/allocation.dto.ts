export interface CreateAllocationDto {
  assetId: string;
  employeeId?: string | null;
  departmentId?: string | null;
  expectedReturnDate?: string | null;
  notes?: string | null;
}

export interface AllocationResponseDto {
  id: string;
  assetId: string;
  employeeId: string | null;
  departmentId: string | null;
  allocationDate: Date;
  expectedReturnDate: Date | null;
  actualReturnDate: Date | null;
  conditionOnReturn: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
