import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { ApplicationRecord, EmailJobRecord, ApplicationStatus } from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'applications.json');

// Initialize Cloud Firestore connection
let firestoreDb: any = null;
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    firestoreDb = getFirestore(app, config.firestoreDatabaseId);
    console.log('[Company Tech DB] Connected to Cloud Firestore database:', config.firestoreDatabaseId);
  }
} catch (e) {
  console.warn('[Company Tech DB] Cloud Firestore initialization deferred:', e);
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache synchronized with disk and Firestore
let applicationsCache: Map<string, ApplicationRecord> = new Map();

/**
 * Hash a high-entropy tracking token using SHA-256
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Generate a unique application ID in format CT-APP-XXXXXX
 */
export function generateApplicationId(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CT-APP-${rand}`;
}

/**
 * Generate a secure tracking token (32 hex characters)
 */
export function generateTrackingToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Initial seed data to demonstrate all statuses and roles realistically
 */
function getInitialSeedData(): ApplicationRecord[] {
  const baseTime = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const token1 = 'ct_track_demo_01_a9f4e2b1c8d7';
  const token2 = 'ct_track_demo_02_e4b1c8d7a9f4';
  const token3 = 'ct_track_demo_03_c8d7a9f4e4b1';

  return [
    {
      applicationId: 'CT-APP-849201',
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@example.edu',
      college: 'National Institute of Technology, Surathkal',
      pursuingYear: '3rd Year',
      experienceLevel: 'Fresher',
      internshipRole: 'Frontend Developer',
      submittedAt: baseTime,
      status: 'Pending',
      trackingToken: token1,
      trackingTokenHash: hashToken(token1),
      schemaVersion: 1,
      emailJobs: [
        {
          jobId: 'job_seed_01',
          applicationId: 'CT-APP-849201',
          emailType: 'applicant_confirmation',
          recipient: 'aarav.sharma@example.edu',
          status: 'delivered',
          attemptCount: 1,
          providerMessageId: 'msg_ct_seed_01',
          createdAt: baseTime,
        },
        {
          jobId: 'job_seed_02',
          applicationId: 'CT-APP-849201',
          emailType: 'support_notification',
          recipient: 'hr-support@companytech.internal',
          status: 'delivered',
          attemptCount: 1,
          providerMessageId: 'msg_ct_seed_02',
          createdAt: baseTime,
        },
      ],
    },
    {
      applicationId: 'CT-APP-731940',
      fullName: 'Priya Venkatesh',
      email: 'priya.venkatesh@example.edu',
      college: 'Birla Institute of Technology and Science, Pilani',
      pursuingYear: '4th Year',
      experienceLevel: 'Experienced',
      internshipRole: 'Backend Developer',
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Accepted',
      decisionAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      decisionBy: 'admin_usr_root',
      internshipDuration: '2 months',
      joiningDate: '2026-11-15',
      offerLetterPath: 'offer-letters/CT-APP-731940/offer-letter.pdf',
      offerLetterGenerationStatus: 'generated',
      offerLetterGeneratedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      trackingToken: token2,
      trackingTokenHash: hashToken(token2),
      schemaVersion: 1,
      emailJobs: [
        {
          jobId: 'job_seed_03',
          applicationId: 'CT-APP-731940',
          emailType: 'applicant_confirmation',
          recipient: 'priya.venkatesh@example.edu',
          status: 'delivered',
          attemptCount: 1,
          providerMessageId: 'msg_ct_seed_03',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          jobId: 'job_seed_04',
          applicationId: 'CT-APP-731940',
          emailType: 'acceptance_offer',
          recipient: 'priya.venkatesh@example.edu',
          status: 'delivered',
          attemptCount: 1,
          providerMessageId: 'msg_ct_seed_04',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    {
      applicationId: 'CT-APP-620485',
      fullName: 'Rohan Mehta',
      email: 'rohan.mehta@example.edu',
      college: 'Delhi Technological University',
      pursuingYear: '2nd Year',
      experienceLevel: 'Fresher',
      internshipRole: 'AI/ML Engineer',
      submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Rejected',
      decisionAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      decisionBy: 'admin_usr_root',
      trackingToken: token3,
      trackingTokenHash: hashToken(token3),
      schemaVersion: 1,
      emailJobs: [
        {
          jobId: 'job_seed_05',
          applicationId: 'CT-APP-620485',
          emailType: 'applicant_confirmation',
          recipient: 'rohan.mehta@example.edu',
          status: 'delivered',
          attemptCount: 1,
          providerMessageId: 'msg_ct_seed_05',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          jobId: 'job_seed_06',
          applicationId: 'CT-APP-620485',
          emailType: 'rejection_notice',
          recipient: 'rohan.mehta@example.edu',
          status: 'delivered',
          attemptCount: 1,
          providerMessageId: 'msg_ct_seed_06',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
  ];
}

/**
 * Load store from disk or seed
 */
function loadStore(): void {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data: ApplicationRecord[] = JSON.parse(raw);
      applicationsCache.clear();
      for (const item of data) {
        applicationsCache.set(item.applicationId, item);
      }
      return;
    }
  } catch (err) {
    console.warn('Failed reading persistent store file, initializing seed:', err);
  }

  // Seed default data
  const seeds = getInitialSeedData();
  applicationsCache.clear();
  for (const s of seeds) {
    applicationsCache.set(s.applicationId, s);
  }
  saveStore();
}

/**
 * Save store to disk
 */
function saveStore(): void {
  try {
    const list = Array.from(applicationsCache.values());
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing data to disk:', err);
  }
}

// Initial load
loadStore();

export const DB = {
  getAll(): ApplicationRecord[] {
    return Array.from(applicationsCache.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  },

  getById(id: string): ApplicationRecord | null {
    return applicationsCache.get(id) || null;
  },

  getByToken(applicationId: string, token: string): ApplicationRecord | null {
    const app = applicationsCache.get(applicationId);
    if (!app) return null;

    const hashedInput = hashToken(token);
    if (app.trackingTokenHash && app.trackingTokenHash === hashedInput) {
      return app;
    }
    // Also support exact match if raw token matches
    if (app.trackingToken && app.trackingToken === token.trim()) {
      return app;
    }
    return null;
  },

  save(app: ApplicationRecord): void {
    applicationsCache.set(app.applicationId, app);
    saveStore();

    // Persist application document directly to Cloud Firestore
    if (firestoreDb) {
      const firestoreDoc = {
        applicationId: app.applicationId,
        fullName: app.fullName,
        email: app.email,
        college: app.college,
        pursuingYear: app.pursuingYear,
        experienceLevel: app.experienceLevel,
        internshipRole: app.internshipRole,
        status: app.status,
        submittedAt: app.submittedAt,
        resumeName: app.resumeName || null,
        resumePath: app.resumePath || null,
        schemaVersion: app.schemaVersion || 1,
        trackingTokenHash: app.trackingTokenHash || null,
      };

      setDoc(doc(firestoreDb, 'applications', app.applicationId), firestoreDoc)
        .then(() => {
          console.log(`[Cloud Firestore] Persisted application: ${app.applicationId}`);
        })
        .catch((err: any) => {
          console.warn(`[Cloud Firestore] Notice on save: ${err.message}`);
        });
    }
  },

  /**
   * Concurrency-safe decision reservation
   */
  makeDecision(
    applicationId: string,
    targetStatus: 'Accepted' | 'Rejected',
    adminUid: string,
    extra?: {
      internshipDuration?: '1 month' | '2 months' | '3 months';
      joiningDate?: string;
      offerLetterBase64?: string;
    }
  ): { success: boolean; error?: string; app?: ApplicationRecord } {
    const current = applicationsCache.get(applicationId);
    if (!current) {
      return { success: false, error: 'Application record not found' };
    }

    if (current.status !== 'Pending') {
      return {
        success: false,
        error: `Conflicting decision: Application is already marked as ${current.status}. Status cannot be overridden.`,
      };
    }

    current.status = targetStatus;
    current.decisionAt = new Date().toISOString();
    current.decisionBy = adminUid;

    if (targetStatus === 'Accepted' && extra) {
      current.internshipDuration = extra.internshipDuration || '1 month';
      current.joiningDate = extra.joiningDate || '';
      current.offerLetterGenerationStatus = 'generated';
      current.offerLetterGeneratedAt = new Date().toISOString();
      current.offerLetterPath = `offer-letters/${applicationId}/offer-letter.pdf`;
      if (extra.offerLetterBase64) {
        current.offerLetterBase64 = extra.offerLetterBase64;
      }
    }

    applicationsCache.set(applicationId, current);
    saveStore();

    // Sync updated status and decision to Cloud Firestore
    if (firestoreDb) {
      const decisionDoc: Record<string, any> = {
        status: targetStatus,
        decisionAt: current.decisionAt,
        decisionBy: current.decisionBy,
      };
      if (targetStatus === 'Accepted' && extra) {
        decisionDoc.internshipDuration = current.internshipDuration;
        decisionDoc.joiningDate = current.joiningDate;
        decisionDoc.offerLetterGenerationStatus = current.offerLetterGenerationStatus;
        decisionDoc.offerLetterGeneratedAt = current.offerLetterGeneratedAt;
        decisionDoc.offerLetterPath = current.offerLetterPath;
      }
      setDoc(doc(firestoreDb, 'applications', applicationId), decisionDoc, { merge: true })
        .then(() => {
          console.log(`[Cloud Firestore] Synced decision for ${applicationId} (${targetStatus})`);
        })
        .catch((err: any) => {
          console.warn(`[Cloud Firestore] Notice on decision sync: ${err.message}`);
        });
    }

    return { success: true, app: current };
  },

  addEmailJob(job: EmailJobRecord): void {
    const app = applicationsCache.get(job.applicationId);
    if (!app) return;
    if (!app.emailJobs) {
      app.emailJobs = [];
    }
    // Check if job exists
    const idx = app.emailJobs.findIndex((j) => j.jobId === job.jobId);
    if (idx >= 0) {
      app.emailJobs[idx] = job;
    } else {
      app.emailJobs.push(job);
    }
    saveStore();

    // Persist email processing record to Cloud Firestore
    if (firestoreDb) {
      setDoc(
        doc(firestoreDb, 'emailJobs', job.jobId),
        {
          jobId: job.jobId,
          applicationId: job.applicationId,
          emailType: job.emailType,
          recipient: job.recipient,
          status: job.status,
          attemptCount: job.attemptCount,
          providerMessageId: job.providerMessageId || null,
          createdAt: job.createdAt,
          lastAttemptAt: job.lastAttemptAt || null,
          errorMessage: job.errorMessage || null,
        },
        { merge: true }
      ).catch((err: any) => {
        console.warn(`[Cloud Firestore] Email job sync notice: ${err.message}`);
      });
    }
  },

  getStats(): { total: number; pending: number; accepted: number; rejected: number } {
    let pending = 0;
    let accepted = 0;
    let rejected = 0;

    for (const app of applicationsCache.values()) {
      if (app.status === 'Pending') pending++;
      else if (app.status === 'Accepted') accepted++;
      else if (app.status === 'Rejected') rejected++;
    }

    return {
      total: applicationsCache.size,
      pending,
      accepted,
      rejected,
    };
  },
};
