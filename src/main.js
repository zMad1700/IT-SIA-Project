// ScholarHub Application Entry Point

import './style.css';
import { setTheme } from './utils/dom.js';
import { renderRoute, navigateTo } from './router.js';

import { getCurrentUser } from './services/auth.js';
import { initRealtimeSync } from './services/realtime.js';

// Global error handlers — surface unhandled errors instead of failing silently
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', event => {
  console.error('Uncaught error:', event.error || event.message);
});

// Universal delegated click handler for all "Back to dashboard" and navigation buttons
document.addEventListener('click', event => {
  const backBtn = event.target.closest('[data-back-dashboard], .pill-back-btn:not([data-view]), .history-pill[data-back-dashboard]');
  if (backBtn) {
    event.preventDefault();
    navigateTo('overview');
  }
});

// Browser history and hash navigation listeners
const handleHashRoute = () => {
  renderRoute(location.hash.slice(1) || 'overview');
};
window.addEventListener('popstate', handleHashRoute);
window.addEventListener('hashchange', handleHashRoute);

// Initialize active theme from localStorage without animation flash on load
setTheme(localStorage.getItem('scholarHubTheme') === 'dark', false);

// Initialize Realtime Push Sync if an active session exists
const activeUser = getCurrentUser();
if (activeUser) {
  initRealtimeSync(activeUser, () => {
    const currentRoute = location.hash.slice(1) || 'overview';
    renderRoute(currentRoute);
  });
}

// Bootstrap initial route render
renderRoute(location.hash.slice(1) || 'overview');
