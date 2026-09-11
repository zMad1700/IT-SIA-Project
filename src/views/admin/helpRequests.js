// Modern Admin Help Requests Review View

import { icon, escapeHtml } from '../../utils/dom.js';
import { postTime } from '../../utils/formatters.js';
import { getHelpRequests } from '../../services/storage.js';
import { sidebar, topbar } from '../../components/layout.js';
import { refresh } from '../../events.js';

export const adminHelpRequestsPage = () => {
  const app = document.querySelector('#app');
  if (!app) return;

  const requests = getHelpRequests().slice().reverse();
  const pendingCount = requests.filter(request => request.status === 'Pending').length;

  app.innerHTML = `<div class="portal admin">
    <div class="sidebar-backdrop"></div>
    ${sidebar(true, 'help-requests')}
    <div class="main">
      ${topbar(true, 'help-requests')}
      <main class="content">
        <!-- Hero Header -->
        <section class="dashboard-hero-header">
          <div class="hero-header-text">
            <button class="pill-back-btn" data-back-dashboard>
              ${icon('arrow-left', 14)} <span>Back to dashboard</span>
            </button>
            <h1 class="hero-page-title">Pending Review</h1>
            <p class="hero-page-subtitle">${pendingCount} inquiry ticket${pendingCount === 1 ? '' : 's'} awaiting administrative feedback.</p>
          </div>
          <div class="hero-header-actions">
            <span class="status-pill ${pendingCount > 0 ? 'status-pill-warning' : 'status-pill-done'}" style="font-size: 13px; padding: 8px 16px;">
              ${pendingCount} Pending Inquiries
            </span>
          </div>
        </section>

        <!-- Table Card matching Reference Payments Table -->
        <section class="modern-card table-section-card">
          <div class="card-header table-control-bar">
            <div>
              <h2 class="card-title">Inquiry Submissions</h2>
              <p class="card-subtitle">Review and resolve questions submitted by students.</p>
            </div>
          </div>

          <div class="modern-data-table-wrap">
            <div class="table-head-row help-request-head">
              <span>STUDENT</span>
              <span>SUBJECT &amp; MESSAGE</span>
              <span>SUBMISSION TIME</span>
              <span>STATUS</span>
            </div>
            <div class="table-body-rows">
              ${
                requests.length
                  ? requests
                      .map(
                        request =>
                          `<div class="table-data-row help-request-row" data-help-request-id="${escapeHtml(request.id)}">
                            <div class="student-user-cell">
                              <div class="student-avatar-circle">
                                ${(request.userName || 'S')[0]}
                              </div>
                              <div>
                                <strong>${escapeHtml(request.userName)}</strong>
                                <small class="email-subtext">${escapeHtml(request.userEmail)}</small>
                              </div>
                            </div>
                            <div class="message-content-cell">
                              <strong>${escapeHtml(request.subject)}</strong>
                              <small>${escapeHtml(request.message)}</small>
                            </div>
                            <small class="date-cell">${postTime(request.createdAt)}</small>
                            <div>
                              <select class="record-select help-status-select ${request.status === 'Pending' ? 'lacking' : 'complete'}">
                                <option ${request.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option ${request.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                              </select>
                            </div>
                          </div>`
                      )
                      .join('')
                  : `<div class="empty-state-banner">${icon('check-circle-2', 20)} <span>No pending help requests found.</span></div>`
              }
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>`;

  refresh();
};
