export interface CreateAuditDto {
  name: string;
  departmentId: string;
  location: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  auditorId: string;
}

export interface VerifyAuditItemDto {
  status: "VERIFIED" | "MISSING" | "DAMAGED";
  discrepancyNotes?: string | null;
}

export interface AuditResponseDto {
  id: string;
  name: string;
  departmentId: string;
  location: string;
  startDate: Date;
  endDate: Date;
  auditorId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
