# ScholarHub Backend API & Service Integration Guide
> **Audience:** Frontend Developers & UI Engineers  
> **Version:** 2.0 (Milestone 1)  
> **Architecture:** Dual-Mode Resilient SDK (Cloud Supabase + LocalStorage Fallback)

This guide documents the ready-to-use backend service modules. All functions automatically handle cloud Supabase database transactions and storage when connected, and gracefully fall back to local persistence during offline testing.

---

## Quick Reference: Service Import Paths

```javascript
// 1. Student Renewal Documents & Verification
import {
  MANDATORY_DOCUMENTS,
  uploadRenewalDocument,
  getStudentRenewalDocuments,
  getAllRenewalSubmissions,
  reviewRenewalDocument,
  deleteRenewalDocument,
  formatFileSize
} from './services/documents.js';

// 2. Support Tickets & Admin Replies (Help Center)
import {
  submitHelpTicket,
  getStudentHelpTickets,
  getAllHelpTickets,
  replyHelpTicket
} from './services/help.js';

// 3. Excel Spreadsheet Imports & Exports
import {
  parseExcelFile,
  importScholarsApi,
  exportScholarsApi,
  downloadExcelTemplate
} from './services/excel.js';

// 4. In-App Notifications & Global State
import {
  getUserNotifications,
  getUnreadNotificationsCount,
  markNotificationsAsRead,
  addNotification
} from './services/storage.js';
```

---

## 1. Renewal Documents API (`src/services/documents.js`)

### Mandatory Document Constants
```javascript
export const MANDATORY_DOCUMENTS = [
  { type: 'COG', label: 'Certificate of Grades (COG)', description: '...' },
  { type: 'COR', label: 'Certificate of Registration (COR)', description: '...' },
  { type: 'Student ID', label: 'Valid Student ID', description: '...' },
  { type: 'Barangay Clearance', label: 'Barangay Indigency / Clearance', description: '...' }
];
```

---

### `uploadRenewalDocument(params)`
Uploads a file (PDF, PNG, JPG) to Supabase Storage and records the submission in `public.renewal_documents`.
* **Parameters:**
  | Argument | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `file` | `File` | Yes | — | The native browser `File` object from an `<input type="file">` or dropzone. |
  | `docType` | `string` | Yes | — | `'COG'` \| `'COR'` \| `'Student ID'` \| `'Barangay Clearance'` |
  | `academicYear` | `string` | No | `'2026-2027'` | Academic year tag. |
  | `semester` | `string` | No | `'1st Semester'` | Semester tag. |
  | `user` | `Object` | Yes | — | The current user object (`getCurrentUser()`). |

* **Frontend Usage Example:**
  ```javascript
  const fileInput = document.querySelector('#cog-file-input');
  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;

    try {
      const result = await uploadRenewalDocument({
        file,
        docType: 'COG',
        user: getCurrentUser()
      });

      alert('COG uploaded successfully!');
      renderRenewalChecklist(); // Re-render your UI
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };
  ```

---

### `getStudentRenewalDocuments(params)`
Fetches the 4 requirement slots for a student, returning current status, uploaded file link, reviewer notes, and timestamps.
* **Parameters:** `{ studentId, studentEmail, academicYear = '2026-2027', semester = '1st Semester' }`
* **Returns:** `Array<Object>` (Exactly 4 items corresponding to COG, COR, ID, and Clearance):
  ```json
  [
    {
      "type": "COG",
      "label": "Certificate of Grades (COG)",
      "isSubmitted": true,
      "status": "Pending", // "Pending" | "Approved" | "Rejected" | "Not Submitted"
      "fileUrl": "https://.../cog.pdf",
      "fileName": "grades_2nd_sem.pdf",
      "fileSize": "1.2 MB",
      "submittedAt": "2026-09-12T00:30:00.000Z",
      "reviewedAt": null,
      "reviewerNotes": null
    },
    ...
  ]
  ```

---

### `getAllRenewalSubmissions(filter)`
*(Admin side)* Fetches all document submissions across all students for batch verification.
* **Parameters:** `{ academicYear = '2026-2027', semester = '1st Semester', status = 'all' }`
* **Returns:** `Array<Object>` with student name, school, course, year level, file url, and review status.

---

### `reviewRenewalDocument(params)`
*(Admin side)* Approves or Rejects a document with feedback remarks. **Automatically triggers status calculation**: if a student has all 4 documents approved, their profile status automatically updates to `Complete`.
* **Parameters:**
  ```typescript
  {
    docId: string | number,
    status: 'Approved' | 'Rejected',
    reviewerNotes?: string,
    reviewerUser: Object
  }
  ```
* **Frontend Usage Example:**
  ```javascript
  // Admin clicking "Approve"
  await reviewRenewalDocument({
    docId: 104,
    status: 'Approved',
    reviewerNotes: 'Valid and clear GWA verified.',
    reviewerUser: getCurrentUser()
  });

  // Admin clicking "Reject"
  await reviewRenewalDocument({
    docId: 105,
    status: 'Rejected',
    reviewerNotes: 'Blurry copy. Please scan with clear student name and seal.',
    reviewerUser: getCurrentUser()
  });
  ```

