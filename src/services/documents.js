import { supabase, cloudReady } from './supabase.js';
import { getAccounts, saveAccounts, getRenewalDocs, saveRenewalDocs, addNotification } from './storage.js';
import { broadcastLocalEvent } from './realtime.js';

export const MANDATORY_DOCUMENTS = [
  { type: 'COG', label: 'Certificate of Grades (COG)', description: 'Official copy of grades or transcript from previous semester' },
  { type: 'COR', label: 'Certificate of Registration (COR)', description: 'Validated enrollment form or registration card for current term' },
  { type: 'Student ID', label: 'Valid Student ID', description: 'Front and back photo/scan of current academic year student ID' },
  { type: 'Barangay Clearance', label: 'Barangay Indigency / Clearance', description: 'Original certificate of residency or indigency from barangay' }
];

/**
 * Converts a browser File object to a Base64 Data URL
 * @param {File} file
 * @returns {Promise<string>}
 */
export const fileToDataUrl = file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Format bytes into human readable format (e.g. 1.5 MB)
 */
export const formatFileSize = bytes => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Upload a renewal document (Supabase Storage or LocalStorage)
 * @param {Object} params
 * @param {File} params.file
 * @param {string} params.docType - 'COG' | 'COR' | 'Student ID' | 'Barangay Clearance'
 * @param {string} [params.academicYear='2026-2027']
 * @param {string} [params.semester='1st Semester']
 * @param {Object} params.user - Current user object
 */
