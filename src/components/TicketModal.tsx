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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-[#121215] border border-white/[0.08] p-5 sm:p-6 shadow-2xl text-zinc-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-zinc-300 font-mono text-xs">
              TP
            </span>
            <h2 className="text-sm font-semibold text-zinc-100">
              {existingTicket ? 'Edit Ticket' : 'New Ticket'}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition cursor-pointer"
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
          <div className="mt-3.5 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Project Workspace */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
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
                className="w-full rounded-lg bg-black/40 border border-white/[0.08] px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-white/[0.2] cursor-pointer"
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
                  className="flex-1 rounded-lg bg-black/40 border border-white/[0.2] px-3 py-2 text-xs text-zinc-100 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsCustomProject(false)}
                  className="px-3 py-2 text-xs bg-white/[0.06] hover:bg-white/[0.1] rounded-lg text-zinc-300 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Ticket Title *
            </label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/[0.08] px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/[0.2]"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Description & Notes
            </label>
            <textarea
              rows={3}
              placeholder="Add details, links, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/[0.08] p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] resize-none leading-relaxed"
            />
          </div>

          {/* Status, Priority, Category Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="w-full rounded-lg bg-black/40 border border-white/[0.08] px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white/[0.2] cursor-pointer"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Completed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full rounded-lg bg-black/40 border border-white/[0.08] px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white/[0.2] cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/[0.08] px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white/[0.2] cursor-pointer"
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
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Author
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white/[0.2]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : existingTicket ? 'Save Changes' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
