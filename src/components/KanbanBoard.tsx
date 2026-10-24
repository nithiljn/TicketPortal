'use client'

import React from 'react'
import { Ticket, TicketStatus } from '@/types'
import { HighlightText } from '@/components/HighlightText'

interface KanbanBoardProps {
  tickets: Ticket[]
  onStatusChange?: (id: string, newStatus: TicketStatus) => Promise<void>
  onViewTicket?: (ticket: Ticket) => void
  onEditTicket: (ticket: Ticket) => void
  onDeleteTicket: (ticket: Ticket) => void
  theme?: 'dark' | 'light'
  searchTerm?: string
}

const COLUMNS: {
  id: TicketStatus
  label: string
}[] = [
  { id: 'TODO', label: 'To Do' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'DONE', label: 'Completed' },
  { id: 'BLOCKED', label: 'Blocked' },
]

export function KanbanBoard({
  tickets,
  onStatusChange,
  onViewTicket,
  onEditTicket,
  onDeleteTicket,
  theme = 'dark',
  searchTerm = '',
}: KanbanBoardProps) {
  const isDark = theme === 'dark'

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 3v13M12 20v1" strokeLinecap="round" />
            </svg>
            Urgent
          </span>
        )
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
            High
          </span>
        )
      case 'MEDIUM':
        return (
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Medium
          </span>
        )
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            Low
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
              <span className={`font-semibold text-xs tracking-wider uppercase ${columnTitle}`}>
                {col.label}
              </span>
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
                    onDoubleClick={() => (onViewTicket ? onViewTicket(ticket) : onEditTicket(ticket))}
                    onClick={() => (onViewTicket ? onViewTicket(ticket) : onEditTicket(ticket))}
                    className={`group rounded-xl border p-3.5 transition-all cursor-pointer ${cardBg}`}
                  >
                    {/* Header: Priority & Category & Workspace */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getPriorityBadge(ticket.priority)}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${categoryBadge}`}>
                          {ticket.category}
                        </span>
                        {ticket.commands && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border inline-flex items-center gap-1 ${
                              isDark
                                ? 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
                                : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                            }`}
                            title="Has terminal commands"
                          >
                            <svg className="w-2.5 h-2.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="4 17 10 11 4 5" />
                              <line x1="12" y1="19" x2="20" y2="19" />
                            </svg>
                            <span>commands</span>
                          </span>
                        )}
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
                    <div className="mb-1">
                      <h3 className={`font-medium text-xs leading-snug transition truncate ${cardTitle}`}>
                        <HighlightText text={ticket.title} query={searchTerm} />
                      </h3>
                    </div>

                    {/* Description preview */}
                    {ticket.description && (
                      <p className={`text-[11px] line-clamp-2 mb-2.5 leading-relaxed ${cardDesc}`}>
                        <HighlightText text={ticket.description} query={searchTerm} />
                      </p>
                    )}

                    {/* Author, Timestamp & Actions */}
                    <div className={`flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t mt-2 ${divider}`}>
                      <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                        <span className="truncate">
                          {ticket.createdBy?.split('@')[0] || ticket.createdBy}
                        </span>
                        <span>•</span>
                        <span className="font-mono shrink-0">
                          {formatRelativeTime(ticket.createdAt)}
                        </span>
                      </div>

                      {/* Edit & Delete Action Buttons */}
                      <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onEditTicket(ticket)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
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
                          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
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
