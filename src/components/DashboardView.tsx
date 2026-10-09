'use client'

import React from 'react'
import { Ticket, DailyNote } from '@/types'

interface DashboardViewProps {
  tickets: Ticket[]
  dailyNotes: DailyNote[]
  availableProjects: string[]
  theme: 'dark' | 'light'
}

export function DashboardView({
  tickets,
  dailyNotes,
  availableProjects,
  theme,
}: DashboardViewProps) {
  const isDark = theme === 'dark'

  // Calculations
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
  const STATUS_RADIUS = 48
  const STATUS_CIRCUMFERENCE = 2 * Math.PI * STATUS_RADIUS

  const statusData = [
    { label: 'Completed', count: done, color: '#10b981', dot: 'bg-emerald-500' },
    { label: 'In Progress', count: inProgress, color: '#f59e0b', dot: 'bg-amber-400' },
    { label: 'To Do', count: todo, color: isDark ? '#a1a1aa' : '#71717a', dot: 'bg-zinc-400' },
    { label: 'Blocked', count: blocked, color: '#f43f5e', dot: 'bg-rose-500' },
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
    ? 'bg-[#111114] border-white/[0.06] text-zinc-100'
    : 'bg-white border-zinc-200/80 text-zinc-900 shadow-sm'
  const subText = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const subtleBarBg = isDark ? 'bg-white/[0.06]' : 'bg-zinc-100'

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
      {/* 1. Executive Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Tickets */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <span className={`text-[11px] font-medium uppercase tracking-wider ${subText}`}>
            Total Scope
          </span>
          <div className="text-2xl font-bold font-mono mt-1">{total}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Across all workspaces</div>
        </div>

        {/* Completion Rate */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <span className={`text-[11px] font-medium uppercase tracking-wider text-emerald-400`}>
            Completion Rate
          </span>
          <div className="text-2xl font-bold font-mono mt-1 text-emerald-400">
            {completionRate}%
          </div>
          <div className="w-full bg-emerald-500/10 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* In Progress */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <span className={`text-[11px] font-medium uppercase tracking-wider text-amber-400`}>
            In Progress
          </span>
          <div className="text-2xl font-bold font-mono mt-1 text-amber-400">
            {inProgress}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Active tasks currently worked on</div>
        </div>

        {/* Blocked */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <span className={`text-[11px] font-medium uppercase tracking-wider text-rose-400`}>
            Blocked Issues
          </span>
          <div className="text-2xl font-bold font-mono mt-1 text-rose-400">
            {blocked}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Tasks requiring attention</div>
        </div>
      </div>

      {/* 2. Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Workflow Status Distribution (Circular Donut Chart) */}
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-inherit">
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Status Distribution
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">Circular Breakdown</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-1">
            {/* Circular Donut Chart SVG */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={STATUS_RADIUS}
                  className={isDark ? 'stroke-white/[0.06]' : 'stroke-zinc-100'}
                  strokeWidth="13"
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
                      strokeWidth="13"
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
                <span className="text-2xl font-bold font-mono tracking-tight leading-none">
                  {total}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mt-1">
                  Tickets
                </span>
              </div>
            </div>

            {/* Status Legend & Breakdown */}
            <div className="flex-1 w-full space-y-2">
              {statusSegments.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs transition border ${
                    isDark
                      ? 'border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05]'
                      : 'border-zinc-100 bg-zinc-50/70 hover:bg-zinc-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 font-mono">
                    <span className="text-[11px] text-zinc-500">{item.pct}%</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold text-right min-w-[28px] border ${
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

        {/* Chart 2: Priority Level Distribution */}
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-inherit">
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Priority Severity
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">Breakdown</span>
          </div>

          <div className="space-y-3.5">
            {[
              { label: 'Urgent', count: urgent, color: 'bg-rose-500', bar: 'bg-rose-500' },
              { label: 'High', count: high, color: 'bg-amber-500', bar: 'bg-amber-500' },
              { label: 'Medium', count: medium, color: 'bg-zinc-400', bar: 'bg-zinc-400' },
              { label: 'Low', count: low, color: 'bg-emerald-500', bar: 'bg-emerald-500' },
            ].map((item) => {
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{item.label} Priority</span>
                    <span className="font-mono text-zinc-400">
                      {item.count} items ({pct}%)
                    </span>
                  </div>
                  <div className={`w-full ${subtleBarBg} h-2 rounded-full overflow-hidden`}>
                    <div
                      className={`h-2 rounded-full ${item.bar} transition-all duration-500`}
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
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-inherit">
          <h3 className="text-xs font-semibold uppercase tracking-wider">
            Workspace Workload & Velocity
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">
            {projectStats.length} projects
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {projectStats.map((p) => (
            <div
              key={p.name}
              className={`p-3.5 rounded-xl border border-inherit ${
                isDark ? 'bg-black/30' : 'bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="truncate">{p.name}</span>
                <span className="font-mono text-zinc-400">{p.count} tickets</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                <span>Completed: {p.done}</span>
                <span className="font-mono font-medium">{p.pct}%</span>
              </div>
              <div className={`w-full ${subtleBarBg} h-1.5 rounded-full overflow-hidden`}>
                <div
                  className="h-1.5 bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${p.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Daily Standup Logs Overview */}
      <div className={`p-5 rounded-2xl border ${cardBg}`}>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-inherit">
          <h3 className="text-xs font-semibold uppercase tracking-wider">
            Daily Standup Log Activity
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">
            {dailyNotes.length} total entries
          </span>
        </div>

        {dailyNotes.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">No work logs recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {dailyNotes.slice(0, 3).map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-xl border border-inherit text-xs ${
                  isDark ? 'bg-black/20' : 'bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 mb-1">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {note.date}
                  </span>
                  <span>By {note.createdBy}</span>
                </div>
                <p className="line-clamp-2 text-zinc-300 font-mono text-[11px]">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
