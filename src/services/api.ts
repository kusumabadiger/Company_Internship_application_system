import { Application, DashboardStats, TrackingResult, EmailJob } from '../types';

export interface SubmitApplicationPayload {
  fullName: string;
  email: string;
  college: string;
  pursuingYear: string;
  experienceLevel: 'Fresher' | 'Experienced';
  internshipRole: string;
  resumeBase64?: string | null;
  resumeName?: string | null;
}

export interface SubmitResponse {
  success: boolean;
  applicationId: string;
  trackingToken: string;
  internshipRole: string;
  status: string;
  submittedAt: string;
  message: string;
}

export const API = {
  async submitApplication(payload: SubmitApplicationPayload): Promise<SubmitResponse> {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit application.');
    }
    return data;
  },

  async trackApplication(applicationId: string, token: string): Promise<TrackingResult> {
    const res = await fetch('/api/applications/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId, token }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to verify application status.');
    }
    return data;
  },

  async getAdminApplications(params?: {
    search?: string;
    status?: string;
    role?: string;
  }): Promise<{ stats: DashboardStats; applications: Application[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.role) query.set('role', params.role);

    const res = await fetch(`/api/admin/applications?${query.toString()}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch applications.');
    }
    return data;
  },

  async getAdminApplicationDetail(id: string): Promise<Application> {
    const res = await fetch(`/api/admin/applications/${id}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load application details.');
    }
    return data;
  },

  async acceptApplication(
    id: string,
    payload: { duration: string; joiningDate: string }
  ): Promise<{ success: boolean; application: Application; message: string }> {
    const res = await fetch(`/api/admin/applications/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to accept application.');
    }
    return data;
  },

  async rejectApplication(
    id: string
  ): Promise<{ success: boolean; application: Application; message: string }> {
    const res = await fetch(`/api/admin/applications/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reject application.');
    }
    return data;
  },

  async retryEmailJob(jobId: string): Promise<{ success: boolean; job: EmailJob; message: string }> {
    const res = await fetch(`/api/admin/email-jobs/${jobId}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to retry email delivery.');
    }
    return data;
  },

  async sendTestEmail(recipient: string): Promise<{ success: boolean; result: unknown }> {
    const res = await fetch('/api/admin/send-test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send test email.');
    }
    return data;
  },
};
