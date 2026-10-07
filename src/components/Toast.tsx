'use client'

import React, { useEffect, useState } from 'react'

export interface ToastProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message?: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  theme?: 'dark' | 'light'
}

export function Toast({
  isOpen,
  onClose,
  title,
  message,
  type = 'success',
  duration = 3500,
  theme = 'dark',
}: ToastProps) {
  const isDark = theme === 'dark'
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!isOpen) {
      setProgress(100)
      return
    }

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)

      if (elapsed >= duration) {
        clearInterval(interval)
        onClose()
      }
    }, 25)

    return () => clearInterval(interval)
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  // Styles based on theme
  const toastBg = isDark
    ? 'bg-[#121215]/95 border-emerald-500/25 text-zinc-100 shadow-2xl shadow-emerald-950/20'
    : 'bg-white/95 border-emerald-500/30 text-zinc-900 shadow-xl shadow-emerald-500/10'

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] sm:w-96 select-none animate-in fade-in slide-in-from-top-3 duration-200">
      <div
        className={`relative overflow-hidden rounded-2xl border backdrop-blur-md p-4 transition-all ${toastBg}`}
      >
        <div className="flex items-start gap-3">
          {/* Success Checkmark Badge */}
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Toast Message */}
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs sm:text-sm font-semibold tracking-tight text-emerald-400">
              {title}
            </h4>
            {message && (
              <p
                className={`mt-0.5 text-xs truncate ${
                  isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`}
              >
                {message}
              </p>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded-lg transition cursor-pointer ${
              isDark
                ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            title="Dismiss notification"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-800/40">
          <div
            className="h-full bg-emerald-500 transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
