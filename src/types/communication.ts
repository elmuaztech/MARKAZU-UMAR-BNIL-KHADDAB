export type CommunicationType =
  | 'ANNOUNCEMENT'
  | 'CIRCULAR'
  | 'EXAMINATION_NOTICE'
  | 'HOLIDAY_NOTICE'
  | 'PTA_MEETING'
  | 'EVENT_NOTICE'
  | 'EMERGENCY_NOTICE'
  | 'REPORT_SHEET'
  | 'GENERAL_NOTICE'
  | 'ADMISSION_NOTICE'
  | 'CUSTOM_MESSAGE';

export type DeliveryChannel = 'EMAIL' | 'WHATSAPP' | 'IN_APP' | 'DASHBOARD';

export type RecipientType =
  | 'ENTIRE_SCHOOL'
  | 'PROGRAMME'
  | 'CLASS'
  | 'TEACHERS'
  | 'PARENTS'
  | 'STUDENTS'
  | 'CUSTOM';

export type MessagePriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';

export interface CommunicationAttachment {
  id: string;
  name: string;
  size: string;
  type: 'IMAGE' | 'PDF' | 'WORD' | 'EXCEL' | 'ZIP';
  url: string;
}

export interface CommunicationMessage {
  id: string;
  title: string;
  type: CommunicationType;
  priority: MessagePriority;
  channels: DeliveryChannel[];
  recipientType: RecipientType;
  programmeId?: string;
  programmeName?: string;
  classId?: string;
  className?: string;
  customRecipientIds?: string[];
  subject: string;
  content: string; // HTML or Markdown formatted content
  plainContent?: string;
  templateId?: string;
  attachments?: CommunicationAttachment[];
  senderId: string;
  senderName: string;
  senderRole: string;
  status: 'DRAFT' | 'QUEUED' | 'PROCESSING' | 'SENT' | 'SCHEDULED' | 'FAILED' | 'CANCELLED';
  scheduledFor?: string; // ISO date string
  sentAt?: string;
  createdAt: string;
  stats: {
    totalRecipients: number;
    emailCount: number;
    whatsappCount: number;
    notificationCount: number;
    dashboardCount: number;
    deliveredCount: number;
    failedCount: number;
    readCount: number;
  };
}

export interface MessageTemplate {
  id: string;
  title: string;
  category: CommunicationType;
  subject: string;
  content: string;
  defaultChannels: DeliveryChannel[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QueueItem {
  id: string;
  messageId: string;
  messageTitle: string;
  channel: DeliveryChannel;
  recipientId: string;
  recipientName: string;
  recipientContact: string; // Email address, WhatsApp number, or User ID
  recipientRole: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorTrace?: string;
  attempts: number;
  maxAttempts: number;
  queuedAt: string;
  processedAt?: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  messageId?: string;
  title: string;
  body: string;
  priority: MessagePriority;
  category: CommunicationType;
  channels: DeliveryChannel[];
  senderName: string;
  read: boolean;
  pinned: boolean;
  isArchived: boolean;
  createdAt: string;
  readAt?: string;
  attachments?: CommunicationAttachment[];
}

export interface SmartParentGroup {
  parentId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  wardIds: string[];
  wardNames: string[];
  reportCardsCount: number;
}

export interface CommunicationSettings {
  schoolEmail: string;
  replyToEmail: string;
  schoolWhatsApp: string;
  defaultSignature: string;
  footerText: string;
  schoolLogo: string;
  enableEmailService: boolean;
  enableWhatsAppService: boolean;
  enableInAppService: boolean;
  enableDashboardService: boolean;
}
