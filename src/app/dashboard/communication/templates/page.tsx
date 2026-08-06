'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import {
  Layout,
  Plus,
  Copy,
  Edit,
  Trash2,
  ArrowLeft,
  Sparkles,
  Search,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { MessageTemplate } from '@/types/communication';

export default function MessageTemplatesPage() {
  const { messageTemplates, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<any>('ANNOUNCEMENT');
  const [formSubject, setFormSubject] = useState('');
  const [formContent, setFormContent] = useState('');

  const filteredTemplates = messageTemplates.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormTitle('');
    setFormCategory('ANNOUNCEMENT');
    setFormSubject('');
    setFormContent('');
    setShowModal(true);
  };

  const handleOpenEdit = (t: MessageTemplate) => {
    setEditingId(t.id);
    setFormTitle(t.title);
    setFormCategory(t.category);
    setFormSubject(t.subject);
    setFormContent(t.content);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formTitle || !formSubject || !formContent) return;
    if (editingId) {
      updateTemplate(editingId, {
        title: formTitle,
        category: formCategory,
        subject: formSubject,
        content: formContent,
      });
    } else {
      createTemplate({
        title: formTitle,
        category: formCategory,
        subject: formSubject,
        content: formContent,
        defaultChannels: ['EMAIL', 'WHATSAPP', 'IN_APP', 'DASHBOARD'],
      });
    }
    setShowModal(false);
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 font-poppins">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/communication"
            className="p-2.5 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Message Templates Manager</h1>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70">Create, edit, duplicate, and insert pre-written communication templates</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Template</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTemplates.map((t) => (
          <div
            key={t.id}
            className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                  {t.category.replace('_', ' ')}
                </span>
                {t.isDefault && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-black text-[9px]">
                    SYSTEM DEFAULT
                  </span>
                )}
              </div>

              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{t.title}</h3>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Subject: {t.subject}</p>
              <p className="text-xs text-slate-600 dark:text-emerald-100/80 line-clamp-3 leading-relaxed whitespace-pre-line">{t.content}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-emerald-500/20 flex items-center justify-between">
              <button
                onClick={() => duplicateTemplate(t.id)}
                className="text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>

              <div className="flex items-center gap-2">
                <button onClick={() => handleOpenEdit(t)} className="p-2 rounded-xl bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300">
                  <Edit className="w-4 h-4" />
                </button>
                {!t.isDefault && (
                  <button onClick={() => deleteTemplate(t.id)} className="p-2 rounded-xl bg-rose-500/15 text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 shadow-2xl space-y-4 font-poppins">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{editingId ? 'Edit Template' : 'Create New Template'}</h2>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="text-[10px] text-slate-500 uppercase">Template Title:</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase">Subject:</label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase">Content:</label>
                <textarea
                  rows={6}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-emerald-300 font-bold text-xs">
                Cancel
              </button>
              <button onClick={handleSave} className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs">
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
