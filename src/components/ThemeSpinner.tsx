'use client'

import React from 'react'

interface ThemeSpinnerProps {
  theme?: 'dark' | 'light'
  title?: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ThemeSpinner({
  theme = 'dark',
  title = 'Loading workspace data...',
  subtitle = 'TicketFlow • Syncing with server',
  size = 'md',
}: ThemeSpinnerProps) {
  const isDark = theme === 'dark'

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }[size]

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 select-none animate-in fade-in duration-150">
      <div className="relative mb-3 flex items-center justify-center">
        {/* Subtle glowing ambient pulse ring in dark mode */}
        {isDark && (
          <div className="absolute w-12 h-12 rounded-full bg-white/[0.04] blur-sm animate-pulse" />
        )}

        {/* Clean, high-contrast Linear/Vercel-style SVG spinner */}
        <svg
          className={`${sizeClasses} animate-spin ${
            isDark ? 'text-zinc-100' : 'text-zinc-900'
          }`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className={isDark ? 'text-white/[0.12]' : 'text-zinc-200'}
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>

      {title && (
        <p
          className={`text-xs font-semibold tracking-wide ${
            isDark ? 'text-zinc-200' : 'text-zinc-900'
          }`}
        >
          {title}
        </p>
      )}

      {subtitle && (
        <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  )
}
