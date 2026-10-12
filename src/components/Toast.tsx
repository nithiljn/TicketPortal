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
    }, 20)

    return () => clearInterval(interval)
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  // Theme styles
  const toastBg = isDark
    ? 'bg-[#121215] border-white/[0.1] text-zinc-100 shadow-xl shadow-black/50'
    : 'bg-white border-zinc-200 text-zinc-900 shadow-lg shadow-zinc-950/8'

  const iconBox = isDark
    ? 'bg-white/[0.04] border-white/[0.08] text-zinc-200'
    : 'bg-zinc-100 border-zinc-200 text-zinc-800'

  const progressBarTrack = isDark ? 'bg-white/[0.06]' : 'bg-zinc-100'
  const progressBarFill = isDark ? 'bg-white/80' : 'bg-zinc-900'

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 max-w-sm w-[calc(100vw-2.5rem)] sm:w-88 select-none animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div
        className={`relative overflow-hidden rounded-xl border backdrop-blur-md p-3.5 transition-all ${toastBg}`}
      >
        <div className="flex items-start gap-3">
          {/* Neutral Clean Icon Badge */}
          <div
            className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${iconBox}`}
          >
            {type === 'error' ? (
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>

          {/* Toast Message Content */}
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs font-semibold tracking-tight">
              {title}
            </h4>
            {message && (
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 truncate leading-relaxed">
                {message}
              </p>
            )}
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded-md transition cursor-pointer ${
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

        {/* Minimal Theme Progress Bar */}
        <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${progressBarTrack}`}>
          <div
            className={`h-full transition-all ease-linear ${progressBarFill}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
