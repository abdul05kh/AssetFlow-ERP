export interface ReturnAssetDto {
  assetId: string;
  conditionOnReturn: "NEW" | "GOOD" | "FAIR" | "POOR" | "DAMAGED";
  notes?: string | null;
}

export interface ReturnResponseDto {
  allocationId: string;
  assetId: string;
  actualReturnDate: Date;
  conditionOnReturn: string;
  status: string;
}
