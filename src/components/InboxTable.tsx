'use client'

import React from 'react'
import { Ticket, TicketStatus } from '@/types'

interface InboxTableProps {
  tickets: Ticket[]
  onStatusChange: (id: string, newStatus: TicketStatus) => Promise<void>
  onEditTicket: (ticket: Ticket) => void
  onDeleteTicket: (id: string) => Promise<void>
  selectedProject: string
}

export function InboxTable({
  tickets,
  onStatusChange,
  onEditTicket,
  onDeleteTicket,
  selectedProject,
}: InboxTableProps) {
  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'TODO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-white/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            To Do
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            In Progress
          </span>
        )
      case 'DONE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Completed
          </span>
        )
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Blocked
          </span>
        )
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Urgent
          </span>
        )
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            High
          </span>
        )
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Medium
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Low
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Sub-header inside view */}
      <div className="px-4 sm:px-6 py-3 border-b border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="text-zinc-200 font-medium">
            {selectedProject === 'ALL' ? 'All Workspaces' : selectedProject}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="font-mono text-[11px]">{tickets.length} items</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500 rounded-xl border border-dashed border-white/[0.06]">
            <svg
              className="w-8 h-8 text-zinc-600 mb-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
            <p className="text-sm font-medium text-zinc-400">No tickets found</p>
            <p className="text-xs text-zinc-600 mt-0.5">
              Adjust your filters or create a new ticket.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on small screens) */}
            <div className="hidden sm:block overflow-hidden rounded-xl border border-white/[0.06] bg-[#111114]">
              <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                <thead className="bg-[#151518] border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-zinc-400 font-semibold select-none">
                  <tr>
                    <th className="py-2.5 px-4 w-32">Status</th>
                    <th className="py-2.5 px-4">Title & Details</th>
                    <th className="py-2.5 px-4">Workspace</th>
                    <th className="py-2.5 px-4">Priority</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Created</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => onEditTicket(ticket)}
                    >
                      {/* Status */}
                      <td
                        className="py-3 px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={ticket.status}
                          onChange={(e) =>
                            onStatusChange(
                              ticket.id,
                              e.target.value as TicketStatus
                            )
                          }
                          className="bg-[#18181b] border border-white/[0.08] text-[11px] rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/[0.2] cursor-pointer"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Completed</option>
                          <option value="BLOCKED">Blocked</option>
                        </select>
                      </td>

                      {/* Title & Preview */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-zinc-100 group-hover:text-white transition truncate">
                          {ticket.title}
                        </div>
                        {ticket.description && (
                          <div className="text-[11px] text-zinc-400 truncate mt-0.5 leading-relaxed">
                            {ticket.description}
                          </div>
                        )}
                      </td>

                      {/* Workspace */}
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                          {ticket.projectName}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getPriorityBadge(ticket.priority)}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-white/[0.04] border border-white/[0.06] font-mono text-zinc-400">
                          {ticket.category}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                        {formatDate(ticket.createdAt)}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 text-right space-x-1 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onEditTicket(ticket)}
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition cursor-pointer"
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
                          onClick={() => {
                            if (
                              confirm(
                                'Are you sure you want to delete this ticket?'
                              )
                            ) {
                              onDeleteTicket(ticket.id)
                            }
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Card List (Shown only on small screens) */}
            <div className="sm:hidden space-y-2.5">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => onEditTicket(ticket)}
                  className="rounded-xl border border-white/[0.06] bg-[#111114] p-3.5 space-y-2.5 shadow-sm active:bg-white/[0.04]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                      {ticket.projectName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(ticket.priority)}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-xs text-zinc-100">
                      {ticket.title}
                    </h3>
                    {ticket.description && (
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                        {ticket.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[11px]">
                    <div onClick={(e) => e.stopPropagation()}>
                      <select
                        value={ticket.status}
                        onChange={(e) =>
                          onStatusChange(
                            ticket.id,
                            e.target.value as TicketStatus
                          )
                        }
                        className="bg-[#18181b] border border-white/[0.08] text-[11px] rounded px-2 py-1 text-zinc-200"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Completed</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                    </div>

                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onEditTicket(ticket)}
                        className="p-1 text-zinc-400 hover:text-white"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete ticket?'))
                            onDeleteTicket(ticket.id)
                        }}
                        className="p-1 text-zinc-400 hover:text-rose-400"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
