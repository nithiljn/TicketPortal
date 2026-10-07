'use client'

import React from 'react'
import { Ticket, TicketStatus } from '@/types'

interface KanbanBoardProps {
  tickets: Ticket[]
  onStatusChange: (id: string, newStatus: TicketStatus) => Promise<void>
  onEditTicket: (ticket: Ticket) => void
  onDeleteTicket: (id: string) => Promise<void>
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
}: KanbanBoardProps) {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            URGENT
          </span>
        )
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            HIGH
          </span>
        )
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            MEDIUM
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const columnTickets = tickets.filter((t) => t.status === col.id)

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-2xl bg-[#111114] border border-white/[0.06] p-3.5 min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                <span className="font-semibold text-xs tracking-wider uppercase text-zinc-200">
                  {col.label}
                </span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-white/[0.04] border border-white/[0.06] text-zinc-400">
                {columnTickets.length}
              </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
              {columnTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-36 rounded-xl border border-dashed border-white/[0.06] text-zinc-500 text-xs">
                  <span>No tickets</span>
                </div>
              ) : (
                columnTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="group rounded-xl bg-[#16161a] hover:bg-[#1a1a1f] border border-white/[0.06] hover:border-white/[0.12] p-3.5 shadow-sm transition-all text-zinc-100"
                  >
                    {/* Header: Priority & Category */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getPriorityBadge(ticket.priority)}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-white/[0.04] border border-white/[0.06]">
                          {ticket.category}
                        </span>
                      </div>

                      <span
                        className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 truncate max-w-[90px]"
                        title={ticket.projectName}
                      >
                        {ticket.projectName}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-medium text-xs leading-snug mb-1 text-zinc-100 group-hover:text-white transition">
                      {ticket.title}
                    </h3>

                    {/* Description preview */}
                    {ticket.description && (
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mb-2.5 leading-relaxed">
                        {ticket.description}
                      </p>
                    )}

                    {/* Author & Timestamp */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-white/[0.04] mt-2">
                      <span className="text-zinc-400 truncate max-w-[80px]">
                        {ticket.createdBy}
                      </span>
                      <span className="font-mono">
                        {formatRelativeTime(ticket.createdAt)}
                      </span>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center justify-between gap-1 pt-2 mt-2 border-t border-white/[0.04]">
                      {/* Status transitions */}
                      <div className="flex items-center gap-1">
                        {ticket.status !== 'TODO' && (
                          <button
                            onClick={() => onStatusChange(ticket.id, 'TODO')}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 transition cursor-pointer"
                          >
                            To Do
                          </button>
                        )}
                        {ticket.status !== 'IN_PROGRESS' && (
                          <button
                            onClick={() =>
                              onStatusChange(ticket.id, 'IN_PROGRESS')
                            }
                            className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition cursor-pointer"
                          >
                            Work
                          </button>
                        )}
                        {ticket.status !== 'DONE' && (
                          <button
                            onClick={() => onStatusChange(ticket.id, 'DONE')}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition cursor-pointer"
                          >
                            Done
                          </button>
                        )}
                      </div>

                      {/* Edit & Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditTicket(ticket)}
                          title="Edit"
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition cursor-pointer"
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
                          onClick={() => {
                            if (confirm('Delete ticket?')) {
                              onDeleteTicket(ticket.id)
                            }
                          }}
                          title="Delete"
                          className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
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
