// Modern Admin Registered Accounts view

import { icon, escapeHtml, displayName } from '../../utils/dom.js';
import { registrationDate } from '../../utils/formatters.js';
import { schools } from '../../config/constants.js';
import { getAccounts, saveAccounts } from '../../services/storage.js';
import { accountYearLevel } from '../../services/auth.js';
import { sidebar, topbar } from '../../components/layout.js';
import { refresh } from '../../events.js';

export const registeredAccountsPage = () => {
  const app = document.querySelector('#app');
  if (!app) return;

  const legacyRegistrationDate = '2026-09-06T00:00:00.000Z';
  const savedAccounts = getAccounts();
  let migratedLegacyAccount = false;
  const accounts = savedAccounts.map(account => {
    if (account.role === 'user' && !account.addedByAdmin && !account.registeredAt) {
      migratedLegacyAccount = true;
      return { ...account, registeredAt: legacyRegistrationDate };
    }
    return account;
  });
  if (migratedLegacyAccount) saveAccounts(accounts);

  const registeredAccounts = accounts
    .filter(account => account.role === 'user' && !account.addedByAdmin)
    .slice()
    .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));

  const registeredSchools = [
    ...new Set([...schools, ...registeredAccounts.map(account => account.school).filter(Boolean)])
  ];

  app.innerHTML = `<div class="portal admin">
    <div class="sidebar-backdrop"></div>
    ${sidebar(true, 'registered-accounts')}
    <div class="main">
      ${topbar(true, 'registered-accounts')}
      <main class="content">
        <!-- Hero Header -->
        <section class="dashboard-hero-header">
          <div class="hero-header-text">
            <button class="pill-back-btn" data-back-dashboard>
              ${icon('arrow-left', 14)} <span>Back to dashboard</span>
            </button>
            <h1 class="hero-page-title">Registered Accounts</h1>
            <p class="hero-page-subtitle">All student accounts created directly through the ScholarHub registration portal.</p>
          </div>
          <div class="hero-header-actions">
            <div class="stat-trend-badge trend-up" style="font-size: 13px; padding: 8px 16px;">
              ${icon('users', 16)}
              <span>${registeredAccounts.length} Registered</span>
            </div>
          </div>
        </section>

        <!-- Table Card matching Reference Payments Table -->
        <section class="modern-card table-section-card">
          <div class="card-header table-control-bar">
            <div>
              <h2 class="card-title">Account Directory</h2>
              <p class="card-subtitle">Showing ${registeredAccounts.length} students enrolled.</p>
            </div>
            <div class="table-control-actions">
              <div class="table-search-pill">
                ${icon('search', 15)}
                <input id="registered-account-search" type="search" placeholder="Search name, email, school, or course..." />
              </div>
              <div class="select-pill-wrapper">
                <select id="registered-school-filter" class="pill-select compact-select" aria-label="Filter by school">
                  <option value="all">All schools</option>
                  ${registeredSchools.map(school => `<option value="${escapeHtml(school)}">${escapeHtml(school)}</option>`).join('')}
                </select>
              </div>
              <div class="select-pill-wrapper">
                <select id="registered-year-filter" class="pill-select compact-select" aria-label="Filter by year">
                  <option value="all">All year levels</option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modern-data-table-wrap">
            <div class="table-head-row registered-account-head">
              <span>STUDENT</span>
              <span>EMAIL ADDRESS</span>
              <span>SCHOLAR TYPE</span>
              <span>SCHOOL &amp; COURSE</span>
              <span>YEAR</span>
              <span>REGISTERED DATE</span>
            </div>
            <div id="registered-account-rows" class="table-body-rows">
              ${
                registeredAccounts.length
                  ? registeredAccounts
                      .map(
                        account =>
                          `<div class="table-data-row registered-account-row" data-search="${escapeHtml(
                            `${account.name || ''} ${account.email || ''} ${account.school || ''} ${account.course || ''}`.toLowerCase()
                          )}" data-scholar-type="${escapeHtml(account.scholarType || '')}" data-school="${escapeHtml(
                            account.school || ''
                          )}" data-year-level="${escapeHtml(accountYearLevel(account))}">
                            <div class="student-user-cell">
                              <div class="student-avatar-circle">
                                ${(account.firstName || account.name || 'S')[0]}
                              </div>
                              <strong>${displayName(account)}</strong>
                            </div>
                            <span class="email-cell">${escapeHtml(account.email)}</span>
                            <div>
                              <span class="status-pill ${account.scholarType === 'Old scholar' ? 'status-pill-done' : 'status-pill-info'}">
                                ${escapeHtml(account.scholarType || 'Not specified')}
                              </span>
                            </div>
                            <div class="school-course-cell">
                              <strong>${escapeHtml(account.school || 'Not provided')}</strong>
                              <small>${escapeHtml(account.course || 'Not provided')}</small>
                            </div>
                            <span class="year-cell">${escapeHtml(accountYearLevel(account) || '—')}</span>
                            <small class="date-cell">${registrationDate(account.registeredAt)}</small>
                          </div>`
                      )
                      .join('')
                  : `<div class="empty-state-banner">${icon('users', 20)} <span>No student accounts have registered yet.</span></div>`
              }
            </div>
          </div>
          <div id="registered-empty" class="empty-state-banner" hidden>
            ${icon('search-x', 20)} <span>No registered account matches your search criteria.</span>
          </div>
        </section>
      </main>
    </div>
  </div>`;

  refresh();
};
