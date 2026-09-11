// Client-side Excel API Service for importing, parsing, and exporting scholar spreadsheets
import * as XLSX from 'xlsx';
import { supabase, cloudReady } from './supabase.js';
import { getAccounts, saveAccounts, addNotification } from './storage.js';
import { hashPassword } from './auth.js';

export const normalizeYearLevel = val => {
  if (!val) return '1st Year';
  const str = String(val).trim().toUpperCase();
  if (str.startsWith('1') || str.includes('FIRST')) return '1st Year';
  if (str.startsWith('2') || str.includes('SECOND') || str.includes('2ND')) return '2nd Year';
  if (str.startsWith('3') || str.includes('THIRD') || str.includes('3RD')) return '3rd Year';
  if (str.startsWith('4') || str.includes('FOURTH') || str.includes('4TH')) return '4th Year';
  return '1st Year';
};

export const normalizeSchoolName = val => {
  if (!val) return 'Cor Jesu College';
  const str = String(val).trim().toLowerCase();
  if (str.includes('cor jesu') || str.includes('cjc')) return 'Cor Jesu College';
  if (str.includes('padada') || str.includes('sc padada')) return 'SC Padada';
  if (str.includes('polytechnic')) return 'Polytechnic';
  if (str.includes('digos') || str.includes('um digos')) return 'UM Digos';
  if (str.includes('bansalan') || str.includes('um bansalan')) return 'UM Bansalan';
  if (str.includes('serapion')) return 'Serapion';
  if (str.includes('spac')) return 'SPAC';
  if (str.includes('mary') || str.includes("st mary's")) return "ST Mary's";
  return String(val).trim();
};

export const formatPhoneNumber = val => {
  if (!val) return '';
  const clean = String(val).replace(/[^0-9]/g, '');
  if (clean.length === 10 && clean.startsWith('9')) return '0' + clean;
  if (clean.length === 11) return clean;
  return clean;
};

const toTitleCase = str => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Parses an Excel file (.xlsx, .xls, .csv) into structured, validated Scholar records
 * @param {File|ArrayBuffer} fileInput
 * @returns {Promise<{ sheetName: string, totalRows: number, validRows: any[], invalidRows: any[] }>}
 */
export const parseExcelFile = async fileInput => {
  let arrayBuffer;
  if (fileInput instanceof File || fileInput instanceof Blob) {
    arrayBuffer = await fileInput.arrayBuffer();
  } else {
    arrayBuffer = fileInput;
  }

  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rawData || rawData.length < 2) {
    throw new Error('Spreadsheet appears to be empty or missing header rows.');
  }

  const headerRow = (rawData[0] || []).map(h => String(h || '').trim().toLowerCase());

  const findCol = aliases => {
    return headerRow.findIndex(h => aliases.some(alias => h.includes(alias)));
  };

  const idxLast = findCol(['last name', 'lastname', 'surname', 'apelyido']);
  const idxFirst = findCol(['first name', 'firstname', 'given name', 'pangalan']);
  const idxMiddle = findCol(['m.i.', 'middle', 'mi']);
  const idxSex = findCol(['sex', 'gender']);
  const idxStreet = findCol(['street', 'purok', 'address', 'sitio']);
  const idxBrgy = findCol(['brgy', 'barangay']);
  const idxMun = findCol(['mun', 'municipality', 'city', 'lungsod']);
  const idxCourse = findCol(['course', 'degree', 'program']);
  const idxYear = findCol(['year', 'level', 'yr']);
  const idxSchool = findCol(['school', 'college', 'university', 'eskwelahan']);
  const idxPhone = findCol(['cp no.', 'cp', 'contact', 'mobile', 'phone']);
  const idxEmail = findCol(['email', 'email address']);

  const validRows = [];
  const invalidRows = [];

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !row.length) continue;

    const lastNameRaw = String(row[idxLast !== -1 ? idxLast : 1] || '').trim();
    const firstNameRaw = String(row[idxFirst !== -1 ? idxFirst : 2] || '').trim();
    const middleNameRaw = String(row[idxMiddle !== -1 ? idxMiddle : 3] || '').trim();

    if (!lastNameRaw && !firstNameRaw) {
      continue; // Skip empty rows
    }

    const lastName = toTitleCase(lastNameRaw);
    const firstName = toTitleCase(firstNameRaw);
    const middleName = toTitleCase(middleNameRaw);

    const sex = String(row[idxSex !== -1 ? idxSex : 4] || 'Female').trim();
    const purok = toTitleCase(String(row[idxStreet !== -1 ? idxStreet : 5] || '').trim());
    const barangay = toTitleCase(String(row[idxBrgy !== -1 ? idxBrgy : 6] || '').trim());
    const municipality = toTitleCase(String(row[idxMun !== -1 ? idxMun : 7] || '').trim());
    const course = String(row[idxCourse !== -1 ? idxCourse : 8] || 'Not specified').trim();
    const yearLevel = normalizeYearLevel(row[idxYear !== -1 ? idxYear : 9]);
    const school = normalizeSchoolName(row[idxSchool !== -1 ? idxSchool : 10]);
    const phone = formatPhoneNumber(row[idxPhone !== -1 ? idxPhone : 15]);

    const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = idxEmail !== -1 && row[idxEmail]
      ? String(row[idxEmail]).trim()
      : `${cleanFirst}.${cleanLast}.${i}@cjc.scholarhub.local`;

    const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.replace(/\s+/g, ' ').trim();

    const scholarRecord = {
      name: fullName,
      firstName,
      middleName,
      lastName,
      email,
      phone,
      sex: sex.toLowerCase().startsWith('m') ? 'Male' : 'Female',
      purok,
      barangay,
      municipality,
      course,
      yearLevel,
      year: yearLevel,
      school,
      scholarType: 'Old scholar',
      requirementsStatus: 'Complete',
      scholarStatus: 'Active',
      role: 'user',
      registeredAt: new Date().toISOString(),
      addedByAdmin: true,
      rowIndex: i + 1
    };

    if (!lastName || !firstName) {
      invalidRows.push({ ...scholarRecord, error: 'Missing first or last name' });
    } else {
      validRows.push(scholarRecord);
    }
  }

  return {
    sheetName,
    totalRows: validRows.length + invalidRows.length,
    validRows,
    invalidRows
  };
};

