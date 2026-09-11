// Modern Student Dashboard View matching reference UI & Renewal Monitoring Workflow

import { icon, escapeHtml } from '../../utils/dom.js';
import { formatSchedule, timeGreeting, postTime } from '../../utils/formatters.js';
import { profileCompletion } from '../../utils/analytics.js';
import { getCurrentUser } from '../../services/auth.js';
import { getRenewalDeadlines, getRenewalSchedules } from '../../services/storage.js';
import { sidebar, topbar } from '../../components/layout.js';
import { studentUpdatesMarkup } from '../../components/announcements.js';
import { refresh } from '../../events.js';

export const studentRenewalMarkup = user => {
  const schedule = getRenewalDeadlines()[user?.school];
  const formattedSchedule = formatSchedule(schedule);

  if (!formattedSchedule) {
    return `<article class="modern-card student-deadline-card awaiting">
      <div class="card-header">
        <div class="deadline-icon-pill neutral">
          ${icon('calendar-clock', 18)}
        </div>
        <span class="status-pill status-pill-pending">Awaiting Schedule</span>
      </div>
      <div class="deadline-card-body">
        <span class="card-category-tag">Renewal Deadline</span>
        <h3 class="card-highlight-title">${escapeHtml(user?.school || 'Partner School')}</h3>
        <p class="deadline-time-text text-muted-note">
          ${icon('info', 14)} <span>Deadline will be announced by scholarship coordinator.</span>
        </p>
      </div>
    </article>`;
  }

  const deadline = new Date(schedule);
  const remainingMs = deadline.getTime() - Date.now();
  const remainingDays = Math.ceil(remainingMs / 86400000);
  const countdown =
    remainingMs < 0
      ? 'Deadline has passed'
      : remainingDays === 0
        ? 'Deadline is today'
        : `${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining`;

  return `<article class="modern-card student-deadline-card ${remainingMs < 0 ? 'expired' : ''}">
    <div class="card-header">
      <div class="deadline-icon-pill ${remainingMs < 0 ? 'danger' : ''}">
        ${icon('clock-3', 18)}
      </div>
      <span class="status-pill ${remainingMs < 0 ? 'status-pill-danger' : 'status-pill-warning'}">${countdown}</span>
    </div>
    <div class="deadline-card-body">
      <span class="card-category-tag">Renewal Deadline</span>
      <h3 class="card-highlight-title">${escapeHtml(user?.school || 'Partner School')}</h3>
      <p class="deadline-time-text">${icon('calendar-days', 14)} <strong>${formattedSchedule}</strong></p>
    </div>
  </article>`;
};

export const studentRenewalScheduleMarkup = user => {
  const schedule = getRenewalSchedules()[user?.school];
  const formattedSchedule = formatSchedule(schedule);

  if (!formattedSchedule) {
    return `<article class="modern-card student-schedule-card awaiting">
      <div class="schedule-card-content">
        <div class="schedule-icon-badge neutral">${icon('calendar-days', 20)}</div>
        <div class="schedule-info-text">
          <span class="card-category-tag">Official Renewal Appointment</span>
          <h3 class="card-highlight-title">${escapeHtml(user?.school || 'Your School')}</h3>
          <p class="deadline-time-text text-muted-note">Appointment date and time pending release by admin.</p>
        </div>
      </div>
      <div class="schedule-status-pill-wrap">
        <span class="status-pill status-pill-pending">Pending Release</span>
      </div>
    </article>`;
  }

  return `<article class="modern-card student-schedule-card">
    <div class="schedule-card-content">
      <div class="schedule-icon-badge">${icon('calendar-check', 20)}</div>
      <div class="schedule-info-text">
        <span class="card-category-tag">Official Renewal Appointment</span>
        <h3 class="card-highlight-title">${escapeHtml(user?.school || 'Your School')}</h3>
        <p class="deadline-time-text">${icon('calendar-days', 14)} <strong>${formattedSchedule}</strong></p>
      </div>
    </div>
    <div class="schedule-status-pill-wrap">
      <span class="status-pill status-pill-done">${icon('check', 13)} Schedule Confirmed</span>
    </div>
  </article>`;
};

