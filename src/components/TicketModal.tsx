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
}

export function TicketModal({
  isOpen,
  onClose,
  onSave,
  existingTicket,
  availableProjects,
  currentProject,
}: TicketModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TicketStatus>('TODO')
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM')
  const [category, setCategory] = useState('DEV')
  const [projectName, setProjectName] = useState('Ticket Portal')
  const [customProject, setCustomProject] = useState('')
  const [isCustomProject, setIsCustomProject] = useState(false)
  const [author, setAuthor] = useState('Nithil')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (existingTicket) {
      setTitle(existingTicket.title)
      setDescription(existingTicket.description || '')
      setStatus(existingTicket.status)
      setPriority(existingTicket.priority)
      setCategory(existingTicket.category)
      setProjectName(existingTicket.projectName || 'Ticket Portal')
      setIsCustomProject(false)
      setAuthor(existingTicket.updatedBy || 'Nithil')
    } else {
      setTitle('')
      setDescription('')
      setStatus('TODO')
      setPriority('MEDIUM')
      setCategory('DEV')
      setProjectName(currentProject !== 'ALL' ? currentProject : 'Ticket Portal')
      setIsCustomProject(false)
      setCustomProject('')
      setAuthor('Nithil')
    }
    setError('')
  }, [existingTicket, isOpen, currentProject])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Ticket title is required')
      return
    }

    const finalProject = isCustomProject
      ? customProject.trim() || 'General'
      : projectName

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
        projectName: finalProject,
        author: author.trim() || 'Nithil',
      })
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save ticket'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </span>
            <h2 className="text-base font-semibold text-slate-100">
              {existingTicket ? 'Edit Ticket' : 'Create New Ticket'}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-200 text-sm p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Project Workspace */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Project Workspace
            </label>
            {!isCustomProject ? (
              <select
                value={projectName}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    setIsCustomProject(true)
                  } else {
                    setProjectName(e.target.value)
                  }
                }}
                className="w-full rounded-lg bg-slate-950/80 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {availableProjects.map((proj) => (
                  <option key={proj} value={proj}>
                    {proj}
                  </option>
                ))}
                <option value="__NEW__">+ New Project Workspace...</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter project name..."
                  value={customProject}
                  onChange={(e) => setCustomProject(e.target.value)}
                  className="flex-1 rounded-lg bg-slate-950 border border-cyan-500 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsCustomProject(false)}
                  className="px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Title *
            </label>
            <input
              type="text"
              placeholder="Brief summary of the task or issue..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-slate-950/80 border border-slate-800 px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Description & Notes
            </label>
            <textarea
              rows={3}
              placeholder="Detailed description, criteria, links, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg bg-slate-950/80 border border-slate-800 p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
            />
          </div>

          {/* Status, Priority, Category */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="w-full rounded-lg bg-slate-950/80 border border-slate-800 px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Completed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full rounded-lg bg-slate-950/80 border border-slate-800 px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg bg-slate-950/80 border border-slate-800 px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="DEV">DEV</option>
                <option value="FEATURE">FEATURE</option>
                <option value="BUG">BUG</option>
                <option value="DATABASE">DATABASE</option>
                <option value="MEETING">MEETING</option>
                <option value="LEARNING">LEARNING</option>
                <option value="PERSONAL">PERSONAL</option>
              </select>
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Assigned Author
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full rounded-lg bg-slate-950/80 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {loading && <span className="animate-spin text-xs">...</span>}
              <span>{existingTicket ? 'Save Changes' : 'Create Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
