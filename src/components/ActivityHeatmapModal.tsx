'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { DailyNote } from '@/types'

interface ActivityHeatmapModalProps {
  isOpen: boolean
  onClose: () => void
  notes: DailyNote[]
  theme?: 'dark' | 'light'
  onSelectDate?: (date: string) => void
}

// Parse checklist items from note content
function parseNoteCompletion(content: string) {
  const lines = content.split('\n')
  let total = 0
  let completed = 0

  for (const line of lines) {
    const match = line.match(/^\s*-\s*\[([ xX])\]/)
    if (match) {
      total++
      if (match[1].toLowerCase() === 'x') {
        completed++
      }
    }
  }

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  return { total, completed, percentage }
}

// Format Date object to YYYY-MM-DD
function formatLocalDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function ActivityHeatmapModal({
  isOpen,
  onClose,
  notes,
  theme = 'dark',
  onSelectDate,
}: ActivityHeatmapModalProps) {
  const isDark = theme === 'dark'

  // Keyboard navigation for escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Build aggregate daily task statistics
  const dailyStatsMap = useMemo(() => {
    const map = new Map<string, { total: number; completed: number; percentage: number; count: number }>()

    for (const note of notes) {
      const stats = parseNoteCompletion(note.content)
      const existing = map.get(note.date)
      if (existing) {
        const total = existing.total + stats.total
        const completed = existing.completed + stats.completed
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
        map.set(note.date, { total, completed, percentage, count: existing.count + 1 })
      } else {
        map.set(note.date, {
          total: stats.total,
          completed: stats.completed,
          percentage: stats.percentage,
          count: 1,
        })
      }
    }

    return map
  }, [notes])

  // Generate GitHub style 52-week calendar grid aligned Sun-Sat
  const { weeks, monthLabels, todayKey } = useMemo(() => {
    const today = new Date()
    const todayKey = formatLocalDate(today)

    // Calculate Saturday of current week (end of GitHub week)
    const currentDay = today.getDay()
    const daysToSaturday = 6 - currentDay
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + daysToSaturday)

    // 52 weeks = 364 days
    const totalDays = 52 * 7
    const startDate = new Date(endDate)
    startDate.setDate(endDate.getDate() - (totalDays - 1))

    const generatedWeeks: Array<Array<{ dateKey: string; dateObj: Date; isFuture: boolean }>> = []
    const months: Array<{ label: string; weekIndex: number }> = []
    let lastMonth = -1

    for (let w = 0; w < 52; w++) {
      const weekDays: Array<{ dateKey: string; dateObj: Date; isFuture: boolean }> = []

      for (let d = 0; d < 7; d++) {
        const offset = w * 7 + d
        const dayDate = new Date(startDate)
        dayDate.setDate(startDate.getDate() + offset)

        const dateKey = formatLocalDate(dayDate)
        const isFuture = dateKey > todayKey

        // Register month labels when month starts near top of column
        if (d === 0) {
          const m = dayDate.getMonth()
          if (m !== lastMonth) {
            lastMonth = m
            months.push({
              label: dayDate.toLocaleString('default', { month: 'short' }),
              weekIndex: w,
            })
          }
        }

        weekDays.push({ dateKey, dateObj: dayDate, isFuture })
      }

      generatedWeeks.push(weekDays)
    }

    return { weeks: generatedWeeks, monthLabels: months, todayKey }
  }, [])

  // Calculate consistency metrics
  const summaryMetrics = useMemo(() => {
    let perfectDays = 0
    let totalLoggedDays = 0

    dailyStatsMap.forEach((stats) => {
      if (stats.count > 0) totalLoggedDays++
      if (stats.total > 0 && stats.completed === stats.total) perfectDays++
    })

    const consistencyRate = totalLoggedDays > 0 ? Math.round((perfectDays / totalLoggedDays) * 100) : 0

    // Compute streak
    let streak = 0
    const cursor = new Date()
    let checkKey = formatLocalDate(cursor)
    let stats = dailyStatsMap.get(checkKey)

    // Allow streak to continue from yesterday if today is not logged yet
    if (!stats || stats.total === 0 || stats.completed < stats.total) {
      cursor.setDate(cursor.getDate() - 1)
      checkKey = formatLocalDate(cursor)
      stats = dailyStatsMap.get(checkKey)
    }

    while (stats && stats.total > 0 && stats.completed === stats.total) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
      checkKey = formatLocalDate(cursor)
      stats = dailyStatsMap.get(checkKey)
    }

    return { totalLoggedDays, perfectDays, consistencyRate, streak }
  }, [dailyStatsMap])

  // Selected date details in preview pane
  const [selectedDayKey, setSelectedDayKey] = useState<string>(todayKey)

  useEffect(() => {
    if (isOpen) {
      setSelectedDayKey(todayKey)
    }
  }, [isOpen, todayKey])

  if (!isOpen) return null

  const selectedStats = dailyStatsMap.get(selectedDayKey)

  // GitHub realistic color palette tokens
  const modalContainer = isDark
    ? 'bg-[#0d1117] border-[#30363d] text-[#c9d1d9]'
    : 'bg-white border-[#d0d7de] text-[#24292f]'
  const headerBorder = isDark ? 'border-[#30363d]' : 'border-[#d0d7de]'
  const cardBg = isDark
    ? 'bg-[#161b22] border-[#30363d] text-[#c9d1d9]'
    : 'bg-[#f6f8fa] border-[#d0d7de] text-[#24292f]'
  const labelColor = isDark ? 'text-[#7d8590]' : 'text-[#57606a]'

  // Get GitHub shade based on task completion
  const getCellShade = (day: { dateKey: string; isFuture: boolean }) => {
    if (day.isFuture) {
      return isDark
        ? 'opacity-20 pointer-events-none border border-dashed border-[#30363d]'
        : 'opacity-20 pointer-events-none border border-dashed border-[#d0d7de]'
    }

    const stats = dailyStatsMap.get(day.dateKey)
    if (!stats || stats.total === 0 || stats.completed === 0) {
      return isDark
        ? 'bg-[#161b22] border border-[rgba(255,255,255,0.05)]'
        : 'bg-[#ebedf0] border border-[rgba(0,0,0,0.06)]'
    }

    if (stats.completed === stats.total) {
      // 100% completed - GitHub highest level green
      return isDark
        ? 'bg-[#39d353] border border-[#39d353]'
        : 'bg-[#216e39] border border-[#216e39]'
    }

    if (stats.percentage > 50) {
      return isDark
        ? 'bg-[#26a641] border border-[#26a641]'
        : 'bg-[#30a14e] border border-[#30a14e]'
    }

    if (stats.percentage > 25) {
      return isDark
        ? 'bg-[#006d32] border border-[#006d32]'
        : 'bg-[#40c463] border border-[#40c463]'
    }

    return isDark
      ? 'bg-[#0e4429] border border-[#0e4429]'
      : 'bg-[#9be9a8] border border-[#9be9a8]'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden ${modalContainer}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${headerBorder}`}>
          <div>
            <h2 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>TicketFlow Consistency Matrix</span>
            </h2>
            <p className={`text-[11px] ${labelColor} mt-0.5`}>
              Track your daily work logs and task consistency throughout the year
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition cursor-pointer"
            title="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Summary Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3 rounded-xl border ${cardBg}`}>
              <span className={`text-[10px] font-medium block ${labelColor}`}>Current Streak</span>
              <span className="text-base font-semibold font-mono text-zinc-900 dark:text-zinc-100">
                {summaryMetrics.streak} {summaryMetrics.streak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <div className={`p-3 rounded-xl border ${cardBg}`}>
              <span className={`text-[10px] font-medium block ${labelColor}`}>100% Completed</span>
              <span className="text-base font-semibold font-mono text-zinc-900 dark:text-zinc-100">
                {summaryMetrics.perfectDays} days
              </span>
            </div>
            <div className={`p-3 rounded-xl border ${cardBg}`}>
              <span className={`text-[10px] font-medium block ${labelColor}`}>Total Days Logged</span>
              <span className="text-base font-semibold font-mono text-zinc-900 dark:text-zinc-100">
                {summaryMetrics.totalLoggedDays}
              </span>
            </div>
            <div className={`p-3 rounded-xl border ${cardBg}`}>
              <span className={`text-[10px] font-medium block ${labelColor}`}>Consistency Rate</span>
              <span className="text-base font-semibold font-mono text-zinc-900 dark:text-zinc-100">
                {summaryMetrics.consistencyRate}%
              </span>
            </div>
          </div>

          {/* GitHub-style Annual Heatmap Grid */}
          <div className={`p-5 rounded-xl border overflow-x-auto ${cardBg}`}>
            <div className="min-w-[730px]">
              {/* Month labels row */}
              <div className="flex text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-2 pl-8 gap-[3px]">
                {weeks.map((_, idx) => {
                  const month = monthLabels.find((m) => m.weekIndex === idx)
                  return (
                    <div key={idx} className="w-[11px] text-left shrink-0">
                      {month ? month.label : ''}
                    </div>
                  )
                })}
              </div>

              {/* Grid with Sun-Sat 7 rows and day labels */}
              <div className="flex gap-2">
                {/* Left day labels (Mon, Wed, Fri) matching GitHub */}
                <div className="grid grid-rows-7 text-[9px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0 h-[98px] pr-1">
                  <span className="leading-3 self-center opacity-0">Sun</span>
                  <span className="leading-3 self-center">Mon</span>
                  <span className="leading-3 self-center opacity-0">Tue</span>
                  <span className="leading-3 self-center">Wed</span>
                  <span className="leading-3 self-center opacity-0">Thu</span>
                  <span className="leading-3 self-center">Fri</span>
                  <span className="leading-3 self-center opacity-0">Sat</span>
                </div>

                {/* 52 Columns */}
                <div className="flex gap-[3px]">
                  {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-[3px] shrink-0">
                      {week.map((day) => {
                        const stats = dailyStatsMap.get(day.dateKey)
                        const isSelected = selectedDayKey === day.dateKey
                        const shade = getCellShade(day)

                        return (
                          <button
                            key={day.dateKey}
                            type="button"
                            onClick={() => setSelectedDayKey(day.dateKey)}
                            className={`w-[11px] h-[11px] rounded-[2px] transition cursor-pointer relative ${shade} ${
                              isSelected ? 'ring-2 ring-zinc-400 dark:ring-zinc-200 z-10' : ''
                            }`}
                            title={`${day.dateKey}: ${
                              stats
                                ? `${stats.completed}/${stats.total} completed (${stats.percentage}%)`
                                : 'No activity'
                            }`}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom bar with GitHub legend */}
              <div className={`flex items-center justify-between pt-3 mt-4 border-t ${headerBorder} text-[10px] ${labelColor} font-mono`}>
                <span className="hover:underline cursor-default">
                  Learn how we count consistency
                </span>
                <div className="flex items-center gap-1.5">
                  <span>Less</span>
                  <span className={`w-[10px] h-[10px] rounded-[2px] inline-block ${
                    isDark ? 'bg-[#161b22] border border-[rgba(255,255,255,0.05)]' : 'bg-[#ebedf0] border border-[rgba(0,0,0,0.06)]'
                  }`} />
                  <span className={`w-[10px] h-[10px] rounded-[2px] inline-block ${
                    isDark ? 'bg-[#0e4429]' : 'bg-[#9be9a8]'
                  }`} />
                  <span className={`w-[10px] h-[10px] rounded-[2px] inline-block ${
                    isDark ? 'bg-[#006d32]' : 'bg-[#40c463]'
                  }`} />
                  <span className={`w-[10px] h-[10px] rounded-[2px] inline-block ${
                    isDark ? 'bg-[#26a641]' : 'bg-[#30a14e]'
                  }`} />
                  <span className={`w-[10px] h-[10px] rounded-[2px] inline-block ${
                    isDark ? 'bg-[#39d353]' : 'bg-[#216e39]'
                  }`} />
                  <span>More</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Date Inspector */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cardBg}`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold font-mono text-zinc-900 dark:text-zinc-100">
                  {selectedDayKey}
                </span>
                {selectedDayKey === todayKey && (
                  <span className={`text-[9px] px-2 py-0.5 rounded border ${headerBorder} ${labelColor} font-mono`}>
                    Today
                  </span>
                )}
              </div>
              <p className={`text-[11px] ${labelColor} mt-1`}>
                {selectedStats && selectedStats.total > 0
                  ? selectedStats.completed === selectedStats.total
                    ? `100% completed (${selectedStats.completed}/${selectedStats.total} tasks completed)`
                    : `${selectedStats.percentage}% completed (${selectedStats.completed}/${selectedStats.total} tasks completed)`
                  : selectedStats && selectedStats.count > 0
                  ? 'Note logged without checklist tasks'
                  : 'No tasks completed on this day'}
              </p>
            </div>

            {onSelectDate && (
              <button
                type="button"
                onClick={() => {
                  onSelectDate(selectedDayKey)
                  onClose()
                }}
                className={`h-9 px-4 rounded-lg border text-xs font-semibold transition cursor-pointer shrink-0 ${
                  isDark
                    ? 'border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9]'
                    : 'border-[#d0d7de] bg-[#f6f8fa] hover:bg-[#eaeef2] text-[#24292f] shadow-2xs'
                }`}
              >
                View in Notes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
