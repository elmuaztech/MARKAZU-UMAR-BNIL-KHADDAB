'use client';

import React, { useState } from 'react';
import { useApp } from '../../../lib/context';
import {
  HeartHandshake,
  Users,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Plus,
  Search,
  Filter,
  ArrowRight,
  X,
  Edit,
  Trash2,
  Download,
  Baby,
} from 'lucide-react';
import { Parent } from '../../../types';
import { filterStudentsForUser, filterParentsForUser } from '../../../lib/rbac';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EnterpriseTable, Column } from '@/components/ui/EnterpriseTable';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input } from '@/components/ui/FormField';

export default function ParentsPage() {
  const { parents, students, teacherAssignments, currentUser, addParent, bulkImportParents, updateParent, deleteParent, showConfirm, notify } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);

  // Bulk CSV State
  const [bulkPreview, setBulkPreview] = useState<(Omit<Parent, 'id'> & { id?: string; linkedChildrenStr?: string })[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Add Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [address, setAddress] = useState('');
  const [customPassword, setCustomPassword] = useState('');

  // Edit Form State
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editOccupation, setEditOccupation] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const isAdmin = currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN';

  const scopedStudents = filterStudentsForUser(currentUser, students, parents, teacherAssignments);
  const userParents = filterParentsForUser(currentUser, parents, scopedStudents);

  const filteredParents = userParents.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query) ||
      p.phone.includes(query) ||
      p.occupation.toLowerCase().includes(query)
    );
  });

  const handleAddParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone) return;

    addParent(
      {
        userId: `usr-parent-${Date.now()}`,
        fullName,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        occupation: occupation || 'Civil Servant',
        address: address || 'Kano, Nigeria',
        wardsCount: 0,
        wardIds: [],
      },
      customPassword.trim() || undefined
    );

    notify({
      type: 'success',
      title: 'Parent Account Created',
      message: `Registered parent profile for ${fullName}. Welcome email with login credentials has been sent!`,
    });

    setFullName('');
    setEmail('');
    setPhone('');
    setOccupation('');
    setAddress('');
    setCustomPassword('');
    setShowAddModal(false);
  };

  const handleDownloadTemplate = () => {
    const headers = "Parent ID,Full Name (English),Phone Number,Email Address,Linked Children\n";
    const sample = "usr-parent-101,Alhaji Suleiman Bappa,+2348035557777,suleiman.bappa@gmail.com,MU-2026-0901; MU-2026-0902\n";
    const blob = new Blob([headers + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parents_bulk_template.csv';
    a.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length <= 1) {
        notify({ type: 'warning', title: 'Empty CSV', message: 'CSV file must contain a header row and at least 1 data row.' });
        return;
      }

      const parsed: (Omit<Parent, 'id'> & { id?: string; linkedChildrenStr?: string })[] = [];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((col) => col.trim().replace(/^["']|["']$/g, ''));
        if (row.length < 2 || (!row[0] && !row[1])) continue;

        const parentId = row[0] || `usr-parent-${Date.now()}-${i}`;
        const parentName = row[1] || '';
        const phoneNo = row[2] || '+234 803 000 0000';
        const emailAddr = row[3] ? row[3].toLowerCase() : '';
        const childrenStr = row[4] || '';

        parsed.push({
          id: parentId,
          userId: parentId,
          fullName: parentName,
          email: emailAddr,
          phone: phoneNo,
          occupation: 'Guardian Parent',
          address: 'Kano, Nigeria',
          wardsCount: childrenStr ? childrenStr.split(/;|\|/).filter(Boolean).length : 0,
          wardIds: [],
          linkedChildrenStr: childrenStr,
        });
      }

      setBulkPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkImport = () => {
    if (bulkPreview.length === 0) return;
    setIsImporting(true);

    const result = bulkImportParents(bulkPreview);
    setIsImporting(false);
    setShowBulkModal(false);
    setBulkPreview([]);

    notify({
      type: 'success',
      title: 'Bulk Parent Import Complete',
      message: `Successfully processed ${result.successCount} parent profiles and updated linked children!`,
    });
  };

  const handleOpenEdit = (parent: Parent) => {
    setEditingParent(parent);
    setEditFullName(parent.fullName);
    setEditEmail(parent.email);
    setEditPhone(parent.phone);
    setEditOccupation(parent.occupation);
    setEditAddress(parent.address);
  };

  const handleEditParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;

    updateParent(editingParent.id, {
      fullName: editFullName,
      email: editEmail,
      phone: editPhone,
      occupation: editOccupation,
      address: editAddress,
    });

    setEditingParent(null);
  };

  const handleExportCSV = () => {
    const headers = 'Parent ID,Full Name (English),Phone Number,Email Address,Linked Children\n';
    const rows = filteredParents
      .map((p) => {
        const linkedChildren = students
          .filter((s) => s.guardianId === p.id || s.guardianId === p.userId)
          .map((s) => s.admissionNo || s.fullName)
          .join('; ');
        return `"${p.id}","${p.fullName}",${p.phone},${p.email},"${linkedChildren}"`;
      })
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Markazu_Umar_Parents_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-gray-100 selection:bg-emerald-500 selection:text-white">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#042f1e] via-[#064e3b] to-[#0284c7] text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/30">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-1">
            <HeartHandshake className="w-4 h-4 text-emerald-400" /> Parent & Guardian Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Parents & Guardians Management</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
            Manage guardian profiles, linked children (students), contact information, and automated notification preferences for Markazu Umar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <Button variant="secondary" size="md" onClick={handleExportCSV} leftIcon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>

          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="md"
                className="bg-emerald-500/20 text-white hover:bg-emerald-500/30 border-emerald-400/40"
                onClick={() => setShowBulkModal(true)}
              >
                Upload CSV
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddModal(true)}
              >
                Add Parent / Guardian
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-emerald-400/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search parent by name, email, phone, or occupation..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-slate-500 dark:text-emerald-400/80 font-bold text-xs">
          <span>Showing {filteredParents.length} registered guardians</span>
        </div>
      </div>

      {/* Parents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredParents.map((parent) => {
          const linkedChildren = students.filter((s) => s.guardianId === parent.id || s.guardianId === parent.userId);

          return (
            <div
              key={parent.id}
              className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4 hover:border-emerald-500 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg border border-emerald-500/20">
                      {parent.fullName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{parent.fullName}</h3>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" /> {parent.occupation}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(parent)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 transition-colors"
                        title="Edit Parent Profile"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          showConfirm({
                            title: 'Remove Parent Record',
                            description: `Are you sure you want to remove guardian record for ${parent.fullName}?`,
                            confirmLabel: 'Remove Parent',
                            onConfirm: () => deleteParent(parent.id),
                            isDanger: true,
                          });
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 transition-colors"
                        title="Delete Parent"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-emerald-300/80 pt-2 border-t border-slate-100 dark:border-emerald-500/20">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{parent.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{parent.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{parent.address}</span>
                  </p>
                </div>

                {/* Linked Children Section */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Baby className="w-3.5 h-3.5 text-amber-500" /> Linked Children ({linkedChildren.length})
                  </span>
                  {linkedChildren.length === 0 ? (
                    <p className="text-[11px] text-slate-400 dark:text-emerald-400/60 italic">No children linked yet</p>
                  ) : (
                    <div className="space-y-1">
                      {linkedChildren.map((child) => (
                        <div
                          key={child.id}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 flex items-center justify-between text-xs font-semibold"
                        >
                          <span className="text-slate-900 dark:text-white">{child.fullName}</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {child.className}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-emerald-500/20 flex items-center justify-between">
                <button
                  onClick={() => setSelectedParent(parent)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
                >
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Parent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Register Parent / Guardian</h3>
                <p className="text-xs text-slate-500 dark:text-emerald-300/70">Create a new parent profile for linking children</p>
              </div>
            </div>

            <form onSubmit={handleAddParentSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alhaji Ibrahim Danbatta"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-gray-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-gray-300">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 803 000 0000"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Occupation</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Civil Servant, Businessman, Engineer"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. No 14 Zoo Road, Kano State"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all uppercase tracking-wider"
              >
                Register Parent Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Parent Modal */}
      {editingParent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setEditingParent(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Parent Details</h3>
                <p className="text-xs text-slate-500 dark:text-emerald-300/70">Updating profile for {editingParent.fullName}</p>
              </div>
            </div>

            <form onSubmit={handleEditParentSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-gray-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-gray-300">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Occupation</label>
                <input
                  type="text"
                  value={editOccupation}
                  onChange={(e) => setEditOccupation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Residential Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => setEditingParent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-emerald-900/60 text-slate-700 dark:text-emerald-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {selectedParent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setSelectedParent(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-emerald-500/20">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg">
                {selectedParent.fullName[0]}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedParent.fullName}</h3>
                <p className="text-slate-500 dark:text-emerald-300/70">{selectedParent.occupation}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p><strong>Email:</strong> {selectedParent.email}</p>
              <p><strong>Phone:</strong> {selectedParent.phone}</p>
              <p><strong>Address:</strong> {selectedParent.address}</p>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Baby className="w-4 h-4 text-amber-500" /> Linked Children:
              </h4>
              {students
                .filter((s) => s.guardianId === selectedParent.id || s.guardianId === selectedParent.userId)
                .map((child) => (
                  <div key={child.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 flex justify-between items-center mb-1.5">
                    <span className="font-bold">{child.fullName} ({child.admissionNo})</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">{child.className}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      {/* Bulk CSV Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full max-h-[90vh] flex flex-col bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-emerald-500/20 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Download className="w-6 h-6 rotate-180" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bulk CSV Parent Registration</h3>
                  <p className="text-xs text-slate-500 dark:text-emerald-300/70">
                    Batch upload parent/guardian profiles & dispatch portal login credentials via email
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkPreview([]);
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-emerald-950 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">1. Download Official CSV Template</h4>
                    <p className="text-[11px] text-slate-500 dark:text-emerald-400/80">
                      Use our pre-formatted CSV template to populate parent/guardian records correctly.
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleDownloadTemplate} leftIcon={<Download className="w-3.5 h-3.5" />}>
                    Download Template
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white">2. Select & Upload CSV File</h4>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-dashed border-emerald-500/40 text-slate-900 dark:text-white font-mono cursor-pointer"
                />
              </div>

              {/* Preview Parsed Data */}
              {bulkPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Preview Ready Parent Profiles ({bulkPreview.length} Parents)
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-mono">Login credentials emailed to all parents</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 dark:border-emerald-500/30 divide-y divide-slate-200 dark:divide-emerald-500/20">
                    {bulkPreview.map((p, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-[#021810] flex items-center justify-between text-[11px]">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{p.fullName}</div>
                          <div className="text-slate-500 dark:text-emerald-400/80 font-mono text-[10px]">{p.email} • {p.phone}</div>
                          {p.linkedChildrenStr && (
                            <div className="text-emerald-400/70 text-[9px] mt-0.5">
                              Linked Children: {p.linkedChildrenStr}
                            </div>
                          )}
                        </div>
                        <Badge variant="emerald" className="text-[10px]">
                          Ready to Import
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with fixed action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-emerald-500/20 flex-shrink-0">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkPreview([]);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={bulkPreview.length === 0 || isImporting}
                onClick={handleExecuteBulkImport}
              >
                {isImporting ? 'Registering & Linking Children...' : `Confirm & Import Parents (${bulkPreview.length})`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
