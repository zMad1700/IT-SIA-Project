import './style.css';

const app = document.querySelector('#app');
let role = 'user';
let currentPage = 'login';
let authMessage = '';
let adminDetailAccounts = [];
let activityScholarType = 'total';
let activityPeriod = 'monthly';
let registeredActivityPeriod = 'monthly';
let currentRoute = 'login';
const ADMIN = { email: 'admin@gmail.com', password: 'admin123', name: 'Administrator', role: 'admin' };
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? window.supabase?.createClient(supabaseUrl, supabaseKey) : null;
let accountsCache = [];
let scholarshipCatalog = [];
let applicationsCache = [];
// Browser storage remains an offline/demo fallback. Shared operational data is
// hydrated from Supabase whenever cloud configuration is available.
const cloudReady = () => Boolean(supabase && getCurrentUser()?.id);
const getAccounts = () => {
  if (accountsCache.length) return accountsCache;
  try {
    const accounts = JSON.parse(localStorage.getItem('scholarHubAccounts') || '[]');
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
};
const profileFields = account => ({
  id: account.id, email: account.email, name: account.name, first_name: account.firstName,
  middle_name: account.middleName, last_name: account.lastName, phone: account.phone,
  sex: account.sex, birth_date: account.birthDate, purok: account.purok, barangay: account.barangay,
  municipality: account.municipality, school: account.school, year_level: accountYearLevel(account),
  course: account.course, scholar_type: account.scholarType, role: account.role, photo: account.photo,
  bio: account.bio, requirements_status: account.requirementsStatus,
  scholar_status: account.scholarStatus, added_by_admin: account.addedByAdmin
});
const accountFromProfile = profile => ({
  id: profile.id, email: profile.email, name: profile.name, firstName: profile.first_name,
  middleName: profile.middle_name, lastName: profile.last_name, phone: profile.phone, sex: profile.sex,
  birthDate: profile.birth_date, purok: profile.purok, barangay: profile.barangay,
  municipality: profile.municipality, school: profile.school, yearLevel: profile.year_level,
  year: profile.year_level, course: profile.course, scholarType: profile.scholar_type, role: profile.role,
  photo: profile.photo, bio: profile.bio, requirementsStatus: profile.requirements_status,
  scholarStatus: profile.scholar_status, addedByAdmin: profile.added_by_admin, registeredAt: profile.created_at
});
const saveAccounts = accounts => {
  accountsCache = accounts;
  localStorage.setItem('scholarHubAccounts', JSON.stringify(accounts));
};
const getCurrentUser = () => { 
  try {
    return JSON.parse(localStorage.getItem('scholarHubCurrentUser') || 'null');
  } catch {
    return null;
  }
};
const isAdminSession = () => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};
const userAvatar = (user, className = 'avatar') => `<div class="${className}">${user?.photo ? `<img src="${escapeHtml(user.photo)}" alt="${escapeHtml(user.name)}'s profile photo">` : icon('user-round', className === 'editable-avatar' ? 30 : 18)}</div>`;
const updateCurrentUser = changes => {
  const previousUser = getCurrentUser();
  const user = { ...previousUser, ...changes };
  localStorage.setItem('scholarHubCurrentUser', JSON.stringify(user));
  if (user.email !== ADMIN.email) saveAccounts(getAccounts().map(account => account.email === previousUser.email ? { ...account, ...changes } : account));
  if (supabase && user.id) {
    supabase.from('profiles').update(profileFields(user)).eq('id', user.id).then(({ error }) => {
      if (error) console.error('Could not sync profile:', error.message);
    });
  }
  return user;
};
const loadCloudSession = async () => {
  if (!supabase) return getCurrentUser();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
  if (error || !profile) return null;
  const account = accountFromProfile(profile);
  localStorage.setItem('scholarHubCurrentUser', JSON.stringify(account));
  if (account.role === 'admin') {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    accountsCache = (profiles || []).map(accountFromProfile);
    localStorage.setItem('scholarHubAccounts', JSON.stringify(accountsCache));
  } else accountsCache = [account];
  return account;
};
const showAuthMessage = (message, type = 'error') => {
  authMessage = `<div class="auth-message ${type}">${icon(type === 'success' ? 'circle-check' : 'circle-alert', 16)} ${message}</div>`;
  authView(currentPage);
};
const scholarships = [
  ['Academic Excellence Grant', 'Merit-based', 'Sep 30, 2026', '$5,000'],
  ['Future Leaders Scholarship', 'Leadership', 'Oct 15, 2026', '$3,500'],
  ['STEM Innovators Award', 'STEM', 'Nov 01, 2026', '$4,000']
];
const profileCompletion = user => {
  const fields = [user?.name, user?.phone, user?.bio, user?.school, accountYearLevel(user), user?.course];
  return Math.round(fields.filter(value => String(value || '').trim()).length / fields.length * 100);
};
const nextScholarshipDeadline = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = scholarships.map(([name, , deadline]) => ({ name, date: new Date(deadline) })).filter(item => !Number.isNaN(item.date) && item.date >= today).sort((a, b) => a.date - b.date)[0];
  if (!upcoming) return { name: 'No upcoming deadline', days: 0 };
  return { name: upcoming.name, days: Math.ceil((upcoming.date - today) / 86400000) };
};
const schools = ['Cor Jesu College', 'SC Padada', 'Polytechnic', 'UM Digos', 'UM Bansalan', 'Serapion', 'SPAC', "ST Mary's"];
const getRenewalDeadlines = () => {
  try { return JSON.parse(localStorage.getItem('scholarHubRenewalDeadlines') || localStorage.getItem('scholarHubSchoolSchedules') || '{}'); }
  catch { return {}; }
};
const saveRenewalDeadlines = deadlines => localStorage.setItem('scholarHubRenewalDeadlines', JSON.stringify(deadlines));
const getRenewalSchedules = () => {
  try { return JSON.parse(localStorage.getItem('scholarHubRenewalSchedules') || '{}'); }
  catch { return {}; }
};
const saveRenewalSchedules = schedules => localStorage.setItem('scholarHubRenewalSchedules', JSON.stringify(schedules));
const formatSchedule = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(date);
};
const getAnnouncements = () => {
  try { return JSON.parse(localStorage.getItem('scholarHubAnnouncements') || '[]'); }
  catch { return []; }
};
const saveAnnouncements = posts => localStorage.setItem('scholarHubAnnouncements', JSON.stringify(posts));
const getHelpRequests = () => {
  try { return JSON.parse(localStorage.getItem('scholarHubHelpRequests') || '[]'); }
  catch { return []; }
};
const saveHelpRequests = requests => localStorage.setItem('scholarHubHelpRequests', JSON.stringify(requests));
const loadCloudWorkspace = async account => {
  if (!supabase || !account?.id) return;
  const [announcementsResult, reactionsResult, schedulesResult, helpResult, scholarshipsResult, applicationsResult] = await Promise.all([
    supabase.from('announcements').select('*').order('created_at', { ascending: true }),
    supabase.from('announcement_reactions').select('*'),
    supabase.from('renewal_schedules').select('*'),
    supabase.from('help_requests').select('*, profiles!help_requests_student_id_fkey(name,email)').order('created_at', { ascending: true }),
    supabase.from('scholarships').select('*').order('deadline', { ascending: true }),
    supabase.from('applications').select('*').order('created_at', { ascending: false })
  ]);
  if (!announcementsResult.error && !reactionsResult.error) {
    const posts = (announcementsResult.data || []).map(post => {
      const reactions = (reactionsResult.data || []).filter(reaction => reaction.announcement_id === post.id);
      return {
        id: String(post.id), message: post.message, createdAt: post.created_at,
        reactions: { like: reactions.filter(item => item.reaction === 'like').map(item => item.user_id), heart: reactions.filter(item => item.reaction === 'heart').map(item => item.user_id) }
      };
    });
    localStorage.setItem('scholarHubAnnouncements', JSON.stringify(posts));
  }
  if (!schedulesResult.error) {
    const deadlines = {}, schedules = {};
    (schedulesResult.data || []).forEach(item => {
      if (item.deadline_at) deadlines[item.school_name] = item.deadline_at;
      if (item.schedule_at) schedules[item.school_name] = item.schedule_at;
    });
    saveRenewalDeadlines(deadlines); saveRenewalSchedules(schedules);
  }
  if (!helpResult.error) {
    const requests = (helpResult.data || []).map(item => ({
      id: String(item.id), userEmail: item.profiles?.email || '', userName: item.profiles?.name || item.profiles?.email || 'Student',
      subject: item.subject, message: item.message, status: item.status, createdAt: item.created_at
    }));
    saveHelpRequests(requests);
  }
  if (!scholarshipsResult.error) scholarshipCatalog = scholarshipsResult.data || [];
  if (!applicationsResult.error) applicationsCache = applicationsResult.data || [];
};
const getScholarsByType = type => getAccounts().filter(account => account.role === 'user' && account.scholarType === type);
const getTotalScholars = () => getScholarsByType('Old scholar').length + getScholarsByType('New scholar').length;
const accountYearLevel = account => account.yearLevel || account.year || account.year_level || account.yearlevel || '';
const timeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};
const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const displayName = user => escapeHtml(user?.name || 'Student');
const setTheme = dark => {
  document.body.classList.toggle('dark', dark);
  localStorage.setItem('scholarHubTheme', dark ? 'dark' : 'light');
};
const navigate = (route, replace = false) => {
  currentRoute = route;
  const state = { route };
  if (replace) history.replaceState(state, '', `#${route}`);
  else history.pushState(state, '', `#${route}`);
};
const navigateTo = (route, replace = false) => {
  navigate(route, replace);
  renderRoute(route);
};
const postTime = date => new Date(date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const registrationDate = date => new Date(date).toLocaleDateString(undefined, { dateStyle: 'long' });
const reactionIdentity = user => user?.id || user?.email;
const announcementFeed = (student = false) => {
  const user = getCurrentUser();
  const posts = getAnnouncements().slice().reverse();
  if (!posts.length) return `<div class="empty-posts">${icon('megaphone',18)} No announcements yet.</div>`;
  return posts.map(post => {
    const reactions = post.reactions || { like: [], heart: [] };
    const liked = reactions.like.includes(reactionIdentity(user));
    const hearted = reactions.heart.includes(reactionIdentity(user));
    return `<article class="${student ? 'student-post' : 'admin-post'}"><div class="post-avatar">PA</div><div class="post-body"><strong>Administrator</strong><small>${postTime(post.createdAt)}</small><p>${escapeHtml(post.message)}</p>${student ? `<div class="post-reactions"><button class="post-reaction ${liked ? 'selected' : ''}" data-react="like" data-post-id="${escapeHtml(post.id)}">${icon('thumbs-up',14)} Like <b>${reactions.like.length}</b></button><button class="post-reaction heart ${hearted ? 'selected' : ''}" data-react="heart" data-post-id="${escapeHtml(post.id)}">${icon('heart',14)} Heart <b>${reactions.heart.length}</b></button></div>` : ''}</div></article>`;
  }).join('');
};
const adminUpdatesMarkup = () => `<section class="admin-updates" id="admin-updates"><div class="section-head"><div><h2>Announcements</h2><p>Post an update that all registered students can see.</p></div></div><div class="post-composer"><div class="post-avatar">PA</div><form id="announcement-form"><textarea id="announcement-message" maxlength="1000" placeholder="Write an announcement for students…" required></textarea><div><small>Visible to every student using this system.</small><button class="primary-btn compact" type="submit">${icon('send',16)} Post announcement</button></div></form></div><div class="post-feed">${announcementFeed()}</div></section>`;
const studentUpdatesMarkup = () => `<section class="student-updates" id="student-updates"><div class="section-head"><div><h2>Announcements</h2><p>Updates from the administrator.</p></div><span class="updates-label">${icon('megaphone',14)} ADMIN POSTS</span></div><div class="student-post-feed">${announcementFeed(true)}</div></section>`;
const studentRenewalMarkup = user => {
  const schedule = getRenewalDeadlines()[user.school];
  const formattedSchedule = formatSchedule(schedule);
  if (!formattedSchedule) return '';
  const deadline = new Date(schedule);
  const remainingMs = deadline.getTime() - Date.now();
  const remainingDays = Math.ceil(remainingMs / 86400000);
  const countdown = remainingMs < 0 ? 'Renewal deadline has passed' : remainingDays === 0 ? 'Renewal deadline is today' : `${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining`;
  return `<article class="deadline-card renewal-deadline-card"><div>${icon('calendar-clock',20)}</div><p>RENEWAL DEADLINE</p><h3>${escapeHtml(user.school || 'School not selected')}</h3><strong>${formattedSchedule}</strong><small>${countdown}</small></article>`;
};
const studentRenewalScheduleMarkup = user => {
  const schedule = getRenewalSchedules()[user.school];
  const formattedSchedule = formatSchedule(schedule);
  if (!formattedSchedule) return '';
  return `<section class="student-renewal-schedule"><article class="deadline-card renewal-schedule-card"><div>${icon('calendar-days',20)}</div><p>RENEWAL SCHEDULE</p><h3>${escapeHtml(user.school || 'School not selected')}</h3><strong>${formattedSchedule}</strong><small>Your school renewal schedule</small></article></section>`;
};

const icon = (name, size = 18) => `<i data-lucide="${name}" width="${size}" height="${size}"></i>`;
const refresh = () => {
  // Icons are optional: the system must still render if the CDN is unavailable.
  window.lucide?.createIcons?.();
  bind();
};

function authView(mode = 'login') {
  currentPage = mode;
  currentRoute = 'login';
  const copy = {
    login: ['Welcome back', 'Sign in to continue your scholarship journey.'],
    register: ['Create your account', 'Join thousands of students pursuing their future.'],
    forgot: ['Reset your password', 'Enter your registered email address to request a reset.']
  }[mode];
  app.innerHTML = `<main class="auth-shell">
    <section class="brand-panel">
      <button class="theme-toggle light-toggle" aria-label="Toggle dark mode">${icon('moon')}</button>
      <div class="brand">${icon('graduation-cap', 29)} <span>Scholar<span>Hub</span></span></div>
      <div class="hero-copy"><p class="eyebrow">BUILD YOUR FUTURE</p><h1>Opportunity begins<br>with <em>one</em> application.</h1><p>Find, apply for, and manage scholarships in one thoughtful place.</p></div>
      <div class="floating-card"><div class="mini-icon">${icon('award')}</div><div><strong>500+ Opportunities</strong><small>Curated for your potential</small></div></div>
      <div class="orb orb-a"></div><div class="orb orb-b"></div>
    </section>
    <section class="form-panel"><button class="theme-toggle mobile-toggle">${icon('moon')}</button><div class="form-wrap">
      <div class="form-top"><h2>${copy[0]}</h2><p>${copy[1]}</p></div>
      ${mode === 'login' ? loginForm() : mode === 'register' ? registerForm() : forgotForm()}
    </div></section>
  </main>`;
  refresh();
}
function loginForm() { return `<form class="auth-form" id="login-form">
  ${authMessage}
  <label>Email<input id="login-email" type="email" placeholder="Enter your email" required></label>
  <label>Password <span class="label-action" data-view="forgot">Forgot password?</span><div class="password-input"><input id="login-password" type="password" placeholder="Enter your password" required><button type="button" class="show-pass">${icon('eye',17)}</button></div></label>
  <button class="primary-btn" type="submit">Sign in ${icon('arrow-right',18)}</button>
  <p class="form-foot">New to ScholarshipHub? <button type="button" data-view="register">Create an account</button></p>
</form>`; }
function registerForm() { return `<form class="auth-form" id="register-form">
  ${authMessage}
  <button class="auth-back" type="button" data-view="login">${icon('arrow-left',15)} Back to sign in</button>
  <div class="register-grid"><label>Last name<input id="last-name" required></label><label>First name<input id="first-name" required></label><label class="wide-field">Middle name<input id="middle-name"></label><label>Sex<select id="sex" required><option value="" disabled selected>Select sex</option><option>Male</option><option>Female</option></select></label><label>Scholar type<select id="scholar-type" required><option value="" disabled selected>Select type</option><option>Old scholar</option><option>New scholar</option></select></label><label class="wide-field">Birth date<input id="birth-date" type="date" required></label><label>Contact number<input id="register-contact" type="tel" inputmode="numeric" placeholder="09XX XXX XXXX" required></label><label>Purok<input id="purok" required></label><label>Barangay<input id="barangay" required></label><label>Municipality<input id="municipality" required></label><label class="wide-field">School<select id="school" required><option value="" disabled selected>Select school</option>${schools.map(school => `<option>${school}</option>`).join('')}</select></label><label>Year level<select id="year-level" required><option value="" disabled selected>Select year</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option></select></label><label>Course<input id="course" placeholder="e.g., BS Information Technology" required></label><label class="wide-field">Email address<input id="register-email" type="email" placeholder="Enter your email" required></label><label class="wide-field">Password<div class="password-input"><input id="register-password" type="password" minlength="6" placeholder="Create a secure password" required><button type="button" class="show-pass">${icon('eye',17)}</button></div></label></div>
  <label class="check"><input type="checkbox" required><span>I agree to the Terms of Service and Privacy Policy.</span></label><button class="primary-btn">Create account ${icon('arrow-right',18)}</button>
</form>`; }
function forgotForm() { return `<div class="auth-form"><div class="auth-message error">${icon('circle-alert',16)} Password-reset email is not configured in this local demo. Please contact the administrator or create a new account.</div><p class="form-foot"><button type="button" data-view="login">${icon('arrow-left',15)} Back to sign in</button></p></div>`; }

function sidebar(admin, page = 'overview') { const menu = admin ? [['layout-dashboard','Overview'],['book-open','Scholarships'],['users-round','Registered Accounts']] : [['layout-dashboard','Overview'],['book-open','Scholarships'],['user-round','My Profile']]; return `<aside class="sidebar"><div class="side-brand">${icon('graduation-cap',25)} <span>Scholar<span>Hub</span></span></div><div class="side-label">${admin ? 'ADMINISTRATION' : 'STUDENT'}</div><nav>${menu.map(m=>`<button class="nav-item ${m[1].toLowerCase().replace(' ','-') === page?'active':''}" data-page="${m[1].toLowerCase().replace(' ','-')}">${icon(m[0])}<span>${m[1]}</span></button>`).join('')}</nav><div class="side-bottom">${admin ? '' : `<button class="nav-item ${page === 'help-center' ? 'active' : ''}" data-page="help-center">${icon('circle-help')}<span>Help Center</span></button>`}<button class="nav-item logout">${icon('log-out')}<span>Sign out</span></button></div></aside>`; }
function topbar(admin) { const user = admin ? { name: 'Administrator' } : getCurrentUser(); const section = currentRoute === 'my-profile' ? 'My profile' : currentRoute === 'help-center' ? 'Help Center' : currentRoute === 'help-requests' ? 'Pending review' : currentRoute === 'registered-accounts' ? 'Registered accounts' : currentRoute === 'scholarships' ? 'Scholarships' : currentRoute === 'scholars' ? 'New scholars' : currentRoute === 'active-scholars' ? 'Active scholars' : 'Overview'; return `<header class="topbar"><button class="hamburger" aria-label="Open menu">${icon('menu')}</button><div class="crumb">${admin ? 'Administration' : 'My workspace'} <span>/</span> ${section}</div><div class="top-actions"><button class="round theme-toggle" aria-label="Toggle dark mode">${icon('moon',18)}</button><div class="user-chip ${admin ? '' : 'open-profile'}" ${admin ? '' : 'role="button" tabindex="0"'}>${userAvatar(user)}<div><strong>${displayName(user)}</strong><small>${admin ? 'Administrator' : escapeHtml(user?.course || 'Student account')}</small></div>${icon('chevron-down',15)}</div></div></header>`; }
function stat(label,value,trend,iconName,color,detail) { const clickable = detail !== 'applicants'; const tag = clickable ? 'button' : 'article'; return `<${tag} class="stat-card ${clickable ? 'stat-link' : 'total-card'}" ${clickable ? `data-admin-detail="${detail}" aria-label="View ${label}"` : ''}><div><p>${label}</p><h3>${value}</h3><small class="${trend[0]==='+'?'up':'warm'}">${trend} <span>vs. last month</span></small></div><div class="stat-icon ${color}">${icon(iconName,21)}</div>${clickable ? `<span class="stat-arrow">${icon('arrow-up-right',16)}</span>` : ''}</${tag}>`; }
function studentDashboard() { currentRoute = 'overview'; const user = getCurrentUser() || {}; const firstName = escapeHtml((user.name || 'Student').split(' ')[0]); const completion = profileCompletion(user); const renewalReminder = studentRenewalMarkup(user); const renewalSchedule = studentRenewalScheduleMarkup(user); app.innerHTML=`<div class="portal"><div class="sidebar-backdrop"></div>${sidebar(false)}<div class="main">${topbar(false)}<main class="content"><section class="welcome"><div><p class="eyebrow">YOUR SCHOLARSHIP DASHBOARD</p><h1>${timeGreeting()}, ${firstName} <span>👋</span></h1></div></section><section class="student-grid ${renewalReminder ? '' : 'single-card'}"><div class="progress-card"><div class="section-title"><div><p>PROFILE COMPLETENESS</p><h2>Complete your profile</h2></div><strong>${completion}%</strong></div><div class="progress"><i style="width:${completion}%"></i></div><p>Complete your personal and academic details to keep your scholarship record up to date.</p><button class="text-btn" data-page="my-profile">Complete profile ${icon('arrow-right',16)}</button></div>${renewalReminder}</section>${renewalSchedule}</main></div></div>`; refresh(); }
function profilePage() { currentRoute = 'my-profile'; const user = getCurrentUser() || {}; const isLegacySocialAccount = Boolean(user.provider && !user.password); app.innerHTML = `<div class="portal"><div class="sidebar-backdrop"></div>${sidebar(false, 'my-profile')}<div class="main">${topbar(false)}<main class="content profile-page"><button class="back-btn" data-page="overview">${icon('arrow-left',17)} Back to dashboard</button><section class="welcome detail-heading"><div><p class="eyebrow">ACCOUNT SETTINGS</p><h1>My profile</h1><p>Update the information shown on your ScholarshipHub account.</p></div></section><div class="profile-page-grid"><section class="profile-editor-card"><h2>Personal information</h2><form id="profile-form"><div class="avatar-editor">${userAvatar(user, 'editable-avatar')}<div><label class="upload-photo" for="profile-photo">${icon('camera',16)} Choose profile picture</label><input id="profile-photo" type="file" accept="image/*"><small>JPG, PNG, or WebP. Your picture stays on this device.</small></div></div><label>Full name<input id="profile-name" value="${escapeHtml(user.name)}" required></label><label>Mobile number<input id="profile-phone" type="tel" value="${escapeHtml(user.phone)}" placeholder="09XX XXX XXXX"></label><label>Email address<input value="${escapeHtml(user.email)}" disabled></label><label>Bio<textarea id="profile-bio" maxlength="300" placeholder="Tell us a little about yourself…">${escapeHtml(user.bio)}</textarea></label><button class="primary-btn" type="submit">Save profile ${icon('save',17)}</button></form></section><section class="profile-settings-card"><h2>Security</h2><p>${isLegacySocialAccount ? 'Set a password now to migrate this legacy demo social account.' : 'Use a strong new password to keep your account secure.'}</p><form id="password-form">${isLegacySocialAccount ? '' : '<label>Current password<input id="current-password" type="password" required></label>'}<label>New password<input id="new-password" type="password" minlength="6" required></label><label>Confirm new password<input id="confirm-password" type="password" minlength="6" required></label><button class="secondary-btn" type="submit">${icon('key-round',16)} ${isLegacySocialAccount ? 'Set password' : 'Change password'}</button></form></section></div></main></div></div>`; refresh(); }
function renewalDeadlineManager() {
  const schedules = getRenewalDeadlines();
  const activeSchedules = Object.entries(schedules).filter(([, value]) => value).sort(([, a], [, b]) => new Date(a) - new Date(b));
  return `<section class="renewal-manager"><div class="section-head"><div><h2>Renewal deadline manager</h2><p>Set a renewal deadline for one school. Only students from that school will receive the reminder.</p></div></div><form id="renewal-deadline-form"><label>School<select id="renewal-school" required><option value="" disabled selected>Select school</option>${schools.map(school => `<option value="${escapeHtml(school)}">${escapeHtml(school)}</option>`).join('')}</select></label><label>Renewal deadline<input id="renewal-deadline" type="datetime-local" required></label><button class="primary-btn compact" type="submit">${icon('bell-ring',16)} Save reminder</button></form>${activeSchedules.length ? `<div class="active-renewal-deadlines">${activeSchedules.map(([school, date]) => `<article><span>${icon('calendar-clock',16)}</span><div><strong>${escapeHtml(school)}</strong><small>${formatSchedule(date)}</small></div></article>`).join('')}</div>` : `<p class="no-renewal-deadlines">${icon('calendar-x2',16)} No renewal deadlines have been set yet.</p>`}</section>`;
}
function renewalScheduleManager() { return `<section class="renewal-manager renewal-schedule-manager"><div class="section-head"><div><h2>Renewal schedule manager</h2><p>Set the renewal date and time for one school. Students from that school will see this schedule on their dashboard.</p></div></div><form id="renewal-schedule-form"><label>School<select id="renewal-schedule-school" required><option value="" disabled selected>Select school</option>${schools.map(school => `<option value="${escapeHtml(school)}">${escapeHtml(school)}</option>`).join('')}</select></label><label>Renewal date and time<input id="renewal-schedule-date" type="datetime-local" required></label><button class="primary-btn compact" type="submit">${icon('calendar-check',16)} Save schedule</button></form></section>`; }
function adminDashboard() { currentRoute = 'overview'; const schedules = getRenewalSchedules(); app.innerHTML=`<div class="portal admin"><div class="sidebar-backdrop"></div>${sidebar(true)}<div class="main">${topbar(true)}<main class="content"><section class="welcome"><div><p class="eyebrow">ADMIN DASHBOARD · SEPTEMBER 2026</p><h1>Overview</h1><p>Monitor applications, scholarship programs, and student activity.</p></div></section><section class="stats-grid">${stat('TOTAL SCHOLARS',getTotalScholars(),'','users','orange','applicants')}${stat('ACTIVE SCHOLARS',getScholarsByType('Old scholar').length,'','graduation-cap','blue','scholarships')}${stat('NEW SCHOLARS',getScholarsByType('New scholar').length,'','award','green','scholars')}${stat('PENDING REVIEW','186','-8.2%','clock-3','purple','review')}</section><section class="admin-grid"><article class="chart-card"><div class="section-head"><div><h2>Application activity</h2><p>New applications over the last 6 months.</p></div><select><option>Last 6 months</option></select></div><div class="chart"><div class="bars">${[41,58,43,76,62,92].map((h,i)=>`<div><i style="height:${h}%"></i><span>${['Apr','May','Jun','Jul','Aug','Sep'][i]}</span></div>`).join('')}</div><div class="chart-y"><span>300</span><span>200</span><span>100</span><span>0</span></div></div></article><article class="review-card"><div class="section-head"><div><h2>Needs review</h2><p>Recent submissions awaiting action.</p></div><button class="text-btn">View all</button></div>${[['MC','Maria Clara','Academic Excellence Grant'],['RS','Rafael Santos','STEM Innovators Award'],['JL','Jose Lopez','Future Leaders Scholarship']].map((r,i)=>`<div class="review-row"><div class="avatar a${i}">${r[0]}</div><div><strong>${r[1]}</strong><small>${r[2]}</small></div><button>${icon('chevron-right',18)}</button></div>`).join('')}</article></section>${renewalDeadlineManager()}${renewalScheduleManager()}<section class="section-head applications-head"><div><h2>Renewal schedules</h2><p>View the renewal date and time set for each school.</p></div></section><div class="admin-table renewal-schedule-table"><div class="table-head"><span>SCHOOL</span><span>DATE AND TIME</span><span>ACTION</span></div>${schools.map(school => `<div class="table-row"><strong>${escapeHtml(school)}</strong><span class="${schedules[school] ? '' : 'schedule-not-set'}">${schedules[school] ? formatSchedule(schedules[school]) : 'Not set'}</span>${schedules[school] ? `<button class="clear-renewal-schedule" type="button" data-school="${escapeHtml(school)}">${icon('trash-2',15)} Clear</button>` : '<span></span>'}</div>`).join('')}</div></main></div></div>`; refresh(); }
function registeredActivityData(period) {
  const accounts = getAccounts().filter(account => account.role === 'user' && !account.addedByAdmin && account.registeredAt);
  const now = new Date();
  const groups = [];
  const dayKey = date => date.toISOString().slice(0, 10);
  if (period === 'daily') {
    for (let offset = 6; offset >= 0; offset--) {
      const date = new Date(now); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - offset);
      groups.push({ key: dayKey(date), label: new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric' }).format(date) });
    }
  } else if (period === 'yearly') {
    for (let offset = 4; offset >= 0; offset--) {
      const year = now.getFullYear() - offset;
      groups.push({ key: String(year), label: String(year) });
    }
  } else {
    for (let offset = 11; offset >= 0; offset--) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      groups.push({ key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, label: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date) });
    }
  }
  const keyForAccount = account => {
    const date = new Date(account.registeredAt);
    if (period === 'daily') return dayKey(date);
    if (period === 'yearly') return String(date.getFullYear());
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };
  return groups.map(group => ({ ...group, count: accounts.filter(account => keyForAccount(account) === group.key).length }));
}
function registeredActivityChart() {
  const data = registeredActivityData(registeredActivityPeriod);
  const highest = Math.max(...data.map(item => item.count), 1);
  const periodLabel = registeredActivityPeriod === 'daily' ? 'last 7 days' : registeredActivityPeriod === 'yearly' ? 'last 5 years' : 'last 12 months';
  return `<div class="section-head"><div><h2>Registration activity</h2><p>Students who created an account over the ${periodLabel}.</p></div><select id="registered-activity-period" aria-label="Registration chart period"><option value="daily" ${registeredActivityPeriod === 'daily' ? 'selected' : ''}>Daily</option><option value="monthly" ${registeredActivityPeriod === 'monthly' ? 'selected' : ''}>Monthly</option><option value="yearly" ${registeredActivityPeriod === 'yearly' ? 'selected' : ''}>Yearly</option></select></div><div class="chart"><div class="bars">${data.map(item => `<div><i style="height:${Math.max((item.count / highest) * 100, item.count ? 5 : 0)}%" title="${item.count} registration${item.count === 1 ? '' : 's'}"></i><span>${item.label}</span></div>`).join('')}</div><div class="chart-y"><span>${highest}</span><span>${Math.ceil(highest * 2 / 3)}</span><span>${Math.ceil(highest / 3)}</span><span>0</span></div></div>`;
}
function renderRegisteredActivityChart() {
  const chart = document.querySelector('#registered-activity-chart');
  if (!chart) return;
  chart.innerHTML = registeredActivityChart();
  document.querySelector('#registered-activity-period').onchange = event => {
    registeredActivityPeriod = event.target.value;
    renderRegisteredActivityChart();
  };
}
function registeredAccountsPage() {
  currentRoute = 'registered-accounts';
  const legacyRegistrationDate = '2026-09-06T00:00:00.000Z';
  const savedAccounts = getAccounts();
  let migratedLegacyAccount = false;
  const accounts = savedAccounts.map(account => {
    if (account.role === 'user' && !account.addedByAdmin && !account.registeredAt) {
      migratedLegacyAccount = true;
      return { ...account, registeredAt: legacyRegistrationDate };
    }
    return account;
  });
  if (migratedLegacyAccount) saveAccounts(accounts);
  const registeredAccounts = accounts.filter(account => account.role === 'user' && !account.addedByAdmin).slice().sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
  const registeredSchools = [...new Set([...schools, ...registeredAccounts.map(account => account.school).filter(Boolean)])];
  app.innerHTML = `<div class="portal admin"><div class="sidebar-backdrop"></div>${sidebar(true, 'registered-accounts')}<div class="main">${topbar(true)}<main class="content"><section class="welcome detail-heading"><div><p class="eyebrow">ADMINISTRATION</p><h1>Registered accounts</h1><p>All students who personally created an account in ScholarshipHub.</p></div><div class="registered-header-actions"><div class="registered-header-filters"><label>${icon('building-2',15)}<select id="registered-school-filter" aria-label="Filter registered accounts by school"><option value="all">All schools</option>${registeredSchools.map(school => `<option value="${escapeHtml(school)}">${escapeHtml(school)}</option>`).join('')}</select></label><label>${icon('calendar-days',15)}<select id="registered-year-filter" aria-label="Filter registered accounts by year level"><option value="all">All year levels</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option></select></label></div><div class="registered-total"><span>${icon('users-round',18)}</span><div><strong>${registeredAccounts.length}</strong><small>Registered student${registeredAccounts.length === 1 ? '' : 's'}</small></div></div></div></section><article class="chart-card registered-activity-card" id="registered-activity-chart"></article><section class="registered-board"><div class="registered-board-head"><label class="record-search">${icon('search',16)}<input id="registered-account-search" type="search" placeholder="Search name, Gmail, school, or course"></label></div><div class="detail-table"><div class="detail-head registered-account-head"><span>STUDENT</span><span>GMAIL</span><span>SCHOLAR TYPE</span><span>SCHOOL / COURSE</span><span>YEAR</span><span>REGISTERED</span></div><div id="registered-account-rows">${registeredAccounts.length ? registeredAccounts.map(account => `<div class="detail-row registered-account-row" data-search="${escapeHtml(`${account.name || ''} ${account.email || ''} ${account.school || ''} ${account.course || ''}`.toLowerCase())}" data-scholar-type="${escapeHtml(account.scholarType || '')}" data-school="${escapeHtml(account.school || '')}" data-year-level="${escapeHtml(accountYearLevel(account))}"><strong>${displayName(account)}</strong><small>${escapeHtml(account.email)}</small><span class="account-type ${account.scholarType === 'Old scholar' ? 'old-scholar' : 'new-scholar'}">${escapeHtml(account.scholarType || 'Not specified')}</span><div><strong>${escapeHtml(account.school || 'Not provided')}</strong><small>${escapeHtml(account.course || 'Not provided')}</small></div><span>${escapeHtml(accountYearLevel(account) || 'Not provided')}</span><small>${registrationDate(account.registeredAt)}</small></div>`).join('') : `<div class="search-empty">${icon('users-round',20)}<strong>No student accounts have registered yet.</strong></div>`}</div></div><div id="registered-empty" class="search-empty" hidden>${icon('search-x',20)}<strong>No registered account matches your filter.</strong></div></section></main></div></div>`;
  refresh();
}
function adminDetail(type) {
  if (type === 'review') return adminHelpRequestsPage();
  currentRoute = type === 'scholarships' ? 'active-scholars' : 'scholars';
  const oldScholars = getScholarsByType('Old scholar');
  const newScholars = getScholarsByType('New scholar');
  const info={applicants:['Total scholars',`${getTotalScholars()} old and new scholars`],scholarships:['Active scholars',`${oldScholars.length} registered old scholars`],scholars:['New scholars',`${newScholars.length} registered new scholars`],review:['Pending review','186 applications awaiting review']}[type];
  const relevantAccounts = type === 'scholarships' ? oldScholars : type === 'scholars' ? newScholars : getAccounts().filter(account => account.role === 'user' && ['Old scholar', 'New scholar'].includes(account.scholarType));
  adminDetailAccounts = relevantAccounts;
  const records = relevantAccounts.map(account => [
    account.lastName || account.name?.split(' ').at(-1) || '—',
    account.firstName || account.name?.split(' ')[0] || '—',
    account.middleName ? `${account.middleName[0]}.` : '—',
    account.school || 'Not provided',
    accountYearLevel(account) || 'Not provided',
    account.course || 'Not provided',
    account.requirementsStatus || 'Complete',
    account.scholarStatus || 'Active',
    account.email
  ]);
  app.innerHTML=`<div class="portal admin"><div class="sidebar-backdrop"></div>${sidebar(true)}<div class="main">${topbar(true)}<main class="content"><button class="back-btn" data-back-dashboard>${icon('arrow-left',17)} Back to overview</button><section class="welcome detail-heading"><div><p class="eyebrow">ADMINISTRATION</p><h1>${info[0]}</h1><p>${info[1]}</p></div><div class="detail-controls"><label class="school-filter">${icon('building-2',16)}<select id="school-filter"><option value="all">All schools</option>${schools.map(school => `<option>${escapeHtml(school)}</option>`).join('')}</select></label><button class="primary-btn compact" type="button" data-add-scholar>${icon('user-plus',17)} Add scholar</button></div></section><div class="detail-table"><div class="detail-head student-record-head"><span>LAST NAME</span><span>FIRST NAME</span><span>MIDDLE INITIAL</span><span>SCHOOL</span><span>YEAR</span><span>COURSE</span><span>REQUIREMENTS</span><span>STATUS</span></div>${records.map(row=>`<div class="detail-row student-record-row" data-account-email="${escapeHtml(row[8])}"><strong>${escapeHtml(row[0])}</strong><span>${escapeHtml(row[1])}</span><span>${escapeHtml(row[2])}</span><small>${escapeHtml(row[3])}</small><span>${escapeHtml(row[4])}</span><span>${escapeHtml(row[5])}</span><select class="record-select requirement-select ${row[6] === 'Complete' ? 'complete' : 'lacking'}"><option ${row[6] === 'Complete' ? 'selected' : ''}>Complete</option><option ${row[6] === 'Lacking' ? 'selected' : ''}>Lacking</option></select><div class="status-actions"><select class="record-select status-select ${row[7] === 'Active' ? 'active' : 'non-active'}"><option ${row[7] === 'Active' ? 'selected' : ''}>Active</option><option ${row[7] === 'Non-active' ? 'selected' : ''}>Non-active</option></select><button class="delete-row" title="Delete record" aria-label="Delete ${escapeHtml(row[0])} ${escapeHtml(row[1])}">${icon('trash-2',16)}</button></div></div>`).join('')}</div></main></div></div>`; refresh();
}

