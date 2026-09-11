// DOM Event Listeners, Form Submissions, and Interactive Bindings

import { ADMIN, ADMIN_PASSWORD_HASH, scholarships } from './config/constants.js';
import { icon, setTheme, withLoading } from './utils/dom.js';
import { getTotalScholars, getScholarsByType, accountYearLevel } from './utils/analytics.js';
import { supabase, cloudReady } from './services/supabase.js';
import {
  DEFAULT_DEMO_ACCOUNTS,
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
  getApplicationsCache,
  setApplicationsCache,
  saveApplicationsCache,
  getScholarshipCatalog,
  setScholarshipCatalog,
  loadCloudWorkspace,
  addNotification,
  markNotificationsAsRead,
  markNotificationAsRead,
  toggleNotificationRead,
  deleteNotification,
  clearReadNotifications,
  getUnreadNotificationsCount
} from './services/storage.js';
import { formatSchedule } from './utils/formatters.js';
import {
  getCurrentUser,
  isAdminSession,
  updateCurrentUser,
  loadCloudSession,
  profileFields,
  hashPassword,
  evaluatePasswordStrength
} from './services/auth.js';
import { reactionIdentity, adminUpdatesMarkup, studentUpdatesMarkup } from './components/announcements.js';
import { renderRegisteredActivityChart, renderScholarActivityChart } from './components/charts.js';
import { needsReviewMarkup, adminDashboard, setDashboardChartOptions } from './views/admin/dashboard.js';
import { adminScholarshipsPage, setEditingScholarship } from './views/admin/scholarships.js';
import { adminApplicationsPage } from './views/admin/applications.js';
import { registeredAccountsPage } from './views/admin/registered.js';
import { getAdminDetailAccounts, adminDetail } from './views/admin/scholars.js';
import {
  openAddScholarModal,
  openLogoutModal,
  openStudentDetailsModal,
  openApplicationModal,
  openAcademicUpdateRequestModal,
  openConfirmModal,
  openPromptModal,
  openCommandPalette,
  openApplicationInspectionModal
} from './components/modals.js';
import { showToast } from './components/toast.js';
import { authView, showAuthMessage, clearAuthMessage } from './views/auth.js';
import { profilePage } from './views/student/profile.js';
import { studentDashboard } from './views/student/dashboard.js';
import { scholarshipsPage } from './views/student/scholarships.js';
import { helpCenterPage } from './views/student/helpCenter.js';
import { adminHelpRequestsPage } from './views/admin/helpRequests.js';
import { notificationsPage } from './views/notifications.js';
import { navigateTo, getCurrentRoute } from './router.js';
import {
  parseExcelFile,
  importScholarsApi,
  exportScholarsApi,
  downloadExcelTemplate
} from './services/excel.js';
import { excelImportModalMarkup } from './components/excelModal.js';
import { uploadRenewalDocument } from './services/documents.js';

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

  document.querySelectorAll('[data-go-notifications]').forEach(btn => {
    btn.onclick = event => {
      event.stopPropagation();
      document.querySelector('#notifications-panel')?.classList.remove('open');
      navigateTo('notifications');
    };
  });

  document.querySelectorAll('[data-notif-item]').forEach(item => {
    item.onclick = event => {
      event.stopPropagation();
      const notifId = item.dataset.notifItem;
      const user = getCurrentUser();
      if (user && notifId) {
        markNotificationAsRead(notifId, user);
      }
      document.querySelector('#notifications-panel')?.classList.remove('open');
      navigateTo('notifications');
    };
  });

  // Dedicated Notifications Page Handlers
  document.querySelectorAll('[data-notifications-page-mark-read]').forEach(btn => {
    btn.onclick = () => {
      const user = getCurrentUser();
      markNotificationsAsRead(user);
      showToast('All notifications marked as read.', 'success');
      notificationsPage();
    };
  });

  document.querySelectorAll('[data-notifications-page-clear-read]').forEach(btn => {
    btn.onclick = () => {
      const user = getCurrentUser();
      clearReadNotifications(user);
      showToast('Read notifications cleared.', 'info');
      notificationsPage();
    };
  });

  document.querySelectorAll('[data-toggle-notif-read]').forEach(btn => {
    btn.onclick = () => {
      const notifId = btn.dataset.toggleNotifRead;
      const user = getCurrentUser();
      toggleNotificationRead(notifId, user);
      notificationsPage();
    };
  });

  document.querySelectorAll('[data-delete-notif]').forEach(btn => {
    btn.onclick = () => {
      const notifId = btn.dataset.deleteNotif;
      deleteNotification(notifId);
      showToast('Notification deleted.', 'info');
      notificationsPage();
    };
  });

  document.querySelectorAll('[data-notif-destination]').forEach(btn => {
    btn.onclick = () => {
      const notifId = btn.dataset.notifId;
      const targetRoute = btn.dataset.notifDestination;
      const user = getCurrentUser();
      if (notifId && user) markNotificationAsRead(notifId, user);
      navigateTo(targetRoute);
    };
  });

  const notifPageSearch = document.querySelector('#notif-page-search');
  const notifPageFilter = document.querySelector('#notif-page-filter');

  const filterPageNotifs = () => {
    const query = notifPageSearch?.value.trim().toLowerCase() || '';
    const filter = notifPageFilter?.value || 'all';
    let visible = 0;
    document.querySelectorAll('.notif-card-master').forEach(card => {
      const matchesSearch = !query || card.dataset.search.includes(query);
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'unread'
            ? card.dataset.notifStatus === 'unread'
            : card.dataset.notifType === filter;
      const isVisible = matchesSearch && matchesFilter;
      card.hidden = !isVisible;
      if (isVisible) visible++;
    });
    const emptyPlaceholder = document.querySelector('#notif-search-empty');
    if (emptyPlaceholder) {
      emptyPlaceholder.hidden = visible > 0 || !document.querySelectorAll('.notif-card-master').length;
    }
  };

  notifPageSearch?.addEventListener('input', filterPageNotifs);
  notifPageFilter?.addEventListener('change', filterPageNotifs);

  document.querySelectorAll('[data-reset-notif-filter]').forEach(btn => {
    btn.onclick = () => {
      if (notifPageSearch) notifPageSearch.value = '';
      if (notifPageFilter) notifPageFilter.value = 'all';
      filterPageNotifs();
    };
  });

  if (!window._commandPaletteBound) {
    window._commandPaletteBound = true;
    window.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openCommandPalette();
      }
    });
  }

  document.querySelectorAll('[data-open-command-palette]').forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      openCommandPalette();
    };
  });

  // CSV Roster and Directory Export
  document.querySelectorAll('[data-export-scholars]').forEach(btn => {
    btn.onclick = () => {
      const scholars = getAccounts().filter(account => account.role === 'user' && ['Old scholar', 'New scholar'].includes(account.scholarType));
      if (!scholars.length) return showToast('No scholar records available to export.', 'warning');

      const headers = ['Last Name', 'First Name', 'Middle Name', 'School', 'Year Level', 'Course', 'Scholar Type', 'Scholar Status', 'Requirements Status', 'Email', 'Phone', 'Address'];
      const rows = scholars.map(s => [
        `"${(s.lastName || s.name?.split(' ').at(-1) || '').replace(/"/g, '""')}"`,
        `"${(s.firstName || s.name?.split(' ')[0] || '').replace(/"/g, '""')}"`,
        `"${(s.middleName || '').replace(/"/g, '""')}"`,
        `"${(s.school || '').replace(/"/g, '""')}"`,
        `"${(s.yearLevel || s.year || '').replace(/"/g, '""')}"`,
        `"${(s.course || '').replace(/"/g, '""')}"`,
        `"${(s.scholarType || '').replace(/"/g, '""')}"`,
        `"${(s.scholarStatus || 'Active').replace(/"/g, '""')}"`,
        `"${(s.requirementsStatus || 'Complete').replace(/"/g, '""')}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${(s.phone || '').replace(/"/g, '""')}"`,
        `"${([s.purok, s.barangay, s.city].filter(Boolean).join(', ') || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ScholarHub-Scholars-Roster-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Exported ${scholars.length} scholar records to CSV.`, 'success');
    };
  });

  document.querySelectorAll('[data-export-registered]').forEach(btn => {
    btn.onclick = () => {
      const accounts = getAccounts().filter(a => a.role === 'user');
      if (!accounts.length) return showToast('No registered accounts available to export.', 'warning');

      const headers = ['Full Name', 'Email', 'School', 'Year Level', 'Course', 'Scholar Type', 'Status', 'Registered Date', 'Contact Phone', 'Address'];
      const rows = accounts.map(a => [
        `"${(a.name || '').replace(/"/g, '""')}"`,
        `"${(a.email || '').replace(/"/g, '""')}"`,
        `"${(a.school || '').replace(/"/g, '""')}"`,
        `"${(a.yearLevel || a.year || '').replace(/"/g, '""')}"`,
        `"${(a.course || '').replace(/"/g, '""')}"`,
        `"${(a.scholarType || '').replace(/"/g, '""')}"`,
        `"${(a.scholarStatus || 'Active').replace(/"/g, '""')}"`,
        `"${(a.registeredAt ? new Date(a.registeredAt).toLocaleDateString() : '').replace(/"/g, '""')}"`,
        `"${(a.phone || '').replace(/"/g, '""')}"`,
        `"${([a.purok, a.barangay, a.city].filter(Boolean).join(', ') || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ScholarHub-Registered-Accounts-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Exported ${accounts.length} registered accounts to CSV.`, 'success');
    };
  });

  document.querySelectorAll('[data-print-roster], [data-print-registered]').forEach(btn => {
    btn.onclick = () => {
      window.print();
    };
  });

  // --- Excel Import & Export Handlers ---
  document.querySelectorAll('[data-export-excel]').forEach(btn => {
    btn.onclick = async () => {
      try {
        const route = getCurrentRoute();
        let targetAccounts = null;
        if (route === 'scholars' || route === 'active-scholars') {
          targetAccounts = getAdminDetailAccounts();
        }
        await withLoading(btn, async () => {
          const count = (targetAccounts && targetAccounts.length)
            ? targetAccounts.length
            : getAccounts().filter(a => a.role === 'user').length;
          if (count === 0) {
            showToast('No student scholar records found to export.', 'warning');
            return;
          }
          exportScholarsApi(targetAccounts);
          showToast(`Exported ${count} scholars to Excel.`, 'success');
        }, 'Exporting...');
      } catch (err) {
        showToast('Export failed: ' + (err.message || 'Unknown error'), 'error');
      }
    };
  });

  document.querySelectorAll('[data-open-import-excel]').forEach(btn => {
    btn.onclick = () => {
      const existingModal = document.querySelector('#excel-import-modal');
      if (existingModal) existingModal.remove();

      document.body.insertAdjacentHTML('beforeend', excelImportModalMarkup());
      window.lucide?.createIcons?.();

      const modal = document.querySelector('#excel-import-modal');
      const dropzone = modal.querySelector('#excel-dropzone');
      const fileInput = modal.querySelector('#excel-file-input');
      const previewContainer = modal.querySelector('#excel-preview-container');
      const previewFilename = modal.querySelector('#preview-filename');
      const previewValidCount = modal.querySelector('#preview-valid-count');
      const previewTableBody = modal.querySelector('#preview-table-body');
      const confirmBtn = modal.querySelector('#excel-confirm-btn');
      const confirmText = modal.querySelector('#excel-confirm-text');
      const downloadTemplateBtn = modal.querySelector('[data-download-template]');

      let parsedScholars = [];

      const closeModal = () => modal?.remove();
      modal.querySelectorAll('[data-close-excel-modal]').forEach(closeBtn => {
        closeBtn.onclick = closeModal;
      });
      modal.onclick = e => {
        if (e.target === modal) closeModal();
      };

      if (downloadTemplateBtn) {
        downloadTemplateBtn.onclick = () => {
          downloadExcelTemplate();
        };
      }

      if (dropzone && fileInput) {
        dropzone.onclick = () => fileInput.click();
        dropzone.onkeydown = e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
          }
        };

        dropzone.ondragover = e => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        };
        dropzone.ondragleave = () => dropzone.classList.remove('dragover');
        dropzone.ondrop = e => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
          if (e.dataTransfer?.files?.length) {
            handleFile(e.dataTransfer.files[0]);
          }
        };

        fileInput.onchange = e => {
          if (e.target?.files?.length) {
            handleFile(e.target.files[0]);
          }
        };
      }

      const handleFile = async file => {
        if (!file) return;
        confirmBtn.disabled = true;
        confirmText.textContent = 'Analyzing spreadsheet...';

        try {
          const result = await parseExcelFile(file);
          parsedScholars = result.validRows;

          if (previewContainer) previewContainer.hidden = false;
          if (previewFilename) previewFilename.textContent = `${file.name} (${result.validRows.length} valid rows)`;
          if (previewValidCount) previewValidCount.textContent = `${result.validRows.length} Valid Scholars`;

          const previewSlice = result.validRows.slice(0, 5);
          if (previewTableBody) {
            previewTableBody.innerHTML = previewSlice
              .map(
                s => `
                <div class="excel-preview-row">
                  <span class="preview-name">${s.lastName}, ${s.firstName} ${s.middleName ? s.middleName[0] + '.' : ''}</span>
                  <span class="preview-school">${s.school || '—'}</span>
                  <span class="preview-course">${s.course || '—'}</span>
                  <span class="preview-type">${s.scholarType || 'Old scholar'}</span>
                  <span class="preview-status status-active">Active</span>
                </div>
              `
              )
              .join('');
          }

          const previewNote = modal.querySelector('#preview-table-note');
          if (previewNote) {
            previewNote.textContent = `Showing preview of first ${previewSlice.length} of ${result.validRows.length} total records from sheet "${result.sheetName}".`;
          }

          confirmBtn.disabled = false;
          confirmText.textContent = `Import ${result.validRows.length} Scholars`;
        } catch (err) {
          console.error('File parsing error:', err);
          showToast('Failed to parse Excel file: ' + (err.message || 'Unknown format'), 'error');
          confirmBtn.disabled = true;
          confirmText.textContent = 'Select File to Import';
        }
      };

      if (confirmBtn) {
        confirmBtn.onclick = async () => {
          if (!parsedScholars.length) return;
          try {
            await withLoading(confirmBtn, async () => {
              await importScholarsApi(parsedScholars);
            }, 'Importing...');
            closeModal();
            showToast(`Success! Imported ${parsedScholars.length} scholars into the system.`, 'success');
            const current = getCurrentRoute();
            if (current === 'scholars' || current === 'active-scholars' || current === 'total-scholars') {
              adminDetail(current === 'active-scholars' ? 'scholarships' : current === 'scholars' ? 'scholars' : 'applicants');
            } else {
              adminDashboard();
            }
            refresh();
          } catch (err) {
            showToast('Import failed: ' + (err.message || 'Unknown error'), 'error');
          }
        };
      }
    };
  });

  document.querySelectorAll('[data-page]').forEach(button => {
    button.onclick = event => {
      event.preventDefault();
      const page = button.dataset.page;
      if (!page) return;
      if (page === 'notifications') return navigateTo('notifications');
      if (page === 'my-profile' && !isAdminSession()) return navigateTo('my-profile');
      if (page === 'help-center') return navigateTo(isAdminSession() ? 'help-requests' : 'help-center');
      if (page === 'help-requests') return navigateTo(isAdminSession() ? 'help-requests' : 'help-center');
      if (page === 'registered-accounts' && isAdminSession()) return navigateTo('registered-accounts');
      if (page === 'applications' && isAdminSession()) return navigateTo('applications');
      if (page === 'scholarships') return navigateTo('scholarships');
      if (page === 'overview') return navigateTo('overview');
      navigateTo(page);
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

  document.querySelector('#roster-select-all')?.addEventListener('change', event => {
    document.querySelectorAll('.student-record-row').forEach(row => {
      if (!row.hidden && row.style.display !== 'none') row.querySelector('.roster-select').checked = event.target.checked;
    });
  });

  const selectedRosterEmails = () => [...document.querySelectorAll('.roster-select:checked')]
    .map(input => input.closest('.student-record-row')?.dataset.accountEmail)
    .filter(Boolean);

  const applyBulkRosterChange = async changes => {
    const emails = selectedRosterEmails();
    if (!emails.length) return showToast('Select at least one scholar first.', 'warning');
    const selectedAccounts = getAccounts().filter(account => emails.includes(account.email));
    if (cloudReady()) {
      const results = await Promise.all(selectedAccounts.filter(account => account.id).map(account =>
        supabase.from('profiles').update(changes).eq('id', account.id)
      ));
      const failed = results.find(result => result.error);
      if (failed?.error) return showToast(`Could not update selected scholars: ${failed.error.message}`, 'error');
    }
    saveAccounts(getAccounts().map(account => emails.includes(account.email)
      ? {
          ...account,
          ...(changes.requirements_status ? { requirementsStatus: changes.requirements_status } : {}),
          ...(changes.scholar_status ? { scholarStatus: changes.scholar_status } : {})
        }
      : account));
    const type = document.querySelector('#roster-bulk-actions')?.dataset.rosterType || 'scholarships';
    showToast('Roster records updated successfully.', 'success');
    adminDetail(type);
  };

  document.querySelectorAll('[data-bulk-requirements]').forEach(button => {
    button.onclick = () => applyBulkRosterChange({ requirements_status: button.dataset.bulkRequirements });
  });
  document.querySelectorAll('[data-bulk-status]').forEach(button => {
    button.onclick = () => applyBulkRosterChange({ scholar_status: button.dataset.bulkStatus });
  });

  document.querySelector('[data-export-scholars]')?.addEventListener('click', () => {
    const headers = ['Name', 'Email', 'School', 'Year Level', 'Course', 'Scholar Type', 'Requirements', 'Status'];
    const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = getAdminDetailAccounts().map(account => [account.name, account.email, account.school, accountYearLevel(account), account.course, account.scholarType, account.requirementsStatus, account.scholarStatus]);
    const blob = new Blob([[headers, ...rows].map(row => row.map(quote).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scholarhub-roster.csv';
    link.click();
    URL.revokeObjectURL(url);
  });
  document.querySelector('[data-print-roster]')?.addEventListener('click', () => window.print());

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

  document.querySelectorAll('[data-view-account], [data-view-registered-profile]').forEach(button => {
    button.onclick = () => {
      const email = button.dataset.viewRegisteredProfile || button.dataset.viewAccount;
      const account = getAccounts().find(item => item.email === email);
      if (account) {
        openStudentDetailsModal(account);
      } else {
        showToast('Account record not found.', 'error');
      }
    };
  });

  document.querySelectorAll('[data-enroll-as-scholar]').forEach(button => {
    button.onclick = () => {
      const email = button.dataset.enrollAsScholar;
      const account = getAccounts().find(item => item.email === email);
      if (!account) return showToast('Account record not found.', 'error');
      const studentName = account.name || `${account.firstName || ''} ${account.lastName || ''}`.trim() || email;

      openConfirmModal({
        title: 'Enroll into Scholar Roster',
        message: `Enroll ${studentName} into the official active scholar roster?`,
        details: 'The student will be assigned "Active" scholar status with type "New scholar" and notified.',
        confirmText: 'Enroll Scholar',
        type: 'info',
        onConfirm: async () => {
          if (cloudReady() && account.id) {
            const { error } = await supabase
              .from('profiles')
              .update({ scholar_status: 'Active', scholar_type: account.scholarType || 'New scholar' })
              .eq('id', account.id);
            if (error) return showToast(`Could not enroll scholar: ${error.message}`, 'error');
          }
          const updatedAccounts = getAccounts().map(item => {
            if (item.email === email) {
              return {
                ...item,
                scholarStatus: 'Active',
                scholarType: item.scholarType || 'New scholar',
                requirementsStatus: item.requirementsStatus || 'Complete'
              };
            }
            return item;
          });
          saveAccounts(updatedAccounts);
          addNotification({
            type: 'status',
            title: 'Scholar Roster Enrollment',
            message: 'Congratulations! Your account has been officially enrolled into the active scholarship roster.',
            targetUser: email,
            priority: 'high'
          });
          showToast(`${studentName} enrolled into active scholar roster.`, 'success');
          registeredAccountsPage();
        }
      });
    };
  });

  document.querySelectorAll('[data-delete-registered-user]').forEach(button => {
    button.onclick = () => {
      const email = button.dataset.deleteRegisteredUser;
      const account = getAccounts().find(item => item.email === email);
      if (!account) return showToast('Account record not found.', 'error');
      const studentName = account.name || `${account.firstName || ''} ${account.lastName || ''}`.trim() || email;

      openConfirmModal({
        title: 'Delete Registered Account',
        message: `Permanently remove the account record for ${studentName} (${email})?`,
        details: 'This action cannot be undone and will remove the student\'s login credentials and data.',
        confirmText: 'Delete Account',
        type: 'danger',
        onConfirm: async () => {
          if (cloudReady() && account.id) {
            const { error } = await supabase
              .from('profiles')
              .update({ scholar_status: 'Non-active' })
              .eq('id', account.id);
            if (error) return showToast(`Could not deactivate cloud account: ${error.message}`, 'error');
            showToast('Cloud account deactivated to preserve audit integrity.', 'info');
          }
          saveAccounts(getAccounts().filter(item => item.email !== email));
          showToast(`Account for ${studentName} has been deleted.`, 'info');
          registeredAccountsPage();
        }
      });
    };
  });

  document.querySelectorAll('[data-reset-account]').forEach(button => {
    button.onclick = async () => {
      if (!supabase) return showToast('Password reset emails require a configured Supabase project.', 'warning');
      button.disabled = true;
      const { error } = await supabase.auth.resetPasswordForEmail(button.dataset.resetAccount, { redirectTo: window.location.origin });
      button.disabled = false;
      showToast(error ? `Could not send reset email: ${error.message}` : 'Password reset email sent.', error ? 'error' : 'success');
    };
  });

  document.querySelectorAll('[data-deactivate-account]').forEach(button => {
    button.onclick = () => {
      const email = button.dataset.deactivateAccount;
      openConfirmModal({
        title: 'Deactivate Scholar Account',
        message: `Deactivate ${email}?`,
        details: 'The account will no longer appear as active on the official roster.',
        confirmText: 'Deactivate Account',
        type: 'danger',
        onConfirm: async () => {
          const account = getAccounts().find(item => item.email === email);
          if (cloudReady() && account?.id) {
            const { error } = await supabase.from('profiles').update({ scholar_status: 'Non-active' }).eq('id', account.id);
            if (error) return showToast(`Could not deactivate account: ${error.message}`, 'error');
          }
          saveAccounts(getAccounts().map(item => item.email === email ? { ...item, scholarStatus: 'Non-active' } : item));
          showToast(`Account ${email} has been deactivated.`, 'info');
          navigateTo('registered-accounts', true);
        }
      });
    };
  });

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
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.85 quality - typical size 15KB - 30KB
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        updateCurrentUser({ photo: compressedDataUrl });

        document.querySelectorAll('.editable-avatar-modern, .editable-avatar, .user-avatar, .profile-avatar-wrapper').forEach(container => {
          const previewImg = document.createElement('img');
          previewImg.src = compressedDataUrl;
          previewImg.alt = 'Profile picture';
          previewImg.className = 'avatar-img';
          container.replaceChildren(previewImg);
        });

        const feedback = document.querySelector('#profile-feedback');
        if (feedback) {
          feedback.innerHTML = `<div class="profile-feedback-banner success">${icon('check-circle-2', 16)} <span>Profile photo updated and optimized successfully.</span></div>`;
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  document.querySelector('#profile-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const name = document.querySelector('#profile-name')?.value.trim();
    const phone = document.querySelector('#profile-phone')?.value.trim();
    const sex = document.querySelector('#profile-sex')?.value || null;
    const birthDate = document.querySelector('#profile-birthdate')?.value || null;
    const purok = document.querySelector('#profile-purok')?.value.trim() || '';
    const barangay = document.querySelector('#profile-barangay')?.value.trim() || '';
    const municipality = document.querySelector('#profile-municipality')?.value.trim() || '';
    const bio = document.querySelector('#profile-bio')?.value.trim() || '';

    updateCurrentUser({
      name,
      phone,
      sex,
      birthDate,
      purok,
      barangay,
      municipality,
      bio
    });

    const feedback = document.querySelector('#profile-feedback');
    if (feedback) {
      feedback.innerHTML = `<div class="profile-feedback-banner success">
        ${icon('check-circle-2', 16)}
        <span>Your profile, contact, and residential details have been saved successfully.</span>
      </div>`;
      feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  document.querySelectorAll('[data-request-academic-update]').forEach(button => {
    button.onclick = () => {
      const user = getCurrentUser();
      if (!user) return showToast('Please sign in to request an academic update.', 'warning');
      openAcademicUpdateRequestModal(user, async ({ newYear, newCourse, remarks, fileName }) => {
        const now = new Date().toISOString();
        const subject = `Academic Advancement Request: ${newYear} (${newCourse})`;
        const message = `Student ${user.name} has requested an academic update to Year Level: ${newYear}, Program: ${newCourse}.\n\nAttached Document: ${fileName || 'None attached'}\n\nStudent Notes: ${remarks}`;

        const initialThread = [
          {
            sender: 'student',
            senderName: user.name || user.email,
            text: message,
            createdAt: now
          }
        ];

        if (cloudReady()) {
          const { error } = await supabase.from('help_requests').insert({
            student_id: user.id,
            category: 'Document Verification',
            subject,
            message,
            thread: JSON.stringify(initialThread)
          });
          if (error) return showToast(`Could not submit request: ${error.message}`, 'error');
          await loadCloudWorkspace(user);
        } else {
          const requests = getHelpRequests();
          requests.push({
            id: `help-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            userEmail: user.email,
            userName: user.name || user.email,
            category: 'Document Verification',
            subject,
            message,
            createdAt: now,
            status: 'Pending',
            adminReply: null,
            repliedAt: null,
            thread: initialThread
          });
          saveHelpRequests(requests);
        }

        addNotification({
          type: 'help',
          title: 'Academic Update Request Submitted',
          message: `Your request for ${newYear} (${newCourse}) has been sent to the scholarship office for verification.`,
          targetEmail: user.email,
          priority: 'normal'
        });

        const feedback = document.querySelector('#profile-feedback');
        if (feedback) {
          feedback.innerHTML = `<div class="profile-feedback-banner success">
            ${icon('check-circle-2', 16)}
            <div>
              <strong>Academic Advancement Request Submitted!</strong>
              <p>Your request for ${escapeHtml(newYear)} has been logged with the scholarship administration office. You can track coordinator review in the Help Center.</p>
            </div>
          </div>`;
          feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        showToast('Academic update request submitted successfully.', 'success');
      });
    };
  });

  document.querySelector('#password-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const user = getCurrentUser();
    const current = document.querySelector('#current-password')?.value;
    const next = document.querySelector('#new-password').value;
    if (supabase) {
      if (next !== document.querySelector('#confirm-password').value) return showToast('The new passwords do not match.', 'warning');
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) return showToast(error.message, 'error');
      event.target.reset();
      return showToast('Your password has been changed.', 'success');
    }
    const isLegacySocialAccount = Boolean(user.provider && !user.password);
    if (isLegacySocialAccount) {
      if (next !== document.querySelector('#confirm-password').value) return showToast('The new passwords do not match.', 'warning');
      const hashedNext = await hashPassword(next);
      updateCurrentUser({ password: hashedNext, provider: null });
      event.target.reset();
      return showToast('Your account has been migrated. You can now sign in using your email and password.', 'success');
    }
    if (user.provider) return showToast(`This account uses ${user.provider} sign-in, so its password is managed by ${user.provider}.`, 'info');
    const storedAccount = getAccounts().find(a => a.email === user.email);
    const currentHash = await hashPassword(current);
    const isLegacy = storedAccount?.password && storedAccount.password.length !== 64;
    const currentMatches = isLegacy ? storedAccount?.password === current : storedAccount?.password === currentHash;
    if (!currentMatches) return showToast('Your current password is not correct.', 'warning');
    if (next !== document.querySelector('#confirm-password').value) return showToast('The new passwords do not match.', 'warning');
    const hashedNext = await hashPassword(next);
    updateCurrentUser({ password: hashedNext });
    event.target.reset();
    showToast('Your password has been changed successfully.', 'success');
  });

  document.querySelector('#announcement-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    const field = document.querySelector('#announcement-message');
    const categoryEl = document.querySelector('#announcement-category');
    const targetSchoolEl = document.querySelector('#announcement-target-school');
    const pinnedEl = document.querySelector('#announcement-pinned');
    const message = field.value.trim();
    if (!message) return;
    const category = categoryEl?.value || 'General Advisory';
    const targetSchool = targetSchoolEl?.value || null;
    const pinned = Boolean(pinnedEl?.checked);
    const user = getCurrentUser();

    if (cloudReady()) {
      await withLoading(btn, async () => {
        const { error } = await supabase.from('announcements').insert({ author_id: user.id, message });
        if (error) return showToast(`Could not post announcement: ${error.message}`, 'error');
        addNotification({
          type: 'announcement',
          title: pinned ? `[PINNED] ${category}` : category,
          message: message.slice(0, 110) + (message.length > 110 ? '...' : ''),
          targetSchool,
          priority: pinned ? 'high' : 'normal'
        });
        await loadCloudWorkspace(user);
        showToast('Campus advisory posted successfully.', 'success');
        adminDashboard();
      });
      return;
    }
    const posts = getAnnouncements();
    posts.unshift({
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      category,
      targetSchool,
      message,
      pinned,
      createdAt: new Date().toISOString(),
      reactions: { like: [], heart: [] }
    });
    saveAnnouncements(posts);
    addNotification({
      type: 'announcement',
      title: pinned ? `[PINNED] ${category}` : category,
      message: message.slice(0, 110) + (message.length > 110 ? '...' : ''),
      targetSchool,
      priority: pinned ? 'high' : 'normal'
    });
    showToast('Campus advisory posted successfully.', 'success');
    adminDashboard();
  });

  document.querySelectorAll('[data-react]').forEach(button => {
    button.onclick = async () => {
      const user = getCurrentUser();
      const identity = reactionIdentity(user);
      if (!identity) return showToast('Please sign in to react to announcements.', 'warning');
      const postId = button.dataset.postId;
      const posts = getAnnouncements();
      const post = posts.find(item => String(item.id) === String(postId));
      if (!post) return;
      post.reactions ||= { like: [], heart: [] };
      post.reactions.like ||= [];
      post.reactions.heart ||= [];
      const reaction = button.dataset.react;
      const isSelected = post.reactions[reaction].includes(identity);

      // Elements for optimistic DOM mutation
      const row = button.closest('.announcement-reactions-row');
      const likeBtn = row?.querySelector('[data-react="like"]');
      const heartBtn = row?.querySelector('[data-react="heart"]');
      const likeCount = likeBtn?.querySelector('b');
      const heartCount = heartBtn?.querySelector('b');

      const prevLikes = [...post.reactions.like];
      const prevHearts = [...post.reactions.heart];

      if (isSelected) {
        post.reactions[reaction] = post.reactions[reaction].filter(item => item !== identity);
      } else {
        post.reactions.like = post.reactions.like.filter(item => item !== identity);
        post.reactions.heart = post.reactions.heart.filter(item => item !== identity);
        post.reactions[reaction].push(identity);
      }

      // Optimistic in-place DOM update without full page teardown
      if (likeBtn && likeCount) {
        const liked = post.reactions.like.includes(identity);
        likeBtn.classList.toggle('active-reaction', liked);
        likeCount.textContent = post.reactions.like.length;
      }
      if (heartBtn && heartCount) {
        const hearted = post.reactions.heart.includes(identity);
        heartBtn.classList.toggle('active-reaction-heart', hearted);
        heartCount.textContent = post.reactions.heart.length;
      }

      if (cloudReady()) {
        try {
          const request = isSelected
            ? supabase.from('announcement_reactions').delete().eq('announcement_id', Number(post.id)).eq('user_id', user.id)
            : supabase.from('announcement_reactions').upsert({ announcement_id: Number(post.id), user_id: user.id, reaction }, { onConflict: 'announcement_id,user_id' });
          const { error } = await request;
          if (error) {
            post.reactions.like = prevLikes;
            post.reactions.heart = prevHearts;
            if (likeBtn && likeCount) {
              likeBtn.classList.toggle('active-reaction', prevLikes.includes(identity));
              likeCount.textContent = prevLikes.length;
            }
            if (heartBtn && heartCount) {
              heartBtn.classList.toggle('active-reaction-heart', prevHearts.includes(identity));
              heartCount.textContent = prevHearts.length;
            }
            return showToast(`Could not save reaction: ${error.message}`, 'error');
          }
          await loadCloudWorkspace(user);
        } catch {
          showToast('Could not sync reaction with cloud.', 'error');
        }
        return;
      }

      saveAnnouncements(posts);
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

  const setupPasswordMeterAndMatch = (passInputSelector, confirmInputSelector, strengthContainerSelector, matchHintSelector) => {
    const passInput = document.querySelector(passInputSelector);
    const confirmInput = document.querySelector(confirmInputSelector);
    const strengthContainer = document.querySelector(strengthContainerSelector);
    const matchHint = document.querySelector(matchHintSelector);

    if (passInput && strengthContainer) {
      const fill = strengthContainer.querySelector('.strength-bar-fill');
      const scoreText = strengthContainer.querySelector('.strength-score-text');
      passInput.addEventListener('input', () => {
        const val = passInput.value;
        if (!val) {
          strengthContainer.hidden = true;
          if (matchHint) matchHint.innerHTML = '';
          return;
        }
        strengthContainer.hidden = false;
        const res = evaluatePasswordStrength(val);
        if (fill) {
          fill.style.width = `${res.percent}%`;
          fill.className = `strength-bar-fill ${res.class}`;
        }
        if (scoreText) {
          scoreText.textContent = res.label;
          scoreText.className = `strength-score-text ${res.class}`;
        }
        checkMatch();
      });
    }

    const checkMatch = () => {
      if (!confirmInput || !matchHint) return;
      const passVal = passInput?.value || '';
      const confVal = confirmInput.value;
      if (!confVal) {
        matchHint.innerHTML = '';
        return;
      }
      if (passVal === confVal) {
        matchHint.innerHTML = `<span class="match-success">${icon('check-circle-2', 13)} Passwords match</span>`;
      } else {
        matchHint.innerHTML = `<span class="match-error">${icon('alert-circle', 13)} Passwords do not match</span>`;
      }
      window.lucide?.createIcons?.();
    };

    if (confirmInput) {
      confirmInput.addEventListener('input', checkMatch);
    }
  };

  setupPasswordMeterAndMatch('#register-password', '#register-confirm-password', '#register-password-strength', '#register-match-hint');
  setupPasswordMeterAndMatch('#forgot-password', '#forgot-confirm-password', '#forgot-password-strength', '#forgot-match-hint');
  setupPasswordMeterAndMatch('#new-password', '#confirm-password', '#profile-password-strength', '#profile-match-hint');

  document.querySelectorAll('[data-admin-detail]').forEach(x => {
    x.onclick = event => {
      event.preventDefault();
      const detail = x.dataset.adminDetail;
      if (detail === 'scholarships') navigateTo('active-scholars');
      else if (detail === 'scholars') navigateTo('scholars');
      else if (detail === 'applicants') navigateTo('total-scholars');
      else navigateTo('help-requests');
    };
  });

  document.querySelectorAll('[data-open-help-requests]').forEach(button => {
    button.onclick = event => {
      event.preventDefault();
      navigateTo('help-requests');
    };
  });

  document.querySelectorAll('[data-back-dashboard]').forEach(button => {
    button.onclick = event => {
      event.preventDefault();
      navigateTo('overview');
    };
  });

  document.querySelectorAll('.renewal-document-upload').forEach(input => {
    input.onchange = async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) return showToast('Please choose a PDF or image smaller than 2 MB.', 'warning');
      const user = getCurrentUser();
      const docId = input.dataset.documentId;
      const typeMap = {
        'cog': 'COG',
        'cor': 'COR',
        'student-id': 'Student ID',
        'barangay-clearance': 'Barangay Clearance'
      };
      const docType = typeMap[docId] || 'COG';

      try {
        await uploadRenewalDocument({
          file,
          docType,
          user
        });
        let documents = {};
        try { documents = JSON.parse(localStorage.getItem(input.dataset.documentKey) || '{}'); } catch { documents = {}; }
        documents[docId] = { name: file.name, type: file.type, uploadedAt: new Date().toISOString() };
        localStorage.setItem(input.dataset.documentKey, JSON.stringify(documents));
        showToast(`Document "${file.name}" uploaded successfully.`, 'success');
      } catch (err) {
        console.warn('Cloud upload error, storing local copy:', err);
        const reader = new FileReader();
        reader.onload = () => {
          let documents = {};
          try { documents = JSON.parse(localStorage.getItem(input.dataset.documentKey) || '{}'); } catch { documents = {}; }
          documents[docId] = { name: file.name, type: file.type, uploadedAt: new Date().toISOString(), data: reader.result };
          localStorage.setItem(input.dataset.documentKey, JSON.stringify(documents));
          showToast(`Document "${file.name}" saved.`, 'success');
          studentDashboard();
        };
        reader.readAsDataURL(file);
        return;
      }
      studentDashboard();
    };
  });

  // Student Support Inquiry Submission
  document.querySelector('#help-request-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    const category = document.querySelector('#help-category')?.value || 'General Concern';
    const subject = document.querySelector('#help-subject')?.value.trim();
    const message = document.querySelector('#help-message')?.value.trim();
    const user = getCurrentUser();
    if (!user) return showToast('Please sign in to submit a support ticket.', 'warning');
    if (!subject || !message) return;

    await withLoading(btn, async () => {
      try {
        if (cloudReady() && user.id) {
          const { error } = await supabase
            .from('help_requests')
            .insert({
              student_id: user.id,
              subject,
              message,
              category,
              status: 'Pending'
            });
          if (error) throw error;
          await loadCloudWorkspace(user);
        } else {
          const requests = getHelpRequests();
          requests.unshift({
            id: `ticket-${Date.now()}`,
            userEmail: user.email,
            userName: user.name || user.email,
            category,
            subject,
            message,
            status: 'Pending',
            createdAt: new Date().toISOString(),
            thread: [
              {
                sender: 'student',
                senderName: user.name || 'You',
                text: message,
                createdAt: new Date().toISOString()
              }
            ]
          });
          saveHelpRequests(requests);
        }
        showToast('Your inquiry ticket has been submitted to scholarship coordinators.', 'success');
        helpCenterPage();
      } catch (err) {
        showToast(`Could not submit ticket: ${err.message}`, 'error');
      }
    }, 'Submitting...');
  });

  // Student Follow-up Reply in Ticket Thread
  document.querySelectorAll('.student-followup-form').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const ticketId = form.dataset.ticketId;
      const input = form.querySelector('.student-followup-input');
      const text = input?.value.trim();
      const user = getCurrentUser();
      if (!text || !user) return;

      const requests = getHelpRequests();
      const request = requests.find(item => String(item.id) === String(ticketId));
      if (!request) return;

      const now = new Date().toISOString();
      request.thread = Array.isArray(request.thread) && request.thread.length
        ? request.thread
        : [
            ...(request.message ? [{ sender: 'student', senderName: request.userName || 'You', text: request.message, createdAt: request.createdAt }] : []),
            ...(request.adminReply ? [{ sender: 'admin', senderName: 'Scholarship Office', text: request.adminReply, createdAt: request.repliedAt || request.createdAt }] : [])
          ];

      request.thread.push({
        sender: 'student',
        senderName: user.name || 'You',
        text,
        createdAt: now
      });
      request.status = 'Pending';
      saveHelpRequests(requests);

      if (cloudReady()) {
        try {
          await supabase
            .from('help_requests')
            .update({
              status: 'Pending',
              thread: JSON.stringify(request.thread)
            })
            .eq('id', Number(ticketId));
        } catch (e) {
          console.warn('Could not sync student reply to Supabase:', e);
        }
      }

      showToast('Follow-up message sent.', 'success');
      helpCenterPage();
    });
  });

  document.querySelectorAll('[data-focus-ticket-form]').forEach(btn => {
    btn.onclick = () => {
      const subjectInput = document.querySelector('#help-subject');
      subjectInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      subjectInput?.focus();
    };
  });

  const updateAnnouncement = async (id, changes) => {
    if (cloudReady()) {
      const { error } = await supabase.from('announcements').update(changes).eq('id', Number(id));
      if (error) return showToast(`Could not update announcement: ${error.message}`, 'error');
      await loadCloudWorkspace(getCurrentUser());
    } else {
      const posts = getAnnouncements().map(post => String(post.id) === String(id) ? { ...post, ...changes } : post);
      saveAnnouncements(posts);
    }
    adminDashboard();
  };
  document.querySelectorAll('[data-edit-announcement]').forEach(button => {
    button.onclick = () => {
      const post = getAnnouncements().find(item => String(item.id) === String(button.dataset.editAnnouncement));
      openPromptModal({
        title: 'Edit Campus Announcement',
        message: 'Update bulletin text content:',
        defaultValue: post?.message || '',
        confirmText: 'Save Announcement',
        onConfirm: async newMessage => {
          if (newMessage?.trim()) {
            await updateAnnouncement(button.dataset.editAnnouncement, { message: newMessage.trim() });
            showToast('Announcement updated successfully.', 'success');
          }
        }
      });
    };
  });
  document.querySelectorAll('[data-pin-announcement]').forEach(button => {
    button.onclick = () => {
      const post = getAnnouncements().find(item => String(item.id) === String(button.dataset.pinAnnouncement));
      if (post) {
        updateAnnouncement(button.dataset.pinAnnouncement, { pinned: !post.pinned });
        showToast(post.pinned ? 'Announcement unpinned.' : 'Announcement pinned to top.', 'info');
      }
    };
  });
  document.querySelectorAll('[data-delete-announcement]').forEach(button => {
    button.onclick = () => {
      const id = button.dataset.deleteAnnouncement;
      openConfirmModal({
        title: 'Delete Announcement',
        message: 'Are you sure you want to delete this campus announcement?',
        details: 'This action will permanently remove the bulletin from the campus feed.',
        confirmText: 'Delete Announcement',
        type: 'danger',
        onConfirm: async () => {
          if (cloudReady()) {
            const { error } = await supabase.from('announcements').delete().eq('id', Number(id));
            if (error) return showToast(`Could not delete announcement: ${error.message}`, 'error');
            await loadCloudWorkspace(getCurrentUser());
          } else {
            saveAnnouncements(getAnnouncements().filter(post => String(post.id) !== String(id)));
          }
          showToast('Announcement deleted successfully.', 'info');
          adminDashboard();
        }
      });
    };
  });

  const handleApplicationDecision = async (application, action, remarks = '') => {
    const status = action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Draft';
    const user = getCurrentUser();
    const accounts = getAccounts();
    const applicant = accounts.find(account => (account.id && String(account.id) === String(application.student_id)) || account.email === application.student_id);
    const applicantEmail = applicant?.email || application.student_id;

    if (cloudReady()) {
      const updatePayload = {
        status,
        reviewed_by: user?.id || null,
        reviewed_at: new Date().toISOString()
      };
      if (remarks) updatePayload.reviewer_notes = remarks;
      const { error } = await supabase
        .from('applications')
        .update(updatePayload)
        .eq('id', Number(application.id));
      if (error) {
        return showToast(`Could not update application: ${error.message}`, 'error');
      }
      if (status === 'Approved') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ scholar_status: 'Active', scholar_type: 'Old scholar' })
          .eq('id', application.student_id);
        if (profileError) showToast(`Application approved, but roster update failed: ${profileError.message}`, 'warning');
      }
      if (applicantEmail) {
        addNotification({
          type: 'application',
          title: status === 'Approved' ? 'Scholarship Grant Approved!' : status === 'Rejected' ? 'Application Decision Update' : 'Document Resubmission Requested',
          message: remarks ? `Status updated to ${status}. Coordinator notes: "${remarks}"` : `Your scholarship application status is now ${status}.`,
          targetEmail: applicantEmail,
          priority: status === 'Approved' ? 'high' : 'normal'
        });
      }
      await loadCloudWorkspace(user);
      showToast(`Application marked as ${status}.`, 'success');
      return adminApplicationsPage();
    }

    setApplicationsCache(getApplicationsCache().map(item => String(item.id) === String(application.id)
      ? { ...item, status, reviewer_notes: remarks || item.reviewer_notes, reviewed_by: user?.id || null, reviewed_at: new Date().toISOString() }
      : item));
    if (status === 'Approved') {
      saveAccounts(getAccounts().map(account => (account.id && String(account.id) === String(application.student_id)) || account.email === application.student_id
        ? { ...account, scholarStatus: 'Active', scholarType: 'Old scholar' }
        : account));
    }
    if (applicantEmail) {
      addNotification({
        type: 'application',
        title: status === 'Approved' ? 'Scholarship Grant Approved!' : status === 'Rejected' ? 'Application Decision Update' : 'Document Resubmission Requested',
        message: remarks ? `Status updated to ${status}. Coordinator notes: "${remarks}"` : `Your scholarship application status is now ${status}.`,
        targetEmail: applicantEmail,
        priority: status === 'Approved' ? 'high' : 'normal'
      });
    }
    showToast(`Application marked as ${status}.`, 'success');
    adminApplicationsPage();
  };

  const filterApplications = () => {
    const activePill = document.querySelector('[data-application-filter].active');
    const statusFilter = activePill?.dataset.applicationFilter || 'All';
    const query = (document.querySelector('#application-search')?.value || '').trim().toLowerCase();
    let visible = 0;

    document.querySelectorAll('.application-review-row').forEach(row => {
      const rowStatus = row.dataset.status;
      const rowSearch = (row.dataset.search || '').toLowerCase();
      const matchesStatus = statusFilter === 'All' || rowStatus === statusFilter;
      const matchesQuery = !query || rowSearch.includes(query);
      const show = matchesStatus && matchesQuery;
      row.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    const empty = document.querySelector('#application-filter-empty');
    if (empty) empty.hidden = visible > 0;
  };

  const appSearch = document.querySelector('#application-search');
  if (appSearch) {
    appSearch.oninput = filterApplications;
  }

  document.querySelectorAll('[data-application-filter]').forEach(button => {
    button.onclick = () => {
      document.querySelectorAll('[data-application-filter]').forEach(item => item.classList.toggle('active', item === button));
      filterApplications();
    };
  });

  document.querySelectorAll('[data-reset-app-filter]').forEach(button => {
    button.onclick = () => {
      const search = document.querySelector('#application-search');
      if (search) search.value = '';
      const allPill = document.querySelector('[data-application-filter="All"]');
      if (allPill) {
        document.querySelectorAll('[data-application-filter]').forEach(item => item.classList.toggle('active', item === allPill));
      }
      filterApplications();
    };
  });

  // Inspection modal
  document.querySelectorAll('[data-inspect-application]').forEach(button => {
    button.onclick = () => {
      const appId = button.dataset.inspectApplication;
      const applications = getApplicationsCache();
      const application = applications.find(item => String(item.id) === String(appId));
      if (!application) return showToast('Application record not found.', 'error');
      const accounts = getAccounts();
      const applicant = accounts.find(account => (account.id && String(account.id) === String(application.student_id)) || account.email === application.student_id);
      const programs = getScholarshipCatalog();
      const program = programs.find(p => String(p.id) === String(application.scholarship_id));
      openApplicationInspectionModal(application, applicant, program, async (action, remarks) => {
        await handleApplicationDecision(application, action, remarks);
      });
    };
  });

  // Direct row decision actions
  document.querySelectorAll('[data-application-action]').forEach(button => {
    button.onclick = async () => {
      const application = getApplicationsCache().find(item => String(item.id) === String(button.dataset.applicationId));
      if (!application) return;
      const action = button.dataset.applicationAction;
      const accounts = getAccounts();
      const applicant = accounts.find(account => (account.id && String(account.id) === String(application.student_id)) || account.email === application.student_id);
      const studentName = applicant ? `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || applicant.name : 'this applicant';

      if (action === 'reject') {
        openPromptModal({
          title: 'Reject Application',
          message: `Please specify the feedback or grounds for rejecting ${studentName}'s application (visible to student):`,
          placeholder: 'e.g. GWA does not meet the minimum 1.75 threshold required for this grant.',
          confirmText: 'Reject with Remarks',
          onConfirm: async remarks => {
            await handleApplicationDecision(application, 'reject', remarks);
          }
        });
        return;
      }

      if (action === 'resubmit') {
        openPromptModal({
          title: 'Request Resubmission',
          message: `Specify which documentary requirement or information needs resubmission from ${studentName}:`,
          placeholder: 'e.g. Please upload an official signed copy of your Certificate of Grades with campus registrar seal.',
          confirmText: 'Send Resubmission Request',
          onConfirm: async remarks => {
            await handleApplicationDecision(application, 'resubmit', remarks);
          }
        });
        return;
      }

      openConfirmModal({
        title: 'Approve Scholarship Grant',
        message: `Are you sure you want to approve ${studentName} for this scholarship grant?`,
        details: 'The student will be marked as an active scholar in the roster and notified in their portal.',
        confirmText: 'Approve Grant',
        type: 'primary',
        iconName: 'check-circle',
        onConfirm: async () => {
          await handleApplicationDecision(application, 'approve', 'Congratulations! Your scholarship application has been officially approved.');
        }
      });
    };
  });

  // Application row decision dropdown actions
  document.querySelectorAll('.application-action-select').forEach(select => {
    let previousValue = select.value;
    select.onfocus = () => {
      previousValue = select.value;
    };
    select.onchange = async () => {
      const application = getApplicationsCache().find(item => String(item.id) === String(select.dataset.applicationId));
      if (!application) return;
      const action = select.value;
      if (!action) return;
      const accounts = getAccounts();
      const applicant = accounts.find(account => (account.id && String(account.id) === String(application.student_id)) || account.email === application.student_id);
      const studentName = applicant ? `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || applicant.name : 'this applicant';

      if (action === 'reject') {
        const remarks = await openPromptModal({
          title: 'Reject Application',
          message: `Please specify the feedback or grounds for rejecting ${studentName}'s application (visible to student):`,
          placeholder: 'e.g. GWA does not meet the minimum 1.75 threshold required for this grant.',
          confirmText: 'Reject with Remarks'
        });
        if (remarks !== null) {
          await handleApplicationDecision(application, 'reject', remarks);
        } else {
          select.value = previousValue;
        }
        return;
      }

      if (action === 'resubmit') {
        const remarks = await openPromptModal({
          title: 'Request Resubmission',
          message: `Specify which documentary requirement or information needs resubmission from ${studentName}:`,
          placeholder: 'e.g. Please upload an official signed copy of your Certificate of Grades with campus registrar seal.',
          confirmText: 'Send Resubmission Request'
        });
        if (remarks !== null) {
          await handleApplicationDecision(application, 'resubmit', remarks);
        } else {
          select.value = previousValue;
        }
        return;
      }

      if (action === 'approve') {
        const confirmed = await openConfirmModal({
          title: 'Approve Scholarship Grant',
          message: `Are you sure you want to approve ${studentName} for this scholarship grant?`,
          details: 'The student will be marked as an active scholar in the roster and notified in their portal.',
          confirmText: 'Approve Grant',
          type: 'primary',
          iconName: 'check-circle'
        });
        if (confirmed) {
          await handleApplicationDecision(application, 'approve', 'Congratulations! Your scholarship application has been officially approved.');
        } else {
          select.value = previousValue;
        }
      }
    };
  });

  // Batch operations on applications
  const updateBatchBar = () => {
    const checked = document.querySelectorAll('.application-select-row:checked');
    const bar = document.querySelector('#application-batch-bar');
    const countSpan = document.querySelector('#application-selected-count');
    if (countSpan) countSpan.textContent = checked.length;
    if (bar) bar.hidden = checked.length === 0;
  };

  const selectAllApps = document.querySelector('#select-all-applications');
  if (selectAllApps) {
    selectAllApps.onchange = () => {
      const visibleRows = Array.from(document.querySelectorAll('.application-review-row')).filter(r => r.style.display !== 'none');
      visibleRows.forEach(row => {
        const checkbox = row.querySelector('.application-select-row');
        if (checkbox) checkbox.checked = selectAllApps.checked;
      });
      updateBatchBar();
    };
  }

  document.querySelectorAll('.application-select-row').forEach(cb => {
    cb.onchange = updateBatchBar;
  });

  document.querySelectorAll('[data-batch-clear]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.application-select-row').forEach(cb => { cb.checked = false; });
      if (selectAllApps) selectAllApps.checked = false;
      updateBatchBar();
    };
  });

  document.querySelectorAll('[data-batch-action]').forEach(btn => {
    btn.onclick = () => {
      const action = btn.dataset.batchAction;
      const checkedBoxes = Array.from(document.querySelectorAll('.application-select-row:checked'));
      if (!checkedBoxes.length) return showToast('No applications selected.', 'info');
      const count = checkedBoxes.length;

      openConfirmModal({
        title: action === 'approve' ? 'Batch Approve Applications' : 'Batch Reject Applications',
        message: `Are you sure you want to ${action} ${count} selected application${count === 1 ? '' : 's'}?`,
        details: action === 'approve' ? 'All selected students will be admitted into the active scholar roster.' : 'All selected applications will be marked as rejected.',
        confirmText: action === 'approve' ? `Approve ${count} Applications` : `Reject ${count} Applications`,
        type: action === 'approve' ? 'primary' : 'danger',
        iconName: action === 'approve' ? 'check-circle' : 'x-circle',
        onConfirm: async () => {
          for (const cb of checkedBoxes) {
            const appId = cb.dataset.selectAppId;
            const app = getApplicationsCache().find(item => String(item.id) === String(appId));
            if (app) {
              await handleApplicationDecision(app, action, action === 'approve' ? 'Bulk approved by scholarship committee.' : 'Bulk reviewed and rejected.');
            }
          }
          showToast(`Successfully ${action === 'approve' ? 'approved' : 'rejected'} ${count} applications.`, 'success');
          adminApplicationsPage();
        }
      });
    };
  });

  // Empty-state CTA triggers
  document.querySelectorAll('[data-focus-new-program]').forEach(btn => {
    btn.onclick = () => {
      const titleInput = document.querySelector('#scholarship-title');
      if (titleInput) {
        titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        titleInput.focus();
      }
    };
  });

  document.querySelectorAll('[data-reset-program-filter]').forEach(btn => {
    btn.onclick = () => {
      const search = document.querySelector('#program-search');
      if (search) { search.value = ''; search.dispatchEvent(new Event('input')); }
      const category = document.querySelector('#program-category-filter');
      if (category) { category.value = 'all'; category.dispatchEvent(new Event('change')); }
    };
  });

  document.querySelectorAll('[data-reset-student-scholarships]').forEach(btn => {
    btn.onclick = () => {
      const search = document.querySelector('#scholarship-search-input');
      if (search) { search.value = ''; search.dispatchEvent(new Event('input')); }
      const allPill = document.querySelector('[data-category-filter="all"]');
      if (allPill) allPill.click();
    };
  });

  document.querySelectorAll('[data-focus-ticket-form]').forEach(btn => {
    btn.onclick = () => {
      const subInput = document.querySelector('#help-subject');
      if (subInput) {
        subInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        subInput.focus();
      }
    };
  });

  document.querySelectorAll('[data-reset-help-filter]').forEach(btn => {
    btn.onclick = () => {
      const search = document.querySelector('#help-filter-search');
      if (search) { search.value = ''; search.dispatchEvent(new Event('input')); }
      const statusPill = document.querySelector('[data-help-filter="all"]');
      if (statusPill) statusPill.click();
    };
  });

  document.querySelectorAll('[data-reset-registered-search]').forEach(btn => {
    btn.onclick = () => {
      const search = document.querySelector('#registered-search');
      if (search) { search.value = ''; search.dispatchEvent(new Event('input')); }
    };
  });

  document.querySelectorAll('[data-back-dashboard]').forEach(x => {
    x.onclick = () => navigateTo('overview');
  });

  document.querySelectorAll('[data-add-scholar]').forEach(button => {
    button.onclick = openAddScholarModal;
  });

  document.querySelectorAll('[data-apply-scholarship]').forEach(button => {
    button.onclick = () => {
      const user = getCurrentUser();
      if (!user) return showToast('Please sign in as a student to apply for scholarships.', 'warning');
      const programId = button.dataset.applyScholarship;
      const catalog = getScholarshipCatalog();
      const programs = catalog.length
        ? catalog
        : scholarships.map((item, index) => ({
            id: `demo-${index}`,
            title: item[0],
            category: item[1],
            deadline: item[2],
            amount: Number(String(item[3]).replace(/[^0-9.]/g, '')),
            status: 'Open'
          }));
      const program = programs.find(item => String(item.id) === String(programId));
      if (!program) return;

      openApplicationModal(program, user, async ({ gwa, income, statement, fileName, fileData }) => {
        if (cloudReady()) {
          const scholarshipId = Number(program.id);
          const { data: application, error } = await supabase
            .from('applications')
            .insert({
              student_id: user.id,
              scholarship_id: scholarshipId,
              status: 'Submitted',
              submitted_at: new Date().toISOString()
            })
            .select()
            .single();
          if (error) return showToast(`Could not submit application: ${error.message}`, 'error');
          const { data: requirements, error: requirementsError } = await supabase
            .from('requirements')
            .select('id')
            .eq('scholarship_id', scholarshipId);
          if (!requirementsError && requirements?.length) {
            await supabase
              .from('application_requirements')
              .insert(requirements.map(requirement => ({ application_id: application.id, requirement_id: requirement.id })));
          }
          addNotification({
            type: 'application',
            title: 'Scholarship Application Submitted',
            message: `Your application for "${program.title}" has been received and is under administrative review.`,
            targetEmail: user.email,
            priority: 'normal'
          });
          await loadCloudWorkspace(user);
          showToast('Your scholarship application has been successfully submitted!', 'success');
          return scholarshipsPage();
        }

        // Offline / Local Demo Mode Persistence
        const cache = getApplicationsCache();
        const newApplication = {
          id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          student_id: user.id || user.email || 'student@scholarhub.local',
          scholarship_id: program.id,
          status: 'Submitted',
          gwa: gwa || '1.25',
          household_income: income || 'Below ₱150,000',
          statement: statement || 'Dedicated scholar striving for academic excellence.',
          file_name: fileName || null,
          file_data: fileData || null,
          submitted_at: new Date().toISOString(),
          reviewer_notes: null
        };
        const updated = [newApplication, ...cache.filter(a => !(String(a.scholarship_id) === String(program.id) && (a.student_id === user.id || a.student_id === user.email)))];
        saveApplicationsCache(updated);
        addNotification({
          type: 'application',
          title: 'Scholarship Application Submitted',
          message: `Your application for "${program.title}" has been received and is under administrative review.`,
          targetEmail: user.email,
          priority: 'normal'
        });
        showToast('Your scholarship application has been successfully submitted!', 'success');
        scholarshipsPage();
      });
    };
  });

  const filterScholarships = () => {
    const searchInput = document.querySelector('#scholarship-search-input');
    const query = (searchInput?.value || '').trim().toLowerCase();
    const activeCategoryBtn = document.querySelector('.category-filter-pill.active');
    const activeCategory = (activeCategoryBtn?.dataset.categoryFilter || 'all').toLowerCase();
    const cards = document.querySelectorAll('.scholarship-grant-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const cardCategory = (card.dataset.category || '').toLowerCase();
      const cardSearch = (card.dataset.search || '').toLowerCase();
      const matchesCategory = activeCategory === 'all' || cardCategory === activeCategory;
      const matchesQuery = !query || cardSearch.includes(query);
      const isVisible = matchesCategory && matchesQuery;
      card.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount++;
    });

    const emptyBanner = document.querySelector('#scholarship-filter-empty');
    if (emptyBanner) emptyBanner.hidden = visibleCount > 0;
  };

  document.querySelector('#scholarship-search-input')?.addEventListener('input', filterScholarships);

  document.querySelectorAll('[data-category-filter]').forEach(button => {
    button.onclick = () => {
      document.querySelectorAll('[data-category-filter]').forEach(btn => btn.classList.toggle('active', btn === button));
      filterScholarships();
    };
  });

  document.querySelector('#help-request-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    const user = getCurrentUser();
    const category = document.querySelector('#help-category')?.value || 'General Concern';
    const subject = document.querySelector('#help-subject')?.value.trim();
    const message = document.querySelector('#help-message')?.value.trim();
    if (!user?.email || !subject || !message) return;
    const now = new Date().toISOString();
    const initialThread = [
      {
        sender: 'student',
        senderName: user.name || user.email,
        text: message,
        createdAt: now
      }
    ];

    if (cloudReady()) {
      await withLoading(btn, async () => {
        const { error } = await supabase.from('help_requests').insert({
          student_id: user.id,
          subject,
          message,
          category,
          thread: JSON.stringify(initialThread)
        });
        if (error) return showToast(`Could not send your request: ${error.message}`, 'error');
        await loadCloudWorkspace(user);
        helpCenterPage();
        showToast('Inquiry ticket submitted successfully.', 'success');
        const feedback = document.querySelector('#help-form-feedback');
        if (feedback) {
          feedback.innerHTML = `<div class="help-submission-success-banner">${icon('check-circle-2', 18)} <div><strong>Inquiry Ticket Submitted Successfully</strong><p>Your ticket has been routed to the scholarship office. You can track responses below.</p></div></div>`;
        }
      });
      return;
    }

    const requests = getHelpRequests();
    requests.push({
      id: `help-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userEmail: user.email,
      userName: user.name || user.email,
      category,
      subject,
      message,
      createdAt: now,
      status: 'Pending',
      adminReply: null,
      repliedAt: null,
      thread: initialThread
    });
    saveHelpRequests(requests);
    helpCenterPage();
    showToast('Inquiry ticket submitted successfully.', 'success');
    const feedback = document.querySelector('#help-form-feedback');
    if (feedback) {
      feedback.innerHTML = `<div class="help-submission-success-banner">${icon('check-circle-2', 18)} <div><strong>Inquiry Ticket Submitted Successfully</strong><p>Your ticket has been routed to the scholarship office. You can track responses below.</p></div></div>`;
    }
  });

  document.querySelectorAll('.student-followup-form').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const ticketId = form.dataset.ticketId;
      const input = form.querySelector('.student-followup-input');
      const text = input?.value.trim();
      if (!text) return;
      const user = getCurrentUser();
      if (!user) return;
      const now = new Date().toISOString();
      const requests = getHelpRequests();
      const ticket = requests.find(item => String(item.id) === String(ticketId));
      if (!ticket) return;

      ticket.thread = Array.isArray(ticket.thread) && ticket.thread.length
        ? ticket.thread
        : [
            ...(ticket.message ? [{ sender: 'student', senderName: ticket.userName || 'You', text: ticket.message, createdAt: ticket.createdAt }] : []),
            ...(ticket.adminReply ? [{ sender: 'admin', senderName: 'Administration', text: ticket.adminReply, createdAt: ticket.repliedAt || ticket.createdAt }] : [])
          ];

      ticket.thread.push({
        sender: 'student',
        senderName: user.name || user.email,
        text,
        createdAt: now
      });
      ticket.status = 'Pending';

      const btn = form.querySelector('button[type="submit"]');
      if (cloudReady()) {
        await withLoading(btn, async () => {
          const { error } = await supabase
            .from('help_requests')
            .update({ status: 'Pending', thread: JSON.stringify(ticket.thread) })
            .eq('id', Number(ticketId));
          if (error) return showToast(`Could not send reply: ${error.message}`, 'error');
          await loadCloudWorkspace(user);
        });
      } else {
        saveHelpRequests(requests);
      }
      showToast('Follow-up message sent successfully.', 'success');
      helpCenterPage();
    });
  });

  document.querySelector('#scholarship-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    const user = getCurrentUser();
    const editingId = event.target.dataset.editProgramId;
    const payload = {
      title: document.querySelector('#scholarship-title').value.trim(),
      category: document.querySelector('#scholarship-category').value.trim() || null,
      description: document.querySelector('#scholarship-description').value.trim() || null,
      amount: Number(document.querySelector('#scholarship-amount').value) || null,
      deadline: document.querySelector('#scholarship-deadline').value || null
    };
    await withLoading(btn, async () => {
      if (cloudReady()) {
        const request = editingId
          ? supabase.from('scholarships').update(payload).eq('id', Number(editingId))
          : supabase.from('scholarships').insert({ ...payload, created_by: user.id, status: 'Open' });
        const { error } = await request;
        if (error) return showToast(`Could not ${editingId ? 'update' : 'create'} scholarship: ${error.message}`, 'error');
        setEditingScholarship(null);
        await loadCloudWorkspace(user);
        showToast(`Scholarship program ${editingId ? 'updated' : 'created'} successfully.`, 'success');
        return adminScholarshipsPage();
      }
      const catalog = getScholarshipCatalog();
      setScholarshipCatalog(editingId
        ? catalog.map(item => String(item.id) === String(editingId) ? { ...item, ...payload } : item)
        : [...catalog, { ...payload, id: `local-${Date.now()}`, status: 'Open', created_at: new Date().toISOString() }]);
      setEditingScholarship(null);
      showToast(`Scholarship program ${editingId ? 'updated' : 'created'} successfully.`, 'success');
      adminScholarshipsPage();
    });
  });

  document.querySelector('#dashboard-term-filter')?.addEventListener('change', event => {
    setDashboardChartOptions({ term: event.target.value });
    adminDashboard();
  });
  document.querySelector('#application-chart-range')?.addEventListener('change', event => {
    setDashboardChartOptions({ range: event.target.value });
    adminDashboard();
  });
  document.querySelector('[data-toggle-distribution-details]')?.addEventListener('click', () => {
    const details = document.querySelector('#distribution-details');
    if (details) details.hidden = !details.hidden;
  });

  document.querySelector('[data-cancel-scholarship-edit]')?.addEventListener('click', () => {
    setEditingScholarship(null);
    adminScholarshipsPage();
  });

  const filterPrograms = () => {
    const query = document.querySelector('#program-search')?.value.trim().toLowerCase() || '';
    const category = document.querySelector('#program-category-filter')?.value || 'all';
    let visible = 0;
    document.querySelectorAll('.catalog-table-row').forEach(row => {
      const matches = (!query || row.dataset.search.includes(query)) && (category === 'all' || row.dataset.category === category);
      row.hidden = !matches;
      if (matches) visible++;
    });
    const empty = document.querySelector('#program-filter-empty');
    if (empty) empty.hidden = visible > 0 || !document.querySelectorAll('.catalog-table-row').length;
  };
  document.querySelector('#program-search')?.addEventListener('input', filterPrograms);
  document.querySelector('#program-category-filter')?.addEventListener('change', filterPrograms);

  document.querySelectorAll('[data-edit-program]').forEach(button => {
    button.onclick = () => {
      setEditingScholarship(button.dataset.editProgram);
      adminScholarshipsPage();
    };
  });

  document.querySelectorAll('[data-toggle-program]').forEach(button => {
    button.onclick = async () => {
      const id = button.dataset.toggleProgram;
      const program = getScholarshipCatalog().find(item => String(item.id) === String(id));
      if (!program) return;
      const status = program.status === 'Open' ? 'Closed' : 'Open';
      button.disabled = true;
      if (cloudReady()) {
        const { error } = await supabase.from('scholarships').update({ status }).eq('id', Number(id));
        if (error) { button.disabled = false; return showToast(`Could not update program status: ${error.message}`, 'error'); }
        await loadCloudWorkspace(getCurrentUser());
      } else {
        setScholarshipCatalog(getScholarshipCatalog().map(item => String(item.id) === String(id) ? { ...item, status } : item));
      }
      showToast(`Program status changed to ${status}.`, 'info');
      adminScholarshipsPage();
    };
  });

  document.querySelectorAll('[data-delete-program]').forEach(button => {
    button.onclick = () => {
      const id = button.dataset.deleteProgram;
      const program = getScholarshipCatalog().find(item => String(item.id) === String(id));
      if (!program) return;
      openConfirmModal({
        title: 'Delete Scholarship Program',
        message: `Delete "${program.title}"?`,
        details: 'This program will be permanently removed from the catalog. This cannot be undone.',
        confirmText: 'Delete Program',
        type: 'danger',
        onConfirm: async () => {
          button.disabled = true;
          if (cloudReady()) {
            const { error } = await supabase.from('scholarships').delete().eq('id', Number(id));
            if (error) { button.disabled = false; return showToast(`Could not delete program: ${error.message}`, 'error'); }
            await loadCloudWorkspace(getCurrentUser());
          } else {
            setScholarshipCatalog(getScholarshipCatalog().filter(item => String(item.id) !== String(id)));
          }
          showToast(`Program "${program.title}" deleted successfully.`, 'info');
          adminScholarshipsPage();
        }
      });
    };
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
        if (error) return showToast(`Could not save reminder: ${error.message}`, 'error');
        addNotification({
          type: 'deadline',
          title: `Renewal Deadline Announced: ${school}`,
          message: `The official renewal deadline for ${school} has been set to ${formatSchedule(deadline)}. Please prepare your renewal documents.`,
          targetSchool: school,
          priority: 'high'
        });
        await loadCloudWorkspace(user);
        showToast(`Renewal reminder saved for ${school}.`, 'success');
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
    showToast(`Renewal reminder saved for ${school}.`, 'success');
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
        if (error) return showToast(`Could not save schedule: ${error.message}`, 'error');
        addNotification({
          type: 'schedule',
          title: `Renewal Appointment Scheduled: ${school}`,
          message: `Official renewal appointment schedule for ${school} is confirmed for ${formatSchedule(schedule)}.`,
          targetSchool: school,
          priority: 'high'
        });
        await loadCloudWorkspace(user);
        showToast(`Renewal schedule saved for ${school}.`, 'success');
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
    showToast(`Renewal schedule saved for ${school}.`, 'success');
    adminDashboard();
  });

  const toLocalDateTimeValue = value => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const prefillRenewalForm = (kind, school, value) => {
    const schoolField = document.querySelector(kind === 'deadline' ? '#renewal-school' : '#renewal-schedule-school');
    const dateField = document.querySelector(kind === 'deadline' ? '#renewal-deadline' : '#renewal-schedule-date');
    if (!schoolField || !dateField) return;
    schoolField.value = school;
    dateField.value = toLocalDateTimeValue(value);
    dateField.closest('.modern-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    dateField.focus();
  };

  document.querySelectorAll('.edit-renewal-deadline').forEach(button => {
    button.onclick = () => prefillRenewalForm('deadline', button.dataset.school, getRenewalDeadlines()[button.dataset.school]);
  });

  document.querySelectorAll('.edit-renewal-schedule').forEach(button => {
    button.onclick = () => prefillRenewalForm('schedule', button.dataset.school, getRenewalSchedules()[button.dataset.school]);
  });

  document.querySelectorAll('.clear-renewal-deadline').forEach(button => {
    button.onclick = () => {
      const school = button.dataset.school;
      openConfirmModal({
        title: 'Clear Renewal Deadline',
        message: `Clear the renewal deadline for ${school}?`,
        confirmText: 'Clear Deadline',
        type: 'warning',
        onConfirm: async () => {
          const user = getCurrentUser();
          if (cloudReady()) {
            const request = getRenewalSchedules()[school]
              ? supabase.from('renewal_schedules').update({ deadline_at: null }).eq('school_name', school)
              : supabase.from('renewal_schedules').delete().eq('school_name', school);
            const { error } = await request;
            if (error) return showToast(`Could not clear deadline: ${error.message}`, 'error');
            await loadCloudWorkspace(user);
          } else {
            const deadlines = getRenewalDeadlines();
            delete deadlines[school];
            saveRenewalDeadlines(deadlines);
          }
          showToast(`Renewal deadline cleared for ${school}.`, 'info');
          adminDashboard();
        }
      });
    };
  });

  document.querySelectorAll('.clear-renewal-schedule').forEach(button => {
    button.onclick = () => {
      const school = button.dataset.school;
      openConfirmModal({
        title: 'Clear Renewal Schedule',
        message: `Clear the renewal schedule for ${school}?`,
        confirmText: 'Clear Schedule',
        type: 'warning',
        onConfirm: async () => {
          const user = getCurrentUser();
          if (cloudReady()) {
            const request = getRenewalDeadlines()[school]
              ? supabase.from('renewal_schedules').update({ schedule_at: null }).eq('school_name', school)
              : supabase.from('renewal_schedules').delete().eq('school_name', school);
            const { error } = await request;
            if (error) return showToast(`Could not clear schedule: ${error.message}`, 'error');
            await loadCloudWorkspace(user);
          } else {
            const schedules = getRenewalSchedules();
            delete schedules[school];
            saveRenewalSchedules(schedules);
          }
          showToast(`Renewal schedule cleared for ${school}.`, 'info');
          adminDashboard();
        }
      });
    };
  });

  const scheduleFilter = document.querySelector('#renewal-schedule-filter');
  scheduleFilter?.addEventListener('change', () => {
    const now = new Date();
    document.querySelectorAll('.schedule-table-row').forEach(row => {
      const value = row.dataset.scheduleDate;
      const date = value ? new Date(value) : null;
      const isUpcoming = date && !Number.isNaN(date.getTime()) && date >= now;
      const isPast = date && !Number.isNaN(date.getTime()) && date < now;
      row.hidden = scheduleFilter.value === 'upcoming' ? !isUpcoming : scheduleFilter.value === 'past' ? !isPast : false;
    });
  });

  const renewalCycleFilter = document.querySelector('#renewal-schedule-cycle-filter');
  renewalCycleFilter?.addEventListener('change', () => {
    const val = renewalCycleFilter.value;
    document.querySelectorAll('.schedule-table-row').forEach(row => {
      row.hidden = val === 'all' ? false : row.dataset.status !== val;
    });
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
            if (error) showToast(`Could not update scholar record: ${error.message}`, 'error');
            else showToast('Scholar compliance record updated.', 'success');
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
      if (!cloudReady()) {
        showToast('Scholar compliance record updated.', 'success');
      }

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
      const ticketId = select.dataset.ticketId || select.closest('.help-ticket-card')?.dataset.helpTicket;
      const requests = getHelpRequests();
      const request = requests.find(item => String(item.id) === String(ticketId));
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
            if (error) showToast(`Could not update help request: ${error.message}`, 'error');
            else showToast(`Ticket marked as ${select.value}.`, 'info');
          });
      }
      request.status = select.value;
      saveHelpRequests(requests);
      if (!cloudReady()) {
        showToast(`Ticket marked as ${select.value}.`, 'info');
      }
      select.classList.toggle('lacking', select.value === 'Pending');
      select.classList.toggle('complete', select.value === 'Resolved');
    };
  });

  const filterHelpRequests = () => {
    const query = document.querySelector('#help-request-search')?.value.trim().toLowerCase() || '';
    const status = document.querySelector('#help-status-filter')?.value || 'all';
    const category = document.querySelector('#help-category-filter')?.value || 'all';
    let visible = 0;
    document.querySelectorAll('.help-ticket-card').forEach(ticket => {
      const matchesSearch = !query || (ticket.dataset.search || '').includes(query);
      const matchesStatus = status === 'all' || ticket.dataset.status === status;
      const matchesCategory = category === 'all' || ticket.dataset.category === category;
      const matches = matchesSearch && matchesStatus && matchesCategory;
      ticket.hidden = !matches;
      if (matches) visible++;
    });
    const empty = document.querySelector('#help-filter-empty');
    if (empty) empty.hidden = visible > 0;
  };
  document.querySelector('#help-request-search')?.addEventListener('input', filterHelpRequests);
  document.querySelector('#help-status-filter')?.addEventListener('change', filterHelpRequests);
  document.querySelector('#help-category-filter')?.addEventListener('change', filterHelpRequests);

  document.querySelectorAll('[data-help-reply-form]').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const id = form.dataset.helpReplyForm;
      const reply = form.querySelector('.help-reply-input')?.value.trim();
      if (!reply) return showToast('Please write a reply before sending.', 'warning');
      const now = new Date().toISOString();
      const requests = getHelpRequests();
      const request = requests.find(item => String(item.id) === String(id));
      if (!request) return;

      request.thread = Array.isArray(request.thread) && request.thread.length
        ? request.thread
        : [
            ...(request.message ? [{ sender: 'student', senderName: request.userName || 'Student', text: request.message, createdAt: request.createdAt }] : []),
            ...(request.adminReply ? [{ sender: 'admin', senderName: 'Administration', text: request.adminReply, createdAt: request.repliedAt || request.createdAt }] : [])
          ];

      request.thread.push({
        sender: 'admin',
        senderName: 'Scholarship Administration',
        text: reply,
        createdAt: now
      });
      request.adminReply = reply;
      request.repliedAt = now;
      request.status = 'Resolved';

      const btn = form.querySelector('button[type="submit"]');
      if (cloudReady()) {
        await withLoading(btn, async () => {
          const { error } = await supabase.from('help_requests').update({
            admin_reply: reply,
            replied_by: getCurrentUser().id,
            replied_at: now,
            status: 'Resolved',
            resolved_by: getCurrentUser().id,
            resolved_at: now,
            thread: JSON.stringify(request.thread)
          }).eq('id', Number(id));
          if (error) return showToast(`Could not send reply: ${error.message}`, 'error');
          await loadCloudWorkspace(getCurrentUser());
        });
      } else {
        saveHelpRequests(requests);
      }

      // Dispatch in-app notification to student
      addNotification({
        type: 'help',
        title: `Support Ticket Updated: ${request.subject}`,
        message: `Admin reply: "${reply.slice(0, 100)}${reply.length > 100 ? '...' : ''}"`,
        targetEmail: request.userEmail,
        priority: 'normal'
      });

      showToast('Support ticket response sent successfully.', 'success');
      adminHelpRequestsPage();
    });
  });

  document.querySelectorAll('[data-save-internal-note]').forEach(button => {
    button.onclick = async () => {
      const ticketId = button.dataset.saveInternalNote;
      const input = document.querySelector(`#internal-notes-${ticketId}`);
      if (!input) return;
      const notes = input.value.trim();

      const requests = getHelpRequests();
      const ticket = requests.find(r => String(r.id) === String(ticketId));
      if (!ticket) return showToast('Ticket record not found.', 'error');

      ticket.internalNotes = notes;
      saveHelpRequests(requests);

      if (cloudReady()) {
        try {
          await supabase.from('help_requests').update({ internal_notes: notes }).eq('id', ticketId);
        } catch (e) {
          console.warn('Could not sync internal notes to Supabase:', e);
        }
      }

      showToast('Internal evaluation note saved.', 'success');
      adminHelpRequestsPage();
    };
  });

  document.querySelectorAll('[data-archive-help]').forEach(button => {
    button.onclick = () => {
      const id = button.dataset.archiveHelp;
      openConfirmModal({
        title: 'Archive Support Ticket',
        message: 'Archive this resolved inquiry ticket?',
        details: 'The ticket will be moved to the archives and cleared from the active queue.',
        confirmText: 'Archive Ticket',
        type: 'primary',
        iconName: 'archive',
        onConfirm: async () => {
          const now = new Date().toISOString();
          if (cloudReady()) {
            const { error } = await supabase.from('help_requests').update({ archived_at: now }).eq('id', Number(id));
            if (error) return showToast(`Could not archive ticket: ${error.message}`, 'error');
            await loadCloudWorkspace(getCurrentUser());
          } else {
            saveHelpRequests(getHelpRequests().map(item => String(item.id) === String(id) ? { ...item, archivedAt: now } : item));
          }
          showToast('Ticket archived successfully.', 'info');
          navigateTo('help-requests', true);
        }
      });
    };
  });

  document.querySelectorAll('.delete-row').forEach(button => {
    button.onclick = () => {
      const row = button.closest('.student-record-row');
      const email = row.dataset.accountEmail;
      const scholarName = row.children[1]?.textContent.trim() || 'this';
      openConfirmModal({
        title: 'Delete Scholar Record',
        message: `Delete ${scholarName} scholar record?`,
        details: 'This action permanently removes the record from the active roster. This cannot be undone.',
        confirmText: 'Delete Record',
        type: 'danger',
        onConfirm: async () => {
          const account = getAccounts().find(item => item.email === email);
          if (cloudReady() && account?.id) {
            const { error } = await supabase
              .from('profiles')
              .update({ scholar_status: 'Non-active' })
              .eq('id', account.id);
            if (error) return showToast(`Could not deactivate scholar: ${error.message}`, 'error');
            showToast('Cloud scholar accounts are deactivated rather than deleted to preserve audit data.', 'info');
            return navigateTo('overview', true);
          }
          if (email) saveAccounts(getAccounts().filter(account => account.email !== email));
          row.style.opacity = '0';
          setTimeout(() => row.remove(), 160);
          showToast(`Scholar record for ${scholarName} deleted.`, 'info');
        }
      });
    };
  });

  document.querySelector('#login-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    const loginId = document.querySelector('#login-email').value.trim().toLowerCase();
    const password = document.querySelector('#login-password').value;
    const rememberMe = document.querySelector('#login-remember-me')?.checked ?? true;

    const persistSession = userObj => {
      if (rememberMe) {
        localStorage.setItem('scholarHubCurrentUser', JSON.stringify(userObj));
        sessionStorage.removeItem('scholarHubCurrentUser');
      } else {
        sessionStorage.setItem('scholarHubCurrentUser', JSON.stringify(userObj));
        localStorage.removeItem('scholarHubCurrentUser');
      }
    };

    await withLoading(btn, async () => {
      // 1. Try Supabase Auth first if Supabase is connected
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email: loginId, password });
          if (!error && data?.session) {
            const account = await loadCloudSession(rememberMe);
            if (account) return navigateTo('overview', true);
          } else if (error && error.message !== 'Invalid login credentials') {
            if (error.message.includes('confirm')) {
              return showAuthMessage(error.message);
            }
          }
        } catch (err) {
          if (err.message === 'Failed to fetch') {
            console.warn('Supabase connection failed, checking local credentials:', err.message);
          }
        }
      }

      // 2. Fallback: Demo / Offline Admin Credentials
      if (loginId === ADMIN.email.toLowerCase()) {
        const inputHash = await hashPassword(password);
        if (inputHash === ADMIN_PASSWORD_HASH || password === 'admin123') {
          if (supabase) {
            try { await supabase.auth.signOut(); } catch {}
          }
          persistSession(ADMIN);
          return navigateTo('overview', true);
        }
        return showAuthMessage('Incorrect password. Please try again.');
      }

      // 3. Fallback: Local / Demo Student Accounts
      const demoStudent = DEFAULT_DEMO_ACCOUNTS.find(item => item.email.toLowerCase() === loginId);
      const accounts = getAccounts();
      const account = accounts.find(item => item.email.toLowerCase() === loginId) || demoStudent;
      if (account) {
        const inputHash = await hashPassword(password);
        const isLegacyPlaintext = account.password && account.password.length !== 64;
        const isDemoStudent =
          (loginId === 'student@scholarhub.local' || loginId === 'maria@scholarhub.local') &&
          (password === 'student123' || password === 'student');
        const passwordMatches = isDemoStudent || (isLegacyPlaintext ? account.password === password : account.password === inputHash);
        if (!passwordMatches) return showAuthMessage('Incorrect password. Please try again.');

        if (supabase) {
          try { await supabase.auth.signOut(); } catch {}
        }

        if (isLegacyPlaintext) {
          saveAccounts(getAccounts().map(a => (a.email === account.email ? { ...a, password: inputHash } : a)));
        }

        const { password: _pw, ...safeAccount } = account;
        persistSession(safeAccount);
        return navigateTo('overview', true);
      }

      // 4. If neither matches
      return showAuthMessage('Incorrect email or password. Please try again.');
    }, 'Signing in...');
  });

  document.querySelector('#register-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const contact = document.querySelector('#register-contact').value.trim();
    const email = document.querySelector('#register-email').value.trim().toLowerCase();
    const yearLevel = document.querySelector('#year-level').value;
    if (!/^\+?[0-9\s-]{7,20}$/.test(contact)) return showAuthMessage('Please enter a valid contact number.');

    const rawPassword = document.querySelector('#register-password').value;
    const confirmPassword = document.querySelector('#register-confirm-password')?.value;

    if (rawPassword.length < 6) {
      return showAuthMessage('Password must be at least 6 characters long.');
    }
    if (confirmPassword !== undefined && rawPassword !== confirmPassword) {
      return showAuthMessage('Passwords do not match. Please verify both password fields.');
    }

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

  document.querySelector('#forgot-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.querySelector('#forgot-email')?.value.trim().toLowerCase() || '';
    const phone = document.querySelector('#forgot-phone')?.value.trim() || '';
    const password = document.querySelector('#forgot-password')?.value || '';
    const confirmPassword = document.querySelector('#forgot-confirm-password')?.value || '';

    if (!email || !email.includes('@')) {
      return showAuthMessage('Please enter a valid registered email address.');
    }
    if (password.length < 6) {
      return showAuthMessage('New password must be at least 6 characters long.');
    }
    if (password !== confirmPassword) {
      return showAuthMessage('New passwords do not match. Please verify your confirmation.');
    }

    if (supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        if (error) return showAuthMessage(`Password recovery failed: ${error.message}`);
        clearAuthMessage();
        showAuthMessage('A password recovery email has been sent. Please check your inbox.', 'success');
        return authView('login');
      } catch (err) {
        return showAuthMessage(err.message || 'Unable to communicate with authentication server.');
      }
    }

    const accounts = getAccounts();
    const account = accounts.find(a => a.email.toLowerCase() === email);
    if (!account) {
      return showAuthMessage('No registered account was found with this email address.');
    }

    const cleanInputPhone = phone.replace(/\D/g, '');
    const cleanAccountPhone = (account.phone || '').replace(/\D/g, '');
    if (cleanInputPhone && cleanAccountPhone && !cleanAccountPhone.endsWith(cleanInputPhone) && !cleanInputPhone.endsWith(cleanAccountPhone)) {
      return showAuthMessage('The contact number provided does not match the records for this account.');
    }

    const hashed = await hashPassword(password);
    account.password = hashed;
    saveAccounts(accounts.map(a => a.email.toLowerCase() === email ? account : a));
    clearAuthMessage();
    showAuthMessage('Your password has been successfully reset. Please sign in with your new password.', 'success');
    authView('login');
    const loginEmailInput = document.querySelector('#login-email');
    if (loginEmailInput) loginEmailInput.value = email;
  });

  document.querySelector('#forgot-submit-ticket-btn')?.addEventListener('click', () => {
    const email = document.querySelector('#forgot-email')?.value.trim().toLowerCase() || '';
    const phone = document.querySelector('#forgot-phone')?.value.trim() || '';
    if (!email || !email.includes('@')) {
      return showAuthMessage('Please enter your registered student email address above first.');
    }

    const accounts = getAccounts();
    const account = accounts.find(a => a.email.toLowerCase() === email);
    const requests = getHelpRequests();
    const newTicket = {
      id: Date.now(),
      subject: `Urgent: Account Password Recovery (${email})`,
      category: 'Account / Profile Issue',
      message: `Student scholar requires administrative assistance recovering account credentials for ${email}. Provided contact number: ${phone || 'Not specified'}.`,
      status: 'Pending',
      userEmail: email,
      studentName: account?.name || 'Student Scholar',
      createdAt: new Date().toISOString(),
      thread: [
        {
          sender: 'student',
          senderName: account?.name || 'Student Scholar',
          message: `Hello Coordinator, I cannot access my account and need assistance with password recovery for ${email}.`,
          timestamp: new Date().toISOString()
        }
      ]
    };
    saveHelpRequests([newTicket, ...requests]);
    clearAuthMessage();
    showAuthMessage('A password recovery ticket has been submitted to scholarship coordinators. An officer will assist you.', 'success');
    authView('login');
  });

  document.querySelectorAll('.logout').forEach(x => {
    x.onclick = () => {
      openLogoutModal(async () => {
        if (supabase) await supabase.auth.signOut();
        localStorage.removeItem('scholarHubCurrentUser');
        sessionStorage.removeItem('scholarHubCurrentUser');
        setAccountsCache([]);
        clearAuthMessage();
        navigateTo('login', true);
      });
    };
  });
};
