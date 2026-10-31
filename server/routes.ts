import express, { Request, Response } from 'express';
import { DB, generateApplicationId, generateTrackingToken, hashToken } from './db';
import { generateOfferLetterPdf } from './pdf';
import { sendEmailJob, renderEmailTemplate } from './email';
import { ApplicationRecord, EmailJobRecord, ExperienceLevel } from './types';

const router = express.Router();

const VALID_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full-Stack Developer',
  'AI/ML Engineer',
  'UI/UX Designer',
  'Graphic Designer',
  'Digital Marketing Intern',
  'Social Media Manager',
  'Content Writer',
  'Business Development Intern',
  'Community Manager',
  'HR Intern',
];

const VALID_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Graduate / Postgraduate',
];

/**
 * Public: Submit a new internship application
 */
router.post('/applications', async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      email,
      college,
      pursuingYear,
      experienceLevel,
      internshipRole,
      resumeBase64,
      resumeName,
    } = req.body;

    // Server-side validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0 || fullName.length > 100) {
      return res.status(400).json({ error: 'Full name is required (max 100 characters).' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim()) || email.length > 120) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!college || typeof college !== 'string' || college.trim().length === 0 || college.length > 150) {
      return res.status(400).json({ error: 'College or institution name is required (max 150 characters).' });
    }

    if (!VALID_YEARS.includes(pursuingYear)) {
      return res.status(400).json({ error: 'Please select a valid current year of study.' });
    }

    if (experienceLevel !== 'Fresher' && experienceLevel !== 'Experienced') {
      return res.status(400).json({ error: 'Experience level must be either Fresher or Experienced.' });
    }

    if (!VALID_ROLES.includes(internshipRole)) {
      return res.status(400).json({ error: 'Please select a valid Company Tech internship role.' });
    }

    // Optional resume validation: check size (< 5MB)
    if (resumeBase64 && typeof resumeBase64 === 'string') {
      const approxSizeBytes = (resumeBase64.length * 3) / 4;
      if (approxSizeBytes > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'Resume file size exceeds the 5 MB limit.' });
      }
    }

    // Generate unique ID & secure tracking token
    const applicationId = generateApplicationId();
    const trackingToken = generateTrackingToken();
    const trackingTokenHash = hashToken(trackingToken);
    const submittedAt = new Date().toISOString();

    const newApp: ApplicationRecord = {
      applicationId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      college: college.trim(),
      pursuingYear,
      experienceLevel: experienceLevel as ExperienceLevel,
      internshipRole,
      resumeName: resumeName ? String(resumeName).substring(0, 100) : null,
      resumePath: resumeBase64 ? `resumes/${applicationId}/${resumeName || 'resume.pdf'}` : null,
      resumeBase64: resumeBase64 || null,
      submittedAt,
      status: 'Pending',
      trackingToken,
      trackingTokenHash,
      schemaVersion: 1,
      emailJobs: [],
    };

    // Save to database
    DB.save(newApp);

    // Trigger Email A: Applicant confirmation
    const applicantJobId = `job_conf_${Date.now()}`;
    const applicantSendResult = await sendEmailJob('applicant_confirmation', newApp, trackingToken);
    const applicantJob: EmailJobRecord = {
      jobId: applicantJobId,
      applicationId,
      emailType: 'applicant_confirmation',
      recipient: newApp.email,
      status: applicantSendResult.status,
      attemptCount: 1,
      providerMessageId: applicantSendResult.providerMessageId,
      createdAt: new Date().toISOString(),
      errorMessage: applicantSendResult.errorMessage,
    };
    DB.addEmailJob(applicantJob);

    // Trigger Email B: Support notification
    const supportJobId = `job_notif_${Date.now()}`;
    const supportSendResult = await sendEmailJob('support_notification', newApp);
    const supportJob: EmailJobRecord = {
      jobId: supportJobId,
      applicationId,
      emailType: 'support_notification',
      recipient: process.env.SUPPORT_EMAIL || 'hr-support@companytech.internal',
      status: supportSendResult.status,
      attemptCount: 1,
      providerMessageId: supportSendResult.providerMessageId,
      createdAt: new Date().toISOString(),
      errorMessage: supportSendResult.errorMessage,
    };
    DB.addEmailJob(supportJob);

    return res.status(201).json({
      success: true,
      applicationId,
      trackingToken,
      internshipRole,
      status: 'Pending',
      submittedAt,
      message: 'Application successfully registered with Company Tech.',
    });
  } catch (err) {
    console.error('Error submitting application:', err);
    return res.status(500).json({ error: 'Internal server error while processing your application.' });
  }
});

