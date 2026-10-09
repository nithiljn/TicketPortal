'use client'

import React, { useState, useEffect } from 'react'

interface WorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateWorkspace: (name: string) => Promise<void>
  existingWorkspaces: string[]
  theme: 'dark' | 'light'
}

const QUICK_SUGGESTIONS = [
  'Mobile App',
  'Payments',
  'Backend API',
  'Design System',
  'DevOps',
  'Analytics',
]

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

  const isDark = theme === 'dark'

  useEffect(() => {
    if (isOpen) {
      setWorkspaceName('')
      setError('')
    }
  }, [isOpen])

  // Keyboard shortcut listener (Esc to close)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

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

  const availableSuggestions = QUICK_SUGGESTIONS.filter(
    (s) => !existingWorkspaces.some((ws) => ws.toLowerCase() === s.toLowerCase())
  ).slice(0, 4)

  const borderDivider = isDark ? 'border-white/[0.06]' : 'border-zinc-100'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border transition-all animate-in zoom-in-95 duration-150 ${
          isDark
            ? 'bg-[#121215] border-white/[0.08] text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b ${borderDivider}`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isDark
                  ? 'bg-zinc-800/90 border border-white/[0.1] text-zinc-200'
                  : 'bg-zinc-900 border border-zinc-800 text-white shadow-xs'
              }`}
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">New Project Workspace</h2>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Organize and scope tickets under a dedicated workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark
                ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            title="Close (Esc)"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-3.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="font-medium text-[11px]">{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`block text-[11px] font-mono font-medium uppercase tracking-wider ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}>
                Workspace Name *
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                {existingWorkspaces.length} active
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="e.g. Mobile App, Payments, Admin Portal"
                value={workspaceName}
                onChange={(e) => {
                  setWorkspaceName(e.target.value)
                  if (error) setError('')
                }}
                autoFocus
                className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 text-xs focus:outline-none transition ${
                  isDark
                    ? 'bg-zinc-900/80 border border-white/[0.08] text-zinc-100 placeholder-zinc-500 focus:border-zinc-400 focus:bg-zinc-900'
                    : 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-800 focus:bg-white'
                }`}
              />
            </div>

            {/* Quick Suggestions */}
            {availableSuggestions.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                  Quick suggestions:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {availableSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setWorkspaceName(suggestion)
                        if (error) setError('')
                      }}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition cursor-pointer ${
                        isDark
                          ? 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border-white/[0.08]'
                          : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border-zinc-200 shadow-2xs'
                      }`}
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-[11px] ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.06] text-zinc-400'
              : 'bg-zinc-50/70 border-zinc-200 text-zinc-600'
          }`}>
            <svg className="w-4 h-4 shrink-0 mt-0.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className="leading-relaxed">
              Tickets and team activity can be mapped directly to this workspace for clean scoping across Inbox, Board, and Dashboard.
            </p>
          </div>

          {/* Actions */}
          <div className={`flex justify-end gap-2.5 pt-3.5 border-t ${borderDivider}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border-white/[0.08]'
                  : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200 shadow-xs'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !workspaceName.trim()}
              className={`px-4 py-2 text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'bg-white hover:bg-zinc-200 text-zinc-950'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
              }`}
            >
              {loading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin text-inherit" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  <span>Creating...</span>
                </>
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
