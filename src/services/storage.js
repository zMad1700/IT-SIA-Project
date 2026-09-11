// LocalStorage caching and cloud synchronization for operational data

import { supabase } from './supabase.js';

let accountsCache = [];
let scholarshipCatalog = [];
let applicationsCache = [];

const DEFAULT_DEMO_ACCOUNTS = [
  {
    email: 'student@scholarhub.local',
    password: '703b0a3d6ad75b649a28adde7d83c6251da457549263bc7ff45ec709b0a8448b', // SHA-256 for 'student123'
    name: 'Juan Dela Cruz',
    firstName: 'Juan',
    middleName: 'M.',
    lastName: 'Dela Cruz',
    phone: '0917 123 4567',
    sex: 'Male',
    birthDate: '2004-05-15',
    purok: 'Purok 3',
    barangay: 'Zone 1',
    municipality: 'Digos City',
    school: 'Cor Jesu College',
    yearLevel: '3rd Year',
    year: '3rd Year',
    course: 'BS Information Technology',
    scholarType: 'Old scholar',
    requirementsStatus: 'Complete',
    scholarStatus: 'Active',
    role: 'user',
    bio: 'Dedicated IT scholar passionate about web development and cloud technologies.',
    registeredAt: '2026-09-01T08:00:00.000Z'
  },
  {
    email: 'maria@scholarhub.local',
    password: '703b0a3d6ad75b649a28adde7d83c6251da457549263bc7ff45ec709b0a8448b', // SHA-256 for 'student123'
    name: 'Maria Clara Santos',
    firstName: 'Maria Clara',
    middleName: 'R.',
    lastName: 'Santos',
    phone: '0918 987 6543',
    sex: 'Female',
    birthDate: '2005-09-20',
    purok: 'Purok 5',
    barangay: 'San Jose',
    municipality: 'Digos City',
    school: 'UM Digos',
    yearLevel: '1st Year',
    year: '1st Year',
    course: 'BS Computer Science',
    scholarType: 'New scholar',
    requirementsStatus: 'Complete',
    scholarStatus: 'Active',
    role: 'user',
    bio: 'First-year computer science scholar striving for academic excellence.',
    registeredAt: '2026-09-05T10:30:00.000Z'
  }
];

export const getAccounts = () => {
  if (accountsCache.length) return accountsCache;
  try {
    const raw = localStorage.getItem('scholarHubAccounts');
    if (!raw) {
      localStorage.setItem('scholarHubAccounts', JSON.stringify(DEFAULT_DEMO_ACCOUNTS));
      accountsCache = DEFAULT_DEMO_ACCOUNTS;
      return DEFAULT_DEMO_ACCOUNTS;
    }
    const accounts = JSON.parse(raw);
    return Array.isArray(accounts) && accounts.length ? accounts : DEFAULT_DEMO_ACCOUNTS;
  } catch {
    return DEFAULT_DEMO_ACCOUNTS;
  }
};

export const saveAccounts = accounts => {
  accountsCache = accounts;
  localStorage.setItem('scholarHubAccounts', JSON.stringify(accounts));
};

export const setAccountsCache = accounts => {
  accountsCache = accounts;
};

export const getScholarshipCatalog = () => scholarshipCatalog;
export const setScholarshipCatalog = catalog => {
  scholarshipCatalog = catalog;
};

export const getApplicationsCache = () => applicationsCache;
export const setApplicationsCache = cache => {
  applicationsCache = cache;
};

export const getRenewalDeadlines = () => {
  try {
    return JSON.parse(localStorage.getItem('scholarHubRenewalDeadlines') || localStorage.getItem('scholarHubSchoolSchedules') || '{}');
  } catch {
    return {};
  }
};

export const saveRenewalDeadlines = deadlines => {
  localStorage.setItem('scholarHubRenewalDeadlines', JSON.stringify(deadlines));
};

export const getRenewalSchedules = () => {
  try {
    return JSON.parse(localStorage.getItem('scholarHubRenewalSchedules') || '{}');
  } catch {
    return {};
  }
};

export const saveRenewalSchedules = schedules => {
  localStorage.setItem('scholarHubRenewalSchedules', JSON.stringify(schedules));
};

export const getAnnouncements = () => {
  try {
    return JSON.parse(localStorage.getItem('scholarHubAnnouncements') || '[]');
  } catch {
    return [];
  }
};

export const saveAnnouncements = posts => {
  localStorage.setItem('scholarHubAnnouncements', JSON.stringify(posts));
};

