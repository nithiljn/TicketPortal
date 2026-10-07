'use client'

import React, { useState } from 'react'

interface WorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateWorkspace: (name: string) => Promise<void>
  existingWorkspaces: string[]
  theme: 'dark' | 'light'
}

export function WorkspaceModal({
  isOpen,
  onClose,
  onCreateWorkspace,
  existingWorkspaces,
  theme,
}: WorkspaceModalProps) {
  const [workspaceName, setWorkspaceName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const isDark = theme === 'dark'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = workspaceName.trim()

    if (!trimmed) {
      setError('Workspace name is required.')
      return
    }

    if (
      existingWorkspaces.some(
        (ws) => ws.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setError(`Workspace "${trimmed}" already exists.`)
      return
    }

    setLoading(true)
    setError('')
    try {
      await onCreateWorkspace(trimmed)
      setWorkspaceName('')
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create workspace'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all ${
          isDark
            ? 'bg-[#121215] border-white/[0.08] text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-100 text-sky-600'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold">New Project Workspace</h2>
              <p className="text-[11px] text-zinc-500">
                Create a distinct workspace to organize tickets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Workspace Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Mobile App, Payments, Admin Portal"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              autoFocus
              className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition ${
                isDark
                  ? 'bg-black/40 border border-white/[0.08] text-zinc-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20'
                  : 'bg-zinc-50 border border-zinc-200 text-zinc-900 focus:border-sky-600 focus:ring-1 focus:ring-sky-600/20'
              }`}
            />
            <p className="mt-1.5 text-[11px] text-zinc-500">
              Tickets can be mapped directly to this workspace for clean facet filtering.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-inherit">
            <button
              type="button"
              onClick={onClose}
              className={`px-3.5 py-2 text-xs rounded-xl transition cursor-pointer ${
                isDark
                  ? 'bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {loading ? (
                <span>Creating...</span>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Create Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