/**
 * Public: Secure applicant tracking
 * Strict security per PRD Section 15: requires valid Application ID AND secret tracking token.
 */
router.post('/applications/track', (req: Request, res: Response) => {
  const { applicationId, token } = req.body;

  if (!applicationId || !token) {
    return res.status(400).json({
      error: 'Both Application Reference ID and your secure Tracking Token are required to check status.',
    });
  }

  const app = DB.getByToken(String(applicationId).trim(), String(token).trim());

  if (!app) {
    return res.status(404).json({
      error: 'No application was found matching this Application ID and Tracking Token combination. Please verify your credentials.',
    });
  }

  // Section 15.3: Return only minimal needed info without exposing private resume, admin notes, or internal secrets
  return res.json({
    applicationId: app.applicationId,
    fullName: app.fullName,
    internshipRole: app.internshipRole,
    submissionDate: app.submittedAt,
    status: app.status,
    decisionDate: app.decisionAt || null,
    joiningDate: app.joiningDate || null,
    internshipDuration: app.internshipDuration || null,
    offerLetterAvailable: app.status === 'Accepted' && app.offerLetterGenerationStatus === 'generated',
    offerLetterUrl:
      app.status === 'Accepted' && app.offerLetterGenerationStatus === 'generated'
        ? `/api/admin/applications/${app.applicationId}/offer-letter?token=${encodeURIComponent(token)}`
        : null,
  });
});

/**
 * Admin: Get all applications with filters, search, and real stats
 */
router.get('/admin/applications', (req: Request, res: Response) => {
  try {
    const { search, status, role } = req.query;
    let list = DB.getAll();

    if (status && status !== 'all') {
      list = list.filter((a) => a.status.toLowerCase() === String(status).toLowerCase());
    }

    if (role && role !== 'all') {
      list = list.filter((a) => a.internshipRole === String(role));
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.applicationId.toLowerCase().includes(q) ||
          a.fullName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.college.toLowerCase().includes(q)
      );
    }

    const stats = DB.getStats();

    return res.json({
      stats,
      applications: list,
    });
  } catch (err) {
    console.error('Error fetching admin applications:', err);
    return res.status(500).json({ error: 'Failed to retrieve applications.' });
  }
});

/**
 * Admin: Get single application details
 */
router.get('/admin/applications/:id', (req: Request, res: Response) => {
  const app = DB.getById(req.params.id);
  if (!app) {
    return res.status(404).json({ error: 'Application not found.' });
  }
  return res.json(app);
});

/**
 * Admin: Accept application workflow
 * Concurrency safe, requires duration & joining date (not in past), generates PDF, sends email
 */
