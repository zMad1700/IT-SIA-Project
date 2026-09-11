// ScholarHub Application Entry Point

import './style.css';
import { setTheme } from './utils/dom.js';
import { renderRoute } from './router.js';

// Global error handlers — surface unhandled errors instead of failing silently
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', event => {
  console.error('Uncaught error:', event.error || event.message);
});

// Browser history popstate navigation listener
window.addEventListener('popstate', () => {
  renderRoute(location.hash.slice(1) || 'overview');
});

// Initialize active theme from localStorage without animation flash on load
setTheme(localStorage.getItem('scholarHubTheme') === 'dark', false);

// Bootstrap initial route render
renderRoute(location.hash.slice(1) || 'overview');
