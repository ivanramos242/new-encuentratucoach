export type ConversationThreadStatus = "open" | "closed_by_client" | "closed_by_coach" | "admin_locked";

export type MessageSenderType = "client" | "coach" | "admin_system";

export type AttachmentType = "image" | "pdf";

export type AttachmentStatus = "uploaded" | "validated" | "rejected" | "deleted";

export type QaQuestionStatus = "published" | "flagged" | "hidden" | "locked" | "deleted";

export type QaAnswerStatus = "published" | "flagged" | "hidden" | "deleted";

export type QaVoteType = "up" | "down";

export type QaReportTargetType = "question" | "answer";

export type NotificationType =
  | "message_new"
  | "message_reply"
  | "message_thread_reported"
  | "qa_question_answered"
  | "qa_answer_accepted"
  | "qa_content_reported"
  | "qa_content_moderated"
  | "review_new_pending"
  | "review_coach_action_required"
  | "subscription_state_changed"
  | "system_announcement";

export type NotificationChannel = "in_app" | "email";

export type NotificationDeliveryStatus = "pending" | "sent" | "failed" | "skipped";

export type JobType =
  | "send_email_notification"
  | "retry_email_notification"
  | "recalc_funnel_aggregates"
  | "recalc_qa_counters"
  | "cleanup_orphan_attachments"
  | "expire_notifications";

export type JobStatus = "queued" | "running" | "done" | "failed" | "dead_letter";

export type JobPriority = "low" | "normal" | "high";

export type FunnelEventType =
  | "profile_view"
  | "profile_cta_click"
  | "chat_thread_started"
  | "chat_first_coach_reply"
  | "chat_client_followup"
  | "qa_question_view"
  | "qa_question_created"
  | "qa_answer_created"
  | "qa_answer_accepted"
  | "review_created"
  | "review_approved";

export interface QaAnswer {
  id: string;
  questionId: string;
  coachProfileId: string;
  coachName: string;
  coachSlug: string;
  coachIsActive: boolean;
  body: string;
  status: QaAnswerStatus;
  voteScore: number;
  votesCount: number;
  accepted: boolean;
  createdAt: string;
}

export interface QaQuestion {
  id: string;
  slug: string;
  title: string;
  body: string;
  authorUserId: string;
  authorDisplayName: string;
  isAnonymous: boolean;
  status: QaQuestionStatus;
  topicSlug: string;
  topicName: string;
  categorySlug?: string;
  citySlug?: string;
  tags: string[];
  answers: QaAnswer[];
  acceptedAnswerId?: string;
  views: number;
  votesTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface QaTopic {
  slug: string;
  name: string;
  description: string;
  curated: boolean;
}

export interface MessageAttachment {
  id: string;
  type: AttachmentType;
  status: AttachmentStatus;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  downloadUrl?: string;
}

export interface MessageItem {
  id: string;
  threadId: string;
  senderType: MessageSenderType;
  senderUserId?: string;
  senderLabel: string;
  body: string;
  createdAt: string;
  readByOtherSide: boolean;
  attachment?: MessageAttachment;
}

export interface MessageThread {
  id: string;
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
  messages: MessageItem[];
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface NotificationPreferenceRecord {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  enabled: boolean;
  digestMode: "instant" | "digest";
}

export interface JobRecord {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  scheduledAt: string;
  attempts: number;
  maxAttempts: number;
  payload: Record<string, unknown>;
  lastError?: string;
}

export interface FunnelSummary {
  coachProfileId?: string;
  periodLabel: string;
  counts: Record<FunnelEventType, number>;
  conversionRates: {
    profileToChatStart: number;
    chatStartToFirstReply: number;
    qaQuestionToAnswer: number;
  };
}