/**
 * Commits the parsed scholars to Supabase (if available) and localStorage
 * @param {any[]} scholars
 * @returns {Promise<{ success: boolean, count: number }>}
 */
export const importScholarsApi = async scholars => {
  if (!scholars || !scholars.length) {
    throw new Error('No valid scholar records to import.');
  }

  // 1. Cloud Supabase Sync if active
  if (cloudReady()) {
    const cloudPayload = scholars.map(s => ({
      name: s.name,
      first_name: s.firstName,
      middle_name: s.middleName,
      last_name: s.lastName,
      email: s.email,
      phone: s.phone || null,
      sex: s.sex,
      purok: s.purok || null,
      barangay: s.barangay || null,
      municipality: s.municipality || null,
      school: s.school,
      course: s.course,
      year_level: s.yearLevel,
      scholar_type: s.scholarType,
      requirements_status: s.requirementsStatus,
      scholar_status: s.scholarStatus,
      role: 'user',
      added_by_admin: true
    }));

    const { error } = await supabase
      .from('profiles')
      .upsert(cloudPayload, { onConflict: 'email' });

    if (error) {
      console.warn('Cloud Supabase upsert error:', error.message);
    }
  }

  // 2. Local Storage Persistence
  const defaultPasswordHash = await hashPassword('scholar123');
  const currentAccounts = getAccounts();
  const existingEmails = new Set(currentAccounts.map(a => a.email.toLowerCase()));

  const newRecords = [];
  const updatedAccounts = currentAccounts.map(account => {
    const match = scholars.find(s => s.email.toLowerCase() === account.email.toLowerCase());
    return match ? { ...account, ...match } : account;
  });

  scholars.forEach(scholar => {
    if (!existingEmails.has(scholar.email.toLowerCase())) {
      newRecords.push({
        ...scholar,
        password: scholar.password || defaultPasswordHash
      });
      existingEmails.add(scholar.email.toLowerCase());
    }
  });

  const finalAccounts = [...updatedAccounts, ...newRecords];
  saveAccounts(finalAccounts);

  // 3. Trigger in-app notification
  addNotification({
    type: 'verified',
    title: 'Excel Scholar Import Successful',
    message: `Successfully imported and verified ${scholars.length} scholar records into the official roster.`,
    priority: 'normal'
  });

  return {
    success: true,
    count: scholars.length
  };
};

/**
 * Generates and triggers instant browser download of filtered scholars as .xlsx
 * @param {any[]} accounts
 * @param {string} filename
 */
export const exportScholarsApi = (accounts, filename = 'scholarhub_masterlist.xlsx') => {
  const targetAccounts = accounts && accounts.length
    ? accounts
    : getAccounts().filter(account => account.role === 'user');
  const exportData = targetAccounts.map((account, index) => ({
    'No.': index + 1,
    'Last Name': account.lastName || account.name?.split(' ').at(-1) || '',
    'First Name': account.firstName || account.name?.split(' ')[0] || '',
    'M.I.': account.middleName ? account.middleName[0] + '.' : '',
    'Sex': account.sex || '',
    'School': account.school || '',
    'Course': account.course || '',
    'Year Level': account.yearLevel || account.year || '',
    'Scholar Type': account.scholarType || 'Old scholar',
    'Requirements Status': account.requirementsStatus || 'Complete',
    'Grant Status': account.scholarStatus || 'Active',
    'Email Address': account.email || '',
    'Contact Number': account.phone || '',
    'Barangay': account.barangay || '',
    'Municipality': account.municipality || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 20 },
    { wch: 8 },
    { wch: 10 },
    { wch: 26 },
    { wch: 28 },
    { wch: 14 },
    { wch: 15 },
    { wch: 16 },
    { wch: 14 },
    { wch: 32 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Scholars Masterlist');

  XLSX.writeFile(workbook, filename);
};

/**
 * Creates and downloads a sample blank Excel template with instructions
 */
export const downloadExcelTemplate = () => {
  const sampleRows = [
    {
      'No.': 1,
      'Last Name': 'Dela Cruz',
      'First Name': 'Juan',
      'M.I.': 'M.',
      'Sex': 'Male',
      'Street': 'Purok 3',
      'Brgy.': 'Zone 1',
      'Mun.': 'Digos City',
      'Course': 'BS Information Technology',
      'Year': '2nd',
      'School': 'Cor Jesu College',
      'CP No.': '09171234567',
      'Guardian': 'Maria Dela Cruz'
    },
    {
      'No.': 2,
      'Last Name': 'Santos',
      'First Name': 'Maria Clara',
      'M.I.': 'R.',
      'Sex': 'Female',
      'Street': 'Purok 5',
      'Brgy.': 'San Jose',
      'Mun.': 'Digos City',
      'Course': 'BS Education',
      'Year': '3rd',
      'School': 'Cor Jesu College',
      'CP No.': '09189876543',
      'Guardian': 'Pedro Santos'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 18 },
    { wch: 8 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 26 },
    { wch: 12 },
    { wch: 24 },
    { wch: 16 },
    { wch: 22 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  XLSX.writeFile(workbook, 'scholarhub_import_template.xlsx');
};
