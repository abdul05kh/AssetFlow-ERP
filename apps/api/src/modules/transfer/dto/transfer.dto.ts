export interface RequestTransferDto {
  assetId: string;
  targetHolderId: string;
  reason: string;
}

export interface ApproveTransferDto {
  status: "APPROVED" | "REJECTED";
}

export interface TransferResponseDto {
  id: string;
  assetId: string;
  allocationId: string;
  currentHolderId: string;
  targetHolderId: string;
  requestedById: string;
  approvedById: string | null;
  reason: string;
  requestedDate: Date;
  transferDate: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
