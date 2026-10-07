'use client'

import React from 'react'
import { Ticket, TicketStatus } from '@/types'

interface TableViewProps {
  tickets: Ticket[]
  onStatusChange: (id: string, newStatus: TicketStatus) => Promise<void>
  onEditTicket: (ticket: Ticket) => void
  onDeleteTicket: (id: string) => Promise<void>
}

export function TableView({
  tickets,
  onStatusChange,
  onEditTicket,
  onDeleteTicket,
}: TableViewProps) {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Urgent
          </span>
        )
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            High
          </span>
        )
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-sky-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Medium
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs text-teal-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            Low
          </span>
        )
    }
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-500">
        <svg
          className="w-8 h-8 text-slate-600 mb-2"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <p className="text-sm">No tickets found</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
            <tr>
              <th className="px-4 py-3">Title & Summary</th>
              <th className="px-4 py-3">Project Workspace</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="hover:bg-slate-800/40 transition group"
              >
                <td className="px-4 py-3.5 font-medium text-slate-100 max-w-sm">
                  <div className="truncate font-medium group-hover:text-cyan-300 transition">
                    {ticket.title}
                  </div>
                  {ticket.description && (
                    <div className="text-xs text-slate-400 truncate mt-0.5">
                      {ticket.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5 text-xs font-mono text-cyan-400/90">
                  {ticket.projectName}
                </td>
                <td className="px-4 py-3.5">
                  <select
                    value={ticket.status}
                    onChange={(e) =>
                      onStatusChange(ticket.id, e.target.value as TicketStatus)
                    }
                    className="bg-slate-950 border border-slate-700/80 text-xs rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Completed</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </td>
                <td className="px-4 py-3.5">{getPriorityBadge(ticket.priority)}</td>
                <td className="px-4 py-3.5">
                  <span className="px-2 py-0.5 text-[11px] bg-slate-950 rounded text-slate-400 border border-slate-800 font-mono">
                    {ticket.category}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-400">
                  {ticket.createdBy}
                </td>
                <td className="px-4 py-3.5 text-right space-x-1">
                  <button
                    onClick={() => onEditTicket(ticket)}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
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
                      if (confirm('Delete ticket?')) onDeleteTicket(ticket.id)
                    }}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
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
    </div>
  )
}
