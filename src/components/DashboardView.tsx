'use client'

import React from 'react'
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

function formatNoteDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-')
    if (parts.length < 3) return dateStr
    const y = Number(parts[0])
    const m = Number(parts[1])
    const d = Number(parts[2])
    const dateObj = new Date(y, m - 1, d)
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  // Metric counts
  const total = tickets.length
  const todo = tickets.filter((t) => t.status === 'TODO').length
  const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS').length
  const done = tickets.filter((t) => t.status === 'DONE').length
  const blocked = tickets.filter((t) => t.status === 'BLOCKED').length

  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

  // Priority counts
  const urgent = tickets.filter((t) => t.priority === 'URGENT').length
  const high = tickets.filter((t) => t.priority === 'HIGH').length
  const medium = tickets.filter((t) => t.priority === 'MEDIUM').length
  const low = tickets.filter((t) => t.priority === 'LOW').length

  // Status Distribution circular donut chart calculations
  const STATUS_RADIUS = 46
  const STATUS_CIRCUMFERENCE = 2 * Math.PI * STATUS_RADIUS

  const statusData = [
    {
      label: 'Completed',
      count: done,
      color: '#10b981',
      icon: (
        <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      label: 'In Progress',
      count: inProgress,
      color: '#f59e0b',
      icon: (
        <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: 'To Do',
      count: todo,
      color: isDark ? '#71717a' : '#a1a1aa',
      icon: (
        <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3">
          <circle cx="12" cy="12" r="9" />
        </svg>
      ),
    },
    {
      label: 'Blocked',
      count: blocked,
      color: '#f43f5e',
      icon: (
        <svg className="w-3.5 h-3.5 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      ),
    },
  ]

  let accumulatedStatusOffset = 0
  const statusSegments = statusData.map((item) => {
    const fraction = total > 0 ? item.count / total : 0
    const strokeLength = fraction * STATUS_CIRCUMFERENCE
    const offset = accumulatedStatusOffset
    accumulatedStatusOffset += strokeLength
    const pct = total > 0 ? Math.round(fraction * 100) : 0
    return {
      ...item,
      pct,
      strokeLength,
      offset,
    }
  })

  // Projects distribution
  const projectStats = availableProjects.map((proj) => {
    const count = tickets.filter((t) => t.projectName === proj).length
    const projDone = tickets.filter(
      (t) => t.projectName === proj && t.status === 'DONE'
    ).length
    const pct = count > 0 ? Math.round((projDone / count) * 100) : 0
    return { name: proj, count, done: projDone, pct }
  })

  // Theme-aware styles
  const cardBg = isDark
    ? 'bg-[#111114] border-white/[0.07] text-zinc-100 hover:border-white/[0.12] transition-colors'
    : 'bg-white border-zinc-200/90 text-zinc-900 shadow-2xs hover:border-zinc-300 transition-colors'
  const cardHeaderBorder = isDark ? 'border-white/[0.06]' : 'border-zinc-100'
  const subtleBarTrack = isDark ? 'bg-white/[0.06]' : 'bg-zinc-100'

  const themeTag = isDark
    ? 'bg-white/[0.05] border-white/[0.08] text-zinc-300'
    : 'bg-zinc-100 border-zinc-200 text-zinc-700 shadow-2xs'

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
      {/* 1. Executive Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Scope */}
        <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Scope
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${themeTag}`}>
              All Workspaces
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono mt-2.5 tracking-tight text-zinc-900 dark:text-zinc-100">
            {total}
          </div>
          <div className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1.5">
            <span>Across {availableProjects.length} workspaces</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Completion Rate
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${themeTag}`}>
              {done}/{total} Done
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono mt-2.5 tracking-tight text-zinc-900 dark:text-zinc-100">
            {completionRate}%
          </div>
          <div className={`w-full ${subtleBarTrack} rounded-full h-2 mt-2.5 overflow-hidden`}>
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* In Progress */}
        <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              In Progress
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${themeTag}`}>
              {inProgress} Active
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono mt-2.5 tracking-tight text-zinc-900 dark:text-zinc-100">
            {inProgress}
          </div>
          <div className="text-xs text-zinc-500 mt-1.5">
            Tasks currently being worked on
          </div>
        </div>

        {/* Blocked Issues */}
        <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Blocked Issues
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${themeTag}`}>
              {blocked > 0 ? `${blocked} Blocked` : 'All Clear'}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono mt-2.5 tracking-tight text-zinc-900 dark:text-zinc-100">
            {blocked}
          </div>
          <div className="text-xs text-zinc-500 mt-1.5">
            {blocked > 0 ? 'Requires immediate action' : 'Zero impediments reported'}
          </div>
        </div>
      </div>

      {/* 2. Visual Charts Grid (Status Distribution & Priority Severity) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Workflow Status Distribution (Circular Donut Chart) */}
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className={`flex items-center justify-between pb-3.5 mb-4 border-b ${cardHeaderBorder}`}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Status Distribution
            </h3>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${themeTag}`}>
              Workflow Ratio
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
            {/* Circular Donut Chart SVG */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={STATUS_RADIUS}
                  className={isDark ? 'stroke-white/[0.06]' : 'stroke-zinc-100'}
                  strokeWidth="10"
                  fill="none"
                />
                {/* Status Segments */}
                {statusSegments.map((seg) =>
                  seg.count > 0 ? (
                    <circle
                      key={seg.label}
                      cx="60"
                      cy="60"
                      r={STATUS_RADIUS}
                      stroke={seg.color}
                      strokeWidth="10"
                      strokeDasharray={`${seg.strokeLength} ${STATUS_CIRCUMFERENCE}`}
                      strokeDashoffset={-seg.offset}
                      fill="none"
                      className="transition-all duration-700 ease-out"
                    />
                  ) : null
                )}
              </svg>

              {/* Donut Center Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center">
                <span className="text-2xl font-bold font-mono tracking-tight leading-none text-zinc-900 dark:text-zinc-100">
                  {total}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mt-1">
                  Tickets
                </span>
              </div>
            </div>

            {/* Status Legend & Breakdown Rows */}
            <div className="flex-1 w-full space-y-2.5">
              {statusSegments.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition border ${
                    isDark
                      ? 'border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05]'
                      : 'border-zinc-100 bg-zinc-50/80 hover:bg-zinc-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 font-mono">
                    <span className="text-xs text-zinc-500">{item.pct}%</span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold text-right min-w-[32px] border ${
                        isDark
                          ? 'bg-white/[0.06] border-white/[0.08] text-zinc-200'
                          : 'bg-white border-zinc-200 text-zinc-800 shadow-2xs'
                      }`}
                    >
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Priority Severity Breakdown */}
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className={`flex items-center justify-between pb-3.5 mb-4 border-b ${cardHeaderBorder}`}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Priority Severity
            </h3>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${themeTag}`}>
              Urgency Distribution
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {[
              {
                label: 'Urgent',
                count: urgent,
                trackColor: 'bg-rose-500',
                icon: (
                  <svg className="w-3.5 h-3.5 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                ),
              },
              {
                label: 'High',
                count: high,
                trackColor: 'bg-amber-500',
                icon: (
                  <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                ),
              },
              {
                label: 'Medium',
                count: medium,
                trackColor: 'bg-blue-500',
                icon: (
                  <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="9" x2="19" y2="9" />
                    <line x1="5" y1="15" x2="19" y2="15" />
                  </svg>
                ),
              },
              {
                label: 'Low',
                count: low,
                trackColor: 'bg-zinc-400 dark:bg-zinc-500',
                icon: (
                  <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                ),
              },
            ].map((item) => {
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                      {item.icon}
                      <span>{item.label} Priority</span>
                    </span>
                    <span className="font-mono text-zinc-500 dark:text-zinc-400 text-xs">
                      {item.count} items ({pct}%)
                    </span>
                  </div>
                  <div className={`w-full ${subtleBarTrack} h-2 rounded-full overflow-hidden`}>
                    <div
                      className={`h-2 rounded-full ${item.trackColor} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 3. Workload per Project Workspace */}
      <div className={`p-5 rounded-2xl border ${cardBg}`}>
        <div className={`flex items-center justify-between pb-3.5 mb-4 border-b ${cardHeaderBorder}`}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Workspace Workload & Velocity
          </h3>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${themeTag}`}>
            {projectStats.length} Workspaces
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {projectStats.map((p) => (
            <div
              key={p.name}
              className={`p-4 rounded-xl border transition ${
                isDark
                  ? 'bg-black/25 border-white/[0.06] hover:border-white/[0.12]'
                  : 'bg-zinc-50/70 border-zinc-200/80 hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold mb-2.5">
                <span className="truncate flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-medium">
                  <svg className="w-3.5 h-3.5 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  {p.name}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${themeTag}`}>
                  {p.count} tickets
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                <span>Completed: {p.done}</span>
                <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                  {p.pct}% velocity
                </span>
              </div>
              <div className={`w-full ${subtleBarTrack} h-2 rounded-full overflow-hidden`}>
                <div
                  className="h-2 bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${p.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Daily Standup Logs Overview */}
      <div className={`p-5 rounded-2xl border ${cardBg}`}>
        <div className={`flex items-center justify-between pb-3.5 mb-4 border-b ${cardHeaderBorder}`}>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Daily Standup Log Activity
            </h3>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${themeTag}`}>
              Recent Work
            </span>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${themeTag}`}>
            {dailyNotes.length} Total Logs
          </span>
        </div>

        {dailyNotes.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center italic">
            No work logs recorded yet. Create one from the Notes tab!
          </p>
        ) : (
          <div className="space-y-3.5">
            {dailyNotes.slice(0, 3).map((note) => {
              const parsed = parseDailyNoteContent(note.content)

              return (
                <div
                  key={note.id}
                  className={`p-4 rounded-xl border transition ${
                    isDark
                      ? 'bg-black/30 border-white/[0.06] hover:border-white/[0.1]'
                      : 'bg-zinc-50/70 border-zinc-200/80 hover:border-zinc-300 shadow-2xs'
                  }`}
                >
                  {/* Note Header: Date, Task Completion Pill, Author */}
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs mb-3 pb-2.5 border-b border-inherit">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        <svg className="w-3.5 h-3.5 text-zinc-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {formatNoteDate(note.date)}
                      </span>
                      {parsed.totalTasks > 0 && (
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${themeTag}`}>
                          {parsed.completedTasks}/{parsed.totalTasks} completed
                        </span>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${themeTag}`}>
                      {note.createdBy?.startsWith('@') ? note.createdBy : `@${note.createdBy || 'jamnithil'}`}
                    </span>
                  </div>

                  {/* Note Tasks Breakdown */}
                  {parsed.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {parsed.tasks.slice(0, 3).map((task, tIdx) => (
                        <div
                          key={tIdx}
                          className={`flex items-start gap-2.5 p-2 rounded-lg text-xs leading-relaxed transition ${
                            isDark
                              ? 'bg-white/[0.02] text-zinc-300'
                              : 'bg-white border border-zinc-200/60 text-zinc-800'
                          }`}
                        >
                          {task.completed ? (
                            <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-zinc-400 dark:border-zinc-500 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={`flex-1 text-xs ${
                              task.completed
                                ? 'line-through text-zinc-400 dark:text-zinc-500'
                                : 'text-zinc-800 dark:text-zinc-200 font-medium'
                            }`}
                          >
                            {task.text}
                          </span>
                        </div>
                      ))}

                      {parsed.tasks.length > 3 && (
                        <div className="text-xs font-mono text-zinc-500 pt-1 pl-1">
                          + {parsed.tasks.length - 3} more task items recorded
                        </div>
                      )}
                    </div>
                  ) : parsed.notesText ? (
                    <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans line-clamp-2">
                      {parsed.notesText}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No task breakdown provided.</p>
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
