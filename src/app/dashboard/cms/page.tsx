'use client';

import React, { useState } from 'react';
import { useApp } from '../../../lib/context';
import { NewsArticle, GalleryItem } from '../../../types';
import {
  Layout,
  Image as ImageIcon,
  FileText,
  Calendar,
  Plus,
  CheckCircle2,
  X,
  Eye,
  Trash2,
  Edit,
  Upload,
  Sparkles,
  Filter,
  ShieldCheck,
} from 'lucide-react';

export default function WebsiteCMSPage() {
  const {
    currentUser,
    newsArticles,
    addNewsArticle,
    updateNewsArticle,
    deleteNewsArticle,
    galleryItems,
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    addAuditLog,
    notify,
    showConfirm,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'news' | 'gallery'>('news');
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState<string>('All');
  const [notice, setNotice] = useState<string>('');

  // Add News Modal State
  const [showAddNewsModal, setShowAddNewsModal] = useState(false);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState('Musabaqah & Tahfiz');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsImage, setNewsImage] = useState('/gallery/huffazu-abi-bakr.jpg');

  // Edit News Modal State
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [editNewsTitle, setEditNewsTitle] = useState('');
  const [editNewsCategory, setEditNewsCategory] = useState('');
  const [editNewsSummary, setEditNewsSummary] = useState('');
  const [editNewsImage, setEditNewsImage] = useState('');

  // Add Gallery Modal State
  const [showAddGalleryModal, setShowAddGalleryModal] = useState(false);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryCategory, setGalleryCategory] = useState<'Teachers' | 'Students' | 'Classes' | 'School Officials' | 'Islamic Events' | 'General'>('Students');
  const [galleryImage, setGalleryImage] = useState<string>('');

  // Edit Gallery Modal State
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);
  const [editGalleryTitle, setEditGalleryTitle] = useState('');
  const [editGalleryCategory, setEditGalleryCategory] = useState<'Teachers' | 'Students' | 'Classes' | 'School Officials' | 'Islamic Events' | 'General'>('Students');
  const [editGalleryImage, setEditGalleryImage] = useState('');

  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  // Handle Image Upload (File -> Base64)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      notify({ type: 'error', title: 'File Too Large', message: 'Selected image must be smaller than 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setter(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit News / Event Article
  const handleCreateNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle || !newsSummary) return;

    const newArt: NewsArticle = {
      id: `art-${Date.now()}`,
      title: newsTitle.trim(),
      category: newsCategory,
      date: new Date().toISOString().split('T')[0],
      summary: newsSummary.trim(),
      image: newsImage,
      published: true,
    };

    addNewsArticle(newArt);

    addAuditLog({
      action: 'WEBSITE_CMS_ARTICLE_PUBLISHED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Published news event: "${newsTitle}"`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Article/${newArt.id}`,
      status: 'SUCCESS',
    });

    setNotice(`News event "${newsTitle}" published successfully to public website!`);
    setNewsTitle('');
    setNewsSummary('');
    setShowAddNewsModal(false);
    setTimeout(() => setNotice(''), 4000);
  };

  // Open Edit News Modal
  const handleOpenEditNews = (art: NewsArticle) => {
    setEditingNews(art);
    setEditNewsTitle(art.title);
    setEditNewsCategory(art.category);
    setEditNewsSummary(art.summary);
    setEditNewsImage(art.image || '');
  };

  // Submit Edit News Article
  const handleUpdateNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews || !editNewsTitle || !editNewsSummary) return;

    updateNewsArticle(editingNews.id, {
      title: editNewsTitle.trim(),
      category: editNewsCategory,
      summary: editNewsSummary.trim(),
      image: editNewsImage,
    });

    addAuditLog({
      action: 'WEBSITE_CMS_ARTICLE_UPDATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Updated news article: "${editNewsTitle}"`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Article/${editingNews.id}`,
      status: 'SUCCESS',
    });

    setNotice(`News article "${editNewsTitle}" updated successfully!`);
    setEditingNews(null);
    setTimeout(() => setNotice(''), 4000);
  };

  // Submit Gallery Photo
  const handleCreateGalleryPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryTitle || !galleryImage) {
      notify({ type: 'error', title: 'Missing Information', message: 'Please provide a photo title and select an image file.' });
      return;
    }

    const newPhoto: GalleryItem = {
      id: `gal-${Date.now()}`,
      title: galleryTitle.trim(),
      category: galleryCategory,
      image: galleryImage,
      createdAt: new Date().toISOString().split('T')[0],
    };

    addGalleryItem(newPhoto);

    addAuditLog({
      action: 'WEBSITE_GALLERY_PHOTO_ADDED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Uploaded photo to Gallery under [${galleryCategory}]: "${galleryTitle}"`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Gallery/${newPhoto.id}`,
      status: 'SUCCESS',
    });

    setNotice(`Photo "${galleryTitle}" added to School Gallery under section [${galleryCategory}]!`);
    setGalleryTitle('');
    setGalleryImage('');
    setShowAddGalleryModal(false);
    setTimeout(() => setNotice(''), 4000);
  };

  // Open Edit Gallery Modal
  const handleOpenEditGallery = (item: GalleryItem) => {
    setEditingGalleryItem(item);
    setEditGalleryTitle(item.title);
    setEditGalleryCategory(item.category);
    setEditGalleryImage(item.image);
  };

  // Submit Edit Gallery Item
  const handleUpdateGalleryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGalleryItem || !editGalleryTitle || !editGalleryImage) return;

    updateGalleryItem(editingGalleryItem.id, {
      title: editGalleryTitle.trim(),
      category: editGalleryCategory,
      image: editGalleryImage,
    });

    addAuditLog({
      action: 'WEBSITE_GALLERY_PHOTO_UPDATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Updated Gallery photo under [${editGalleryCategory}]: "${editGalleryTitle}"`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Gallery/${editingGalleryItem.id}`,
      status: 'SUCCESS',
    });

    setNotice(`Gallery photo "${editGalleryTitle}" updated successfully!`);
    setEditingGalleryItem(null);
    setTimeout(() => setNotice(''), 4000);
  };

  const filteredGallery = galleryCategoryFilter === 'All'
    ? galleryItems
    : galleryItems.filter((g) => g.category === galleryCategoryFilter);

  return (
    <div className="space-y-6 text-slate-900 dark:text-gray-100 selection:bg-emerald-500 selection:text-white font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#042f1e] via-[#064e3b] to-[#0284c7] text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/30">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-1">
            <Layout className="w-4 h-4 text-emerald-400" /> Website Content Management System (CMS)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Website CMS & Public Content Portal</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
            Post news articles, Musabaqah event announcements, and manage section-based photos in the School Gallery for the public website.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            {activeTab === 'news' ? (
              <button
                onClick={() => setShowAddNewsModal(true)}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" /> Publish News / Event
              </button>
            ) : (
              <button
                onClick={() => setShowAddGalleryModal(true)}
                className="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105"
              >
                <Upload className="w-4 h-4" /> Add Photo to Gallery
              </button>
            )}
          </div>
        )}
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-slate-200/70 dark:bg-[#021810] p-1.5 rounded-2xl border border-slate-300 dark:border-emerald-500/20 text-xs font-bold">
          <button
            onClick={() => setActiveTab('news')}
            className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'news'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-gray-400 hover:text-emerald-500'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>News & Events ({newsArticles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'gallery'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-gray-400 hover:text-emerald-500'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>School Photo Gallery ({galleryItems.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: NEWS & EVENTS */}
      {activeTab === 'news' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {newsArticles.map((art) => (
            <div
              key={art.id}
              className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3 text-xs">
                {art.image && (
                  <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-emerald-950 border border-slate-200 dark:border-emerald-500/20">
                    <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                  </div>
                )}

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

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditNews(art)}
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-bold px-2.5"
                      title="Edit News Article"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() =>
                        showConfirm({
                          title: 'Confirm Permanent Article Deletion',
                          message: `Are you sure you want to permanently delete news article "${art.title}"?`,
                          confirmText: 'Yes, Delete Permanently',
                          cancelText: 'Cancel',
                          variant: 'danger',
                          onConfirm: () => deleteNewsArticle(art.id),
                        })
                      }
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white transition-colors"
                      title="Delete News Article"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: SCHOOL PHOTO GALLERY */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          {/* Gallery Category Filter */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-emerald-300">
              <Filter className="w-4 h-4 text-emerald-500" />
              <span>Filter Gallery Section:</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['All', 'Students', 'Teachers', 'Classes', 'School Officials', 'Islamic Events', 'General'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setGalleryCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    galleryCategoryFilter === cat
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                className="group p-4 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-100 dark:bg-emerald-950 border border-slate-200 dark:border-emerald-500/20">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute top-3 left-3 text-[10px] font-bold bg-black/60 text-white px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/20 uppercase">
                      {item.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{item.title}</h4>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-emerald-500/20 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">Section: {item.category}</span>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditGallery(item)}
                        className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-slate-950 transition-colors flex items-center gap-1 text-[11px] font-bold px-2.5"
                        title="Edit Photo Details"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() =>
                          showConfirm({
                            title: 'Confirm Permanent Photo Deletion',
                            message: `Are you sure you want to permanently delete photo "${item.title}"?`,
                            confirmText: 'Yes, Delete Permanently',
                            cancelText: 'Cancel',
                            variant: 'danger',
                            onConfirm: () => deleteGalleryItem(item.id),
                          })
                        }
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white transition-colors"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD NEWS / EVENT MODAL */}
      {showAddNewsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowAddNewsModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Publish News / Event Announcement</h3>
                <p className="text-slate-500 dark:text-emerald-300/70">Post Musabaqah or event updates to public portal</p>
              </div>
            </div>

            <form onSubmit={handleCreateNews} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Article / Event Title *</label>
                <input
                  type="text"
                  required
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  placeholder="e.g. Musabaqah 1447 Quranic Recitation Competition"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Category *</label>
                <select
                  value={newsCategory}
                  onChange={(e) => setNewsCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-semibold focus:outline-none"
                >
                  <option value="Musabaqah & Tahfiz">Musabaqah & Tahfiz</option>
                  <option value="Admissions">Admissions</option>
                  <option value="Academic Calendar">Academic Calendar</option>
                  <option value="General News">General News</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Event Photo / Header Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileChange(e, setNewsImage)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white font-mono cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Summary / Event Description *</label>
                <textarea
                  required
                  rows={4}
                  value={newsSummary}
                  onChange={(e) => setNewsSummary(e.target.value)}
                  placeholder="Enter detailed article body text..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all uppercase tracking-wider"
              >
                Publish to Public Website
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT NEWS / EVENT MODAL */}
      {editingNews && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setEditingNews(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit News / Event Article</h3>
                <p className="text-slate-500 dark:text-emerald-300/70">Update details or replace event photo</p>
              </div>
            </div>

            <form onSubmit={handleUpdateNews} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Article / Event Title *</label>
                <input
                  type="text"
                  required
                  value={editNewsTitle}
                  onChange={(e) => setEditNewsTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Category *</label>
                <select
                  value={editNewsCategory}
                  onChange={(e) => setEditNewsCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-semibold focus:outline-none"
                >
                  <option value="Musabaqah & Tahfiz">Musabaqah & Tahfiz</option>
                  <option value="Admissions">Admissions</option>
                  <option value="Academic Calendar">Academic Calendar</option>
                  <option value="General News">General News</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Replace Event Photo / Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileChange(e, setEditNewsImage)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white font-mono cursor-pointer"
                />
              </div>

              {editNewsImage && (
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-emerald-500/20">
                  <img src={editNewsImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Summary / Event Description *</label>
                <textarea
                  required
                  rows={4}
                  value={editNewsSummary}
                  onChange={(e) => setEditNewsSummary(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all uppercase tracking-wider"
              >
                Save Article Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD GALLERY PHOTO MODAL */}
      {showAddGalleryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowAddGalleryModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Photo to School Gallery</h3>
                <p className="text-slate-500 dark:text-emerald-300/70">Upload photos directly from laptop or mobile phone</p>
              </div>
            </div>

            <form onSubmit={handleCreateGalleryPhoto} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Photo Title / Caption *</label>
                <input
                  type="text"
                  required
                  value={galleryTitle}
                  onChange={(e) => setGalleryTitle(e.target.value)}
                  placeholder="e.g. Female Tahfiz Halqa Recitation Class"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Target Gallery Section *</label>
                <select
                  value={galleryCategory}
                  onChange={(e) => setGalleryCategory(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-bold focus:outline-none"
                >
                  <option value="Students">Students Section</option>
                  <option value="Teachers">Teachers Section</option>
                  <option value="Classes">Classes Section</option>
                  <option value="School Officials">School Officials Section</option>
                  <option value="Islamic Events">Islamic Events / Musabaqah</option>
                  <option value="General">General Premises</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Upload Image File (Laptop or Phone) *</label>
                <input
                  type="file"
                  accept="image/*"
                  required={!galleryImage}
                  onChange={(e) => handleImageFileChange(e, setGalleryImage)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-dashed border-amber-500/50 text-xs text-slate-900 dark:text-white font-mono cursor-pointer"
                />
              </div>

              {galleryImage && (
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-emerald-500/20">
                  <img src={galleryImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-lg transition-all uppercase tracking-wider"
              >
                Save Photo to Gallery
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GALLERY PHOTO MODAL */}
      {editingGalleryItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setEditingGalleryItem(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Gallery Photo Details</h3>
                <p className="text-slate-500 dark:text-emerald-300/70">Update caption, change section, or replace photo file</p>
              </div>
            </div>

            <form onSubmit={handleUpdateGalleryItem} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Photo Title / Caption *</label>
                <input
                  type="text"
                  required
                  value={editGalleryTitle}
                  onChange={(e) => setEditGalleryTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Target Gallery Section *</label>
                <select
                  value={editGalleryCategory}
                  onChange={(e) => setEditGalleryCategory(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-bold focus:outline-none"
                >
                  <option value="Students">Students Section</option>
                  <option value="Teachers">Teachers Section</option>
                  <option value="Classes">Classes Section</option>
                  <option value="School Officials">School Officials Section</option>
                  <option value="Islamic Events">Islamic Events / Musabaqah</option>
                  <option value="General">General Premises</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Replace Image File (Laptop or Phone)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileChange(e, setEditGalleryImage)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-dashed border-amber-500/50 text-xs text-slate-900 dark:text-white font-mono cursor-pointer"
                />
              </div>

              {editGalleryImage && (
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-emerald-500/20">
                  <img src={editGalleryImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-lg transition-all uppercase tracking-wider"
              >
                Save Photo Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