function openAddScholarModal() {
  if (supabase) return alert('For the cloud system, students must create their own account so their Auth account and profile are correctly linked. They will then appear in Registered Accounts.');
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" id="add-scholar-modal"><section class="scholarship-modal" role="dialog" aria-modal="true" aria-labelledby="add-scholar-title"><button class="modal-close" type="button" aria-label="Close">${icon('x',19)}</button><h2 id="add-scholar-title">Add scholar</h2><p>Add a returning scholar to the active-scholar list.</p><form id="add-scholar-form"><div class="two-fields"><label>Last name<input id="add-last-name" required></label><label>First name<input id="add-first-name" required></label></div><label>Middle name<input id="add-middle-name"></label><div class="two-fields"><label>School<select id="add-school" required><option value="" disabled selected>Select school</option>${schools.map(school => `<option>${school}</option>`).join('')}</select></label><label>Year<select id="add-year" required><option value="" disabled selected>Select year</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option></select></label></div><label>Course<input id="add-course" placeholder="e.g., BS Information Technology" required></label><div class="modal-actions"><button class="secondary-btn modal-cancel" type="button">Cancel</button><button class="primary-btn compact" type="submit">${icon('user-plus',16)} Add scholar</button></div></form></section></div>`);
  window.lucide?.createIcons?.();
  const modal = document.querySelector('#add-scholar-modal');
  const close = () => modal?.remove();
  modal.querySelector('.modal-close').onclick = close;
  modal.querySelector('.modal-cancel').onclick = close;
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
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
    adminDetail('scholarships');
  });
}

