import { icon, escapeHtml } from '../../utils/dom.js';
import { postTime } from '../../utils/formatters.js';
import { getHelpRequests } from '../../services/storage.js';
import { sidebar, topbar } from '../../components/layout.js';
import { refresh } from '../../events.js';

export const adminHelpRequestsPage = () => {
  const app = document.querySelector('#app');
  if (!app) return;
  const requests = getHelpRequests().filter(item => !item.archivedAt).slice().reverse();
  const pending = requests.filter(item => item.status === 'Pending').length;

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
            <h1 class="hero-page-title">Support &amp; Inquiry Inbox</h1>
            <p class="hero-page-subtitle">${pending} inquiry ticket${pending === 1 ? '' : 's'} awaiting administrative response.</p>
          </div>
          <div class="hero-header-actions">
            <span class="status-pill ${pending ? 'status-pill-pending' : 'status-pill-done'}">
              ${pending} Pending Review
            </span>
          </div>
        </section>

        <!-- Main Ticket Table Section -->
        <section class="modern-card table-section-card">
          <div class="card-header table-control-bar">
            <div>
              <h2 class="card-title">Inquiry Submissions</h2>
              <p class="card-subtitle">Reply to student questions, provide document guidance, and archive resolved tickets.</p>
            </div>
            <div class="table-control-actions">
              <div class="table-search-pill">
                ${icon('search', 15)}
                <input id="help-request-search" type="search" placeholder="Search student, email, subject..." aria-label="Search support tickets" />
              </div>
              <div class="select-pill-wrapper">
                <select id="help-category-filter" class="pill-select compact-select" aria-label="Filter tickets by category">
                  <option value="all">All categories</option>
                  <option value="Renewal Inquiry">Renewal Inquiry</option>
                  <option value="Document Verification">Document Verification</option>
                  <option value="Disbursement Concern">Disbursement Concern</option>
                  <option value="Account / Profile Issue">Account / Profile Issue</option>
                  <option value="General Concern">General Concern</option>
                </select>
              </div>
              <div class="select-pill-wrapper">
                <select id="help-status-filter" class="pill-select compact-select" aria-label="Filter tickets by status">
                  <option value="all">All statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          <div class="help-request-list">
            ${
              requests.length
                ? requests
                    .map(request => {
                      const category = request.category || 'General Concern';
                      const thread = Array.isArray(request.thread) && request.thread.length
                        ? request.thread
                        : [
                            ...(request.message ? [{ sender: 'student', senderName: request.userName || 'Student', text: request.message, createdAt: request.createdAt }] : []),
                            ...(request.adminReply ? [{ sender: 'admin', senderName: 'Administration', text: request.adminReply, createdAt: request.repliedAt || request.createdAt }] : [])
                          ];

                      return `<article class="help-ticket-card admin-ticket-card"
                        data-help-ticket="${escapeHtml(request.id)}"
                        data-status="${escapeHtml(request.status)}"
                        data-category="${escapeHtml(category)}"
                        data-search="${escapeHtml(`${request.userName} ${request.userEmail} ${request.subject} ${request.message} ${category}`.toLowerCase())}">
                        
                        <div class="help-ticket-header">
                          <div class="student-user-cell">
                            <div class="student-avatar-circle">${escapeHtml((request.userName || 'S')[0])}</div>
                            <div>
                              <strong>${escapeHtml(request.userName)}</strong>
                              <small class="email-subtext">${escapeHtml(request.userEmail)}</small>
                            </div>
                          </div>
                          <div class="help-ticket-meta">
                            <span class="help-category-pill" data-category="${escapeHtml(category)}">
                              ${icon('tag', 12)} ${escapeHtml(category)}
                            </span>
                            <span class="date-cell">${postTime(request.createdAt)}</span>
                            <select class="record-select help-status-select ${request.status === 'Pending' ? 'lacking' : 'complete'}" data-ticket-id="${escapeHtml(request.id)}" aria-label="Change ticket status">
                              <option ${request.status === 'Pending' ? 'selected' : ''}>Pending</option>
                              <option ${request.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                            </select>
                          </div>
                        </div>

                        <div class="help-ticket-title-row">
                          <h3 class="help-ticket-subject">${escapeHtml(request.subject)}</h3>
                        </div>

                        <!-- Full Conversational Thread -->
                        <div class="ticket-conversation-thread">
                          ${thread
                            .map(msg => {
                              const isAdmin = msg.sender === 'admin';
                              return `<div class="thread-bubble ${isAdmin ? 'admin' : 'student'}">
                                <div class="thread-bubble-header">
                                  <strong>${isAdmin ? icon('shield', 13) : icon('user', 13)} ${escapeHtml(msg.senderName || (isAdmin ? 'Administration' : request.userName))}</strong>
                                  <small>${msg.createdAt ? postTime(msg.createdAt) : ''}</small>
                                </div>
                                <p class="thread-bubble-text">${escapeHtml(msg.text)}</p>
                              </div>`;
                            })
                            .join('')}
                        </div>

                        <!-- Internal Coordinator Notes -->
                        <div class="coordinator-internal-notes-card" style="margin-bottom:12px;padding:10px 14px;background:var(--card-subtle);border:1px dashed var(--border);border-radius:var(--radius-sm);">
                          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                            <span style="font-size:11.5px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:5px;">
                              ${icon('file-text', 13)} Internal Evaluation Note (Private to Coordinators)
                            </span>
                            ${request.internalNotes ? `<span class="status-pill status-pill-info" style="font-size:10px;padding:1px 6px;">Saved</span>` : ''}
                          </div>
                          <div style="display:flex;gap:8px;">
                            <input type="text" class="pill-input" id="internal-notes-${request.id}" value="${escapeHtml(request.internalNotes || '')}" placeholder="Record internal evaluation notes or coordinator instructions..." style="font-size:12px;padding:6px 12px;flex:1;">
                            <button type="button" class="secondary-pill-btn" data-save-internal-note="${escapeHtml(request.id)}" style="padding:6px 12px;font-size:11.5px;">
                              ${icon('save', 12)} Save Note
                            </button>
                          </div>
                        </div>

                        <!-- Admin Reply Form -->
                        <form class="help-reply-form" data-help-reply-form="${escapeHtml(request.id)}">
                          <textarea class="pill-textarea help-reply-input" maxlength="2000" placeholder="Type a response to ${escapeHtml(request.userName)}..." required></textarea>
                          <div class="help-ticket-actions">
                            <button class="primary-pill-btn" type="submit">
                              ${icon('send', 15)}
                              <span>${request.adminReply ? 'Send Follow-up Reply' : 'Send Reply & Resolve'}</span>
                            </button>
                            <button class="table-delete-btn" type="button" data-archive-help="${escapeHtml(request.id)}" ${request.status !== 'Resolved' ? 'disabled title="Resolve the ticket before archiving"' : ''}>
                              ${icon('archive', 14)} Archive
                            </button>
                          </div>
                        </form>
                      </article>`;
                    })
                    .join('')
                : `
                  <div class="empty-state-card">
                    <div class="empty-state-icon-wrap">${icon('inbox', 26)}</div>
                    <h3 class="empty-state-title">No Help Inquiries In Queue</h3>
                    <p class="empty-state-desc">All student support inquiries have been resolved or no inquiries have been submitted yet.</p>
                  </div>
                `
            }
          </div>

          <div id="help-filter-empty" class="empty-state-card" hidden>
            <div class="empty-state-icon-wrap warning">${icon('search-x', 26)}</div>
            <h3 class="empty-state-title">No Tickets Match Filter</h3>
            <p class="empty-state-desc">No support tickets match your search keyword or selected category filter.</p>
            <div class="empty-state-cta-wrap">
              <button type="button" class="secondary-pill-btn" data-reset-help-filter>
                ${icon('rotate-ccw', 14)} <span>Reset Ticket Filters</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>`;

  refresh();
};
