'use client';

import React from 'react';
import { PortalTheme } from '@/components/ui/PortalTheme';
import { PortalHeroBanner } from '@/components/ui/PortalHeroBanner';
import { TahfizTracker } from '@/components/tahfiz/TahfizTracker';
import { TahfizAnalyticsCharts } from '@/components/tahfiz/TahfizAnalyticsCharts';
import { BookOpen, Sparkles, Award } from 'lucide-react';

export default function TahfizPage() {
  return (
    <PortalTheme>
      <div className="space-y-6 font-poppins max-w-full overflow-hidden">
        <PortalHeroBanner
          title="Qur'an Memorization & Tahfiz Command Center"
          titleArabic="مركز متابعة حفظ القرآن الكريم والمراجعة"
          description="Tahfiz Management Engine: Log daily new memorization (Hifz), recent revision (Sabki), and long-term consolidation (Manzil) with automated parent progress updates."
          badgeText="Qur'an Memorization"
          badgeIcon={BookOpen}
        />

        {/* Tahfiz Daily Tracker & Memorization Entry Engine */}
        <TahfizTracker />

        {/* School-wide & Class-wide Tahfiz Analytics & Retention Charts */}
        <TahfizAnalyticsCharts />
      </div>
    </PortalTheme>
  );
}
