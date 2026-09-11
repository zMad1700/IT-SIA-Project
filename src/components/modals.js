// Modals and dialog components in modern SaaS theme

import { icon, escapeHtml, userAvatar } from '../utils/dom.js';
import { schools, scholarships } from '../config/constants.js';
import { supabase } from '../services/supabase.js';
import { getAccounts, saveAccounts, getScholarshipCatalog } from '../services/storage.js';
import { getCurrentUser, hashPassword, profileFields } from '../services/auth.js';
import { navigateTo } from '../router.js';
import { showToast } from './toast.js';

export const openAddScholarModal = () => {
  document.body.insertAdjacentHTML(
    'beforeend',
    `<div class="modal-backdrop-modern" id="add-scholar-modal">
      <section class="modal-card-modern" role="dialog" aria-modal="true" aria-labelledby="add-scholar-title">
        <div class="modal-card-header">
          <div class="modal-title-wrap">
            <div class="modal-icon-badge">${icon('user-plus', 20)}</div>
            <div>
              <h2 id="add-scholar-title" class="modal-title">Add Returning Scholar</h2>
              <p class="modal-subtitle">Enroll an existing scholar into the official scholarship roster.</p>
            </div>
          </div>
          <button class="modal-close-pill" type="button" aria-label="Close">${icon('x', 18)}</button>
        </div>

        <form id="add-scholar-form" class="modern-editor-form">
          <div class="two-fields">
            <div class="modern-field">
              <label>Last Name</label>
              <input id="add-last-name" class="pill-input" placeholder="e.g. Dela Cruz" required>
            </div>
            <div class="modern-field">
              <label>First Name</label>
              <input id="add-first-name" class="pill-input" placeholder="e.g. Juan" required>
            </div>
          </div>

          <div class="modern-field">
            <label>Middle Name</label>
            <input id="add-middle-name" class="pill-input" placeholder="e.g. Santos (optional)">
          </div>

          <div class="two-fields">
            <div class="modern-field">
              <label>Sex</label>
              <div class="select-pill-wrapper">
                <select id="add-sex" class="pill-select" required>
                  <option value="" disabled selected>Select sex...</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
            </div>
            <div class="modern-field">
              <label>Scholar Type</label>
              <div class="select-pill-wrapper">
                <select id="add-scholar-type" class="pill-select" required>
                  <option>Old scholar</option>
                  <option>New scholar</option>
                </select>
              </div>
            </div>
          </div>

          <div class="two-fields">
            <div class="modern-field">
              <label>Birth Date</label>
              <input id="add-birth-date" class="pill-input" type="date" required>
            </div>
            <div class="modern-field">
              <label>Contact Number</label>
              <input id="add-contact" class="pill-input" type="tel" inputmode="numeric" placeholder="09XX XXX XXXX" required>
            </div>
          </div>

          <div class="two-fields">
            <div class="modern-field">
              <label>Purok / Street</label>
              <input id="add-purok" class="pill-input" placeholder="Purok 1" required>
            </div>
            <div class="modern-field">
              <label>Barangay</label>
              <input id="add-barangay" class="pill-input" placeholder="Barangay" required>
            </div>
          </div>

          <div class="modern-field">
            <label>Municipality / City</label>
            <input id="add-municipality" class="pill-input" placeholder="City or Municipality" required>
          </div>

          <div class="modern-field">
            <label>Partner University / College</label>
            <div class="select-pill-wrapper">
              <select id="add-school" class="pill-select" required>
                <option value="" disabled selected>Select educational institution...</option>
                ${schools.map(school => `<option>${school}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="two-fields">
            <div class="modern-field">
              <label>Year Level</label>
              <div class="select-pill-wrapper">
                <select id="add-year-level" class="pill-select" required>
                  <option value="" disabled selected>Select year...</option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>
              </div>
            </div>
            <div class="modern-field">
              <label>Course / Degree</label>
              <input id="add-course" class="pill-input" placeholder="e.g. BS Information Technology" required>
            </div>
          </div>

          <div class="modern-field">
            <label>Official Email Address</label>
            <input id="add-email" class="pill-input" type="email" placeholder="student@university.edu" required>
          </div>

          ${supabase ? '' : `<div class="modern-field"><label>Temporary Password</label><input id="add-password" class="pill-input" type="password" minlength="6" placeholder="At least 6 characters" required></div>`}

          <div class="modal-actions-row">
            <button class="secondary-pill-btn modal-cancel" type="button">Cancel</button>
            <button class="primary-pill-btn" type="submit">
              ${icon('check', 16)}
              <span>Add to Roster</span>
            </button>
          </div>
        </form>
      </section>
    </div>`
  );

  window.lucide?.createIcons?.();
  const modal = document.querySelector('#add-scholar-modal');
  const close = () => modal?.remove();
  modal.querySelector('.modal-close-pill').onclick = close;
  modal.querySelector('.modal-cancel').onclick = close;
  modal.addEventListener('click', event => {
    if (event.target === modal) close();
  });

  modal.querySelector('#add-scholar-form').addEventListener('submit', async event => {
    event.preventDefault();
    const contact = modal.querySelector('#add-contact').value.trim();
    const email = modal.querySelector('#add-email').value.trim().toLowerCase();
    const yearLevel = modal.querySelector('#add-year-level').value;
    if (!/^\+?[0-9\s-]{7,20}$/.test(contact)) return showToast('Please enter a valid contact number.', 'warning');

    const account = {
      email,
      phone: contact,
      name: `${modal.querySelector('#add-first-name').value.trim()} ${modal.querySelector('#add-middle-name').value.trim()} ${modal.querySelector('#add-last-name').value.trim()}`
        .replace(/\s+/g, ' ')
        .trim(),
      lastName: modal.querySelector('#add-last-name').value.trim(),
      firstName: modal.querySelector('#add-first-name').value.trim(),
      middleName: modal.querySelector('#add-middle-name').value.trim(),
      sex: modal.querySelector('#add-sex').value,
      birthDate: modal.querySelector('#add-birth-date').value,
      purok: modal.querySelector('#add-purok').value.trim(),
      barangay: modal.querySelector('#add-barangay').value.trim(),
      municipality: modal.querySelector('#add-municipality').value.trim(),
      school: modal.querySelector('#add-school').value.trim(),
      yearLevel,
      year: yearLevel,
      course: modal.querySelector('#add-course').value.trim(),
      scholarType: modal.querySelector('#add-scholar-type').value,
      requirementsStatus: 'Complete',
      scholarStatus: 'Active',
      role: 'user',
      registeredAt: new Date().toISOString(),
      addedByAdmin: true
    };

    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, data: profileFields(account) }
      });
      if (error) return showToast(`Could not send invitation: ${error.message}`, 'error');
      close();
      return showToast(`Invitation sent to ${email}. The scholar can use the secure link to access ScholarHub.`, 'success');
    }

    const accounts = getAccounts();
    if (accounts.some(item => item.email === email)) return showToast('An account already exists for this email.', 'warning');
    account.password = await hashPassword(modal.querySelector('#add-password').value);
    accounts.push(account);
    saveAccounts(accounts);
    close();
    showToast(`Scholar ${account.name} added to official roster successfully.`, 'success');
    navigateTo('active-scholars');
  });
};

export const openStudentDetailsModal = account => {
  const existing = document.querySelector('#student-details-modal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop-modern" id="student-details-modal">
    <section class="modal-card-modern" role="dialog" aria-modal="true" aria-labelledby="student-details-title">
      <div class="modal-card-header"><div class="modal-title-wrap"><div class="modal-icon-badge">${icon('user-round', 20)}</div><div><h2 id="student-details-title" class="modal-title">${escapeHtml(account.name || 'Student')}</h2><p class="modal-subtitle">Registered student profile</p></div></div><button class="modal-close-pill" type="button" aria-label="Close">${icon('x', 18)}</button></div>
      <div class="profile-details-grid"><p><small>Email</small><strong>${escapeHtml(account.email || 'Not provided')}</strong></p><p><small>Phone</small><strong>${escapeHtml(account.phone || 'Not provided')}</strong></p><p><small>School</small><strong>${escapeHtml(account.school || 'Not provided')}</strong></p><p><small>Course / Year</small><strong>${escapeHtml([account.course, account.yearLevel || account.year].filter(Boolean).join(' · ') || 'Not provided')}</strong></p><p><small>Scholar type</small><strong>${escapeHtml(account.scholarType || 'Not specified')}</strong></p><p><small>Roster status</small><strong>${escapeHtml(account.scholarStatus || 'Active')}</strong></p></div>
      <div class="modal-actions-row"><button class="secondary-pill-btn modal-cancel" type="button">Close</button></div>
    </section>
  </div>`);
  window.lucide?.createIcons?.();
  const modal = document.querySelector('#student-details-modal');
  const close = () => modal?.remove();
  modal.querySelector('.modal-close-pill').onclick = close;
  modal.querySelector('.modal-cancel').onclick = close;
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
};

