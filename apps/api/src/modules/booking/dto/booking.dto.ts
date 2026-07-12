export interface CreateBookingDto {
  resourceId: string;
  startTime: string; // ISO datetime string
  endTime: string; // ISO datetime string
  purpose: string;
}

export interface ApproveBookingDto {
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED";
}

export interface BookingResponseDto {
  id: string;
  resourceId: string;
  employeeId: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
