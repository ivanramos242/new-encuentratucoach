export type MessagingRole = "coach" | "client";

export type ConversationThreadStatus = "open" | "closed_by_client" | "closed_by_coach" | "admin_locked";

export type MessageSenderType = "client" | "coach" | "admin_system";

export type AttachmentType = "image" | "pdf" | "audio";

export type AttachmentStatus = "uploaded" | "validated" | "rejected" | "deleted";

export type QueuePressure = "low" | "medium" | "high";

export type DeliveryState = "queued" | "sending" | "sent" | "failed";

export interface MessageAttachmentDto {
  id: string;
  type: AttachmentType;
  status: AttachmentStatus;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  downloadUrl?: string | null;
  durationMs?: number | null;
}

export interface MessageItemDto {
  id: string;
  threadId: string;
  senderType: MessageSenderType;
  senderUserId?: string | null;
  senderLabel: string;
  body: string;
  createdAt: string;
  readByOtherSide: boolean;
  attachment?: MessageAttachmentDto;
  clientRequestId?: string | null;
  deliveryState?: DeliveryState;
  isOptimistic?: boolean;
}

export interface MessageThreadSummaryDto {
  id: string;
  viewerRole: MessagingRole;
  clientUserId: string;
  clientName: string;
  coachUserId: string;
  coachProfileId: string;
  coachName: string;
  coachSlug: string;
  coachMembershipActive: boolean;
  status: ConversationThreadStatus;
  unreadForCoach: number;
  unreadForClient: number;
  lastMessageAt: string;
  createdAt: string;
  messagesCount: number;
  lastMessagePreview: string;
}

export interface MessageThreadDetailDto extends MessageThreadSummaryDto {
  messages: MessageItemDto[];
}

export interface MessagePollResult {
  threadId: string;
  items: MessageItemDto[];
  nextCursor: string | null;
  serverTime: string;
}

export interface MessageServerHints {
  queuePressure: QueuePressure;
  suggestedPollMs: number;
  retryAfterMs?: number;
}

export interface MessageThreadListResult {
  threads: MessageThreadSummaryDto[];
  serverHints: MessageServerHints;
}
