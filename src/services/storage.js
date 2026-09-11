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

const DEFAULT_DEMO_APPLICATIONS = [
  {
    id: 'app-demo-1',
    scholarship_id: 1,
    student_id: 'student@scholarhub.local',
    student_email: 'student@scholarhub.local',
    student_name: 'Juan Dela Cruz',
    school: 'Cor Jesu College',
    course: 'BS Information Technology',
    year_level: '3rd Year',
    gwa: '1.45',
    household_income: 'PHP 150,000 - PHP 250,000',
    statement: 'Committed to finishing my IT degree and leading community digital literacy initiatives.',
    document_url: 'grades-cog-certified.pdf',
    status: 'Submitted',
    remarks: 'Application submitted and currently under evaluation by the scholarship committee.',
    created_at: '2026-09-08T09:00:00.000Z'
  }
];

export const getApplicationsCache = () => {
  if (applicationsCache.length) return applicationsCache;
  try {
    const raw = localStorage.getItem('scholarHubApplications');
    if (!raw) {
      localStorage.setItem('scholarHubApplications', JSON.stringify(DEFAULT_DEMO_APPLICATIONS));
      applicationsCache = DEFAULT_DEMO_APPLICATIONS;
      return DEFAULT_DEMO_APPLICATIONS;
    }
    const apps = JSON.parse(raw);
    applicationsCache = Array.isArray(apps) && apps.length ? apps : DEFAULT_DEMO_APPLICATIONS;
    return applicationsCache;
  } catch {
    return DEFAULT_DEMO_APPLICATIONS;
  }
};

export const setApplicationsCache = cache => {
  applicationsCache = cache;
};

export const saveApplicationsCache = applications => {
  applicationsCache = applications;
  localStorage.setItem('scholarHubApplications', JSON.stringify(applications));
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

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 'ann-demo-1',
    category: 'Renewal Deadline',
    targetSchool: null,
    message: 'Official renewal period for Academic Year 2026-2027 is now open. All scholars must submit verification documents before October 15, 2026.',
    pinned: true,
    createdAt: '2026-09-10T08:00:00.000Z',
    reactions: { like: ['student@scholarhub.local'], heart: [] }
  },
  {
    id: 'ann-demo-2',
    category: 'Document Verification',
    targetSchool: null,
    message: 'Partner university coordinators will conduct on-campus document verification according to the confirmed appointment schedule.',
    pinned: false,
    createdAt: '2026-09-11T09:30:00.000Z',
    reactions: { like: [], heart: ['student@scholarhub.local'] }
  },
  {
    id: 'ann-demo-3',
    category: 'Disbursement Notice',
    targetSchool: null,
    message: 'Stipend disbursement for the first semester is scheduled to be released through authorized partner banks on September 30, 2026.',
    pinned: false,
    createdAt: '2026-09-11T14:00:00.000Z',
    reactions: { like: [], heart: [] }
  }
];

