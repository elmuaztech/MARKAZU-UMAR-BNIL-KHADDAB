'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { PortalTheme } from '@/components/ui/PortalTheme';
import { PortalHeroBanner } from '@/components/ui/PortalHeroBanner';
import { TeacherMessagingCenter } from '@/components/messaging/TeacherMessagingCenter';
import { StudentNotificationCenter } from '@/components/messaging/StudentNotificationCenter';
import { MessageSquare, Bell, Send, Inbox, Sparkles } from 'lucide-react';

export default function MessagesPage() {
  const { currentUser } = useApp();

  const isTeacherOrAdmin =
    currentUser.role === 'TEACHER' ||
    currentUser.role === 'ADMIN' ||
    (currentUser.role as string) === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'MESSAGES' | 'COMPOSE'>(
    isTeacherOrAdmin ? 'COMPOSE' : 'MESSAGES'
  );

  return (
    <PortalTheme>
      <div className="space-y-6 font-poppins">
        <PortalHeroBanner
          title="In-App Communication & Student Notification Center"
          description="Direct teacher-to-student homework, assignment, and notice messaging with dedicated student and parent inbox tracking."
          badgeText="In-App Messaging"
          badgeIcon={MessageSquare}
        />

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-2xl w-fit shadow-sm">
          {isTeacherOrAdmin && (
            <button
              onClick={() => setActiveTab('COMPOSE')}
              className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${
                activeTab === 'COMPOSE'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-600 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-950'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Compose Teacher Message</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('MESSAGES')}
            className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${
              activeTab === 'MESSAGES'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-600 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-950'
            }`}
          >
            <Inbox className="w-4 h-4 text-emerald-400" />
            <span>Notification & Message Inbox</span>
          </button>
        </div>

        {/* Active Tab View */}
        {activeTab === 'COMPOSE' && isTeacherOrAdmin ? (
          <TeacherMessagingCenter />
        ) : (
          <StudentNotificationCenter />
        )}
      </div>
    </PortalTheme>
  );
}
