export interface NotificationResponseDto {
  id: string;
  userId: string;
  message: string;
  eventType: string;
  referenceId: string | null;
  isRead: boolean;
  createdAt: Date;
}
