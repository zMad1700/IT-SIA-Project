// Data aggregation, chart bucketing, and analytics calculations

import { scholarships } from '../config/constants.js';
import { getAccounts } from '../services/storage.js';
import { accountYearLevel } from '../services/auth.js';

export { accountYearLevel };

export const buildDateBuckets = (items, period, getDate) => {
  const now = new Date();
  const groups = [];
  const dayKey = date => date.toISOString().slice(0, 10);

  if (period === 'daily') {
    for (let offset = 6; offset >= 0; offset--) {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      groups.push({
        key: dayKey(date),
        label: new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric' }).format(date)
      });
    }
  } else if (period === 'yearly') {
    for (let offset = 4; offset >= 0; offset--) {
      const year = now.getFullYear() - offset;
      groups.push({ key: String(year), label: String(year) });
    }
  } else {
    for (let offset = 11; offset >= 0; offset--) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      groups.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date)
      });
    }
  }

  const keyForItem = item => {
    const d = getDate(item);
    if (!d || Number.isNaN(d.getTime())) return '';
    if (period === 'daily') return dayKey(d);
    if (period === 'yearly') return String(d.getFullYear());
    return `${d.getFullYear()}-${String(dateToMonthKey(d))}`;
  };

  function dateToMonthKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  return groups.map(group => ({
    ...group,
    count: items.filter(item => {
      const d = getDate(item);
      if (!d || Number.isNaN(d.getTime())) return false;
      if (period === 'daily') return dayKey(d) === group.key;
      if (period === 'yearly') return String(d.getFullYear()) === group.key;
      return dateToMonthKey(d) === group.key;
    }).length
  }));
};

export const profileCompletion = user => {
  const fields = [user?.name, user?.phone, user?.bio, user?.school, accountYearLevel(user), user?.course];
  return Math.round((fields.filter(value => String(value || '').trim()).length / fields.length) * 100);
};

export const nextScholarshipDeadline = (catalog = scholarships) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = catalog
    .map(([name, , deadline]) => ({ name, date: new Date(deadline) }))
    .filter(item => !Number.isNaN(item.date) && item.date >= today)
    .sort((a, b) => a.date - b.date)[0];
  if (!upcoming) return { name: 'No upcoming deadline', days: 0 };
  return { name: upcoming.name, days: Math.ceil((upcoming.date - today) / 86400000) };
};

export const getScholarsByType = type =>
  getAccounts().filter(account => account.role === 'user' && account.scholarType === type);

export const getTotalScholars = () =>
  getScholarsByType('Old scholar').length + getScholarsByType('New scholar').length;
