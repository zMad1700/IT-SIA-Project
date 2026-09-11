import { supabase, cloudReady } from './supabase.js';
import { getHelpRequests, saveHelpRequests, addNotification } from './storage.js';
import { broadcastLocalEvent } from './realtime.js';

/**
 * Submit a new support inquiry ticket from a student
 * @param {Object} params
 * @param {string} params.subject
 * @param {string} params.message
 * @param {Object} params.user
 * @returns {Promise<{ success: boolean, ticket: Object }>}
 */
export const submitHelpTicket = async ({ subject, message, user }) => {
  if (!subject || !subject.trim()) throw new Error('Ticket subject is required.');
  if (!message || !message.trim()) throw new Error('Ticket message is required.');
  if (!user || !user.email) throw new Error('User authentication is required to submit a ticket.');

  const createdAt = new Date().toISOString();
  let cloudId = null;

  // 1. Cloud Supabase Insertion
  if (cloudReady() && user.id) {
    const { data, error } = await supabase
      .from('help_requests')
      .insert({
        student_id: user.id,
        subject: subject.trim(),
        message: message.trim(),
        status: 'Pending'
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase help_requests insert error, using local fallback:', error.message);
    } else if (data) {
      cloudId = String(data.id);
    }
  }

  // 2. Local Fallback Persistence
  const requests = getHelpRequests();
  const newTicket = {
    id: cloudId || `ticket-${Date.now()}`,
    studentId: user.id || `local-${user.email}`,
    userEmail: user.email,
    userName: user.name || user.email,
    subject: subject.trim(),
    message: message.trim(),
    status: 'Pending',
    adminReply: null,
    replyAt: null,
    repliedBy: null,
    createdAt
  };

  requests.unshift(newTicket);
  saveHelpRequests(requests);

  // 3. Dispatch System In-App Notification
  addNotification({
    type: 'help',
    title: 'Support Ticket Submitted',
    message: `Your inquiry "${subject.trim()}" has been received. An administrator will review and respond shortly.`,
    targetEmail: user.email,
    priority: 'normal'
  });

  broadcastLocalEvent('HELP_REQUEST_UPDATED', newTicket);

  return { success: true, ticket: newTicket };
};

/**
 * Get all support tickets submitted by a specific student (Ticket History)
 * @param {string} studentEmailOrId
 * @returns {Array<Object>}
 */
export const getStudentHelpTickets = studentEmailOrId => {
  if (!studentEmailOrId) return [];
  const searchKey = String(studentEmailOrId).toLowerCase();
  const allTickets = getHelpRequests();

  return allTickets
    .filter(ticket =>
      (ticket.userEmail && ticket.userEmail.toLowerCase() === searchKey) ||
      (ticket.studentId && String(ticket.studentId).toLowerCase() === searchKey)
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Get all support tickets for administrative review
 * @param {Object} [filter]
 * @param {'all'|'Pending'|'Resolved'} [filter.status='all']
 * @returns {Array<Object>}
 */
export const getAllHelpTickets = ({ status = 'all' } = {}) => {
  const allTickets = getHelpRequests();
  return allTickets
    .filter(ticket => status === 'all' || ticket.status === status)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Administrative action to reply to a student's support inquiry
 * @param {Object} params
 * @param {string} params.ticketId
 * @param {string} params.replyMessage
 * @param {'Pending'|'Resolved'} [params.status='Resolved']
 * @param {Object} params.adminUser
 * @returns {Promise<{ success: boolean, ticket: Object }>}
 */
export const replyHelpTicket = async ({
  ticketId,
  replyMessage,
  status = 'Resolved',
  adminUser
}) => {
  if (!ticketId) throw new Error('Ticket ID is required.');
  if (!replyMessage || !replyMessage.trim()) throw new Error('Reply message cannot be empty.');

  const replyAt = new Date().toISOString();
  const allTickets = getHelpRequests();
  const index = allTickets.findIndex(t => String(t.id) === String(ticketId));

  if (index === -1) throw new Error('Support ticket not found.');
  const targetTicket = allTickets[index];

  // 1. Cloud Supabase Update
  const numericId = Number(ticketId);
  if (cloudReady() && !isNaN(numericId)) {
    const { error } = await supabase
      .from('help_requests')
      .update({
        admin_reply: replyMessage.trim(),
        reply_at: replyAt,
        status,
        replied_by: adminUser?.id || null,
        resolved_at: status === 'Resolved' ? replyAt : null,
        resolved_by: status === 'Resolved' ? (adminUser?.id || null) : null
      })
      .eq('id', numericId);

    if (error) console.warn('Supabase help reply error:', error.message);
  }

  // 2. Local Fallback Update
  allTickets[index] = {
    ...targetTicket,
    adminReply: replyMessage.trim(),
    replyAt,
    status,
    repliedBy: adminUser?.name || 'Administrator',
    resolvedAt: status === 'Resolved' ? replyAt : null
  };
  saveHelpRequests(allTickets);

  // 3. Dispatch High-Priority Notification to Student
  addNotification({
    type: 'help',
    title: `Admin Response: ${targetTicket.subject}`,
    message: `Administrator replied: "${replyMessage.trim()}"`,
    targetEmail: targetTicket.userEmail,
    priority: 'high'
  });

  broadcastLocalEvent('HELP_REQUEST_REPLIED', allTickets[index]);

  return { success: true, ticket: allTickets[index] };
};