export const openLogoutModal = onConfirm => {
  const existing = document.querySelector('#logout-confirm-modal');
  if (existing) existing.remove();

  const user = getCurrentUser() || {};
  const userName = user.name || 'User';
  const userEmail = user.email || '';

  document.body.insertAdjacentHTML(
    'beforeend',
    `<div class="modal-backdrop-modern" id="logout-confirm-modal">
      <section class="modal-card-modern modal-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-dialog-title">
        <div class="modal-card-header">
          <div class="modal-title-wrap">
            <div class="modal-icon-badge danger">${icon('log-out', 20)}</div>
            <div>
              <h2 id="logout-dialog-title" class="modal-title">Sign Out of ScholarHub?</h2>
              <p class="modal-subtitle">Are you sure you want to end your current session?</p>
            </div>
          </div>
          <button class="modal-close-pill" type="button" aria-label="Close">${icon('x', 18)}</button>
        </div>

        <div class="modal-confirm-body">
          <p>You will need to enter your login credentials to access your scholarship workspace again.</p>
          ${
            userEmail
              ? `<div class="modal-confirm-user-box">
                  <div class="user-avatar-wrap">
                    ${userAvatar(user, 'modern-avatar')}
                  </div>
                  <div>
                    <strong>${escapeHtml(userName)}</strong>
                    <small>${escapeHtml(userEmail)}</small>
                  </div>
                </div>`
              : ''
          }
        </div>

        <div class="modal-actions-row">
          <button class="secondary-pill-btn modal-cancel" type="button">Cancel</button>
          <button class="danger-pill-btn modal-confirm-logout" type="button">
            ${icon('log-out', 16)}
            <span>Yes, Sign Out</span>
          </button>
        </div>
      </section>
    </div>`
  );

  window.lucide?.createIcons?.();
  const modal = document.querySelector('#logout-confirm-modal');
  const close = () => {
    document.removeEventListener('keydown', onKey);
    modal?.remove();
  };

  const onKey = event => {
    if (event.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKey);

  modal.querySelector('.modal-close-pill').onclick = close;
  modal.querySelector('.modal-cancel').onclick = close;
  modal.addEventListener('click', event => {
    if (event.target === modal) close();
  });

  modal.querySelector('.modal-confirm-logout').onclick = () => {
    close();
    onConfirm?.();
  };
};

export const openApplicationModal = (program, student, onSubmitted) => {
  const existing = document.querySelector('#scholarship-apply-modal');
  if (existing) existing.remove();

  const grantAmount = program.amount ? `₱${Number(program.amount).toLocaleString()}` : 'Variable Grant';
  const academicSummary = [student?.school, student?.course, student?.yearLevel || student?.year].filter(Boolean).join(' · ') || 'Academic details registered in ScholarHub';

  document.body.insertAdjacentHTML(
    'beforeend',
    `<div class="modal-backdrop-modern" id="scholarship-apply-modal">
      <section class="modal-card-modern application-modal-card" role="dialog" aria-modal="true" aria-labelledby="apply-modal-title">
        <div class="modal-card-header">
          <div class="modal-title-wrap">
            <div class="modal-icon-badge">${icon('award', 20)}</div>
            <div>
              <h2 id="apply-modal-title" class="modal-title">Scholarship Application</h2>
              <p class="modal-subtitle">Submit your academic qualification details for grant evaluation.</p>
            </div>
          </div>
          <button class="modal-close-pill" type="button" aria-label="Close">${icon('x', 18)}</button>
        </div>

        <div class="application-modal-program-banner">
          <div class="program-banner-info">
            <span class="category-pill-tag">${escapeHtml(program.category || 'Scholarship')}</span>
            <h3 class="program-banner-title">${escapeHtml(program.title)}</h3>
          </div>
          <div class="program-banner-grant">
            <span class="meta-label">Grant Award</span>
            <strong class="program-grant-amount">${grantAmount}</strong>
          </div>
        </div>

        <form id="scholarship-apply-form" class="modern-editor-form">
          <div class="applicant-quick-summary-box">
            <div class="summary-box-header">
              <span class="summary-box-label">${icon('user-check', 14)} Verified Applicant Profile</span>
            </div>
            <strong>${escapeHtml(student?.name || 'Student Applicant')}</strong>
            <small>${escapeHtml(academicSummary)}</small>
          </div>

          <div class="two-fields">
            <div class="modern-field">
              <label>Current GWA / GPA</label>
              <input id="apply-gwa" class="pill-input" type="number" step="0.01" min="1.0" max="5.0" placeholder="e.g. 1.25" required>
              <small>From the preceding semester grade slip.</small>
            </div>
            <div class="modern-field">
              <label>Annual Household Income</label>
              <div class="select-pill-wrapper">
                <select id="apply-income" class="pill-select" required>
                  <option value="" disabled selected>Select income bracket...</option>
                  <option value="Below ₱150,000">Below ₱150,000</option>
                  <option value="₱150,000 - ₱300,000">₱150,000 - ₱300,000</option>
                  <option value="₱300,000 - ₱500,000">₱300,000 - ₱500,000</option>
                  <option value="Above ₱500,000">Above ₱500,000</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modern-field">
            <label>Statement of Intent &amp; Objectives</label>
            <textarea id="apply-statement" class="pill-textarea" maxlength="1000" rows="3" placeholder="Briefly state why you are applying for this scholarship grant and how it will support your studies..." required></textarea>
          </div>

          <div class="modern-field">
            <label>Proof of Enrollment Attachment (COR or ID)</label>
            <div class="upload-dropzone-pill">
              <label for="apply-proof-file" class="secondary-pill-btn file-upload-trigger">
                ${icon('paperclip', 14)}
                <span>Select Document (PDF/Image)</span>
                <input id="apply-proof-file" type="file" accept=".pdf,image/*" hidden>
              </label>
              <span id="apply-file-label" class="file-name-indicator">No file attached (optional in demo)</span>
            </div>
          </div>

          <div class="modal-actions-row">
            <button class="secondary-pill-btn modal-cancel" type="button">Cancel</button>
            <button class="primary-pill-btn apply-submit-btn" type="submit">
              ${icon('send', 15)}
              <span>Submit Official Application</span>
            </button>
          </div>
        </form>
      </section>
    </div>`
  );

  window.lucide?.createIcons?.();
  const modal = document.querySelector('#scholarship-apply-modal');
  const close = () => {
    document.removeEventListener('keydown', onKey);
    modal?.remove();
  };

  const onKey = event => {
    if (event.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKey);

  modal.querySelector('.modal-close-pill').onclick = close;
  modal.querySelector('.modal-cancel').onclick = close;
  modal.addEventListener('click', event => {
    if (event.target === modal) close();
  });

  const fileInput = modal.querySelector('#apply-proof-file');
  const fileLabel = modal.querySelector('#apply-file-label');
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      fileLabel.textContent = fileInput.files[0].name;
      fileLabel.classList.add('has-file');
    } else {
      fileLabel.textContent = 'No file attached';
      fileLabel.classList.remove('has-file');
    }
  });

  const form = modal.querySelector('#scholarship-apply-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const gwa = modal.querySelector('#apply-gwa').value.trim();
    const income = modal.querySelector('#apply-income').value;
    const statement = modal.querySelector('#apply-statement').value.trim();
    const file = fileInput.files[0];
    const fileName = file?.name || null;
    let fileData = null;
    if (file) {
      fileData = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }
    const submitBtn = form.querySelector('.apply-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Submitting...</span>`;
    await onSubmitted?.({ gwa, income, statement, fileName, fileData });
    close();
  });
};

