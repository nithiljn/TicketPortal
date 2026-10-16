import React, { useState, useRef, useEffect, useMemo } from 'react'
import { TicketStatus, TicketPriority, AuthUser } from '@/types'
import { Button } from '@/components/Button'
import packageInfo from '../../package.json'

const SIDEBAR_PAYMENT_METHODS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'All Methods' },
  { id: 'UPI', label: 'UPI / GPay' },
  { id: 'CREDIT_CARD', label: 'Credit Card' },
  { id: 'DEBIT_CARD', label: 'Debit Card' },
  { id: 'CASH', label: 'Cash' },
  { id: 'NET_BANKING', label: 'Net Banking' },
  { id: 'OTHER', label: 'Other' },
]

function renderPaymentMethodIcon(id: string) {
  switch (id) {
    case 'UPI':
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      )
    case 'CREDIT_CARD':
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      )
    case 'DEBIT_CARD':
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <circle cx="7" cy="15" r="1.5" />
          <circle cx="12" cy="15" r="1.5" />
        </svg>
      )
    case 'CASH':
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      )
    case 'NET_BANKING':
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18M3 10h18M5 6l7-4 7 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
        </svg>
      )
    case 'OTHER':
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      )
    case 'ALL':
    default:
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      )
  }
}

const EXPENSE_CATEGORY_DOTS: Record<string, string> = {
  'Food & Dining': 'bg-emerald-500',
  'Travel & Transport': 'bg-teal-500',
  'Software & Subscriptions': 'bg-sky-500',
  'Office Supplies': 'bg-zinc-400',
  'Cloud & Hosting': 'bg-indigo-500',
  'Marketing & Ads': 'bg-amber-500',
  'Bills & Utilities': 'bg-slate-400',
  'Personal': 'bg-emerald-600',
  'Miscellaneous': 'bg-zinc-500',
}

interface SidebarProps {
  // Mobile drawer state
  isOpen: boolean
  onClose: () => void

  // User Auth & Role
  user?: AuthUser | null
  onLogout?: () => void

  // Projects
  availableProjects: string[]
  selectedProject: string
  onSelectProject: (proj: string) => void

  // Status & Priority Filters
  selectedStatus?: TicketStatus | 'ALL'
  selectedStatuses?: TicketStatus[]
  onSelectStatus: (status: TicketStatus | 'ALL') => void

  selectedPriority?: TicketPriority | 'ALL'
  selectedPriorities?: TicketPriority[]
  onSelectPriority: (p: TicketPriority | 'ALL') => void

  // Category Filter
  selectedCategory?: string | 'ALL'
  selectedCategories?: string[]
  onSelectCategory: (cat: string | 'ALL') => void
  categoryCounts?: Record<string, number>

  // Date Range Filter (From - To)
  fromDate: string
  toDate: string
  onSelectFromDate: (d: string) => void
  onSelectToDate: (d: string) => void
  onClearDateRange: () => void

  // Ticket ID Filter
  ticketIdFilter?: string
  onSelectTicketIdFilter?: (id: string) => void
  onClearTicketIdFilter?: () => void

  // Theme Settings
  theme: 'dark' | 'light'
  onToggleTheme: () => void

  // Stats
  ticketCounts: {
    total: number
    todo: number
    inProgress: number
    done: number
    blocked: number
    notesCount: number
  }

  // Trigger modal
  onOpenCreateModal: () => void
  onOpenCreateWorkspaceModal?: () => void
  onDeleteWorkspace?: (proj: string) => void
  onOpenActivityModal?: () => void
  onOpenVersionModal?: () => void

  // Active Tab
  activeTab?: 'inbox' | 'dashboard' | 'board' | 'notes' | 'expenses'

