// Modern Student Help Center view

import { icon } from '../../utils/dom.js';
import { sidebar, topbar } from '../../components/layout.js';
import { refresh } from '../../events.js';

export const helpCenterPage = () => {
  const app = document.querySelector('#app');
  if (!app) return;

  app.innerHTML = `<div class="portal">
    <div class="sidebar-backdrop"></div>
    ${sidebar(false, 'help-center')}
    <div class="main">
      ${topbar(false, 'help-center')}
      <main class="content">
        <!-- Hero Header -->
        <section class="dashboard-hero-header">
          <div class="hero-header-text">
            <button class="pill-back-btn" data-page="overview">
              ${icon('arrow-left', 14)} <span>Back to dashboard</span>
            </button>
            <h1 class="hero-page-title">Student Support &amp; Help Center</h1>
            <p class="hero-page-subtitle">Submit your questions or concerns directly to scholarship administration.</p>
          </div>
        </section>

        <!-- Help Request Form Card -->
        <section class="modern-card profile-editor-card max-width-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Submit Inquiry Ticket</h2>
              <p class="card-subtitle">Our administration office will review your ticket and respond promptly.</p>
            </div>
          </div>
          <form id="help-request-form" class="modern-editor-form">
            <div class="modern-field">
              <label>Ticket Subject</label>
              <input id="help-subject" class="pill-input" maxlength="100" placeholder="Brief summary of your question or concern..." required>
            </div>
            <div class="modern-field">
              <label>Detailed Message</label>
              <textarea id="help-message" class="pill-textarea" maxlength="1000" placeholder="Explain your situation in detail so we can assist you effectively..." required></textarea>
            </div>
            <div class="form-submit-row">
              <button class="primary-pill-btn" type="submit">
                ${icon('send', 15)}
                <span>Submit Ticket</span>
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  </div>`;

  refresh();
};
