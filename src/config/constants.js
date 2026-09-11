// Global configuration and constants

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@scholarhub.local';

// Default to SHA-256 of 'admin123' for seamless offline demo access if not explicitly overridden
export const ADMIN_PASSWORD_HASH =
  import.meta.env.VITE_ADMIN_PASSWORD_HASH ||
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

export const ADMIN = {
  email: ADMIN_EMAIL,
  name: 'Administrator',
  role: 'admin'
};

export const schools = [
  'Cor Jesu College',
  'SC Padada',
  'Polytechnic',
  'UM Digos',
  'UM Bansalan',
  'Serapion',
  'SPAC',
  "ST Mary's"
];

export const scholarships = [
  ['Academic Excellence Grant', 'Merit-based', 'Sep 30, 2026', '₱5,000'],
  ['Future Leaders Scholarship', 'Leadership', 'Oct 15, 2026', '₱3,500'],
  ['STEM Innovators Award', 'STEM', 'Nov 01, 2026', '₱4,000']
];