function bind(){
  const adminStats = document.querySelector('.admin .stats-grid');
  if (adminStats) renderScholarActivityChart();
  renderRegisteredActivityChart();
  if (adminStats && !document.querySelector('#admin-updates')) adminStats.insertAdjacentHTML('beforebegin', adminUpdatesMarkup());
  const needsReviewCard = document.querySelector('.admin .review-card');
  if (needsReviewCard) needsReviewCard.innerHTML = needsReviewMarkup();
  const studentGrid = document.querySelector('.student-grid');
  const studentUpdatesAnchor = document.querySelector('.student-renewal-schedule') || studentGrid;
  if (studentUpdatesAnchor && !document.querySelector('#student-updates')) studentUpdatesAnchor.insertAdjacentHTML('afterend', studentUpdatesMarkup());
  // The student dashboard no longer displays the sample application tracker.
  if (studentGrid) {
    const applicationRow = document.querySelector('.application-row');
    applicationRow?.previousElementSibling?.remove();
    applicationRow?.remove();
  }
  window.lucide?.createIcons?.();
  document.querySelectorAll('[data-view]').forEach(x=>x.onclick=()=>{ authMessage=''; authView(x.dataset.view); });
  document.querySelectorAll('.theme-toggle').forEach(x=>x.onclick=()=>setTheme(!document.body.classList.contains('dark')));
  document.querySelectorAll('[data-page]').forEach(button => button.onclick = () => {
    if (button.dataset.page === 'my-profile' && !isAdminSession()) navigateTo('my-profile');
    if (button.dataset.page === 'help-center' && !isAdminSession()) navigateTo('help-center');
    if (button.dataset.page === 'registered-accounts' && isAdminSession()) navigateTo('registered-accounts');
    if (button.dataset.page === 'scholarships') navigateTo('scholarships');
    if (button.dataset.page === 'overview') navigateTo('overview');
  });
  document.querySelectorAll('.open-profile').forEach(chip => {
    chip.onclick = () => navigateTo('my-profile');
    chip.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') navigateTo('my-profile'); };
  });
  document.querySelector('.hamburger')?.addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar');
    const isOpen = sidebar?.classList.toggle('open');
    document.body.classList.toggle('sidebar-open', Boolean(isOpen));
  });
  document.querySelector('.sidebar-backdrop')?.addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.remove('open');
    document.body.classList.remove('sidebar-open');
  });
  const profileLoginLabel = document.querySelector('#profile-form input[disabled]')?.closest('label');
  if (profileLoginLabel?.firstChild) profileLoginLabel.firstChild.nodeValue = 'Current login ID';
  const schoolFilter = document.querySelector('#school-filter');
  if (schoolFilter) {
    getAccounts().map(account => account.school).filter(Boolean).filter((school, index, schools) => schools.indexOf(school) === index).forEach(school => {
      if (![...schoolFilter.options].some(option => option.value === school)) schoolFilter.add(new Option(school, school));
    });
  }
  if (schoolFilter && !document.querySelector('#year-filter')) {
    schoolFilter.closest('.school-filter').insertAdjacentHTML('beforebegin', `<label class="school-filter">${icon('calendar-days',16)}<select id="year-filter" aria-label="Filter by year"><option value="all">All years</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option></select></label>`);
    window.lucide?.createIcons?.();
  }
  const applyRecordFilters = () => {
    const selectedSchool = document.querySelector('#school-filter')?.value || 'all';
    const selectedYear = document.querySelector('#year-filter')?.value || 'all';
    document.querySelectorAll('.student-record-row').forEach(row => {
      const school = row.children[3]?.textContent.trim();
      const year = row.children[4]?.textContent.trim();
      const matchesSchool = selectedSchool === 'all' || school === selectedSchool;
      const matchesYear = selectedYear === 'all' || year === selectedYear;
      row.style.display = matchesSchool && matchesYear ? 'grid' : 'none';
    });
  };
  document.querySelectorAll('.student-record-row').forEach((row, index) => {
    row.dataset.accountEmail = adminDetailAccounts[index]?.email || '';
  });
  document.querySelector('#school-filter')?.addEventListener('change', applyRecordFilters);
  document.querySelector('#year-filter')?.addEventListener('change', applyRecordFilters);
  const registeredAccountSearch = document.querySelector('#registered-account-search');
  const registeredSchoolFilter = document.querySelector('#registered-school-filter');
  const registeredYearFilter = document.querySelector('#registered-year-filter');
  const filterRegisteredAccounts = () => {
    const query = registeredAccountSearch?.value.trim().toLowerCase() || '';
    const school = registeredSchoolFilter?.value || 'all';
    const year = registeredYearFilter?.value || 'all';
    let visible = 0;
    document.querySelectorAll('.registered-account-row').forEach(row => {
      const matchesQuery = !query || row.dataset.search.includes(query);
      const matchesSchool = school === 'all' || row.dataset.school === school;
      const matchesYear = year === 'all' || row.dataset.yearLevel === year;
      const matches = matchesQuery && matchesSchool && matchesYear;
      row.hidden = !matches;
      if (matches) visible++;
    });
    const empty = document.querySelector('#registered-empty');
    if (empty) empty.hidden = visible > 0 || !document.querySelectorAll('.registered-account-row').length;
  };
  registeredAccountSearch?.addEventListener('input', filterRegisteredAccounts);
  registeredSchoolFilter?.addEventListener('change', filterRegisteredAccounts);
  registeredYearFilter?.addEventListener('change', filterRegisteredAccounts);
  const totalScholarCard = document.querySelector('.total-card');
  if (totalScholarCard) {
    const totalScholars = getTotalScholars();
    totalScholarCard.querySelector('p').textContent = 'TOTAL SCHOLARS';
    totalScholarCard.querySelector('h3').textContent = totalScholars;
    totalScholarCard.querySelector('small').innerHTML = '<span>Old + new scholars</span>';
  }
  const activeScholarCard = document.querySelector('[data-admin-detail="scholarships"]');
  if (activeScholarCard) {
    activeScholarCard.querySelector('h3').textContent = getScholarsByType('Old scholar').length;
    activeScholarCard.querySelector('small').innerHTML = '<span>Registered old scholars</span>';
  }
  const newScholarCard = document.querySelector('[data-admin-detail="scholars"]');
  if (newScholarCard) {
    newScholarCard.querySelector('h3').textContent = getScholarsByType('New scholar').length;
    newScholarCard.querySelector('small').innerHTML = '<span>Registered new scholars</span>';
  }
  const pendingReviewCard = document.querySelector('[data-admin-detail="review"]');
  if (pendingReviewCard) {
    const pendingRequests = getHelpRequests().filter(request => request.status === 'Pending').length;
    pendingReviewCard.querySelector('h3').textContent = pendingRequests;
    pendingReviewCard.querySelector('small').innerHTML = '<span>Help requests waiting for review</span>';
  }
  document.querySelector('#profile-photo')?.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert('Please choose an image smaller than 2 MB.');
    const reader = new FileReader();
    reader.onload = () => {
      updateCurrentUser({ photo: reader.result });
      const avatar = document.querySelector('.editable-avatar');
      avatar.innerHTML = `<img src="${reader.result}" alt="Profile preview">`;
    };
    reader.readAsDataURL(file);
  });
  document.querySelector('#profile-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const phone = document.querySelector('#profile-phone').value.trim();
    updateCurrentUser({
      name: document.querySelector('#profile-name').value.trim(),
      phone,
      bio: document.querySelector('#profile-bio').value.trim()
    });
    alert('Your profile has been saved.');
    profilePage();
  });
  document.querySelector('#password-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const user = getCurrentUser();
    const current = document.querySelector('#current-password')?.value;
    const next = document.querySelector('#new-password').value;
    if (supabase) {
      if (next !== document.querySelector('#confirm-password').value) return alert('The new passwords do not match.');
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) return alert(error.message);
      event.target.reset();
      return alert('Your password has been changed.');
    }
    const isLegacySocialAccount = Boolean(user.provider && !user.password);
    if (isLegacySocialAccount) {
      if (next !== document.querySelector('#confirm-password').value) return alert('The new passwords do not match.');
      updateCurrentUser({ password: next, provider: null });
      event.target.reset();
      return alert('Your account has been migrated. You can now sign in using your email and password.');
    }
    if (user.provider) return alert(`This account uses ${user.provider} sign-in, so its password is managed by ${user.provider}.`);
    if (user.password !== current) return alert('Your current password is not correct.');
    if (next !== document.querySelector('#confirm-password').value) return alert('The new passwords do not match.');
    updateCurrentUser({ password: next });
    event.target.reset();
    alert('Your password has been changed.');
  });
  document.querySelector('#help-request-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const user = getCurrentUser();
    const subject = document.querySelector('#help-subject').value.trim();
    const message = document.querySelector('#help-message').value.trim();
    if (!user?.email || !subject || !message) return;
    if (cloudReady()) {
      supabase.from('help_requests').insert({ student_id: user.id, subject, message }).then(async ({ error }) => {
        if (error) return alert(`Could not send your request: ${error.message}`);
        await loadCloudWorkspace(user);
        alert('Your help request has been sent to the administrator.');
        navigateTo('overview', true);
      });
      return;
    }
    const requests = getHelpRequests();
    requests.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, userEmail: user.email, userName: user.name || user.email, subject, message, createdAt: new Date().toISOString(), status: 'Pending' });
    saveHelpRequests(requests);
    alert('Your help request has been sent to the administrator.');
    navigateTo('overview', true);
  });
  document.querySelector('#announcement-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const field = document.querySelector('#announcement-message');
    const message = field.value.trim();
    if (!message) return;
    const user = getCurrentUser();
    if (cloudReady()) {
      supabase.from('announcements').insert({ author_id: user.id, message }).then(async ({ error }) => {
        if (error) return alert(`Could not post announcement: ${error.message}`);
        await loadCloudWorkspace(user); adminDashboard();
      });
      return;
    }
    const posts = getAnnouncements();
    posts.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, message, createdAt: new Date().toISOString(), reactions: { like: [], heart: [] } });
    saveAnnouncements(posts);
    adminDashboard();
  });
  document.querySelectorAll('[data-react]').forEach(button => button.onclick = () => {
    const user = getCurrentUser();
    if (!reactionIdentity(user)) return;
    const posts = getAnnouncements();
    const post = posts.find(item => item.id === button.dataset.postId);
    if (!post) return;
    post.reactions ||= { like: [], heart: [] };
    post.reactions.like ||= [];
    post.reactions.heart ||= [];
    const reaction = button.dataset.react;
    const identity = reactionIdentity(user);
    const selected = post.reactions[reaction].includes(identity);
    if (cloudReady()) {
      const request = selected
        ? supabase.from('announcement_reactions').delete().eq('announcement_id', Number(post.id)).eq('user_id', user.id)
        : supabase.from('announcement_reactions').upsert({ announcement_id: Number(post.id), user_id: user.id, reaction }, { onConflict: 'announcement_id,user_id' });
      request.then(async ({ error }) => {
        if (error) return alert(`Could not save reaction: ${error.message}`);
        await loadCloudWorkspace(user); studentDashboard();
      });
      return;
    }
    post.reactions.like = post.reactions.like.filter(item => item !== identity);
    post.reactions.heart = post.reactions.heart.filter(item => item !== identity);
    if (!selected) post.reactions[reaction].push(identity);
    saveAnnouncements(posts);
    studentDashboard();
  });
  document.querySelectorAll('.role').forEach(x=>x.onclick=()=>{role=x.dataset.role; document.querySelectorAll('.role').forEach(y=>y.classList.toggle('active',y===x));});
  document.querySelectorAll('.show-pass').forEach(x=>x.onclick=()=>{const i=x.previousElementSibling;i.type=i.type==='password'?'text':'password'});
  document.querySelectorAll('[data-admin-detail]').forEach(x=>x.onclick=()=>navigateTo(x.dataset.adminDetail === 'scholarships' ? 'active-scholars' : x.dataset.adminDetail === 'scholars' ? 'scholars' : 'help-requests'));
  document.querySelectorAll('[data-open-help-requests]').forEach(button => button.onclick = () => navigateTo('help-requests'));
  document.querySelectorAll('[data-back-dashboard]').forEach(x=>x.onclick=()=>navigateTo('overview'));
  document.querySelectorAll('[data-add-scholar]').forEach(button => button.onclick = openAddScholarModal);
  document.querySelectorAll('[data-apply-scholarship]').forEach(button => button.onclick = async () => {
    const user = getCurrentUser();
    if (!cloudReady()) return alert('Applications require Supabase configuration. Add your Supabase values to .env first.');
    const scholarshipId = Number(button.dataset.applyScholarship);
    button.disabled = true;
    const { data: application, error } = await supabase.from('applications').insert({ student_id: user.id, scholarship_id: scholarshipId, status: 'Submitted', submitted_at: new Date().toISOString() }).select().single();
    if (error) { button.disabled = false; return alert(`Could not submit application: ${error.message}`); }
    const { data: requirements, error: requirementsError } = await supabase.from('requirements').select('id').eq('scholarship_id', scholarshipId);
    if (!requirementsError && requirements?.length) await supabase.from('application_requirements').insert(requirements.map(requirement => ({ application_id: application.id, requirement_id: requirement.id })));
    await loadCloudWorkspace(user);
    alert('Your scholarship application has been submitted.');
    scholarshipsPage();
  });
  document.querySelector('#scholarship-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!cloudReady()) return alert('Scholarship management requires Supabase configuration.');
    const { error } = await supabase.from('scholarships').insert({
      title: document.querySelector('#scholarship-title').value.trim(),
      category: document.querySelector('#scholarship-category').value.trim() || null,
      description: document.querySelector('#scholarship-description').value.trim() || null,
      amount: Number(document.querySelector('#scholarship-amount').value) || null,
      deadline: document.querySelector('#scholarship-deadline').value || null,
      created_by: user.id, status: 'Open'
    });
    if (error) return alert(`Could not create scholarship: ${error.message}`);
    await loadCloudWorkspace(user); adminScholarshipsPage();
  });
  document.querySelector('#renewal-deadline-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const school = document.querySelector('#renewal-school').value;
    const deadline = document.querySelector('#renewal-deadline').value;
    if (!school || !deadline) return;
    const user = getCurrentUser();
    if (cloudReady()) {
      supabase.from('renewal_schedules').upsert({ school_name: school, deadline_at: deadline, schedule_at: getRenewalSchedules()[school] || null, updated_by: user.id }, { onConflict: 'school_name' }).then(async ({ error }) => {
        if (error) return alert(`Could not save reminder: ${error.message}`);
        await loadCloudWorkspace(user); adminDashboard();
      });
      return;
    }
    saveRenewalDeadlines({ ...getRenewalDeadlines(), [school]: deadline });
    alert(`Renewal reminder saved for ${school}. Only students from this school will see it.`);
    adminDashboard();
  });
  document.querySelector('#renewal-schedule-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const school = document.querySelector('#renewal-schedule-school').value;
    const schedule = document.querySelector('#renewal-schedule-date').value;
    if (!school || !schedule) return;
    const user = getCurrentUser();
    if (cloudReady()) {
      supabase.from('renewal_schedules').upsert({ school_name: school, deadline_at: getRenewalDeadlines()[school] || null, schedule_at: schedule, updated_by: user.id }, { onConflict: 'school_name' }).then(async ({ error }) => {
        if (error) return alert(`Could not save schedule: ${error.message}`);
        await loadCloudWorkspace(user); adminDashboard();
      });
      return;
    }
    saveRenewalSchedules({ ...getRenewalSchedules(), [school]: schedule });
    alert(`Renewal schedule saved for ${school}. Students from this school will see it on their dashboard.`);
    adminDashboard();
  });
  document.querySelectorAll('.clear-renewal-schedule').forEach(button => button.onclick = () => {
    const school = button.dataset.school;
    if (!confirm(`Clear the renewal schedule for ${school}?`)) return;
    const user = getCurrentUser();
    if (cloudReady()) {
      const request = getRenewalDeadlines()[school]
        ? supabase.from('renewal_schedules').update({ schedule_at: null }).eq('school_name', school)
        : supabase.from('renewal_schedules').delete().eq('school_name', school);
      request.then(async ({ error }) => {
        if (error) return alert(`Could not clear schedule: ${error.message}`);
        await loadCloudWorkspace(user); adminDashboard();
      });
      return;
    }
    const schedules = getRenewalSchedules();
    delete schedules[school];
    saveRenewalSchedules(schedules);
    alert(`Renewal schedule cleared for ${school}.`);
    adminDashboard();
  });
  document.querySelectorAll('.record-select').forEach(select=>select.onchange=()=>{
    if (select.classList.contains('requirement-select')) {
      select.classList.toggle('complete', select.value === 'Complete');
      select.classList.toggle('lacking', select.value === 'Lacking');
    } else {
      select.classList.toggle('active', select.value === 'Active');
      select.classList.toggle('non-active', select.value === 'Non-active');
    }
    const row = select.closest('.student-record-row');
    const email = row?.dataset.accountEmail;
    if (!email) return;
    const account = getAccounts().find(item => item.email === email);
    if (cloudReady() && account?.id) {
      supabase.from('profiles').update({
        requirements_status: row.querySelector('.requirement-select')?.value || 'Complete',
        scholar_status: row.querySelector('.status-select')?.value || 'Active'
      }).eq('id', account.id).then(({ error }) => {
        if (error) alert(`Could not update scholar record: ${error.message}`);
      });
    }
    saveAccounts(getAccounts().map(account => account.email === email ? {
      ...account,
      requirementsStatus: row.querySelector('.requirement-select')?.value || 'Complete',
      scholarStatus: row.querySelector('.status-select')?.value || 'Active'
    } : account));
  });
  document.querySelectorAll('.help-status-select').forEach(select => select.onchange = () => {
    const row = select.closest('.help-request-row');
    const requests = getHelpRequests();
    const request = requests.find(item => item.id === row.dataset.helpRequestId);
    if (!request) return;
    if (cloudReady()) {
      supabase.from('help_requests').update({ status: select.value, resolved_by: select.value === 'Resolved' ? getCurrentUser().id : null, resolved_at: select.value === 'Resolved' ? new Date().toISOString() : null }).eq('id', Number(request.id)).then(({ error }) => {
        if (error) alert(`Could not update help request: ${error.message}`);
      });
    }
    request.status = select.value;
    saveHelpRequests(requests);
    select.classList.toggle('lacking', select.value === 'Pending');
    select.classList.toggle('complete', select.value === 'Resolved');
  });
  document.querySelectorAll('.delete-row').forEach(button=>button.onclick=()=>{
    const row = button.closest('.student-record-row');
    const email = row.dataset.accountEmail;
    if (!confirm(`Delete ${row.children[1]?.textContent.trim() || 'this'} scholar record? This cannot be undone.`)) return;
    const account = getAccounts().find(item => item.email === email);
    if (cloudReady() && account?.id) {
      supabase.from('profiles').update({ scholar_status: 'Non-active' }).eq('id', account.id).then(({ error }) => {
        if (error) return alert(`Could not deactivate scholar: ${error.message}`);
        alert('Cloud scholar accounts are deactivated rather than deleted to preserve their account and audit data.');
        navigateTo('overview', true);
      });
      return;
    }
    if (email) saveAccounts(getAccounts().filter(account => account.email !== email));
    row.style.opacity = '0';
    setTimeout(() => row.remove(), 160);
  });
  document.querySelector('#login-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const loginId = document.querySelector('#login-email').value.trim().toLowerCase();
    const password = document.querySelector('#login-password').value;
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email: loginId, password });
      if (error) return showAuthMessage(error.message === 'Invalid login credentials' ? 'Incorrect email or password. Please try again.' : error.message);
      const account = await loadCloudSession();
      if (!account) return showAuthMessage('Your account profile is not ready yet. Please try again in a moment.');
      return navigateTo('overview', true);
    }
    if (loginId === ADMIN.email && password === ADMIN.password) { localStorage.setItem('scholarHubCurrentUser', JSON.stringify(ADMIN)); return navigateTo('overview', true); }
    const account = getAccounts().find(item => item.email === loginId);
    if (!account) return showAuthMessage('No account found for this email. Please register first.');
    if (account.password !== password) return showAuthMessage('Incorrect password. Please try again.');
    localStorage.setItem('scholarHubCurrentUser', JSON.stringify(account));
    navigateTo('overview', true);
  });
  document.querySelector('#register-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const contact = document.querySelector('#register-contact').value.trim();
    const email = document.querySelector('#register-email').value.trim().toLowerCase();
    const yearLevel = document.querySelector('#year-level').value;
    if (!/^\+?[0-9\s-]{7,20}$/.test(contact)) return showAuthMessage('Please enter a valid contact number.');
    const account = {
      email, phone: contact, password: document.querySelector('#register-password').value,
      name: `${document.querySelector('#first-name').value.trim()} ${document.querySelector('#middle-name').value.trim()} ${document.querySelector('#last-name').value.trim()}`.replace(/\s+/g, ' ').trim(),
      lastName: document.querySelector('#last-name').value.trim(), firstName: document.querySelector('#first-name').value.trim(), middleName: document.querySelector('#middle-name').value.trim(),
      sex: document.querySelector('#sex').value, birthDate: document.querySelector('#birth-date').value,
      purok: document.querySelector('#purok').value.trim(), barangay: document.querySelector('#barangay').value.trim(), municipality: document.querySelector('#municipality').value.trim(),
      school: document.querySelector('#school').value.trim(), yearLevel, year: yearLevel, course: document.querySelector('#course').value.trim(), scholarType: document.querySelector('#scholar-type').value,
      role: 'user', registeredAt: new Date().toISOString()
    };
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password: account.password, options: { data: profileFields(account) } });
      if (error) return showAuthMessage(error.message);
      authMessage = '';
      showAuthMessage(data.session ? 'Account created successfully. You can now sign in.' : 'Account created. Please check your email and confirm your account before signing in.', 'success');
      return authView('login');
    }
    const accounts = getAccounts();
    if (email === ADMIN.email || accounts.some(item => item.email === email)) return showAuthMessage('This email already has an account. Please sign in instead.');
    accounts.push(account); saveAccounts(accounts); localStorage.setItem('scholarHubCurrentUser', JSON.stringify(account)); navigateTo('overview', true);
  });
  document.querySelectorAll('.logout').forEach(x=>x.onclick=async()=>{ if (supabase) await supabase.auth.signOut(); localStorage.removeItem('scholarHubCurrentUser'); accountsCache=[]; authMessage=''; navigateTo('login', true); });
}
function helpCenterPage() {
  currentRoute = 'help-center';
  app.innerHTML = `<div class="portal"><div class="sidebar-backdrop"></div>${sidebar(false, 'help-center')}<div class="main">${topbar(false)}<main class="content profile-page"><button class="back-btn" data-page="overview">${icon('arrow-left',17)} Back to dashboard</button><section class="welcome detail-heading"><div><p class="eyebrow">STUDENT SUPPORT</p><h1>Help Center</h1><p>Send your concern to the administrator. Your request will be reviewed by the admin.</p></div></section><section class="profile-editor-card"><h2>Submit a help request</h2><form id="help-request-form"><label>Subject<input id="help-subject" maxlength="100" placeholder="What do you need help with?" required></label><label>Message<textarea id="help-message" maxlength="1000" placeholder="Describe your concern or question…" required></textarea></label><button class="primary-btn" type="submit">${icon('send',17)} Send request</button></form></section></main></div></div>`;
  refresh();
}
function scholarshipsPage() {
  currentRoute = 'scholarships';
  const user = getCurrentUser();
  const programs = scholarshipCatalog.length ? scholarshipCatalog : scholarships.map((item, index) => ({ id: `demo-${index}`, title: item[0], category: item[1], deadline: item[2], amount: Number(String(item[3]).replace(/[^0-9.]/g, '')), status: 'Open' }));
  const applications = applicationsCache.filter(application => application.student_id === user?.id);
  app.innerHTML = `<div class="portal"><div class="sidebar-backdrop"></div>${sidebar(false, 'scholarships')}<div class="main">${topbar(false)}<main class="content"><section class="welcome detail-heading"><div><p class="eyebrow">SCHOLARSHIP PROGRAMS</p><h1>Explore scholarships</h1><p>Apply to an open program and track the status of your submission.</p></div></section><section class="scholarship-list">${programs.length ? programs.map(program => { const application = applications.find(item => String(item.scholarship_id) === String(program.id)); const closed = program.status && program.status !== 'Open'; return `<article class="profile-editor-card"><p class="eyebrow">${escapeHtml(program.category || 'Scholarship')}</p><h2>${escapeHtml(program.title)}</h2><p>${escapeHtml(program.description || 'No description has been added yet.')}</p><div class="detail-info"><span>${icon('calendar-days',15)} <b>Deadline:</b> ${program.deadline ? escapeHtml(formatSchedule(program.deadline)) : 'Not set'}</span><span>${icon('wallet',15)} <b>Amount:</b> ${program.amount ? `₱${Number(program.amount).toLocaleString()}` : 'Not specified'}</span></div>${application ? `<span class="account-type ${application.status === 'Approved' ? 'new-scholar' : 'old-scholar'}">Application: ${escapeHtml(application.status)}</span>` : `<button class="primary-btn compact" data-apply-scholarship="${escapeHtml(program.id)}" ${closed ? 'disabled' : ''}>${closed ? 'Not available' : `${icon('send',16)} Apply now`}</button>`}</article>`; }).join('') : `<div class="search-empty">${icon('book-open',20)}<strong>No scholarship programs are available yet.</strong></div>`}</section></main></div></div>`;
  refresh();
}
function adminScholarshipsPage() {
  currentRoute = 'scholarships';
  app.innerHTML = `<div class="portal admin"><div class="sidebar-backdrop"></div>${sidebar(true, 'scholarships')}<div class="main">${topbar(true)}<main class="content"><section class="welcome detail-heading"><div><p class="eyebrow">ADMINISTRATION</p><h1>Scholarship programs</h1><p>Create programs that students can view and apply for.</p></div></section><section class="profile-editor-card"><h2>Create scholarship</h2><form id="scholarship-form"><div class="two-fields"><label>Title<input id="scholarship-title" required></label><label>Category<input id="scholarship-category" placeholder="e.g., Merit-based"></label></div><label>Description<textarea id="scholarship-description" maxlength="1000"></textarea></label><div class="two-fields"><label>Amount (PHP)<input id="scholarship-amount" type="number" min="0" step="0.01"></label><label>Deadline<input id="scholarship-deadline" type="datetime-local"></label></div><button class="primary-btn" type="submit">${icon('plus',17)} Create scholarship</button></form></section><section class="registered-board"><h2>Existing programs</h2><div class="detail-table"><div class="detail-head"><span>TITLE</span><span>CATEGORY</span><span>DEADLINE</span><span>STATUS</span></div>${scholarshipCatalog.length ? scholarshipCatalog.map(item => `<div class="detail-row"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.category || '—')}</span><small>${item.deadline ? escapeHtml(formatSchedule(item.deadline)) : 'Not set'}</small><span>${escapeHtml(item.status)}</span></div>`).join('') : `<div class="search-empty">${icon('book-open',20)}<strong>No scholarship programs yet.</strong></div>`}</div></section></main></div></div>`;
  refresh();
}
function needsReviewMarkup() {
  const requests = getHelpRequests().filter(request => request.status === 'Pending').slice(-3).reverse();
  if (!requests.length) return `<div class="section-head"><div><h2>Needs review</h2><p>Recent Help Center requests awaiting action.</p></div><button class="text-btn" data-open-help-requests>View all</button></div><div class="empty-review">${icon('circle-check',18)} No pending help requests.</div>`;
  return `<div class="section-head"><div><h2>Needs review</h2><p>Recent Help Center requests awaiting action.</p></div><button class="text-btn" data-open-help-requests>View all</button></div>${requests.map(request => {
    const initials = request.userName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'ST';
    return `<div class="review-row"><div class="avatar help-avatar">${escapeHtml(initials)}</div><div><strong>${escapeHtml(request.userName)}</strong><small>${escapeHtml(request.subject)}</small></div><button type="button" data-open-help-requests aria-label="View help request from ${escapeHtml(request.userName)}">${icon('chevron-right',18)}</button></div>`;
  }).join('')}`;
}
function adminHelpRequestsPage() {
  currentRoute = 'help-requests';
  const requests = getHelpRequests().slice().reverse();
  app.innerHTML = `<div class="portal admin"><div class="sidebar-backdrop"></div>${sidebar(true)}<div class="main">${topbar(true)}<main class="content"><button class="back-btn" data-back-dashboard>${icon('arrow-left',17)} Back to overview</button><section class="welcome detail-heading"><div><p class="eyebrow">ADMINISTRATION</p><h1>Pending review</h1><p>${requests.filter(request => request.status === 'Pending').length} help request${requests.filter(request => request.status === 'Pending').length === 1 ? '' : 's'} waiting for review.</p></div></section><div class="detail-table"><div class="detail-head help-request-head"><span>STUDENT</span><span>SUBJECT &amp; MESSAGE</span><span>SENT</span><span>STATUS</span></div>${requests.length ? requests.map(request => `<div class="detail-row help-request-row" data-help-request-id="${escapeHtml(request.id)}"><div><strong>${escapeHtml(request.userName)}</strong><small>${escapeHtml(request.userEmail)}</small></div><div><strong>${escapeHtml(request.subject)}</strong><small>${escapeHtml(request.message)}</small></div><small>${postTime(request.createdAt)}</small><select class="record-select help-status-select ${request.status === 'Pending' ? 'lacking' : 'complete'}"><option ${request.status === 'Pending' ? 'selected' : ''}>Pending</option><option ${request.status === 'Resolved' ? 'selected' : ''}>Resolved</option></select></div>`).join('') : `<div class="search-empty">${icon('circle-check',20)}<strong>No help requests yet.</strong></div>`}</div></main></div></div>`;
  refresh();
}
function scholarActivityData(type, period) {
  const scholars = getAccounts().filter(account => account.role === 'user' && ['Old scholar', 'New scholar'].includes(account.scholarType) && (type === 'total' || account.scholarType === type));
  const now = new Date();
  const groups = [];
  const dayKey = date => date.toISOString().slice(0, 10);
  if (period === 'daily') {
    for (let offset = 6; offset >= 0; offset--) {
      const date = new Date(now); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - offset);
      groups.push({ key: dayKey(date), label: new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric' }).format(date) });
    }
  } else if (period === 'yearly') {
    for (let offset = 4; offset >= 0; offset--) {
      const year = now.getFullYear() - offset;
      groups.push({ key: String(year), label: String(year) });
    }
  } else {
    for (let offset = 11; offset >= 0; offset--) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      groups.push({ key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, label: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date) });
    }
  }
  const keyForAccount = account => {
    const date = new Date(account.registeredAt || now);
    if (Number.isNaN(date.getTime())) return '';
    if (period === 'daily') return dayKey(date);
    if (period === 'yearly') return String(date.getFullYear());
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };
  return groups.map(group => ({ ...group, count: scholars.filter(account => keyForAccount(account) === group.key).length }));
}
function scholarActivityChart() {
  const data = scholarActivityData(activityScholarType, activityPeriod);
  const highest = Math.max(...data.map(item => item.count), 1);
  const title = activityScholarType === 'total' ? 'Total scholars' : activityScholarType === 'Old scholar' ? 'Active scholars' : 'New scholars';
  const periodLabel = activityPeriod === 'daily' ? 'last 7 days' : activityPeriod === 'yearly' ? 'last 5 years' : 'last 12 months';
  return `<div class="section-head"><div><h2>Scholar activity</h2><p>${title} registered over the ${periodLabel}.</p></div><div class="activity-chart-controls"><select id="activity-scholar-type" aria-label="Scholar category"><option value="total" ${activityScholarType === 'total' ? 'selected' : ''}>Total scholars</option><option value="Old scholar" ${activityScholarType === 'Old scholar' ? 'selected' : ''}>Active scholars</option><option value="New scholar" ${activityScholarType === 'New scholar' ? 'selected' : ''}>New scholars</option></select><select id="activity-period" aria-label="Chart period"><option value="daily" ${activityPeriod === 'daily' ? 'selected' : ''}>Daily</option><option value="monthly" ${activityPeriod === 'monthly' ? 'selected' : ''}>Monthly</option><option value="yearly" ${activityPeriod === 'yearly' ? 'selected' : ''}>Yearly</option></select></div></div><div class="chart activity-chart"><div class="bars">${data.map(item => `<div><i style="height:${Math.max((item.count / highest) * 100, item.count ? 5 : 0)}%" title="${item.count} scholar${item.count === 1 ? '' : 's'}"></i><span>${item.label}</span></div>`).join('')}</div><div class="chart-y"><span>${highest}</span><span>${Math.ceil(highest * 2 / 3)}</span><span>${Math.ceil(highest / 3)}</span><span>0</span></div></div>`;
}
function renderScholarActivityChart() {
  const chartCard = document.querySelector('.admin .chart-card');
  if (!chartCard) return;
  chartCard.innerHTML = scholarActivityChart();
  document.querySelector('#activity-scholar-type').onchange = event => { activityScholarType = event.target.value; renderScholarActivityChart(); };
  document.querySelector('#activity-period').onchange = event => { activityPeriod = event.target.value; renderScholarActivityChart(); };
}
async function renderRoute(route = 'overview') {
  const session = getCurrentUser();
  const account = supabase
    ? await loadCloudSession()
    : session?.email === ADMIN.email && session?.role === 'admin'
      ? ADMIN
      : getAccounts().find(item => item.email === session?.email);
  if (!account) {
    localStorage.removeItem('scholarHubCurrentUser');
    return authView('login');
  }
  localStorage.setItem('scholarHubCurrentUser', JSON.stringify(account));
  await loadCloudWorkspace(account);
  if (account.role === 'admin') {
    if (route === 'scholarships') return adminScholarshipsPage();
    if (route === 'active-scholars') return adminDetail('scholarships');
    if (route === 'scholars') return adminDetail('scholars');
    if (route === 'help-requests') return adminHelpRequestsPage();
    if (route === 'registered-accounts') return registeredAccountsPage();
    return adminDashboard();
  }
  if (route === 'my-profile') return profilePage();
  if (route === 'scholarships') return scholarshipsPage();
  if (route === 'help-center') return helpCenterPage();
  return studentDashboard();
}

window.addEventListener('popstate', () => renderRoute(location.hash.slice(1) || 'overview'));
setTheme(localStorage.getItem('scholarHubTheme') === 'dark');
renderRoute(location.hash.slice(1) || 'overview');
