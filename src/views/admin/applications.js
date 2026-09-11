// Admin scholarship application review workspace

import { icon, escapeHtml, displayName } from '../../utils/dom.js';
import { postTime } from '../../utils/formatters.js';
import { scholarships } from '../../config/constants.js';
import { getAccounts } from '../../services/storage.js';
import { getScholarshipCatalog, getApplicationsCache } from '../../services/storage.js';
import { accountYearLevel } from '../../services/auth.js';
import { sidebar, topbar } from '../../components/layout.js';
import { refresh } from '../../events.js';

const filters = ['All', 'Submitted', 'Under review', 'Approved', 'Rejected'];

const statusClass = status => {
  if (status === 'Approved') return 'status-pill-done';
  if (status === 'Rejected') return 'status-pill-danger';
  if (status === 'Under review') return 'status-pill-info';
  return 'status-pill-pending';
};

const statusLabel = status => (status === 'Under review' ? 'Under Review' : status);

export const adminApplicationsPage = () => {
  const app = document.querySelector('#app');
  if (!app) return;

  const accounts = getAccounts();
  const catalog = getScholarshipCatalog();
  const programs = catalog.length
    ? catalog
    : scholarships.map((item, index) => ({
        id: `demo-${index}`,
        title: item[0],
        category: item[1],
        deadline: item[2],
        amount: Number(String(item[3]).replace(/[^0-9.]/g, '')),
        status: 'Open'
      }));
  const applications = getApplicationsCache();
  const submitted = applications.filter(item => item.status === 'Submitted').length;

  app.innerHTML = `<div class="portal admin">
    <div class="sidebar-backdrop"></div>
    ${sidebar(true, 'applications')}
    <div class="main">
      ${topbar(true, 'applications')}
      <main class="content">
        <section class="dashboard-hero-header">
          <div class="hero-header-text">
            <button class="pill-back-btn" data-back-dashboard>
              ${icon('arrow-left', 14)} <span>Back to dashboard</span>
            </button>
            <h1 class="hero-page-title">Scholarship Applications</h1>
            <p class="hero-page-subtitle">Review student applications and record a clear admissions decision.</p>
          </div>
          <div class="hero-header-actions">
            <span class="status-pill ${submitted ? 'status-pill-pending' : 'status-pill-done'} application-count-pill">
              ${icon('inbox', 15)} <span>${submitted} Awaiting review</span>
            </span>
          </div>
        </section>

        <section class="modern-card table-section-card">
          <div class="card-header table-control-bar">
            <div>
              <h2 class="card-title">Application Review Queue</h2>
              <p class="card-subtitle">${applications.length} application${applications.length === 1 ? '' : 's'} received across all scholarship programs.</p>
            </div>
            <div class="table-control-actions" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
              <div class="table-search-pill">
                ${icon('search', 15)}
                <input id="application-search" type="search" placeholder="Search applicant, program, school..." aria-label="Search applications">
              </div>
              <div class="application-filter-pills" role="group" aria-label="Filter applications by status">
                ${filters.map((filter, index) => `<button type="button" class="application-filter-pill ${index === 0 ? 'active' : ''}" data-application-filter="${escapeHtml(filter)}">${escapeHtml(statusLabel(filter))}</button>`).join('')}
              </div>
            </div>
          </div>

          <div id="application-batch-bar" class="application-batch-bar" hidden>
            <span class="application-batch-count">
              ${icon('check-square', 15)}
              <span id="application-selected-count">0</span> applications selected
            </span>
            <div class="application-batch-actions">
              <button type="button" class="primary-pill-btn" data-batch-action="approve" style="background:#10b981;border-color:#10b981;padding:6px 14px;font-size:12px;">
                ${icon('check', 13)} Approve Selected
              </button>
              <button type="button" class="secondary-pill-btn" data-batch-action="reject" style="color:#ef4444;border-color:rgba(239,68,68,0.3);padding:6px 14px;font-size:12px;">
                ${icon('x', 13)} Reject Selected
              </button>
              <button type="button" class="secondary-pill-btn" data-batch-clear style="padding:6px 12px;font-size:12px;">
                Clear Selection
              </button>
            </div>
          </div>

          <div class="modern-data-table-wrap">
            <div class="table-head-row application-review-head" style="grid-template-columns: 36px 1.4fr 1.2fr 1.3fr 110px 100px 1.2fr;">
              <span class="application-select-cell"><input type="checkbox" id="select-all-applications" aria-label="Select all applications"></span>
              <span>APPLICANT</span>
              <span>PROGRAM</span>
              <span>ACADEMIC PROFILE</span>
              <span>SUBMITTED</span>
              <span>STATUS</span>
              <span>DECISION</span>
            </div>
            <div class="table-body-rows">
              ${applications.length ? applications.map(application => {
                const applicant = accounts.find(account => (account.id && String(account.id) === String(application.student_id)) || account.email === application.student_id);
                const program = programs.find(item => String(item.id) === String(application.scholarship_id));
                const status = application.status || 'Submitted';
                const applicantName = applicant ? displayName(applicant) : 'Student profile unavailable';
                const search = `${applicantName} ${applicant?.email || ''} ${applicant?.school || ''} ${program?.title || ''}`.toLowerCase();
                return `<div class="table-data-row application-review-row" data-application-id="${escapeHtml(application.id)}" data-status="${escapeHtml(status)}" data-search="${escapeHtml(search)}" style="grid-template-columns: 36px 1.4fr 1.2fr 1.3fr 110px 100px 1.2fr;">
                  <div class="application-select-cell">
                    <input type="checkbox" class="application-select-row" data-select-app-id="${escapeHtml(application.id)}" aria-label="Select application">
                  </div>
                  <div class="student-user-cell">
                    <div class="student-avatar-circle">${escapeHtml((applicant?.firstName || applicant?.name || 'S')[0])}</div>
                    <div><strong>${applicantName}</strong><small class="email-subtext">${escapeHtml(applicant?.email || 'Profile unavailable')}</small></div>
                  </div>
                  <div class="application-program-cell"><strong>${escapeHtml(program?.title || 'Scholarship unavailable')}</strong><small>${escapeHtml(program?.category || 'General scholarship')}</small></div>
                  <div class="application-academic-cell"><strong>${escapeHtml(applicant?.school || 'School not provided')}</strong><small>${escapeHtml([applicant?.course, accountYearLevel(applicant)].filter(Boolean).join(' · ') || 'Academic information unavailable')}</small></div>
                  <small class="date-cell">${application.submitted_at || application.created_at ? postTime(application.submitted_at || application.created_at) : 'Not recorded'}</small>
                  <div><span class="status-pill ${statusClass(status)}">${escapeHtml(statusLabel(status))}</span></div>
                  <div class="application-actions-cell" style="display:flex;gap:4px;flex-wrap:wrap;">
                    <button type="button" class="application-action-btn inspect" data-inspect-application="${escapeHtml(application.id)}" title="Inspect documents and credentials">
                      ${icon('file-text', 13)} Inspect
                    </button>
                    ${status !== 'Approved' ? `<button type="button" class="application-action-btn approve" data-application-action="approve" data-application-id="${escapeHtml(application.id)}">${icon('check', 13)} Approve</button>` : ''}
                    ${status !== 'Rejected' ? `<button type="button" class="application-action-btn reject" data-application-action="reject" data-application-id="${escapeHtml(application.id)}">${icon('x', 13)} Reject</button>` : ''}
                    ${status !== 'Draft' ? `<button type="button" class="application-action-btn resubmit" data-application-action="resubmit" data-application-id="${escapeHtml(application.id)}">${icon('rotate-ccw', 13)} Resubmit</button>` : ''}
                  </div>
                </div>`;
              }).join('') : `
                <div class="empty-state-card">
                  <div class="empty-state-icon-wrap">${icon('inbox', 26)}</div>
                  <h3 class="empty-state-title">No Applications in Queue</h3>
                  <p class="empty-state-desc">Students have not submitted any scholarship applications yet. Review or publish programs in the scholarship catalog.</p>
                  <div class="empty-state-cta-wrap">
                    <button type="button" class="primary-pill-btn" data-page="scholarships">
                      ${icon('book-open', 14)} <span>Manage Scholarship Programs</span>
                    </button>
                  </div>
                </div>
              `}
            </div>
          </div>
          <div id="application-filter-empty" class="empty-state-card" hidden>
            <div class="empty-state-icon-wrap warning">${icon('search-x', 26)}</div>
            <h3 class="empty-state-title">No Applications Match Filter</h3>
            <p class="empty-state-desc">No applications match your selected status or keyword search query.</p>
            <div class="empty-state-cta-wrap">
              <button type="button" class="secondary-pill-btn" data-reset-app-filter>
                ${icon('rotate-ccw', 14)} <span>Reset Status &amp; Search</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>`;

  refresh();
};
