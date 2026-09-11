// Modern Admin Overview Dashboard View matching reference SaaS UI

import { icon, escapeHtml } from '../../utils/dom.js';
import { formatSchedule } from '../../utils/formatters.js';
import { getTotalScholars, getScholarsByType } from '../../utils/analytics.js';
import { schools } from '../../config/constants.js';
import { getRenewalDeadlines, getRenewalSchedules, getHelpRequests, getApplicationsCache, getAccounts } from '../../services/storage.js';
import { sidebar, topbar, stat } from '../../components/layout.js';
import { refresh } from '../../events.js';

export const renewalDeadlineManager = () => {
  const schedules = getRenewalDeadlines();
  const activeSchedules = Object.entries(schedules)
    .filter(([, value]) => value)
    .sort(([, a], [, b]) => new Date(a) - new Date(b));

  return `<section class="modern-card renewal-manager">
    <div class="card-header">
      <div>
        <h2 class="card-title">Renewal Deadline Manager</h2>
        <p class="card-subtitle">Set school-specific deadlines. Reminders will be delivered to enrolled students.</p>
      </div>
    </div>
    <form id="renewal-deadline-form" class="modern-form-row">
      <div class="form-field-group">
        <label class="field-label">Target School</label>
        <div class="select-pill-wrapper">
          <select id="renewal-school" class="pill-select" required>
            <option value="" disabled selected>Select school...</option>
            ${schools.map(school => `<option value="${escapeHtml(school)}">${escapeHtml(school)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-field-group">
        <label class="field-label">Deadline Date &amp; Time</label>
        <input id="renewal-deadline" class="pill-input" type="datetime-local" required>
      </div>
      <div class="form-field-action">
        <button class="primary-pill-btn" type="submit">
          ${icon('bell-ring', 16)}
          <span>Save Reminder</span>
        </button>
      </div>
    </form>
    ${
      activeSchedules.length
        ? `<div class="active-renewal-deadlines-grid">
            ${activeSchedules
              .map(
                ([school, date]) =>
                  `<div class="deadline-mini-pill">
                    <div class="mini-pill-icon">${icon('calendar-clock', 16)}</div>
                    <div class="mini-pill-text">
                      <strong>${escapeHtml(school)}</strong>
                      <small>${formatSchedule(date)}</small>
                    </div>
                    <div class="deadline-mini-actions">
                      <button class="clear-renewal-deadline table-delete-btn" type="button" data-school="${escapeHtml(school)}" title="Clear deadline for ${escapeHtml(school)}" style="padding:4px 8px;font-size:11px;">${icon('trash-2', 12)} Clear</button>
                    </div>
                  </div>`
              )
              .join('')}
          </div>`
        : `<div class="empty-state-card" style="padding:28px 16px;">
            <div class="empty-state-icon-wrap" style="width:44px;height:44px;">${icon('calendar-x-2', 20)}</div>
            <h4 class="empty-state-title" style="font-size:14px;">No Active Renewal Deadlines</h4>
            <p class="empty-state-desc" style="font-size:12px;margin-bottom:0;">Use the deadline form above to assign renewal document cut-offs for partner institutions.</p>
          </div>`
    }
  </section>`;
};

export const renewalScheduleManager = () =>
  `<section class="modern-card renewal-schedule-manager">
    <div class="card-header">
      <div>
        <h2 class="card-title">Renewal Schedule Manager</h2>
        <p class="card-subtitle">Configure the renewal appointment schedule displayed on student portals.</p>
      </div>
    </div>
    <form id="renewal-schedule-form" class="modern-form-row">
      <div class="form-field-group">
        <label class="field-label">Target School</label>
        <div class="select-pill-wrapper">
          <select id="renewal-schedule-school" class="pill-select" required>
            <option value="" disabled selected>Select school...</option>
            ${schools.map(school => `<option value="${escapeHtml(school)}">${escapeHtml(school)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-field-group">
        <label class="field-label">Scheduled Date &amp; Time</label>
        <input id="renewal-schedule-date" class="pill-input" type="datetime-local" required>
      </div>
      <div class="form-field-action">
        <button class="primary-pill-btn" type="submit">
          ${icon('calendar-check', 16)}
          <span>Publish Schedule</span>
        </button>
      </div>
    </form>
  </section>`;

export const needsReviewMarkup = () => {
  const requests = getHelpRequests()
    .filter(request => request.status === 'Pending')
    .slice(-3)
    .reverse();

  if (!requests.length) {
    return `<div class="card-header">
      <div>
        <h2 class="card-title">Recent Inquiries</h2>
        <p class="card-subtitle">Help Center requests awaiting administrative attention.</p>
      </div>
      <button class="pill-text-btn" data-open-help-requests>View all</button>
    </div>
    <div class="empty-review-modern">${icon('check-circle-2', 20)} <span>All inquiries have been reviewed!</span></div>`;
  }

  return `<div class="card-header">
    <div>
      <h2 class="card-title">Recent Inquiries</h2>
      <p class="card-subtitle">Help Center requests awaiting administrative attention.</p>
    </div>
    <button class="pill-text-btn" data-open-help-requests>View all</button>
  </div>
  <div class="review-items-list">
    ${requests
      .map(request => {
        const initials =
          request.userName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0])
            .join('')
            .toUpperCase() || 'ST';
        return `<div class="review-row-modern" data-open-help-requests role="button" tabindex="0">
          <div class="review-avatar-box">${escapeHtml(initials)}</div>
          <div class="review-content-col">
            <strong>${escapeHtml(request.userName)}</strong>
            <small>${escapeHtml(request.subject)}</small>
          </div>
          <div class="review-action-arrow">
            ${icon('chevron-right', 17)}
          </div>
        </div>`;
      })
      .join('')}
  </div>`;
};

let dashboardChartRange = '6';
let dashboardTerm = 'academic-year';

export const setDashboardChartOptions = ({ range, term } = {}) => {
  if (range) dashboardChartRange = range;
  if (term) dashboardTerm = term;
};

const getMonthlyChartData = (monthsCount = 6) => {
  const applications = getApplicationsCache();
  const accounts = getAccounts();
  const now = new Date();
  const months = [];
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const month = d.getMonth();
    const appCount = applications.filter(a => {
      const date = new Date(a.submitted_at || a.created_at);
      return date.getFullYear() === year && date.getMonth() === month;
    }).length;
    const accCount = accounts.filter(a => {
      const date = new Date(a.registeredAt);
      return date.getFullYear() === year && date.getMonth() === month;
    }).length;
    months.push({ label, count: appCount + accCount });
  }
  return months;
};

export const adminDashboard = () => {
  const app = document.querySelector('#app');
  if (!app) return;

  const schedules = getRenewalSchedules();
  const oldScholars = getScholarsByType('Old scholar').length;
  const newScholars = getScholarsByType('New scholar').length;
  const total = getTotalScholars() || 1;
  const oldRatio = Math.round((oldScholars / total) * 100);
  const pendingCount = getHelpRequests().filter(r => r.status === 'Pending').length;
  const chartData = getMonthlyChartData(Number(dashboardChartRange) || 6);
  const chartHighest = Math.max(...chartData.map(d => d.count), 1);
  const chartTotal = chartData.reduce((sum, d) => sum + d.count, 0) || getTotalScholars();

  app.innerHTML = `<div class="portal admin">
    <div class="sidebar-backdrop"></div>
    ${sidebar(true, 'overview')}
    <div class="main">
      ${topbar(true, 'overview')}
      <main class="content">
        <!-- Page Header matching Reference Hero -->
        <section class="dashboard-hero-header">
          <div class="hero-header-text">
            <h1 class="hero-page-title">Analytics Activity - Current Term</h1>
            <p class="hero-page-subtitle">Stay updated with real-time scholarship distribution and student records.</p>
          </div>
          <div class="hero-header-actions">
            <div class="select-pill-wrapper">
              <select id="dashboard-term-filter" class="pill-select" aria-label="Filter period">
                <option value="academic-year" ${dashboardTerm === 'academic-year' ? 'selected' : ''}>Academic Year 2026-2027</option>
                <option value="first-semester" ${dashboardTerm === 'first-semester' ? 'selected' : ''}>First Semester</option>
                <option value="second-semester" ${dashboardTerm === 'second-semester' ? 'selected' : ''}>Second Semester</option>
              </select>
            </div>
            <button class="secondary-pill-btn" type="button" data-export-excel title="Export scholars list as Excel spreadsheet">
              ${icon('download', 15)}
              <span>Export Excel</span>
            </button>
            <button class="secondary-pill-btn" type="button" data-open-import-excel title="Import scholars from Excel spreadsheet">
              ${icon('file-spreadsheet', 15)}
              <span>Import Excel</span>
            </button>
            <button class="primary-pill-btn" type="button" data-add-scholar>
              ${icon('plus', 16)}
              <span>Add Scholar</span>
            </button>
          </div>
        </section>

        <!-- 4-Card Metric Row matching Reference -->
        <section class="stats-grid-modern">
          ${stat('Total Scholars', getTotalScholars(), '+4.8%', 'users', 'blue', 'applicants')}
          ${stat('Active Old Scholars', oldScholars, '+3.2%', 'award', 'cyan', 'scholarships')}
          ${stat('New Scholars', newScholars, '+8.5%', 'sparkles', 'green', 'scholars')}
          ${stat('Pending Review', pendingCount, pendingCount > 0 ? '-1.2%' : '0.0%', 'clock-3', 'purple', 'review')}
        </section>

        <!-- Two-Column Chart & Visual Grid matching Reference -->
        <section class="dashboard-visuals-grid">
          <!-- Main Chart: Performance Overview -->
          <article class="modern-card chart-visual-card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Performance Overview</h2>
                <div class="chart-kpi-summary">
                  <span class="chart-big-number">${chartTotal} <small>Submissions</small></span>
                  <span class="stat-trend-badge trend-up">
                    ${icon('arrow-up-right', 13)}
                    <span>+5.4%</span>
                  </span>
                </div>
              </div>
              <div class="card-header-actions">
                <div class="chart-legend-pill">
                  <span class="legend-dot blue-dot"></span>
                  <span class="legend-label">Monthly Activity</span>
                </div>
                <div class="select-pill-wrapper">
                  <select id="application-chart-range" class="pill-select compact-select" aria-label="Select chart range">
                    <option value="6" ${dashboardChartRange === '6' ? 'selected' : ''}>Last 6 months</option>
                    <option value="12" ${dashboardChartRange === '12' ? 'selected' : ''}>Last 12 months</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="chart-modern-container">
              <div class="bars-modern">
                ${chartData
                  .map(
                    item => {
                      const percent = Math.max(Math.round((item.count / chartHighest) * 100), item.count > 0 ? 15 : 6);
                      return `<div class="bar-col">
                        <div class="bar-fill-track">
                          <i style="height:${percent}%" title="${item.count} submission${item.count === 1 ? '' : 's'} in ${item.label}"></i>
                        </div>
                        <span class="bar-col-label">${item.label}</span>
                      </div>`;
                    }
                  )
                  .join('')}
              </div>
              <div class="chart-y-axis">
                <span>${chartHighest}</span>
                <span>${Math.ceil(chartHighest * 2 / 3)}</span>
                <span>${Math.ceil(chartHighest / 3)}</span>
                <span>0</span>
              </div>
            </div>
          </article>

          <!-- Secondary Visual: Donut / Distribution Card -->
          <article class="modern-card distribution-card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Scholar Distribution</h2>
                <div class="chart-kpi-summary">
                  <span class="chart-big-number">${oldRatio}%</span>
                  <span class="stat-trend-badge trend-up">
                    ${icon('arrow-up-right', 13)}
                    <span>Active Rate</span>
                  </span>
                </div>
              </div>
              <button class="more-options-btn" type="button" data-toggle-distribution-details aria-label="Toggle distribution breakdown">${icon('more-horizontal', 18)}</button>
            </div>

            <div class="donut-visual-wrap">
              <div class="donut-chart-svg">
                <svg viewBox="0 0 100 100" class="donut-svg">
                  <!-- Background Circle -->
                  <circle cx="50" cy="50" r="38" fill="none" stroke="var(--line)" stroke-width="12"></circle>
                  <!-- Cyan Segment (New Scholars) -->
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#06b6d4" stroke-width="12"
                    stroke-dasharray="238.7" stroke-dashoffset="180" stroke-linecap="round"></circle>
                  <!-- Royal Blue Segment (Old Scholars) -->
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#2563eb" stroke-width="12"
                    stroke-dasharray="238.7" stroke-dashoffset="60" stroke-linecap="round"></circle>
                  <!-- Violet Segment (Review) -->
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#8b5cf6" stroke-width="12"
                    stroke-dasharray="238.7" stroke-dashoffset="20" stroke-linecap="round"></circle>
                </svg>
                <div class="donut-center-metric">
                  <strong>${oldRatio}%</strong>
                  <small>Active</small>
                </div>
              </div>

              <div class="donut-legend-row">
                <span class="donut-legend-item"><b class="legend-dot blue-dot"></b> Old Scholars</span>
                <span class="donut-legend-item"><b class="legend-dot cyan-dot"></b> New Scholars</span>
                <span class="donut-legend-item"><b class="legend-dot purple-dot"></b> Pending</span>
              </div>

              <div id="distribution-details" class="distribution-details-box" style="margin-top:12px;padding:8px 12px;background:var(--card-subtle);border-radius:var(--radius-sm);font-size:12px;color:var(--muted);text-align:center;" hidden>
                <strong>${oldScholars}</strong> Old Scholars · <strong>${newScholars}</strong> New Scholars · <strong>${pendingCount}</strong> Pending Inquiries
              </div>
            </div>
          </article>
        </section>

        <!-- Renewal Managers -->
        ${renewalDeadlineManager()}
        ${renewalScheduleManager()}

        <!-- Schedules Table formatted in Reference Payments Table Style -->
        <section class="modern-card table-section-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Renewal Schedules</h2>
              <p class="card-subtitle">Active appointment schedules configured per partner school.</p>
            </div>
            <div class="table-header-pills">
              <div class="select-pill-wrapper">
                <select id="renewal-schedule-cycle-filter" class="pill-select compact-select" aria-label="Filter renewal schedules">
                  <option value="all">All Schedules</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modern-data-table-wrap">
            <div class="table-head-row schedule-table-head">
              <span>SCHOOL</span>
              <span>SCHEDULED DATE &amp; TIME</span>
              <span>STATUS</span>
              <span>ACTION</span>
            </div>
            <div class="table-body-rows">
              ${schools
                .map(
                  school =>
                    `<div class="table-data-row schedule-table-row" data-status="${schedules[school] ? 'confirmed' : 'pending'}">
                      <div class="school-name-cell">
                        <div class="school-avatar-box">${icon('building-2', 15)}</div>
                        <strong>${escapeHtml(school)}</strong>
                      </div>
                      <span class="schedule-time-cell ${schedules[school] ? '' : 'time-not-set'}">
                        ${schedules[school] ? formatSchedule(schedules[school]) : 'No schedule set'}
                      </span>
                      <div>
                        <span class="status-pill ${schedules[school] ? 'status-pill-done' : 'status-pill-pending'}">
                          ${schedules[school] ? 'Confirmed' : 'Pending'}
                        </span>
                      </div>
                      <div class="table-action-cell" style="display:flex;gap:6px;align-items:center;">
                        ${
                          schedules[school]
                            ? `<button class="edit-renewal-schedule table-edit-btn" type="button" data-school="${escapeHtml(school)}">
                                ${icon('pencil', 13)} Edit
                              </button>
                              <button class="clear-renewal-schedule table-delete-btn" type="button" data-school="${escapeHtml(school)}">
                                ${icon('trash-2', 13)} Clear
                              </button>`
                            : `<button class="edit-renewal-schedule table-edit-btn" type="button" data-school="${escapeHtml(school)}">
                                ${icon('plus', 13)} Set Date
                              </button>`
                        }
                      </div>
                    </div>`
                )
                .join('')}
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>`;

  refresh();
};
