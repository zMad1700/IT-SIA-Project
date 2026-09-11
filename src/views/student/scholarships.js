// Modern Student Scholarships Explorer View

import { icon, escapeHtml } from '../../utils/dom.js';
import { formatSchedule } from '../../utils/formatters.js';
import { scholarships } from '../../config/constants.js';
import { getCurrentUser } from '../../services/auth.js';
import { getScholarshipCatalog, getApplicationsCache } from '../../services/storage.js';
import { sidebar, topbar } from '../../components/layout.js';
import { refresh } from '../../events.js';

export const scholarshipsPage = () => {
  const app = document.querySelector('#app');
  if (!app) return;

  const user = getCurrentUser();
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

  const applications = getApplicationsCache().filter(application => application.student_id === user?.id);

  app.innerHTML = `<div class="portal">
    <div class="sidebar-backdrop"></div>
    ${sidebar(false, 'scholarships')}
    <div class="main">
      ${topbar(false, 'scholarships')}
      <main class="content">
        <!-- Hero Header -->
        <section class="dashboard-hero-header">
          <div class="hero-header-text">
            <button class="pill-back-btn" data-page="overview">
              ${icon('arrow-left', 14)} <span>Back to dashboard</span>
            </button>
            <h1 class="hero-page-title">Explore Scholarships</h1>
            <p class="hero-page-subtitle">Find and apply for financial grants tailored to your educational goals.</p>
          </div>
        </section>

        <!-- Scholarship Cards Grid -->
        <section class="scholarship-cards-grid">
          ${
            programs.length
              ? programs
                  .map(program => {
                    const application = applications.find(
                      item => String(item.scholarship_id) === String(program.id)
                    );
                    const closed = program.status && program.status !== 'Open';
                    return `<article class="modern-card scholarship-grant-card">
                      <div class="grant-card-top">
                        <span class="category-pill-tag">${escapeHtml(program.category || 'Scholarship')}</span>
                        <div class="grant-status-indicator ${closed ? 'closed' : 'open'}">
                          <span class="pulse-dot"></span>
                          <span>${closed ? 'Closed' : 'Accepting Applications'}</span>
                        </div>
                      </div>

                      <h2 class="grant-title">${escapeHtml(program.title)}</h2>
                      <p class="grant-description">${escapeHtml(program.description || 'Verified financial support program for qualified university and college scholars.')}</p>

                      <div class="grant-meta-row">
                        <div class="grant-meta-item">
                          <span class="meta-label">Grant Value</span>
                          <strong class="meta-value">${program.amount ? `₱${Number(program.amount).toLocaleString()}` : 'Variable Grant'}</strong>
                        </div>
                        <div class="grant-meta-item">
                          <span class="meta-label">Submission Deadline</span>
                          <span class="meta-value-deadline">${program.deadline ? escapeHtml(formatSchedule(program.deadline)) : 'Rolling'}</span>
                        </div>
                      </div>

                      <div class="grant-card-actions">
                        ${
                          application
                            ? `<span class="status-pill ${application.status === 'Approved' ? 'status-pill-done' : 'status-pill-info'}">
                                ${icon('check-circle', 14)} Application: ${escapeHtml(application.status)}
                              </span>`
                            : `<button class="primary-pill-btn full-width-btn" data-apply-scholarship="${escapeHtml(program.id)}" ${closed ? 'disabled' : ''}>
                                ${icon('send', 15)}
                                <span>${closed ? 'Applications Closed' : 'Apply for Scholarship'}</span>
                              </button>`
                        }
                      </div>
                    </article>`;
                  })
                  .join('')
              : `<div class="empty-state-banner">${icon('book-open', 22)} <span>No scholarship programs are currently available.</span></div>`
          }
        </section>
      </main>
    </div>
  </div>`;

  refresh();
};
