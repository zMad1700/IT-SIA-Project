// DOM rendering, sanitization, and UI utilities

export const escapeHtml = value =>
  String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);

export const icon = (name, size = 18) => `<i data-lucide="${name}" width="${size}" height="${size}"></i>`;

export const displayName = user => escapeHtml(user?.name || 'Student');

export const userAvatar = (user, className = 'avatar') =>
  `<div class="${className}">${user?.photo ? `<img src="${escapeHtml(user.photo)}" alt="${escapeHtml(user.name)}'s profile photo">` : icon('user-round', className === 'editable-avatar' ? 30 : 18)}</div>`;

export const setTheme = (dark, animate = true) => {
  const applyTheme = () => {
    if (animate) {
      document.body.classList.add('theme-transitioning');
    }
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('scholarHubTheme', dark ? 'dark' : 'light');
    if (animate) {
      setTimeout(() => {
        document.body.classList.remove('theme-transitioning');
      }, 400);
    }
  };

  if (
    animate &&
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    document.startViewTransition(() => applyTheme());
  } else {
    applyTheme();
  }
};

export const withLoading = async (button, action) => {
  if (!button || button.disabled) return;
  button.disabled = true;
  const original = button.innerHTML;
  try {
    await action();
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
};
