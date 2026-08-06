import {
  CommunicationMessage,
  CommunicationSettings,
  DeliveryChannel,
  InAppNotification,
  QueueItem,
  SmartParentGroup,
} from '../types/communication';
import { Student, Parent, Teacher, User } from '../types';

export interface INotificationProvider {
  channel: DeliveryChannel;
  send(message: CommunicationMessage, recipient: { id: string; name: string; contact: string; role: string }): Promise<{ success: boolean; errorTrace?: string }>;
}

export class EmailProvider implements INotificationProvider {
  channel: DeliveryChannel = 'EMAIL';

  async send(
    message: CommunicationMessage,
    recipient: { id: string; name: string; contact: string; role: string },
    settings?: CommunicationSettings
  ): Promise<{ success: boolean; errorTrace?: string }> {
    try {
      // Simulate HTML Email Template Generation
      const htmlBody = this.generateHtmlEmail(message, recipient, settings);
      console.log(`[EmailProvider] Sent HTML Email to ${recipient.contact} (${recipient.name})`);
      return { success: true };
    } catch (err: any) {
      return { success: false, errorTrace: err.message || 'SMTP Connection Error' };
    }
  }

  generateHtmlEmail(
    message: CommunicationMessage,
    recipient: { name: string; contact: string },
    settings?: CommunicationSettings
  ): string {
    const logoUrl = settings?.schoolLogo || '/logo.png';
    const schoolName = 'Markazu Umar bn Khattab Tahfizul Qur\'an & Islamic Studies School';
    const schoolAddress = 'Kano, Nigeria';
    const signature = settings?.defaultSignature || 'Management Office\nMarkazu Umar Islamiyyah';
    const footer = settings?.footerText || 'Official Communication • Markazu Umar bn Khattab School, Kano';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #042f1e 0%, #064e3b 100%); padding: 30px; text-align: center; color: #ffffff; }
          .logo { max-height: 65px; margin-bottom: 12px; }
          .title { font-size: 20px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .subtitle { font-size: 12px; color: #fef3c7; margin-top: 4px; font-weight: 600; }
          .body { padding: 32px; font-size: 14px; line-height: 1.7; }
          .greeting { font-size: 16px; font-weight: 700; color: #064e3b; margin-bottom: 16px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; background-color: #fef3c7; color: #92400e; margin-bottom: 16px; }
          .attachments { margin-top: 24px; padding: 16px; background-color: #f8fafc; border-radius: 12px; border: 1px border-dashed #cbd5e1; }
          .footer { background-color: #021810; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="School Crest" class="logo" />
            <h1 class="title">${schoolName}</h1>
            <div class="subtitle">${schoolAddress}</div>
          </div>
          <div class="body">
            <span class="badge">${message.type.replace('_', ' ')}</span>
            <div class="greeting">Assalamu Alaikum, ${recipient.name}</div>
            <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 0;">${message.subject}</h2>
            <div>${message.content}</div>
            
            ${message.attachments && message.attachments.length > 0 ? `
              <div class="attachments">
                <strong>📎 Official Documents & Attachments (${message.attachments.length}):</strong>
                <ul>
                  ${message.attachments.map(a => `<li><a href="${a.url}">${a.name} (${a.size})</a></li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <div style="margin-top: 30px; pt: 20px; border-top: 1px solid #e2e8f0; white-space: pre-line;">
              <strong>Warm regards,</strong><br/>
              ${signature}
            </div>
          </div>
          <div class="footer">
            ${footer}<br/>
            Contact: ${settings?.schoolEmail || 'info@markazuumar.edu.ng'} | WhatsApp: ${settings?.schoolWhatsApp || '+234 816 710 9421'}
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export class WhatsAppProvider implements INotificationProvider {
  channel: DeliveryChannel = 'WHATSAPP';

  async send(
    message: CommunicationMessage,
    recipient: { id: string; name: string; contact: string; role: string },
    settings?: CommunicationSettings
  ): Promise<{ success: boolean; errorTrace?: string }> {
    try {
      const text = this.generateWhatsAppText(message, recipient, settings);
      console.log(`[WhatsAppProvider] Sent WhatsApp message to ${recipient.contact} (${recipient.name})`);
      return { success: true };
    } catch (err: any) {
      return { success: false, errorTrace: err.message || 'WhatsApp API Timeout' };
    }
  }

  generateWhatsAppText(
    message: CommunicationMessage,
    recipient: { name: string; contact: string },
    settings?: CommunicationSettings
  ): string {
    const attachmentsText = message.attachments && message.attachments.length > 0
      ? `\n\n📄 *Attached Files (${message.attachments.length}):*\n` + message.attachments.map(a => `• ${a.name}`).join('\n')
      : '';

    return `Assalamu Alaikum.

Dear ${recipient.name},

Please find attached today's official communication from:
*Markazu Umar bn Khattab Tahfizul Qur'an & Islamic Studies School*

*Category:* ${message.type.replace('_', ' ')}
*Subject:* ${message.subject}

${message.plainContent || message.content.replace(/<[^>]*>?/gm, '')}${attachmentsText}

Thank you.
_Management Office, Markazu Umar Islamiyyah_`;
  }
}

export class InAppProvider implements INotificationProvider {
  channel: DeliveryChannel = 'IN_APP';

  async send(
    message: CommunicationMessage,
    recipient: { id: string; name: string; contact: string; role: string }
  ): Promise<{ success: boolean; errorTrace?: string }> {
    try {
      console.log(`[InAppProvider] Created notification for user ${recipient.id} (${recipient.name})`);
      return { success: true };
    } catch (err: any) {
      return { success: false, errorTrace: err.message || 'Internal Inbox Error' };
    }
  }
}

export class DashboardProvider implements INotificationProvider {
  channel: DeliveryChannel = 'DASHBOARD';

  async send(
    message: CommunicationMessage,
    recipient: { id: string; name: string; contact: string; role: string }
  ): Promise<{ success: boolean; errorTrace?: string }> {
    try {
      console.log(`[DashboardProvider] Published Notice Board widget card for ${recipient.role}`);
      return { success: true };
    } catch (err: any) {
      return { success: false, errorTrace: err.message || 'Dashboard Notice Error' };
    }
  }
}

export class NotificationService {
  private providers: Map<DeliveryChannel, INotificationProvider> = new Map();

  constructor() {
    this.registerProvider(new EmailProvider());
    this.registerProvider(new WhatsAppProvider());
    this.registerProvider(new InAppProvider());
    this.registerProvider(new DashboardProvider());
  }

  public registerProvider(provider: INotificationProvider) {
    this.providers.set(provider.channel, provider);
  }

  public getProvider(channel: DeliveryChannel): INotificationProvider | undefined {
    return this.providers.get(channel);
  }

  /**
   * SMART PARENT GROUPING ENGINE
   * Combines all children belonging to the same parent so that ONLY ONE WhatsApp/Email/Notification
   * is generated containing all attached Report Sheets or notices.
   */
  public static groupParentsWithMultipleWards(students: Student[], parents: Parent[]): SmartParentGroup[] {
    const parentMap = new Map<string, SmartParentGroup>();

    students.forEach((student) => {
      const parent = parents.find(
        (p) => p.id === student.guardianId || p.fullName.toLowerCase() === student.guardianName.toLowerCase()
      );

      const parentKey = parent ? parent.id : `phone-${student.guardianPhone || student.guardianName}`;
      const parentName = parent ? parent.fullName : student.guardianName;
      const parentEmail = parent ? parent.email : `${student.admissionNo.toLowerCase()}@parent.markazu.edu.ng`;
      const parentPhone = parent ? parent.phone : student.guardianPhone;

      if (!parentMap.has(parentKey)) {
        parentMap.set(parentKey, {
          parentId: parentKey,
          parentName: parentName,
          parentEmail: parentEmail,
          parentPhone: parentPhone,
          wardIds: [student.id],
          wardNames: [student.fullName],
          reportCardsCount: 1,
        });
      } else {
        const existing = parentMap.get(parentKey)!;
        if (!existing.wardIds.includes(student.id)) {
          existing.wardIds.push(student.id);
          existing.wardNames.push(student.fullName);
          existing.reportCardsCount += 1;
        }
      }
    });

    return Array.from(parentMap.values());
  }
}
