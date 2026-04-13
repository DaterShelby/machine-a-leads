/**
 * Email Service
 *
 * Sends emails via Brevo (formerly Sendinblue) API v3
 * Endpoint: https://api.brevo.com/v3/smtp/email
 */

import {
  EmailParams,
  EmailResult,
  BatchResult,
  EmailTemplate,
  EmailEvent,
  Lead,
} from '@/types';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@machinealeads.fr';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Machine a Leads';
const RGPD_UNSUBSCRIBE_URL = process.env.RGPD_UNSUBSCRIBE_URL;

/**
 * Logs messages with service context
 */
function log(message: string, data?: any) {
  console.log(`[Email] ${message}`, data || '');
}

function logError(message: string, error?: any) {
  console.error(`[Email] ERROR: ${message}`, error || '');
}

/**
 * Validates required environment variables
 */
function validateConfig() {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY environment variable is required');
  }
}

/**
 * Sends a single email via Brevo API
 *
 * @param params - Email parameters
 * @returns Result object with messageId and success status
 * @throws Error if the request fails
 */
export async function sendEmail(params: EmailParams): Promise<EmailResult> {
  try {
    validateConfig();

    log(`Sending email to ${params.to.email}`);

    const payload = {
      to: [
        {
          email: params.to.email,
          name: params.to.name || '',
        },
      ],
      sender: {
        email: params.sender.email || BREVO_SENDER_EMAIL,
        name: params.sender.name || BREVO_SENDER_NAME,
      },
      subject: params.subject,
      htmlContent: addUnsubscribeLink(params.htmlContent),
      textContent: params.textContent,
      replyTo: params.replyTo
        ? {
            email: params.replyTo.email,
            name: params.replyTo.name,
          }
        : undefined,
      tags: params.tags || [],
      templateId: params.templateId,
      params: params.templateParams,
    };

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Brevo API error: ${response.status} ${JSON.stringify(errorData)}`
      );
    }

    const result = await response.json();

    log(`Email sent successfully to ${params.to.email}`, {
      messageId: result.messageId,
    });

    return {
      messageId: result.messageId,
      success: true,
    };
  } catch (error) {
    logError(`Failed to send email to ${params.to.email}`, error);

    return {
      messageId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Adds RGPD-compliant unsubscribe link to email HTML content
 *
 * @param htmlContent - Original HTML content
 * @returns HTML with unsubscribe footer
 */
function addUnsubscribeLink(htmlContent: string): string {
  if (!RGPD_UNSUBSCRIBE_URL) {
    return htmlContent;
  }

  const unsubscribeHtml = `
    <hr style="margin-top: 40px; border: none; border-top: 1px solid #ccc;">
    <p style="font-size: 12px; color: #999; margin-top: 20px;">
      Conformément à la loi RGPD, vous pouvez <a href="${RGPD_UNSUBSCRIBE_URL}" style="color: #999;">
      vous désinscrire</a> de nos communications à tout moment.
    </p>
  `;

  return htmlContent + unsubscribeHtml;
}

/**
 * Sends emails to multiple leads in batches
 *
 * @param leads - Array of leads to email
 * @param templateId - Brevo template ID
 * @param templateParams - Template variables
 * @returns Batch result with success/failure counts
 */
export async function sendBatchEmails(
  leads: Lead[],
  templateId: string,
  templateParams: Record<string, string> = {}
): Promise<BatchResult> {
  try {
    log(`Sending batch emails to ${leads.length} leads`);

    const results = {
      total: leads.length,
      sent: 0,
      failed: 0,
      errors: [] as Array<{ leadId: string; error: string }>,
    };

    for (const lead of leads) {
      if (!lead.email) {
        results.failed++;
        results.errors.push({
          leadId: lead.id,
          error: 'No email address',
        });
        continue;
      }

      const result = await sendEmail({
        to: {
          email: lead.email,
          name: lead.id,
        },
        subject: 'Nouvelle opportunité de propriété',
        htmlContent: `<p>Une propriété intéressante correspondant à votre profil a été trouvée.</p>`,
        sender: {
          email: BREVO_SENDER_EMAIL,
          name: BREVO_SENDER_NAME,
        },
        tags: ['batch-campaign'],
        templateId,
        templateParams,
      });

      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push({
          leadId: lead.id,
          error: result.error || 'Unknown error',
        });
      }
    }

    log(`Batch email complete: ${results.sent} sent, ${results.failed} failed`);
    return results;
  } catch (error) {
    logError('Batch email failed', error);
    throw error;
  }
}

/**
 * Renders a template with variables
 *
 * @param template - Email template
 * @param variables - Template variable values
 * @returns Rendered HTML content
 */
export function renderTemplate(
  template: EmailTemplate,
  variables: Record<string, string>
): string {
  try {
    log(`Rendering template: ${template.name}`);

    let htmlContent = template.htmlContent;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      htmlContent = htmlContent.replaceAll(placeholder, value);
    }

    return htmlContent;
  } catch (error) {
    logError(`Failed to render template: ${template.name}`, error);
    throw error;
  }
}

/**
 * In-memory event tracker (replace with database in production)
 */
const emailEvents = new Map<string, EmailEvent[]>();

/**
 * Tracks email events (opens, clicks, bounces, etc.)
 *
 * @param event - Email event to track
 */
export async function trackEmailEvent(event: EmailEvent): Promise<void> {
  try {
    log(`Tracking event: ${event.type} for lead ${event.leadId}`);

    const key = `${event.campaignId}_${event.leadId}`;
    const events = emailEvents.get(key) || [];
    events.push(event);
    emailEvents.set(key, events);

    // TODO: Store in database for analytics
    // This could be sent to a logging service or stored in PostgreSQL/MongoDB
  } catch (error) {
    logError('Failed to track email event', error);
  }
}

/**
 * Schedules a follow-up email for later
 *
 * @param leadId - ID of the lead
 * @param sequenceStep - Step in the email sequence
 * @param delayDays - Number of days to delay
 */
export async function scheduleFollowUp(
  leadId: string,
  sequenceStep: number,
  delayDays: number
): Promise<void> {
  try {
    log(`Scheduling follow-up for lead ${leadId}`, {
      step: sequenceStep,
      delayDays,
    });

    const scheduledTime = new Date();
    scheduledTime.setDate(scheduledTime.getDate() + delayDays);

    // TODO: Implement with job queue (Bull, RabbitMQ, etc.)
    // For now, just log the intent

    log(`Follow-up scheduled for ${scheduledTime.toISOString()}`);
  } catch (error) {
    logError(`Failed to schedule follow-up for lead ${leadId}`, error);
    throw error;
  }
}

/**
 * Retrieves email events for a lead
 *
 * @param campaignId - Campaign ID
 * @param leadId - Lead ID
 * @returns Array of email events
 */
export function getEmailEvents(campaignId: string, leadId: string): EmailEvent[] {
  const key = `${campaignId}_${leadId}`;
  return emailEvents.get(key) || [];
}

/**
 * Gets email statistics for a campaign
 */
export function getEmailStats(campaignId: string): {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
} {
  let stats = {
    total: 0,
    sent: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
  };

  for (const [key, events] of emailEvents.entries()) {
    if (key.startsWith(campaignId)) {
      for (const event of events) {
        if (event.type === 'sent') stats.sent++;
        if (event.type === 'opened') stats.opened++;
        if (event.type === 'clicked') stats.clicked++;
        if (event.type === 'bounced') stats.bounced++;
      }
    }
  }

  stats.total = stats.sent;
  return stats;
}

export type { EmailParams, EmailResult, BatchResult, EmailTemplate, EmailEvent };
