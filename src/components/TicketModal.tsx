'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Ticket, TicketStatus, TicketPriority } from '@/types'

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
    version?: string
    projectName: string
    author: string
  }) => Promise<void>
  existingTicket?: Ticket | null
  initialMode?: 'view' | 'edit'
  availableProjects: string[]
  availableVersions?: string[]
  currentProject: string
  theme?: 'dark' | 'light'
  onToggleBookmark?: (ticket: Ticket) => Promise<void> | void
  onOpenCreateVersionModal?: () => void
}

export function TicketModal({
  isOpen,
  onClose,
  onSave,
  existingTicket,
  initialMode = 'view',
  availableProjects,
  availableVersions = [],
  currentProject,
  theme = 'dark',
  onToggleBookmark,
  onOpenCreateVersionModal,
}: TicketModalProps) {
  const [isEditing, setIsEditing] = useState(initialMode === 'edit' || !existingTicket)
  const prevIsOpenRef = useRef(false)
  const prevTicketIdRef = useRef<string | undefined>(undefined)
  const prevFormTicketIdRef = useRef<string | undefined>(undefined)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [commands, setCommands] = useState('')
  const [copiedCommands, setCopiedCommands] = useState(false)
  const [status, setStatus] = useState<TicketStatus>('TODO')
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM')
  const [category, setCategory] = useState('DEV')
  const [version, setVersion] = useState('')
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
    const isOpening = isOpen && !prevIsOpenRef.current
    const ticketChanged = existingTicket?.id !== prevTicketIdRef.current

    if (isOpen) {
      if (isOpening || ticketChanged) {
        setIsEditing(!existingTicket || initialMode === 'edit')
      }
    } else {
      prevTicketIdRef.current = undefined
    }
    prevIsOpenRef.current = isOpen
    if (existingTicket?.id) {
      prevTicketIdRef.current = existingTicket.id
    }
  }, [isOpen, existingTicket?.id, initialMode])

  useEffect(() => {
    if (existingTicket) {
      const ticketChanged = existingTicket.id !== prevFormTicketIdRef.current
      if (ticketChanged) {
        prevFormTicketIdRef.current = existingTicket.id
        setTitle(existingTicket.title || '')
        setDescription(existingTicket.description || '')
        setCommands(existingTicket.commands || '')
        setStatus(existingTicket.status)
        setPriority(existingTicket.priority)
        setCategory(existingTicket.category || 'DEV')
        setVersion(existingTicket.version || '')
        setProjectName(
          existingTicket.projectName ||
            (availableProjects[0] || 'General')
        )
        setAuthor(existingTicket.updatedBy || 'James Nithil')
      } else {
        // Same ticket receiving deferred fields (e.g. description/commands loaded via background query)
        if (existingTicket.description !== undefined && !description) {
          setDescription(existingTicket.description || '')
        }
        if (existingTicket.commands !== undefined && !commands) {
          setCommands(existingTicket.commands || '')
        }
      }
    } else {
      prevFormTicketIdRef.current = undefined
      setTitle('')
      setDescription('')
      setCommands('')
      setStatus('TODO')
      setPriority('MEDIUM')
      setCategory('DEV')
      setVersion('')
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

  // Auto-select a newly created version if one was created while the modal is open
  const prevVersionsRef = useRef<string[]>(availableVersions)
  useEffect(() => {
    if (!isOpen) return
    const prev = prevVersionsRef.current
    if (availableVersions.length > prev.length) {
      const added = availableVersions.find((v) => !prev.includes(v))
      if (added) {
        setVersion(added)
      }
    }
    prevVersionsRef.current = availableVersions
  }, [availableVersions, isOpen])

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
        version: version.trim() || undefined,
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

  // Apple Design System Surface & Input Tokens (DESIGN.md)
  const overlayBg = 'bg-black/40 backdrop-blur-md'
  const modalBg = isDark
    ? 'bg-[#1c1c1e] border-white/[0.08] text-[#f5f5f7]'
    : 'bg-white border-[#e5e5ea] text-[#1d1d1f]'
  const cardSectionBg = isDark
    ? 'bg-white/[0.03] border-white/[0.08]'
    : 'bg-[#f5f5f7] border-[#e5e5ea]'
  const inputBg = isDark
    ? 'bg-white/[0.04] border-white/[0.08] text-[#f5f5f7] placeholder-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/20'
    : 'bg-white border-[#e5e5ea] text-[#1d1d1f] placeholder-[#86868b] focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 shadow-2xs'
  const labelColor = isDark ? 'text-[#a1a1a6]' : 'text-[#86868b]'
  const borderBottom = isDark ? 'border-white/[0.08]' : 'border-[#e5e5ea]'
  const appleGhostBtn = isDark
    ? 'border-white/[0.08] hover:border-white/[0.18] bg-white/[0.04] hover:bg-white/[0.08] text-[#f5f5f7]'
    : 'border-[#e5e5ea] hover:border-[#d2d2d7] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] shadow-2xs'
  const appleCapsule = isDark
    ? 'bg-white/[0.08] text-[#f5f5f7] border-white/[0.08]'
    : 'bg-[#f5f5f7] text-[#1d1d1f] border-black/[0.06]'

  const getStatusBadge = (st: TicketStatus) => {
    const icon = {
      TODO: (
        <svg className="w-3 h-3 opacity-50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
        </svg>
      ),
      IN_PROGRESS: (
        <svg className="w-3 h-3 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" strokeDasharray="14 14" />
        </svg>
      ),
      DONE: (
        <svg className="w-3 h-3 opacity-70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      BLOCKED: (
        <svg className="w-3 h-3 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      ),
    }[st]

    const label = {
      TODO: 'To Do',
      IN_PROGRESS: 'In Progress',
      DONE: 'Completed',
      BLOCKED: 'Blocked',
    }[st]

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-normal border ${appleCapsule}`}>
        {icon}
        {label}
      </span>
    )
  }

  const getPriorityBadge = (pr: TicketPriority) => {
    const icon = {
      URGENT: (
        <svg className="w-3 h-3 opacity-70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 3v13M12 20v1" />
        </svg>
      ),
      HIGH: (
        <svg className="w-3 h-3 opacity-70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      ),
      MEDIUM: (
        <svg className="w-3 h-3 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      LOW: (
        <svg className="w-3 h-3 opacity-50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      ),
    }[pr]

    const label = {
      URGENT: 'Urgent',
      HIGH: 'High',
      MEDIUM: 'Medium',
      LOW: 'Low',
    }[pr]

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-normal border ${appleCapsule}`}>
        {icon}
        {label}
      </span>
    )
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
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 ${overlayBg} overflow-y-auto animate-in fade-in duration-150`}>
      <div
        className={`w-full max-w-2xl sm:max-w-3xl rounded-[24px] border shadow-2xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto transition-all ${modalBg}`}
      >
        {/* ======================================================== */}
        {/* MODE 1: READ-ONLY VIEW MODE                              */}
        {/* ======================================================== */}
        {!isEditing && existingTicket ? (
          <div>
            {/* View Header */}
            <div className={`pb-4 border-b ${borderBottom}`}>
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-white/[0.08] border border-white/[0.1] text-[#f5f5f7]' : 'bg-[#f5f5f7] border border-black/[0.08] text-[#1d1d1f]'
                    }`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                      <line x1="13" y1="5" x2="13" y2="7" />
                      <line x1="13" y1="11" x2="13" y2="13" />
                      <line x1="13" y1="17" x2="13" y2="19" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                        Ticket Details
                      </h2>
                      {(existingTicket.ticketId || existingTicket.id) && (
                        <span className={`font-mono text-xs font-normal px-2.5 py-0.5 rounded-full border ${appleCapsule} shrink-0`}>
                          #{existingTicket.ticketId || existingTicket.id.slice(0, 4)}
                        </span>
                      )}
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${appleCapsule}`}>
                        View Only
                      </span>
                    </div>
                    <p className="text-xs text-[#86868b] mt-0.5 truncate">
                      Workspace: <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">{existingTicket.projectName}</span>
                    </p>
                  </div>
                </div>

                {/* Right controls: desktop has bookmark + edit + close; mobile has close */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <div className="hidden sm:flex items-center gap-2">
                    {onToggleBookmark && existingTicket && (
                      <button
                        type="button"
                        onClick={() => onToggleBookmark(existingTicket)}
                        className={`px-3.5 py-1.5 text-xs font-normal rounded-full flex items-center gap-1.5 border transition-all duration-150 active:scale-95 cursor-pointer ${
                          existingTicket.isBookmarked
                            ? isDark
                              ? 'bg-white border-white text-zinc-950 shadow-sm'
                              : 'bg-zinc-950 border-zinc-950 text-white shadow-sm'
                            : appleGhostBtn
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
                      className={`px-4 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer shadow-sm ${
                        isDark
                          ? 'bg-white hover:bg-zinc-100 text-zinc-950'
                          : 'bg-zinc-950 hover:bg-zinc-800 text-white'
                      }`}
                      title="Click to edit this ticket"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span>Edit Ticket</span>
                    </button>
                  </div>

                  <button
                    onClick={onClose}
                    type="button"
                    className="w-8 h-8 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-[#f5f5f7] dark:bg-white/[0.06] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white flex items-center justify-center transition cursor-pointer active:scale-95"
                    title="Close (Esc)"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mobile Quick Action Buttons Bar */}
              <div className="flex sm:hidden items-center gap-2 mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                {onToggleBookmark && existingTicket && (
                  <button
                    type="button"
                    onClick={() => onToggleBookmark(existingTicket)}
                    className={`flex-1 py-2 px-3 text-xs font-normal rounded-full flex items-center justify-center gap-1.5 border transition-all duration-150 active:scale-95 cursor-pointer ${
                      existingTicket.isBookmarked
                        ? isDark
                          ? 'bg-white border-white text-zinc-950 shadow-sm'
                          : 'bg-zinc-950 border-zinc-950 text-white shadow-sm'
                        : appleGhostBtn
                    }`}
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
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer shadow-sm ${
                    isDark
                      ? 'bg-white hover:bg-zinc-100 text-zinc-950'
                      : 'bg-zinc-950 hover:bg-zinc-800 text-white'
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

            {/* View Mode Body */}
            <div className="mt-4 sm:mt-5 space-y-4 sm:space-y-5">
              {/* Badges Strip */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {getStatusBadge(existingTicket.status)}
                {getPriorityBadge(existingTicket.priority)}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${appleCapsule}`}>
                  <svg className="w-3 h-3 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  {existingTicket.category || 'DEV'}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${appleCapsule}`}>
                  <svg className="w-3 h-3 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{existingTicket.projectName}</span>
                </span>
                {existingTicket.version && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${appleCapsule}`}>
                    <svg className="w-3 h-3 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    <span>{existingTicket.version}</span>
                  </span>
                )}
              </div>

              {/* Title Display */}
              <div>
                <h1 className="text-base sm:text-xl font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] leading-snug break-words">
                  {existingTicket.title}
                </h1>
              </div>

              {/* Description Display Card */}
              <div className={`rounded-[16px] border p-3.5 sm:p-4 space-y-2.5 ${cardSectionBg}`}>
                <div className="flex items-center justify-between">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
                    Description & Task Details
                  </span>
                  {existingTicket.description && (
                    <span className="text-[10px] font-mono text-[#86868b]">
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
                            className={`flex items-start gap-2.5 p-2 rounded-[10px] border text-xs leading-relaxed transition ${
                              isDark
                                ? 'bg-black/20 border-white/[0.05] text-[#ebebf5]'
                                : 'bg-white border-black/[0.06] text-[#1d1d1f]'
                            }`}
                          >
                            <span className="text-[#86868b] font-mono text-xs shrink-0 select-none mt-0.5">•</span>
                            <span className="flex-1 whitespace-pre-wrap font-sans break-words">{cleanContent}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto pr-1 custom-scrollbar text-xs sm:text-sm whitespace-pre-wrap leading-relaxed text-[#1d1d1f] dark:text-[#f5f5f7] font-sans break-words">
                      {existingTicket.description}
                    </div>
                  )
                ) : existingTicket.description === undefined ? (
                  <div className="flex items-center gap-2 py-3 justify-center text-xs text-[#86868b]">
                    <svg className="w-3.5 h-3.5 animate-spin text-[#86868b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10" />
                    </svg>
                    <span>Loading ticket details...</span>
                  </div>
                ) : (
                  <p className="text-xs italic text-[#86868b] font-sans">
                    No description provided for this ticket.
                  </p>
                )}
              </div>

              {/* Commands & Extra Details Display Card */}
              <div className={`rounded-[16px] border p-3.5 sm:p-4 space-y-2.5 ${cardSectionBg}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
                      Commands & Extra Details
                    </span>
                    {existingTicket.commands && (
                      <span className="text-[10px] font-mono text-[#86868b]">
                        {existingTicket.commands.split('\n').filter((l) => l.trim().length > 0).length} entries
                      </span>
                    )}
                  </div>
                  {existingTicket.commands && (
                    <button
                      type="button"
                      onClick={() => handleCopyCommands(existingTicket.commands || '')}
                      className={`h-7 px-3 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer border ${appleGhostBtn}`}
                      title="Copy to clipboard"
                    >
                      {copiedCommands ? (
                        <>
                          <svg className="w-3 h-3 text-[#2997ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="text-[#2997ff] font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                          className={`flex items-start gap-2.5 p-2 rounded-[10px] border font-mono text-xs leading-relaxed transition ${
                            isDark
                              ? 'bg-black/30 border-white/[0.05] text-[#ebebf5]'
                              : 'bg-white border-black/[0.06] text-[#1d1d1f]'
                          }`}
                        >
                          <span className="font-mono text-xs shrink-0 select-none mt-0.5 text-[#86868b] font-semibold">
                            {isCmd ? '$' : '•'}
                          </span>
                          <span className="flex-1 whitespace-pre-wrap select-all break-all">{cleanContent}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : existingTicket.commands === undefined ? (
                  <div className="flex items-center gap-2 py-3 justify-center text-xs text-[#86868b]">
                    <svg className="w-3.5 h-3.5 animate-spin text-[#86868b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10" />
                    </svg>
                    <span>Loading commands...</span>
                  </div>
                ) : (
                  <p className="text-xs italic text-[#86868b] font-sans">
                    No commands or extra details stored for this ticket.
                  </p>
                )}
              </div>

              {/* Metadata Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className={`p-3.5 rounded-[16px] border ${cardSectionBg}`}>
                  <span className="block text-[10px] text-[#86868b] font-semibold uppercase tracking-wider mb-1">
                    Assignee / Author
                  </span>
                  <span className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] truncate block">
                    {existingTicket.updatedBy || existingTicket.createdBy || 'James Nithil'}
                  </span>
                </div>

                <div className={`p-3.5 rounded-[16px] border ${cardSectionBg}`}>
                  <span className="block text-[10px] text-[#86868b] font-semibold uppercase tracking-wider mb-1">
                    Created At
                  </span>
                  <span className="text-xs font-mono text-[#86868b] block truncate">
                    {formatDateTime(existingTicket.createdAt)}
                  </span>
                </div>

                <div className={`p-3.5 rounded-[16px] border ${cardSectionBg}`}>
                  <span className="block text-[10px] text-[#86868b] font-semibold uppercase tracking-wider mb-1">
                    Last Updated
                  </span>
                  <span className="text-xs font-mono text-[#86868b] block truncate">
                    {existingTicket.updatedAt ? formatDateTime(existingTicket.updatedAt) : 'Just now'}
                  </span>
                </div>
              </div>
            </div>

            {/* View Mode Footer */}
            <div className={`flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 mt-5 sm:mt-6 border-t ${borderBottom}`}>
              <div className="flex items-center gap-1.5 text-[11px] text-[#86868b] justify-center sm:justify-start">
                <svg className="w-3.5 h-3.5 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="truncate">View mode • Editing disabled until Edit is clicked</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 sm:flex-none px-5 py-2 text-xs font-medium rounded-full transition-all duration-150 active:scale-95 cursor-pointer text-center ${appleGhostBtn}`}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`flex-1 sm:flex-none px-5 py-2 text-xs font-semibold rounded-full shadow-sm transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                    isDark
                      ? 'bg-white hover:bg-zinc-100 text-zinc-950'
                      : 'bg-zinc-950 hover:bg-zinc-800 text-white'
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
            <div className={`pb-4 border-b ${borderBottom}`}>
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-white/[0.08] border border-white/[0.1] text-[#f5f5f7]' : 'bg-[#f5f5f7] border border-black/[0.08] text-[#1d1d1f]'
                    }`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                      <line x1="13" y1="5" x2="13" y2="7" />
                      <line x1="13" y1="11" x2="13" y2="13" />
                      <line x1="13" y1="17" x2="13" y2="19" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="text-base sm:text-lg font-semibold tracking-tight truncate text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {existingTicket ? 'Edit Ticket' : 'Create New Ticket'}
                      </h2>
                      {existingTicket && (existingTicket.ticketId || existingTicket.id) && (
                        <span className={`font-mono text-xs font-normal px-2.5 py-0.5 rounded-full border ${appleCapsule} shrink-0`}>
                          #{existingTicket.ticketId || existingTicket.id.slice(0, 4)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#86868b] mt-0.5 truncate">
                      {existingTicket
                        ? 'Update ticket details and maintain your project status'
                        : 'Specify ticket details, assign workspace, and track delivery'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {existingTicket && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className={`hidden sm:inline-flex px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-150 active:scale-95 cursor-pointer ${appleGhostBtn}`}
                    >
                      Back to View
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    type="button"
                    className="w-8 h-8 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-[#f5f5f7] dark:bg-white/[0.06] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white flex items-center justify-center transition cursor-pointer active:scale-95"
                    title="Close (Esc)"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {existingTicket && (
                <div className="sm:hidden mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className={`w-full py-2 px-3 text-xs font-medium rounded-full transition-all duration-150 active:scale-95 cursor-pointer text-center ${appleGhostBtn}`}
                  >
                    Back to View
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div
                className={`mt-4 px-3.5 py-2.5 rounded-[12px] border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150 ${
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.08] text-[#f5f5f7]'
                    : 'bg-[#f5f5f7] border-[#e5e5ea] text-[#1d1d1f]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="truncate">{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white p-0.5 rounded-full transition cursor-pointer shrink-0"
                  title="Dismiss"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            <form id="ticket-modal-form" onSubmit={handleSubmit} className="mt-5 space-y-4 sm:space-y-5">
              {/* Row 1: Workspace Selection, Category & Version (3-Column Clean Alignment) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>
                    Workspace <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className={`w-full h-10 rounded-[12px] border px-3 py-2 text-xs font-medium focus:outline-none transition cursor-pointer appearance-none ${inputBg}`}
                    >
                      {availableProjects.length === 0 ? (
                        <option value="General" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>
                          General
                        </option>
                      ) : (
                        availableProjects.map((proj) => (
                          <option key={proj} value={proj} className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>
                            {proj}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#86868b]">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`w-full h-10 rounded-[12px] border px-3 py-2 text-xs font-medium focus:outline-none transition cursor-pointer appearance-none ${inputBg}`}
                    >
                      <option value="DEV" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>DEV</option>
                      <option value="FEATURE" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>FEATURE</option>
                      <option value="BUG" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>BUG</option>
                      <option value="DATABASE" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>DATABASE</option>
                      <option value="MEETING" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>MEETING</option>
                      <option value="LEARNING" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>LEARNING</option>
                      <option value="PERSONAL" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>PERSONAL</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#86868b]">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`block text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
                      Version
                    </label>
                    {onOpenCreateVersionModal && (
                      <button
                        type="button"
                        onClick={onOpenCreateVersionModal}
                        className={`text-[10px] font-medium transition cursor-pointer ${
                          isDark ? 'text-[#2997ff] hover:underline' : 'text-[#0071e3] hover:underline'
                        }`}
                        title="Create new version"
                      >
                        + New
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className={`w-full h-10 rounded-[12px] border px-3 py-2 text-xs font-mono font-medium focus:outline-none transition cursor-pointer appearance-none ${inputBg}`}
                    >
                      <option value="" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>
                        None (Unassigned)
                      </option>
                      {version && !availableVersions.includes(version) && (
                        <option value={version} className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>
                          {version}
                        </option>
                      )}
                      {availableVersions.map((v) => (
                        <option key={v} value={v} className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#86868b]">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Ticket Title */}
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>
                  Ticket Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Implement OAuth authentication flow and JWT validation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full h-11 rounded-[12px] border px-3.5 text-xs sm:text-sm font-medium focus:outline-none transition ${inputBg}`}
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
                    className={`h-7 px-3 rounded-full border text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer select-none inline-flex items-center gap-1.5 ${appleGhostBtn}`}
                  >
                    <svg className="w-3.5 h-3.5 text-[#86868b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add Bullet (•)</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder={'Describe requirements, implementation notes, or breakdown, e.g.:\n• Implement authentication flow\n• Add unit tests and verify\n• Deploy to staging'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleDescriptionKeyDown}
                  className={`w-full rounded-[12px] border p-3.5 text-xs sm:text-sm focus:outline-none transition min-h-[100px] max-h-[220px] resize-y overflow-y-auto leading-relaxed custom-scrollbar font-sans ${inputBg}`}
                />
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
                      className={`h-7 px-3 rounded-full border text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer select-none inline-flex items-center gap-1.5 ${appleGhostBtn}`}
                    >
                      <svg className="w-3.5 h-3.5 text-[#86868b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Add Bullet (•)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCommands((prev) => (prev ? `${prev}\n$ ` : '$ '))
                      }}
                      className={`h-7 px-3 rounded-full border text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer select-none inline-flex items-center gap-1.5 ${appleGhostBtn}`}
                    >
                      <span className="font-mono text-xs font-semibold text-[#86868b]">$</span>
                      <span>Add Command</span>
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  placeholder={'Store commands, execution steps, or technical notes, e.g.:\n$ npm run build\n$ npx prisma migrate dev\n• Ensure Redis service is running'}
                  value={commands}
                  onChange={(e) => setCommands(e.target.value)}
                  onKeyDown={handleCommandsKeyDown}
                  className={`w-full rounded-[12px] border p-3.5 text-xs sm:text-sm focus:outline-none transition min-h-[100px] max-h-[220px] resize-y overflow-y-auto leading-relaxed custom-scrollbar font-mono ${inputBg}`}
                />
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
                      className={`w-full h-10 rounded-[12px] border px-3 py-2 text-xs font-medium focus:outline-none transition cursor-pointer appearance-none ${inputBg}`}
                    >
                      <option value="TODO" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>To Do</option>
                      <option value="IN_PROGRESS" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>In Progress</option>
                      <option value="DONE" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>Completed</option>
                      <option value="BLOCKED" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>Blocked</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#86868b]">
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
                      className={`w-full h-10 rounded-[12px] border px-3 py-2 text-xs font-medium focus:outline-none transition cursor-pointer appearance-none ${inputBg}`}
                    >
                      <option value="LOW" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>Low</option>
                      <option value="MEDIUM" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>Medium</option>
                      <option value="HIGH" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>High</option>
                      <option value="URGENT" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>Urgent</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#86868b]">
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
                    className={`w-full h-10 rounded-[12px] border px-3.5 py-2 text-xs font-medium focus:outline-none transition ${inputBg}`}
                  />
                </div>
              </div>

              {/* Footer & Actions */}
              <div className={`flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t ${borderBottom}`}>
                <div className="flex items-center gap-1.5 text-[11px] text-[#86868b]">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] font-mono text-[10px]">
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
                    className={`px-5 py-2 text-xs font-medium rounded-full transition-all duration-150 active:scale-95 cursor-pointer text-center ${appleGhostBtn}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-xs font-semibold rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white active:scale-95 shadow-sm transition-all duration-150 cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    <span>{existingTicket ? 'Save Changes' : 'Create Ticket'}</span>
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
