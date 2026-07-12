export interface CreateCategoryDto {
  name: string;
  description?: string | null;
  sharedResource?: boolean;
  defaultMaintenanceInterval?: number;
}

export interface CreateAssetDto {
  name: string;
  serialNumber?: string | null;
  categoryId: string;
  departmentId: string;
  acquisitionDate: string; // ISO date string
  acquisitionCost: number;
  currentLocation: string;
  condition?: "NEW" | "GOOD" | "FAIR" | "POOR" | "DAMAGED";
  sharedResource?: boolean;
  warrantyExpiry?: string | null;
  description?: string | null;
  images?: string[]; // Array of image URLs
}

export interface UpdateAssetDto {
  name?: string;
  serialNumber?: string | null;
  categoryId?: string;
  departmentId?: string;
  acquisitionDate?: string;
  acquisitionCost?: number;
  currentLocation?: string;
  condition?: "NEW" | "GOOD" | "FAIR" | "POOR" | "DAMAGED";
  status?: "AVAILABLE" | "ALLOCATED" | "RESERVED" | "UNDER_MAINTENANCE" | "LOST" | "RETIRED" | "DISPOSED";
  warrantyExpiry?: string | null;
  description?: string | null;
  images?: string[];
}
