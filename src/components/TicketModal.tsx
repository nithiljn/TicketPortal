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
  availableProjects: string[]
  currentProject: string
  theme?: 'dark' | 'light'
}

export function TicketModal({
  isOpen,
  onClose,
  onSave,
  existingTicket,
  availableProjects,
  currentProject,
  theme = 'dark',
}: TicketModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TicketStatus>('TODO')
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM')
  const [category, setCategory] = useState('DEV')
  const [projectName, setProjectName] = useState('Ticket Portal')
  const [author, setAuthor] = useState('James Nithil')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isDark = theme === 'dark'

  useEffect(() => {
    if (existingTicket) {
      setTitle(existingTicket.title)
      setDescription(existingTicket.description || '')
      setStatus(existingTicket.status)
      setPriority(existingTicket.priority)
      setCategory(existingTicket.category || 'DEV')
      setProjectName(
        existingTicket.projectName ||
          (availableProjects[0] || 'Ticket Portal')
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
          : availableProjects[0] || 'Ticket Portal'
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
    ? 'bg-black/40 border-white/[0.08] text-zinc-100 placeholder-zinc-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20'
    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600/20'
  const labelColor = isDark ? 'text-zinc-400' : 'text-zinc-600'
  const cancelBtn = isDark
    ? 'bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300'
    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl sm:max-w-3xl rounded-2xl border shadow-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto transition-all ${modalBg}`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between pb-4 border-b ${headerBorder}`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-100 text-sky-600'
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
                  {availableProjects.map((proj) => (
                    <option key={proj} value={proj} className={isDark ? 'bg-[#18181b]' : 'bg-white'}>
                      {proj}
                    </option>
                  ))}
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

          {/* Row 2: Ticket Title (Prominent, High-Visibility Input) */}
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

          {/* Row 3: Description & Notes (Spacious Textarea) */}
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

          {/* Row 4: Status, Priority, Author (3-Column Clean Grid) */}
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
                onClick={onClose}
                className={`px-4 py-2 text-xs font-medium rounded-xl transition cursor-pointer ${cancelBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center gap-2"
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
    </div>
  )
}
