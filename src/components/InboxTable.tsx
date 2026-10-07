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
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            To Do
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            In Progress
          </span>
        )
      case 'DONE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Completed
          </span>
        )
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
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
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
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
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Medium
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-400">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
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
    <div className="flex flex-col flex-1 min-w-0 bg-slate-950">
      {/* Inbox Header */}
      <div className="h-14 px-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
            Inbox
          </h2>
          <span className="text-xs text-slate-500">/</span>
          <span className="text-xs text-cyan-400 font-mono">
            {selectedProject === 'ALL' ? 'All Workspaces' : selectedProject}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
            {tickets.length} items
          </span>
        </div>
      </div>

      {/* Inbox Table Container */}
      <div className="flex-1 overflow-auto p-6">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-slate-500 rounded-2xl border border-dashed border-slate-850">
            <svg
              className="w-10 h-10 text-slate-600 mb-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
            <p className="text-sm font-medium text-slate-400">No tickets in this inbox</p>
            <p className="text-xs text-slate-600 mt-1">
              Select another filter or click New Ticket to create an item.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-850 bg-slate-900/60 shadow-lg">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-semibold select-none">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">Status</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Workspace</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-slate-850/60 transition-colors group cursor-pointer"
                    onClick={() => onEditTicket(ticket)}
                  >
                    {/* Status Pill */}
                    <td
                      className="py-3 px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={ticket.status}
                        onChange={(e) =>
                          onStatusChange(ticket.id, e.target.value as TicketStatus)
                        }
                        className="bg-slate-950 border border-slate-800 text-[11px] rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Completed</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                    </td>

                    {/* Title & Preview */}
                    <td className="py-3 px-4 max-w-md">
                      <div className="font-medium text-slate-100 group-hover:text-cyan-300 transition truncate">
                        {ticket.title}
                      </div>
                      {ticket.description && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5 leading-relaxed">
                          {ticket.description}
                        </div>
                      )}
                    </td>

                    {/* Workspace */}
                    <td className="py-3 px-4 font-mono text-[11px] text-cyan-400/90 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                        {ticket.projectName}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getPriorityBadge(ticket.priority)}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-750 font-mono text-slate-300">
                        {ticket.category}
                      </span>
                    </td>

                    {/* Author */}
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {ticket.createdBy}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatDate(ticket.createdAt)}
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3 px-4 text-right space-x-1 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onEditTicket(ticket)}
                        className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
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
                            confirm('Are you sure you want to delete this ticket?')
                          ) {
                            onDeleteTicket(ticket.id)
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
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
        )}
      </div>
    </div>
  )
}
