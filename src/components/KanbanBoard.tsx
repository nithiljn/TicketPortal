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
  accentColor: string
  badgeStyle: string
}[] = [
  {
    id: 'TODO',
    label: 'To Do',
    accentColor: 'border-sky-500/40 text-sky-400',
    badgeStyle: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  },
  {
    id: 'IN_PROGRESS',
    label: 'In Progress',
    accentColor: 'border-cyan-500/40 text-cyan-400',
    badgeStyle: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  },
  {
    id: 'DONE',
    label: 'Completed',
    accentColor: 'border-emerald-500/40 text-emerald-400',
    badgeStyle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'BLOCKED',
    label: 'Blocked',
    accentColor: 'border-rose-500/40 text-rose-400',
    badgeStyle: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  },
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            URGENT
          </span>
        )
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            HIGH
          </span>
        )
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            MEDIUM
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
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
            className="flex flex-col rounded-2xl bg-slate-900/80 border border-slate-800/80 p-4 backdrop-blur-md min-h-[550px] shadow-lg shadow-black/20"
          >
            {/* Column Header */}
            <div
              className={`flex items-center justify-between pb-3 mb-3 border-b ${col.accentColor}`}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs uppercase tracking-wider text-slate-100">
                  {col.label}
                </span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-md font-mono border ${col.badgeStyle}`}
              >
                {columnTickets.length}
              </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
              {columnTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-slate-800/80 text-slate-500 text-xs">
                  <span>No tickets in this section</span>
                </div>
              ) : (
                columnTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="group rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-cyan-500/50 p-4 shadow-sm hover:shadow-cyan-950/20 transition-all text-slate-100"
                  >
                    {/* Header: Priority & Category */}
                    <div className="flex items-center justify-between gap-1 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getPriorityBadge(ticket.priority)}
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800/90 border border-slate-700/60">
                          {ticket.category}
                        </span>
                      </div>

                      <span
                        className="text-[10px] text-cyan-400/90 font-mono flex items-center gap-1 truncate max-w-[100px]"
                        title={ticket.projectName}
                      >
                        <svg
                          className="w-3 h-3 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="truncate">{ticket.projectName}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-medium text-sm leading-snug mb-1 text-slate-100 group-hover:text-cyan-300 transition">
                      {ticket.title}
                    </h3>

                    {/* Description preview */}
                    {ticket.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                        {ticket.description}
                      </p>
                    )}

                    {/* Author & Timestamp */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2.5 border-t border-slate-800/80 mt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-[10px] font-bold">
                          {ticket.createdBy?.[0]?.toUpperCase() || 'U'}
                        </span>
                        <span className="text-slate-400 truncate max-w-[80px]">
                          {ticket.createdBy}
                        </span>
                      </div>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {formatRelativeTime(ticket.createdAt)}
                      </span>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center justify-between gap-1 pt-2.5 mt-2 border-t border-slate-800/60">
                      {/* Status transitions */}
                      <div className="flex items-center gap-1">
                        {ticket.status !== 'TODO' && (
                          <button
                            onClick={() => onStatusChange(ticket.id, 'TODO')}
                            title="Move to To Do"
                            className="px-2 py-1 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          >
                            To Do
                          </button>
                        )}
                        {ticket.status !== 'IN_PROGRESS' && (
                          <button
                            onClick={() =>
                              onStatusChange(ticket.id, 'IN_PROGRESS')
                            }
                            title="Move to In Progress"
                            className="px-2 py-1 rounded text-[10px] font-medium bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition cursor-pointer"
                          >
                            In Progress
                          </button>
                        )}
                        {ticket.status !== 'DONE' && (
                          <button
                            onClick={() => onStatusChange(ticket.id, 'DONE')}
                            title="Mark Completed"
                            className="px-2 py-1 rounded text-[10px] font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
                          >
                            Complete
                          </button>
                        )}
                      </div>

                      {/* Edit & Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditTicket(ticket)}
                          title="Edit ticket"
                          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
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
                            if (
                              confirm('Are you sure you want to delete this ticket?')
                            ) {
                              onDeleteTicket(ticket.id)
                            }
                          }}
                          title="Delete ticket"
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
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