export const openApplicationInspectionModal = (application, applicant, program, onDecision) => {
  const existing = document.querySelector('#application-inspect-modal');
  if (existing) existing.remove();

  const applicantName = applicant?.name || applicant?.firstName ? `${applicant?.firstName || ''} ${applicant?.lastName || ''}`.trim() || applicant?.name : 'Student Applicant';
  const email = applicant?.email || application.student_id || 'Email unavailable';
  const school = applicant?.school || 'School unassigned';
  const course = applicant?.course || 'Degree unassigned';
  const yearLevel = applicant?.yearLevel || applicant?.year || 'Year unassigned';
  const programTitle = program?.title || 'Scholarship Grant';
  const grantAmount = program?.amount ? `₱${Number(program.amount).toLocaleString()}` : 'Variable Grant';
  const status = application.status || 'Submitted';

  // Read student uploaded renewal documents from localStorage if available
  const studentKey = applicant?.id || applicant?.email || application.student_id;
  const renewalDocsKey = `scholarHubRenewalDocuments:${studentKey}`;
  let renewalDocs = {};
  try {
    renewalDocs = JSON.parse(localStorage.getItem(renewalDocsKey) || '{}');
  } catch {
    renewalDocs = {};
  }

  const checklistTypes = [
    { id: 'cog', title: 'Certificate of Grades (COG)' },
    { id: 'cor', title: 'Certificate of Registration (COR)' },
    { id: 'student-id', title: 'Valid Student ID Card' },
    { id: 'barangay-clearance', title: 'Barangay Indigency / Clearance' }
  ];

  // Document attachments list
  const docList = [];
  if (application.file_name) {
    docList.push({
      label: 'Application Proof Attachment',
      name: application.file_name,
      data: application.file_data || null,
      source: 'Direct Application Upload',
      date: application.submitted_at || application.created_at
    });
  }
  checklistTypes.forEach(type => {
    const doc = renewalDocs[type.id];
    if (doc) {
      docList.push({
        label: type.title,
        name: doc.name || `${type.id}.pdf`,
        data: doc.data || null,
        source: 'Renewal Checklist',
        date: doc.uploadedAt
      });
    }
  });

  const statusClass =
    status === 'Approved'
      ? 'status-pill-done'
      : status === 'Rejected'
        ? 'status-pill-danger'
        : status === 'Under review'
          ? 'status-pill-info'
          : 'status-pill-pending';

  document.body.insertAdjacentHTML(
    'beforeend',
    `<div class="modal-backdrop-modern" id="application-inspect-modal">
      <section class="modal-card-modern inspection-modal-card" role="dialog" aria-modal="true" aria-labelledby="inspect-modal-title">
        <div class="modal-card-header">
          <div class="modal-title-wrap">
            <div class="modal-icon-badge">${icon('file-search', 20)}</div>
            <div>
              <h2 id="inspect-modal-title" class="modal-title">Application Dossier &amp; Proof Inspection</h2>
              <p class="modal-subtitle">Verify submitted credentials, academic metrics, and documentary evidence before recording an award decision.</p>
            </div>
          </div>
          <button class="modal-close-pill" type="button" aria-label="Close">${icon('x', 18)}</button>
        </div>

        <div class="inspection-applicant-banner">
          <div class="inspection-applicant-info">
            <div class="student-avatar-circle" style="width:44px;height:44px;font-size:16px;">${escapeHtml((applicantName || 'S')[0])}</div>
            <div class="inspection-applicant-details">
              <strong>${escapeHtml(applicantName)}</strong>
              <small>${escapeHtml(email)} · ${escapeHtml(school)}</small>
            </div>
          </div>
          <div style="text-align:right;">
            <span class="status-pill ${statusClass}">${escapeHtml(status)}</span>
            <small style="display:block;margin-top:4px;color:var(--muted);">${escapeHtml(programTitle)} (${grantAmount})</small>
          </div>
        </div>

        <div class="inspection-metrics-grid">
          <div class="inspection-metric-card">
            <span class="meta-label">Enrolled Program &amp; Level</span>
            <span class="meta-value">${escapeHtml(course)} · ${escapeHtml(yearLevel)}</span>
          </div>
          <div class="inspection-metric-card">
            <span class="meta-label">Declared GWA / GPA</span>
            <strong class="meta-value" style="color:var(--primary);">${escapeHtml(application.gwa || '1.25')}</strong>
          </div>
          <div class="inspection-metric-card">
            <span class="meta-label">Annual Household Income</span>
            <span class="meta-value">${escapeHtml(application.household_income || 'Below ₱150,000')}</span>
          </div>
          <div class="inspection-metric-card">
            <span class="meta-label">Submitted Timestamp</span>
            <span class="meta-value" style="font-size:12.5px;">${application.submitted_at || application.created_at ? new Date(application.submitted_at || application.created_at).toLocaleString() : 'Recently'}</span>
          </div>
        </div>

        <div class="inspection-statement-card">
          <h4>${icon('quote', 14)} Statement of Intent &amp; Objectives</h4>
          <p>"${escapeHtml(application.statement || 'Dedicated scholar striving for academic excellence and community contribution.')}"</p>
        </div>

        <div style="margin-bottom:16px;">
          <h4 style="margin:0 0 8px;font-size:13px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:6px;">
            ${icon('folder-check', 16)} Submitted Proof Documents &amp; Attachments (${docList.length})
          </h4>
          ${docList.length ? `
            <div class="inspection-documents-grid">
              ${docList.map((doc, i) => `
                <div class="inspection-doc-item">
                  <div class="inspection-doc-info">
                    ${icon(doc.name.endsWith('.pdf') ? 'file-text' : 'image', 18)}
                    <div style="min-width:0;">
                      <div class="inspection-doc-name" title="${escapeHtml(doc.name)}">${escapeHtml(doc.name)}</div>
                      <div class="inspection-doc-meta">${escapeHtml(doc.label)} · ${escapeHtml(doc.source)}</div>
                    </div>
                  </div>
                  <div style="display:flex;gap:4px;flex-shrink:0;">
                    ${doc.data ? `
                      <button type="button" class="secondary-pill-btn" data-preview-doc-idx="${i}" style="padding:4px 9px;font-size:11px;">
                        ${icon('eye', 12)} View
                      </button>
                      <a href="${escapeHtml(doc.data)}" download="${escapeHtml(doc.name)}" class="secondary-pill-btn" style="padding:4px 9px;font-size:11px;" title="Download file">
                        ${icon('download', 12)}
                      </a>
                    ` : `
                      <span class="status-pill status-pill-info" style="font-size:10.5px;">Recorded</span>
                    `}
                  </div>
                </div>
              `).join('')}
            </div>
            <div id="inspect-doc-preview" class="inspection-doc-preview-wrap" hidden></div>
          ` : `
            <div class="empty-state-banner" style="padding:16px;background:var(--surface);border:1px dashed var(--border);border-radius:var(--radius-sm);justify-content:flex-start;">
              ${icon('file-question', 18)}
              <span>No document files attached yet. The student applied using their registered credentials.</span>
            </div>
          `}
        </div>

        <div class="inspection-remarks-box">
          <label for="inspect-remarks">Reviewer Feedback &amp; Decision Remarks</label>
          <textarea id="inspect-remarks" class="pill-textarea" rows="2" maxlength="600" placeholder="Enter notes, grant conditionality, or resubmission requirements (visible to the student)...">${escapeHtml(application.reviewer_notes || '')}</textarea>
          <small style="display:block;margin-top:4px;color:var(--muted);font-size:11.5px;">
            These remarks will be recorded on the application and displayed in the student's My Applications Tracker.
          </small>
        </div>

        <div class="inspection-actions-row">
          <button type="button" class="secondary-pill-btn modal-cancel">Close</button>
          ${status !== 'Rejected' ? `
            <button type="button" class="application-action-btn reject" data-inspect-action="reject">
              ${icon('x', 14)} Reject Application
            </button>
          ` : ''}
          ${status !== 'Draft' ? `
            <button type="button" class="application-action-btn resubmit" data-inspect-action="resubmit">
              ${icon('rotate-ccw', 14)} Request Resubmission
            </button>
          ` : ''}
          ${status !== 'Approved' ? `
            <button type="button" class="primary-pill-btn" data-inspect-action="approve" style="background:#10b981;border-color:#10b981;">
              ${icon('check-circle', 14)} Approve Grant
            </button>
          ` : ''}
        </div>
      </section>
    </div>`
  );

  window.lucide?.createIcons?.();
  const modal = document.querySelector('#application-inspect-modal');
  const close = () => {
    document.removeEventListener('keydown', onKey);
    modal?.remove();
  };
  const onKey = event => {
    if (event.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKey);
  modal.querySelector('.modal-close-pill').onclick = close;
  modal.querySelector('.modal-cancel').onclick = close;
  modal.addEventListener('click', event => {
    if (event.target === modal) close();
  });

  // Document preview buttons
  const previewWrap = modal.querySelector('#inspect-doc-preview');
  modal.querySelectorAll('[data-preview-doc-idx]').forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.previewDocIdx);
      const doc = docList[idx];
      if (!doc?.data || !previewWrap) return;
      if (previewWrap.dataset.currentIdx === String(idx) && !previewWrap.hidden) {
        previewWrap.hidden = true;
        return;
      }
      previewWrap.dataset.currentIdx = String(idx);
      if (doc.data.startsWith('data:image/')) {
        previewWrap.innerHTML = `<img src="${escapeHtml(doc.data)}" class="inspection-doc-preview-img" alt="${escapeHtml(doc.name)}">`;
      } else {
        previewWrap.innerHTML = `<iframe src="${escapeHtml(doc.data)}" style="width:100%;height:380px;border:none;background:#fff;" title="${escapeHtml(doc.name)}"></iframe>`;
      }
      previewWrap.hidden = false;
    };
  });

  // Decision buttons
  const remarksInput = modal.querySelector('#inspect-remarks');
  modal.querySelectorAll('[data-inspect-action]').forEach(btn => {
    btn.onclick = async () => {
      const action = btn.dataset.inspectAction;
      const remarks = remarksInput.value.trim();
      btn.disabled = true;
      close();
      await onDecision?.(action, remarks);
    };
  });
};

