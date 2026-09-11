export interface EmailPayload {
  to: string;
  recipientName: string;
  subject: string;
  template: 'WELCOME_NEW_ACCOUNT' | 'PASSWORD_RESET_REQUEST' | 'PASSWORD_CHANGED_CONFIRMATION' | 'ACCOUNT_LOCKOUT_ALERT' | 'ACCOUNT_UNLOCKED';
  metadata?: {
    username?: string;
    tempPassword?: string;
    resetToken?: string;
    portalUrl?: string;
    supportContact?: string;
    lockoutDurationMinutes?: number;
    role?: string;
    assignedProgramme?: string;
    email?: string;
    loginUrl?: string;
  };
}

/**
 * Client-Safe System Email Dispatcher
 * Dispatches emails by posting to the secure server API endpoint /api/email/send.
 * Contains ZERO Node.js dependencies, ensuring Webpack never attempts to bundle
 * nodemailer, fs, net, or tls into the browser bundle.
 */
export async function sendSystemEmail(payload: EmailPayload): Promise<{ success: boolean; messageId: string; error?: string }> {
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  try {
    if (!payload.metadata) payload.metadata = {};
    if (typeof window !== 'undefined' && (!payload.metadata.portalUrl || payload.metadata.portalUrl.includes('vercel.app'))) {
      payload.metadata.portalUrl = window.location.origin;
    }
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-system-api-key': process.env.SYSTEM_API_SECRET || 'MARKAZU_UMAR_INTERNAL_SECRET_2026',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (result.success) {
      return { success: true, messageId: result.messageId || messageId };
    } else {
      return { success: false, messageId, error: result.error };
    }
  } catch (err: any) {
    return { success: false, messageId, error: err.message };
  }
}
