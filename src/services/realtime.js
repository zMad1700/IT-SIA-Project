// Supabase Realtime Push & Live Synchronization Service
// Provides live event dispatching across cloud WebSockets and offline multi-tab BroadcastChannel

import { supabase, cloudReady } from './supabase.js';
import {
  getAccounts,
  saveAccounts,
  getRenewalDocs,
  saveRenewalDocs,
  getHelpRequests,
  saveHelpRequests,
  getAnnouncements,
  saveAnnouncements,
  getRenewalSchedules,
  saveRenewalSchedules,
  addNotification
} from './storage.js';

let activeSupabaseChannel = null;
let broadcastChannel = null;
let windowEventListener = null;
let activeCallback = null;

const BROADCAST_CHANNEL_NAME = 'scholarhub-realtime-sync';

/**
 * Initialize Realtime Push Synchronization for the logged-in user
 * @param {Object} currentUser
 * @param {Function} [onUpdate] - Callback invoked when a live update is received: (event) => void
 * @returns {Function} unsubscribe function
 */
export const initRealtimeSync = (currentUser, onUpdate = null) => {
  stopRealtimeSync();
  activeCallback = onUpdate;

  // 1. Setup Local Multi-Tab BroadcastChannel & Window Event Listener
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    broadcastChannel.onmessage = event => {
      handleIncomingRealtimeEvent(event.data, currentUser);
    };
  }

  windowEventListener = event => {
    handleIncomingRealtimeEvent(event.detail, currentUser);
  };
  window.addEventListener('scholarhub-local-realtime', windowEventListener);

  // 2. Setup Supabase WebSocket Realtime Channel if Cloud Ready
  if (cloudReady() && supabase) {
    try {
      activeSupabaseChannel = supabase
        .channel('scholarhub-cloud-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'renewal_documents' },
          payload => {
            const doc = payload.new || payload.old;
            handleIncomingRealtimeEvent({
              type: 'DOCUMENT_STATUS_CHANGED',
              data: doc,
              eventType: payload.eventType
            }, currentUser);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'help_requests' },
          payload => {
            const ticket = payload.new || payload.old;
            handleIncomingRealtimeEvent({
              type: 'HELP_REQUEST_UPDATED',
              data: ticket,
              eventType: payload.eventType
            }, currentUser);
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'announcements' },
          payload => {
            handleIncomingRealtimeEvent({
              type: 'ANNOUNCEMENT_PUBLISHED',
              data: payload.new,
              eventType: 'INSERT'
            }, currentUser);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'renewal_schedules' },
          payload => {
            handleIncomingRealtimeEvent({
              type: 'SCHEDULE_UPDATED',
              data: payload.new,
              eventType: payload.eventType
            }, currentUser);
          }
        )
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            console.log('ScholarHub Realtime WebSocket connected.');
          }
        });
    } catch (err) {
      console.warn('Supabase Realtime subscription error:', err);
    }
  }

  return () => stopRealtimeSync();
};

/**
 * Handle incoming realtime events from Cloud or Local Broadcast
 * @param {Object} event
 * @param {string} event.type
 * @param {Object} event.data
 * @param {Object} currentUser
 */