export const getAnnouncements = () => {
  try {
    const raw = localStorage.getItem('scholarHubAnnouncements');
    if (!raw) {
      localStorage.setItem('scholarHubAnnouncements', JSON.stringify(DEFAULT_ANNOUNCEMENTS));
      return DEFAULT_ANNOUNCEMENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_ANNOUNCEMENTS;
  } catch {
    return DEFAULT_ANNOUNCEMENTS;
  }
};

export const saveAnnouncements = posts => {
  localStorage.setItem('scholarHubAnnouncements', JSON.stringify(posts));
};

const DEFAULT_HELP_REQUESTS = [
  {
    id: 'help-demo-1',
    userEmail: 'student@scholarhub.local',
    userName: 'Juan Dela Cruz',
    category: 'Document Verification',
    subject: 'Clarification regarding Certificate of Grades (COG) format',
    message: 'Good day, our university registrar provides e-signed digital copies of the Certificate of Grades. Will this be accepted for the renewal document submission or is an ink-signed wet stamp strictly required?',
    status: 'Resolved',
    createdAt: '2026-09-09T10:15:00.000Z',
    adminReply: 'Official e-signed COGs with a verifiable university digital QR seal or registrar watermark are fully accepted. Please ensure the total units and semester GPA are clearly legible.',
    repliedAt: '2026-09-09T14:30:00.000Z',
    thread: [
      {
        sender: 'student',
        senderName: 'Juan Dela Cruz',
        text: 'Good day, our university registrar provides e-signed digital copies of the Certificate of Grades. Will this be accepted for the renewal document submission or is an ink-signed wet stamp strictly required?',
        createdAt: '2026-09-09T10:15:00.000Z'
      },
      {
        sender: 'admin',
        senderName: 'Scholarship Office',
        text: 'Official e-signed COGs with a verifiable university digital QR seal or registrar watermark are fully accepted. Please ensure the total units and semester GPA are clearly legible.',
        createdAt: '2026-09-09T14:30:00.000Z'
      }
    ]
  },
  {
    id: 'help-demo-2',
    userEmail: 'student@scholarhub.local',
    userName: 'Juan Dela Cruz',
    category: 'Disbursement Concern',
    subject: 'Inquiry regarding 1st Semester stipend disbursement schedule',
    message: 'Hello, may I inquire when the initial stipend release for approved scholars under the Tertiary Education Grant will take place?',
    status: 'Pending',
    createdAt: '2026-09-11T11:00:00.000Z',
    adminReply: null,
    repliedAt: null,
    thread: [
      {
        sender: 'student',
        senderName: 'Juan Dela Cruz',
        text: 'Hello, may I inquire when the initial stipend release for approved scholars under the Tertiary Education Grant will take place?',
        createdAt: '2026-09-11T11:00:00.000Z'
      }
    ]
  }
];

export const getHelpRequests = () => {
  try {
    const raw = localStorage.getItem('scholarHubHelpRequests');
    if (!raw) {
      localStorage.setItem('scholarHubHelpRequests', JSON.stringify(DEFAULT_HELP_REQUESTS));
      return DEFAULT_HELP_REQUESTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_HELP_REQUESTS;
  } catch {
    return DEFAULT_HELP_REQUESTS;
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

export const markNotificationAsRead = (notifId, user) => {
  if (!user?.email || !notifId) return;
  const all = getNotifications();
  const updated = all.map(item => {
    if (String(item.id) === String(notifId)) {
      const readBy = Array.isArray(item.readBy) ? item.readBy : [];
      if (!readBy.includes(user.email)) {
        return { ...item, readBy: [...readBy, user.email] };
      }
    }
    return item;
  });
  saveNotifications(updated);
};

export const toggleNotificationRead = (notifId, user) => {
  if (!user?.email || !notifId) return;
  const all = getNotifications();
  const updated = all.map(item => {
    if (String(item.id) === String(notifId)) {
      const readBy = Array.isArray(item.readBy) ? item.readBy : [];
      if (readBy.includes(user.email)) {
        return { ...item, readBy: readBy.filter(e => e !== user.email) };
      } else {
        return { ...item, readBy: [...readBy, user.email] };
      }
    }
    return item;
  });
  saveNotifications(updated);
};

export const deleteNotification = notifId => {
  if (!notifId) return;
  const all = getNotifications();
  const updated = all.filter(item => String(item.id) !== String(notifId));
  saveNotifications(updated);
};

export const clearReadNotifications = user => {
  if (!user?.email) return;
  const all = getNotifications();
  const updated = all.filter(item => !Array.isArray(item.readBy) || !item.readBy.includes(user.email));
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
    const requests = (helpResult.data || []).map(item => {
      let thread = [];
      try {
        thread = Array.isArray(item.thread) ? item.thread : (item.thread ? JSON.parse(item.thread) : []);
      } catch {
        thread = [];
      }
      if (!thread.length) {
        if (item.message) {
          thread.push({
            sender: 'student',
            senderName: item.profiles?.name || item.profiles?.email || 'Student',
            text: item.message,
            createdAt: item.created_at
          });
        }
        if (item.admin_reply) {
          thread.push({
            sender: 'admin',
            senderName: 'Scholarship Office',
            text: item.admin_reply,
            createdAt: item.replied_at || item.created_at
          });
        }
      }
      return {
        id: String(item.id),
        userEmail: item.profiles?.email || '',
        userName: item.profiles?.name || item.profiles?.email || 'Student',
        category: item.category || 'General Concern',
        subject: item.subject,
        message: item.message,
        status: item.status,
        createdAt: item.created_at,
        adminReply: item.admin_reply,
        repliedAt: item.replied_at,
        archivedAt: item.archived_at,
        thread
      };
    });
    saveHelpRequests(requests);
  }

  if (!scholarshipsResult.error) scholarshipCatalog = scholarshipsResult.data || [];
  if (!applicationsResult.error) applicationsCache = applicationsResult.data || [];
};