router.post('/admin/applications/:id/accept', async (req: Request, res: Response) => {
  try {
    const { duration, joiningDate } = req.body;

    const allowedDurations = ['1 month', '2 months', '3 months'];
    if (!allowedDurations.includes(duration)) {
      return res.status(400).json({ error: 'Please specify a duration: 1 month, 2 months, or 3 months.' });
    }

    if (!joiningDate || isNaN(Date.parse(joiningDate))) {
      return res.status(400).json({ error: 'A valid joining date is required.' });
    }

    // Joining date validation: must not be in past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(joiningDate);
    if (targetDate < today) {
      return res.status(400).json({ error: 'Joining date cannot be set in the past.' });
    }

    const current = DB.getById(req.params.id);
    if (!current) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    if (current.status !== 'Pending') {
      return res.status(409).json({
        error: `Cannot accept: Application has already been finalized as '${current.status}'.`,
      });
    }

    // Generate real PDF offer letter using pdf-lib
    const tempAppForPdf = {
      ...current,
      status: 'Accepted' as const,
      internshipDuration: duration,
      joiningDate,
    };

    let pdfBuffer: Buffer | null = null;
    let pdfBase64 = '';
    try {
      pdfBuffer = await generateOfferLetterPdf(tempAppForPdf);
      pdfBase64 = pdfBuffer.toString('base64');
    } catch (pdfErr) {
      console.error('Error generating PDF offer letter:', pdfErr);
      return res.status(500).json({ error: 'Failed to generate PDF offer letter.' });
    }

    // Commit decision in database atomically
    const decisionResult = DB.makeDecision(req.params.id, 'Accepted', 'admin_auth_user', {
      internshipDuration: duration,
      joiningDate,
      offerLetterBase64: pdfBase64,
    });

    if (!decisionResult.success || !decisionResult.app) {
      return res.status(409).json({ error: decisionResult.error || 'Failed to record acceptance.' });
    }

    const updatedApp = decisionResult.app;

    // Dispatch acceptance email with offer letter PDF attached
    const acceptanceJobId = `job_offer_${Date.now()}`;
    const emailResult = await sendEmailJob('acceptance_offer', updatedApp, undefined, pdfBuffer);

    const emailJob: EmailJobRecord = {
      jobId: acceptanceJobId,
      applicationId: updatedApp.applicationId,
      emailType: 'acceptance_offer',
      recipient: updatedApp.email,
      status: emailResult.status,
      attemptCount: 1,
      providerMessageId: emailResult.providerMessageId,
      createdAt: new Date().toISOString(),
      errorMessage: emailResult.errorMessage,
    };
    DB.addEmailJob(emailJob);

    if (emailResult.status === 'failed') {
      console.warn(`[Acceptance Workflow] Candidate ${updatedApp.applicationId} accepted, but acceptance email delivery failed: ${emailResult.errorMessage}`);
      return res.json({
        success: true,
        emailSent: false,
        application: DB.getById(req.params.id),
        emailError: emailResult.errorMessage,
        message: `Candidate accepted and offer letter PDF generated. Notice: Acceptance email failed: ${emailResult.errorMessage}`,
      });
    }

    console.log(`[Acceptance Workflow] Candidate ${updatedApp.applicationId} accepted and acceptance email dispatched. Provider Message ID: ${emailResult.providerMessageId}`);
    return res.json({
      success: true,
      emailSent: true,
      application: DB.getById(req.params.id),
      message: 'Application accepted and offer letter dispatched to applicant successfully.',
    });
  } catch (err) {
    console.error('Error accepting application:', err);
    return res.status(500).json({ error: 'Internal server error during acceptance workflow.' });
  }
});

/**
 * Route Alias: POST /api/applications/accept
 * Supports callers targeting /api/applications/accept with { id, applicationId, duration, joiningDate }
 */
router.post('/applications/accept', async (req: Request, res: Response) => {
  const targetId = req.body.id || req.body.applicationId;
  if (!targetId) {
    return res.status(400).json({ error: 'Application ID is required in request body.' });
  }
  req.params.id = String(targetId);
  // Forward to standard accept logic
  const acceptHandler = (router as any).stack.find(
    (layer: any) => layer.route && layer.route.path === '/admin/applications/:id/accept' && layer.route.methods.post
  );
  if (acceptHandler) {
    return acceptHandler.route.stack[0].handle(req, res);
  }
  return res.status(500).json({ error: 'Internal routing error' });
});

/**
 * Admin: Reject application workflow
 * Concurrency safe, records rejection and dispatches demonstration template email
 */
router.post('/admin/applications/:id/reject', async (req: Request, res: Response) => {
  try {
    const current = DB.getById(req.params.id);
    if (!current) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    if (current.status !== 'Pending') {
      return res.status(409).json({
        error: `Cannot reject: Application is already marked as '${current.status}'.`,
      });
    }

    const decisionResult = DB.makeDecision(req.params.id, 'Rejected', 'admin_auth_user');

    if (!decisionResult.success || !decisionResult.app) {
      return res.status(409).json({ error: decisionResult.error || 'Failed to record rejection.' });
    }

    const updatedApp = decisionResult.app;

    // Dispatch rejection email
    const rejectionJobId = `job_rej_${Date.now()}`;
    const emailResult = await sendEmailJob('rejection_notice', updatedApp);

    const emailJob: EmailJobRecord = {
      jobId: rejectionJobId,
      applicationId: updatedApp.applicationId,
      emailType: 'rejection_notice',
      recipient: updatedApp.email,
      status: emailResult.status,
      attemptCount: 1,
      providerMessageId: emailResult.providerMessageId,
      createdAt: new Date().toISOString(),
      errorMessage: emailResult.errorMessage,
    };
    DB.addEmailJob(emailJob);

    return res.json({
      success: true,
      application: DB.getById(req.params.id),
      message: 'Application marked as Rejected and candidate notified.',
    });
  } catch (err) {
    console.error('Error rejecting application:', err);
    return res.status(500).json({ error: 'Internal server error during rejection workflow.' });
  }
});

/**
 * Admin: Retry an eligible failed email job
 */
