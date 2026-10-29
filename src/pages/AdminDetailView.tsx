import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Mail,
  User,
  GraduationCap,
  Briefcase,
  AlertCircle,
  RefreshCw,
  Building2,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API } from '../services/api';
import { Application, InternshipDuration } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AcceptModal } from '../components/AcceptModal';
import { RejectModal } from '../components/RejectModal';
import { EmailJobTimeline } from '../components/EmailJobTimeline';

export const AdminDetailView: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { isAdmin, loading: authLoading } = useAuth();

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  // Action status message
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchApplication = async () => {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await API.getAdminApplicationDetail(applicationId);
      setApplication(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && applicationId) {
      fetchApplication();
    }
  }, [isAdmin, applicationId]);

  const handleAcceptConfirm = async (duration: InternshipDuration, joiningDate: string) => {
    if (!applicationId) return;
    setActionFeedback(null);
    const res = await API.acceptApplication(applicationId, { duration, joiningDate });
    setActionFeedback(res.message);
    setApplication(res.application);
  };

  const handleRejectConfirm = async () => {
    if (!applicationId) return;
    setActionFeedback(null);
    const res = await API.rejectApplication(applicationId);
    setActionFeedback(res.message);
    setApplication(res.application);
  };

  if (!authLoading && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading candidate profile...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle size={32} className="text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Application Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'The requested application could not be retrieved.'}</p>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const isPending = application.status === 'Pending';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Applications List
        </Link>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Dossier Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-800 text-blue-400 font-bold border border-slate-700">
                {application.applicationId}
              </span>
              <span className="text-xs text-slate-400">
                Submitted on {new Date(application.submittedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{application.fullName}</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Applying for: <strong className="text-white">{application.internshipRole}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <StatusBadge status={application.status} size="lg" />

            {/* Decision Controls (Enabled only if status is Pending) */}
            {isPending ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAcceptModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  Accept Candidate
                </button>
                <button
                  onClick={() => setRejectModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </div>
            ) : (
              <div className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                Decision Finalized
              </div>
            )}
          </div>
        </div>

        {/* Candidate Detail Grid */}
        <div className="p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Identity & Contact */}
            <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-500">
                <User size={14} /> Candidate Identity
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Full Name</span>
                  <span className="font-semibold text-slate-800">{application.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Email Address</span>
                  <span className="font-mono text-slate-800">{application.email}</span>
                </div>
              </div>
            </div>

            {/* Academic Particulars */}
            <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-500">
                <GraduationCap size={14} /> Academic Background
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Institution</span>
                  <span className="font-semibold text-slate-800">{application.college}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Year of Study</span>
                  <span className="text-slate-800 font-medium">{application.pursuingYear}</span>
                </div>
              </div>
            </div>

            {/* Professional Background */}
            <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-500">
                <Briefcase size={14} /> Experience & Role
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Experience Level</span>
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                    {application.experienceLevel}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Target Role</span>
                  <span className="font-semibold text-slate-800">{application.internshipRole}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resume Inspection Section (PRD Section 10.7) */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Uploaded Resume / CV
            </h3>
            {application.resumeBase64 || application.resumePath ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {application.resumeName || 'Applicant_Resume.pdf'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Private document stored securely. Click to inspect or download.
                    </div>
                  </div>
                </div>
                <a
                  href={`/api/admin/applications/${application.applicationId}/resume`}
                  target="_blank"
                  rel="noreferrer"
                  download={application.resumeName || 'resume.pdf'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors"
                >
                  <Download size={13} />
                  Inspect Resume
                </a>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                Candidate did not submit an optional resume with this application.
              </div>
            )}
          </div>

          {/* Decision Record Box (If Accepted or Rejected) */}
          {application.status === 'Accepted' && (
            <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>Accepted Internship Offer Details</span>
                </div>
                <span className="text-[11px] text-emerald-700">
                  Decided: {application.decisionAt ? new Date(application.decisionAt).toLocaleString() : 'N/A'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block">Duration</span>
                  <strong className="text-slate-800 text-sm">{application.internshipDuration}</strong>
                </div>
                <div className="bg-white p-3 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block">Joining Date</span>
                  <strong className="text-slate-800 text-sm">{application.joiningDate}</strong>
                </div>
                <div className="bg-white p-3 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block">Offer Letter Status</span>
                  <strong className="text-emerald-700 text-sm capitalize">
                    {application.offerLetterGenerationStatus || 'Generated'}
                  </strong>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <p className="text-[11px] text-emerald-800">
                  Real PDF offer letter created with "HR Support and Co-Founder" signature.
                </p>
                <a
                  href={`/api/admin/applications/${application.applicationId}/offer-letter`}
                  target="_blank"
                  rel="noreferrer"
                  download={`Company-Tech-Offer-Letter-${application.applicationId}.pdf`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  <Download size={13} />
                  Download Offer Letter (PDF)
                </a>
              </div>
            </div>
          )}

          {application.status === 'Rejected' && (
            <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2 text-xs text-rose-900">
              <div className="flex items-center gap-2 font-bold text-sm">
                <XCircle size={16} className="text-rose-600" />
                <span>Application Rejected</span>
              </div>
              <p className="text-rose-800 text-[11px] leading-relaxed">
                Rejection recorded at{' '}
                {application.decisionAt ? new Date(application.decisionAt).toLocaleString() : 'N/A'}. Candidate was notified via the centralized demonstration rejection template.
              </p>
            </div>
          )}

          {/* Email Processing Records Timeline (PRD Section 8.3 & 14.4) */}
          <div className="border-t border-slate-100 pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Mail size={14} className="text-slate-500" />
                Transactional Email Dispatch Logs
              </h3>
              <button
                onClick={fetchApplication}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              >
                <RefreshCw size={11} /> Refresh Logs
              </button>
            </div>
            <EmailJobTimeline jobs={application.emailJobs || []} onJobUpdated={fetchApplication} />
          </div>
        </div>
      </div>

      {/* Acceptance Modal */}
      <AcceptModal
        isOpen={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        application={application}
        onConfirm={handleAcceptConfirm}
      />

      {/* Rejection Modal */}
      <RejectModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        application={application}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
};
