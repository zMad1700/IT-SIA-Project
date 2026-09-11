// Modern Admin Scholars Table View (Active Scholars & New Scholars)

import { icon, escapeHtml } from '../../utils/dom.js';
import { schools } from '../../config/constants.js';
import { getAccounts } from '../../services/storage.js';
import { accountYearLevel } from '../../services/auth.js';
import { getScholarsByType, getTotalScholars } from '../../utils/analytics.js';
import { sidebar, topbar } from '../../components/layout.js';
import { adminHelpRequestsPage } from './helpRequests.js';
import { refresh } from '../../events.js';

let adminDetailAccounts = [];

export const getAdminDetailAccounts = () => adminDetailAccounts;

export const adminDetail = type => {
  if (type === 'review') return adminHelpRequestsPage();

  const app = document.querySelector('#app');
  if (!app) return;

  const oldScholars = getScholarsByType('Old scholar');
  const newScholars = getScholarsByType('New scholar');
  const info = {
    applicants: ['Total Scholars', `${getTotalScholars()} verified student scholars`],
    scholarships: ['Active Old Scholars', `${oldScholars.length} currently enrolled old scholars`],
    scholars: ['New Scholars', `${newScholars.length} newly admitted scholars`],
    review: ['Pending Review', 'Applications awaiting administrative action']
  }[type] || ['Scholars', 'Scholar records'];

  const relevantAccounts =
    type === 'scholarships'
      ? oldScholars
      : type === 'scholars'
        ? newScholars
        : getAccounts().filter(account => account.role === 'user' && ['Old scholar', 'New scholar'].includes(account.scholarType));

  adminDetailAccounts = relevantAccounts;

  const records = relevantAccounts.map(account => [
    account.lastName || account.name?.split(' ').at(-1) || '—',
    account.firstName || account.name?.split(' ')[0] || '—',
    account.middleName ? `${account.middleName[0]}.` : '—',
    account.school || 'Not provided',
    accountYearLevel(account) || 'Not provided',
    account.course || 'Not provided',
    account.requirementsStatus || 'Complete',
    account.scholarStatus || 'Active',
    account.email
  ]);

  const currentRouteName = type === 'scholarships' ? 'active-scholars' : 'scholars';

  app.innerHTML = `<div class="portal admin">
    <div class="sidebar-backdrop"></div>
    ${sidebar(true, currentRouteName)}
    <div class="main">
      ${topbar(true, currentRouteName)}
      <main class="content">
        <!-- Hero Header -->
        <section class="dashboard-hero-header">
          <div class="hero-header-text">
            <button class="pill-back-btn" data-back-dashboard>
              ${icon('arrow-left', 14)} <span>Back to dashboard</span>
            </button>
            <h1 class="hero-page-title">${info[0]}</h1>
            <p class="hero-page-subtitle">${info[1]}</p>
          </div>
          <div class="hero-header-actions">
            <button class="primary-pill-btn" type="button" data-add-scholar>
              ${icon('user-plus', 16)}
              <span>Add Scholar</span>
            </button>
          </div>
        </section>

        <!-- Table Card matching Reference Payments Table -->
        <section class="modern-card table-section-card">
          <div class="card-header table-control-bar">
            <div>
              <h2 class="card-title">Student Records</h2>
              <p class="card-subtitle">Showing ${records.length} registered students.</p>
            </div>
            <div class="table-control-actions">
              <div class="table-search-pill">
                ${icon('search', 15)}
                <input id="scholar-search-input" type="search" placeholder="Search by name, school, course..." />
              </div>
              <div class="select-pill-wrapper">
                <select id="school-filter" class="pill-select compact-select" aria-label="Filter by school">
                  <option value="all">All schools</option>
                  ${schools.map(school => `<option value="${escapeHtml(school)}">${escapeHtml(school)}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>

          <div class="modern-data-table-wrap">
            <div class="table-head-row student-record-head">
              <span>LAST NAME</span>
              <span>FIRST NAME</span>
              <span>M.I.</span>
              <span>SCHOOL</span>
              <span>YEAR</span>
              <span>COURSE</span>
              <span>REQUIREMENTS</span>
              <span>STATUS &amp; ACTIONS</span>
            </div>
            <div class="table-body-rows">
              ${
                records.length
                  ? records
                      .map(
                        row => `<div class="table-data-row student-record-row" data-account-email="${escapeHtml(row[8])}">
                          <strong>${escapeHtml(row[0])}</strong>
                          <span>${escapeHtml(row[1])}</span>
                          <span class="text-muted-cell">${escapeHtml(row[2])}</span>
                          <small class="school-name-cell">${escapeHtml(row[3])}</small>
                          <span class="text-muted-cell">${escapeHtml(row[4])}</span>
                          <span class="course-cell">${escapeHtml(row[5])}</span>
                          <div>
                            <select class="record-select requirement-select ${row[6] === 'Complete' ? 'complete' : 'lacking'}">
                              <option ${row[6] === 'Complete' ? 'selected' : ''}>Complete</option>
                              <option ${row[6] === 'Lacking' ? 'selected' : ''}>Lacking</option>
                            </select>
                          </div>
                          <div class="status-actions-cell">
                            <select class="record-select status-select ${row[7] === 'Active' ? 'active' : 'non-active'}">
                              <option ${row[7] === 'Active' ? 'selected' : ''}>Active</option>
                              <option ${row[7] === 'Non-active' ? 'selected' : ''}>Non-active</option>
                            </select>
                            <button class="delete-row modern-icon-btn" title="Delete record" aria-label="Delete ${escapeHtml(row[0])}">
                              ${icon('trash-2', 15)}
                            </button>
                          </div>
                        </div>`
                      )
                      .join('')
                  : `<div class="empty-state-banner">${icon('users', 20)} <span>No scholars found in this category.</span></div>`
              }
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>`;

  refresh();
};
