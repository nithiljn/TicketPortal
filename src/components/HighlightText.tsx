'use client'

import React from 'react'

interface HighlightTextProps {
  text: string
  query?: string
  className?: string
  highlightClassName?: string
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function HighlightText({
  text,
  query,
  className = '',
  highlightClassName = 'bg-amber-300/90 text-amber-950 dark:bg-amber-400/30 dark:text-amber-200 rounded-[3px] px-1 py-0.5 font-semibold ring-1 ring-amber-400/60 dark:ring-amber-400/40',
}: HighlightTextProps) {
  if (!text) return null
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>
  }

  // Remove leading '#' if user searched e.g. '#1035'
  const cleanQuery = query.trim().replace(/^#/, '').trim()
  if (!cleanQuery) {
    return <span className={className}>{text}</span>
  }

  try {
    const regex = new RegExp(`(${escapeRegExp(cleanQuery)})`, 'gi')
    const parts = text.split(regex)

    if (parts.length <= 1) {
      return <span className={className}>{text}</span>
    }

    return (
      <span className={className}>
        {parts.map((part, idx) => {
          const isMatch = part.toLowerCase() === cleanQuery.toLowerCase()
          return isMatch ? (
            <span
              key={idx}
              className={highlightClassName}
            >
              {part}
            </span>
          ) : (
            <React.Fragment key={idx}>{part}</React.Fragment>
          )
        })}
      </span>
    )
  } catch {
    return <span className={className}>{text}</span>
  }
}
