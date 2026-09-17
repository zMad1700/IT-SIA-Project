// Modern Student Help Center view with threaded conversations and issue categorization

import { icon, escapeHtml } from '../../utils/dom.js';
import { postTime } from '../../utils/formatters.js';
import { getHelpRequests } from '../../services/storage.js';
import { getCurrentUser } from '../../services/auth.js';
import { sidebar, topbar } from '../../components/layout.js';
import { refresh } from '../../events.js';

export const helpCenterPage = () => {
  const app = document.querySelector('#app');
  if (!app) return;
  const user = getCurrentUser();
  const requests = getHelpRequests().filter(item => item.userEmail === user?.email && !item.archivedAt).slice().reverse();

  app.innerHTML = `<div class="portal">
    <div class="sidebar-backdrop"></div>
    ${sidebar(false, 'help-center')}
    <div class="main">
      ${topbar(false, 'help-center')}
      <main class="content">
        <!-- Hero Header -->
        <section class="dashboard-hero-header">
          <div class="hero-header-text">
            <button class="pill-back-btn" data-back-dashboard data-page="overview">
              ${icon('arrow-left', 14)} <span>Back to dashboard</span>
            </button>
            <h1 class="hero-page-title">Student Support &amp; Help Center</h1>
            <p class="hero-page-subtitle">Submit inquiries, track resolutions, and chat directly with scholarship administration.</p>
          </div>
        </section>

        <!-- Help Request Form Card -->
        <section class="modern-card profile-editor-card max-width-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Submit Inquiry Ticket</h2>
              <p class="card-subtitle">Our administration office will review your ticket and respond promptly.</p>
            </div>
            <span class="status-pill status-pill-info">${icon('life-buoy', 13)} Official Support</span>
          </div>

          <div id="help-form-feedback"></div>

          <form id="help-request-form" class="modern-editor-form">
            <div class="form-grid-row">
              <div class="modern-field">
                <label for="help-category">Inquiry Category</label>
                <div class="select-pill-wrapper">
                  <select id="help-category" class="pill-select" required>
                    <option value="" disabled selected>Select category...</option>
                    <option value="Renewal Inquiry">Renewal Inquiry</option>
                    <option value="Document Verification">Document Verification</option>
                    <option value="Disbursement Concern">Disbursement Concern</option>
                    <option value="Account / Profile Issue">Account / Profile Issue</option>
                    <option value="General Concern">General Concern</option>
                  </select>
                </div>
              </div>
              <div class="modern-field">
                <label for="help-subject">Ticket Subject</label>
                <input id="help-subject" class="pill-input" maxlength="100" placeholder="Brief summary of your question or concern..." required>
              </div>
            </div>
            <div class="modern-field">
              <label for="help-message">Detailed Message</label>
              <textarea id="help-message" class="pill-textarea" maxlength="1000" placeholder="Explain your situation in detail so coordinators can assist you effectively..." required></textarea>
            </div>
            <div class="form-submit-row">
              <button class="primary-pill-btn" type="submit">
                ${icon('send', 15)}
                <span>Submit Ticket</span>
              </button>
            </div>
          </form>
        </section>

        <!-- My Support Tickets Section -->
        <section class="modern-card table-section-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">My Support Tickets</h2>
              <p class="card-subtitle">Track status and chat with scholarship coordinators in real time.</p>
            </div>
            <span class="count-badge">${requests.length} Ticket${requests.length === 1 ? '' : 's'}</span>
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
                            ...(request.message ? [{ sender: 'student', senderName: request.userName || 'You', text: request.message, createdAt: request.createdAt }] : []),
                            ...(request.adminReply ? [{ sender: 'admin', senderName: 'Scholarship Administration', text: request.adminReply, createdAt: request.repliedAt || request.createdAt }] : [])
                          ];

                      return `<article class="help-ticket-card" data-ticket-id="${escapeHtml(request.id)}">
                        <div class="help-ticket-header">
                          <div class="help-ticket-meta">
                            <span class="help-category-pill" data-category="${escapeHtml(category)}">
                              ${icon('tag', 12)} ${escapeHtml(category)}
                            </span>
                            <span class="date-cell">${icon('clock', 12)} ${postTime(request.createdAt)}</span>
                          </div>
                          <span class="status-pill ${request.status === 'Resolved' ? 'status-pill-done' : 'status-pill-pending'}">
                            ${request.status === 'Resolved' ? `${icon('check-circle', 12)} Resolved` : `${icon('clock-3', 12)} Awaiting Reply`}
                          </span>
                        </div>

                        <div class="help-ticket-title-row">
                          <h3 class="help-ticket-subject">${escapeHtml(request.subject)}</h3>
                        </div>

                        <!-- Conversation Thread -->
                        <div class="ticket-conversation-thread">
                          ${thread
                            .map(msg => {
                              const isAdmin = msg.sender === 'admin';
                              return `<div class="thread-bubble ${isAdmin ? 'admin' : 'student'}">
                                <div class="thread-bubble-header">
                                  <strong>${isAdmin ? icon('shield', 13) : icon('user', 13)} ${escapeHtml(msg.senderName || (isAdmin ? 'Administration' : 'You'))}</strong>
                                  <small>${msg.createdAt ? postTime(msg.createdAt) : ''}</small>
                                </div>
                                <p class="thread-bubble-text">${escapeHtml(msg.text)}</p>
                              </div>`;
                            })
                            .join('')}
                        </div>

                        <!-- Follow-up Reply Composer -->
                        <div class="ticket-followup-container">
                          <form class="student-followup-form" data-ticket-id="${escapeHtml(request.id)}">
                            <div class="followup-composer-bar">
                              <input type="text" class="pill-input student-followup-input" placeholder="Type a follow-up response or clarification..." maxlength="1000" required />
                              <button class="primary-pill-btn btn-sm" type="submit">
                                ${icon('corner-down-left', 13)}
                                <span>Reply</span>
                              </button>
                            </div>
                          </form>
                        </div>
                      </article>`;
                    })
                    .join('')
                : `
                  <div class="empty-state-card">
                    <div class="empty-state-icon-wrap">${icon('messages-square', 26)}</div>
                    <h3 class="empty-state-title">No Support Tickets Yet</h3>
                    <p class="empty-state-desc">Have questions regarding scholarship renewal, document compliance, or stipend disbursements? Submit an inquiry to coordinators.</p>
                    <div class="empty-state-cta-wrap">
                      <button type="button" class="primary-pill-btn" data-focus-ticket-form>
                        ${icon('plus-circle', 14)} <span>Submit Support Inquiry</span>
                      </button>
                    </div>
                  </div>
                `
            }
          </div>
        </section>
      </main>
    </div>
  </div>`;

  refresh();
};
