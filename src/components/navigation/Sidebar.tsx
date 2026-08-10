'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../../lib/context';
import { ThemeToggle } from './ThemeToggle';
import { hasPageAccess } from '../../lib/rbac';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  UserCheck,
  HeartHandshake,
  School,
  BookMarked,
  CalendarCheck,
  Award,
  Bell,
  BarChart3,
  Settings,
  ShieldCheck,
  Sparkles,
  LogOut,
  MessageSquare,
  Calendar,
  Globe,
  Download,
  Database,
  HardDrive,
  Layers,
  FileSpreadsheet,
  Camera,
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pin,
  PinOff,
  History,
  X,
  User as UserIcon,
  Key,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  group: string;
}

export function Sidebar({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { currentUser, schoolLogo, updateUserAvatar, admissionApplications, directMessages, notify } = useApp();

  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sidebar Pinned & Collapsed State Management with LocalStorage
  const [isPinned, setIsPinned] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Favourites & Recently Visited State
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentVisited, setRecentVisited] = useState<{ label: string; href: string }[]>([]);

  // Search & Accordion Section Collapse State
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Initialize and load saved user preferences
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedPinned = localStorage.getItem('markazu_sidebar_pinned');
      const savedCollapsed = localStorage.getItem('markazu_sidebar_collapsed');
      const savedFavs = localStorage.getItem('markazu_fav_modules');
      const savedRecents = localStorage.getItem('markazu_recent_visited');

      if (savedPinned === 'true') setIsPinned(true);
      if (savedCollapsed === 'true') setIsCollapsed(true);
      if (savedFavs) {
        try {
          setFavorites(JSON.parse(savedFavs));
        } catch {}
      }
      if (savedRecents) {
        try {
          setRecentVisited(JSON.parse(savedRecents));
        } catch {}
      }
    }
  }, []);

  // Handle Keyboard Shortcut (Ctrl+K or Cmd+K) to focus global command search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Track Recently Visited Routes
  useEffect(() => {
    if (!pathname) return;

    const currentModule = allNavItems.find((item) => item.href === pathname);
    if (currentModule) {
      setRecentVisited((prev) => {
        const filtered = prev.filter((r) => r.href !== pathname);
        const updated = [{ label: currentModule.label, href: currentModule.href }, ...filtered].slice(0, 5);
        if (typeof window !== 'undefined') {
          localStorage.setItem('markazu_recent_visited', JSON.stringify(updated));
        }
        return updated;
      });
    }
  }, [pathname]);

  const togglePin = () => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    if (typeof window !== 'undefined') {
      localStorage.setItem('markazu_sidebar_pinned', String(newPinned));
    }
    notify({
      type: 'info',
      title: newPinned ? 'Sidebar Pinned' : 'Sidebar Unpinned',
      message: newPinned ? 'Sidebar layout is pinned.' : 'Sidebar layout unpinned.',
    });
  };

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('markazu_sidebar_collapsed', String(newCollapsed));
    }
  };

  const toggleFavorite = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let updated: string[];
    if (favorites.includes(href)) {
      updated = favorites.filter((h) => h !== href);
    } else {
      updated = [...favorites, href];
    }
    setFavorites(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('markazu_fav_modules', JSON.stringify(updated));
    }
  };

  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_FILE_SIZE) {
      notify({
        type: 'error',
        title: 'File Size Exceeded (Max 5MB)',
        message: `Selected image size is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Maximum allowed size is 5 MB.`,
      });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        updateUserAvatar(result);
        notify({
          type: 'success',
          title: 'Avatar Updated!',
          message: 'Your profile photo has been updated successfully.',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Live Notification Badges Calculation
  const pendingAdmissionsCount = admissionApplications.filter((a) => a.status === 'PENDING_REVIEW').length;
  const unreadMessagesCount = directMessages.filter((m) => !m.isRead).length;

  // Master Navigation Definition grouped into logical sections with simple, short words
  const allNavItems: NavItem[] = [
    // MAIN WORKSPACE
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'MAIN' },
    { id: 'reports', label: currentUser.role === 'HEADMASTER' ? 'Section Reports' : 'Analytics', href: '/dashboard/reports', icon: BarChart3, group: 'MAIN' },

    // ADMISSIONS & ONBOARDING
    {
      id: 'admissions',
      label: 'Admissions',
      href: '/dashboard/admissions',
      icon: Sparkles,
      badge: mounted && pendingAdmissionsCount > 0 ? `${pendingAdmissionsCount}` : undefined,
      group: 'ADMISSIONS',
    },

    // ACADEMICS & CURRICULUM
    {
      id: 'programmes',
      label: currentUser.role === 'TEACHER' ? 'My Programmes' : 'Programmes',
      href: '/dashboard/programmes',
      icon: Layers,
      group: 'ACADEMICS',
    },
    {
      id: 'classes',
      label: currentUser.role === 'HEADMASTER' ? 'Section Classes' : currentUser.role === 'TEACHER' ? 'My Classes' : 'Classes',
      href: '/dashboard/classes',
      icon: School,
      group: 'ACADEMICS',
    },
    {
      id: 'subjects',
      label: currentUser.role === 'HEADMASTER' ? 'Section Subjects' : currentUser.role === 'TEACHER' ? 'My Subjects' : currentUser.role === 'STUDENT' ? 'My Subjects' : 'Subjects',
      href: '/dashboard/subjects',
      icon: BookMarked,
      group: 'ACADEMICS',
    },
    { id: 'attendance', label: 'Attendance', href: '/dashboard/attendance', icon: CalendarCheck, group: 'ACADEMICS' },
    {
      id: 'assessment',
      label: currentUser.role === 'TEACHER' ? 'Grade Entry' : 'Assessments',
      href: '/dashboard/assessment',
      icon: FileSpreadsheet,
      group: 'ACADEMICS',
    },

    // USERS & DIRECTORY
    {
      id: 'students',
      label: currentUser.role === 'HEADMASTER' ? 'Section Students' : currentUser.role === 'TEACHER' ? 'My Students' : currentUser.role === 'PARENT' ? 'My Children' : 'Students',
      href: '/dashboard/students',
      icon: Users,
      group: 'PEOPLE',
    },
    { id: 'teachers', label: currentUser.role === 'HEADMASTER' ? 'Section Teachers' : 'Staff', href: '/dashboard/teachers', icon: UserCheck, group: 'PEOPLE' },
    { id: 'parents', label: 'Parents', href: '/dashboard/parents', icon: HeartHandshake, group: 'PEOPLE' },

    // COMMUNICATION
    { id: 'communication', label: 'Communication Hub', href: '/dashboard/communication', icon: Bell, group: 'COMMUNICATION' },
    {
      id: 'messages',
      label: 'Messages',
      href: '/dashboard/messages',
      icon: MessageSquare,
      badge: mounted && unreadMessagesCount > 0 ? `${unreadMessagesCount}` : undefined,
      group: 'COMMUNICATION',
    },

    // REPORTS & SESSIONS
    {
      id: 'results',
      label: currentUser.role === 'HEADMASTER' ? 'Section Report Cards' : 'Report Cards',
      href: '/dashboard/results',
      icon: Award,
      group: 'REPORTS & SETUP',
    },
    { id: 'sessions', label: 'Academic Terms', href: '/dashboard/sessions', icon: Calendar, group: 'REPORTS & SETUP' },
    { id: 'cms', label: 'Website CMS', href: '/dashboard/cms', icon: Globe, group: 'REPORTS & SETUP' },
    { id: 'downloads', label: 'Downloads', href: '/dashboard/downloads', icon: Download, group: 'REPORTS & SETUP' },

    // SYSTEM & SECURITY
    { id: 'security', label: 'Security & Accounts', href: '/dashboard/security', icon: ShieldCheck, badge: 'Admin', group: 'SETTINGS' },
    { id: 'backup', label: 'Backup Center', href: '/dashboard/backup', icon: Database, badge: 'Admin', group: 'SETTINGS' },
    { id: 'settings', label: 'Settings', href: '/dashboard/settings', icon: Settings, group: 'SETTINGS' },
  ];

  // Role-Based Access Control Filtering
  const authorizedNavItems = allNavItems.filter((item) => hasPageAccess(currentUser.role, item.href));

  // Search Filtering
  const searchFilteredItems = authorizedNavItems.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return item.label.toLowerCase().includes(query) || item.group.toLowerCase().includes(query);
  });

  // Group items by category
  const groups = Array.from(new Set(searchFilteredItems.map((item) => item.group)));
  const favouriteItems = authorizedNavItems.filter((item) => favorites.includes(item.href));

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-50 bg-white dark:bg-[#032015] border-r border-emerald-200 dark:border-emerald-800/40 flex flex-col transition-all duration-300 lg:translate-x-0 selection:bg-emerald-500 selection:text-white shadow-xl lg:shadow-none ${
        isCollapsed ? 'w-20' : 'w-64'
      } ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'}`}
    >
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          {mounted && schoolLogo ? (
            <div className="w-10 h-10 rounded-full bg-white border-2 border-emerald-500/40 p-0.5 flex items-center justify-center shadow-md overflow-hidden shrink-0">
              <img src={schoolLogo} alt="School Logo" className="w-full h-full rounded-full object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-sky-500 flex items-center justify-center text-white shadow-md shrink-0 border-2 border-emerald-400/40 font-black text-xs">
              MU
            </div>
          )}

          {!isCollapsed && (
            <div className="overflow-hidden min-w-0">
              <div className="font-arabic font-bold text-[9px] text-amber-600 dark:text-amber-300 leading-tight">
                مركز عمر بن الخطاب
              </div>
              <h1 className="font-poppins font-black text-xs text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                MARKAZU UMAR
              </h1>
              <p className="font-poppins text-[9px] text-emerald-700 dark:text-emerald-400 font-semibold tracking-tight truncate">
                School Portal
              </p>
            </div>
          )}
        </div>

        {/* Mobile Close Button & Desktop Pin Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen?.(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-emerald-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-900/50 lg:hidden"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={togglePin}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors ${
                isPinned ? 'text-amber-500' : ''
              }`}
              title={isPinned ? 'Unpin Sidebar' : 'Pin Sidebar'}
            >
              {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Global Command Search (Ctrl + K) */}
      {!isCollapsed && (
        <div className="p-3 border-b border-slate-100 dark:border-emerald-900/40 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-emerald-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search modules (Ctrl+K)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-[11px] rounded-xl bg-slate-100 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 transition-colors"
            />
            {searchQuery ? (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="absolute right-2.5 top-2 text-[9px] font-mono text-slate-400 dark:text-emerald-500 border border-slate-300 dark:border-emerald-800 rounded px-1">
                ⌘K
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation Body */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Pinned Favourites Section */}
        {favouriteItems.length > 0 && !searchQuery && (
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 font-poppins text-[9px] font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>FAVOURITES</span>
              </div>
            )}
            {favouriteItems.map((item) => renderNavItem(item))}
          </div>
        )}

        {/* Recently Visited Section */}
        {recentVisited.length > 0 && !isCollapsed && !searchQuery && (
          <div className="space-y-1 border-b border-slate-100 dark:border-emerald-900/40 pb-2">
            <div className="px-2 font-poppins text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-emerald-500 flex items-center gap-1.5">
              <History className="w-3 h-3 text-slate-400" />
              <span>RECENTLY VISITED</span>
            </div>
            {recentVisited.map((r) => {
              const matched = authorizedNavItems.find((n) => n.href === r.href);
              if (!matched) return null;
              return (
                <Link
                  key={`recent-${r.href}`}
                  href={r.href}
                  onClick={() => setMobileOpen?.(false)}
                  className="block px-3 py-1 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 truncate"
                >
                  • {r.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Grouped Categorized Navigation */}
        {groups.map((groupName) => {
          const groupItems = searchFilteredItems.filter((i) => i.group === groupName);
          const isGroupCollapsed = collapsedGroups[groupName];

          return (
            <div key={groupName} className="space-y-1">
              {!isCollapsed && (
                <button
                  onClick={() => toggleGroupCollapse(groupName)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 hover:text-amber-400 transition-colors"
                >
                  <span>{groupName}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isGroupCollapsed ? '-rotate-90' : ''}`} />
                </button>
              )}

              {!isGroupCollapsed && groupItems.map((item) => renderNavItem(item))}
            </div>
          );
        })}
      </div>

      {/* User Profile Card & Quick Actions Footer */}
      <div className="p-3 border-t border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-[#021810] space-y-2 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center justify-between px-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              Theme Mode
            </span>
            <ThemeToggle variant="icon-only" />
          </div>
        )}

        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleAvatarUpload} className="hidden" />

        <div className="relative">
          <div
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/30 shadow-sm cursor-pointer hover:border-emerald-400 transition-all"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="relative shrink-0">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border-2 border-emerald-400/50 object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </div>

              {!isCollapsed && (
                <div className="overflow-hidden min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-emerald-100 truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">{currentUser.role}</p>
                </div>
              )}
            </div>

            {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </div>

          {/* Quick Profile Menu Popover */}
          {profileMenuOpen && !isCollapsed && (
            <div className="absolute bottom-14 left-0 right-0 p-2 rounded-2xl bg-white dark:bg-[#042419] border border-emerald-500/40 shadow-xl space-y-1 text-xs z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setProfileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 font-semibold"
              >
                <Camera className="w-4 h-4 text-emerald-500" />
                <span>Upload Profile Photo</span>
              </button>

              <Link
                href="/dashboard/settings"
                onClick={() => setProfileMenuOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 font-semibold"
              >
                <UserIcon className="w-4 h-4 text-sky-500" />
                <span>My Profile</span>
              </Link>

              <Link
                href="/login"
                onClick={() => setProfileMenuOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold border-t border-slate-100 dark:border-emerald-800/40 pt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  );

  // Helper to render navigation links
  function renderNavItem(item: NavItem) {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    const isFav = favorites.includes(item.href);

    return (
      <div key={item.href} className="relative group">
        <Link
          href={item.href}
          onClick={() => setMobileOpen?.(false)}
          className={`relative flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs transition-all duration-200 ${
            isActive
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold shadow-md shadow-emerald-900/30 border border-emerald-400/30'
              : 'text-slate-800 dark:text-emerald-100 font-semibold hover:bg-emerald-100/80 dark:hover:bg-emerald-800/40 hover:text-emerald-950 dark:hover:text-white'
          }`}
          title={isCollapsed ? item.label : undefined}
        >
          {/* Active Accent Bar */}
          {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-amber-400 rounded-r-full" />}

          <div className="flex items-center gap-3 overflow-hidden">
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`} />
            {!isCollapsed && <span className="font-poppins truncate">{item.label}</span>}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1.5 shrink-0">
              {item.badge && (
                <span
                  suppressHydrationWarning
                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    item.badge === 'Core'
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/25 dark:text-amber-300 border border-amber-400/40'
                      : item.badge === 'Online'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-sky-100 text-sky-900 dark:bg-sky-500/25 dark:text-sky-300 border border-sky-400/40'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              <button
                onClick={(e) => toggleFavorite(item.href, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-amber-400 transition-opacity"
                title={isFav ? 'Remove from Favourites' : 'Add to Favourites'}
              >
                <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400 opacity-100' : ''}`} />
              </button>
            </div>
          )}
        </Link>

        {/* Collapsed Tooltip */}
        {isCollapsed && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap border border-emerald-500/30">
            {item.label}
          </div>
        )}
      </div>
    );
  }
}