export const studentStatusHeroMarkup = user => {
  const isLacking = user?.requirementsStatus === 'Lacking';
  const isActive = user?.scholarStatus !== 'Non-active';
  const scholarType = user?.scholarType || 'Old scholar';
  const programName = 'Academic Excellence Scholarship Grant';

  const documentKey = `scholarHubRenewalDocuments:${user?.id || user?.email || 'guest'}`;
  let uploaded = {};
  try { uploaded = JSON.parse(localStorage.getItem(documentKey) || '{}'); } catch { uploaded = {}; }
  const cogUploaded = Boolean(uploaded.cog);
  const corUploaded = Boolean(uploaded.cor);
  const idUploaded = Boolean(uploaded['student-id']);
  const allMandatoryUploaded = cogUploaded && corUploaded && idUploaded;

  return `<section class="modern-card student-status-hero-card">
    <div class="status-hero-header">
      <div class="status-hero-info">
        <div class="program-badge-row">
          <span class="status-kicker-pill">${escapeHtml(scholarType)}</span>
          <span class="status-period-tag">Academic Year 2026-2027</span>
        </div>
        <h2 class="status-hero-title">${programName}</h2>
        <p class="status-hero-subtitle">
          Enrolled at <strong>${escapeHtml(user?.school || 'Partner School')}</strong> · ${escapeHtml(user?.course || 'Degree Program')} (${escapeHtml(user?.yearLevel || user?.year || 'Current Year')})
        </p>
      </div>
      <div class="status-pills-cluster">
        <span class="status-pill ${isActive ? 'status-pill-done' : 'status-pill-danger'}">
          ${icon(isActive ? 'shield-check' : 'shield-alert', 14)}
          <span>${isActive ? 'Active Scholar' : 'Non-active'}</span>
        </span>
        <span class="status-pill ${isLacking ? (allMandatoryUploaded ? 'status-pill-warning' : 'status-pill-danger') : 'status-pill-done'}">
          ${icon(isLacking ? (allMandatoryUploaded ? 'clock-3' : 'alert-triangle') : 'check-circle-2', 14)}
          <span>${isLacking ? (allMandatoryUploaded ? 'Under Review · Documents Submitted' : 'Action Required: Lacking Documents') : 'Requirements Verified'}</span>
        </span>
      </div>
    </div>

    ${
      isLacking
        ? (allMandatoryUploaded
            ? `<div class="status-hero-alert warning">
                <div class="alert-icon-wrap">${icon('clock-3', 18)}</div>
                <div class="alert-text-wrap">
                  <strong>Renewal Documents Submitted · Verification In Progress</strong>
                  <p>You have submitted all required renewal documents. The scholarship coordinator is reviewing your files for compliance verification. Check your appointment schedule below.</p>
                </div>
              </div>`
            : `<div class="status-hero-alert danger">
                <div class="alert-icon-wrap">${icon('alert-circle', 18)}</div>
                <div class="alert-text-wrap">
                  <strong>Action Required: Renewal Documents Pending Verification</strong>
                  <p>The scholarship coordinator has noted missing or pending submission requirements for your account. Please check the compliance checklist below and submit your documents before the renewal deadline.</p>
                </div>
              </div>`)
        : `<div class="status-hero-alert success">
            <div class="alert-icon-wrap">${icon('sparkles', 18)}</div>
            <div class="alert-text-wrap">
              <strong>You are in good standing for scholarship renewal!</strong>
              <p>Your previous academic records are verified. Review the renewal appointment schedule below for in-person document signing.</p>
            </div>
          </div>`
    }
  </section>`;
};

