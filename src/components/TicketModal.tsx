'use client'

import React, { useState, useEffect } from 'react'
import { Ticket, TicketStatus, TicketPriority } from '@/types'
import { Button } from '@/components/Button'

interface TicketModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    id?: string
    title: string
    description: string
    commands?: string
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
  onToggleBookmark?: (ticket: Ticket) => Promise<void> | void
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
  onToggleBookmark,
}: TicketModalProps) {
  const [isEditing, setIsEditing] = useState(initialMode === 'edit' || !existingTicket)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [commands, setCommands] = useState('')
  const [copiedCommands, setCopiedCommands] = useState(false)
  const [status, setStatus] = useState<TicketStatus>('TODO')
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM')
  const [category, setCategory] = useState('DEV')
  const [projectName, setProjectName] = useState(availableProjects[0] || 'General')
  const [author, setAuthor] = useState('James Nithil')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isDark = theme === 'dark'

  const handleCopyCommands = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCommands(true)
    setTimeout(() => setCopiedCommands(false), 2000)
  }

  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const target = e.currentTarget
      const { selectionStart, value } = target
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
      const currentLine = value.substring(lineStart, selectionStart)

      if (currentLine.trim().startsWith('•') || currentLine.trim().startsWith('-')) {
        e.preventDefault()
        const isBullet = currentLine.trim().startsWith('•')
        const marker = isBullet ? '• ' : '- '

        // If the user pressed enter on an empty bullet line, exit list
        if (currentLine.trim() === '•' || currentLine.trim() === '-') {
          const before = value.substring(0, lineStart)
          const after = value.substring(selectionStart)
          setDescription(before + after)
          return
        }

        const before = value.substring(0, selectionStart)
        const after = value.substring(selectionStart)
        const nextValue = `${before}\n${marker}${after}`
        setDescription(nextValue)
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = selectionStart + marker.length + 1
        }, 0)
      }
    }
  }

  const handleCommandsKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const target = e.currentTarget
      const { selectionStart, value } = target
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
      const currentLine = value.substring(lineStart, selectionStart)

      if (
        currentLine.trim().startsWith('•') ||
        currentLine.trim().startsWith('-') ||
        currentLine.trim().startsWith('$')
      ) {
        e.preventDefault()
        let marker = '• '
        if (currentLine.trim().startsWith('$')) marker = '$ '
        else if (currentLine.trim().startsWith('-')) marker = '- '

        // If the user pressed enter on an empty marker line, exit list
        if (
          currentLine.trim() === '•' ||
          currentLine.trim() === '-' ||
          currentLine.trim() === '$'
        ) {
          const before = value.substring(0, lineStart)
          const after = value.substring(selectionStart)
          setCommands(before + after)
          return
        }

        const before = value.substring(0, selectionStart)
        const after = value.substring(selectionStart)
        const nextValue = `${before}\n${marker}${after}`
        setCommands(nextValue)
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = selectionStart + marker.length + 1
        }, 0)
      }
    }
  }

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
      setCommands(existingTicket.commands || '')
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
      setCommands('')
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
        commands: commands.trim(),
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
    const pill = isDark
      ? 'bg-white/[0.04] text-zinc-200 border-white/[0.08]'
      : 'bg-zinc-100/80 text-zinc-800 border-zinc-200'

    switch (st) {
      case 'TODO':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${pill}`}>
            <svg className="w-3 h-3 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 3">
              <circle cx="12" cy="12" r="9" />
            </svg>
            To Do
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${pill}`}>
            <svg className="w-3 h-3 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9" strokeDasharray="14 14" />
            </svg>
            In Progress
          </span>
        )
      case 'DONE':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${pill}`}>
            <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Completed
          </span>
        )
      case 'BLOCKED':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${pill}`}>
            <svg className="w-3 h-3 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="9" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
            Blocked
          </span>
        )
    }
  }

  const getPriorityBadge = (pr: TicketPriority) => {
    const pill = isDark
      ? 'bg-white/[0.04] border-white/[0.08]'
      : 'bg-zinc-100/80 border-zinc-200'

    switch (pr) {
      case 'URGENT':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${pill} text-rose-600 dark:text-rose-400`}>
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 3v13M12 20v1" strokeLinecap="round" />
            </svg>
            Urgent
          </span>
        )
      case 'HIGH':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${pill} text-amber-600 dark:text-amber-400`}>
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
            High
          </span>
        )
      case 'MEDIUM':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${pill} text-zinc-600 dark:text-zinc-400`}>
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Medium
          </span>
        )
      case 'LOW':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${pill} text-zinc-500 dark:text-zinc-400`}>
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
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
                    {(existingTicket.ticketId || existingTicket.id) && (
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md border bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-white/[0.08]">
                        #{existingTicket.ticketId || existingTicket.id.slice(0, 4)}
                      </span>
                    )}
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${
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
                {onToggleBookmark && existingTicket && (
                  <button
                    type="button"
                    onClick={() => onToggleBookmark(existingTicket)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 border transition cursor-pointer shadow-2xs ${
                      existingTicket.isBookmarked
                        ? isDark
                          ? 'bg-white/[0.1] border-white/[0.2] text-white'
                          : 'bg-zinc-900 border-zinc-900 text-white'
                        : isDark
                          ? 'bg-white/[0.04] border-white/[0.08] hover:border-white/[0.15] text-zinc-300 hover:text-white'
                          : 'bg-zinc-100 border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900'
                    }`}
                    title={existingTicket.isBookmarked ? 'Remove bookmark' : 'Bookmark this ticket'}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill={existingTicket.isBookmarked ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={existingTicket.isBookmarked ? '1.5' : '2'}
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>{existingTicket.isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                  </button>
                )}
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
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border ${
                  isDark ? 'bg-white/[0.04] text-zinc-300 border-white/[0.08]' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}>
                  <svg className="w-3 h-3 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  {existingTicket.category || 'DEV'}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border ${
                  isDark ? 'bg-white/[0.04] text-zinc-300 border-white/[0.08]' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}>
                  <svg className="w-3 h-3 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <div className={`rounded-xl border p-4 space-y-2.5 ${
                isDark ? 'bg-black/30 border-white/[0.08]' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Description & Task Details
                  </span>
                  {existingTicket.description && (
                    <span className="text-[10px] font-mono text-zinc-500">
                      {existingTicket.description.split('\n').filter((l) => l.trim().length > 0).length} entries
                    </span>
                  )}
                </div>
                {existingTicket.description ? (
                  existingTicket.description.split('\n').some((l) => /^[•\-*]/.test(l.trim())) ? (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                      {existingTicket.description.split('\n').map((line, idx) => {
                        const trimmed = line.trim()
                        if (!trimmed) return null
                        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')
                        const cleanContent = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : trimmed

                        return (
                          <div
                            key={idx}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs leading-relaxed transition ${
                              isDark
                                ? 'bg-black/30 border-white/[0.05] text-zinc-300'
                                : 'bg-white border-zinc-200/70 text-zinc-800'
                            }`}
                          >
                            <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs shrink-0 select-none mt-0.5">•</span>
                            <span className="flex-1 whitespace-pre-wrap font-sans">{cleanContent}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto pr-1 custom-scrollbar text-xs sm:text-sm whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200 font-sans">
                      {existingTicket.description}
                    </div>
                  )
                ) : (
                  <p className="text-xs italic text-zinc-400 font-sans">
                    No description provided for this ticket.
                  </p>
                )}
              </div>

              {/* Commands & Extra Details Display Card */}
              <div className={`rounded-xl border p-4 space-y-2.5 ${
                isDark ? 'bg-black/30 border-white/[0.08]' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Commands & Extra Details
                    </span>
                    {existingTicket.commands && (
                      <span className="text-[10px] font-mono text-zinc-500">
                        {existingTicket.commands.split('\n').filter((l) => l.trim().length > 0).length} entries
                      </span>
                    )}
                  </div>
                  {existingTicket.commands && (
                    <button
                      type="button"
                      onClick={() => handleCopyCommands(existingTicket.commands || '')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1 transition cursor-pointer border ${
                        isDark
                          ? 'bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 border-white/[0.08]'
                          : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200 shadow-2xs'
                      }`}
                      title="Copy to clipboard"
                    >
                      {copiedCommands ? (
                        <>
                          <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="text-emerald-400 font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {existingTicket.commands ? (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                    {existingTicket.commands.split('\n').map((line, idx) => {
                      const trimmed = line.trim()
                      if (!trimmed) return null
                      const isCmd = trimmed.startsWith('$')
                      const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')
                      const cleanContent = isCmd
                        ? trimmed.replace(/^\$\s*/, '')
                        : isBullet
                          ? trimmed.replace(/^[•\-*]\s*/, '')
                          : trimmed

                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border font-mono text-xs leading-relaxed transition ${
                            isDark
                              ? 'bg-black/40 border-white/[0.05] text-zinc-200'
                              : 'bg-zinc-100/80 border-zinc-200 text-zinc-800'
                          }`}
                        >
                          <span className={`font-mono text-xs shrink-0 select-none mt-0.5 ${
                            isCmd ? 'text-emerald-500 font-semibold' : 'text-zinc-400 dark:text-zinc-500'
                          }`}>
                            {isCmd ? '$' : '•'}
                          </span>
                          <span className="flex-1 whitespace-pre-wrap select-all">{cleanContent}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs italic text-zinc-400 font-sans">
                    No commands or extra details stored for this ticket.
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
                <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
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
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-semibold tracking-tight">
                      {existingTicket ? 'Edit Ticket' : 'Create New Ticket'}
                    </h2>
                    {existingTicket && (existingTicket.ticketId || existingTicket.id) && (
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md border bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-white/[0.08]">
                        #{existingTicket.ticketId || existingTicket.id.slice(0, 4)}
                      </span>
                    )}
                  </div>
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
              <div className="mt-4 p-3 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
                    Description & Task Details
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setDescription((prev) => (prev ? `${prev}\n• ` : '• '))
                    }}
                    className={`text-[11px] font-medium transition cursor-pointer select-none inline-flex items-center gap-1 ${
                      isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    <span>+ Add Bullet (•)</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder={'Describe requirements, implementation notes, or breakdown, e.g.:\n• Implement authentication flow\n• Add unit tests and verify\n• Deploy to staging'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleDescriptionKeyDown}
                  className={`w-full rounded-xl border p-3.5 text-xs sm:text-sm focus:outline-none transition min-h-[100px] max-h-[220px] resize-y overflow-y-auto leading-relaxed custom-scrollbar font-sans ${inputBg}`}
                />
                <p className="mt-1 text-[10px] text-zinc-500">
                  Tip: Press Enter on a bullet line to automatically continue the next bullet.
                </p>
              </div>

              {/* Row 4: Commands & Extra Details */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
                    Commands & Extra Details
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCommands((prev) => (prev ? `${prev}\n• ` : '• '))
                      }}
                      className={`text-[11px] font-medium transition cursor-pointer select-none inline-flex items-center gap-1 ${
                        isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      <span>+ Add Bullet (•)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCommands((prev) => (prev ? `${prev}\n$ ` : '$ '))
                      }}
                      className={`text-[11px] font-medium transition cursor-pointer select-none inline-flex items-center gap-1 ${
                        isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      <span>+ Add Command ($)</span>
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  placeholder={'Store commands, execution steps, or technical notes, e.g.:\n$ npm run build\n$ npx prisma migrate dev\n• Ensure Redis service is running'}
                  value={commands}
                  onChange={(e) => setCommands(e.target.value)}
                  onKeyDown={handleCommandsKeyDown}
                  className={`w-full rounded-xl border p-3.5 text-xs sm:text-sm focus:outline-none transition min-h-[100px] max-h-[220px] resize-y overflow-y-auto leading-relaxed custom-scrollbar font-mono ${inputBg}`}
                />
                <p className="mt-1 text-[10px] text-zinc-500">
                  Tip: Press Enter on a bullet (•) or command ($) line to automatically continue on the next line.
                </p>
              </div>

              {/* Row 5: Status, Priority, Author */}
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
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      if (existingTicket) {
                        setIsEditing(false)
                      } else {
                        onClose()
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="ticket"
                    size="md"
                    isLoading={loading}
                    leftIcon={
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    }
                  >
                    {existingTicket ? 'Save Changes' : 'Create Ticket'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
