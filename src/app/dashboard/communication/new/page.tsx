'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Mail,
  MessageSquare,
  Bell,
  Layout,
  Users,
  FileText,
  Clock,
  Eye,
  Paperclip,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommunicationType, DeliveryChannel, MessagePriority, RecipientType } from '@/types/communication';
import { WhatsAppBatchModal } from '@/components/communication/WhatsAppBatchModal';
import { buildAnnouncementWhatsAppPayload, WhatsAppPayload } from '@/lib/whatsappUtils';

export default function NewCommunicationPage() {
  const router = useRouter();
  const { programmes, classes, teachers, parents, students, createCommunication, testSendCommunication, messageTemplates } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [recipientType, setRecipientType] = useState<RecipientType>('ENTIRE_SCHOOL');
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const [selectedChannels, setSelectedChannels] = useState<DeliveryChannel[]>(['EMAIL', 'WHATSAPP', 'IN_APP', 'DASHBOARD']);
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CommunicationType>('ANNOUNCEMENT');
  const [priority, setPriority] = useState<MessagePriority>('NORMAL');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testSentToast, setTestSentToast] = useState(false);
  const [whatsAppPayloads, setWhatsAppPayloads] = useState<WhatsAppPayload[] | null>(null);

  const handleOpenWhatsAppGateway = () => {
    let targetParents = parents;
    if (recipientType === 'PROGRAMME' && selectedProgrammeId) {
      const pStudents = students.filter((s) => s.programmeId === selectedProgrammeId);
      const parentIds = pStudents.map((s) => s.guardianId).filter(Boolean);
      targetParents = parents.filter((p) => parentIds.includes(p.id));
    } else if (recipientType === 'CLASS' && selectedClassId) {
      const cStudents = students.filter((s) => s.classId === selectedClassId);
      const parentIds = cStudents.map((s) => s.guardianId).filter(Boolean);
      targetParents = parents.filter((p) => parentIds.includes(p.id));
    }

    const payloads = targetParents.map((parent) =>
      buildAnnouncementWhatsAppPayload(parent, subject || title, content, students)
    );
    setWhatsAppPayloads(payloads);
  };

  // Recipient Cascade Filter Options
  const filteredClasses = selectedProgrammeId
    ? classes.filter((c) => c.programmeId === selectedProgrammeId)
    : classes;

  // Calculate dynamic recipient counters
  let calculatedStudentCount = students.length;
  let calculatedParentCount = parents.length;
  let calculatedTeacherCount = teachers.length;

  if (recipientType === 'PROGRAMME' && selectedProgrammeId) {
    const pSts = students.filter((s) => s.programmeId === selectedProgrammeId);
    calculatedStudentCount = pSts.length;
    calculatedParentCount = Math.floor(pSts.length * 0.9);
    calculatedTeacherCount = 2;
  } else if (recipientType === 'CLASS' && selectedClassId) {
    const cSts = students.filter((s) => s.classId === selectedClassId);
    calculatedStudentCount = cSts.length;
    calculatedParentCount = cSts.length;
    calculatedTeacherCount = 1;
  } else if (recipientType === 'TEACHERS') {
    calculatedStudentCount = 0;
    calculatedParentCount = 0;
    calculatedTeacherCount = teachers.length;
  } else if (recipientType === 'PARENTS') {
    calculatedStudentCount = 0;
    calculatedParentCount = parents.length;
    calculatedTeacherCount = 0;
  } else if (recipientType === 'STUDENTS') {
    calculatedStudentCount = students.length;
    calculatedParentCount = 0;
    calculatedTeacherCount = 0;
  }

  const toggleChannel = (channel: DeliveryChannel) => {
    if (selectedChannels.includes(channel)) {
      if (selectedChannels.length === 1) return; // Must have at least 1 channel
      setSelectedChannels(selectedChannels.filter((c) => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  const applyTemplate = (tmplId: string) => {
    const target = messageTemplates.find((t) => t.id === tmplId);
    if (!target) return;
    setTitle(target.title);
    setType(target.category);
    setSubject(target.subject);
    setContent(target.content);
    setSelectedChannels(target.defaultChannels);
  };

  const handleTestSend = async () => {
    await testSendCommunication({ title, subject, content }, 'EMAIL');
    setTestSentToast(true);
    setTimeout(() => setTestSentToast(false), 3000);
  };

  const handleSubmitDispatch = async (isScheduleMode: boolean) => {
    if (!title || !subject || !content) return;
    setIsSubmitting(true);
    try {
      const selectedProgramme = programmes.find((p) => p.id === selectedProgrammeId);
      const selectedClass = classes.find((c) => c.id === selectedClassId);

      await createCommunication(
        {
          title,
          type,
          priority,
          channels: selectedChannels,
          recipientType,
          programmeId: selectedProgrammeId || undefined,
          programmeName: selectedProgramme?.programme_name || undefined,
          classId: selectedClassId || undefined,
          className: selectedClass?.name || undefined,
          subject,
          content,
          plainContent: content.replace(/<[^>]*>?/gm, ''),
          senderId: 'usr-admin-1',
          senderName: 'Management Office',
          senderRole: 'ADMIN',
        },
        isScheduleMode ? scheduledFor : undefined
      );

      router.push('/dashboard/communication');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 font-poppins">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/communication"
            className="p-2.5 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">New Communication Composer</h1>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70">5-Step Wizard: Recipients, Channels, Message, Preview & Dispatch</p>
          </div>
        </div>
      </div>

      {/* Progress Wizard Indicator */}
      <div className="grid grid-cols-5 gap-2 sm:gap-4 text-center text-xs font-bold">
        {[
          { num: 1, label: '1. Recipients' },
          { num: 2, label: '2. Channels' },
          { num: 3, label: '3. Composer' },
          { num: 4, label: '4. Preview & Test' },
          { num: 5, label: '5. Dispatch' },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => setStep(s.num as any)}
            className={`py-3 px-2 rounded-2xl border cursor-pointer transition-all ${
              step === s.num
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30 font-black'
                : step > s.num
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-white dark:bg-[#042419] text-slate-400 dark:text-emerald-300/40 border-slate-200 dark:border-emerald-500/20'
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* STEP 1: RECIPIENT SELECTION WIZARD */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Step 1: Select Target Recipients & Audience
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: 'ENTIRE_SCHOOL', label: 'Entire School Community', desc: 'All Students, Parents, Teachers & Staff' },
                { id: 'PROGRAMME', label: 'Specific Programme', desc: 'Filter by Programme (e.g. Asubah & Magrib)' },
                { id: 'CLASS', label: 'Specific Class', desc: 'Filter by Class (e.g. Dar Abu Bakr)' },
                { id: 'TEACHERS', label: 'Teachers & Academic Staff', desc: 'All Teaching Staff only' },
                { id: 'PARENTS', label: 'Parents & Guardians', desc: 'All Registered Parents only' },
                { id: 'STUDENTS', label: 'Students Only', desc: 'All Registered Students only' },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setRecipientType(item.id as RecipientType);
                    if (item.id !== 'PROGRAMME') setSelectedProgrammeId('');
                    if (item.id !== 'CLASS') setSelectedClassId('');
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                    recipientType === item.id
                      ? 'bg-emerald-500/15 border-emerald-500 text-slate-900 dark:text-white ring-2 ring-emerald-500/50'
                      : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-500/20 text-slate-700 dark:text-emerald-200 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="font-extrabold text-sm flex items-center justify-between">
                    <span>{item.label}</span>
                    {recipientType === item.id && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-emerald-300/70">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* CASCADE PROGRAMME SELECTOR */}
            {recipientType === 'PROGRAMME' && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <label className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300">Choose Programme:</label>
                <select
                  value={selectedProgrammeId}
                  onChange={(e) => setSelectedProgrammeId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#042419] border border-emerald-500/40 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Select Programme --</option>
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.programme_name_english || p.programme_name} ({p.programme_name_arabic})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* CASCADE CLASS SELECTOR */}
            {recipientType === 'CLASS' && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300">Filter by Programme:</label>
                    <select
                      value={selectedProgrammeId}
                      onChange={(e) => {
                        setSelectedProgrammeId(e.target.value);
                        setSelectedClassId('');
                      }}
                      className="w-full p-3 rounded-xl bg-white dark:bg-[#042419] border border-emerald-500/40 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="">All Programmes</option>
                      {programmes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.programme_name_english || p.programme_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300">Select Class:</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white dark:bg-[#042419] border border-emerald-500/40 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="">-- Choose Class --</option>
                      {filteredClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.class_name_english} ({c.class_name_arabic || ''})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* AUDIENCE SUMMARY COUNTER BADGES */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs font-extrabold uppercase text-slate-600 dark:text-emerald-300">Estimated Target Reach:</span>
              <div className="flex flex-wrap gap-2 text-xs font-black">
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  👨‍🎓 {calculatedStudentCount} Students
                </span>
                <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  👨‍👩‍👧‍👦 {calculatedParentCount} Parents
                </span>
                <span className="px-3 py-1 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                  👨‍🏫 {calculatedTeacherCount} Teachers
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg flex items-center gap-2 transition-all"
            >
              <span>Next: Select Channels</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 2: DELIVERY CHANNELS PICKER */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Step 2: Choose Delivery Channels (Multi-Select)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'EMAIL', label: 'HTML Email Service', icon: Mail, desc: 'Branded email with school logo & header' },
                { id: 'WHATSAPP', label: 'WhatsApp Instant Messaging', icon: MessageSquare, desc: 'Direct phone delivery with download links' },
                { id: 'IN_APP', label: 'In-App Personal Notification', icon: Bell, desc: 'Personal inbox notifications' },
                { id: 'DASHBOARD', label: 'Dashboard Notice Board', icon: Layout, desc: 'Targeted cards on student/parent/teacher dashboards' },
              ].map((ch) => {
                const isSelected = selectedChannels.includes(ch.id as DeliveryChannel);
                return (
                  <div
                    key={ch.id}
                    onClick={() => toggleChannel(ch.id as DeliveryChannel)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/40 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-500/20 text-slate-500 dark:text-emerald-300/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-emerald-950 text-slate-500'}`}>
                        <ch.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm">{ch.label}</div>
                        <p className="text-xs text-slate-500 dark:text-emerald-300/70">{ch.desc}</p>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${isSelected ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-300'}`}>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-emerald-300 font-bold text-xs">
              Back
            </button>
            <button onClick={() => setStep(3)} className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs flex items-center gap-2">
              <span>Next: Compose Message</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 3: MESSAGE COMPOSER */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Step 3: Message Composer & Template Picker
              </h2>

              {/* TEMPLATE PICKER DROPDOWN */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Load Template:</span>
                <select
                  onChange={(e) => applyTemplate(e.target.value)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-emerald-950 border border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose Template --</option>
                  {messageTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-extrabold uppercase text-slate-600 dark:text-emerald-300">Internal Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Term 2 Examination Notice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase text-slate-600 dark:text-emerald-300">Communication Type:</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white font-bold"
                >
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="CIRCULAR">Circular</option>
                  <option value="EXAMINATION_NOTICE">Examination Notice</option>
                  <option value="HOLIDAY_NOTICE">Holiday Notice</option>
                  <option value="PTA_MEETING">PTA Meeting</option>
                  <option value="EVENT_NOTICE">Event Notice</option>
                  <option value="EMERGENCY_NOTICE">Emergency Notice</option>
                  <option value="REPORT_SHEET">Report Sheet</option>
                  <option value="GENERAL_NOTICE">General Notice</option>
                  <option value="ADMISSION_NOTICE">Admission Notice</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase text-slate-600 dark:text-emerald-300">Priority Level:</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white font-bold"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="IMPORTANT">Important</option>
                  <option value="URGENT">Urgent (High Alert)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold uppercase text-slate-600 dark:text-emerald-300">Subject / Header Title:</label>
              <input
                type="text"
                placeholder="Official Subject line as shown in Email & WhatsApp header"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold uppercase text-slate-600 dark:text-emerald-300">Message Content:</label>
              <textarea
                rows={7}
                placeholder="Write message content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-emerald-300 font-bold text-xs">
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!title || !subject || !content}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 disabled:opacity-50"
            >
              <span>Next: Preview & Test</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 4: PREVIEW & TEST SEND */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Step 4: Live Multi-Channel Message Preview
              </h2>

              <button
                onClick={handleTestSend}
                className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 hover:scale-105 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Test Message to Admin</span>
              </button>
            </div>

            {testSentToast && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Test message successfully dispatched to your email & WhatsApp sandbox!</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* HTML EMAIL PREVIEW CARD */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-2 font-black text-xs text-emerald-600 dark:text-emerald-400 uppercase">
                  <Mail className="w-4 h-4" /> HTML Email Template Preview
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#042419] border space-y-2 text-xs">
                  <div className="text-slate-500">From: info@markazuumar.edu.ng</div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">{subject}</div>
                  <div className="py-2 border-t text-slate-700 dark:text-emerald-100 whitespace-pre-line">{content}</div>
                </div>
              </div>

              {/* WHATSAPP TEXT PREVIEW CARD */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 font-black text-xs text-emerald-400 uppercase">
                  <MessageSquare className="w-4 h-4" /> WhatsApp Structured Text Preview
                </div>
                <div className="p-4 rounded-xl bg-[#0b291d] text-emerald-100 font-mono text-[11px] space-y-2 whitespace-pre-line">
                  <div>Assalamu Alaikum.</div>
                  <div>Dear Parent/Guardian,</div>
                  <div className="font-bold text-amber-300">*Subject:* {subject}</div>
                  <div>{content}</div>
                  <div className="text-[10px] text-emerald-400">_Management Office, Markazu Umar_</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(3)} className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-emerald-300 font-bold text-xs">
              Back
            </button>
            <button onClick={() => setStep(5)} className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs flex items-center gap-2">
              <span>Next: Final Dispatch</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 5: FINAL DISPATCH / SCHEDULE */}
      {step === 5 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Step 5: Confirm Dispatch or Schedule for Later
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {selectedChannels.includes('WHATSAPP') && (
                <button
                  onClick={handleOpenWhatsAppGateway}
                  className="p-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex flex-col items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all"
                >
                  <MessageSquare className="w-6 h-6 text-slate-950" />
                  <span>📱 Open 1-Click WhatsApp Gateway</span>
                  <span className="text-[11px] text-slate-900 font-bold">Interactive WhatsApp Parent Dispatcher</span>
                </button>
              )}

              <button
                onClick={() => handleSubmitDispatch(false)}
                disabled={isSubmitting}
                className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-sm flex flex-col items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all"
              >
                <Send className="w-6 h-6" />
                <span>Send Immediately Now</span>
                <span className="text-[11px] text-emerald-200 font-medium">Dispatches instantly across selected channels</span>
              </button>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 space-y-3">
                <div className="font-extrabold text-xs text-slate-800 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-500" /> Schedule Message for Later
                </div>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                />
                <button
                  onClick={() => handleSubmitDispatch(true)}
                  disabled={!scheduledFor || isSubmitting}
                  className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs disabled:opacity-50 transition-all"
                >
                  Confirm Schedule
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-start">
            <button onClick={() => setStep(4)} className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-emerald-300 font-bold text-xs">
              Back
            </button>
          </div>
        </motion.div>
      )}

      {/* WHATSAPP BATCH DISPATCH MODAL */}
      {whatsAppPayloads && (
        <WhatsAppBatchModal
          title="Targeted WhatsApp Announcement Dispatcher"
          subtitle={`Notice: ${subject || title}`}
          payloads={whatsAppPayloads}
          onClose={() => setWhatsAppPayloads(null)}
          onDispatchComplete={() => {
            handleSubmitDispatch(false);
          }}
        />
      )}
    </div>
  );
}
