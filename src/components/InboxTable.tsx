'use client'

import React from 'react'
import { Ticket, TicketStatus } from '@/types'

interface InboxTableProps {
  tickets: Ticket[]
  onStatusChange: (id: string, newStatus: TicketStatus) => Promise<void>
  onEditTicket: (ticket: Ticket) => void
  onDeleteTicket: (ticket: Ticket) => void
  selectedProject: string
  theme?: 'dark' | 'light'
}

export function InboxTable({
  tickets,
  onStatusChange,
  onEditTicket,
  onDeleteTicket,
  selectedProject,
  theme = 'dark',
}: InboxTableProps) {
  const isDark = theme === 'dark'

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'TODO':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
              isDark
                ? 'bg-zinc-800/80 text-zinc-300 border-white/[0.08]'
                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            To Do
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
              isDark
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            In Progress
          </span>
        )
      case 'DONE':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
              isDark
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Completed
          </span>
        )
      case 'BLOCKED':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
              isDark
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
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
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-500">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Urgent
          </span>
        )
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-500">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            High
          </span>
        )
      case 'MEDIUM':
        return (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
              isDark ? 'text-zinc-300' : 'text-zinc-600'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Medium
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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

  // Theme-aware styles
  const subHeaderBorder = isDark ? 'border-white/[0.06] text-zinc-400' : 'border-zinc-200 text-zinc-500'
  const subHeaderTitle = isDark ? 'text-zinc-200' : 'text-zinc-900 font-semibold'
  const emptyBorder = isDark ? 'border-white/[0.06] text-zinc-500' : 'border-zinc-200 text-zinc-400'
  const tableContainer = isDark ? 'border-white/[0.06] bg-[#111114]' : 'border-zinc-200 bg-white shadow-xs'
  const tableThead = isDark ? 'bg-[#151518] border-white/[0.06] text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
  const tableRowDivide = isDark ? 'divide-white/[0.04]' : 'divide-zinc-200/80'
  const tableRowHover = isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50/70'
  const ticketTitle = isDark ? 'text-zinc-100 group-hover:text-white' : 'text-zinc-900 group-hover:text-zinc-950'
  const ticketDesc = isDark ? 'text-zinc-400' : 'text-zinc-500'
  
  // Clean, high-visibility workspace badge
  const workspaceBadge = isDark
    ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
    : 'bg-sky-50 text-sky-700 border-sky-200 font-medium'
  
  const categoryBadge = isDark
    ? 'bg-white/[0.04] text-zinc-400 border-white/[0.06]'
    : 'bg-zinc-100 text-zinc-600 border-zinc-200'

  const selectBg = isDark
    ? 'bg-[#18181b] border-white/[0.08] text-zinc-200 focus:border-white/[0.2]'
    : 'bg-white border-zinc-200 text-zinc-800 shadow-2xs focus:border-zinc-400'

  const actionBtn = isDark
    ? 'text-zinc-400 hover:text-white hover:bg-white/[0.08]'
    : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100'

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Sub-header inside view */}
      <div className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between text-xs ${subHeaderBorder}`}>
        <div className="flex items-center gap-2">
          <span className={subHeaderTitle}>
            {selectedProject === 'ALL' ? 'All Workspaces' : selectedProject}
          </span>
          <span className={isDark ? 'text-zinc-600' : 'text-zinc-300'}>•</span>
          <span className="font-mono text-[11px]">{tickets.length} items</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {tickets.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-24 rounded-xl border border-dashed ${emptyBorder}`}>
            <svg
              className={`w-8 h-8 mb-2 ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
            <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>No tickets found</p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Adjust your filters or create a new ticket.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on small screens) */}
            <div className={`hidden sm:block overflow-hidden rounded-xl border ${tableContainer}`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead className={`border-b text-[10px] uppercase tracking-wider font-semibold select-none ${tableThead}`}>
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
                <tbody className={`divide-y ${tableRowDivide}`}>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className={`transition-colors group cursor-pointer ${tableRowHover}`}
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
                          className={`text-[11px] rounded-lg px-2 py-1 focus:outline-none cursor-pointer border ${selectBg}`}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Completed</option>
                          <option value="BLOCKED">Blocked</option>
                        </select>
                      </td>

                      {/* Title & Preview */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className={`font-medium transition truncate ${ticketTitle}`}>
                          {ticket.title}
                        </div>
                        {ticket.description && (
                          <div className={`text-[11px] truncate mt-0.5 leading-relaxed ${ticketDesc}`}>
                            {ticket.description}
                          </div>
                        )}
                      </td>

                      {/* Workspace Badge (Distinct, High-Contrast) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-mono ${workspaceBadge}`}>
                          <svg className="w-3 h-3 opacity-70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                          <span>{ticket.projectName}</span>
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getPriorityBadge(ticket.priority)}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] border font-mono ${categoryBadge}`}>
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
                          className={`p-1 rounded transition cursor-pointer ${actionBtn}`}
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
                          className="p-1 rounded text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
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
                  className={`rounded-xl border p-3.5 space-y-2.5 shadow-xs ${
                    isDark
                      ? 'border-white/[0.06] bg-[#111114] active:bg-white/[0.04]'
                      : 'border-zinc-200 bg-white active:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-mono ${workspaceBadge}`}>
                      <svg className="w-2.5 h-2.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      {ticket.projectName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(ticket.priority)}
                    </div>
                  </div>

                  <div>
                    <h3 className={`font-medium text-xs ${ticketTitle}`}>
                      {ticket.title}
                    </h3>
                    {ticket.description && (
                      <p className={`text-[11px] line-clamp-2 mt-0.5 ${ticketDesc}`}>
                        {ticket.description}
                      </p>
                    )}
                  </div>

                  <div className={`flex items-center justify-between pt-2 border-t text-[11px] ${
                    isDark ? 'border-white/[0.04]' : 'border-zinc-100'
                  }`}>
                    <div onClick={(e) => e.stopPropagation()}>
                      <select
                        value={ticket.status}
                        onChange={(e) =>
                          onStatusChange(
                            ticket.id,
                            e.target.value as TicketStatus
                          )
                        }
                        className={`text-[11px] rounded px-2 py-1 border ${selectBg}`}
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
                        className={`p-1 rounded ${actionBtn}`}
                        title="Edit ticket"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDeleteTicket(ticket)}
                        className="p-1 rounded text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10"
                        title="Delete ticket"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
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
