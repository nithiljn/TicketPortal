'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/Button'

interface VersionModalProps {
  isOpen: boolean
  onClose: () => void
  versions: string[]
  onCreateVersion: (version: string) => Promise<void> | void
  onDeleteVersion?: (version: string) => Promise<void> | void
  theme?: 'dark' | 'light'
}

const QUICK_SUGGESTIONS = [
  'v1.0.0',
  'v1.1.0',
  'v1.2.0',
  'v2.0.0',
  'v2.1.0',
  'v2.2.0',
  'v3.0.0',
]

export function VersionModal({
  isOpen,
  onClose,
  versions,
  onCreateVersion,
  onDeleteVersion,
  theme = 'dark',
}: VersionModalProps) {
  const [versionInput, setVersionInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingVersion, setDeletingVersion] = useState<string | null>(null)
  const [error, setError] = useState('')

  const isDark = theme === 'dark'

  useEffect(() => {
    if (isOpen) {
      setVersionInput('')
      setError('')
      setDeletingVersion(null)
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
    const trimmed = versionInput.trim()

    if (!trimmed) {
      setError('Version name is required.')
      return
    }

    if (versions.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Version "${trimmed}" already exists.`)
      return
    }

    setLoading(true)
    setError('')
    try {
      await onCreateVersion(trimmed)
      setVersionInput('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create version'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (ver: string) => {
    if (!onDeleteVersion) return
    setDeletingVersion(ver)
    setError('')
    try {
      await onDeleteVersion(ver)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete version'
      setError(msg)
    } finally {
      setDeletingVersion(null)
    }
  }

  const availableSuggestions = QUICK_SUGGESTIONS.filter(
    (s) => !versions.some((v) => v.toLowerCase() === s.toLowerCase())
  ).slice(0, 4)

  const borderDivider = isDark ? 'border-white/[0.06]' : 'border-zinc-100'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-2xl p-4 sm:p-6 shadow-2xl border transition-all animate-in zoom-in-95 duration-150 ${
          isDark
            ? 'bg-[#121215] border-white/[0.08] text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-200/50'
        }`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between gap-2.5 pb-4 border-b ${borderDivider}`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark
                  ? 'bg-zinc-800/90 border-white/[0.1] text-zinc-200'
                  : 'bg-zinc-900 border-zinc-800 text-white shadow-xs'
              }`}
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight truncate">
                Manage Release Versions
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">
                Assign tickets to target releases and sprint milestones.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer shrink-0 ${
              isDark
                ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]'
                : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
            }`}
            title="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Existing Versions List */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Active Versions ({versions.length})
            </label>
          </div>
          <div
            className={`max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl border ${
              isDark ? 'bg-black/30 border-white/[0.06]' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            {versions.length === 0 ? (
              <p className="text-xs text-zinc-500 italic text-center py-3">
                No versions created yet. Add one below.
              </p>
            ) : (
              versions.map((ver) => (
                <div
                  key={ver}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs transition ${
                    isDark
                      ? 'bg-white/[0.03] border-white/[0.05] text-zinc-200'
                      : 'bg-white border-zinc-200 text-zinc-800'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5 font-mono font-medium">
                    <svg className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    <span>{ver}</span>
                  </span>
                  {onDeleteVersion && (
                    <button
                      type="button"
                      onClick={() => handleDelete(ver)}
                      disabled={deletingVersion === ver}
                      className="text-zinc-400 hover:text-rose-400 p-1 rounded transition cursor-pointer disabled:opacity-50"
                      title={`Delete version ${ver}`}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {error && (
            <div
              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2.5 animate-in fade-in duration-150 ${
                isDark
                  ? 'bg-white/[0.03] border-white/[0.08] text-zinc-300'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-800'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span className="truncate">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-zinc-400 hover:text-zinc-200 p-0.5 rounded transition cursor-pointer shrink-0"
                title="Dismiss"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Add New Version
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. v1.2.0 or 2026.1-patch"
                value={versionInput}
                onChange={(e) => setVersionInput(e.target.value)}
                maxLength={32}
                autoFocus
                className={`flex-1 h-9.5 rounded-xl border px-3 text-xs font-mono font-medium focus:outline-none transition ${
                  isDark
                    ? 'bg-black/40 border-white/[0.08] text-zinc-100 placeholder-zinc-500 focus:border-white/[0.2]'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
                }`}
              />
              <Button
                type="submit"
                variant="ticket"
                size="sm"
                theme={theme}
                isLoading={loading}
                disabled={!versionInput.trim()}
                className="h-9.5 px-3.5 shrink-0"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Quick Suggestions */}
          {availableSuggestions.length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">
                Quick Suggestions:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availableSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setVersionInput(suggestion)}
                    className={`px-2 py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                      isDark
                        ? 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] text-zinc-300'
                        : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className={`pt-3 border-t flex justify-end gap-2 ${borderDivider}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition cursor-pointer border ${
                isDark
                  ? 'border-white/[0.08] text-zinc-300 hover:bg-white/[0.04]'
                  : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              Done
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
