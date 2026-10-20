'use client'

import React, { useEffect } from 'react'

export interface ToastProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message?: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  theme?: 'dark' | 'light' | string
}

export function Toast({
  isOpen,
  onClose,
  title,
  message,
  type,
  duration = 3500,
  theme = 'light',
}: ToastProps) {
  const isDark = theme === 'dark'
  const isError =
    type === 'error' ||
    title.toLowerCase().includes('error') ||
    title.toLowerCase().includes('failed')

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] sm:w-auto min-w-[280px] sm:min-w-[320px] select-none animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div
        className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all ${
          isDark
            ? 'bg-[#121215]/95 border-white/[0.1] text-zinc-100 shadow-2xl shadow-black/60'
            : 'bg-white/95 border-zinc-200/90 text-zinc-900 shadow-xl shadow-zinc-950/8'
        }`}
      >
        {/* Semantic Icon Badge (Clean Monochrome / Semantic, No AI Glow) */}
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            isError
              ? isDark
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-rose-50 text-rose-600 border border-rose-200'
              : isDark
              ? 'bg-white/10 text-zinc-100 border border-white/15'
              : 'bg-zinc-900 text-white'
          }`}
        >
          {isError ? (
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              className="w-3 h-3"
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

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <h4 className="text-xs font-semibold leading-tight tracking-tight">
            {title}
          </h4>
          {message && (
            <p
              className={`mt-1 text-[11px] leading-relaxed break-words ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              {message}
            </p>
          )}
        </div>

        {/* Subtle Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          className={`p-1 rounded-md transition cursor-pointer shrink-0 -mr-1 -mt-1 ${
            isDark
              ? 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06]'
              : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
          }`}
          title="Dismiss notification"
          aria-label="Dismiss notification"
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
    </div>
  )
}