export const openAcademicUpdateRequestModal = (user, onSubmitted) => {
  const existing = document.querySelector('#academic-update-modal');
  if (existing) existing.remove();

  const currentYear = user.yearLevel || user.year || '1st Year';
  const currentCourse = user.course || 'BS Information Technology';
  const currentSchool = user.school || 'Cor Jesu College';

  document.body.insertAdjacentHTML(
    'beforeend',
    `<div class="modal-backdrop-modern" id="academic-update-modal">
      <section class="modal-card-modern application-modal-card" role="dialog" aria-modal="true" aria-labelledby="academic-update-title">
        <div class="modal-card-header">
          <div class="modal-title-wrap">
            <div class="modal-icon-badge">${icon('graduation-cap', 20)}</div>
            <div>
              <h2 id="academic-update-title" class="modal-title">Request Academic Advancement / Update</h2>
              <p class="modal-subtitle">Submit updated enrollment records to advance year level or modify degree program</p>
            </div>
          </div>
          <button class="modal-close-pill" type="button" aria-label="Close">${icon('x', 18)}</button>
        </div>

        <form id="academic-update-form" class="modal-form-modern">
          <div class="applicant-quick-summary-box">
            <span class="summary-box-label">${icon('building-2', 13)} Current Official Records</span>
            <strong>${escapeHtml(currentSchool)} · ${escapeHtml(currentCourse)}</strong>
            <small>Current Enrolled Year: <strong>${escapeHtml(currentYear)}</strong> · Scholar Status: <strong>${escapeHtml(user.scholarStatus || 'Active')}</strong></small>
          </div>

          <div class="form-grid-row">
            <div class="modern-field">
              <label for="update-year-level">New / Target Year Level</label>
              <div class="select-pill-wrapper">
                <select id="update-year-level" class="pill-select" required>
                  <option value="1st Year" ${currentYear === '1st Year' ? 'selected' : ''}>1st Year</option>
                  <option value="2nd Year" ${currentYear === '2nd Year' ? 'selected' : ''}>2nd Year</option>
                  <option value="3rd Year" ${currentYear === '3rd Year' ? 'selected' : ''}>3rd Year</option>
                  <option value="4th Year" ${currentYear === '4th Year' ? 'selected' : ''}>4th Year</option>
                  <option value="Graduating" ${currentYear === 'Graduating' ? 'selected' : ''}>Graduating</option>
                </select>
              </div>
            </div>

            <div class="modern-field">
              <label for="update-course">Degree Program / Course</label>
              <input id="update-course" class="pill-input" value="${escapeHtml(currentCourse)}" required />
            </div>
          </div>

          <div class="modern-field">
            <label for="update-cor-file">Upload Certificate of Registration (COR) / Assessment Form</label>
            <div class="upload-dropzone-pill">
              <label class="secondary-pill-btn file-upload-trigger" for="update-cor-file">
                ${icon('upload-cloud', 14)}
                <span>Choose Document</span>
              </label>
              <input id="update-cor-file" type="file" accept=".pdf,image/*" hidden />
              <span id="update-file-label" class="file-name-indicator">No file attached</span>
            </div>
            <small class="field-hint">Attach official registrar enrollment assessment or COR verifying your new semester load.</small>
          </div>

          <div class="modern-field">
            <label for="update-remarks">Reason for Request / Additional Notes</label>
            <textarea id="update-remarks" class="pill-textarea" maxlength="500" placeholder="State your academic progress, semester passed, or reasons for shifting/advancement..." required></textarea>
          </div>

          <div class="modal-actions-row">
            <button class="secondary-pill-btn modal-cancel" type="button">Cancel</button>
            <button class="primary-pill-btn apply-submit-btn" type="submit">
              ${icon('send', 15)}
              <span>Submit Request</span>
            </button>
          </div>
        </form>
      </section>
    </div>`
  );

  window.lucide?.createIcons?.();
  const modal = document.querySelector('#academic-update-modal');
  const close = () => {
    document.removeEventListener('keydown', onKey);
    modal?.remove();
  };

  const onKey = event => {
    if (event.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKey);

  modal.querySelector('.modal-close-pill').onclick = close;
  modal.querySelector('.modal-cancel').onclick = close;
  modal.addEventListener('click', event => {
    if (event.target === modal) close();
  });

  const fileInput = modal.querySelector('#update-cor-file');
  const fileLabel = modal.querySelector('#update-file-label');
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      fileLabel.textContent = fileInput.files[0].name;
      fileLabel.classList.add('has-file');
    } else {
      fileLabel.textContent = 'No file attached';
      fileLabel.classList.remove('has-file');
    }
  });

  const form = modal.querySelector('#academic-update-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const newYear = modal.querySelector('#update-year-level').value;
    const newCourse = modal.querySelector('#update-course').value.trim();
    const remarks = modal.querySelector('#update-remarks').value.trim();
    const fileName = fileInput.files[0]?.name || null;
    const submitBtn = form.querySelector('.apply-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Submitting...</span>`;
    await onSubmitted?.({ newYear, newCourse, remarks, fileName });
    close();
  });
};

