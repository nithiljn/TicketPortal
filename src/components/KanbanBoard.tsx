'use client'

import React from 'react'
import { Ticket, TicketStatus } from '@/types'

interface KanbanBoardProps {
  tickets: Ticket[]
  onStatusChange: (id: string, newStatus: TicketStatus) => Promise<void>
  onEditTicket: (ticket: Ticket) => void
  onDeleteTicket: (ticket: Ticket) => void
  theme?: 'dark' | 'light'
}

const COLUMNS: {
  id: TicketStatus
  label: string
  dotColor: string
}[] = [
  { id: 'TODO', label: 'To Do', dotColor: 'bg-zinc-400' },
  { id: 'IN_PROGRESS', label: 'In Progress', dotColor: 'bg-amber-400' },
  { id: 'DONE', label: 'Completed', dotColor: 'bg-emerald-400' },
  { id: 'BLOCKED', label: 'Blocked', dotColor: 'bg-rose-400' },
]

export function KanbanBoard({
  tickets,
  onStatusChange,
  onEditTicket,
  onDeleteTicket,
  theme = 'dark',
}: KanbanBoardProps) {
  const isDark = theme === 'dark'

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-500">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            URGENT
          </span>
        )
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-500">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            HIGH
          </span>
        )
      case 'MEDIUM':
        return (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-medium ${
              isDark ? 'text-zinc-300' : 'text-zinc-600'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            MEDIUM
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            LOW
          </span>
        )
    }
  }

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return ''
    }
  }

  // Theme-aware styles
  const columnBg = isDark
    ? 'bg-[#111114] border-white/[0.06]'
    : 'bg-zinc-100/70 border-zinc-200'
  const columnHeaderBorder = isDark ? 'border-white/[0.06]' : 'border-zinc-200'
  const columnTitle = isDark ? 'text-zinc-200' : 'text-zinc-800'
  const countBadge = isDark
    ? 'bg-white/[0.04] border-white/[0.06] text-zinc-400'
    : 'bg-white border-zinc-200 text-zinc-600 shadow-2xs'

  const cardBg = isDark
    ? 'bg-[#16161a] hover:bg-[#1a1a1f] border-white/[0.06] hover:border-white/[0.12] text-zinc-100 shadow-sm'
    : 'bg-white hover:bg-zinc-50/80 border-zinc-200 hover:border-zinc-300 text-zinc-900 shadow-xs'

  const workspaceBadge = isDark
    ? 'bg-white/[0.06] text-zinc-200 border-white/[0.1]'
    : 'bg-zinc-100 text-zinc-800 border-zinc-200 font-medium'

  const categoryBadge = isDark
    ? 'bg-white/[0.04] border-white/[0.06] text-zinc-400'
    : 'bg-zinc-100 border-zinc-200 text-zinc-600'

  const cardTitle = isDark
    ? 'text-zinc-100 group-hover:text-white'
    : 'text-zinc-900 group-hover:text-zinc-950'
  const cardDesc = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const divider = isDark ? 'border-white/[0.04]' : 'border-zinc-100'

  const moveBtn = isDark
    ? 'bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300'
    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const columnTickets = tickets.filter((t) => t.status === col.id)

        return (
          <div
            key={col.id}
            className={`flex flex-col rounded-2xl border p-3.5 min-h-[500px] ${columnBg}`}
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between pb-3 mb-3 border-b ${columnHeaderBorder}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                <span className={`font-semibold text-xs tracking-wider uppercase ${columnTitle}`}>
                  {col.label}
                </span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-md font-mono border ${countBadge}`}>
                {columnTickets.length}
              </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
              {columnTickets.length === 0 ? (
                <div className={`flex flex-col items-center justify-center h-36 rounded-xl border border-dashed text-xs ${
                  isDark ? 'border-white/[0.06] text-zinc-500' : 'border-zinc-200 text-zinc-400'
                }`}>
                  <span>No tickets</span>
                </div>
              ) : (
                columnTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`group rounded-xl border p-3.5 transition-all ${cardBg}`}
                  >
                    {/* Header: Priority & Category & Workspace */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getPriorityBadge(ticket.priority)}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${categoryBadge}`}>
                          {ticket.category}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 truncate max-w-[110px] ${workspaceBadge}`}
                        title={ticket.projectName}
                      >
                        <svg className="w-2.5 h-2.5 opacity-70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="truncate">{ticket.projectName}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`font-medium text-xs leading-snug mb-1 transition ${cardTitle}`}>
                      {ticket.title}
                    </h3>

                    {/* Description preview */}
                    {ticket.description && (
                      <p className={`text-[11px] line-clamp-2 mb-2.5 leading-relaxed ${cardDesc}`}>
                        {ticket.description}
                      </p>
                    )}

                    {/* Author & Timestamp */}
                    <div className={`flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t mt-2 ${divider}`}>
                      <span className="truncate max-w-[100px]">
                        {ticket.createdBy?.split('@')[0] || ticket.createdBy}
                      </span>
                      <span className="font-mono">
                        {formatRelativeTime(ticket.createdAt)}
                      </span>
                    </div>

                    {/* Actions Toolbar */}
                    <div className={`flex items-center justify-between gap-1 pt-2 mt-2 border-t ${divider}`}>
                      {/* Status transitions */}
                      <div className="flex items-center gap-1">
                        {ticket.status !== 'TODO' && (
                          <button
                            onClick={() => onStatusChange(ticket.id, 'TODO')}
                            className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${moveBtn}`}
                          >
                            To Do
                          </button>
                        )}
                        {ticket.status !== 'IN_PROGRESS' && (
                          <button
                            onClick={() => onStatusChange(ticket.id, 'IN_PROGRESS')}
                            className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${moveBtn}`}
                          >
                            In Progress
                          </button>
                        )}
                        {ticket.status !== 'DONE' && (
                          <button
                            onClick={() => onStatusChange(ticket.id, 'DONE')}
                            className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${moveBtn}`}
                          >
                            Done
                          </button>
                        )}
                        {ticket.status !== 'BLOCKED' && (
                          <button
                            onClick={() => onStatusChange(ticket.id, 'BLOCKED')}
                            className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${moveBtn}`}
                          >
                            Block
                          </button>
                        )}
                      </div>

                      {/* Edit & Delete Action Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditTicket(ticket)}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition cursor-pointer"
                          title="Edit ticket"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteTicket(ticket)}
                          className="p-1 rounded text-zinc-400 hover:text-rose-500 transition cursor-pointer"
                          title="Delete ticket"
                        >
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
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
