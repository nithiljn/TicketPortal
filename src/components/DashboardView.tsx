'use client'

import React, { useMemo } from 'react'
import { Ticket, DailyNote } from '@/types'

interface DashboardViewProps {
  tickets: Ticket[]
  dailyNotes: DailyNote[]
  availableProjects: string[]
  theme: 'dark' | 'light'
}

interface ParsedTask {
  text: string
  completed: boolean
  completedAt?: string
}

interface ParsedDailyNote {
  tasks: ParsedTask[]
  notesText: string
  totalTasks: number
  completedTasks: number
  completionPct: number
}

// Apple iOS / macOS System Palette for Categories
const APPLE_CATEGORY_COLORS: Record<string, string> = {
  DEV: '#0071e3', // Apple System Blue
  FEATURE: '#34c759', // Apple System Green
  BUG: '#ff3b30', // Apple System Red
  DATABASE: '#30b0c7', // Apple System Teal
  DESIGN: '#af52de', // Apple System Purple
  OPS: '#ff9500', // Apple System Orange
  DOCS: '#5856d6', // Apple System Indigo
  SECURITY: '#ff2d55', // Apple System Pink
}

function getAppleCategoryColor(cat: string, index: number): string {
  const key = cat.toUpperCase()
  if (APPLE_CATEGORY_COLORS[key]) return APPLE_CATEGORY_COLORS[key]
  const palette = ['#0071e3', '#34c759', '#30b0c7', '#ff9500', '#af52de', '#5856d6', '#ff3b30', '#8e8e93']
  return palette[index % palette.length]
}

function parseDailyNoteContent(content: string): ParsedDailyNote {
  const lines = content.split('\n')
  const tasks: ParsedTask[] = []
  const noteLines: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.startsWith("TODAY'S PLANS:") || line.startsWith("NOTES:")) {
      continue
    }

    const isChecked = /^\s*-\s*\[[xX]\]/.test(line)
    const isUnchecked = /^\s*-\s*\[ \]/.test(line)

    if (isChecked || isUnchecked) {
      const match = line.match(/<!--\s*completed(?:At)?:\s*([^\s>]+)\s*-->/i)
      const completedAt = match ? match[1] : undefined
      const text = line
        .replace(/^\s*-\s*\[[ xX]\]\s*/, '')
        .replace(/<!--\s*completed(?:At)?:\s*([^\s>]+)\s*-->/i, '')
        .trim()

      if (text) {
        tasks.push({ text, completed: isChecked, completedAt })
      }
    } else {
      const cleanLine = line.replace(/<!--.*?-->/g, '').trim()
      if (cleanLine) {
        noteLines.push(cleanLine)
      }
    }
  }

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.completed).length
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return {
    tasks,
    notesText: noteLines.join(' • '),
    totalTasks,
    completedTasks,
    completionPct,
  }
}

function formatAppleDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-')
    if (parts.length < 3) return dateStr
    const y = Number(parts[0])
    const m = Number(parts[1])
    const d = Number(parts[2])
    const dateObj = new Date(y, m - 1, d)
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function DashboardView({
  tickets,
  dailyNotes,
  availableProjects,
  theme,
}: DashboardViewProps) {
  const isDark = theme === 'dark'

  // Core metrics (strictly without In-Progress or Blocked cards)
  const total = tickets.length
  const done = useMemo(() => tickets.filter((t) => t.status === 'DONE').length, [tickets])
  const open = total - done
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

  // Priority calculations
  const urgent = useMemo(() => tickets.filter((t) => t.priority === 'URGENT').length, [tickets])
  const high = useMemo(() => tickets.filter((t) => t.priority === 'HIGH').length, [tickets])
  const medium = useMemo(() => tickets.filter((t) => t.priority === 'MEDIUM').length, [tickets])
  const low = useMemo(() => tickets.filter((t) => t.priority === 'LOW').length, [tickets])
  const criticalCount = urgent + high
  const criticalOpen = useMemo(
    () => tickets.filter((t) => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'DONE').length,
    [tickets]
  )

  // Functional Category Domain Matrix
  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; done: number }> = {}
    tickets.forEach((t) => {
      const cat = (t.category || 'DEV').toUpperCase()
      if (!map[cat]) map[cat] = { count: 0, done: 0 }
      map[cat].count++
      if (t.status === 'DONE') map[cat].done++
    })

    const entries = Object.entries(map).map(([name, data]) => ({
      name,
      count: data.count,
      done: data.done,
      pct: total > 0 ? Math.round((data.count / total) * 100) : 0,
      completionPct: data.count > 0 ? Math.round((data.done / data.count) * 100) : 0,
    }))

    return entries.sort((a, b) => b.count - a.count)
  }, [tickets, total])

  // Standup work logs aggregated throughput
  const standupStats = useMemo(() => {
    let totalTasks = 0
    let completedTasks = 0
    const contributors = new Set<string>()

    dailyNotes.forEach((note) => {
      if (note.createdBy) contributors.add(note.createdBy)
      const parsed = parseDailyNoteContent(note.content)
      totalTasks += parsed.totalTasks
      completedTasks += parsed.completedTasks
    })

    const velocityPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      totalNotes: dailyNotes.length,
      totalTasks,
      completedTasks,
      velocityPct,
      contributorsCount: contributors.size,
    }
  }, [dailyNotes])

  // Workspace velocity and distribution
  const projectStats = useMemo(() => {
    return availableProjects
      .map((proj) => {
        const projTickets = tickets.filter((t) => t.projectName === proj)
        const count = projTickets.length
        const projDone = projTickets.filter((t) => t.status === 'DONE').length
        const pct = count > 0 ? Math.round((projDone / count) * 100) : 0
        return { name: proj, count, done: projDone, pct }
      })
      .sort((a, b) => b.count - a.count)
  }, [availableProjects, tickets])

  // Apple Design System Surface & Card Tokens (DESIGN.md)
  // Apple parchment off-white (#f5f5f7) canvas with pure white utility cards in light mode;
  // Near-black tile (#1c1c1e) on pure black canvas (#000000) in dark mode.
  const cardSurface = isDark
    ? 'bg-[#1c1c1e] border-white/[0.08] text-white'
    : 'bg-white border-[#e5e5ea] text-[#1d1d1f] shadow-xs'

  const innerCardSurface = isDark
    ? 'bg-[#242426] border-white/[0.06]'
    : 'bg-[#f5f5f7] border-black/[0.04]'

  const hairlineDivider = isDark ? 'border-white/[0.08]' : 'border-[#f0f0f0]'
  const progressTrack = isDark ? 'bg-white/[0.08]' : 'bg-[#e5e5ea]'

  // Signature Apple Capsule Chip (Pill) - Quiet, Authentic, Never AI/Neon
  const appleCapsule = isDark
    ? 'bg-white/[0.08] border-white/[0.08] text-[#f5f5f7]'
    : 'bg-[#f5f5f7] border-black/[0.06] text-[#1d1d1f]'

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 bg-[#f5f5f7] dark:bg-[#000000] font-sans">
      {/* 1. Apple-Style KPI Overview Grid (4 Clean Rounded Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Total Scope */}
        <div className={`p-5 sm:p-6 rounded-[20px] border transition-all duration-200 ${cardSurface}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6]">
              Total Scope
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border shrink-0 ${appleCapsule}`}>
              {availableProjects.length} Workspaces
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white mt-3">
            {total}
          </div>
          <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-2 font-normal">
            {open} open items in backlog
          </p>
        </div>

        {/* Metric 2: Delivery Rate */}
        <div className={`p-5 sm:p-6 rounded-[20px] border transition-all duration-200 ${cardSurface}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6]">
              Delivery Rate
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border shrink-0 ${appleCapsule}`}>
              {done}/{total} Done
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white mt-3">
            {completionRate}%
          </div>
          <div className={`w-full ${progressTrack} rounded-full h-1.5 mt-3 overflow-hidden`}>
            <div
              className="bg-[#34c759] h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Critical Attention Required */}
        <div className={`p-5 sm:p-6 rounded-[20px] border transition-all duration-200 ${cardSurface}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6]">
              Attention Required
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border shrink-0 ${appleCapsule}`}>
              {criticalOpen > 0 ? `${criticalOpen} Priority` : 'All Clear'}
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white mt-3">
            {criticalOpen}
          </div>
          <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-2 font-normal">
            {urgent} urgent and {high} high priority items
          </p>
        </div>

        {/* Metric 4: Work Log Execution */}
        <div className={`p-5 sm:p-6 rounded-[20px] border transition-all duration-200 ${cardSurface}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6]">
              Standup Tasks
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border shrink-0 ${appleCapsule}`}>
              {standupStats.totalNotes} Logs
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white mt-3">
            {standupStats.totalTasks}
          </div>
          <div className={`w-full ${progressTrack} rounded-full h-1.5 mt-3 overflow-hidden`}>
            <div
              className="bg-[#0071e3] dark:bg-[#2997ff] h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${standupStats.velocityPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Apple Visual Matrices (Category Scope & Priority Severity) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Matrix Card 1: Functional Categories */}
        <div className={`p-6 rounded-[20px] border transition-all duration-200 ${cardSurface}`}>
          <div className={`flex items-center justify-between pb-4 mb-5 border-b ${hairlineDivider}`}>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
                Functional Categories
              </h3>
              <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-0.5">
                Scope allocation across engineering disciplines
              </p>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border shrink-0 ${appleCapsule}`}>
              {categoryStats.length} Disciplines
            </span>
          </div>

          {categoryStats.length === 0 ? (
            <p className="py-12 text-center text-xs text-[#86868b] dark:text-[#a1a1a6]">
              No categorized tickets in workspace.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Segmented Distribution Bar */}
              <div>
                <div className={`w-full h-2 rounded-full overflow-hidden flex ${progressTrack}`}>
                  {categoryStats.map((cat, idx) => (
                    <div
                      key={cat.name}
                      style={{
                        width: `${cat.pct}%`,
                        backgroundColor: getAppleCategoryColor(cat.name, idx),
                      }}
                      title={`${cat.name}: ${cat.count} tickets (${cat.pct}%)`}
                      className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500 ease-out"
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#86868b] dark:text-[#a1a1a6] mt-2">
                  <span>Scope Allocation</span>
                  <span>100% Breakdown</span>
                </div>
              </div>

              {/* Category Breakdown Rows */}
              <div className="space-y-2.5">
                {categoryStats.map((item, idx) => {
                  const catColor = getAppleCategoryColor(item.name, idx)
                  return (
                    <div
                      key={item.name}
                      className={`flex items-center justify-between p-3 rounded-[14px] text-xs transition border ${innerCardSurface}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: catColor }}
                        />
                        <span className="font-semibold text-[#1d1d1f] dark:text-white truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-[#86868b] dark:text-[#a1a1a6] hidden min-[400px]:inline">
                          ({item.pct}% share)
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[#86868b] dark:text-[#a1a1a6] hidden sm:inline">
                          {item.done}/{item.count} done
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${appleCapsule}`}>
                          {item.count}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Matrix Card 2: Priority Severity */}
        <div className={`p-6 rounded-[20px] border transition-all duration-200 ${cardSurface}`}>
          <div className={`flex items-center justify-between pb-4 mb-5 border-b ${hairlineDivider}`}>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
                Priority Severity
              </h3>
              <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-0.5">
                Workload urgency distribution across backlog
              </p>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border shrink-0 ${appleCapsule}`}>
              4 Urgency Tiers
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {[
              {
                label: 'Urgent',
                count: urgent,
                color: '#ff3b30', // Apple Red
              },
              {
                label: 'High',
                count: high,
                color: '#ff9500', // Apple Orange
              },
              {
                label: 'Medium',
                count: medium,
                color: '#0071e3', // Apple Blue
              },
              {
                label: 'Low',
                count: low,
                color: '#8e8e93', // Apple Gray
              },
            ].map((item) => {
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-[#1d1d1f] dark:text-white">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.label} Priority</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#86868b] dark:text-[#a1a1a6]">
                        {pct}%
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${appleCapsule}`}>
                        {item.count}
                      </span>
                    </div>
                  </div>
                  <div className={`w-full ${progressTrack} h-1.5 rounded-full overflow-hidden`}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              )
            })}

            {/* Severity Summary */}
            <div className={`pt-4 mt-5 border-t ${hairlineDivider} flex items-center justify-between text-xs text-[#86868b] dark:text-[#a1a1a6]`}>
              <span>Critical Share (Urgent + High)</span>
              <span className="font-semibold text-[#1d1d1f] dark:text-white">
                {total > 0 ? Math.round((criticalCount / total) * 100) : 0}% of scope
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Workspaces Workload Grid */}
      <div className={`p-6 rounded-[20px] border transition-all duration-200 ${cardSurface}`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b ${hairlineDivider}`}>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              Workspaces
            </h3>
            <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-0.5">
              Active projects, ticket volume, and delivery progress
            </p>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border self-start sm:self-auto shrink-0 ${appleCapsule}`}>
            {projectStats.length} Workspaces
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectStats.map((p) => (
            <div
              key={p.name}
              className={`p-4 rounded-[16px] border transition-all duration-200 ${innerCardSurface}`}
            >
              <div className="flex items-center justify-between gap-2 text-xs font-semibold mb-3">
                <span className="truncate min-w-0 flex items-center gap-2 text-[#1d1d1f] dark:text-white font-medium">
                  <svg className="w-3.5 h-3.5 text-[#86868b] dark:text-[#a1a1a6] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="truncate">{p.name}</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-normal border shrink-0 ${appleCapsule}`}>
                  {p.count} tickets
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#86868b] dark:text-[#a1a1a6] mb-2">
                <span>{p.done} completed</span>
                <span className="font-semibold text-[#1d1d1f] dark:text-white">
                  {p.pct}% velocity
                </span>
              </div>
              <div className={`w-full ${progressTrack} h-1.5 rounded-full overflow-hidden`}>
                <div
                  className="h-1.5 bg-[#34c759] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${p.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Standup Work Log Activity */}
      <div className={`p-6 rounded-[20px] border transition-all duration-200 ${cardSurface}`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b ${hairlineDivider}`}>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              Daily Standup Activity
            </h3>
            <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-0.5">
              Latest recorded work sessions, tasks, and notes
            </p>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border self-start sm:self-auto shrink-0 ${appleCapsule}`}>
            {dailyNotes.length} Total Logs
          </span>
        </div>

        {dailyNotes.length === 0 ? (
          <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] py-10 text-center">
            No work logs recorded yet. Create your first log in the Notes tab.
          </p>
        ) : (
          <div className="space-y-4">
            {dailyNotes.slice(0, 3).map((note) => {
              const parsed = parseDailyNoteContent(note.content)

              return (
                <div
                  key={note.id}
                  className={`p-4 rounded-[16px] border transition-all duration-200 ${innerCardSurface}`}
                >
                  {/* Note Header */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-3 pb-3 border-b ${hairlineDivider}`}>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1d1d1f] dark:text-white shrink-0">
                        <svg className="w-3.5 h-3.5 text-[#86868b] dark:text-[#a1a1a6] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {formatAppleDate(note.date)}
                      </span>
                      {parsed.totalTasks > 0 && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-normal border shrink-0 ${appleCapsule}`}>
                          {parsed.completedTasks}/{parsed.totalTasks} completed
                        </span>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-normal border self-start sm:self-auto shrink-0 ${appleCapsule}`}>
                      {note.createdBy?.startsWith('@') ? note.createdBy : `@${(note.createdBy?.includes('@') ? note.createdBy.split('@')[0] : note.createdBy) || 'user'}`}
                    </span>
                  </div>

                  {/* Tasks Checklist */}
                  {parsed.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {parsed.tasks.slice(0, 3).map((task, tIdx) => (
                        <div
                          key={tIdx}
                          className="flex items-start gap-2.5 p-2 rounded-[10px] text-xs leading-relaxed"
                        >
                          {task.completed ? (
                            <svg className="w-4 h-4 text-[#34c759] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-[#86868b] dark:border-[#a1a1a6] shrink-0 mt-0.5" />
                          )}
                          <span
                            className={`flex-1 text-xs ${
                              task.completed
                                ? 'line-through text-[#86868b] dark:text-[#a1a1a6]'
                                : 'text-[#1d1d1f] dark:text-white font-normal'
                            }`}
                          >
                            {task.text}
                          </span>
                        </div>
                      ))}

                      {parsed.tasks.length > 3 && (
                        <div className="text-xs text-[#86868b] dark:text-[#a1a1a6] pt-1 pl-2">
                          + {parsed.tasks.length - 3} more items recorded
                        </div>
                      )}
                    </div>
                  ) : parsed.notesText ? (
                    <p className="text-xs text-[#1d1d1f] dark:text-white leading-relaxed line-clamp-2">
                      {parsed.notesText}
                    </p>
                  ) : (
                    <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] italic">No task breakdown provided.</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
