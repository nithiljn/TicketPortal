'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Ticket, TicketStatus, TicketPriority } from '@/types'

interface InboxTableProps {
  tickets: Ticket[]
  onStatusChange?: (id: string, newStatus: TicketStatus) => Promise<void>
  onViewTicket?: (ticket: Ticket) => void
  onEditTicket: (ticket: Ticket) => void
  onDeleteTicket: (ticket: Ticket) => void
  onToggleBookmark?: (ticket: Ticket) => Promise<void> | void
  showOnlyBookmarked?: boolean
  onToggleBookmarkedFilter?: () => void
  bookmarkedCount?: number
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
  selectedVersion?: string | 'ALL'
  selectedVersions?: string[]
  onClearVersion?: () => void
  onRemoveVersion?: (version: string) => void
  onClearAllVersions?: () => void
  ticketIdFilter?: string
  onSelectTicketIdFilter?: (id: string) => void
  onClearTicketIdFilter?: () => void
  onClearAllFilters?: () => void
  theme?: 'dark' | 'light'
  // Server-side pagination
  serverPagination?: boolean
  currentPage?: number
  pageSize?: number
  totalTicketsCount?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
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
  onToggleBookmark,
  showOnlyBookmarked = false,
  onToggleBookmarkedFilter,
  bookmarkedCount,
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
  selectedVersion,
  selectedVersions,
  onClearVersion,
  onRemoveVersion,
  onClearAllVersions,
  ticketIdFilter = '',
  onSelectTicketIdFilter,
  onClearTicketIdFilter,
  onClearAllFilters,
  theme = 'dark',
  serverPagination = false,
  currentPage: controlledPage,
  pageSize: controlledPageSize,
  totalTicketsCount,
  onPageChange,
  onPageSizeChange,
}: InboxTableProps) {
  const isDark = theme === 'dark'

  // Pagination State (controlled if serverPagination, internal otherwise)
  const [internalCurrentPage, setInternalCurrentPage] = useState(1)
  const [internalPageSize, setInternalPageSize] = useState(20)

  const activeCurrentPage = serverPagination && controlledPage !== undefined ? controlledPage : internalCurrentPage
  const activePageSize = serverPagination && controlledPageSize !== undefined ? controlledPageSize : internalPageSize
  const effectiveTotalCount = serverPagination && typeof totalTicketsCount === 'number' ? totalTicketsCount : tickets.length

  // Reset internal page when tickets count or filters change (for client pagination)
  useEffect(() => {
    if (!serverPagination) {
      setInternalCurrentPage(1)
    }
  }, [
    serverPagination,
    tickets.length,
    selectedProject,
    selectedCategory,
    selectedCategories?.length,
    selectedPriority,
    selectedPriorities?.length,
    selectedStatus,
    selectedStatuses?.length,
    selectedVersion,
    selectedVersions?.length,
    showOnlyBookmarked,
    ticketIdFilter,
  ])

  const totalPages = Math.max(1, Math.ceil(effectiveTotalCount / activePageSize))
  const safeCurrentPage = Math.min(activeCurrentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * activePageSize
  const endIndex = serverPagination
    ? Math.min(startIndex + tickets.length, effectiveTotalCount)
    : Math.min(startIndex + activePageSize, effectiveTotalCount)

  const paginatedTickets = useMemo(() => {
    if (serverPagination) {
      return tickets
    }
    return tickets.slice(startIndex, endIndex)
  }, [serverPagination, tickets, startIndex, endIndex])

  const handlePageChange = (newPage: number) => {
    if (serverPagination && onPageChange) {
      onPageChange(newPage)
    } else {
      setInternalCurrentPage(newPage)
    }
  }

  const handlePageSizeChange = (newSize: number) => {
    if (serverPagination && onPageSizeChange) {
      onPageSizeChange(newSize)
    } else {
      setInternalPageSize(newSize)
      setInternalCurrentPage(1)
    }
  }

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (safeCurrentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages]
    }
    if (safeCurrentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages]
  }, [safeCurrentPage, totalPages])

  const activeStatuses = selectedStatuses ?? (selectedStatus && selectedStatus !== 'ALL' ? [selectedStatus] : [])
  const activePriorities = selectedPriorities ?? (selectedPriority && selectedPriority !== 'ALL' ? [selectedPriority] : [])
  const activeCategories = selectedCategories ?? (selectedCategory && selectedCategory !== 'ALL' ? [selectedCategory] : [])
  const activeVersions = selectedVersions ?? (selectedVersion && selectedVersion !== 'ALL' ? [selectedVersion] : [])
  const totalActiveFilters =
    activeStatuses.length +
    activePriorities.length +
    activeCategories.length +
    activeVersions.length +
    (showOnlyBookmarked ? 1 : 0) +
    (ticketIdFilter?.trim() ? 1 : 0)

  const getStatusBadge = (status: TicketStatus) => {
    // Apple-style monochrome capsule badge — no colored icons
    const capsuleBase = `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-normal border`
    const capsuleColor = isDark
      ? 'bg-white/[0.08] text-[#f5f5f7] border-white/[0.08]'
      : 'bg-[#f5f5f7] text-[#1d1d1f] border-black/[0.06]'

    switch (status) {
      case 'TODO':
        return (
          <span className={`${capsuleBase} ${capsuleColor}`}>
            <svg className="w-3 h-3 opacity-50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
            </svg>
            To Do
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className={`${capsuleBase} ${capsuleColor}`}>
            <svg className="w-3 h-3 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" strokeDasharray="14 14" />
            </svg>
            In Progress
          </span>
        )
      case 'DONE':
        return (
          <span className={`${capsuleBase} ${capsuleColor}`}>
            <svg className="w-3 h-3 opacity-70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Completed
          </span>
        )
      case 'BLOCKED':
        return (
          <span className={`${capsuleBase} ${capsuleColor}`}>
            <svg className="w-3 h-3 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
            Blocked
          </span>
        )
    }
  }

  const getPriorityBadge = (priority: string) => {
    // Apple-style: monochrome text + icon — NO colored text
    const monoText = isDark ? 'text-[#ebebf5]/60' : 'text-[#1d1d1f]/50'

    const iconMap: Record<string, React.ReactNode> = {
      URGENT: (
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 3v13M12 20v1" />
        </svg>
      ),
      HIGH: (
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      ),
      MEDIUM: (
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      LOW: (
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      ),
    }
    const labelMap: Record<string, string> = { URGENT: 'Urgent', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-normal ${monoText}`}>
        {iconMap[priority] ?? iconMap['LOW']}
        {labelMap[priority] ?? 'Low'}
      </span>
    )
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

  // Theme-aware styles — Apple Design tokens
  const subHeaderBorder = isDark ? 'border-white/[0.06] text-[#ebebf5]/50' : 'border-black/[0.06] text-[#1d1d1f]/50'
  const subHeaderTitle = isDark ? 'text-[#f5f5f7]' : 'text-[#1d1d1f] font-semibold'
  const emptyBorder = isDark ? 'border-white/[0.08] text-[#ebebf5]/30' : 'border-black/[0.08] text-[#1d1d1f]/30'
  const tableContainer = isDark ? 'border-white/[0.08] bg-[#1c1c1e]' : 'border-black/[0.06] bg-white shadow-sm'
  const tableThead = isDark ? 'bg-black/20 border-white/[0.06] text-[#ebebf5]/40' : 'bg-[#f5f5f7] border-black/[0.06] text-[#1d1d1f]/40'
  const tableRowDivide = isDark ? 'divide-white/[0.04]' : 'divide-black/[0.04]'
  const tableRowHover = isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-[#f5f5f7]/70'
  const ticketTitle = isDark ? 'text-[#f5f5f7] group-hover:text-white' : 'text-[#1d1d1f] group-hover:text-black'
  const ticketDesc = isDark ? 'text-[#ebebf5]/40' : 'text-[#1d1d1f]/40'

  // Apple capsule badge — neutral, no color
  const workspaceBadge = isDark
    ? 'bg-white/[0.08] text-[#f5f5f7] border-white/[0.08]'
    : 'bg-[#f5f5f7] text-[#1d1d1f] border-black/[0.06] font-medium'

  const categoryBadge = isDark
    ? 'bg-white/[0.06] text-[#ebebf5]/60 border-white/[0.08]'
    : 'bg-[#f5f5f7] text-[#1d1d1f]/60 border-black/[0.06]'

  // Apple ghost button — rounded-full, no blue
  const actionBtn = isDark
    ? 'border-white/[0.08] hover:border-white/[0.18] bg-white/[0.04] hover:bg-white/[0.1] text-[#ebebf5]/70 hover:text-white'
    : 'border-black/[0.08] hover:border-black/[0.16] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f]/60 hover:text-[#1d1d1f]'

  const deleteBtn = isDark
    ? 'border-white/[0.08] hover:border-white/[0.18] bg-white/[0.04] hover:bg-white/[0.08] text-[#ebebf5]/50 hover:text-[#ff453a]'
    : 'border-black/[0.08] hover:border-black/[0.16] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f]/40 hover:text-[#ff3b30]'

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Sub-header inside view */}
      <div className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between text-xs ${subHeaderBorder}`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={subHeaderTitle}>
            {selectedProject === 'ALL' ? 'All Workspaces' : selectedProject}
          </span>
          <span className={isDark ? 'text-[#ebebf5]/20' : 'text-black/20'}>•</span>
          <span className={`font-mono text-[11px] ${isDark ? 'text-[#ebebf5]/40' : 'text-[#1d1d1f]/40'}`}>{tickets.length} items</span>

          {/* Active Status Filter Chips */}
          {activeStatuses.map((status) => {
            const label = STATUS_LABELS[status] || status
            return (
              <span
                key={status}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-normal border ${categoryBadge}`}
              >
                <span className={`text-[10px] ${isDark ? 'text-[#ebebf5]/30' : 'text-[#1d1d1f]/40'}`}>Status:</span>
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => onRemoveStatus ? onRemoveStatus(status) : onClearStatus?.()}
                  className={`p-0.5 rounded-full transition cursor-pointer ${
                    isDark ? 'text-[#ebebf5]/40 hover:text-white hover:bg-white/10' : 'text-[#1d1d1f]/40 hover:text-[#1d1d1f] hover:bg-black/10'
                  }`}
                  title={`Remove ${label} filter`}
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-normal border ${categoryBadge}`}
              >
                <span className={`text-[10px] ${isDark ? 'text-[#ebebf5]/30' : 'text-[#1d1d1f]/40'}`}>Priority:</span>
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => onRemovePriority ? onRemovePriority(priority) : onClearPriority?.()}
                  className={`p-0.5 rounded-full transition cursor-pointer ${
                    isDark ? 'text-[#ebebf5]/40 hover:text-white hover:bg-white/10' : 'text-[#1d1d1f]/40 hover:text-[#1d1d1f] hover:bg-black/10'
                  }`}
                  title={`Remove ${label} filter`}
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )
          })}

          {/* Active Category Filter Chips */}
          {activeCategories.map((category) => (
            <span
              key={category}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-normal border ${categoryBadge}`}
            >
              <span className={`text-[10px] ${isDark ? 'text-[#ebebf5]/30' : 'text-[#1d1d1f]/40'}`}>Category:</span>
              <span>{category}</span>
              <button
                type="button"
                onClick={() => onRemoveCategory ? onRemoveCategory(category) : onClearCategory?.()}
                className={`p-0.5 rounded-full transition cursor-pointer ${
                  isDark ? 'text-[#ebebf5]/40 hover:text-white hover:bg-white/10' : 'text-[#1d1d1f]/40 hover:text-[#1d1d1f] hover:bg-black/10'
                }`}
                title={`Remove ${category} filter`}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}

          {/* Active Version Filter Chips */}
          {activeVersions.map((version) => (
            <span
              key={version}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-normal border ${categoryBadge}`}
            >
              <span className={`text-[10px] ${isDark ? 'text-[#ebebf5]/30' : 'text-[#1d1d1f]/40'}`}>Version:</span>
              <span className="font-mono">{version}</span>
              <button
                type="button"
                onClick={() => onRemoveVersion ? onRemoveVersion(version) : onClearVersion?.()}
                className={`p-0.5 rounded-full transition cursor-pointer ${
                  isDark ? 'text-[#ebebf5]/40 hover:text-white hover:bg-white/10' : 'text-[#1d1d1f]/40 hover:text-[#1d1d1f] hover:bg-black/10'
                }`}
                title={`Remove ${version} filter`}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}

          {/* Active Ticket ID Filter Chip */}
          {ticketIdFilter?.trim() && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-normal border ${categoryBadge}`}
            >
              <span className={`text-[10px] ${isDark ? 'text-[#ebebf5]/30' : 'text-[#1d1d1f]/40'}`}>Ticket ID:</span>
              <span className="font-mono">{ticketIdFilter.startsWith('#') ? ticketIdFilter : `#${ticketIdFilter}`}</span>
              <button
                type="button"
                onClick={onClearTicketIdFilter}
                className={`p-0.5 rounded-full transition cursor-pointer ${
                  isDark ? 'text-[#ebebf5]/40 hover:text-white hover:bg-white/10' : 'text-[#1d1d1f]/40 hover:text-[#1d1d1f] hover:bg-black/10'
                }`}
                title="Remove Ticket ID filter"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          )}

          {/* Clear All Filters */}
          {totalActiveFilters > 1 && onClearAllFilters && (
            <button
              type="button"
              onClick={onClearAllFilters}
              className={`text-[11px] font-normal transition cursor-pointer underline ml-1 ${
                isDark ? 'text-[#ebebf5]/40 hover:text-[#f5f5f7]' : 'text-[#1d1d1f]/40 hover:text-[#1d1d1f]'
              }`}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Bookmark Filter Toggle */}
        {onToggleBookmarkedFilter && (
          <button
            type="button"
            onClick={onToggleBookmarkedFilter}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal border transition-all duration-150 cursor-pointer shrink-0 select-none ${
              showOnlyBookmarked
                ? isDark
                  ? 'bg-white border-white text-zinc-950 shadow-sm'
                  : 'bg-zinc-950 border-zinc-950 text-white shadow-sm'
                : isDark
                  ? 'bg-white/[0.04] border-white/[0.08] hover:border-white/[0.16] text-[#ebebf5]/60 hover:text-[#f5f5f7]'
                  : 'bg-white border-black/[0.08] hover:border-black/[0.16] text-[#1d1d1f]/60 hover:text-[#1d1d1f]'
            }`}
            title={showOnlyBookmarked ? 'Show all tickets' : 'Show bookmarked tickets only'}
          >
            <svg
              className={`w-3.5 h-3.5 transition-colors ${
                showOnlyBookmarked
                  ? 'fill-current'
                  : 'fill-none'
              }`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span>Bookmarked</span>
            {typeof bookmarkedCount === 'number' && bookmarkedCount > 0 && (
              <span
                className={`px-1.5 rounded-full text-[10px] font-mono font-medium ${
                  showOnlyBookmarked
                    ? isDark
                      ? 'bg-black/20 text-current'
                      : 'bg-white/20 text-current'
                    : isDark
                      ? 'bg-white/[0.08] text-[#ebebf5]/60'
                      : 'bg-black/[0.06] text-[#1d1d1f]/60'
                }`}
              >
                {bookmarkedCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {tickets.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-24 rounded-[20px] border border-dashed ${emptyBorder}`}>
            <svg
              className={`w-8 h-8 mb-2 ${isDark ? 'text-[#ebebf5]/20' : 'text-[#1d1d1f]/20'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
            <p className={`text-sm font-medium ${isDark ? 'text-[#ebebf5]/50' : 'text-[#1d1d1f]/50'}`}>No tickets found</p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#ebebf5]/30' : 'text-[#1d1d1f]/30'}`}>
              {ticketIdFilter?.trim()
                ? `No ticket matches Ticket ID "${ticketIdFilter.startsWith('#') ? ticketIdFilter : `#${ticketIdFilter}`}".`
                : 'Adjust your filters or create a new ticket.'}
            </p>
            {ticketIdFilter?.trim() ? (
              <button
                type="button"
                onClick={onClearTicketIdFilter}
                className={`mt-4 px-4 py-1.5 rounded-full text-xs font-normal border transition-all duration-150 active:scale-95 cursor-pointer ${
                  isDark
                    ? 'border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.12] text-[#f5f5f7]'
                    : 'border-black/[0.1] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f]'
                }`}
              >
                Clear ID filter
              </button>
            ) : totalActiveFilters > 0 && onClearAllFilters ? (
              <button
                type="button"
                onClick={onClearAllFilters}
                className={`mt-4 px-4 py-1.5 rounded-full text-xs font-normal border transition-all duration-150 active:scale-95 cursor-pointer ${
                  isDark
                    ? 'border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.12] text-[#f5f5f7]'
                    : 'border-black/[0.1] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f]'
                }`}
              >
                Clear all filters
              </button>
            ) : null}
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on small screens) */}
            <div className={`hidden sm:block overflow-hidden rounded-[20px] border ${tableContainer}`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead className={`border-b text-[10px] uppercase tracking-wider font-semibold select-none ${tableThead}`}>
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center" title="Bookmark">
                      <svg className="w-3.5 h-3.5 mx-auto opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </th>
                    <th className="py-2.5 px-3 w-20 font-mono">ID</th>
                    <th className="py-2.5 px-4 w-32">Status</th>
                    <th className="py-2.5 px-4">Title</th>
                    <th className="py-2.5 px-4">Workspace</th>
                    <th className="py-2.5 px-4">Version</th>
                    <th className="py-2.5 px-4">Priority</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Created</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${tableRowDivide}`}>
                  {paginatedTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className={`transition-colors group cursor-pointer ${tableRowHover}`}
                      onDoubleClick={() => (onViewTicket ? onViewTicket(ticket) : onEditTicket(ticket))}
                      onClick={() => (onViewTicket ? onViewTicket(ticket) : onEditTicket(ticket))}
                    >
                      {/* Bookmark Toggle Column */}
                      <td
                        className="py-3 px-3 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleBookmark?.(ticket)
                          }}
                          className={`p-1.5 rounded-full border transition-all duration-150 active:scale-[0.96] cursor-pointer inline-flex items-center justify-center ${
                            ticket.isBookmarked
                              ? isDark
                                ? 'bg-white/[0.08] border-white/[0.14] text-white hover:bg-white/[0.12] shadow-2xs'
                                : 'bg-zinc-100 border-zinc-300 text-zinc-900 hover:bg-zinc-200 shadow-2xs'
                              : isDark
                                ? 'bg-transparent border-transparent hover:border-white/[0.08] text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                                : 'bg-transparent border-transparent hover:border-zinc-200 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                          }`}
                          title={ticket.isBookmarked ? 'Remove bookmark' : 'Bookmark this ticket'}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill={ticket.isBookmarked ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth={ticket.isBookmarked ? '1.5' : '2'}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>
                      </td>

                      {/* ID */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            const rawId = ticket.ticketId || ticket.id.slice(0, 4)
                            onSelectTicketIdFilter?.(rawId)
                          }}
                          className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded transition cursor-pointer text-left ${
                            isDark
                              ? 'text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                              : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100'
                          }`}
                          title={`Filter by #${ticket.ticketId || ticket.id.slice(0, 4)}`}
                        >
                          #{ticket.ticketId || ticket.id.slice(0, 4)}
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(ticket.status)}
                      </td>

                      {/* Title */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium transition truncate ${ticketTitle}`}>
                            {ticket.title}
                          </span>
                        </div>
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

                      {/* Version Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {ticket.version ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-mono font-medium ${
                            isDark
                              ? 'bg-white/[0.04] text-zinc-300 border-white/[0.08]'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}>
                            <svg className="w-3 h-3 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                              <line x1="7" y1="7" x2="7.01" y2="7" />
                            </svg>
                            <span>{ticket.version}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600 font-mono text-[11px]">
                            —
                          </span>
                        )}
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
                        {onViewTicket && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onViewTicket(ticket)
                            }}
                            className={`h-7 px-3 rounded-full border text-xs font-normal transition-all duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 ${actionBtn}`}
                            title="View ticket details"
                          >
                            <svg
                              className="w-3.5 h-3.5 shrink-0 opacity-80"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            <span>View</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditTicket(ticket)
                          }}
                          className={`h-7 px-3 rounded-full border text-xs font-normal transition-all duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 ${actionBtn}`}
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
                          className={`h-7 px-3 rounded-full border text-xs font-normal transition-all duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 ${deleteBtn}`}
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
              {paginatedTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onDoubleClick={() => (onViewTicket ? onViewTicket(ticket) : onEditTicket(ticket))}
                  onClick={() => (onViewTicket ? onViewTicket(ticket) : onEditTicket(ticket))}
                  className={`rounded-[20px] border p-3.5 space-y-2.5 cursor-pointer ${
                    isDark
                      ? 'border-white/[0.08] bg-[#1c1c1e] active:bg-white/[0.04]'
                      : 'border-black/[0.06] bg-white active:bg-[#f5f5f7]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          const rawId = ticket.ticketId || ticket.id.slice(0, 4)
                          onSelectTicketIdFilter?.(rawId)
                        }}
                        className={`font-mono text-[10px] font-normal px-2 py-0.5 rounded-full transition cursor-pointer text-left ${
                          isDark
                            ? 'text-[#ebebf5]/40 hover:text-[#f5f5f7] hover:bg-white/[0.08]'
                            : 'text-[#1d1d1f]/40 hover:text-[#1d1d1f] hover:bg-black/[0.06]'
                        }`}
                        title={`Filter by #${ticket.ticketId || ticket.id.slice(0, 4)}`}
                      >
                        #{ticket.ticketId || ticket.id.slice(0, 4)}
                      </button>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono ${workspaceBadge}`}>
                        <svg className="w-2.5 h-2.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        {ticket.projectName}
                      </span>
                      {ticket.version && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-normal ${
                          isDark
                            ? 'bg-white/[0.08] text-[#f5f5f7] border-white/[0.08]'
                            : 'bg-[#f5f5f7] text-[#1d1d1f] border-black/[0.06]'
                        }`}>
                          <svg className="w-2.5 h-2.5 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                            <line x1="7" y1="7" x2="7.01" y2="7" />
                          </svg>
                          {ticket.version}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleBookmark?.(ticket)
                        }}
                        className={`p-1 rounded-full border transition-all duration-150 active:scale-[0.96] cursor-pointer inline-flex items-center justify-center ${
                          ticket.isBookmarked
                            ? isDark
                              ? 'bg-white/[0.1] border-white/[0.18] text-white'
                              : 'bg-black/[0.06] border-black/[0.1] text-[#1d1d1f]'
                            : isDark
                              ? 'border-transparent text-[#ebebf5]/30 hover:text-[#f5f5f7]'
                              : 'border-transparent text-[#1d1d1f]/30 hover:text-[#1d1d1f]'
                        }`}
                        title={ticket.isBookmarked ? 'Remove bookmark' : 'Bookmark this ticket'}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill={ticket.isBookmarked ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth={ticket.isBookmarked ? '1.5' : '2'}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                      {getPriorityBadge(ticket.priority)}
                    </div>
                  </div>

                  <div>
                    <h3 className={`font-medium text-xs ${ticketTitle}`}>
                      {ticket.title}
                    </h3>
                  </div>

                  <div className={`flex items-center justify-between pt-2.5 border-t text-[11px] gap-2 ${
                    isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'
                  }`}>
                    <div className="flex items-center shrink-0">
                      {getStatusBadge(ticket.status)}
                    </div>

                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onViewTicket && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onViewTicket(ticket)
                          }}
                          className={`h-7 px-2.5 rounded-full border text-xs font-normal transition-all duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-1.5 ${actionBtn}`}
                          title="View ticket details"
                          aria-label="View ticket"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span className="hidden min-[480px]:inline">View</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditTicket(ticket)
                        }}
                        className={`h-7 px-2.5 rounded-full border text-xs font-normal transition-all duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-1.5 ${actionBtn}`}
                        title="Edit ticket"
                        aria-label="Edit ticket"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span className="hidden min-[480px]:inline">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteTicket(ticket)
                        }}
                        className={`h-7 px-2.5 rounded-full border text-xs font-normal transition-all duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-1.5 ${deleteBtn}`}
                        title="Delete ticket"
                        aria-label="Delete ticket"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span className="hidden min-[480px]:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Footer */}
            {(tickets.length > 0 || (serverPagination && effectiveTotalCount > 0)) && (
              <div
                className={`mt-4 pt-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none ${
                  isDark ? 'border-white/[0.06] text-[#ebebf5]/40' : 'border-black/[0.06] text-[#1d1d1f]/40'
                }`}
              >
                {/* Left: Summary and Page Size Selector */}
                <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                  <span>
                    Showing{' '}
                    <span className={`font-mono font-medium ${isDark ? 'text-[#f5f5f7]' : 'text-[#1d1d1f]'}`}>
                      {effectiveTotalCount === 0 ? 0 : startIndex + 1}
                    </span>{' '}
                    to{' '}
                    <span className={`font-mono font-medium ${isDark ? 'text-[#f5f5f7]' : 'text-[#1d1d1f]'}`}>
                      {endIndex}
                    </span>{' '}
                    of{' '}
                    <span className={`font-mono font-medium ${isDark ? 'text-[#f5f5f7]' : 'text-[#1d1d1f]'}`}>
                      {effectiveTotalCount}
                    </span>{' '}
                    tickets
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] ${isDark ? 'text-[#ebebf5]/30' : 'text-[#1d1d1f]/30'}`}>Rows per page:</span>
                    <select
                      value={activePageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className={`px-2 py-1 rounded-[10px] border text-xs font-mono transition cursor-pointer outline-none ${
                        isDark
                          ? 'bg-white/[0.06] border-white/[0.08] text-[#f5f5f7] focus:border-white/[0.2]'
                          : 'bg-white border-black/[0.08] text-[#1d1d1f] focus:border-black/[0.2]'
                      }`}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                {/* Right: Page Navigation Buttons */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    {/* First Page */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(1)}
                      disabled={safeCurrentPage === 1}
                      className={`p-1.5 rounded-full border transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        isDark
                          ? 'border-white/[0.08] hover:bg-white/[0.08] text-[#ebebf5]/50 hover:text-[#f5f5f7]'
                          : 'border-black/[0.08] hover:bg-black/[0.06] text-[#1d1d1f]/40 hover:text-[#1d1d1f]'
                      }`}
                      title="First page"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="11 17 6 12 11 7" />
                        <polyline points="18 17 13 12 18 7" />
                      </svg>
                    </button>

                    {/* Previous Page */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.max(1, safeCurrentPage - 1))}
                      disabled={safeCurrentPage === 1}
                      className={`p-1.5 rounded-full border transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        isDark
                          ? 'border-white/[0.08] hover:bg-white/[0.08] text-[#ebebf5]/50 hover:text-[#f5f5f7]'
                          : 'border-black/[0.08] hover:bg-black/[0.06] text-[#1d1d1f]/40 hover:text-[#1d1d1f]'
                      }`}
                      title="Previous page"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>

                    {/* Numeric Page Buttons */}
                    {pageNumbers.map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`dots-${idx}`} className={`px-2 py-1 text-xs font-mono ${isDark ? 'text-[#ebebf5]/30' : 'text-[#1d1d1f]/30'}`}>
                            ...
                          </span>
                        )
                      }
                      const isCurrent = p === safeCurrentPage
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePageChange(Number(p))}
                          className={`min-w-[28px] h-7 px-2 rounded-full border text-xs font-mono font-normal transition cursor-pointer ${
                            isCurrent
                              ? isDark
                                ? 'bg-white border-white text-zinc-950 shadow-sm font-semibold'
                                : 'bg-zinc-950 border-zinc-950 text-white shadow-sm font-semibold'
                              : isDark
                                ? 'border-white/[0.08] hover:bg-white/[0.08] text-[#ebebf5]/50 hover:text-[#f5f5f7]'
                                : 'border-black/[0.08] hover:bg-black/[0.06] text-[#1d1d1f]/40 hover:text-[#1d1d1f]'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    })}

                    {/* Next Page */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.min(totalPages, safeCurrentPage + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className={`p-1.5 rounded-full border transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        isDark
                          ? 'border-white/[0.08] hover:bg-white/[0.08] text-[#ebebf5]/50 hover:text-[#f5f5f7]'
                          : 'border-black/[0.08] hover:bg-black/[0.06] text-[#1d1d1f]/40 hover:text-[#1d1d1f]'
                      }`}
                      title="Next page"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>

                    {/* Last Page */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={safeCurrentPage === totalPages}
                      className={`p-1.5 rounded-full border transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        isDark
                          ? 'border-white/[0.08] hover:bg-white/[0.08] text-[#ebebf5]/50 hover:text-[#f5f5f7]'
                          : 'border-black/[0.08] hover:bg-black/[0.06] text-[#1d1d1f]/40 hover:text-[#1d1d1f]'
                      }`}
                      title="Last page"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="13 17 18 12 13 7" />
                        <polyline points="6 17 11 12 6 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
