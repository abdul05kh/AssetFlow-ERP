export interface CreateMaintenanceRequestDto {
  assetId: string;
  description: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface AssignTechnicianDto {
  technicianId: string;
}

export interface ResolveMaintenanceDto {
  cost?: number;
  notes?: string | null;
}

export interface CloseMaintenanceDto {
  assetStatusAfterRepair: "AVAILABLE" | "RETIRED" | "DISPOSED";
  assetConditionAfterRepair: "NEW" | "GOOD" | "FAIR" | "POOR";
}

export interface MaintenanceResponseDto {
  id: string;
  assetId: string;
  requestedById: string;
  technicianId: string | null;
  description: string;
  priority: string;
  status: string;
  cost: number | null;
  notes: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