export const openConfirmModal = ({
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  details = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  iconName = type === 'danger' ? 'alert-triangle' : type === 'warning' ? 'alert-circle' : 'help-circle',
  onConfirm
} = {}) => {
  return new Promise(resolve => {
    const existing = document.querySelector('#global-confirm-modal');
    if (existing) existing.remove();

    const isDanger = type === 'danger';
    const confirmBtnClass = isDanger ? 'danger-pill-btn' : 'primary-pill-btn';

    document.body.insertAdjacentHTML(
      'beforeend',
      `<div class="modal-backdrop-modern" id="global-confirm-modal">
        <section class="modal-card-modern modal-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
          <div class="modal-card-header">
            <div class="modal-title-wrap">
              <div class="modal-icon-badge ${type}">${icon(iconName, 20)}</div>
              <div>
                <h2 id="confirm-dialog-title" class="modal-title">${escapeHtml(title)}</h2>
                <p class="modal-subtitle">Confirmation required</p>
              </div>
            </div>
            <button class="modal-close-pill" type="button" aria-label="Close">${icon('x', 18)}</button>
          </div>

          <div class="modal-confirm-body">
            <p class="confirm-modal-main-message">${escapeHtml(message)}</p>
            ${details ? `<div class="confirm-modal-details">${escapeHtml(details)}</div>` : ''}
          </div>

          <div class="modal-actions-row">
            <button class="secondary-pill-btn modal-cancel" type="button">${escapeHtml(cancelText)}</button>
            <button class="${confirmBtnClass} modal-confirm-btn" type="button">
              ${icon(isDanger ? 'trash-2' : 'check', 16)}
              <span>${escapeHtml(confirmText)}</span>
            </button>
          </div>
        </section>
      </div>`
    );

    window.lucide?.createIcons?.();
    const modal = document.querySelector('#global-confirm-modal');

    const close = async confirmed => {
      document.removeEventListener('keydown', onKey);
      modal?.remove();
      resolve(confirmed);
      if (confirmed && typeof onConfirm === 'function') {
        await onConfirm();
      }
    };

    const onKey = event => {
      if (event.key === 'Escape') close(false);
    };
    document.addEventListener('keydown', onKey);

    modal.querySelector('.modal-close-pill').onclick = () => close(false);
    modal.querySelector('.modal-cancel').onclick = () => close(false);
    modal.querySelector('.modal-confirm-btn').onclick = () => close(true);
    modal.addEventListener('click', event => {
      if (event.target === modal) close(false);
    });
  });
};