router.post('/admin/email-jobs/:jobId/retry', async (req: Request, res: Response) => {
  try {
    const all = DB.getAll();
    let targetJob: EmailJobRecord | null = null;
    let targetApp: ApplicationRecord | null = null;

    for (const app of all) {
      const match = app.emailJobs?.find((j) => j.jobId === req.params.jobId);
      if (match) {
        targetJob = match;
        targetApp = app;
        break;
      }
    }

    if (!targetJob || !targetApp) {
      return res.status(404).json({ error: 'Email job not found.' });
    }

    let pdfBuffer: Buffer | undefined;
    if (targetJob.emailType === 'acceptance_offer' && targetApp.offerLetterBase64) {
      pdfBuffer = Buffer.from(targetApp.offerLetterBase64, 'base64');
    }

    const result = await sendEmailJob(targetJob.emailType, targetApp, undefined, pdfBuffer);

    targetJob.attemptCount += 1;
    targetJob.status = result.status;
    targetJob.lastAttemptAt = new Date().toISOString();
    targetJob.providerMessageId = result.providerMessageId;
    targetJob.errorMessage = result.errorMessage;

    DB.addEmailJob(targetJob);

    return res.json({
      success: true,
      job: targetJob,
      message: `Email job retried. Status is now ${result.status}.`,
    });
  } catch (err) {
    console.error('Error retrying email job:', err);
    return res.status(500).json({ error: 'Failed to retry email job.' });
  }
});

/**
 * Admin: Preview rendered email template
 */
router.get('/admin/applications/:id/email-preview/:emailType', (req: Request, res: Response) => {
  const app = DB.getById(req.params.id);
  if (!app) {
    return res.status(404).json({ error: 'Application not found.' });
  }
  const emailType = req.params.emailType as any;
  const rendered = renderEmailTemplate(emailType, app, app.trackingToken);
  return res.json({
    emailType,
    recipient: emailType === 'support_notification' ? (process.env.SUPPORT_EMAIL || 'hr-support@companytech.internal') : app.email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });
});

/**
 * Download offer letter PDF
 */
router.get('/admin/applications/:id/offer-letter', async (req: Request, res: Response) => {
  const app = DB.getById(req.params.id);
  if (!app) {
    return res.status(404).send('Application not found.');
  }

  // Generate on the fly if needed or use stored
  let pdfBuffer: Buffer;
  if (app.offerLetterBase64) {
    pdfBuffer = Buffer.from(app.offerLetterBase64, 'base64');
  } else {
    pdfBuffer = await generateOfferLetterPdf(app);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Company-Tech-Offer-Letter-${app.applicationId}.pdf"`
  );
  return res.send(pdfBuffer);
});

/**
 * Download or view uploaded resume
 */
router.get('/admin/applications/:id/resume', (req: Request, res: Response) => {
  const app = DB.getById(req.params.id);
  if (!app || !app.resumeBase64) {
    return res.status(404).send('Resume not found or was not uploaded with this application.');
  }

  const matches = app.resumeBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    const contentType = matches[1];
    const dataBuffer = Buffer.from(matches[2], 'base64');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${app.resumeName || 'resume.pdf'}"`);
    return res.send(dataBuffer);
  }

  // Raw base64 string fallback
  const dataBuffer = Buffer.from(app.resumeBase64, 'base64');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${app.resumeName || 'resume.pdf'}"`);
  return res.send(dataBuffer);
});

/**
 * Admin: Send a test email
 */
router.post('/admin/send-test-email', async (req: Request, res: Response) => {
  const { recipient } = req.body;
  const testApp: ApplicationRecord = {
    applicationId: 'CT-TEST-0001',
    fullName: 'Test Candidate',
    email: recipient || 'test@example.com',
    college: 'Demonstration University',
    pursuingYear: '4th Year',
    experienceLevel: 'Fresher',
    internshipRole: 'Frontend Developer',
    submittedAt: new Date().toISOString(),
    status: 'Pending',
    trackingToken: 'test_token_123',
    schemaVersion: 1,
    emailJobs: [],
  };

  const result = await sendEmailJob('applicant_confirmation', testApp, 'test_token_123');
  return res.json({
    success: result.status === 'sent' || result.status === 'delivered',
    result,
  });
});

/**
 * System health
 */
router.get('/system/health', (_req: Request, res: Response) => {
  return res.json({
    status: 'healthy',
    time: new Date().toISOString(),
    stats: DB.getStats(),
    organization: 'Company Tech',
  });
});

export default router;
