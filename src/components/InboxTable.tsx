'use client'

import React from 'react'
import { Ticket, TicketStatus, TicketPriority } from '@/types'

interface InboxTableProps {
  tickets: Ticket[]
  onStatusChange?: (id: string, newStatus: TicketStatus) => Promise<void>
  onViewTicket?: (ticket: Ticket) => void
  onEditTicket: (ticket: Ticket) => void
  onDeleteTicket: (ticket: Ticket) => void
  selectedProject: string
  selectedCategory?: string
  selectedCategories?: string[]
  onClearCategory?: () => void
  onRemoveCategory?: (category: string) => void
  onClearAllCategories?: () => void
  selectedPriority?: TicketPriority | 'ALL'
  selectedPriorities?: TicketPriority[]
  onClearPriority?: () => void
  onRemovePriority?: (priority: TicketPriority) => void
  onClearAllPriorities?: () => void
  selectedStatus?: TicketStatus | 'ALL'
  selectedStatuses?: TicketStatus[]
  onClearStatus?: () => void
  onRemoveStatus?: (status: TicketStatus) => void
  onClearAllStatuses?: () => void
  onClearAllFilters?: () => void
  theme?: 'dark' | 'light'
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Completed',
  BLOCKED: 'Blocked',
}

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

export function InboxTable({
  tickets,
  onStatusChange,
  onViewTicket,
  onEditTicket,
  onDeleteTicket,
  selectedProject,
  selectedCategory,
  selectedCategories,
  onClearCategory,
  onRemoveCategory,
  onClearAllCategories,
  selectedPriority,
  selectedPriorities,
  onClearPriority,
  onRemovePriority,
  onClearAllPriorities,
  selectedStatus,
  selectedStatuses,
  onClearStatus,
  onRemoveStatus,
  onClearAllStatuses,
  onClearAllFilters,
  theme = 'dark',
}: InboxTableProps) {
  const isDark = theme === 'dark'

  const activeStatuses = selectedStatuses ?? (selectedStatus && selectedStatus !== 'ALL' ? [selectedStatus] : [])
  const activePriorities = selectedPriorities ?? (selectedPriority && selectedPriority !== 'ALL' ? [selectedPriority] : [])
  const activeCategories = selectedCategories ?? (selectedCategory && selectedCategory !== 'ALL' ? [selectedCategory] : [])
  const totalActiveFilters = activeStatuses.length + activePriorities.length + activeCategories.length

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'TODO':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
              isDark
                ? 'bg-white/[0.04] text-zinc-300 border-white/[0.08]'
                : 'bg-zinc-100/80 text-zinc-700 border-zinc-200'
            }`}
          >
            <svg className="w-3 h-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
            </svg>
            To Do
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
              isDark
                ? 'bg-white/[0.04] text-zinc-200 border-white/[0.08]'
                : 'bg-zinc-100/80 text-zinc-800 border-zinc-200'
            }`}
          >
            <svg className="w-3 h-3 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9" strokeDasharray="14 14" />
            </svg>
            In Progress
          </span>
        )
      case 'DONE':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
              isDark
                ? 'bg-white/[0.04] text-zinc-200 border-white/[0.08]'
                : 'bg-zinc-100/80 text-zinc-800 border-zinc-200'
            }`}
          >
            <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Completed
          </span>
        )
      case 'BLOCKED':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
              isDark
                ? 'bg-white/[0.04] text-zinc-200 border-white/[0.08]'
                : 'bg-zinc-100/80 text-zinc-800 border-zinc-200'
            }`}
          >
            <svg className="w-3 h-3 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="9" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
            Blocked
          </span>
        )
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 3v13M12 20v1" strokeLinecap="round" />
            </svg>
            Urgent
          </span>
        )
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
            High
          </span>
        )
      case 'MEDIUM':
        return (
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Medium
          </span>
        )
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
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
    ? 'bg-white/[0.06] text-zinc-200 border-white/[0.1]'
    : 'bg-zinc-100 text-zinc-800 border-zinc-200 font-medium'
  
  const categoryBadge = isDark
    ? 'bg-white/[0.04] text-zinc-400 border-white/[0.06]'
    : 'bg-zinc-100 text-zinc-600 border-zinc-200'

  const actionBtn = isDark
    ? 'border-white/[0.08] hover:border-white/[0.18] bg-white/[0.02] hover:bg-white/[0.08] text-zinc-300 hover:text-white'
    : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 shadow-2xs'

  const deleteBtn = isDark
    ? 'border-white/[0.08] hover:border-white/[0.18] bg-white/[0.02] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200'
    : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 shadow-2xs'

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Sub-header inside view */}
      <div className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between text-xs ${subHeaderBorder}`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={subHeaderTitle}>
            {selectedProject === 'ALL' ? 'All Workspaces' : selectedProject}
          </span>
          <span className={isDark ? 'text-zinc-600' : 'text-zinc-300'}>•</span>
          <span className="font-mono text-[11px]">{tickets.length} items</span>

          {/* Active Status Filter Chips */}
          {activeStatuses.map((status) => {
            const label = STATUS_LABELS[status] || status
            return (
              <span
                key={status}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${categoryBadge}`}
              >
                <span className="text-zinc-500 text-[11px]">Status:</span>
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => onRemoveStatus ? onRemoveStatus(status) : onClearStatus?.()}
                  className={`p-0.5 rounded transition cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200'
                  }`}
                  title={`Remove ${label} filter`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )
          })}

          {/* Active Priority Filter Chips */}
          {activePriorities.map((priority) => {
            const label = PRIORITY_LABELS[priority] || priority
            return (
              <span
                key={priority}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${categoryBadge}`}
              >
                <span className="text-zinc-500 text-[11px]">Priority:</span>
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => onRemovePriority ? onRemovePriority(priority) : onClearPriority?.()}
                  className={`p-0.5 rounded transition cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200'
                  }`}
                  title={`Remove ${label} filter`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )
          })}

          {/* Active Category Filter Chips */}
          {activeCategories.map((category) => (
            <span
              key={category}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${categoryBadge}`}
            >
              <span className="text-zinc-500 text-[11px]">Category:</span>
              <span>{category}</span>
              <button
                type="button"
                onClick={() => onRemoveCategory ? onRemoveCategory(category) : onClearCategory?.()}
                className={`p-0.5 rounded transition cursor-pointer ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200'
                }`}
                title={`Remove ${category} filter`}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}

          {/* Clear All Filters */}
          {totalActiveFilters > 1 && onClearAllFilters && (
            <button
              type="button"
              onClick={onClearAllFilters}
              className={`text-[11px] font-medium transition cursor-pointer underline ml-1 ${
                isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Clear all
            </button>
          )}
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
                    <th className="py-2.5 px-4 w-20 font-mono">ID</th>
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
                      onDoubleClick={() => (onViewTicket ? onViewTicket(ticket) : onEditTicket(ticket))}
                      onClick={() => (onViewTicket ? onViewTicket(ticket) : onEditTicket(ticket))}
                    >
                      {/* ID */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                        #{ticket.ticketId || ticket.id.slice(0, 4)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(ticket.status)}
                      </td>

                      {/* Title & Preview */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium transition truncate ${ticketTitle}`}>
                            {ticket.title}
                          </span>
                          {ticket.commands && (
                            <span
                              className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                isDark
                                  ? 'bg-white/[0.04] text-zinc-300 border-white/[0.08]'
                                  : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                              }`}
                              title="Contains execution commands"
                            >
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="4 17 10 11 4 5" />
                                <line x1="12" y1="19" x2="20" y2="19" />
                              </svg>
                              <span>commands</span>
                            </span>
                          )}
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
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditTicket(ticket)
                          }}
                          className={`h-7.5 px-2.5 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 ${actionBtn}`}
                          title="Edit ticket"
                        >
                          <svg
                            className="w-3.5 h-3.5 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => onDeleteTicket(ticket)}
                          className={`h-7.5 px-2.5 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 ${deleteBtn}`}
                          title="Delete ticket"
                        >
                          <svg
                            className="w-3.5 h-3.5 shrink-0 opacity-80"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          <span>Delete</span>
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
                  onDoubleClick={() => (onViewTicket ? onViewTicket(ticket) : onEditTicket(ticket))}
                  onClick={() => (onViewTicket ? onViewTicket(ticket) : onEditTicket(ticket))}
                  className={`rounded-xl border p-3.5 space-y-2.5 shadow-xs cursor-pointer ${
                    isDark
                      ? 'border-white/[0.06] bg-[#111114] active:bg-white/[0.04]'
                      : 'border-zinc-200 bg-white active:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                        #{ticket.ticketId || ticket.id.slice(0, 4)}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-mono ${workspaceBadge}`}>
                        <svg className="w-2.5 h-2.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        {ticket.projectName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(ticket.priority)}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className={`font-medium text-xs ${ticketTitle}`}>
                        {ticket.title}
                      </h3>
                      {ticket.commands && (
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono border ${
                            isDark
                              ? 'bg-white/[0.04] text-zinc-300 border-white/[0.08]'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="4 17 10 11 4 5" />
                            <line x1="12" y1="19" x2="20" y2="19" />
                          </svg>
                          <span>commands</span>
                        </span>
                      )}
                    </div>
                    {ticket.description && (
                      <p className={`text-[11px] line-clamp-2 mt-0.5 ${ticketDesc}`}>
                        {ticket.description}
                      </p>
                    )}
                  </div>

                  <div className={`flex items-center justify-between pt-2 border-t text-[11px] ${
                    isDark ? 'border-white/[0.04]' : 'border-zinc-100'
                  }`}>
                    <div className="flex items-center">
                      {getStatusBadge(ticket.status)}
                    </div>

                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditTicket(ticket)
                        }}
                        className={`h-7.5 px-2.5 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 ${actionBtn}`}
                        title="Edit ticket"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => onDeleteTicket(ticket)}
                        className={`h-7.5 px-2.5 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 ${deleteBtn}`}
                        title="Delete ticket"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Delete</span>
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
