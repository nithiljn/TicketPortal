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

  const iconBg = isDark
    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
    : 'bg-rose-50 border-rose-200 text-rose-600'

  const cancelBtn = isDark
    ? 'bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.08]'
    : 'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 shadow-xs'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${modalBg}`}
      >
        <div className="flex items-start gap-4">
          {/* Danger Warning Icon */}
          <div
            className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}
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
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-400 leading-relaxed break-words">
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
            className={`px-4 py-2 text-xs font-medium rounded-xl transition cursor-pointer disabled:opacity-50 ${cancelBtn}`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/20 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {loading ? (
              <span>Deleting...</span>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
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
