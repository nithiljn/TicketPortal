'use client'

import React, { useEffect } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  theme?: 'dark' | 'light'
  loading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Ticket',
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  theme = 'dark',
  loading = false,
}: ConfirmModalProps) {
  const isDark = theme === 'dark'

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter' && !loading) {
        onConfirm()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onConfirm, loading])

  if (!isOpen) return null

  const modalBg = isDark
    ? 'bg-[#121215] border-white/[0.08] text-zinc-100'
    : 'bg-white border-zinc-200 text-zinc-900'

  const iconBox = isDark
    ? 'bg-white/[0.04] border-white/[0.08] text-zinc-300'
    : 'bg-zinc-100 border-zinc-200 text-zinc-800'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all duration-150 ${modalBg}`}
      >
        <div className="flex items-start gap-4">
          {/* Neutral Clean Icon Box */}
          <div
            className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${iconBox}`}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold tracking-tight">
              {title}
            </h3>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed break-words">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-inherit">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`h-9 px-4 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer disabled:opacity-50 ${
              isDark
                ? 'border-white/[0.08] hover:border-white/[0.16] bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300'
                : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 shadow-2xs'
            }`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-9 px-4 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50 ${
              isDark
                ? 'bg-white hover:bg-zinc-200 text-zinc-950 border-white'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900'
            }`}
          >
            {loading ? (
              <span>Deleting...</span>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5 shrink-0 opacity-80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
