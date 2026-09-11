// Date, time, and localized text formatting helpers

export const postTime = date =>
  new Date(date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export const registrationDate = date =>
  new Date(date).toLocaleDateString(undefined, { dateStyle: 'long' });

export const formatSchedule = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(date);
};

export const timeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};
