// Centralized, non-blocking glassmorphic Toast notification system
import { icon, escapeHtml } from '../utils/dom.js';

let toastContainer = null;

const ensureContainer = () => {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.querySelector('#scholarhub-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'scholarhub-toast-container';
      toastContainer.className = 'toast-container-fixed';
      toastContainer.setAttribute('aria-live', 'polite');
      toastContainer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
};

export const showToast = (message, type = 'info', duration = 3500) => {
  if (!message) return;
  const container = ensureContainer();

  const iconName = {
    success: 'check-circle-2',
    error: 'alert-circle',
    warning: 'alert-triangle',
    info: 'info'
  }[type] || 'info';

  const toast = document.createElement('div');
  toast.className = `toast-card-modern ${type}`;
  toast.setAttribute('role', 'status');

  toast.innerHTML = `
    <div class="toast-content-wrapper">
      <div class="toast-icon-badge ${type}">
        ${icon(iconName, 18)}
      </div>
      <div class="toast-message-body">
        <p class="toast-text">${escapeHtml(message)}</p>
      </div>
      <button class="toast-close-btn" type="button" aria-label="Dismiss notification">
        ${icon('x', 14)}
      </button>
    </div>
    <div class="toast-progress-bar">
      <div class="toast-progress-fill ${type}" style="animation-duration: ${duration}ms;"></div>
    </div>
  `;

  container.appendChild(toast);
  window.lucide?.createIcons?.();

  let dismissTimer = null;
  let remainingTime = duration;
  let startTime = Date.now();

  const dismiss = () => {
    if (toast.classList.contains('dismissing')) return;
    toast.classList.add('dismissing');
    clearTimeout(dismissTimer);
    setTimeout(() => {
      toast.remove();
    }, 280);
  };

  const startTimer = time => {
    startTime = Date.now();
    dismissTimer = setTimeout(dismiss, time);
  };

  startTimer(remainingTime);

  // Pause on hover
  toast.addEventListener('mouseenter', () => {
    clearTimeout(dismissTimer);
    remainingTime -= Date.now() - startTime;
    const fill = toast.querySelector('.toast-progress-fill');
    if (fill) fill.style.animationPlayState = 'paused';
  });

  toast.addEventListener('mouseleave', () => {
    if (remainingTime > 0) {
      startTimer(remainingTime);
      const fill = toast.querySelector('.toast-progress-fill');
      if (fill) fill.style.animationPlayState = 'running';
    } else {
      dismiss();
    }
  });

  toast.querySelector('.toast-close-btn')?.addEventListener('click', dismiss);
  return toast;
};

if (typeof window !== 'undefined') {
  window.showToast = showToast;
}