---

## 2. Help Center & Two-Way Inquiries API (`src/services/help.js`)

### `submitHelpTicket({ subject, message, user })`
Submits an inquiry from a student.
* **Frontend Usage Example:**
  ```javascript
  const res = await submitHelpTicket({
    subject: 'Renewal Deadline Extension Inquiry',
    message: 'Can I submit my COR tomorrow afternoon due to registrar delay?',
    user: getCurrentUser()
  });
  ```

---

### `getStudentHelpTickets(studentEmailOrId)`
*(Student side)* Returns the ticket history of the logged-in student, including previous inquiries, status (`Pending` vs `Resolved`), and **admin reply message**.
* **Returns:** `Array<Object>`:
  ```json
  [
    {
      "id": "14",
      "subject": "Renewal Deadline Extension Inquiry",
      "message": "Can I submit my COR tomorrow afternoon?",
      "status": "Resolved",
      "adminReply": "Yes, we granted an extension until Friday 5:00 PM.",
      "replyAt": "2026-09-12T01:15:00.000Z",
      "repliedBy": "Admin Office",
      "createdAt": "2026-09-12T00:50:00.000Z"
    }
  ]
  ```

---

### `replyHelpTicket({ ticketId, replyMessage, status = 'Resolved', adminUser })`
*(Admin side)* Submits a response to a ticket and automatically notifies the student.
* **Frontend Usage Example:**
  ```javascript
  await replyHelpTicket({
    ticketId: '14',
    replyMessage: 'Your request is approved. Please bring physical copy by Friday.',
    status: 'Resolved',
    adminUser: getCurrentUser()
  });
  ```

---

## 3. In-App Notifications (`src/services/storage.js`)

### `getUserNotifications(user)`
Retrieves targeted notifications for the logged-in user. Filters notifications targeted specifically to their email or their university campus.
* **Returns:** `Array<Notification>`

### `getUnreadNotificationsCount(user)`
Returns the integer count of unread notifications for the red badge in the topbar.

### `markNotificationsAsRead(user)`
Marks all user notifications as read when opening the notification panel.

---

## 4. Database Schema Reference (PostgreSQL / Supabase)

### `public.renewal_documents`
```sql
create table public.renewal_documents (
  id bigint generated by default as identity primary key,
  student_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null check (document_type in ('COG', 'COR', 'Student ID', 'Barangay Clearance')),
  academic_year text not null default '2026-2027',
  semester text not null default '1st Semester' check (semester in ('1st Semester', '2nd Semester', 'Summer')),
  file_url text not null,
  file_name text not null,
  file_size bigint,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewer_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, document_type, academic_year, semester)
);
```

### `public.help_requests` (Enhanced)
```sql
alter table public.help_requests add column admin_reply text;
alter table public.help_requests add column reply_at timestamptz;
alter table public.help_requests add column replied_by uuid references public.profiles(id);
```

---

## 5. Realtime Push & Live Synchronization (`src/services/realtime.js`)

Enables instantaneous updates between Admin and Student without requiring manual browser reload or polling.

### Importing Realtime Service
```javascript
import { initRealtimeSync, stopRealtimeSync, broadcastLocalEvent } from './services/realtime.js';
```

### `initRealtimeSync(currentUser, onUpdateCallback)`
Starts listening to Cloud Supabase WebSockets (`postgres_changes`) or offline browser `BroadcastChannel`. Automatically dispatches in-app notifications and plays a soft notification chime on arrival of approved/rejected documents, support replies, announcements, or renewal deadlines.

* **Parameters:**
  - `currentUser`: The logged-in user object (`getCurrentUser()`).
  - `onUpdateCallback(event)`: *(Optional)* Callback invoked whenever an event occurs, allowing the UI to re-render dynamically.
* **Returns:** `unsubscribe()` function.

### Event Types Received by `onUpdateCallback(event)`:
| `event.type` | Trigger | Data Payload |
| :--- | :--- | :--- |
| `DOCUMENT_STATUS_CHANGED` | Admin Approved or Rejected a document | Updated document record with new `status` and `reviewer_notes` |
| `HELP_REQUEST_REPLIED` | Admin replied to a student's support ticket | Ticket record with `admin_reply` and `status: 'Resolved'` |
| `ANNOUNCEMENT_PUBLISHED` | Admin posted a campus bulletin | New announcement object |
| `SCHEDULE_UPDATED` | Admin changed campus renewal appointment dates | Updated schedule object |

### Frontend Component Integration Example:
```javascript
import { initRealtimeSync } from './services/realtime.js';
import { getCurrentUser } from './services/auth.js';

// Inside your view initialization or dashboard render:
const user = getCurrentUser();
const cleanupRealtime = initRealtimeSync(user, event => {
  console.log('Live update received:', event.type, event.data);

  if (event.type === 'DOCUMENT_STATUS_CHANGED') {
    // Re-render student renewal checklist or table in real time!
    renderRenewalChecklist();
  }

  if (event.type === 'HELP_REQUEST_REPLIED') {
    // Update student ticket history UI in real time!
    renderTicketHistory();
  }
});

// To clean up when switching views or logging out:
// cleanupRealtime();
```

