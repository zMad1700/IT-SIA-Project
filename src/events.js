// DOM Event Listeners, Form Submissions, and Interactive Bindings

import { ADMIN, ADMIN_PASSWORD_HASH } from './config/constants.js';
import { icon, setTheme, withLoading } from './utils/dom.js';
import { getTotalScholars, getScholarsByType, accountYearLevel } from './utils/analytics.js';
import { supabase, cloudReady } from './services/supabase.js';
import {
  getAccounts,
  saveAccounts,
  setAccountsCache,
  getRenewalDeadlines,
  saveRenewalDeadlines,
  getRenewalSchedules,
  saveRenewalSchedules,
  getAnnouncements,
  saveAnnouncements,
  getHelpRequests,
  saveHelpRequests,
  loadCloudWorkspace,
  addNotification,
  markNotificationsAsRead,
  getUnreadNotificationsCount
} from './services/storage.js';
import { formatSchedule } from './utils/formatters.js';
import {
  getCurrentUser,
  isAdminSession,
  updateCurrentUser,
  loadCloudSession,
  profileFields,
  hashPassword
} from './services/auth.js';
import { reactionIdentity, adminUpdatesMarkup, studentUpdatesMarkup } from './components/announcements.js';
import { renderRegisteredActivityChart, renderScholarActivityChart } from './components/charts.js';
import { needsReviewMarkup, adminDashboard } from './views/admin/dashboard.js';
import { adminScholarshipsPage } from './views/admin/scholarships.js';
import { getAdminDetailAccounts, adminDetail } from './views/admin/scholars.js';
import { openAddScholarModal, openLogoutModal } from './components/modals.js';
import { authView, showAuthMessage, clearAuthMessage } from './views/auth.js';
import { profilePage } from './views/student/profile.js';
import { studentDashboard } from './views/student/dashboard.js';
import { scholarshipsPage } from './views/student/scholarships.js';
import { navigateTo } from './router.js';

export const refresh = () => {
  window.lucide?.createIcons?.();
  bind();
};