export const uploadRenewalDocument = async ({
  file,
  docType,
  academicYear = '2026-2027',
  semester = '1st Semester',
  user
}) => {
  if (!file) throw new Error('No file provided for upload.');
  if (!docType || !MANDATORY_DOCUMENTS.some(d => d.type === docType)) {
    throw new Error(`Invalid document type: ${docType}. Must be one of: COG, COR, Student ID, Barangay Clearance.`);
  }
  if (!user || !user.email) throw new Error('User authentication required to upload documents.');

  const fileName = file.name;
  const fileSize = file.size;
  const submittedAt = new Date().toISOString();
  let fileUrl = '';
  let cloudDocId = null;

  // 1. Cloud Supabase Storage Upload
  if (cloudReady() && user.id) {
    const cleanDocName = docType.replace(/[^a-zA-Z0-9]/g, '_');
    const storagePath = `${user.id}/${academicYear}_${semester.replace(/\s+/g, '_')}_${cleanDocName}_${Date.now()}_${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('renewal-documents')
      .upload(storagePath, file, { upsert: true });

    if (uploadError) {
      console.warn('Supabase storage upload error, falling back to local storage:', uploadError.message);
    } else {
      const { data: urlData } = supabase.storage
        .from('renewal-documents')
        .getPublicUrl(storagePath);
      fileUrl = urlData?.publicUrl || storagePath;

      const { data: insertData, error: insertError } = await supabase
        .from('renewal_documents')
        .upsert({
          student_id: user.id,
          document_type: docType,
          academic_year: academicYear,
          semester,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          status: 'Pending',
          reviewer_notes: null,
          submitted_at: submittedAt
        }, { onConflict: 'student_id,document_type,academic_year,semester' })
        .select()
        .single();

      if (insertError) {
        console.warn('Supabase renewal_documents table error:', insertError.message);
      } else if (insertData) {
        cloudDocId = insertData.id;
      }
    }
  }

  // 2. Local Fallback & Cache Synchronization
  if (!fileUrl) {
    try {
      fileUrl = await fileToDataUrl(file);
    } catch {
      fileUrl = `blob:${fileName}`;
    }
  }

  const allDocs = getRenewalDocs();
  const existingIndex = allDocs.findIndex(d =>
    (d.student_id === user.id || d.studentEmail === user.email) &&
    d.document_type === docType &&
    d.academic_year === academicYear &&
    d.semester === semester
  );

  const docRecord = {
    id: cloudDocId || (existingIndex !== -1 ? allDocs[existingIndex].id : `doc-${Date.now()}`),
    student_id: user.id || `local-${user.email}`,
    studentEmail: user.email,
    studentName: user.name || user.email,
    document_type: docType,
    academic_year: academicYear,
    semester,
    file_url: fileUrl,
    file_name: fileName,
    file_size: fileSize,
    status: 'Pending',
    reviewer_id: null,
    reviewer_notes: null,
    submitted_at: submittedAt,
    reviewed_at: null
  };

  if (existingIndex !== -1) {
    allDocs[existingIndex] = { ...allDocs[existingIndex], ...docRecord };
  } else {
    allDocs.unshift(docRecord);
  }
  saveRenewalDocs(allDocs);

  // 3. Dispatch System In-App Notification
  addNotification({
    type: 'renewal',
    title: `Document Submitted: ${docType}`,
    message: `Your ${docType} has been submitted and is currently pending administrative review.`,
    targetEmail: user.email,
    priority: 'normal'
  });

  broadcastLocalEvent('RENEWAL_DOCUMENT_UPDATED', docRecord);

  return { success: true, document: docRecord };
};

/**
 * Get all 4 document statuses for a student for the specified term
 * @param {Object} params
 * @param {string} params.studentId
 * @param {string} [params.studentEmail]
 * @param {string} [params.academicYear='2026-2027']
 * @param {string} [params.semester='1st Semester']
 * @returns {Array<Object>}
 */
export const getStudentRenewalDocuments = ({
  studentId,
  studentEmail,
  academicYear = '2026-2027',
  semester = '1st Semester'
}) => {
  const allDocs = getRenewalDocs();
  const userDocs = allDocs.filter(d =>
    ((studentId && d.student_id === studentId) || (studentEmail && d.studentEmail === studentEmail)) &&
    d.academic_year === academicYear &&
    d.semester === semester
  );

  return MANDATORY_DOCUMENTS.map(item => {
    const found = userDocs.find(d => d.document_type === item.type);
    return {
      type: item.type,
      label: item.label,
      description: item.description,
      isSubmitted: Boolean(found),
      id: found?.id || null,
      status: found ? found.status : 'Not Submitted',
      fileUrl: found?.file_url || null,
      fileName: found?.file_name || null,
      fileSize: found?.file_size ? formatFileSize(found.file_size) : null,
      submittedAt: found?.submitted_at || null,
      reviewedAt: found?.reviewed_at || null,
      reviewerNotes: found?.reviewer_notes || null
    };
  });
};

/**
 * Get all renewal submissions for administrative inspection
 * @param {Object} [params]
 * @param {string} [params.academicYear='2026-2027']
 * @param {string} [params.semester='1st Semester']
 * @param {string} [params.status='all']
 * @returns {Array<Object>}
 */
export const getAllRenewalSubmissions = ({
  academicYear = '2026-2027',
  semester = '1st Semester',
  status = 'all'
} = {}) => {
  const allDocs = getRenewalDocs();
  const accounts = getAccounts();
  const accountMap = new Map(accounts.map(a => [a.email.toLowerCase(), a]));

  return allDocs
    .filter(doc => {
      const matchYear = !academicYear || doc.academic_year === academicYear;
      const matchSem = !semester || doc.semester === semester;
      const matchStatus = status === 'all' || doc.status === status;
      return matchYear && matchSem && matchStatus;
    })
    .map(doc => {
      const student = accountMap.get((doc.studentEmail || '').toLowerCase()) || {};
      return {
        ...doc,
        studentName: doc.studentName || student.name || 'Scholar',
        school: student.school || 'Not specified',
        course: student.course || 'Not specified',
        yearLevel: student.yearLevel || student.year || '1st Year'
      };
    });
};

/**
 * Review a submitted renewal document (Approve or Reject with feedback)
 * @param {Object} params
 * @param {string|number} params.docId
 * @param {'Approved'|'Rejected'} params.status
 * @param {string} [params.reviewerNotes='']
 * @param {Object} params.reviewerUser
 */
export const reviewRenewalDocument = async ({
  docId,
  status,
  reviewerNotes = '',
  reviewerUser
}) => {
  if (!docId) throw new Error('Document ID is required for review.');
  if (!['Approved', 'Rejected'].includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be 'Approved' or 'Rejected'.`);
  }

  const reviewedAt = new Date().toISOString();
  const allDocs = getRenewalDocs();
  const index = allDocs.findIndex(d => String(d.id) === String(docId));

  if (index === -1) throw new Error('Document record not found.');
  const targetDoc = allDocs[index];

  // 1. Update document in Cloud Supabase if available
  if (cloudReady() && typeof docId === 'number') {
    const { error } = await supabase
      .from('renewal_documents')
      .update({
        status,
        reviewer_notes: reviewerNotes || null,
        reviewed_at: reviewedAt,
        reviewer_id: reviewerUser?.id || null
      })
      .eq('id', docId);

    if (error) console.warn('Supabase review document error:', error.message);
  }

  // 2. Update Local Document Cache
  allDocs[index] = {
    ...targetDoc,
    status,
    reviewer_notes: reviewerNotes || null,
    reviewed_at: reviewedAt,
    reviewer_id: reviewerUser?.id || 'admin'
  };
  saveRenewalDocs(allDocs);

  // 3. Re-evaluate student's overall requirements status
  const studentEmail = targetDoc.studentEmail;
  const accounts = getAccounts();
  const studentIndex = accounts.findIndex(a => a.email.toLowerCase() === studentEmail.toLowerCase());

  if (studentIndex !== -1) {
    const student = accounts[studentIndex];
    const userAllDocs = allDocs.filter(d =>
      d.studentEmail.toLowerCase() === studentEmail.toLowerCase() &&
      d.academic_year === targetDoc.academic_year &&
      d.semester === targetDoc.semester
    );

    const approvedCount = userAllDocs.filter(d => d.status === 'Approved').length;
    const newRequirementsStatus = approvedCount >= 4 ? 'Complete' : 'Lacking';

    accounts[studentIndex] = {
      ...student,
      requirementsStatus: newRequirementsStatus
    };
    saveAccounts(accounts);

    // Sync cloud profile if active
    if (cloudReady() && student.id) {
      await supabase
        .from('profiles')
        .update({ requirements_status: newRequirementsStatus })
        .eq('id', student.id);
    }
  }

  // 4. Dispatch In-App Notification to Student
  addNotification({
    type: status === 'Approved' ? 'verified' : 'warning',
    title: `Document ${status}: ${targetDoc.document_type}`,
    message: reviewerNotes
      ? `Reviewer Remarks: "${reviewerNotes}"`
      : status === 'Approved'
        ? `Your ${targetDoc.document_type} has been officially verified and approved.`
        : `Your ${targetDoc.document_type} was not approved. Please re-upload a clear copy.`,
    targetEmail: studentEmail,
    priority: status === 'Approved' ? 'normal' : 'high'
  });

  broadcastLocalEvent('RENEWAL_DOCUMENT_UPDATED', allDocs[index]);

  return { success: true, document: allDocs[index] };
};

/**
 * Delete a renewal document (e.g. to re-upload after rejection)
 * @param {Object} params
 * @param {string|number} params.docId
 * @param {Object} params.user
 */
export const deleteRenewalDocument = async ({ docId, user }) => {
  if (!docId) throw new Error('Document ID is required to delete.');

  const allDocs = getRenewalDocs();
  const index = allDocs.findIndex(d => String(d.id) === String(docId));
  if (index === -1) return { success: false, message: 'Document not found.' };

  const targetDoc = allDocs[index];
  if (user?.role !== 'admin' && targetDoc.studentEmail !== user?.email) {
    throw new Error('Unauthorized to delete this document.');
  }

  // Cloud deletion
  if (cloudReady() && typeof docId === 'number') {
    await supabase.from('renewal_documents').delete().eq('id', docId);
  }

  // Local storage purge
  allDocs.splice(index, 1);
  saveRenewalDocs(allDocs);

  return { success: true };
};
