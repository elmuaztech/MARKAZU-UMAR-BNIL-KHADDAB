'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Search,
  Filter,
  Archive,
  Inbox,
  Paperclip,
  Clock,
  Sparkles,
  BookOpen,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { DirectMessage } from '@/types';
import { isNotificationRelevantForUser } from '@/lib/notificationFilter';
import { PushNotificationManager } from '@/lib/pushNotifications';
import { Send, CornerDownLeft, X } from 'lucide-react';

export function StudentNotificationCenter() {
  const { directMessages, inAppNotifications, parents, teachers, students, currentUser, markDirectMessageRead, archiveDirectMessage, sendTeacherDirectMessage } = useApp();

  const [activeTab, setActiveTab] = useState<'MESSAGES' | 'NOTIFICATIONS' | 'ARCHIVED'>('MESSAGES');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Reply Modal State
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyTargetMessage, setReplyTargetMessage] = useState<DirectMessage | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Resolve current student record if logged in as student
  const currentStudentRecord = useMemo(() => {
    if (currentUser.role !== 'STUDENT') return null;
    return (
      students.find(
        (s) =>
          s.userId === currentUser.id ||
          s.id === currentUser.id ||
          (s.admissionNo && currentUser.username && s.admissionNo.toLowerCase() === currentUser.username.toLowerCase())
      ) || null
    );
  }, [students, currentUser]);

  // Request notification permission and alert on new teacher messages
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        PushNotificationManager.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Listen for new unread messages directed to this student and pop immediate notification
  useEffect(() => {
    if (!currentStudentRecord && currentUser.role !== 'PARENT' && currentUser.role !== 'TEACHER') return;

    const unread = directMessages.filter((m) => {
      if (currentUser.role === 'STUDENT') {
        return (m.recipientStudentId === currentStudentRecord?.id || m.recipientStudentId === currentUser.id) && !m.isRead && !m.isArchived;
      }
      return false;
    });

    if (unread.length > 0 && PushNotificationManager.getPermission() === 'granted') {
      const latest = unread[0];
      const seenKey = `markazu_notified_msg_${latest.id}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(seenKey)) {
        sessionStorage.setItem(seenKey, '1');
        PushNotificationManager.showNotification({
          title: `School Notice: ${latest.subject}`,
          body: `${latest.senderName} (${latest.senderRole}): ${latest.content.slice(0, 80)}...`,
          url: '/dashboard/messages',
          tag: `msg-${latest.id}`,
        }).catch(() => {});
      }
    }
  }, [directMessages, currentStudentRecord, currentUser]);

  // Filter messages for current logged in user (student or parent linked ward)
  const userDirectMessages = useMemo(() => {
    return directMessages.filter((msg) => {
      const isForUser =
        currentUser.role === 'ADMIN' ||
        (currentUser.role as string) === 'SUPER_ADMIN' ||
        (currentStudentRecord && msg.recipientStudentId === currentStudentRecord.id) ||
        msg.recipientStudentId === currentUser.id ||
        msg.senderId === currentUser.id;

      const matchesTab = activeTab === 'ARCHIVED' ? msg.isArchived : !msg.isArchived;
      const matchesSearch =
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.senderName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || msg.messageType === categoryFilter;

      return isForUser && matchesTab && matchesSearch && matchesCategory;
    });
  }, [directMessages, currentUser, currentStudentRecord, activeTab, searchTerm, categoryFilter]);

  // Authoritative role-based in-app system notifications for user
  const userNotifications = useMemo(() => {
    return inAppNotifications.filter((n) => {
      const isForUser = isNotificationRelevantForUser(n, currentUser, { parents, teachers, students });
      const matchesTab = activeTab === 'ARCHIVED' ? n.isArchived : !n.isArchived;
      const matchesSearch =
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.body.toLowerCase().includes(searchTerm.toLowerCase());
      return isForUser && matchesTab && matchesSearch;
    });
  }, [inAppNotifications, currentUser, parents, teachers, students, activeTab, searchTerm]);

  const unreadMessagesCount = useMemo(() => {
    return userDirectMessages.filter((m) => !m.isRead && !m.isArchived).length;
  }, [userDirectMessages]);

  const unreadNotificationsCount = useMemo(() => {
    return inAppNotifications.filter(
      (n) => isNotificationRelevantForUser(n, currentUser, { parents, teachers, students }) && !n.read && !n.isArchived
    ).length;
  }, [inAppNotifications, currentUser, parents, teachers, students]);

  return (
    <div className="space-y-6 font-poppins">
      {/* Header Bar */}
      <div className="p-6 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Bell className="w-4 h-4" />
              <span>Student & Parent Dedicated Inbox</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Notification & Communication Center
            </h2>
          </div>

          {/* Unread Counter Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1.5 whitespace-nowrap">
              <Inbox className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{unreadMessagesCount} Unread Teacher Messages</span>
            </div>

            <div className="px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-extrabold text-xs flex items-center gap-1.5 whitespace-nowrap">
              <Bell className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{unreadNotificationsCount} Unread System Alerts</span>
            </div>
          </div>
        </div>

        {/* Tab & Filter Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-emerald-500/20 overflow-hidden w-full">
          <div className="flex flex-wrap items-center gap-2 max-w-full">
            <button
              onClick={() => setActiveTab('MESSAGES')}
              className={`px-3.5 py-2 rounded-2xl font-extrabold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'MESSAGES'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 hover:bg-slate-200'
              }`}
            >
              <Inbox className="w-4 h-4 shrink-0" />
              <span>Teacher Messages ({userDirectMessages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('NOTIFICATIONS')}
              className={`px-3.5 py-2 rounded-2xl font-extrabold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'NOTIFICATIONS'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 hover:bg-slate-200'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span>System Alerts ({userNotifications.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ARCHIVED')}
              className={`px-3.5 py-2 rounded-2xl font-extrabold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'ARCHIVED'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 hover:bg-slate-200'
              }`}
            >
              <Archive className="w-4 h-4 shrink-0" />
              <span>Archived</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-full">
            <div className="relative min-w-[180px] sm:w-56 max-w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search subject or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            {activeTab === 'MESSAGES' && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white shrink-0 max-w-full truncate"
              >
                <option value="ALL">All Categories</option>
                <option value="HOMEWORK">Homework</option>
                <option value="ASSIGNMENT">Assignments</option>
                <option value="EXAMINATION">Exams</option>
                <option value="TAHFIZ_REMINDER">Tahfiz Reminders</option>
                <option value="BEHAVIOUR">Behaviour</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Messages / Notifications List */}
      <div className="space-y-4">
        {activeTab === 'MESSAGES' ? (
          userDirectMessages.length > 0 ? (
            userDirectMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-5 rounded-3xl border transition-all ${
                  !msg.isRead
                    ? 'bg-white dark:bg-[#042419] border-emerald-500 dark:border-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-emerald-950/20 border-slate-200 dark:border-emerald-800/40 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        {msg.subject}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                        {msg.messageType.replace('_', ' ')}
                      </span>
                      {!msg.isRead && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px]">
                          NEW UNREAD
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold text-slate-500 dark:text-emerald-300/80">
                      From: <span className="text-slate-900 dark:text-white font-extrabold">{msg.senderName}</span> ({msg.senderRole}) • Recipient: {msg.studentName}
                    </div>

                    <p className="text-xs text-slate-700 dark:text-emerald-100/90 leading-relaxed pt-1">
                      {msg.content}
                    </p>

                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {msg.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {msg.senderRole === 'TEACHER' && (
                      <button
                        onClick={() => {
                          setReplyTargetMessage(msg);
                          setReplyContent('');
                          setReplyModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-700/20 hover:bg-emerald-600 hover:text-white text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1.5 transition-all"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    )}

                    {!msg.isRead && (
                      <button
                        onClick={() => markDirectMessageRead(msg.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-500 transition-all"
                      >
                        Mark as Read
                      </button>
                    )}

                    <button
                      onClick={() => archiveDirectMessage(msg.id)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-emerald-300 hover:bg-slate-200"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 font-bold text-xs bg-white dark:bg-[#042419] rounded-3xl border border-slate-200 dark:border-emerald-500/20">
              <Inbox className="w-10 h-10 mx-auto text-slate-300 dark:text-emerald-800 mb-2" />
              <div>No teacher messages match your current filter search.</div>
            </div>
          )
        ) : (
          userNotifications.length > 0 ? (
            userNotifications.map((notif) => (
              <div
                key={notif.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {notif.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {notif.createdAt}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-emerald-200">
                  {notif.body}
                </p>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 font-bold text-xs bg-white dark:bg-[#042419] rounded-3xl border border-slate-200 dark:border-emerald-500/20">
              <Bell className="w-10 h-10 mx-auto text-slate-300 dark:text-emerald-800 mb-2" />
              <div>No system alerts recorded in your inbox.</div>
            </div>
          )
        )}
      </div>

      {/* Student Reply Modal */}
      {replyModalOpen && replyTargetMessage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#042419] border border-emerald-500/30 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2">
                <CornerDownLeft className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Reply to Teacher: {replyTargetMessage.senderName}
                </h3>
              </div>
              <button
                onClick={() => setReplyModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 text-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400">Replying to:</span>
              <div className="font-extrabold text-slate-800 dark:text-emerald-200">
                {replyTargetMessage.subject}
              </div>
              <p className="text-slate-500 dark:text-emerald-400/80 line-clamp-2">
                "{replyTargetMessage.content}"
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!replyContent.trim()) return;
                setIsSendingReply(true);
                try {
                  await sendTeacherDirectMessage({
                    senderId: currentUser.id,
                    senderName: currentStudentRecord?.fullName || currentUser.name,
                    senderRole: 'STUDENT',
                    recipientStudentId: replyTargetMessage.recipientStudentId || currentStudentRecord?.id || currentUser.id,
                    studentName: currentStudentRecord?.fullName || currentUser.name,
                    programmeId: replyTargetMessage.programmeId,
                    classId: replyTargetMessage.classId,
                    className: replyTargetMessage.className,
                    messageType: 'STUDENT_REPLY',
                    subject: `Re: ${replyTargetMessage.subject}`,
                    content: replyContent.trim(),
                    attachments: [],
                  });
                  setReplyModalOpen(false);
                  setReplyContent('');
                } catch (err: any) {
                  alert(err.message || 'Failed to submit reply');
                } finally {
                  setIsSendingReply(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
                  Your Reply Message
                </label>
                <textarea
                  rows={4}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your message to your teacher here..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingReply}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingReply ? 'Sending...' : 'Send Reply'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