export const requirementsChecklistMarkup = user => {
  const isLacking = user?.requirementsStatus === 'Lacking';
  const documentKey = `scholarHubRenewalDocuments:${user?.id || user?.email || 'guest'}`;
  let uploaded = {};
  try { uploaded = JSON.parse(localStorage.getItem(documentKey) || '{}'); } catch { uploaded = {}; }

  const checklistItems = [
    {
      title: 'Certificate of Grades (COG)',
      id: 'cog',
      detail: 'Official transcript or grade slip from the preceding semester with no failing grades.',
      status: uploaded.cog ? 'Submitted' : (isLacking ? 'Lacking' : 'Pending'),
      required: true
    },
    {
      title: 'Certificate of Registration / Enrollment (COR)',
      id: 'cor',
      detail: 'Official registration form stamped by your university registrar.',
      status: uploaded.cor ? 'Submitted' : 'Pending',
      required: true
    },
    {
      title: 'Valid Student ID / Clearance',
      id: 'student-id',
      detail: 'Current academic year student identification card or department clearance.',
      status: uploaded['student-id'] ? 'Submitted' : 'Pending',
      required: true
    },
    {
      title: 'Barangay Certificate of Residency',
      id: 'barangay-clearance',
      detail: 'Proof of residency or local government scholarship endorsement.',
      status: uploaded['barangay-clearance'] ? 'Submitted' : 'Pending',
      required: false
    }
  ];

  const mandatoryItems = checklistItems.filter(i => i.required);
  const mandatorySubmitted = mandatoryItems.filter(i => i.status === 'Submitted').length;
  const pendingMandatory = mandatoryItems.length - mandatorySubmitted;
  const allMandatoryDone = pendingMandatory === 0;

  return `<section class="modern-card requirements-checklist-card">
    <div class="card-header">
      <div>
        <h2 class="card-title">Renewal Requirements &amp; Compliance Checklist</h2>
        <p class="card-subtitle">Official documentary requirements required by the scholarship office for verification.</p>
      </div>
      <div class="checklist-header-badge">
        <span class="status-pill ${allMandatoryDone ? 'status-pill-done' : isLacking ? 'status-pill-warning' : 'status-pill-pending'}">
          ${allMandatoryDone ? `${icon('check-check', 13)} All Mandatory Items Submitted` : `${icon('clock', 13)} ${pendingMandatory} Pending Requirement${pendingMandatory === 1 ? '' : 's'}`}
        </span>
      </div>
    </div>

    <div class="checklist-items-grid">
      ${checklistItems
        .map(item => {
          const submitted = item.status === 'Submitted';
          const fileInfo = uploaded[item.id];
          return `<div class="checklist-item-card ${submitted ? 'checked' : ''}">
            <div class="checklist-check-box">
              ${icon(submitted ? 'check' : 'upload-cloud', 15)}
            </div>
            <div class="checklist-text-col">
              <div class="checklist-title-row">
                <strong>${escapeHtml(item.title)}</strong>
                ${item.required ? '<span class="req-mandatory-pill">Mandatory</span>' : '<span class="req-optional-pill">Optional</span>'}
              </div>
              <p>${escapeHtml(item.detail)}</p>
              ${fileInfo ? `<div class="uploaded-doc-badge">${icon('file-text', 12)} <span class="doc-file-name">${escapeHtml(fileInfo.name || 'Document uploaded')}</span></div>` : ''}
            </div>
            <div class="checklist-status-col">
              <span class="status-pill ${submitted ? 'status-pill-done' : item.status === 'Lacking' ? 'status-pill-danger' : 'status-pill-pending'}">
                ${submitted ? 'Submitted' : item.status}
              </span>
              <label class="secondary-pill-btn checklist-upload-btn">${icon('paperclip', 13)} ${fileInfo ? 'Replace file' : 'Upload file'}<input class="renewal-document-upload" type="file" accept=".pdf,image/*" data-document-id="${item.id}" data-document-key="${escapeHtml(documentKey)}" hidden></label>
            </div>
          </div>`;
        })
        .join('')}
    </div>
  </section>`;
};

export const studentDashboard = () => {
  const app = document.querySelector('#app');
  if (!app) return;

  const user = getCurrentUser() || {};
  const firstName = escapeHtml((user?.name || 'Student').split(' ')[0]);
  const completion = profileCompletion(user);
  const renewalReminder = studentRenewalMarkup(user);
  const renewalSchedule = studentRenewalScheduleMarkup(user);

  app.innerHTML = `<div class="portal">
    <div class="sidebar-backdrop"></div>
    ${sidebar(false, 'overview')}
    <div class="main">
      ${topbar(false, 'overview')}
      <main class="content">
        <!-- Hero Header -->
        <section class="dashboard-hero-header">
          <div class="hero-header-text">
            <h1 class="hero-page-title">${timeGreeting()}, ${firstName} <span>👋</span></h1>
            <p class="hero-page-subtitle">Real-time monitoring of your scholarship status, renewal deadlines, and appointment schedules.</p>
          </div>
          <div class="hero-header-actions">
            <button class="secondary-pill-btn" type="button" data-toggle-notifications>
              ${icon('bell', 15)}
              <span>Updates &amp; Notices</span>
            </button>
            <button class="primary-pill-btn" type="button" data-page="scholarships">
              ${icon('award', 15)}
              <span>Explore Programs</span>
            </button>
          </div>
        </section>

        <!-- Main Scholarship Status & Renewal Hero -->
        ${studentStatusHeroMarkup(user)}

        <!-- Renewal Deadlines & Appointment Schedules Grid -->
        <section class="student-kpi-grid">
          ${renewalReminder}
          ${renewalSchedule}
        </section>

        <!-- Requirements Compliance Checklist -->
        ${requirementsChecklistMarkup(user)}

        <!-- Official Campus Announcements Feed -->
        ${studentUpdatesMarkup(user)}
      </main>
    </div>
  </div>`;

  refresh();
};
