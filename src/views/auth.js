// Modern Authentication view and forms (Sign in, Sign up, Forgot password)

import { icon, escapeHtml } from '../utils/dom.js';
import { schools } from '../config/constants.js';
import { refresh } from '../events.js';

let currentPage = 'login';
let authMessage = '';

export const getCurrentPage = () => currentPage;
export const setCurrentPage = page => {
  currentPage = page;
};

export const clearAuthMessage = () => {
  authMessage = '';
};

export const showAuthMessage = (message, type = 'error') => {
  authMessage = `<div class="auth-message-modern ${type}">${icon(
    type === 'success' ? 'check-circle-2' : 'alert-circle',
    16
  )} <span>${escapeHtml(message)}</span></div>`;
  authView(currentPage);
};

export const loginForm = () => `<form class="modern-auth-form" id="login-form">
  ${authMessage}
  <div class="modern-field">
    <label>Email Address</label>
    <div class="input-with-icon">
      <span class="field-leading-icon">${icon('mail', 16)}</span>
      <input id="login-email" class="pill-input icon-padded" type="email" placeholder="student@university.edu" required>
    </div>
  </div>

  <div class="modern-field">
    <div class="field-label-row">
      <label>Password</label>
      <button type="button" class="label-link-btn" data-view="forgot">Forgot password?</button>
    </div>
    <div class="input-with-icon password-wrap">
      <span class="field-leading-icon">${icon('lock', 16)}</span>
      <input id="login-password" class="pill-input icon-padded" type="password" placeholder="Enter your password" required>
      <button type="button" class="show-pass modern-show-pass" aria-label="Show password">${icon('eye', 16)}</button>
    </div>
  </div>

  <button class="primary-pill-btn full-width-btn" type="submit">
    <span>Sign in to Workspace</span>
    ${icon('arrow-right', 16)}
  </button>

  <div class="demo-accounts-pill-box">
    <span class="demo-pill-title">Demo Credentials:</span>
    <div class="demo-chips-row">
      <button type="button" class="demo-chip-btn" data-fill-demo="admin" title="Click to fill Admin demo credentials">
        ${icon('shield-check', 13)} <span>Admin</span>
      </button>
      <button type="button" class="demo-chip-btn" data-fill-demo="student" title="Click to fill Student demo credentials">
        ${icon('graduation-cap', 13)} <span>Student</span>
      </button>
    </div>
  </div>

  <p class="auth-foot-text">
    Don't have an account? <button type="button" class="auth-text-link" data-view="register">Create student account</button>
  </p>
</form>`;

