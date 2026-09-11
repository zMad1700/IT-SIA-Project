// Authentication, user profile mapping, and session state management

import { ADMIN } from '../config/constants.js';
import { supabase } from './supabase.js';
import { getAccounts, saveAccounts, setAccountsCache } from './storage.js';

export const hashPassword = async password => {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const accountYearLevel = account =>
  account?.yearLevel || account?.year || account?.year_level || account?.yearlevel || '';

export const profileFields = account => ({
  id: account.id,
  email: account.email,
  name: account.name,
  first_name: account.firstName,
  middle_name: account.middleName,
  last_name: account.lastName,
  phone: account.phone,
  sex: account.sex,
  birth_date: account.birthDate,
  purok: account.purok,
  barangay: account.barangay,
  municipality: account.municipality,
  school: account.school,
  year_level: accountYearLevel(account),
  course: account.course,
  scholar_type: account.scholarType,
  role: account.role,
  photo: account.photo,
  bio: account.bio,
  requirements_status: account.requirementsStatus,
  scholar_status: account.scholarStatus,
  added_by_admin: account.addedByAdmin
});

export const accountFromProfile = profile => ({
  id: profile.id,
  email: profile.email,
  name: profile.name,
  firstName: profile.first_name,
  middleName: profile.middle_name,
  lastName: profile.last_name,
  phone: profile.phone,
  sex: profile.sex,
  birthDate: profile.birth_date,
  purok: profile.purok,
  barangay: profile.barangay,
  municipality: profile.municipality,
  school: profile.school,
  yearLevel: profile.year_level,
  year: profile.year_level,
  course: profile.course,
  scholarType: profile.scholar_type,
  role: profile.role,
  photo: profile.photo,
  bio: profile.bio,
  requirementsStatus: profile.requirements_status,
  scholarStatus: profile.scholar_status,
  addedByAdmin: profile.added_by_admin,
  registeredAt: profile.created_at
});

export const evaluatePasswordStrength = password => {
  if (!password) return { score: 0, label: '', percent: 0, class: '' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return { score, label: 'Weak', percent: 33, class: 'weak' };
  } else if (score <= 4) {
    return { score, label: 'Medium', percent: 66, class: 'medium' };
  } else {
    return { score, label: 'Strong', percent: 100, class: 'strong' };
  }
};

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('scholarHubCurrentUser') || sessionStorage.getItem('scholarHubCurrentUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const isAdminSession = () => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

export const updateCurrentUser = changes => {
  const previousUser = getCurrentUser();
  const user = { ...previousUser, ...changes };
  if (sessionStorage.getItem('scholarHubCurrentUser')) {
    sessionStorage.setItem('scholarHubCurrentUser', JSON.stringify(user));
  } else {
    localStorage.setItem('scholarHubCurrentUser', JSON.stringify(user));
  }
  if (user.email !== ADMIN.email) {
    saveAccounts(getAccounts().map(account => (account.email === previousUser?.email ? { ...account, ...changes } : account)));
  }
  if (supabase && user.id) {
    supabase.from('profiles').update(profileFields(user)).eq('id', user.id).then(({ error }) => {
      if (error) console.error('Could not sync profile:', error.message);
    });
  }
  return user;
};

export const loadCloudSession = async (remember = true) => {
  if (!supabase) return getCurrentUser();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
  if (error || !profile) return null;
  const account = accountFromProfile(profile);
  if (remember) {
    localStorage.setItem('scholarHubCurrentUser', JSON.stringify(account));
    sessionStorage.removeItem('scholarHubCurrentUser');
  } else {
    sessionStorage.setItem('scholarHubCurrentUser', JSON.stringify(account));
    localStorage.removeItem('scholarHubCurrentUser');
  }
  if (account.role === 'admin') {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const accounts = (profiles || []).map(accountFromProfile);
    setAccountsCache(accounts);
    localStorage.setItem('scholarHubAccounts', JSON.stringify(accounts));
  } else {
    setAccountsCache([account]);
  }
  return account;
};
