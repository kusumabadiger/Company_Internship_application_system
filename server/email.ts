import 'dotenv/config';
import { ApplicationRecord, EmailJobRecord, EmailType, EmailStatus } from './types';

export interface EmailSendResult {
  status: EmailStatus;
  providerMessageId?: string;
  errorMessage?: string;
}

/**
 * Reads dynamic environment configuration at dispatch time.
 */
export function getEmailConfig() {
  const apiKey = (process.env.EMAIL_PROVIDER_API_KEY || process.env.RESEND_API_KEY || '').trim();
  const rawFrom = (process.env.EMAIL_FROM || '').trim();
  // If user configures a verified custom domain, use it.
  // Otherwise, Resend requires onboarding@resend.dev during testing with unverified domains.
  const emailFrom = rawFrom || 'Company Tech <onboarding@resend.dev>';
  const supportEmail = (process.env.SUPPORT_EMAIL || 'hr-support@companytech.internal').trim();
  const frontendUrl = (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000').trim();

  return { apiKey, emailFrom, supportEmail, frontendUrl };
}

/**
 * Privacy-safe email masking for server logs (never logs raw email or secrets).
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

/**
 * Renders centralized email templates for Company Tech.
 */
export function renderEmailTemplate(
  type: EmailType,
  app: ApplicationRecord,
  trackingToken?: string
): { subject: string; html: string; text: string } {
  const { frontendUrl } = getEmailConfig();
  const token = trackingToken || app.trackingToken || 'CT-TOKEN';
  const trackUrl = `${frontendUrl}/track?id=${encodeURIComponent(app.applicationId)}&token=${encodeURIComponent(token)}`;

  switch (type) {
    case 'applicant_confirmation':
      return {
        subject: `Application Received: ${app.internshipRole} Internship — Company Tech`,
        text: `Dear ${app.fullName},

Thank you for applying for the ${app.internshipRole} internship at Company Tech.

Your application reference ID is: ${app.applicationId}
Current Status: ${app.status}

You can securely track your application status at any time using your tracking token:
${trackUrl}

Our admissions team will review your application. We will communicate the outcome directly to your email.

Regards,
HR Support and Admissions
Company Tech`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #0f172a; font-size: 20px; letter-spacing: 0.5px;">COMPANY TECH</h2>
    <span style="font-size: 12px; color: #64748b; font-weight: 600;">INTERNSHIP AUTOMATION SYSTEM</span>
  </div>
  <p style="font-size: 15px; line-height: 1.5;">Dear <strong>${app.fullName}</strong>,</p>
  <p style="font-size: 15px; line-height: 1.5;">Thank you for submitting your application for the <strong>${app.internshipRole}</strong> internship at Company Tech.</p>
  
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
    <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">Application Reference</div>
    <div style="font-size: 18px; font-weight: 700; color: #0f172a; font-family: monospace;">${app.applicationId}</div>
    <div style="margin-top: 10px; font-size: 13px; color: #64748b;">Current Status: <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background-color: #fef3c7; color: #92400e; font-weight: 600;">Pending Review</span></div>
  </div>

  <p style="font-size: 14px; line-height: 1.5; color: #475569;">
    You can securely track your application progress without exposing personal data by using your secure tracking token:
  </p>
  <p style="margin: 20px 0;">
    <a href="${trackUrl}" style="background-color: #0f172a; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">Track Application Status</a>
  </p>

  <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
    Best regards,<br />
    <strong>HR Support and Admissions</strong><br />
    Company Tech
  </p>
</div>`,
      };

    case 'support_notification':
      return {
        subject: `[New Application] ${app.internshipRole} — ${app.fullName} (${app.applicationId})`,
        text: `New Internship Application Received:

Application ID: ${app.applicationId}
Applicant Name: ${app.fullName}
Email: ${app.email}
College: ${app.college}
Year of Study: ${app.pursuingYear}
Experience Level: ${app.experienceLevel}
Internship Role: ${app.internshipRole}
Submission Time: ${app.submittedAt}

Review in Admin Dashboard:
${frontendUrl}/admin/applications/${app.applicationId}`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h3 style="color: #0f172a; margin-top: 0;">New Internship Application Submitted</h3>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
    <tr><td style="padding: 6px 0; color: #64748b; width: 140px;">Application ID:</td><td><strong>${app.applicationId}</strong></td></tr>
    <tr><td style="padding: 6px 0; color: #64748b;">Candidate Name:</td><td>${app.fullName}</td></tr>
    <tr><td style="padding: 6px 0; color: #64748b;">Email Address:</td><td>${app.email}</td></tr>
    <tr><td style="padding: 6px 0; color: #64748b;">Institution:</td><td>${app.college} (${app.pursuingYear})</td></tr>
    <tr><td style="padding: 6px 0; color: #64748b;">Experience:</td><td>${app.experienceLevel}</td></tr>
    <tr><td style="padding: 6px 0; color: #64748b;">Internship Role:</td><td><strong>${app.internshipRole}</strong></td></tr>
    <tr><td style="padding: 6px 0; color: #64748b;">Submitted At:</td><td>${app.submittedAt}</td></tr>
  </table>
  <div style="margin-top: 20px;">
    <a href="${frontendUrl}/admin/applications/${app.applicationId}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">View in Admin Center</a>
  </div>
</div>`,
      };

    case 'acceptance_offer':
      return {
        subject: `Congratulations! Internship Offer from Company Tech — ${app.internshipRole}`,
        text: `Dear ${app.fullName},

Congratulations! Following a comprehensive review of your application, Company Tech is pleased to offer you the ${app.internshipRole} internship.

Key Particulars:
- Role: ${app.internshipRole}
- Duration: ${app.internshipDuration || '1 month'}
- Joining Date: ${app.joiningDate || 'As agreed'}
- Application Reference: ${app.applicationId}

Your official Internship Offer Letter PDF has been generated and attached to this email. You can also view or download it at any time from your tracking portal:
${trackUrl}

Please review the attached offer letter for complete instructions.

Sincerely,
HR Support and Co-Founder
Company Tech`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="border-bottom: 2px solid #16a34a; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #0f172a; font-size: 20px;">COMPANY TECH</h2>
    <span style="font-size: 12px; color: #16a34a; font-weight: 600;">INTERNSHIP OFFER EXTENDED</span>
  </div>
  <p style="font-size: 15px; line-height: 1.5;">Dear <strong>${app.fullName}</strong>,</p>
  <p style="font-size: 15px; line-height: 1.5;">Congratulations! We are delighted to inform you that you have been selected for the <strong>${app.internshipRole}</strong> internship at Company Tech.</p>
  
  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 20px 0; color: #166534;">
    <div style="font-weight: 700; margin-bottom: 8px; font-size: 14px;">Internship Particulars:</div>
    <div style="font-size: 13px; line-height: 1.6;">
      • <strong>Role:</strong> ${app.internshipRole}<br />
      • <strong>Duration:</strong> ${app.internshipDuration || '1 month'}<br />
      • <strong>Joining Date:</strong> ${app.joiningDate || 'As agreed'}<br />
      • <strong>Application Reference:</strong> ${app.applicationId}
    </div>
  </div>

  <p style="font-size: 14px; line-height: 1.5; color: #475569;">
    Your official <strong>Internship Offer Letter PDF</strong> has been generated and attached to this message. You can also view or download it at any time from your tracking portal.
  </p>

  <p style="margin: 20px 0;">
    <a href="${trackUrl}" style="background-color: #16a34a; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">View in Candidate Portal</a>
  </p>

  <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
    Sincerely,<br />
    <strong>HR Support and Co-Founder</strong><br />
    Company Tech
  </p>
</div>`,
      };

    case 'rejection_notice':
      return {
        subject: `Update on Your Internship Application — Company Tech`,
        text: `Dear ${app.fullName},

Thank you for applying for the ${app.internshipRole} internship at Company Tech.

We appreciate the time and effort you invested in your application. After reviewing your application, we regret to inform you that we are unable to proceed with your application at this time.

Thank you for your interest in Company Tech. We wish you the best in your academic and professional journey.

Regards,  
HR Support and Co-Founder  
Company Tech`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #0f172a; font-size: 20px;">COMPANY TECH</h2>
    <span style="font-size: 12px; color: #64748b; font-weight: 600;">APPLICATION STATUS UPDATE</span>
  </div>
  <p style="font-size: 15px; line-height: 1.5;">Dear <strong>${app.fullName}</strong>,</p>
  <p style="font-size: 15px; line-height: 1.6;">Thank you for applying for the <strong>${app.internshipRole}</strong> internship at Company Tech.</p>
  <p style="font-size: 15px; line-height: 1.6;">We appreciate the time and effort you invested in your application. After reviewing your application, we regret to inform you that we are unable to proceed with your application at this time.</p>
  <p style="font-size: 15px; line-height: 1.6;">Thank you for your interest in Company Tech. We wish you the best in your academic and professional journey.</p>
  <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
    Regards,<br />
    <strong>HR Support and Co-Founder</strong><br />
    Company Tech
  </p>
  <div style="font-size: 11px; color: #94a3b8; margin-top: 16px;">
    Note: This is a demonstration notification template configured for Company Tech's prototype system.
  </div>
</div>`,
      };
  }
}

/**
 * Dispatches an email via Resend API or logs clear failure if unconfigured.
 * Never prints or leaks secrets, and masks recipient email addresses in logs.
 */
export async function sendEmailJob(
  type: EmailType,
  app: ApplicationRecord,
  trackingToken?: string,
  pdfAttachmentBuffer?: Buffer
): Promise<EmailSendResult> {
  const { apiKey, emailFrom, supportEmail } = getEmailConfig();
  const { subject, html, text } = renderEmailTemplate(type, app, trackingToken);
  const recipient = type === 'support_notification' ? supportEmail : app.email;
  const masked = maskEmail(recipient);

  console.log(`[Email Dispatch] Triggering ${type} for app ${app.applicationId} -> ${masked}`);

  // Check if live Resend API key is configured
  const hasValidKey = apiKey && apiKey.startsWith('re_') && apiKey !== 're_sample_api_key_here';

  if (!hasValidKey) {
    const errorMsg = 'EMAIL_PROVIDER_API_KEY (Resend API key starting with re_) is not configured in environment variables. Email was not dispatched to external inbox.';
    console.warn(`[Email Dispatch WARNING] ${errorMsg}`);
    return {
      status: 'failed',
      errorMessage: errorMsg,
    };
  }

  try {
    const payload: Record<string, unknown> = {
      from: emailFrom,
      to: [recipient],
      subject,
      html,
      text,
    };

    if (pdfAttachmentBuffer && type === 'acceptance_offer') {
      payload.attachments = [
        {
          filename: `Company-Tech-Offer-Letter-${app.applicationId}.pdf`,
          content: pdfAttachmentBuffer.toString('base64'),
        },
      ];
      console.log(`[Email Dispatch] Attached PDF offer letter (${pdfAttachmentBuffer.length} bytes) to ${type}`);
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text();
      let parsedError = errBody;
      try {
        const jsonErr = JSON.parse(errBody);
        parsedError = jsonErr.message || errBody;
      } catch {
        // ignore
      }

      console.error(`[Email Dispatch ERROR] Provider returned HTTP ${response.status} for ${masked}: ${parsedError}`);
      return {
        status: 'failed',
        errorMessage: `Provider HTTP ${response.status}: ${parsedError}`,
      };
    }

    const data = (await response.json()) as { id?: string };
    const providerMessageId = data.id || `resend_${Date.now()}`;
    console.log(`[Email Dispatch SUCCESS] Provider confirmed delivery of ${type} to ${masked}. Message ID: ${providerMessageId}`);

    return {
      status: 'sent',
      providerMessageId,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown network failure communicating with email provider';
    console.error(`[Email Dispatch ERROR] Network exception for ${masked}:`, errMsg);
    return {
      status: 'failed',
      errorMessage: errMsg,
    };
  }
}
