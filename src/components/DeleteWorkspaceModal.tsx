'use client'

import React, { useState, useEffect } from 'react'

interface DeleteWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceName: string
  ticketCount?: number
  onConfirmDelete: (workspaceName: string) => Promise<void>
  theme: 'dark' | 'light'
}

export function DeleteWorkspaceModal({
  isOpen,
  onClose,
  workspaceName,
  ticketCount = 0,
  onConfirmDelete,
  theme,
}: DeleteWorkspaceModalProps) {
  const [confirmInput, setConfirmInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isDark = theme === 'dark'
  const isMatch = confirmInput.trim() === workspaceName

  useEffect(() => {
    if (isOpen) {
      setConfirmInput('')
      setError('')
      setLoading(false)
    }
  }, [isOpen, workspaceName])

  // Keyboard accessibility (Esc to cancel)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, loading])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isMatch || loading) return

    setLoading(true)
    setError('')
    try {
      await onConfirmDelete(workspaceName)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete workspace'
      setError(msg)
      setLoading(false)
    }
  }

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
        <div className={`flex items-start justify-between pb-4 border-b ${borderDivider}`}>
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isDark
                  ? 'bg-zinc-800/90 border border-white/[0.1] text-zinc-200'
                  : 'bg-zinc-900 border border-zinc-800 text-white shadow-xs'
              }`}
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                Delete Workspace
              </h3>
              <p className={`text-[11px] mt-0.5 leading-snug ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">"{workspaceName}"</span>?
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            type="button"
            className={`p-1.5 rounded-lg transition cursor-pointer disabled:opacity-50 ${
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

        {/* Warning Alert Note */}
        <div
          className={`mt-4 p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
            isDark
              ? 'bg-zinc-900/60 border-white/[0.08] text-zinc-300'
              : 'bg-zinc-50 border-zinc-200 text-zinc-700'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
              isDark
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="space-y-0.5 flex-1">
            <span className="font-semibold block text-[11px] uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Irreversible Action
            </span>
            <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              This action cannot be undone. All {ticketCount > 0 ? `${ticketCount} ticket(s)` : 'tickets'} scoped under this workspace will be removed.
            </p>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Confirmation Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`block text-[11px] font-mono font-medium uppercase tracking-wider ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}>
                Confirm Workspace Name
              </label>
              {confirmInput && (
                <span className={`text-[10px] font-mono font-medium ${
                  isMatch ? 'text-emerald-500' : 'text-zinc-400'
                }`}>
                  {isMatch ? '✓ Name confirmed' : 'Typing...'}
                </span>
              )}
            </div>

            <p className={`text-[11px] mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Please type <code className="px-2 py-0.5 rounded-md font-mono font-medium text-xs bg-zinc-100 dark:bg-white/[0.06] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/[0.08] select-all">{workspaceName}</code> to confirm:
            </p>

            <input
              type="text"
              autoFocus
              placeholder={workspaceName}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none border transition ${
                isDark
                  ? 'bg-zinc-900/80 border-white/[0.08] text-zinc-100 placeholder-zinc-600 focus:border-zinc-400 focus:bg-zinc-900'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-800 focus:bg-white'
              } ${isMatch ? 'border-emerald-500/60 focus:border-emerald-500' : ''}`}
            />
          </div>

          {/* Action Buttons */}
          <div className={`flex justify-end items-center gap-2.5 pt-3.5 border-t ${borderDivider}`}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border-white/[0.08]'
                  : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200 shadow-xs'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isMatch || loading}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
                isMatch && !loading
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer active:scale-[0.99]'
                  : isDark
                  ? 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed'
                  : 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Delete Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