export const openPromptModal = ({
  title = 'Edit Announcement',
  message = 'Update announcement message content:',
  defaultValue = '',
  placeholder = 'Enter updated announcement...',
  confirmText = 'Save Changes',
  cancelText = 'Cancel',
  multiline = true,
  onConfirm
} = {}) => {
  return new Promise(resolve => {
    const existing = document.querySelector('#global-prompt-modal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML(
      'beforeend',
      `<div class="modal-backdrop-modern" id="global-prompt-modal">
        <section class="modal-card-modern modal-prompt-dialog" role="dialog" aria-modal="true" aria-labelledby="prompt-dialog-title">
          <div class="modal-card-header">
            <div class="modal-title-wrap">
              <div class="modal-icon-badge primary">${icon('edit-3', 20)}</div>
              <div>
                <h2 id="prompt-dialog-title" class="modal-title">${escapeHtml(title)}</h2>
                <p class="modal-subtitle">${escapeHtml(message)}</p>
              </div>
            </div>
            <button class="modal-close-pill" type="button" aria-label="Close">${icon('x', 18)}</button>
          </div>

          <form id="global-prompt-form" class="modal-confirm-body">
            <div class="modern-field">
              ${
                multiline
                  ? `<textarea id="prompt-modal-input" class="pill-textarea" rows="4" placeholder="${escapeHtml(placeholder)}" required>${escapeHtml(defaultValue)}</textarea>`
                  : `<input id="prompt-modal-input" class="pill-input" type="text" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(defaultValue)}" required>`
              }
            </div>

            <div class="modal-actions-row">
              <button class="secondary-pill-btn modal-cancel" type="button">${escapeHtml(cancelText)}</button>
              <button class="primary-pill-btn modal-submit-btn" type="submit">
                ${icon('check', 16)}
                <span>${escapeHtml(confirmText)}</span>
              </button>
            </div>
          </form>
        </section>
      </div>`
    );

    window.lucide?.createIcons?.();
    const modal = document.querySelector('#global-prompt-modal');
    const input = modal.querySelector('#prompt-modal-input');
    input?.focus();

    const close = async result => {
      document.removeEventListener('keydown', onKey);
      modal?.remove();
      resolve(result);
      if (result !== null && typeof onConfirm === 'function') {
        await onConfirm(result);
      }
    };

    const onKey = event => {
      if (event.key === 'Escape') close(null);
    };
    document.addEventListener('keydown', onKey);

    modal.querySelector('.modal-close-pill').onclick = () => close(null);
    modal.querySelector('.modal-cancel').onclick = () => close(null);
    modal.querySelector('#global-prompt-form').onsubmit = event => {
      event.preventDefault();
      close(input.value.trim());
    };
    modal.addEventListener('click', event => {
      if (event.target === modal) close(null);
    });
  });
};

export const openCommandPalette = () => {
  const existing = document.querySelector('#command-palette-modal');
  if (existing) {
    existing.remove();
    return;
  }

  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';

  // Define command items
  const commands = [];

  // Navigation pages
  if (isAdmin) {
    commands.push(
      { id: 'nav-overview', group: 'Navigation', icon: 'layout-grid', title: 'Overview Dashboard', desc: 'Main administrative analytics & renewal schedules', action: () => navigateTo('overview', true) },
      { id: 'nav-scholarships', group: 'Navigation', icon: 'award', title: 'Scholarship Programs', desc: 'Manage funding grants, deadlines & categories', action: () => navigateTo('scholarships', true) },
      { id: 'nav-applications', group: 'Navigation', icon: 'clipboard-check', title: 'Application Review Pipeline', desc: 'Review, approve, or reject student applicants', action: () => navigateTo('applications', true) },
      { id: 'nav-scholars', group: 'Navigation', icon: 'users', title: 'Scholar Roster', desc: 'Official directory of new and returning scholars', action: () => navigateTo('scholars', true) },
      { id: 'nav-active-scholars', group: 'Navigation', icon: 'user-check', title: 'Active Scholars Roster', desc: 'Currently enrolled grant recipients', action: () => navigateTo('active-scholars', true) },
      { id: 'nav-registered', group: 'Navigation', icon: 'user-plus', title: 'Registered Accounts', desc: 'Direct portal user self-registrations', action: () => navigateTo('registered-accounts', true) },
      { id: 'nav-help-requests', group: 'Navigation', icon: 'life-buoy', title: 'Pending Review & Help Inquiries', desc: 'Student support tickets and inquiries', action: () => navigateTo('help-requests', true) },
      { id: 'nav-notifications', group: 'Navigation', icon: 'bell', title: 'Notification Center', desc: 'Manage alerts, advisories, and system notices', action: () => navigateTo('notifications', true) }
    );
  } else {
    commands.push(
      { id: 'nav-overview', group: 'Navigation', icon: 'layout-grid', title: 'Student Dashboard', desc: 'Overview, renewal reminders & appointments', action: () => navigateTo('overview', false) },
      { id: 'nav-scholarships', group: 'Navigation', icon: 'award', title: 'Explore Scholarships', desc: 'Browse and apply for active grants', action: () => navigateTo('scholarships', false) },
      { id: 'nav-profile', group: 'Navigation', icon: 'user', title: 'My Profile & Academic Credentials', desc: 'View academic standing & personal details', action: () => navigateTo('my-profile', false) },
      { id: 'nav-help', group: 'Navigation', icon: 'life-buoy', title: 'Support & Help Center', desc: 'Submit inquiries and track support tickets', action: () => navigateTo('help-center', false) },
      { id: 'nav-notifications', group: 'Navigation', icon: 'bell', title: 'Notification Center', desc: 'View official alerts, deadlines, and schedule reminders', action: () => navigateTo('notifications', false) }
    );
  }

  // Quick Actions
  if (isAdmin) {
    commands.push(
      { id: 'act-add-scholar', group: 'Quick Actions', icon: 'user-plus', title: 'Add Returning Scholar', desc: 'Directly enroll student into scholar roster', action: () => openAddScholarModal() },
      { id: 'act-post-announcement', group: 'Quick Actions', icon: 'radio', title: 'Broadcast Campus Announcement', desc: 'Publish circular to student feeds', action: () => {
        navigateTo('overview', true);
        setTimeout(() => document.querySelector('#announcement-message')?.focus(), 250);
      }},
      { id: 'act-export-roster', group: 'Quick Actions', icon: 'download', title: 'Export Scholar Roster to CSV', desc: 'Generate downloadable CSV for registrars', action: () => {
        const btn = document.querySelector('[data-export-scholars]');
        if (btn) btn.click();
        else navigateTo('scholars', true);
      }}
    );
  } else {
    commands.push(
      { id: 'act-my-apps', group: 'Quick Actions', icon: 'award', title: 'Track My Applications', desc: 'Check status and feedback on grant applications', action: () => navigateTo('scholarships', false) },
      { id: 'act-academic-update', group: 'Quick Actions', icon: 'graduation-cap', title: 'Request Year Advancement / Program Change', desc: 'Submit updated COR to coordinator', action: () => openAcademicUpdateRequestModal() },
      { id: 'act-submit-ticket', group: 'Quick Actions', icon: 'message-square-plus', title: 'Submit Support Ticket', desc: 'Send inquiry to scholarship office', action: () => {
        navigateTo('help-center', false);
        setTimeout(() => document.querySelector('#help-subject')?.focus(), 250);
      }},
      { id: 'act-notifs', group: 'Quick Actions', icon: 'bell', title: 'View Announcements & Notices', desc: 'Open notifications drawer', action: () => {
        document.querySelector('[data-toggle-notifications]')?.click();
      }}
    );
  }

  // Active Scholarship Programs
  const catalog = getScholarshipCatalog();
  const programs = catalog.length
    ? catalog
    : scholarships.map((s, idx) => ({ id: `demo-${idx}`, title: s[0], category: s[1], amount: s[3] }));
  programs.forEach(p => {
    commands.push({
      id: `prog-${p.id}`,
      group: 'Scholarships',
      icon: 'award',
      title: p.title,
      desc: `${p.category || 'Scholarship Program'} · ${p.amount ? (typeof p.amount === 'number' ? `₱${p.amount.toLocaleString()}` : p.amount) : 'Financial Grant'}`,
      action: () => navigateTo('scholarships', isAdmin)
    });
  });

  // System Controls
  commands.push(
    { id: 'sys-theme', group: 'System', icon: 'sun-moon', title: 'Toggle Light / Dark Theme', desc: 'Switch system appearance theme', action: () => document.querySelector('.theme-toggle')?.click() },
    { id: 'sys-logout', group: 'System', icon: 'log-out', title: 'Sign Out', desc: 'End current portal session', action: () => document.querySelector('[data-logout]')?.click() }
  );

  document.body.insertAdjacentHTML(
    'beforeend',
    `<div class="command-palette-backdrop" id="command-palette-modal">
      <div class="command-palette-dialog" role="dialog" aria-modal="true" aria-label="Command Palette">
        <div class="command-palette-header">
          <div class="command-palette-search-icon">${icon('search', 18)}</div>
          <input id="command-palette-input" class="command-palette-input" type="search" placeholder="Type a page, command, or search query..." autocomplete="off" spellcheck="false">
          <button class="command-palette-esc" type="button" aria-label="Close palette">ESC</button>
        </div>
        <div class="command-palette-results" id="command-palette-results"></div>
        <div class="command-palette-footer">
          <span class="cmd-shortcut-hint"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span class="cmd-shortcut-hint"><kbd>↵</kbd> Select</span>
          <span class="cmd-shortcut-hint"><kbd>ESC</kbd> Close</span>
        </div>
      </div>
    </div>`
  );

  window.lucide?.createIcons?.();
  const modal = document.querySelector('#command-palette-modal');
  const input = modal?.querySelector('#command-palette-input');
  const resultsContainer = modal?.querySelector('#command-palette-results');
  let selectedIndex = 0;
  let currentFiltered = [];

  const close = () => {
    document.removeEventListener('keydown', handleKeyNavigation);
    modal?.remove();
  };

  const executeAction = cmd => {
    close();
    if (cmd && typeof cmd.action === 'function') {
      cmd.action();
    }
  };

  const renderResults = query => {
    const q = query.trim().toLowerCase();
    currentFiltered = commands.filter(cmd =>
      !q ||
      cmd.title.toLowerCase().includes(q) ||
      cmd.desc.toLowerCase().includes(q) ||
      cmd.group.toLowerCase().includes(q)
    );

    if (selectedIndex >= currentFiltered.length) selectedIndex = 0;

    if (!currentFiltered.length) {
      resultsContainer.innerHTML = `<div class="command-empty-state">
        ${icon('search-x', 24)}
        <span>No commands or results found for "<strong>${escapeHtml(query)}</strong>"</span>
      </div>`;
      window.lucide?.createIcons?.();
      return;
    }

    // Group items
    const groups = {};
    currentFiltered.forEach((cmd, idx) => {
      groups[cmd.group] ||= [];
      groups[cmd.group].push({ cmd, flatIndex: idx });
    });

    let html = '';
    for (const [groupName, items] of Object.entries(groups)) {
      html += `<div class="command-group-title">${escapeHtml(groupName)}</div>`;
      items.forEach(({ cmd, flatIndex }) => {
        const isSelected = flatIndex === selectedIndex;
        html += `<div class="command-item ${isSelected ? 'selected' : ''}" data-cmd-index="${flatIndex}">
          <div class="command-item-icon">${icon(cmd.icon, 16)}</div>
          <div class="command-item-text">
            <div class="command-item-title">${escapeHtml(cmd.title)}</div>
            <div class="command-item-desc">${escapeHtml(cmd.desc)}</div>
          </div>
          <span class="command-item-enter">${icon('corner-down-left', 14)}</span>
        </div>`;
      });
    }

    resultsContainer.innerHTML = html;
    window.lucide?.createIcons?.();

    // Attach click listeners to command items
    resultsContainer.querySelectorAll('.command-item').forEach(itemEl => {
      itemEl.onclick = () => {
        const idx = Number(itemEl.dataset.cmdIndex);
        executeAction(currentFiltered[idx]);
      };
      itemEl.onmouseenter = () => {
        selectedIndex = Number(itemEl.dataset.cmdIndex);
        updateSelectionHighlight();
      };
    });

    scrollSelectedIntoView();
  };

  const updateSelectionHighlight = () => {
    resultsContainer?.querySelectorAll('.command-item').forEach(el => {
      const idx = Number(el.dataset.cmdIndex);
      el.classList.toggle('selected', idx === selectedIndex);
    });
    scrollSelectedIntoView();
  };

  const scrollSelectedIntoView = () => {
    const selectedEl = resultsContainer?.querySelector('.command-item.selected');
    selectedEl?.scrollIntoView({ block: 'nearest' });
  };

  const handleKeyNavigation = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (!currentFiltered.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectedIndex = (selectedIndex + 1) % currentFiltered.length;
      updateSelectionHighlight();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedIndex = (selectedIndex - 1 + currentFiltered.length) % currentFiltered.length;
      updateSelectionHighlight();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      executeAction(currentFiltered[selectedIndex]);
    }
  };

  document.addEventListener('keydown', handleKeyNavigation);
  input?.addEventListener('input', e => {
    selectedIndex = 0;
    renderResults(e.target.value);
  });

  modal?.querySelector('.command-palette-esc')?.addEventListener('click', close);
  modal?.addEventListener('click', e => {
    if (e.target === modal) close();
  });

  input?.focus();
  renderResults('');
};
