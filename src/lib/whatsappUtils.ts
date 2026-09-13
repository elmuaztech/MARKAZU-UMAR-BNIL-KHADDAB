import { SmartParentGroup } from '@/types/communication';
import { Student, Parent } from '@/types';

/**
 * Format Nigerian / International Phone Numbers for WhatsApp Web API
 * e.g., "08167109421" -> "2348167109421"
 * e.g., "+234 816 710 9421" -> "2348167109421"
 */
export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return '2348000000000';
  let cleaned = phone.replace(/\D/g, ''); // strip non-digits

  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '234' + cleaned.substring(1);
  } else if (cleaned.startsWith('234')) {
    // already 234 prefix
  } else if (cleaned.length === 10) {
    cleaned = '234' + cleaned;
  }

  return cleaned;
}

export interface WhatsAppPayload {
  parentId: string;
  parentName: string;
  parentPhone: string;
  formattedPhone: string;
  wardNames: string[];
  messageText: string;
  whatsappUrl: string;
}

/**
 * Build Personalized WhatsApp Payload for Report Card Delivery
 * ENFORCES: Each parent receives ONLY their own child's/children's report card link!
 */
export function buildReportSheetWhatsAppPayload(
  group: SmartParentGroup,
  sessionName: string,
  term: string,
  students: Student[],
  baseUrl?: string
): WhatsAppPayload {
  const defaultAppUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '');
  let targetBaseUrl = baseUrl || (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : defaultAppUrl);
  const formattedPhone = formatWhatsAppPhone(group.parentPhone);

  const childLinksText = group.wardIds
    .map((wardId) => {
      const student = students.find((s) => s.id === wardId);
      const studentName = student ? student.fullName : 'Student';
      const admissionNo = student ? student.admissionNo : wardId;
      const reportUrl = `${targetBaseUrl}/dashboard/results?studentId=${wardId}`;

      return `• *${studentName}* (${admissionNo})\n  📄 View Report: ${reportUrl}`;
    })
    .join('\n\n');

  const text = `Assalamu Alaikum Mallam/Hajiya *${group.parentName}*,

Official Report Card from:
*Markazu Umar bn Khattab Tahfizul Qur'an & Islamic Studies School* Kano

📌 *Session:* ${sessionName}
📌 *Term:* ${term}

*Child Report Card Link:*
${childLinksText}

_Note: This report link is strictly confidential and generated for ${group.parentName} only._

Management Office
Markazu Umar Islamiyyah, Kano`;

  const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;

  return {
    parentId: group.parentId,
    parentName: group.parentName,
    parentPhone: group.parentPhone,
    formattedPhone,
    wardNames: group.wardNames,
    messageText: text,
    whatsappUrl,
  };
}

/**
 * Build Targeted Announcement WhatsApp Payload for Parents
 * ENFORCES: Messages sent to parents only affect their own child's class/programme or general school notices
 */
export function buildAnnouncementWhatsAppPayload(
  parent: Parent,
  subject: string,
  content: string,
  students: Student[]
): WhatsAppPayload {
  const formattedPhone = formatWhatsAppPhone(parent.phone);
  const children = students.filter(
    (s) => s.guardianId === parent.id || s.guardianName.toLowerCase() === parent.fullName.toLowerCase()
  );
  const childNames = children.map((w) => w.fullName);
  const childLabel = childNames.length > 0 ? ` (Child: ${childNames.join(', ')})` : '';

  const plainContent = content.replace(/<[^>]*>?/gm, '').trim();

  const text = `Assalamu Alaikum *${parent.fullName}*${childLabel},

Important School Notice from:
*Markazu Umar bn Khattab Tahfizul Qur'an & Islamic Studies School* Kano

📌 *Subject:* ${subject}

${plainContent}

For inquiries, contact Management: 08167109421
_Markazu Umar Islamiyyah Office_`;

  const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;

  return {
    parentId: parent.id,
    parentName: parent.fullName,
    parentPhone: parent.phone,
    formattedPhone,
    wardNames: childNames.length > 0 ? childNames : ['Enrolled Child'],
    messageText: text,
    whatsappUrl,
  };
}
