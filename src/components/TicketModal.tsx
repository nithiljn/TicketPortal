'use client'

import React, { useState, useEffect } from 'react'
import { Ticket, TicketStatus, TicketPriority } from '@/types'

interface TicketModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    id?: string
    title: string
    description: string
    status: TicketStatus
    priority: TicketPriority
    category: string
    projectName: string
    author: string
  }) => Promise<void>
  existingTicket?: Ticket | null
  initialMode?: 'view' | 'edit'
  availableProjects: string[]
  currentProject: string
  theme?: 'dark' | 'light'
}

export function TicketModal({
  isOpen,
  onClose,
  onSave,
  existingTicket,
  initialMode = 'view',
  availableProjects,
  currentProject,
  theme = 'dark',
}: TicketModalProps) {
  const [isEditing, setIsEditing] = useState(initialMode === 'edit' || !existingTicket)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TicketStatus>('TODO')
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM')
  const [category, setCategory] = useState('DEV')
  const [projectName, setProjectName] = useState(availableProjects[0] || 'General')
  const [author, setAuthor] = useState('James Nithil')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isDark = theme === 'dark'

  useEffect(() => {
    if (!existingTicket) {
      setIsEditing(true)
    } else {
      setIsEditing(initialMode === 'edit')
    }
  }, [existingTicket, initialMode, isOpen])

  useEffect(() => {
    if (existingTicket) {
      setTitle(existingTicket.title)
      setDescription(existingTicket.description || '')
      setStatus(existingTicket.status)
      setPriority(existingTicket.priority)
      setCategory(existingTicket.category || 'DEV')
      setProjectName(
        existingTicket.projectName ||
          (availableProjects[0] || 'General')
      )
      setAuthor(existingTicket.updatedBy || 'James Nithil')
    } else {
      setTitle('')
      setDescription('')
      setStatus('TODO')
      setPriority('MEDIUM')
      setCategory('DEV')
      // If currentProject is selected and not 'ALL', pre-select it; otherwise use first available workspace
      const defaultProject =
        currentProject && currentProject !== 'ALL'
          ? currentProject
          : availableProjects[0] || 'General'
      setProjectName(defaultProject)
      setAuthor('James Nithil')
    }
    setError('')
  }, [existingTicket, isOpen, currentProject, availableProjects])

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit form
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        const form = document.getElementById('ticket-modal-form') as HTMLFormElement | null
        if (form) form.requestSubmit()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Ticket title is required')
      return
    }

    if (!projectName.trim()) {
      setError('Please select a workspace for this ticket')
      return
    }

    setLoading(true)
    setError('')
    try {
      await onSave({
        id: existingTicket?.id,
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        category,
        projectName: projectName.trim(),
        author: author.trim() || 'James Nithil',
      })
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save ticket'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Theme styles
  const modalBg = isDark
    ? 'bg-[#121215] border-white/[0.08] text-zinc-100'
    : 'bg-white border-zinc-200 text-zinc-900'
  const headerBorder = isDark ? 'border-white/[0.06]' : 'border-zinc-200'
  const inputBg = isDark
    ? 'bg-black/40 border-white/[0.08] text-zinc-100 placeholder-zinc-500 focus:border-white/[0.2] focus:ring-1 focus:ring-white/[0.05]'
    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200'
  const labelColor = isDark ? 'text-zinc-400' : 'text-zinc-600'
  const cancelBtn = isDark
    ? 'bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.08]'
    : 'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 shadow-xs'
  const getStatusBadge = (st: TicketStatus) => {
    switch (st) {
      case 'TODO':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${
            isDark ? 'bg-zinc-800 text-zinc-300 border-white/[0.08]' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            To Do
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border bg-amber-500/10 text-amber-500 border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            In Progress
          </span>
        )
      case 'DONE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Completed
          </span>
        )
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border bg-rose-500/10 text-rose-400 border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Blocked
          </span>
        )
    }
  }

  const getPriorityBadge = (pr: TicketPriority) => {
    switch (pr) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border bg-rose-500/10 text-rose-500 border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Urgent
          </span>
        )
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border bg-amber-500/10 text-amber-500 border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            High
          </span>
        )
      case 'MEDIUM':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${
            isDark ? 'bg-zinc-800 text-zinc-300 border-white/[0.08]' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Medium
          </span>
        )
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Low
          </span>
        )
    }
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return isNaN(d.getTime())
        ? dateStr
        : d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl sm:max-w-3xl rounded-2xl border shadow-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto transition-all ${modalBg}`}
      >
        {/* ======================================================== */}
        {/* MODE 1: READ-ONLY VIEW MODE                              */}
        {/* ======================================================== */}
        {!isEditing && existingTicket ? (
          <div>
            {/* View Header */}
            <div className={`flex items-start justify-between pb-4 border-b ${headerBorder}`}>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-zinc-800 border border-zinc-700 text-white' : 'bg-zinc-900 border border-zinc-800 text-white shadow-xs'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                    <line x1="13" y1="5" x2="13" y2="7" />
                    <line x1="13" y1="11" x2="13" y2="13" />
                    <line x1="13" y1="17" x2="13" y2="19" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-semibold tracking-tight">
                      Ticket Details
                    </h2>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                      isDark ? 'bg-white/[0.04] text-zinc-400 border-white/[0.08]' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}>
                      View Only
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Workspace: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{existingTicket.projectName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                    isDark
                      ? 'bg-white hover:bg-zinc-200 text-zinc-950'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  }`}
                  title="Click to edit this ticket"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Edit Ticket</span>
                </button>
                <button
                  onClick={onClose}
                  type="button"
                  className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-white/[0.06] transition cursor-pointer"
                  title="Close (Esc)"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* View Mode Body */}
            <div className="mt-5 space-y-4 sm:space-y-5">
              {/* Badges Strip */}
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(existingTicket.status)}
                {getPriorityBadge(existingTicket.priority)}
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono border ${
                  isDark ? 'bg-white/[0.04] text-zinc-300 border-white/[0.08]' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}>
                  {existingTicket.category || 'DEV'}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border ${
                  isDark ? 'bg-white/[0.06] text-zinc-200 border-white/[0.1]' : 'bg-zinc-100 text-zinc-800 border-zinc-200 font-medium'
                }`}>
                  <svg className="w-3 h-3 opacity-70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{existingTicket.projectName}</span>
                </span>
              </div>

              {/* Title Display */}
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-snug">
                  {existingTicket.title}
                </h1>
              </div>

              {/* Description Display Card */}
              <div className={`rounded-xl border p-4 space-y-1.5 ${
                isDark ? 'bg-black/30 border-white/[0.08]' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Description & Task Details
                </span>
                {existingTicket.description ? (
                  <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200 font-sans">
                    {existingTicket.description}
                  </div>
                ) : (
                  <p className="text-xs italic text-zinc-400 font-sans">
                    No description provided for this ticket.
                  </p>
                )}
              </div>

              {/* Metadata Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-zinc-50/70 border-zinc-200'}`}>
                  <span className="block text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1">
                    Assignee / Author
                  </span>
                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate block">
                    {existingTicket.updatedBy || existingTicket.createdBy || 'James Nithil'}
                  </span>
                </div>

                <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-zinc-50/70 border-zinc-200'}`}>
                  <span className="block text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1">
                    Created At
                  </span>
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 block">
                    {formatDateTime(existingTicket.createdAt)}
                  </span>
                </div>

                <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-zinc-50/70 border-zinc-200'}`}>
                  <span className="block text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1">
                    Last Updated
                  </span>
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 block">
                    {existingTicket.updatedAt ? formatDateTime(existingTicket.updatedAt) : 'Just now'}
                  </span>
                </div>
              </div>
            </div>

            {/* View Mode Footer */}
            <div className={`flex items-center justify-between pt-4 mt-6 border-t ${headerBorder}`}>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>View mode • Editing disabled until Edit is clicked</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 text-xs font-medium rounded-xl transition cursor-pointer ${cancelBtn}`}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`px-5 py-2 text-xs font-semibold rounded-xl shadow-sm transition active:scale-[0.99] cursor-pointer flex items-center gap-2 ${
                    isDark
                      ? 'bg-white hover:bg-zinc-200 text-zinc-950'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Edit Ticket</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* MODE 2: EDIT / CREATE FORM MODE                          */
          /* ======================================================== */
          <div>
            {/* Header */}
            <div className={`flex items-start justify-between pb-4 border-b ${headerBorder}`}>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-zinc-800 border border-zinc-700 text-white' : 'bg-zinc-900 border border-zinc-800 text-white shadow-xs'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                    <line x1="13" y1="5" x2="13" y2="7" />
                    <line x1="13" y1="11" x2="13" y2="13" />
                    <line x1="13" y1="17" x2="13" y2="19" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold tracking-tight">
                    {existingTicket ? 'Edit Ticket' : 'Create New Ticket'}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {existingTicket
                      ? 'Update ticket details and maintain your project status'
                      : 'Specify ticket details, assign workspace, and track delivery'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {existingTicket && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl transition cursor-pointer ${cancelBtn}`}
                  >
                    Back to View
                  </button>
                )}
                <button
                  onClick={onClose}
                  type="button"
                  className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-white/[0.06] transition cursor-pointer"
                  title="Close (Esc)"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form id="ticket-modal-form" onSubmit={handleSubmit} className="mt-5 space-y-4 sm:space-y-5">
              {/* Row 1: Workspace Selection & Category (2-Column Clean Alignment) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>
                    Workspace *
                  </label>
                  <div className="relative">
                    <select
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className={`w-full h-10 rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none transition cursor-pointer appearance-none ${inputBg}`}
                    >
                      {availableProjects.length === 0 ? (
                        <option value="General" className={isDark ? 'bg-[#18181b]' : 'bg-white'}>
                          General
                        </option>
                      ) : (
                        availableProjects.map((proj) => (
                          <option key={proj} value={proj} className={isDark ? 'bg-[#18181b]' : 'bg-white'}>
                            {proj}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-500">
                    Tickets are grouped within this selected workspace.
                  </p>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>
                    Category *
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`w-full h-10 rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none transition cursor-pointer appearance-none ${inputBg}`}
                    >
                      <option value="DEV" className={isDark ? 'bg-[#18181b]' : 'bg-white'}>DEV</option>
                      <option value="FEATURE" className={isDark ? 'bg-[#18181b]' : 'bg-white'}>FEATURE</option>
                      <option value="BUG" className={isDark ? 'bg-[#18181b]' : 'bg-white'}>BUG</option>
                      <option value="DATABASE" className={isDark ? 'bg-[#18181b]' : 'bg-white'}>DATABASE</option>
                      <option value="MEETING" className={isDark ? 'bg-[#18181b]' : 'bg-white'}>MEETING</option>
                      <option value="LEARNING" className={isDark ? 'bg-[#18181b]' : 'bg-white'}>LEARNING</option>
                      <option value="PERSONAL" className={isDark ? 'bg-[#18181b]' : 'bg-white'}>PERSONAL</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-500">
                    Tag the technical domain of the task.
                  </p>
                </div>
              </div>

              {/* Row 2: Ticket Title */}
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>
                  Ticket Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Implement OAuth authentication flow and JWT validation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full h-11 rounded-xl border px-3.5 text-xs sm:text-sm font-medium focus:outline-none transition ${inputBg}`}
                  required
                />
              </div>

              {/* Row 3: Description & Notes */}
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>
                  Description & Task Details
                </label>
                <textarea
                  rows={5}
                  placeholder="Describe requirements, implementation notes, API endpoints, or reproduction steps..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full rounded-xl border p-3.5 text-xs sm:text-sm focus:outline-none transition resize-y min-h-[120px] leading-relaxed font-sans ${inputBg}`}
                />
              </div>

              {/* Row 4: Status, Priority, Author */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TicketStatus)}
                      className={`w-full h-10 rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none transition cursor-pointer appearance-none ${inputBg}`}
                    >
                      <option value="TODO" className={isDark ? 'bg-[#18181b]' : 'bg-white'}>To Do</option>
                      <option value="IN_PROGRESS" className={isDark ? 'bg-[#18181b]' : 'bg-white'}>In Progress</option>
                      <option value="DONE" className={isDark ? 'bg-[#18181b]' : 'bg-white'}>Completed</option>
                      <option value="BLOCKED" className={isDark ? 'bg-[#18181b]' : 'bg-white'}>Blocked</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TicketPriority)}
                      className={`w-full h-10 rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none transition cursor-pointer appearance-none ${inputBg}`}
                    >
                      <option value="LOW" className={isDark ? 'bg-[#18181b]' : 'bg-white'}>Low</option>
                      <option value="MEDIUM" className={isDark ? 'bg-[#18181b]' : 'bg-white'}>Medium</option>
                      <option value="HIGH" className={isDark ? 'bg-[#18181b]' : 'bg-white'}>High</option>
                      <option value="URGENT" className={isDark ? 'bg-[#18181b]' : 'bg-white'}>Urgent</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>
                    Author / Assignee
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="James Nithil"
                    className={`w-full h-10 rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none transition ${inputBg}`}
                  />
                </div>
              </div>

              {/* Footer & Actions */}
              <div className={`flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t ${headerBorder}`}>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] font-mono text-[10px]">
                    ⌘ / Ctrl + Enter
                  </kbd>
                  <span>to quickly save</span>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (existingTicket) {
                        setIsEditing(false)
                      } else {
                        onClose()
                      }
                    }}
                    className={`px-4 py-2 text-xs font-medium rounded-xl transition cursor-pointer ${cancelBtn}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-5 py-2 text-xs font-semibold rounded-xl shadow-sm transition active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center gap-2 ${
                      isDark
                        ? 'bg-white hover:bg-zinc-200 text-zinc-950'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                    }`}
                  >
                    {loading ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{existingTicket ? 'Save Changes' : 'Create Ticket'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
