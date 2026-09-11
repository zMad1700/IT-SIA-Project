// Modals and dialog components in modern SaaS theme

import { icon, escapeHtml, userAvatar } from '../utils/dom.js';
import { schools } from '../config/constants.js';
import { supabase } from '../services/supabase.js';
import { getAccounts, saveAccounts } from '../services/storage.js';
import { getCurrentUser } from '../services/auth.js';
import { navigateTo } from '../router.js';

export const openAddScholarModal = () => {
  if (supabase) {
    return alert(
      'For the cloud system, students must create their own account so their Auth account and profile are correctly linked. They will then appear in Registered Accounts.'
    );
  }

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
            <input id="add-middle-name" class="pill-input" placeholder="Optional middle name">
          </div>

          <div class="two-fields">
            <div class="modern-field">
              <label>Enrolled School</label>
              <div class="select-pill-wrapper">
                <select id="add-school" class="pill-select" required>
                  <option value="" disabled selected>Select school...</option>
                  ${schools.map(school => `<option>${school}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="modern-field">
              <label>Academic Year</label>
              <div class="select-pill-wrapper">
                <select id="add-year" class="pill-select" required>
                  <option value="" disabled selected>Select year level...</option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modern-field">
            <label>Degree / Course</label>
            <input id="add-course" class="pill-input" placeholder="e.g. BS Information Technology" required>
          </div>

          <div class="modal-actions-row">
            <button class="secondary-pill-btn modal-cancel" type="button">Cancel</button>
            <button class="primary-pill-btn" type="submit">
              ${icon('user-plus', 16)}
              <span>Add Scholar</span>
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

  modal.querySelector('#add-scholar-form').addEventListener('submit', event => {
    event.preventDefault();
    const lastName = modal.querySelector('#add-last-name').value.trim();
    const firstName = modal.querySelector('#add-first-name').value.trim();
    const middleName = modal.querySelector('#add-middle-name').value.trim();
    const school = modal.querySelector('#add-school').value;
    const yearLevel = modal.querySelector('#add-year').value;
    const course = modal.querySelector('#add-course').value.trim();

    const account = {
      email: `admin-added-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@local.scholarhub`,
      password: null,
      name: `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim(),
      firstName,
      middleName,
      lastName,
      school,
      yearLevel,
      year: yearLevel,
      course,
      scholarType: 'Old scholar',
      role: 'user',
      registeredAt: new Date().toISOString(),
      addedByAdmin: true
    };

    const accounts = getAccounts();
    accounts.push(account);
    saveAccounts(accounts);
    close();
    navigateTo('active-scholars');
  });
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