export const registerForm = () => `<form class="modern-auth-form register-form-wide" id="register-form">
  ${authMessage}
  <button class="pill-back-btn" type="button" data-view="login">
    ${icon('arrow-left', 14)} <span>Back to sign in</span>
  </button>

  <div class="register-modern-grid">
    <div class="modern-field">
      <label>Last Name</label>
      <input id="last-name" class="pill-input" placeholder="Dela Cruz" required>
    </div>
    <div class="modern-field">
      <label>First Name</label>
      <input id="first-name" class="pill-input" placeholder="Juan" required>
    </div>
    <div class="modern-field wide-field">
      <label>Middle Name</label>
      <input id="middle-name" class="pill-input" placeholder="Santos (optional)">
    </div>

    <div class="modern-field">
      <label>Sex</label>
      <div class="select-pill-wrapper">
        <select id="sex" class="pill-select" required>
          <option value="" disabled selected>Select sex...</option>
          <option>Male</option>
          <option>Female</option>
        </select>
      </div>
    </div>
    <div class="modern-field">
      <label>Scholar Type</label>
      <div class="select-pill-wrapper">
        <select id="scholar-type" class="pill-select" required>
          <option value="" disabled selected>Select type...</option>
          <option>Old scholar</option>
          <option>New scholar</option>
        </select>
      </div>
    </div>

    <div class="modern-field wide-field">
      <label>Birth Date</label>
      <input id="birth-date" class="pill-input" type="date" required>
    </div>
    <div class="modern-field wide-field">
      <label>Contact Number</label>
      <input id="register-contact" class="pill-input" type="tel" inputmode="numeric" placeholder="09XX XXX XXXX" required>
    </div>

    <div class="modern-field">
      <label>Purok / Street</label>
      <input id="purok" class="pill-input" placeholder="Purok 1" required>
    </div>
    <div class="modern-field">
      <label>Barangay</label>
      <input id="barangay" class="pill-input" placeholder="Barangay" required>
    </div>
    <div class="modern-field wide-field">
      <label>Municipality / City</label>
      <input id="municipality" class="pill-input" placeholder="City or Municipality" required>
    </div>

    <div class="modern-field wide-field">
      <label>Partner University / College</label>
      <div class="select-pill-wrapper">
        <select id="school" class="pill-select" required>
          <option value="" disabled selected>Select educational institution...</option>
          ${schools.map(school => `<option>${school}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="modern-field">
      <label>Year Level</label>
      <div class="select-pill-wrapper">
        <select id="year-level" class="pill-select" required>
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
      <input id="course" class="pill-input" placeholder="e.g. BS Information Technology" required>
    </div>

    <div class="modern-field wide-field">
      <label>Official Email Address</label>
      <input id="register-email" class="pill-input" type="email" placeholder="student@university.edu" required>
    </div>
    <div class="modern-field wide-field">
      <label>Create Password</label>
      <div class="input-with-icon password-wrap">
        <input id="register-password" class="pill-input" type="password" minlength="6" placeholder="At least 6 characters" required>
        <button type="button" class="show-pass modern-show-pass" aria-label="Show password">${icon('eye', 16)}</button>
      </div>
    </div>
  </div>

  <label class="modern-checkbox-label">
    <input type="checkbox" required>
    <span>I verify that all submitted academic and personal records are authentic.</span>
  </label>

  <button class="primary-pill-btn full-width-btn" type="submit">
    <span>Create Student Account</span>
    ${icon('arrow-right', 16)}
  </button>
</form>`;

export const forgotForm = () => `<div class="modern-auth-form">
  <div class="auth-message-modern warning">
    ${icon('alert-circle', 16)}
    <span>Password reset email service is currently in offline demo mode. Please reach out to the scholarship coordinator.</span>
  </div>
  <p class="auth-foot-text">
    <button type="button" class="pill-back-btn" data-view="login">
      ${icon('arrow-left', 14)} <span>Back to sign in</span>
    </button>
  </p>
</div>`;

export const authView = (mode = 'login') => {
  currentPage = mode;
  const copy = {
    login: ['Welcome to ScholarHub', 'Sign in to access your scholarship workspace and application records.'],
    register: ['Create Student Account', 'Join verified students accessing partner scholarship programs.'],
    forgot: ['Password Recovery', 'Request a reset ticket for your registered scholarship account.']
  }[mode] || ['Welcome to ScholarHub', 'Sign in to access your scholarship workspace.'];

  const app = document.querySelector('#app');
  if (!app) return;

  app.innerHTML = `<main class="auth-shell-modern">
    <div class="auth-glass-container">
      <div class="auth-brand-badge">
        <div class="brand-logo-icon">${icon('graduation-cap', 24)}</div>
        <span class="brand-title">Scholar<span>Hub</span></span>
      </div>

      <div class="auth-heading-block">
        <h1 class="auth-main-title">${copy[0]}</h1>
        <p class="auth-sub-title">${copy[1]}</p>
      </div>

      <div class="auth-form-card">
        ${mode === 'login' ? loginForm() : mode === 'register' ? registerForm() : forgotForm()}
      </div>

      <div class="auth-footer-bar">
        <span>© 2026 ScholarHub Information System · Powered by Advanced Cloud Architecture</span>
      </div>
    </div>
  </main>`;

  refresh();
};
