'use client';

import React, { useState } from 'react';
import { useApp } from '../../../lib/context';
import { Layout, Image, FileText, Calendar, Plus, CheckCircle2, ArrowRight, X, Eye } from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  category: string;
  date: string;
  summary: string;
  published: boolean;
}

export default function WebsiteCMSPage() {
  const { currentUser, addAuditLog } = useApp();

  const [articles, setArticles] = useState<NewsArticle[]>([
    {
      id: 'art-01',
      title: 'Annual Qur’an Recitation Competition (Musabaqah 1447 AH) Announced',
      category: 'Musabaqah & Tahfiz',
      date: '2026-08-01',
      summary: 'Markazu Umar in Kano hosts its flagship annual Musabaqah across 10 Juz, 20 Juz, and 30 Juz categories with state dignitaries.',
      published: true,
    },
    {
      id: 'art-02',
      title: 'Admissions Open for 1447/1448 AH Tahfiz & Islamiyya Stream',
      category: 'Admissions',
      date: '2026-07-25',
      summary: 'Entrance applications now available online and at the administrative office for Primary & Secondary Islamiyya.',
      published: true,
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General News');
  const [summary, setSummary] = useState('');
  const [notice, setNotice] = useState('');

  const isAdmin = currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN';

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary) return;

    const newArt: NewsArticle = {
      id: `art-${Date.now()}`,
      title,
      category,
      date: new Date().toISOString().split('T')[0],
      summary,
      published: true,
    };

    setArticles([newArt, ...articles]);

    addAuditLog({
      action: 'WEBSITE_CMS_ARTICLE_PUBLISHED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Published website CMS article: "${title}"`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Article/${newArt.id}`,
      status: 'SUCCESS',
    });

    setNotice(`Article "${title}" published to public portal website!`);
    setTitle('');
    setSummary('');
    setShowAddModal(false);
    setTimeout(() => setNotice(''), 4000);
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-gray-100 selection:bg-emerald-500 selection:text-white">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#042f1e] via-[#064e3b] to-[#0284c7] text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/30">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-1">
            <Layout className="w-4 h-4 text-emerald-400" /> Website Content Management System (CMS)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Website CMS & Public Content</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
            Manage public website news articles, Musabaqah events, photo gallery, admission notices, and homepage content for Markazu Umar.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-105 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Publish News / Event
          </button>
        )}
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((art) => (
          <div
            key={art.id}
            className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 uppercase">
                  {art.category}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{art.date}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{art.title}</h3>
              <p className="text-slate-600 dark:text-emerald-200/80 leading-relaxed">{art.summary}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-emerald-500/20 flex items-center justify-between text-xs">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Published on Public Portal
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Publish Website Article</h3>
                <p className="text-slate-500 dark:text-emerald-300/70">Add new content to public school portal</p>
              </div>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Article Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Musabaqah 1447 Winners Honored"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-semibold focus:outline-none"
                >
                  <option value="General News">General News</option>
                  <option value="Musabaqah & Tahfiz">Musabaqah & Tahfiz</option>
                  <option value="Admissions">Admissions</option>
                  <option value="Academic Calendar">Academic Calendar</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Summary / Article Content</label>
                <textarea
                  required
                  rows={4}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Enter detailed article body text..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all uppercase tracking-wider"
              >
                Publish to Website
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
