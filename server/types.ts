export type ExperienceLevel = 'Fresher' | 'Experienced';
export type InternshipDuration = '1 month' | '2 months' | '3 months';
export type ApplicationStatus = 'Pending' | 'Accepted' | 'Rejected';
export type EmailType =
  | 'applicant_confirmation'
  | 'support_notification'
  | 'acceptance_offer'
  | 'rejection_notice';
export type EmailStatus = 'pending' | 'processing' | 'sent' | 'delivered' | 'failed';
export type OfferLetterStatus = 'pending' | 'processing' | 'generated' | 'failed';

export interface EmailJobRecord {
  jobId: string;
  applicationId: string;
  emailType: EmailType;
  recipient: string;
  status: EmailStatus;
  attemptCount: number;
  providerMessageId?: string;
  createdAt: string;
  lastAttemptAt?: string;
  errorMessage?: string;
}

export interface ApplicationRecord {
  applicationId: string;
  fullName: string;
  email: string;
  college: string;
  pursuingYear: string;
  experienceLevel: ExperienceLevel;
  internshipRole: string;
  resumePath?: string | null;
  resumeName?: string | null;
  resumeBase64?: string | null;
  submittedAt: string;
  status: ApplicationStatus;
  decisionAt?: string | null;
  decisionBy?: string | null;
  internshipDuration?: InternshipDuration | null;
  joiningDate?: string | null;
  offerLetterPath?: string | null;
  offerLetterGenerationStatus?: OfferLetterStatus;
  offerLetterGeneratedAt?: string | null;
  offerLetterBase64?: string | null;
  trackingToken?: string;
  trackingTokenHash?: string;
  schemaVersion: number;
  emailJobs: EmailJobRecord[];
}