export const getHelpRequests = () => {
  try {
    return JSON.parse(localStorage.getItem('scholarHubHelpRequests') || '[]');
  } catch {
    return [];
  }
};

export const saveHelpRequests = requests => {
  localStorage.setItem('scholarHubHelpRequests', JSON.stringify(requests));
};

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'deadline',
    title: 'Renewal Period A.Y. 2026-2027 Ongoing',
    message: 'Official scholarship renewal is now ongoing. Please check your school schedule and prepare your renewal documents.',
    targetSchool: null,
    targetEmail: null,
    readBy: [],
    priority: 'normal',
    createdAt: '2026-09-08T08:00:00.000Z'
  },
  {
    id: 'notif-2',
    type: 'schedule',
    title: 'Cor Jesu College Renewal Schedule Released',
    message: 'Renewal appointments for Cor Jesu College have been posted. Please review the confirmed date and requirements.',
    targetSchool: 'Cor Jesu College',
    targetEmail: null,
    readBy: [],
    priority: 'high',
    createdAt: '2026-09-10T10:00:00.000Z'
  },
  {
    id: 'notif-3',
    type: 'announcement',
    title: 'ScholarHub Portal Updates',
    message: 'Students can now monitor renewal eligibility, submission deadlines, and appointment schedules directly in real time.',
    targetSchool: null,
    targetEmail: null,
    readBy: [],
    priority: 'normal',
    createdAt: '2026-09-11T07:30:00.000Z'
  }
];

export const getNotifications = () => {
  try {
    const raw = localStorage.getItem('scholarHubNotifications');
    if (!raw) {
      localStorage.setItem('scholarHubNotifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_NOTIFICATIONS;
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
};

export const saveNotifications = notifications => {
  localStorage.setItem('scholarHubNotifications', JSON.stringify(notifications));
};

export const getUserNotifications = user => {
  const all = getNotifications();
  if (!user || user.role === 'admin') return all;
  return all.filter(item => {
    const matchesSchool = !item.targetSchool || item.targetSchool === user.school;
    const matchesEmail = !item.targetEmail || item.targetEmail === user.email;
    return matchesSchool && matchesEmail;
  });
};

export const addNotification = ({
  type = 'announcement',
  title,
  message,
  targetSchool = null,
  targetEmail = null,
  priority = 'normal'
}) => {
  const all = getNotifications();
  const newNotif = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    title,
    message,
    targetSchool,
    targetEmail,
    readBy: [],
    priority,
    createdAt: new Date().toISOString()
  };
  const updated = [newNotif, ...all];
  saveNotifications(updated);
  return newNotif;
};

export const markNotificationsAsRead = user => {
  if (!user?.email) return;
  const all = getNotifications();
  const updated = all.map(item => {
    const readBy = Array.isArray(item.readBy) ? item.readBy : [];
    if (!readBy.includes(user.email)) {
      return { ...item, readBy: [...readBy, user.email] };
    }
    return item;
  });
  saveNotifications(updated);
};

export const getUnreadNotificationsCount = user => {
  if (!user?.email) return 0;
  const userNotifs = getUserNotifications(user);
  return userNotifs.filter(item => !Array.isArray(item.readBy) || !item.readBy.includes(user.email)).length;
};

export const loadCloudWorkspace = async account => {
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
        id: String(post.id),
        message: post.message,
        createdAt: post.created_at,
        reactions: {
          like: reactions.filter(item => item.reaction === 'like').map(item => item.user_id),
          heart: reactions.filter(item => item.reaction === 'heart').map(item => item.user_id)
        }
      };
    });
    localStorage.setItem('scholarHubAnnouncements', JSON.stringify(posts));
  }

  if (!schedulesResult.error) {
    const deadlines = {};
    const schedules = {};
    (schedulesResult.data || []).forEach(item => {
      if (item.deadline_at) deadlines[item.school_name] = item.deadline_at;
      if (item.schedule_at) schedules[item.school_name] = item.schedule_at;
    });
    saveRenewalDeadlines(deadlines);
    saveRenewalSchedules(schedules);
  }

  if (!helpResult.error) {
    const requests = (helpResult.data || []).map(item => ({
      id: String(item.id),
      userEmail: item.profiles?.email || '',
      userName: item.profiles?.name || item.profiles?.email || 'Student',
      subject: item.subject,
      message: item.message,
      status: item.status,
      createdAt: item.created_at
    }));
    saveHelpRequests(requests);
  }

  if (!scholarshipsResult.error) scholarshipCatalog = scholarshipsResult.data || [];
  if (!applicationsResult.error) applicationsCache = applicationsResult.data || [];
};