export const bind = () => {
  const adminStats = document.querySelector('.admin .stats-grid');
  if (adminStats) renderScholarActivityChart();
  renderRegisteredActivityChart();

  if (adminStats && !document.querySelector('#admin-updates')) {
    adminStats.insertAdjacentHTML('beforebegin', adminUpdatesMarkup());
  }

  const needsReviewCard = document.querySelector('.admin .review-card');
  if (needsReviewCard) needsReviewCard.innerHTML = needsReviewMarkup();

  const studentGrid = document.querySelector('.student-grid');
  const studentUpdatesAnchor = document.querySelector('.student-renewal-schedule') || studentGrid;
  if (studentUpdatesAnchor && !document.querySelector('#student-updates')) {
    studentUpdatesAnchor.insertAdjacentHTML('afterend', studentUpdatesMarkup());
  }

  if (studentGrid) {
    const applicationRow = document.querySelector('.application-row');
    applicationRow?.previousElementSibling?.remove();
    applicationRow?.remove();
  }

  window.lucide?.createIcons?.();

  document.querySelectorAll('[data-view]').forEach(x => {
    x.onclick = () => {
      clearAuthMessage();
      authView(x.dataset.view);
    };
  });

  document.querySelectorAll('[data-fill-demo]').forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.fillDemo;
      const emailInput = document.querySelector('#login-email');
      const passInput = document.querySelector('#login-password');
      if (!emailInput || !passInput) return;
      if (type === 'admin') {
        emailInput.value = 'admin@scholarhub.local';
        passInput.value = 'admin123';
      } else {
        emailInput.value = 'student@scholarhub.local';
        passInput.value = 'student123';
      }
      clearAuthMessage();
    };
  });

  document.querySelectorAll('.theme-toggle').forEach(x => {
    x.onclick = () => setTheme(!document.body.classList.contains('dark'));
  });

  document.querySelectorAll('[data-toggle-notifications]').forEach(btn => {
    btn.onclick = event => {
      event.stopPropagation();
      const panel = document.querySelector('#notifications-panel');
      panel?.classList.toggle('open');
    };
  });

  document.querySelector('[data-mark-all-read]')?.addEventListener('click', event => {
    event.stopPropagation();
    const user = getCurrentUser();
    markNotificationsAsRead(user);
    const badge = document.querySelector('.notification-badge-count');
    if (badge) badge.remove();
    document.querySelectorAll('.notif-item.unread').forEach(item => item.classList.replace('unread', 'read'));
    document.querySelectorAll('.notif-unread-dot').forEach(dot => dot.remove());
    document.querySelector('[data-mark-all-read]')?.remove();
    document.querySelector('.notifs-count-pill')?.remove();
  });

  document.addEventListener('click', event => {
    const panel = document.querySelector('#notifications-panel');
    if (panel?.classList.contains('open') && !event.target.closest('.notifications-trigger-wrap')) {
      panel.classList.remove('open');
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      document.querySelector('#notifications-panel')?.classList.remove('open');
    }
  });

  document.querySelectorAll('[data-page]').forEach(button => {
    button.onclick = () => {
      if (button.dataset.page === 'my-profile' && !isAdminSession()) navigateTo('my-profile');
      if (button.dataset.page === 'help-center' && !isAdminSession()) navigateTo('help-center');
      if (button.dataset.page === 'registered-accounts' && isAdminSession()) navigateTo('registered-accounts');
      if (button.dataset.page === 'scholarships') navigateTo('scholarships');
      if (button.dataset.page === 'overview') navigateTo('overview');
    };
  });

  document.querySelectorAll('.open-profile').forEach(chip => {
    chip.onclick = () => navigateTo('my-profile');
    chip.onkeydown = event => {
      if (event.key === 'Enter' || event.key === ' ') navigateTo('my-profile');
    };
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
    getAccounts()
      .map(account => account.school)
      .filter(Boolean)
      .filter((school, index, schoolsList) => schoolsList.indexOf(school) === index)
      .forEach(school => {
        if (![...schoolFilter.options].some(option => option.value === school)) {
          schoolFilter.add(new Option(school, school));
        }
      });
  }

  if (schoolFilter && !document.querySelector('#year-filter')) {
    schoolFilter.closest('.school-filter').insertAdjacentHTML(
      'beforebegin',
      `<label class="school-filter">${icon('calendar-days', 16)}<select id="year-filter" aria-label="Filter by year"><option value="all">All years</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option></select></label>`
    );
    window.lucide?.createIcons?.();
  }

  const applyRecordFilters = () => {
    const selectedSchool = document.querySelector('#school-filter')?.value || 'all';
    const selectedYear = document.querySelector('#year-filter')?.value || 'all';
    const query = document.querySelector('#scholar-search-input')?.value.trim().toLowerCase() || '';
    document.querySelectorAll('.student-record-row').forEach(row => {
      const text = row.textContent.toLowerCase();
      const school = row.querySelector('.school-name-cell')?.textContent.trim() || row.children[3]?.textContent.trim();
      const matchesSchool = selectedSchool === 'all' || school === selectedSchool;
      const matchesQuery = !query || text.includes(query);
      row.style.display = matchesSchool && matchesQuery ? 'grid' : 'none';
    });
  };

  const adminDetailAccounts = getAdminDetailAccounts();
  document.querySelectorAll('.student-record-row').forEach((row, index) => {
    row.dataset.accountEmail = adminDetailAccounts[index]?.email || '';
  });

  document.querySelector('#school-filter')?.addEventListener('change', applyRecordFilters);
  document.querySelector('#year-filter')?.addEventListener('change', applyRecordFilters);
  document.querySelector('#scholar-search-input')?.addEventListener('input', applyRecordFilters);

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
    const h3 = totalScholarCard.querySelector('h3');
    if (h3) h3.textContent = totalScholars;
  }

  const activeScholarCard = document.querySelector('[data-admin-detail="scholarships"]');
  if (activeScholarCard) {
    const h3 = activeScholarCard.querySelector('h3');
    if (h3) h3.textContent = getScholarsByType('Old scholar').length;
  }

  const newScholarCard = document.querySelector('[data-admin-detail="scholars"]');
  if (newScholarCard) {
    const h3 = newScholarCard.querySelector('h3');
    if (h3) h3.textContent = getScholarsByType('New scholar').length;
  }

  const pendingReviewCard = document.querySelector('[data-admin-detail="review"]');
  if (pendingReviewCard) {
    const pendingRequests = getHelpRequests().filter(request => request.status === 'Pending').length;
    const h3 = pendingReviewCard.querySelector('h3');
    if (h3) h3.textContent = pendingRequests;
  }

  document.querySelector('#profile-photo')?.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert('Please choose an image smaller than 2 MB.');
    const reader = new FileReader();
    reader.onload = () => {
      updateCurrentUser({ photo: reader.result });
      const avatar = document.querySelector('.editable-avatar');
      const img = document.createElement('img');
      img.src = reader.result;
      img.alt = 'Profile preview';
      avatar.replaceChildren(img);
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
      const hashedNext = await hashPassword(next);
      updateCurrentUser({ password: hashedNext, provider: null });
      event.target.reset();
      return alert('Your account has been migrated. You can now sign in using your email and password.');
    }
    if (user.provider) return alert(`This account uses ${user.provider} sign-in, so its password is managed by ${user.provider}.`);
    const storedAccount = getAccounts().find(a => a.email === user.email);
    const currentHash = await hashPassword(current);
    const isLegacy = storedAccount?.password && storedAccount.password.length !== 64;
    const currentMatches = isLegacy ? storedAccount?.password === current : storedAccount?.password === currentHash;
    if (!currentMatches) return alert('Your current password is not correct.');
    if (next !== document.querySelector('#confirm-password').value) return alert('The new passwords do not match.');
    const hashedNext = await hashPassword(next);
    updateCurrentUser({ password: hashedNext });
    event.target.reset();
    alert('Your password has been changed.');
  });

  document.querySelector('#help-request-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    const user = getCurrentUser();
    const subject = document.querySelector('#help-subject').value.trim();
    const message = document.querySelector('#help-message').value.trim();
    if (!user?.email || !subject || !message) return;
    if (cloudReady()) {
      await withLoading(btn, async () => {
        const { error } = await supabase.from('help_requests').insert({ student_id: user.id, subject, message });
        if (error) return alert(`Could not send your request: ${error.message}`);
        await loadCloudWorkspace(user);
        alert('Your help request has been sent to the administrator.');
        navigateTo('overview', true);
      });
      return;
    }
    const requests = getHelpRequests();
    requests.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userEmail: user.email,
      userName: user.name || user.email,
      subject,
      message,
      createdAt: new Date().toISOString(),
      status: 'Pending'
    });
    saveHelpRequests(requests);
    alert('Your help request has been sent to the administrator.');
    navigateTo('overview', true);
  });

  document.querySelector('#announcement-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    const field = document.querySelector('#announcement-message');
    const message = field.value.trim();
    if (!message) return;
    const user = getCurrentUser();
    if (cloudReady()) {
      await withLoading(btn, async () => {
        const { error } = await supabase.from('announcements').insert({ author_id: user.id, message });
        if (error) return alert(`Could not post announcement: ${error.message}`);
        addNotification({
          type: 'announcement',
          title: 'New Campus Advisory',
          message: message.slice(0, 110) + (message.length > 110 ? '...' : ''),
          priority: 'normal'
        });
        await loadCloudWorkspace(user);
        adminDashboard();
      });
      return;
    }
    const posts = getAnnouncements();
    posts.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      createdAt: new Date().toISOString(),
      reactions: { like: [], heart: [] }
    });
    saveAnnouncements(posts);
    addNotification({
      type: 'announcement',
      title: 'New Campus Advisory',
      message: message.slice(0, 110) + (message.length > 110 ? '...' : ''),
      priority: 'normal'
    });
    adminDashboard();
  });

  document.querySelectorAll('[data-react]').forEach(button => {
    button.onclick = async () => {
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
        await withLoading(button, async () => {
          const request = selected
            ? supabase.from('announcement_reactions').delete().eq('announcement_id', Number(post.id)).eq('user_id', user.id)
            : supabase.from('announcement_reactions').upsert({ announcement_id: Number(post.id), user_id: user.id, reaction }, { onConflict: 'announcement_id,user_id' });
          const { error } = await request;
          if (error) return alert(`Could not save reaction: ${error.message}`);
          await loadCloudWorkspace(user);
          studentDashboard();
        });
        return;
      }
      post.reactions.like = post.reactions.like.filter(item => item !== identity);
      post.reactions.heart = post.reactions.heart.filter(item => item !== identity);
      if (!selected) post.reactions[reaction].push(identity);
      saveAnnouncements(posts);
      studentDashboard();
    };
  });

  document.querySelectorAll('.role').forEach(x => {
    x.onclick = () => {
      document.querySelectorAll('.role').forEach(y => y.classList.toggle('active', y === x));
    };
  });

  document.querySelectorAll('.show-pass').forEach(x => {
    x.onclick = () => {
      const i = x.previousElementSibling;
      i.type = i.type === 'password' ? 'text' : 'password';
    };
  });

  document.querySelectorAll('[data-admin-detail]').forEach(x => {
    x.onclick = () =>
      navigateTo(
        x.dataset.adminDetail === 'scholarships'
          ? 'active-scholars'
          : x.dataset.adminDetail === 'scholars'
            ? 'scholars'
            : 'help-requests'
      );
  });

  document.querySelectorAll('[data-open-help-requests]').forEach(button => {
    button.onclick = () => navigateTo('help-requests');
  });

  document.querySelectorAll('[data-back-dashboard]').forEach(x => {
    x.onclick = () => navigateTo('overview');
  });

  document.querySelectorAll('[data-add-scholar]').forEach(button => {
    button.onclick = openAddScholarModal;
  });

  document.querySelectorAll('[data-apply-scholarship]').forEach(button => {
    button.onclick = async () => {
      const user = getCurrentUser();
      if (!cloudReady()) {
        return alert('Applications require Supabase configuration. Add your Supabase values to .env first.');
      }
      const scholarshipId = Number(button.dataset.applyScholarship);
      button.disabled = true;
      const { data: application, error } = await supabase
        .from('applications')
        .insert({ student_id: user.id, scholarship_id: scholarshipId, status: 'Submitted', submitted_at: new Date().toISOString() })
        .select()
        .single();
      if (error) {
        button.disabled = false;
        return alert(`Could not submit application: ${error.message}`);
      }
      const { data: requirements, error: requirementsError } = await supabase
        .from('requirements')
        .select('id')
        .eq('scholarship_id', scholarshipId);
      if (!requirementsError && requirements?.length) {
        await supabase
          .from('application_requirements')
          .insert(requirements.map(requirement => ({ application_id: application.id, requirement_id: requirement.id })));
      }
      await loadCloudWorkspace(user);
      alert('Your scholarship application has been submitted.');
      scholarshipsPage();
    };
  });

  document.querySelector('#scholarship-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    const user = getCurrentUser();
    if (!cloudReady()) return alert('Scholarship management requires Supabase configuration.');
    await withLoading(btn, async () => {
      const { error } = await supabase.from('scholarships').insert({
        title: document.querySelector('#scholarship-title').value.trim(),
        category: document.querySelector('#scholarship-category').value.trim() || null,
        description: document.querySelector('#scholarship-description').value.trim() || null,
        amount: Number(document.querySelector('#scholarship-amount').value) || null,
        deadline: document.querySelector('#scholarship-deadline').value || null,
        created_by: user.id,
        status: 'Open'
      });
      if (error) return alert(`Could not create scholarship: ${error.message}`);
      await loadCloudWorkspace(user);
      adminScholarshipsPage();
    });
  });

  document.querySelector('#renewal-deadline-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    const school = document.querySelector('#renewal-school').value;
    const deadline = document.querySelector('#renewal-deadline').value;
    if (!school || !deadline) return;
    const user = getCurrentUser();
    if (cloudReady()) {
      await withLoading(btn, async () => {
        const { error } = await supabase.from('renewal_schedules').upsert(
          {
            school_name: school,
            deadline_at: deadline,
            schedule_at: getRenewalSchedules()[school] || null,
            updated_by: user.id
          },
          { onConflict: 'school_name' }
        );
        if (error) return alert(`Could not save reminder: ${error.message}`);
        addNotification({
          type: 'deadline',
          title: `Renewal Deadline Announced: ${school}`,
          message: `The official renewal deadline for ${school} has been set to ${formatSchedule(deadline)}. Please prepare your renewal documents.`,
          targetSchool: school,
          priority: 'high'
        });
        await loadCloudWorkspace(user);
        adminDashboard();
      });
      return;
    }
    saveRenewalDeadlines({ ...getRenewalDeadlines(), [school]: deadline });
    addNotification({
      type: 'deadline',
      title: `Renewal Deadline Announced: ${school}`,
      message: `The official renewal deadline for ${school} has been set to ${formatSchedule(deadline)}. Please prepare your renewal documents.`,
      targetSchool: school,
      priority: 'high'
    });
    alert(`Renewal reminder saved for ${school}. Only students from this school will see it.`);
    adminDashboard();
  });

  document.querySelector('#renewal-schedule-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    const school = document.querySelector('#renewal-schedule-school').value;
    const schedule = document.querySelector('#renewal-schedule-date').value;
    if (!school || !schedule) return;
    const user = getCurrentUser();
    if (cloudReady()) {
      await withLoading(btn, async () => {
        const { error } = await supabase.from('renewal_schedules').upsert(
          {
            school_name: school,
            deadline_at: getRenewalDeadlines()[school] || null,
            schedule_at: schedule,
            updated_by: user.id
          },
          { onConflict: 'school_name' }
        );
        if (error) return alert(`Could not save schedule: ${error.message}`);
        addNotification({
          type: 'schedule',
          title: `Renewal Appointment Scheduled: ${school}`,
          message: `Official renewal appointment schedule for ${school} is confirmed for ${formatSchedule(schedule)}.`,
          targetSchool: school,
          priority: 'high'
        });
        await loadCloudWorkspace(user);
        adminDashboard();
      });
      return;
    }
    saveRenewalSchedules({ ...getRenewalSchedules(), [school]: schedule });
    addNotification({
      type: 'schedule',
      title: `Renewal Appointment Scheduled: ${school}`,
      message: `Official renewal appointment schedule for ${school} is confirmed for ${formatSchedule(schedule)}.`,
      targetSchool: school,
      priority: 'high'
    });
    alert(`Renewal schedule saved for ${school}. Students from this school will see it on their dashboard.`);
    adminDashboard();
  });

  document.querySelectorAll('.clear-renewal-schedule').forEach(button => {
    button.onclick = () => {
      const school = button.dataset.school;
      if (!confirm(`Clear the renewal schedule for ${school}?`)) return;
      const user = getCurrentUser();
      if (cloudReady()) {
        const request = getRenewalDeadlines()[school]
          ? supabase.from('renewal_schedules').update({ schedule_at: null }).eq('school_name', school)
          : supabase.from('renewal_schedules').delete().eq('school_name', school);
        request.then(async ({ error }) => {
          if (error) return alert(`Could not clear schedule: ${error.message}`);
          await loadCloudWorkspace(user);
          adminDashboard();
        });
        return;
      }
      const schedules = getRenewalSchedules();
      delete schedules[school];
      saveRenewalSchedules(schedules);
      alert(`Renewal schedule cleared for ${school}.`);
      adminDashboard();
    };
  });

  document.querySelectorAll('.record-select').forEach(select => {
    select.onchange = () => {
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
        supabase
          .from('profiles')
          .update({
            requirements_status: row.querySelector('.requirement-select')?.value || 'Complete',
            scholar_status: row.querySelector('.status-select')?.value || 'Active'
          })
          .eq('id', account.id)
          .then(({ error }) => {
            if (error) alert(`Could not update scholar record: ${error.message}`);
          });
      }
      saveAccounts(
        getAccounts().map(account =>
          account.email === email
            ? {
                ...account,
                requirementsStatus: row.querySelector('.requirement-select')?.value || 'Complete',
                scholarStatus: row.querySelector('.status-select')?.value || 'Active'
              }
            : account
        )
      );

      if (select.classList.contains('requirement-select')) {
        const isLacking = select.value === 'Lacking';
        addNotification({
          type: isLacking ? 'requirement' : 'verified',
          title: isLacking ? 'Action Required: Renewal Documents Lacking' : 'Renewal Requirements Verified',
          message: isLacking
            ? 'Your scholarship renewal documents have been marked as Lacking. Please check your compliance checklist and submit missing requirements.'
            : 'Your scholarship renewal documents have been verified and approved as Complete.',
          targetEmail: email,
          targetSchool: account?.school || null,
          priority: isLacking ? 'urgent' : 'normal'
        });
      }
    };
  });

  document.querySelectorAll('.help-status-select').forEach(select => {
    select.onchange = () => {
      const row = select.closest('.help-request-row');
      const requests = getHelpRequests();
      const request = requests.find(item => item.id === row.dataset.helpRequestId);
      if (!request) return;
      if (cloudReady()) {
        supabase
          .from('help_requests')
          .update({
            status: select.value,
            resolved_by: select.value === 'Resolved' ? getCurrentUser().id : null,
            resolved_at: select.value === 'Resolved' ? new Date().toISOString() : null
          })
          .eq('id', Number(request.id))
          .then(({ error }) => {
            if (error) alert(`Could not update help request: ${error.message}`);
          });
      }
      request.status = select.value;
      saveHelpRequests(requests);
      select.classList.toggle('lacking', select.value === 'Pending');
      select.classList.toggle('complete', select.value === 'Resolved');
    };
  });

  document.querySelectorAll('.delete-row').forEach(button => {
    button.onclick = () => {
      const row = button.closest('.student-record-row');
      const email = row.dataset.accountEmail;
      if (!confirm(`Delete ${row.children[1]?.textContent.trim() || 'this'} scholar record? This cannot be undone.`)) return;
      const account = getAccounts().find(item => item.email === email);
      if (cloudReady() && account?.id) {
        supabase
          .from('profiles')
          .update({ scholar_status: 'Non-active' })
          .eq('id', account.id)
          .then(({ error }) => {
            if (error) return alert(`Could not deactivate scholar: ${error.message}`);
            alert('Cloud scholar accounts are deactivated rather than deleted to preserve their account and audit data.');
            navigateTo('overview', true);
          });
        return;
      }
      if (email) saveAccounts(getAccounts().filter(account => account.email !== email));
      row.style.opacity = '0';
      setTimeout(() => row.remove(), 160);
    };
  });

  document.querySelector('#login-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const loginId = document.querySelector('#login-email').value.trim().toLowerCase();
    const password = document.querySelector('#login-password').value;

    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email: loginId, password });
        if (error) {
          return showAuthMessage(
            error.message === 'Invalid login credentials'
              ? 'Incorrect email or password. Please try again.'
              : error.message
          );
        }
        const account = await loadCloudSession();
        if (!account) return showAuthMessage('Your account profile is not ready yet. Please try again in a moment.');
        return navigateTo('overview', true);
      } catch (err) {
        return showAuthMessage(
          err.message === 'Failed to fetch'
            ? 'Unable to connect to Supabase. Please verify your internet connection or check your Supabase credentials in .env.'
            : (err.message || 'An unexpected connection error occurred.')
        );
      }
    }

    if (loginId === ADMIN.email) {
      if (!ADMIN_PASSWORD_HASH) {
        return showAuthMessage('Offline admin login is disabled. Set VITE_ADMIN_PASSWORD_HASH in your .env file or use Supabase Auth.');
      }
      const inputHash = await hashPassword(password);
      if (inputHash !== ADMIN_PASSWORD_HASH) return showAuthMessage('Incorrect password. Please try again.');
      localStorage.setItem('scholarHubCurrentUser', JSON.stringify(ADMIN));
      return navigateTo('overview', true);
    }

    const account = getAccounts().find(item => item.email === loginId);
    if (!account) return showAuthMessage('No account found for this email. Please register first.');

    const inputHash = await hashPassword(password);
    const isLegacyPlaintext = account.password && account.password.length !== 64;
    const passwordMatches = isLegacyPlaintext ? account.password === password : account.password === inputHash;
    if (!passwordMatches) return showAuthMessage('Incorrect password. Please try again.');

    if (isLegacyPlaintext) {
      saveAccounts(getAccounts().map(a => (a.email === account.email ? { ...a, password: inputHash } : a)));
    }

    const { password: _pw, ...safeAccount } = account;
    localStorage.setItem('scholarHubCurrentUser', JSON.stringify(safeAccount));
    navigateTo('overview', true);
  });

  document.querySelector('#register-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const contact = document.querySelector('#register-contact').value.trim();
    const email = document.querySelector('#register-email').value.trim().toLowerCase();
    const yearLevel = document.querySelector('#year-level').value;
    if (!/^\+?[0-9\s-]{7,20}$/.test(contact)) return showAuthMessage('Please enter a valid contact number.');

    const rawPassword = document.querySelector('#register-password').value;
    const account = {
      email,
      phone: contact,
      password: rawPassword,
      name: `${document.querySelector('#first-name').value.trim()} ${document.querySelector('#middle-name').value.trim()} ${document.querySelector('#last-name').value.trim()}`
        .replace(/\s+/g, ' ')
        .trim(),
      lastName: document.querySelector('#last-name').value.trim(),
      firstName: document.querySelector('#first-name').value.trim(),
      middleName: document.querySelector('#middle-name').value.trim(),
      sex: document.querySelector('#sex').value,
      birthDate: document.querySelector('#birth-date').value,
      purok: document.querySelector('#purok').value.trim(),
      barangay: document.querySelector('#barangay').value.trim(),
      municipality: document.querySelector('#municipality').value.trim(),
      school: document.querySelector('#school').value.trim(),
      yearLevel,
      year: yearLevel,
      course: document.querySelector('#course').value.trim(),
      scholarType: document.querySelector('#scholar-type').value,
      role: 'user',
      registeredAt: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: rawPassword,
          options: { data: profileFields(account) }
        });
        if (error) return showAuthMessage(error.message);
        clearAuthMessage();
        showAuthMessage(
          data.session
            ? 'Account created successfully. You can now sign in.'
            : 'Account created. Please check your email and confirm your account before signing in.',
          'success'
        );
        return authView('login');
      } catch (err) {
        return showAuthMessage(
          err.message === 'Failed to fetch'
            ? 'Unable to connect to Supabase. Please verify your internet connection or check your Supabase credentials in .env.'
            : (err.message || 'An unexpected connection error occurred.')
        );
      }
    }

    const accounts = getAccounts();
    if (email === ADMIN.email || accounts.some(item => item.email === email)) {
      return showAuthMessage('This email already has an account. Please sign in instead.');
    }

    account.password = await hashPassword(rawPassword);
    accounts.push(account);
    saveAccounts(accounts);
    const { password: _pw, ...safeAccount } = account;
    localStorage.setItem('scholarHubCurrentUser', JSON.stringify(safeAccount));
    navigateTo('overview', true);
  });

  document.querySelectorAll('.logout').forEach(x => {
    x.onclick = () => {
      openLogoutModal(async () => {
        if (supabase) await supabase.auth.signOut();
        localStorage.removeItem('scholarHubCurrentUser');
        setAccountsCache([]);
        clearAuthMessage();
        navigateTo('login', true);
      });
    };
  });
};
