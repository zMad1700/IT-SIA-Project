// Admin scholarship program management view

import { icon, escapeHtml } from '../../utils/dom.js';
import { formatSchedule } from '../../utils/formatters.js';
import { getScholarshipCatalog } from '../../services/storage.js';
import { sidebar, topbar } from '../../components/layout.js';
import { refresh } from '../../events.js';

let editingProgramId = null;

const localDateTimeValue = value => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export const setEditingScholarship = id => {
  editingProgramId = id ? String(id) : null;
};

export const adminScholarshipsPage = () => {
  const app = document.querySelector('#app');
  if (!app) return;

  const scholarshipCatalog = getScholarshipCatalog();
  const editingProgram = scholarshipCatalog.find(item => String(item.id) === editingProgramId);
  if (editingProgramId && !editingProgram) editingProgramId = null;
  const categories = [...new Set(scholarshipCatalog.map(item => item.category).filter(Boolean))].sort();
  const isEditing = Boolean(editingProgram);

  app.innerHTML = `<div class="portal admin">
    <div class="sidebar-backdrop"></div>
    ${sidebar(true, 'scholarships')}
    <div class="main">
      ${topbar(true, 'scholarships')}
      <main class="content">
        <section class="dashboard-hero-header">
          <div class="hero-header-text">
            <button class="pill-back-btn" data-back-dashboard>${icon('arrow-left', 14)} <span>Back to dashboard</span></button>
            <h1 class="hero-page-title">Scholarship Programs</h1>
            <p class="hero-page-subtitle">Publish, revise, close, and organize scholarship opportunities.</p>
          </div>
        </section>

        <section class="modern-card profile-editor-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">${isEditing ? 'Edit Scholarship Program' : 'Create Scholarship Program'}</h2>
              <p class="card-subtitle">${isEditing ? 'Update the opportunity details, grant amount, or deadline.' : 'Fill in the grant criteria, budget, and application deadline.'}</p>
            </div>
          </div>
          <form id="scholarship-form" class="modern-editor-form" data-edit-program-id="${escapeHtml(editingProgram?.id || '')}">
            <div class="two-fields">
              <div class="modern-field"><label>Program Title</label><input id="scholarship-title" class="pill-input" value="${escapeHtml(editingProgram?.title || '')}" placeholder="e.g. Academic Excellence Grant" required></div>
              <div class="modern-field"><label>Category</label><input id="scholarship-category" class="pill-input" value="${escapeHtml(editingProgram?.category || '')}" placeholder="e.g. Merit-based, STEM, Leadership"></div>
            </div>
            <div class="modern-field"><label>Description &amp; Eligibility</label><textarea id="scholarship-description" class="pill-textarea" maxlength="1000" placeholder="Provide details regarding qualifications, coverage, and requirements...">${escapeHtml(editingProgram?.description || '')}</textarea></div>
            <div class="two-fields">
              <div class="modern-field"><label>Grant Amount (PHP)</label><input id="scholarship-amount" class="pill-input" type="number" min="0" step="0.01" value="${escapeHtml(editingProgram?.amount ?? '')}" placeholder="₱0.00"></div>
              <div class="modern-field"><label>Application Deadline</label><input id="scholarship-deadline" class="pill-input" type="datetime-local" value="${escapeHtml(localDateTimeValue(editingProgram?.deadline))}"></div>
            </div>
            <div class="form-submit-row">
              ${isEditing ? '<button class="secondary-pill-btn" type="button" data-cancel-scholarship-edit>Cancel</button>' : ''}
              <button class="primary-pill-btn" type="submit">${icon(isEditing ? 'save' : 'plus', 16)} <span>${isEditing ? 'Save Changes' : 'Publish Program'}</span></button>
            </div>
          </form>
        </section>

        <section class="modern-card table-section-card">
          <div class="card-header table-control-bar">
            <div><h2 class="card-title">Program Catalog</h2><p class="card-subtitle">${scholarshipCatalog.length} scholarship program${scholarshipCatalog.length === 1 ? '' : 's'} in the catalog.</p></div>
            <div class="table-control-actions">
              <div class="table-search-pill">${icon('search', 15)}<input id="program-search" type="search" placeholder="Search programs..." aria-label="Search programs"></div>
              <div class="select-pill-wrapper"><select id="program-category-filter" class="pill-select compact-select" aria-label="Filter programs by category"><option value="all">All categories</option>${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}</select></div>
            </div>
          </div>

          <div class="modern-data-table-wrap">
            <div class="table-head-row catalog-table-head"><span>PROGRAM TITLE</span><span>CATEGORY</span><span>DEADLINE</span><span>STATUS</span><span>ACTIONS</span></div>
            <div class="table-body-rows">
              ${scholarshipCatalog.length ? scholarshipCatalog.map(item => `<div class="table-data-row catalog-table-row" data-program-id="${escapeHtml(item.id)}" data-category="${escapeHtml(item.category || '')}" data-search="${escapeHtml(`${item.title || ''} ${item.category || ''} ${item.description || ''}`.toLowerCase())}">
                <div class="program-title-cell"><div class="program-icon-badge">${icon('award', 16)}</div><strong>${escapeHtml(item.title)}</strong></div>
                <span class="category-pill-tag">${escapeHtml(item.category || 'General')}</span>
                <small class="date-cell">${item.deadline ? escapeHtml(formatSchedule(item.deadline)) : 'Open Admission'}</small>
                <div><span class="status-pill ${item.status === 'Open' ? 'status-pill-done' : 'status-pill-pending'}">${escapeHtml(item.status || 'Open')}</span></div>
                <div class="program-actions-cell">
                  <button class="table-edit-btn" type="button" data-edit-program="${escapeHtml(item.id)}">${icon('pencil', 13)} Edit</button>
                  <button class="program-status-btn" type="button" data-toggle-program="${escapeHtml(item.id)}">${icon(item.status === 'Open' ? 'archive' : 'unlock', 13)} ${item.status === 'Open' ? 'Close' : 'Reopen'}</button>
                  <button class="table-delete-btn" type="button" data-delete-program="${escapeHtml(item.id)}">${icon('trash-2', 13)} Delete</button>
                </div>
              </div>`).join('') : `
                <div class="empty-state-card">
                  <div class="empty-state-icon-wrap">${icon('book-open', 26)}</div>
                  <h3 class="empty-state-title">No Scholarship Programs Published</h3>
                  <p class="empty-state-desc">Get started by creating your first scholarship grant program using the configuration form above.</p>
                  <div class="empty-state-cta-wrap">
                    <button type="button" class="primary-pill-btn" data-focus-new-program>
                      ${icon('plus', 14)} <span>Create First Scholarship</span>
                    </button>
                  </div>
                </div>
              `}
            </div>
          </div>
          <div id="program-filter-empty" class="empty-state-card" hidden>
            <div class="empty-state-icon-wrap warning">${icon('search-x', 26)}</div>
            <h3 class="empty-state-title">No Programs Match Filter</h3>
            <p class="empty-state-desc">No scholarship programs match your search keyword or selected category.</p>
            <div class="empty-state-cta-wrap">
              <button type="button" class="secondary-pill-btn" data-reset-program-filter>
                ${icon('rotate-ccw', 14)} <span>Clear Search &amp; Filters</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>`;

  refresh();
};
