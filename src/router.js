// Application Router and Route Dispatcher

import { ADMIN } from './config/constants.js';
import { supabase } from './services/supabase.js';
import { getAccounts, loadCloudWorkspace } from './services/storage.js';
import { getCurrentUser, loadCloudSession } from './services/auth.js';
import { authView } from './views/auth.js';
import { studentDashboard } from './views/student/dashboard.js';
import { profilePage } from './views/student/profile.js';
import { scholarshipsPage } from './views/student/scholarships.js';
import { helpCenterPage } from './views/student/helpCenter.js';
import { adminDashboard } from './views/admin/dashboard.js';
import { adminScholarshipsPage } from './views/admin/scholarships.js';
import { adminDetail } from './views/admin/scholars.js';
import { registeredAccountsPage } from './views/admin/registered.js';
import { adminHelpRequestsPage } from './views/admin/helpRequests.js';
import { adminApplicationsPage } from './views/admin/applications.js';
import { notificationsPage } from './views/notifications.js';

let currentRoute = 'login';

export const getCurrentRoute = () => currentRoute;
export const setCurrentRoute = route => {
  currentRoute = route;
};

export const navigate = (route, replace = false) => {
  currentRoute = route;
  const state = { route };
  if (replace) history.replaceState(state, '', `#${route}`);
  else history.pushState(state, '', `#${route}`);
};

export const navigateTo = (route, replace = false) => {
  navigate(route, replace);
  renderRoute(route);
};

export const renderRoute = async (route = 'overview') => {
  const session = getCurrentUser();
  let account = null;
  if (supabase) {
    account = await loadCloudSession();
  }
  if (!account && session) {
    account =
      session?.email === ADMIN.email && session?.role === 'admin'
        ? ADMIN
        : getAccounts().find(item => item.email === session?.email) || session;
  }

  if (!account) {
    localStorage.removeItem('scholarHubCurrentUser');
    sessionStorage.removeItem('scholarHubCurrentUser');
    return authView('login');
  }

  if (sessionStorage.getItem('scholarHubCurrentUser')) {
    sessionStorage.setItem('scholarHubCurrentUser', JSON.stringify(account));
  } else {
    localStorage.setItem('scholarHubCurrentUser', JSON.stringify(account));
  }
  await loadCloudWorkspace(account);

  if (account.role === 'admin') {
    if (route === 'scholarships') return adminScholarshipsPage();
    if (route === 'active-scholars') return adminDetail('scholarships');
    if (route === 'scholars') return adminDetail('scholars');
    if (route === 'total-scholars' || route === 'applicants') return adminDetail('applicants');
    if (route === 'help-requests' || route === 'pending-review') return adminHelpRequestsPage();
    if (route === 'applications') return adminApplicationsPage();
    if (route === 'registered-accounts') return registeredAccountsPage();
    if (route === 'notifications') return notificationsPage();
    return adminDashboard();
  }

  if (route === 'my-profile') return profilePage();
  if (route === 'scholarships') return scholarshipsPage();
  if (route === 'help-center') return helpCenterPage();
  if (route === 'notifications') return notificationsPage();
  return studentDashboard();
};