  // Expense Specific Filters (used when activeTab === 'expenses')
  expenseCategories?: string[]
  selectedExpenseCategory?: string | 'ALL'
  onSelectExpenseCategory?: (cat: string | 'ALL') => void
  selectedPaymentMethod?: string | 'ALL'
  onSelectPaymentMethod?: (pm: string | 'ALL') => void
  onlyHighExpense?: boolean
  onToggleHighExpense?: () => void
  expenseMinAmount?: string
  expenseMaxAmount?: string
  onMinAmountChange?: (val: string) => void
  onMaxAmountChange?: (val: string) => void
  expenseSearchQuery?: string
  onExpenseSearchChange?: (val: string) => void
  selectedExpenseMonth?: string
  onSelectExpenseMonth?: (m: string) => void
  availableExpenseMonths?: string[]
  expenseCounts?: {
    total: number
    totalAmount: number
    byCategory: Record<string, number>
    byMethod: Record<string, number>
  }
  onOpenCategoryModal?: () => void
  onOpenAddExpenseModal?: () => void
}

export function Sidebar({
  isOpen,
  onClose,
  user,
  onLogout,
  availableProjects,
  selectedProject,
  onSelectProject,
  selectedStatus,
  selectedStatuses,
  onSelectStatus,
  selectedPriority,
  selectedPriorities,
  onSelectPriority,
  selectedCategory,
  selectedCategories,
  onSelectCategory,
  categoryCounts,
  fromDate,
  toDate,
  onSelectFromDate,
  onSelectToDate,
  onClearDateRange,
  ticketIdFilter = '',
  onSelectTicketIdFilter,
  onClearTicketIdFilter,
  theme,
  onToggleTheme,
  ticketCounts,
  onOpenCreateModal,
  onOpenCreateWorkspaceModal,
  onDeleteWorkspace,
  activeTab = 'inbox',
  expenseCategories,
  selectedExpenseCategory = 'ALL',
  onSelectExpenseCategory,
  selectedPaymentMethod = 'ALL',
  onSelectPaymentMethod,
  onlyHighExpense = false,
  onToggleHighExpense,
  expenseMinAmount = '',
  expenseMaxAmount = '',
  onMinAmountChange,
  onMaxAmountChange,
  expenseSearchQuery = '',
  onExpenseSearchChange,
  selectedExpenseMonth = 'ALL',
  onSelectExpenseMonth,
  availableExpenseMonths = [],
  expenseCounts,
  onOpenCategoryModal,
  onOpenAddExpenseModal,
  onOpenActivityModal,
  onOpenVersionModal,
}: SidebarProps) {
  const isDark = theme === 'dark'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false)
      }
    }
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSettingsOpen])

  const sidebarBg = isDark
    ? 'bg-[#0d0d10] border-white/[0.06] text-zinc-400'
    : 'bg-white border-zinc-200 text-zinc-600'
  const headerBorder = isDark ? 'border-white/[0.06]' : 'border-zinc-200'
  const textPrimary = isDark ? 'text-zinc-100' : 'text-zinc-900'
  const itemHover = isDark ? 'hover:bg-white/[0.04] hover:text-zinc-200' : 'hover:bg-zinc-100 hover:text-zinc-900'
  const itemActive = isDark
    ? 'bg-white/[0.08] text-white font-medium border border-white/[0.12]'
    : 'bg-zinc-100 text-zinc-950 font-semibold border border-zinc-300/80 shadow-2xs'
  const inputBg = isDark
    ? 'bg-black/40 border-white/[0.08] text-zinc-200'
    : 'bg-zinc-50 border-zinc-200 text-zinc-900'

  const activeStatuses = selectedStatuses ?? (selectedStatus && selectedStatus !== 'ALL' ? [selectedStatus] : [])
  const activePriorities = selectedPriorities ?? (selectedPriority && selectedPriority !== 'ALL' ? [selectedPriority] : [])
  const activeCategories = selectedCategories ?? (selectedCategory && selectedCategory !== 'ALL' ? [selectedCategory] : [])

  const DEFAULT_CATEGORIES: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'BUG', label: 'Bug' },
    { id: 'FEATURE', label: 'Feature' },
    { id: 'DEV', label: 'Dev' },
    { id: 'DATABASE', label: 'Database' },
    { id: 'DESIGN', label: 'Design' },
  ]

  const displayedCategories = useMemo(() => {
    const list = [...DEFAULT_CATEGORIES]
    const existingIds = new Set(list.map((c) => c.id))

    if (categoryCounts) {
      Object.keys(categoryCounts).forEach((catId) => {
        const isSelected = activeCategories.some((c) => c.toUpperCase() === catId.toUpperCase())
        if (!existingIds.has(catId) && catId !== 'ALL' && (categoryCounts[catId] > 0 || isSelected)) {
          list.push({
            id: catId,
            label: catId.charAt(0) + catId.slice(1).toLowerCase(),
          })
          existingIds.add(catId)
        }
      })
    }
    return list
  }, [categoryCounts, activeCategories])

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 border-r flex flex-col justify-between shrink-0 select-none transition-transform duration-200 ease-in-out ${sidebarBg} ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className={`h-14 px-4 flex items-center justify-between border-b ${headerBorder}`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                isDark
                  ? 'bg-zinc-800 border border-zinc-700/80 text-white shadow-xs'
                  : 'bg-zinc-900 border border-zinc-800 text-white shadow-xs'
              }`}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                  <line x1="13" y1="5" x2="13" y2="7" />
                  <line x1="13" y1="11" x2="13" y2="13" />
                  <line x1="13" y1="17" x2="13" y2="19" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-xs tracking-wider ${textPrimary}`}>
                    TicketFlow
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-medium border leading-none select-none ${
                      isDark
                        ? 'bg-zinc-800/90 text-zinc-300 border-zinc-700/80 shadow-2xs'
                        : 'bg-zinc-100 text-zinc-700 border-zinc-300/80 shadow-2xs'
                    }`}
                  >
                    v{packageInfo.version}
                  </span>
                </div>
                <span className={`block text-[11px] font-medium leading-none mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Maintain Daily Work
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className={`lg:hidden p-1.5 rounded-lg transition ${itemHover}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* New item button */}
          <div className="p-3">
            <Button
              variant="ticket"
              size="md"
              theme={theme}
              onClick={() => {
                if (activeTab === 'expenses' && onOpenAddExpenseModal) {
                  onOpenAddExpenseModal()
                } else {
                  onOpenCreateModal()
                }
                onClose()
              }}
              className="w-full justify-center shadow-xs"
              leftIcon={
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
            >
              {activeTab === 'expenses' ? 'Add Expense' : 'New Ticket'}
            </Button>

          {/* Version Management button */}
          {onOpenVersionModal && (
            <button
              type="button"
              onClick={() => {
                onOpenVersionModal()
                onClose()
              }}
              className={`w-full mt-2 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                isDark
                  ? 'border-white/[0.08] text-zinc-300 hover:bg-white/[0.04]'
                  : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-2xs'
              }`}
              title="Manage release versions"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <span>Manage Versions</span>
            </button>
          )}

          {/* Activity Heatmap button below New Ticket */}
          {onOpenActivityModal && (
            <button
              type="button"
              onClick={() => {
                onOpenActivityModal()
                onClose()
              }}
              className={`w-full ${onOpenVersionModal ? 'mt-1.5' : 'mt-2'} py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                isDark
                  ? 'border-white/[0.08] text-zinc-300 hover:bg-white/[0.04]'
                  : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-2xs'
              }`}
              title="View consistency activity heatmap"
            >
                <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
                <span>Activity Heatmap</span>
              </button>
            )}
          </div>

          {/* Scrollable Navigation & Facets */}
          <div className="flex-1 overflow-y-auto px-3 py-1 space-y-5 text-xs custom-scrollbar">
            {/* Workspaces Facet */}
            <div>
              <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <span>Workspaces</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono">{availableProjects.length}</span>
                  {onOpenCreateWorkspaceModal && (
                    <button
                      onClick={onOpenCreateWorkspaceModal}
                      type="button"
                      className="p-0.5 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
                      title="Create new project workspace"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    onSelectProject('ALL')
                    onClose()
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-left ${
                    selectedProject === 'ALL' ? itemActive : itemHover
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span className="truncate">All Workspaces</span>
                  </div>
                  {selectedProject === 'ALL' && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                </button>

                {availableProjects.map((proj) => {
                  const isSelected = selectedProject === proj
                  const canDelete = availableProjects.length > 1

                  return (
                    <div
                      key={proj}
                      className={`group/ws w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-left ${
                        isSelected ? itemActive : itemHover
                      }`}
                      onClick={() => {
                        onSelectProject(proj)
                        onClose()
                      }}
                    >
                      <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-1">
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="truncate">{proj}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isSelected && (
                          <span className={`w-1.5 h-1.5 rounded-full bg-current ${canDelete ? 'group-hover/ws:hidden' : ''}`} />
                        )}

                        {canDelete && onDeleteWorkspace && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteWorkspace(proj)
                            }}
                            className={`p-1 rounded transition cursor-pointer sm:opacity-0 group-hover/ws:opacity-100 focus:opacity-100 ${
                              isDark
                                ? 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.08]'
                                : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/60'
                            }`}
                            title={`Delete workspace "${proj}"`}
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {onOpenCreateWorkspaceModal && (
                  <button
                    onClick={onOpenCreateWorkspaceModal}
                    type="button"
                    className={`w-full mt-1.5 px-2.5 py-1.5 rounded-lg border border-dashed flex items-center gap-2 transition cursor-pointer text-left text-xs ${
                      isDark
                        ? 'border-white/[0.1] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.2] hover:bg-white/[0.02]'
                        : 'border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400 hover:bg-zinc-100'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>New Workspace</span>
                  </button>
                )}
              </div>
            </div>

            {activeTab === 'expenses' ? (
              /* Expense Specific Filters */
              <>
                {/* 1. Month / Period Filter */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <span>Month / Period</span>
                    {selectedExpenseMonth !== 'ALL' && (
                      <button
                        onClick={() => onSelectExpenseMonth?.('ALL')}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer"
                      >
                        All Time
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <select
                      value={selectedExpenseMonth || 'ALL'}
                      onChange={(e) => {
                        onSelectExpenseMonth?.(e.target.value)
                        onClose()
                      }}
                      className={`w-full rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none font-medium cursor-pointer ${inputBg}`}
                    >
                      <option value="ALL">All Time</option>
                      {availableExpenseMonths?.map((m) => {
                        const [year, month] = m.split('-')
                        const dateObj = new Date(Number(year), Number(month) - 1, 1)
                        const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        return (
                          <option key={m} value={m}>
                            {label}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                </div>

                {/* 3. Expense Categories Filter */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <span>Expense Categories</span>
                    <div className="flex items-center gap-1.5">
                      {selectedExpenseCategory !== 'ALL' && (
                        <button
                          onClick={() => onSelectExpenseCategory?.('ALL')}
                          className="text-[10px] text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                      {onOpenCategoryModal && (
                        <button
                          onClick={onOpenCategoryModal}
                          className="p-0.5 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
                          title="Manage Categories"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-0.5 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
                    <button
                      onClick={() => {
                        onSelectExpenseCategory?.('ALL')
                        onClose()
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer text-left active:scale-[0.99] ${
                        selectedExpenseCategory === 'ALL' ? itemActive : itemHover
                      }`}
                    >
                      <span className={selectedExpenseCategory === 'ALL' ? 'font-medium' : 'text-zinc-600 dark:text-zinc-400'}>
                        All Categories
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition ${
                        selectedExpenseCategory === 'ALL'
                          ? isDark ? 'bg-white/10 text-white font-medium' : 'bg-zinc-200 text-zinc-900 font-medium'
                          : isDark ? 'bg-white/[0.04] text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {expenseCounts?.total ?? 0}
                      </span>
                    </button>
                    {expenseCategories?.map((cat) => {
                      const isSelected = selectedExpenseCategory?.toLowerCase() === cat.toLowerCase()
                      const count = expenseCounts?.byCategory[cat] ?? 0
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            onSelectExpenseCategory?.(isSelected ? 'ALL' : cat)
                            onClose()
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer text-left active:scale-[0.99] ${
                            isSelected ? itemActive : itemHover
                          }`}
                        >
                          <span className={`truncate pr-1 ${isSelected ? 'font-medium' : 'text-zinc-600 dark:text-zinc-400'}`}>
                            {cat}
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 transition ${
                            isSelected
                              ? isDark ? 'bg-white/10 text-white font-medium' : 'bg-zinc-200 text-zinc-900 font-medium'
                              : isDark ? 'bg-white/[0.04] text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 4. Payment Methods Filter */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <span>Payment Methods</span>
                    {selectedPaymentMethod !== 'ALL' && (
                      <button
                        onClick={() => onSelectPaymentMethod?.('ALL')}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {SIDEBAR_PAYMENT_METHODS.map((pm) => {
                      const isSelected = selectedPaymentMethod?.toUpperCase() === pm.id
                      const count = pm.id === 'ALL' ? expenseCounts?.total : expenseCounts?.byMethod[pm.id] ?? 0
                      return (
                        <button
                          key={pm.id}
                          onClick={() => {
                            onSelectPaymentMethod?.(pm.id)
                            onClose()
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-left ${
                            isSelected ? itemActive : itemHover
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400 shrink-0">{renderPaymentMethodIcon(pm.id)}</span>
                            <span>{pm.label}</span>
                          </div>
                          {typeof count === 'number' && (
                            <span className="text-[10px] font-mono opacity-60">{count}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 5. Amount Range Filter */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <span>Amount Range (₹)</span>
                    {(expenseMinAmount || expenseMaxAmount) && (
                      <button
                        onClick={() => {
                          onMinAmountChange?.('')
                          onMaxAmountChange?.('')
                        }}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Min"
                        value={expenseMinAmount}
                        onChange={(e) => onMinAmountChange?.(e.target.value)}
                        className={`w-full pl-5 pr-2 py-1.5 rounded-lg text-xs font-mono focus:outline-none border ${inputBg}`}
                      />
                    </div>
                    <span className="text-zinc-500 text-xs font-mono">to</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Max"
                        value={expenseMaxAmount}
                        onChange={(e) => onMaxAmountChange?.(e.target.value)}
                        className={`w-full pl-5 pr-2 py-1.5 rounded-lg text-xs font-mono focus:outline-none border ${inputBg}`}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Ticket Specific Filters (Inbox, Dashboard, Board, Notes) */
              <>
                {/* Ticket ID Filter */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <span>Ticket ID Filter</span>
                    {ticketIdFilter && onClearTicketIdFilter && (
                      <button
                        onClick={onClearTicketIdFilter}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400 font-semibold select-none pointer-events-none">#</span>
                    <input
                      type="text"
                      placeholder="Filter by ID (e.g. 1035)"
                      value={ticketIdFilter}
                      onChange={(e) => onSelectTicketIdFilter?.(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          onClearTicketIdFilter?.()
                        }
                      }}
                      className={`w-full pl-6 pr-6 py-1.5 rounded-lg text-xs font-mono focus:outline-none border ${inputBg}`}
                    />
                    {ticketIdFilter && onClearTicketIdFilter && (
                      <button
                        type="button"
                        onClick={onClearTicketIdFilter}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer p-0.5"
                        title="Clear ID filter"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <span>Status Filter</span>
                    {activeStatuses.length > 0 && (
                      <button
                        onClick={() => onSelectStatus('ALL')}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {[
                      { id: 'ALL', label: 'All Statuses', count: ticketCounts.total },
                      { id: 'TODO', label: 'To Do', count: ticketCounts.todo },
                      { id: 'IN_PROGRESS', label: 'In Progress', count: ticketCounts.inProgress },
                      { id: 'DONE', label: 'Completed', count: ticketCounts.done },
                      { id: 'BLOCKED', label: 'Blocked', count: ticketCounts.blocked },
                    ].map((item) => {
                      const isSelected = item.id === 'ALL'
                        ? activeStatuses.length === 0
                        : activeStatuses.includes(item.id as TicketStatus)
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectStatus(item.id as TicketStatus | 'ALL')
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer active:scale-[0.99] ${
                            isSelected ? itemActive : itemHover
                          }`}
                        >
                          <span className={isSelected ? 'font-medium' : 'text-zinc-600 dark:text-zinc-400'}>
                            {item.label}
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition ${
                            isSelected
                              ? isDark ? 'bg-white/10 text-white font-medium' : 'bg-zinc-200 text-zinc-900 font-medium'
                              : isDark ? 'bg-white/[0.04] text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                          }`}>
                            {item.count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Priority Filter */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <span>Priority Filter</span>
                    {activePriorities.length > 0 && (
                      <button
                        onClick={() => onSelectPriority('ALL')}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'ALL', label: 'All Priorities', fullWidth: true },
                      { id: 'URGENT', label: 'Urgent' },
                      { id: 'HIGH', label: 'High' },
                      { id: 'MEDIUM', label: 'Medium' },
                      { id: 'LOW', label: 'Low' },
                    ].map((item) => {
                      const isSelected = item.id === 'ALL'
                        ? activePriorities.length === 0
                        : activePriorities.includes(item.id as TicketPriority)
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectPriority(item.id as TicketPriority | 'ALL')
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center border active:scale-[0.98] ${
                            item.fullWidth ? 'col-span-2' : ''
                          } ${
                            isSelected
                              ? itemActive
                              : isDark
                              ? 'bg-zinc-900/60 border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] hover:border-white/[0.1]'
                              : 'bg-zinc-50 border-zinc-200/80 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 hover:border-zinc-300'
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <span>Category Filter</span>
                    {activeCategories.length > 0 && (
                      <button
                        onClick={() => onSelectCategory('ALL')}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {displayedCategories.map((item) => {
                      const count = categoryCounts ? categoryCounts[item.id] : undefined
                      const isAll = item.id === 'ALL'
                      const isSelected = isAll
                        ? activeCategories.length === 0
                        : activeCategories.some((c) => c.toUpperCase() === item.id.toUpperCase())
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectCategory(item.id)
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-between gap-1 border active:scale-[0.98] ${
                            isAll ? 'col-span-2' : ''
                          } ${
                            isSelected
                              ? itemActive
                              : isDark
                              ? 'bg-zinc-900/60 border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] hover:border-white/[0.1]'
                              : 'bg-zinc-50 border-zinc-200/80 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 hover:border-zinc-300'
                          }`}
                        >
                          <span className="truncate">{isAll ? 'All Categories' : item.label}</span>
                          {typeof count === 'number' && (
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded shrink-0 transition ${
                              isSelected
                                ? isDark ? 'bg-white/10 text-white font-medium' : 'bg-zinc-200 text-zinc-900 font-medium'
                                : isDark ? 'bg-white/[0.04] text-zinc-400' : 'bg-zinc-200/60 text-zinc-600'
                            }`}>
                              {count}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Date Range Filtration (From - To) */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <span>Date Range Filter</span>
                    {(fromDate || toDate) && (
                      <button
                        onClick={onClearDateRange}
                        className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="block text-[10px] text-zinc-500 mb-0.5">From Date</span>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => onSelectFromDate(e.target.value)}
                        className={`w-full rounded-lg px-2.5 py-1 text-[11px] focus:outline-none font-mono ${inputBg}`}
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-zinc-500 mb-0.5">To Date</span>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => onSelectToDate(e.target.value)}
                        className={`w-full rounded-lg px-2.5 py-1 text-[11px] focus:outline-none font-mono ${inputBg}`}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile & Settings Footer */}
          <div className={`p-3 border-t ${headerBorder} relative`} ref={settingsRef}>
            {/* Settings Popover Dropdown Menu */}
            {isSettingsOpen && (
              <div
                className={`absolute bottom-full left-3 right-3 mb-2 p-1.5 rounded-xl border shadow-xl z-50 transition-all ${
                  isDark
                    ? 'bg-[#151518] border-white/[0.12] text-zinc-200 shadow-black/80'
                    : 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-500/20'
                }`}
              >
                <div className="px-2 pt-1 pb-1.5 text-[10px] font-mono font-medium uppercase tracking-wider text-zinc-500">
                  Settings
                </div>

                {/* Appearance Theme Switcher */}
                <div className="flex items-center justify-between px-2 py-1.5 rounded-lg">
                  <span className="text-xs font-medium">Appearance</span>
                  <div className={`inline-flex p-0.5 rounded-lg border ${
                    isDark ? 'bg-zinc-900 border-white/[0.08]' : 'bg-zinc-100 border-zinc-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => isDark && onToggleTheme()}
                      className={`px-2 py-1 text-[11px] font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                        !isDark
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="23" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                      </svg>
                      <span>Light</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => !isDark && onToggleTheme()}
                      className={`px-2 py-1 text-[11px] font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                        isDark
                          ? 'bg-zinc-800 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

                {/* App Version */}
                <div className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs">
                  <span className={`font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Version</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-medium border leading-none select-none ${
                      isDark
                        ? 'bg-zinc-800/90 text-zinc-300 border-zinc-700/80 shadow-2xs'
                        : 'bg-zinc-100 text-zinc-700 border-zinc-300/80 shadow-2xs'
                    }`}
                  >
                    v{packageInfo.version}
                  </span>
                </div>

                <div className={`my-1 border-t ${isDark ? 'border-white/[0.08]' : 'border-zinc-100'}`} />

                {/* Log Out Option */}
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false)
                      onLogout()
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                      isDark
                        ? 'text-zinc-300 hover:text-red-400 hover:bg-white/[0.06]'
                        : 'text-zinc-700 hover:text-red-600 hover:bg-zinc-100'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Log Out</span>
                  </button>
                )}
              </div>
            )}

            {/* Profile Card with Settings Gear Trigger */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
              isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/[0.08]"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-lg font-semibold text-xs flex items-center justify-center shrink-0 uppercase ${
                      isDark ? 'bg-white/[0.08] text-zinc-200' : 'bg-zinc-200 text-zinc-800'
                    }`}>
                      {user?.name ? user.name.slice(0, 2) : 'US'}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ${
                      isDark ? 'ring-zinc-900' : 'ring-zinc-50'
                    }`}
                  />
                </div>
                <div className="truncate min-w-0 flex-1">
                  <span className={`block text-xs font-semibold truncate ${textPrimary}`}>
                    {user?.name || 'User'}
                  </span>
                  <span className="block text-[11px] text-zinc-500 truncate">
                    {user?.email || (user?.username ? `@${user.username}` : 'authenticated')}
                  </span>
                </div>
              </div>

              {/* Settings Gear Button */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen((prev) => !prev)}
                className={`p-1.5 rounded-lg border transition cursor-pointer shrink-0 ${
                  isSettingsOpen
                    ? isDark
                      ? 'bg-white/[0.1] border-white/[0.2] text-white'
                      : 'bg-zinc-200 border-zinc-300 text-zinc-900'
                    : isDark
                      ? 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] hover:border-white/[0.08]'
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 hover:border-zinc-300'
                }`}
                title="Settings & Appearance"
                aria-label="Settings"
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isSettingsOpen ? 'rotate-90' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
