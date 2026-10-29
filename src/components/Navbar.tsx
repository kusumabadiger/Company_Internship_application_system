import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Search, ArrowRight, ShieldCheck, Menu, X, CheckSquare, Github } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ChecklistModal } from './ChecklistModal';
import { ExportModal } from './ExportModal';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const { isAdmin, user, logout } = useAuth();
  const location = useLocation();

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-slate-800 transition-colors">
                <Building2 size={20} className="text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 tracking-tight text-base leading-none">
                  Company Tech
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mt-0.5">
                  Internship Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md hover:text-slate-900 hover:bg-slate-50 transition-colors ${
                  isCurrent('/') ? 'text-slate-900 font-semibold' : ''
                }`}
              >
                Home
              </Link>
              <a
                href="/#roles"
                className="px-3 py-2 rounded-md hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                Internship Opportunities
              </a>
              <a
                href="/#about"
                className="px-3 py-2 rounded-md hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                About
              </a>
              <Link
                to="/track"
                className={`px-3 py-2 rounded-md hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-1.5 ${
                  isCurrent('/track') ? 'text-slate-900 font-semibold bg-slate-50' : ''
                }`}
              >
                <Search size={14} className="text-slate-400" />
                Track Application
              </Link>
            </nav>

            {/* Right Action Items */}
            <div className="hidden md:flex items-center gap-2.5">
              {/* E2E Checklist Helper */}
              <button
                onClick={() => setChecklistOpen(true)}
                title="View PRD End-to-End Testing Checklist"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition-colors"
              >
                <CheckSquare size={14} className="text-emerald-600" />
                <span className="hidden lg:inline">E2E</span> Checklist
              </button>

              {/* GitHub Repo Details */}
              <button
                onClick={() => setExportOpen(true)}
                title="GitHub Repository Setup"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition-colors"
              >
                <Github size={14} className="text-slate-700" />
                <span className="hidden lg:inline">Repository</span>
              </button>

              {/* Apply Primary CTA */}
              <Link
                to="/apply"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-colors"
              >
                Apply Now
                <ArrowRight size={13} />
              </Link>

              {/* Admin Access Discreet Link */}
              <div className="border-l border-slate-200 pl-2.5 ml-1">
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <ShieldCheck size={14} />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="text-xs text-slate-400 hover:text-slate-700"
                      title="Sign Out"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/admin/login"
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-700 rounded transition-colors"
                    title="Administrator Login"
                  >
                    <ShieldCheck size={14} />
                    <span className="hidden xl:inline">Admin</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              <Link
                to="/apply"
                className="px-2.5 py-1 text-xs font-semibold rounded text-white bg-slate-900"
              >
                Apply
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Home
            </Link>
            <a
              href="/#roles"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Internship Opportunities
            </a>
            <a
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              About Company Tech
            </a>
            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Track Application
            </Link>
            <Link
              to="/apply"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-900 bg-slate-100"
            >
              Submit Application
            </Link>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setChecklistOpen(true);
                }}
                className="text-xs font-medium text-slate-600 flex items-center gap-1"
              >
                <CheckSquare size={14} className="text-emerald-600" />
                E2E Test Checklist
              </button>
              {isAdmin ? (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-semibold text-blue-600"
                >
                  Admin Dashboard ({user?.email?.split('@')[0]})
                </Link>
              ) : (
                <Link
                  to="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Modals */}
      <ChecklistModal isOpen={checklistOpen} onClose={() => setChecklistOpen(false)} />
      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  );
};