const handleIncomingRealtimeEvent = (event, currentUser) => {
  if (!event || !event.type) return;
  const { type, data } = event;

  switch (type) {
    case 'DOCUMENT_STATUS_CHANGED':
    case 'RENEWAL_DOCUMENT_UPDATED': {
      if (!data) break;
      const isStudentTarget = currentUser &&
        ((data.student_id && String(data.student_id) === String(currentUser.id)) ||
         (data.studentEmail && data.studentEmail.toLowerCase() === currentUser.email?.toLowerCase()));

      // Update local storage cache
      const docs = getRenewalDocs();
      const existingIdx = docs.findIndex(d => String(d.id) === String(data.id));
      if (existingIdx !== -1) {
        docs[existingIdx] = { ...docs[existingIdx], ...data };
      } else if (data.document_type) {
        docs.unshift(data);
      }
      saveRenewalDocs(docs);

      // If current user is the student whose doc was reviewed
      if (isStudentTarget && (data.status === 'Approved' || data.status === 'Rejected')) {
        addNotification({
          type: data.status === 'Approved' ? 'verified' : 'warning',
          title: `Document ${data.status}: ${data.document_type}`,
          message: data.reviewer_notes
            ? `Reviewer Remarks: "${data.reviewer_notes}"`
            : `Your ${data.document_type} has been marked as ${data.status}.`,
          targetEmail: currentUser.email,
          priority: data.status === 'Approved' ? 'normal' : 'high'
        });

        // Trigger audio chime if supported
        playNotificationChime();
      }
      break;
    }

    case 'HELP_REQUEST_UPDATED':
    case 'HELP_REQUEST_REPLIED': {
      if (!data) break;
      const isStudentTarget = currentUser &&
        ((data.student_id && String(data.student_id) === String(currentUser.id)) ||
         (data.userEmail && data.userEmail.toLowerCase() === currentUser.email?.toLowerCase()));

      // Update local requests cache
      const requests = getHelpRequests();
      const existingIdx = requests.findIndex(r => String(r.id) === String(data.id));
      if (existingIdx !== -1) {
        requests[existingIdx] = { ...requests[existingIdx], ...data };
      } else {
        requests.unshift(data);
      }
      saveHelpRequests(requests);

      if (isStudentTarget && data.admin_reply) {
        addNotification({
          type: 'help',
          title: `Support Reply: ${data.subject || 'Inquiry'}`,
          message: `Administrator: "${data.admin_reply}"`,
          targetEmail: currentUser.email,
          priority: 'high'
        });
        playNotificationChime();
      }
      break;
    }

    case 'ANNOUNCEMENT_PUBLISHED': {
      if (!data) break;
      const posts = getAnnouncements();
      if (!posts.some(p => String(p.id) === String(data.id))) {
        posts.unshift({
          id: String(data.id),
          message: data.message,
          createdAt: data.created_at || new Date().toISOString(),
          reactions: { like: [], heart: [] }
        });
        saveAnnouncements(posts);
      }

      addNotification({
        type: 'announcement',
        title: 'New Campus Announcement',
        message: data.message ? data.message.slice(0, 120) + (data.message.length > 120 ? '...' : '') : 'A new announcement was posted.',
        priority: 'normal'
      });
      playNotificationChime();
      break;
    }

    case 'SCHEDULE_UPDATED': {
      if (!data || !data.school_name) break;
      const schedules = getRenewalSchedules();
      if (data.schedule_at) {
        schedules[data.school_name] = data.schedule_at;
        saveRenewalSchedules(schedules);
      }

      if (currentUser?.school === data.school_name) {
        addNotification({
          type: 'schedule',
          title: `Renewal Schedule: ${data.school_name}`,
          message: `Renewal appointment schedule has been confirmed for your campus.`,
          targetSchool: data.school_name,
          priority: 'high'
        });
        playNotificationChime();
      }
      break;
    }

    default:
      break;
  }

  // Invoke registered consumer callback (e.g. re-render UI without reload)
  if (typeof activeCallback === 'function') {
    try {
      activeCallback(event);
    } catch (err) {
      console.warn('Realtime consumer callback error:', err);
    }
  }
};

/**
 * Broadcast an event to other open browser tabs/windows (for instant offline multi-tab updates)
 * @param {string} eventType
 * @param {Object} payload
 */
export const broadcastLocalEvent = (eventType, payload) => {
  const eventObj = {
    type: eventType,
    data: payload,
    timestamp: Date.now()
  };

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(eventObj);
    } catch (err) {
      console.warn('BroadcastChannel postMessage error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('scholarhub-local-realtime', { detail: eventObj }));
  }
};

/**
 * Play a subtle soft audio chime when high-priority updates arrive
 */
const playNotificationChime = () => {
  try {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Audio autoplay policy ignored safely
  }
};

/**
 * Disconnect and clean up all active Realtime subscriptions and broadcast listeners
 */
export const stopRealtimeSync = () => {
  if (activeSupabaseChannel) {
    try {
      supabase?.removeChannel?.(activeSupabaseChannel);
    } catch (err) {
      console.warn('Error unsubscribing Supabase channel:', err);
    }
    activeSupabaseChannel = null;
  }

  if (broadcastChannel) {
    try {
      broadcastChannel.close();
    } catch (err) {
      console.warn('Error closing BroadcastChannel:', err);
    }
    broadcastChannel = null;
  }

  if (windowEventListener && typeof window !== 'undefined') {
    window.removeEventListener('scholarhub-local-realtime', windowEventListener);
    windowEventListener = null;
  }

  activeCallback = null;
};
