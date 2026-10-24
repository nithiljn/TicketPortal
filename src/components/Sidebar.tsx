import React, { useState, useRef, useEffect, useMemo } from 'react'
import { TicketStatus, TicketPriority, AuthUser, DailyNote } from '@/types'
import { Button } from '@/components/Button'
import packageInfo from '../../package.json'

function formatSidebarNoteDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    return dt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatMonthYear(monthStr: string): string {
  try {
    const [y, m] = monthStr.split('-').map(Number)
    const dt = new Date(y, m - 1, 1)
    return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch {
    return monthStr
  }
}

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
  selectedExpenseCategories?: string[]
  onSelectExpenseCategory?: (cat: string | 'ALL') => void
  selectedPaymentMethod?: string | 'ALL'
  selectedPaymentMethods?: string[]
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
  availableVersions?: string[]
  selectedVersion?: string | 'ALL'
  selectedVersions?: string[]
  onSelectVersion?: (version: string | 'ALL') => void
  versionCounts?: Record<string, number>

  // Notes Specific Filters (used when activeTab === 'notes')
  dailyNotes?: DailyNote[]
  selectedNoteDate?: string
  onSelectNoteDate?: (date: string) => void
  notesMonthFilter?: string
  onSelectNotesMonth?: (month: string) => void
  notesStatusFilter?: 'ALL' | 'PENDING' | 'COMPLETED' | 'MEMO'
  onSelectNotesStatus?: (status: 'ALL' | 'PENDING' | 'COMPLETED' | 'MEMO') => void
  notesSearchQuery?: string
  onNotesSearchChange?: (val: string) => void
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
  selectedExpenseCategories,
  onSelectExpenseCategory,
  selectedPaymentMethod = 'ALL',
  selectedPaymentMethods,
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
  availableVersions = [],
  selectedVersion = 'ALL',
  selectedVersions = [],
  onSelectVersion,
  versionCounts,
  dailyNotes = [],
  selectedNoteDate,
  onSelectNoteDate,
  notesMonthFilter = 'ALL',
  onSelectNotesMonth,
  notesStatusFilter = 'ALL',
  onSelectNotesStatus,
  notesSearchQuery = '',
  onNotesSearchChange,
}: SidebarProps) {
  const isDark = theme === 'dark'
  const visibleWorkspaces = availableProjects.filter(
    (p) => !p.startsWith('version:::') && !p.includes(':::version:::')
  )
  const isTicketTab = activeTab === 'inbox' || activeTab === 'dashboard' || activeTab === 'board'
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

  // Apple Design System Tokens
  const sidebarBg = isDark
    ? 'bg-[#121214] border-white/[0.08] text-[#86868b]'
    : 'bg-[#f5f5f7] border-[#e5e5ea] text-[#86868b]'
  const headerBorder = isDark ? 'border-white/[0.08]' : 'border-[#e5e5ea]'
  const textPrimary = isDark ? 'text-[#f5f5f7]' : 'text-[#1d1d1f]'
  const itemHover = isDark
    ? 'hover:bg-white/[0.05] hover:text-[#f5f5f7] text-[#a1a1a6]'
    : 'hover:bg-black/[0.04] hover:text-[#1d1d1f] text-[#515154]'
  const itemActive = isDark
    ? 'bg-white/[0.12] text-white font-semibold shadow-2xs'
    : 'bg-black/[0.07] text-[#1d1d1f] font-semibold shadow-2xs'
  const inputBg = isDark
    ? 'bg-white/[0.04] border-white/[0.08] text-[#f5f5f7] placeholder-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/20'
    : 'bg-white border-[#e5e5ea] text-[#1d1d1f] placeholder-[#86868b] focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 shadow-2xs'
  const ghostBtn = isDark
    ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-[#f5f5f7] active:scale-95'
    : 'bg-white hover:bg-[#fafafc] border-[#e5e5ea] text-[#1d1d1f] shadow-2xs active:scale-95'

  const countBadge = (isSelected: boolean) =>
    `text-[10px] font-mono px-2 py-0.5 rounded-full font-medium transition ${
      isSelected
        ? isDark
          ? 'bg-white/20 text-white'
          : 'bg-black/10 text-zinc-900'
        : isDark
        ? 'bg-white/[0.06] text-[#86868b]'
        : 'bg-black/[0.04] text-[#86868b]'
    }`

  const activeStatuses = selectedStatuses ?? (selectedStatus && selectedStatus !== 'ALL' ? [selectedStatus] : [])
  const activePriorities = selectedPriorities ?? (selectedPriority && selectedPriority !== 'ALL' ? [selectedPriority] : [])
  const activeCategories = selectedCategories ?? (selectedCategory && selectedCategory !== 'ALL' ? [selectedCategory] : [])
  const activeExpenseCategories = selectedExpenseCategories ?? (selectedExpenseCategory && selectedExpenseCategory !== 'ALL' ? [selectedExpenseCategory] : [])
  const activePaymentMethods = selectedPaymentMethods ?? (selectedPaymentMethod && selectedPaymentMethod !== 'ALL' ? [selectedPaymentMethod] : [])

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const yesterdayStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().split('T')[0]
  }, [])

  // Parsed note entries for Notes tab
  const noteEntries = useMemo(() => {
    if (!dailyNotes || dailyNotes.length === 0) return []
    return dailyNotes.map((note) => {
      const lines = note.content.split('\n')
      let totalTasks = 0
      let completedTasks = 0
      for (const line of lines) {
        const match = line.match(/^\s*-\s*\[([ xX])\]/)
        if (match) {
          totalTasks++
          if (match[1].toLowerCase() === 'x') completedTasks++
        }
      }
      const pendingTasks = totalTasks - completedTasks
      const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      const isCompleted = totalTasks > 0 && completedTasks === totalTasks
      const hasPending = pendingTasks > 0
      const isMemo = totalTasks === 0
      const month = note.date.slice(0, 7) // 'YYYY-MM'

      return {
        id: note.id,
        date: note.date,
        content: note.content,
        totalTasks,
        completedTasks,
        pendingTasks,
        percentage,
        isCompleted,
        hasPending,
        isMemo,
        month,
      }
    }).sort((a, b) => b.date.localeCompare(a.date))
  }, [dailyNotes])

  // Aggregate stats for Notes tab
  const notesStats = useMemo(() => {
    let totalTasks = 0
    let completedTasks = 0
    let pendingDays = 0
    let completedDays = 0
    let memoDays = 0

    noteEntries.forEach((entry) => {
      totalTasks += entry.totalTasks
      completedTasks += entry.completedTasks
      if (entry.hasPending) pendingDays++
      if (entry.isCompleted) completedDays++
      if (entry.isMemo) memoDays++
    })

    const totalDays = noteEntries.length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const hasToday = noteEntries.some((e) => e.date === todayStr)

    return {
      totalDays,
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      pendingDays,
      completedDays,
      memoDays,
      completionRate,
      hasToday,
    }
  }, [noteEntries, todayStr])

  // Available months from notes
  const availableNoteMonths = useMemo(() => {
    const counts: Record<string, number> = {}
    noteEntries.forEach((e) => {
      if (e.month) {
        counts[e.month] = (counts[e.month] || 0) + 1
      }
    })
    return Object.entries(counts)
      .map(([month, count]) => ({ month, count, label: formatMonthYear(month) }))
      .sort((a, b) => b.month.localeCompare(a.month))
  }, [noteEntries])

  // Filtered note entries based on active filters
  const filteredNoteEntries = useMemo(() => {
    let result = noteEntries

    // 1. Month Filter
    if (notesMonthFilter && notesMonthFilter !== 'ALL') {
      result = result.filter((e) => e.month === notesMonthFilter)
    }

    // 2. Status Filter
    if (notesStatusFilter && notesStatusFilter !== 'ALL') {
      if (notesStatusFilter === 'PENDING') {
        result = result.filter((e) => e.hasPending)
      } else if (notesStatusFilter === 'COMPLETED') {
        result = result.filter((e) => e.isCompleted)
      } else if (notesStatusFilter === 'MEMO') {
        result = result.filter((e) => e.isMemo)
      }
    }

    // 3. Search query
    if (notesSearchQuery && notesSearchQuery.trim()) {
      const q = notesSearchQuery.toLowerCase().trim()
      result = result.filter(
        (e) => e.date.toLowerCase().includes(q) || e.content.toLowerCase().includes(q)
      )
    }

    return result
  }, [noteEntries, notesMonthFilter, notesStatusFilter, notesSearchQuery])

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
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md lg:hidden transition-opacity"
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
              <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-all shrink-0 border ${
                isDark
                  ? 'bg-white/[0.08] border-white/[0.1] text-white shadow-2xs'
                  : 'bg-white border-[#e5e5ea] text-zinc-950 shadow-2xs'
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
                  <span className={`font-semibold text-xs tracking-tight ${textPrimary}`}>
                    TicketFlow
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-medium border leading-none select-none ${
                      isDark
                        ? 'bg-white/[0.06] text-[#a1a1a6] border-white/[0.08]'
                        : 'bg-black/[0.04] text-[#86868b] border-black/[0.06]'
                    }`}
                  >
                    v{packageInfo.version}
                  </span>
                </div>
                <span className="block text-[11px] font-normal leading-none mt-1 text-[#86868b]">
                  Maintain Daily Work
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className={`lg:hidden w-7 h-7 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${itemHover}`}
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* New item / Top action buttons */}
          <div className="p-3">
            {activeTab !== 'notes' && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'expenses' && onOpenAddExpenseModal) {
                    onOpenAddExpenseModal()
                  } else {
                    onOpenCreateModal()
                  }
                  onClose()
                }}
                className={`w-full h-10 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-sm ${
                  isDark
                    ? 'bg-white hover:bg-zinc-100 text-zinc-950'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>{activeTab === 'expenses' ? 'Add Expense' : 'New Ticket'}</span>
              </button>
            )}

            {/* Version Management button — Only on ticket tabs (inbox, dashboard, board) */}
            {onOpenVersionModal && isTicketTab && (
              <button
                type="button"
                onClick={() => {
                  onOpenVersionModal()
                  onClose()
                }}
                className={`w-full mt-2 h-9 px-3 rounded-full border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${ghostBtn}`}
                title="Manage release versions"
              >
                <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span>Manage Versions</span>
              </button>
            )}

            {/* Activity Heatmap button — Only on notes tab (styled as primary action) */}
            {onOpenActivityModal && activeTab === 'notes' && (
              <button
                type="button"
                onClick={() => {
                  onOpenActivityModal()
                  onClose()
                }}
                className={`w-full h-10 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-sm ${
                  isDark
                    ? 'bg-white hover:bg-zinc-100 text-zinc-950'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-white'
                }`}
                title="View consistency activity heatmap"
              >
                <svg className="w-4 h-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                </svg>
                <span>Activity Heatmap</span>
              </button>
            )}
          </div>

          {/* Scrollable Navigation & Facets */}
          <div className="flex-1 overflow-y-auto px-3 py-1 space-y-5 text-xs custom-scrollbar">
            {/* Workspaces Facet — Only for Tickets and Expenses */}
            {activeTab !== 'notes' && (
              <div>
                <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                  <span>{activeTab === 'expenses' ? 'Expense Folders' : 'Workspaces'}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-[#86868b]">{visibleWorkspaces.length}</span>
                    {onOpenCreateWorkspaceModal && (
                      <button
                        onClick={onOpenCreateWorkspaceModal}
                        type="button"
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${itemHover}`}
                        title={activeTab === 'expenses' ? 'Create new expense workspace' : 'Create new project workspace'}
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
                  className={`w-full px-2.5 py-1.5 rounded-[10px] flex items-center justify-between transition cursor-pointer text-left active:scale-[0.99] ${
                    selectedProject === 'ALL' ? itemActive : itemHover
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <svg className="w-3.5 h-3.5 shrink-0 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span className="truncate">
                      {activeTab === 'expenses' ? 'All Expense Folders' : 'All Workspaces'}
                    </span>
                  </div>
                  {selectedProject === 'ALL' && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                </button>

                {visibleWorkspaces.map((proj) => {
                  const isSelected = selectedProject === proj
                  const canDelete = visibleWorkspaces.length > 1

                  return (
                    <div
                      key={proj}
                      className={`group/ws w-full px-2.5 py-1.5 rounded-[10px] flex items-center justify-between transition cursor-pointer text-left active:scale-[0.99] ${
                        isSelected ? itemActive : itemHover
                      }`}
                      onClick={() => {
                        onSelectProject(proj)
                        onClose()
                      }}
                    >
                      <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-1">
                        <svg className="w-3.5 h-3.5 shrink-0 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                            className={`p-1 rounded-full transition cursor-pointer sm:opacity-0 group-hover/ws:opacity-100 focus:opacity-100 ${
                              isDark
                                ? 'text-zinc-400 hover:text-red-400 hover:bg-white/[0.08]'
                                : 'text-zinc-400 hover:text-red-600 hover:bg-black/[0.04]'
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
                    className={`w-full mt-1.5 px-2.5 py-1.5 rounded-[10px] border border-dashed flex items-center gap-2 transition cursor-pointer text-left text-xs active:scale-98 ${
                      isDark
                        ? 'border-white/[0.1] text-[#86868b] hover:text-[#f5f5f7] hover:border-white/[0.2] hover:bg-white/[0.02]'
                        : 'border-[#d2d2d7] text-[#86868b] hover:text-[#1d1d1f] hover:border-[#86868b] hover:bg-black/[0.02]'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>New Workspace</span>
                  </button>
                )}
              </div>
            </div>
            )}

            {activeTab === 'expenses' ? (
              /* Expense Specific Filters */
              <>
                {/* 1. Month / Period Filter */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                    <span>Month / Period</span>
                    {selectedExpenseMonth !== 'ALL' && (
                      <button
                        onClick={() => onSelectExpenseMonth?.('ALL')}
                        className="text-[11px] text-[#0071e3] dark:text-[#2997ff] hover:underline cursor-pointer"
                      >
                        All Time
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={selectedExpenseMonth || 'ALL'}
                      onChange={(e) => {
                        onSelectExpenseMonth?.(e.target.value)
                        onClose()
                      }}
                      className={`w-full h-9 rounded-[10px] pl-3 pr-8 py-1.5 text-xs font-medium border outline-none cursor-pointer appearance-none ${inputBg}`}
                    >
                      <option value="ALL" className={isDark ? 'bg-[#1c1c1e] text-white' : 'bg-white text-zinc-900'}>
                        All Time
                      </option>
                      {availableExpenseMonths?.map((m) => {
                        const [year, month] = m.split('-')
                        const dateObj = new Date(Number(year), Number(month) - 1, 1)
                        const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        return (
                          <option key={m} value={m} className={isDark ? 'bg-[#1c1c1e] text-white' : 'bg-white text-zinc-900'}>
                            {label}
                          </option>
                        )
                      })}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#86868b]">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 3. Expense Categories Filter (Multi-select) */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                    <span>Expense Categories</span>
                    <div className="flex items-center gap-1.5">
                      {activeExpenseCategories.length > 0 && (
                        <button
                          onClick={() => onSelectExpenseCategory?.('ALL')}
                          className="text-[11px] text-[#0071e3] dark:text-[#2997ff] hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                      {onOpenCategoryModal && (
                        <button
                          onClick={onOpenCategoryModal}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${itemHover}`}
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
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-[10px] flex items-center justify-between text-xs transition cursor-pointer text-left active:scale-[0.99] ${
                        activeExpenseCategories.length === 0 ? itemActive : itemHover
                      }`}
                    >
                      <span className={activeExpenseCategories.length === 0 ? 'font-semibold' : ''}>
                        All Categories
                      </span>
                      <span className={countBadge(activeExpenseCategories.length === 0)}>
                        {expenseCounts?.total ?? 0}
                      </span>
                    </button>
                    {expenseCategories?.map((cat) => {
                      const isSelected = activeExpenseCategories.some(
                        (c) => c.toLowerCase() === cat.toLowerCase()
                      )
                      const count = expenseCounts?.byCategory[cat] ?? 0
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            onSelectExpenseCategory?.(cat)
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-[10px] flex items-center justify-between text-xs transition cursor-pointer text-left active:scale-[0.99] ${
                            isSelected ? itemActive : itemHover
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 pr-1">
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                            )}
                            <span className={`truncate ${isSelected ? 'font-semibold' : ''}`}>
                              {cat}
                            </span>
                          </div>
                          <span className={countBadge(isSelected)}>
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 4. Payment Methods Filter (Multi-select) */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                    <span>Payment Methods</span>
                    {activePaymentMethods.length > 0 && (
                      <button
                        onClick={() => onSelectPaymentMethod?.('ALL')}
                        className="text-[11px] text-[#0071e3] dark:text-[#2997ff] hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {SIDEBAR_PAYMENT_METHODS.map((pm) => {
                      const isSelected = pm.id === 'ALL'
                        ? activePaymentMethods.length === 0
                        : activePaymentMethods.includes(pm.id)
                      const count = pm.id === 'ALL' ? expenseCounts?.total : expenseCounts?.byMethod[pm.id] ?? 0
                      return (
                        <button
                          key={pm.id}
                          onClick={() => {
                            onSelectPaymentMethod?.(pm.id)
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-[10px] flex items-center justify-between transition cursor-pointer text-left active:scale-[0.99] ${
                            isSelected ? itemActive : itemHover
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="opacity-70 shrink-0">{renderPaymentMethodIcon(pm.id)}</span>
                            <span>{pm.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isSelected && pm.id !== 'ALL' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                            )}
                            {typeof count === 'number' && (
                              <span className={countBadge(isSelected)}>{count}</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 5. Amount Range Filter */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                    <span>Amount Range (₹)</span>
                    {(expenseMinAmount || expenseMaxAmount) && (
                      <button
                        onClick={() => {
                          onMinAmountChange?.('')
                          onMaxAmountChange?.('')
                        }}
                        className="text-[11px] text-[#0071e3] dark:text-[#2997ff] hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#86868b]">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Min"
                        value={expenseMinAmount}
                        onChange={(e) => onMinAmountChange?.(e.target.value)}
                        className={`w-full h-9 pl-5 pr-2 rounded-[10px] text-xs font-mono border outline-none ${inputBg}`}
                      />
                    </div>
                    <span className="text-[#86868b] text-xs font-mono">to</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#86868b]">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Max"
                        value={expenseMaxAmount}
                        onChange={(e) => onMaxAmountChange?.(e.target.value)}
                        className={`w-full h-9 pl-5 pr-2 rounded-[10px] text-xs font-mono border outline-none ${inputBg}`}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === 'notes' ? (
              /* Notes Specific Filters */
              <>
                {/* 1. Productivity Summary Card */}
                <div className={`p-3 rounded-[14px] border ${isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-[#fafafc] border-[#e5e5ea]'}`}>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-2">
                    <span>Overview</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-white/[0.06] text-[#86868b]' : 'bg-black/[0.04] text-[#86868b]'}`}>
                      {notesStats.completionRate}% Done
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden mb-2.5">
                    <div
                      className="h-full bg-[#0071e3] dark:bg-[#2997ff] rounded-full transition-all duration-300"
                      style={{ width: `${notesStats.completionRate}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <div className="text-[#86868b]">Logged Days</div>
                      <div className="text-sm font-semibold font-mono text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {notesStats.totalDays}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#86868b]">Tasks Done</div>
                      <div className="text-sm font-semibold font-mono text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {notesStats.completedTasks}/{notesStats.totalTasks}
                      </div>
                    </div>
                  </div>

                  {/* Quick Jump to Today if not currently on today */}
                  {selectedNoteDate !== todayStr && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectNoteDate?.(todayStr)
                        onClose()
                      }}
                      className={`w-full mt-2.5 py-1.5 px-2.5 rounded-[10px] border text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                        isDark
                          ? 'border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-[#f5f5f7]'
                          : 'border-[#e5e5ea] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] shadow-2xs'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>Jump to Today</span>
                    </button>
                  )}
                </div>

                {/* 2. Task Status Filter */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                    <span>Task Status</span>
                    {notesStatusFilter && notesStatusFilter !== 'ALL' && (
                      <button
                        onClick={() => onSelectNotesStatus?.('ALL')}
                        className="text-[11px] text-[#0071e3] dark:text-[#2997ff] hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {[
                      { id: 'ALL', label: 'All Logged Days', count: notesStats.totalDays },
                      { id: 'PENDING', label: 'Pending Tasks', count: notesStats.pendingDays },
                      { id: 'COMPLETED', label: '100% Completed', count: notesStats.completedDays },
                      { id: 'MEMO', label: 'Memos Only', count: notesStats.memoDays },
                    ].map((item) => {
                      const isSelected = (notesStatusFilter || 'ALL') === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectNotesStatus?.(item.id as any)
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-[10px] flex items-center justify-between text-xs transition cursor-pointer text-left active:scale-[0.99] ${
                            isSelected ? itemActive : itemHover
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 pr-1">
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                            )}
                            <span className={`truncate ${isSelected ? 'font-semibold' : ''}`}>
                              {item.label}
                            </span>
                          </div>
                          <span className={countBadge(isSelected)}>{item.count}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Months Filter */}
                {availableNoteMonths.length > 0 && (
                  <div>
                    <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                      <span>Month</span>
                      {notesMonthFilter && notesMonthFilter !== 'ALL' && (
                        <button
                          onClick={() => onSelectNotesMonth?.('ALL')}
                          className="text-[11px] text-[#0071e3] dark:text-[#2997ff] hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <button
                        onClick={() => onSelectNotesMonth?.('ALL')}
                        className={`w-full px-2.5 py-1.5 rounded-[10px] flex items-center justify-between text-xs transition cursor-pointer text-left active:scale-[0.99] ${
                          (notesMonthFilter || 'ALL') === 'ALL' ? itemActive : itemHover
                        }`}
                      >
                        <span className={(notesMonthFilter || 'ALL') === 'ALL' ? 'font-semibold' : ''}>
                          All Months
                        </span>
                        <span className={countBadge((notesMonthFilter || 'ALL') === 'ALL')}>
                          {notesStats.totalDays}
                        </span>
                      </button>
                      {availableNoteMonths.map((m) => {
                        const isSelected = notesMonthFilter === m.month
                        return (
                          <button
                            key={m.month}
                            onClick={() => onSelectNotesMonth?.(m.month)}
                            className={`w-full px-2.5 py-1.5 rounded-[10px] flex items-center justify-between text-xs transition cursor-pointer text-left active:scale-[0.99] ${
                              isSelected ? itemActive : itemHover
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 pr-1">
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                              )}
                              <span className={`truncate ${isSelected ? 'font-semibold' : ''}`}>
                                {m.label}
                              </span>
                            </div>
                            <span className={countBadge(isSelected)}>{m.count}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Logged Entries / Days List */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                    <span>Logged Days</span>
                    <span className="font-mono text-[10px] text-[#86868b]">
                      {filteredNoteEntries.length}
                    </span>
                  </div>

                  {filteredNoteEntries.length === 0 ? (
                    <div className="px-2 py-4 text-center text-xs text-[#86868b]">
                      No logged days match this filter
                    </div>
                  ) : (
                    <div className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-0.5">
                      {filteredNoteEntries.map((entry) => {
                        const isSelected = selectedNoteDate === entry.date
                        const dateLabel = formatSidebarNoteDate(entry.date)
                        return (
                          <button
                            key={entry.id}
                            onClick={() => {
                              onSelectNoteDate?.(entry.date)
                              onClose()
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-[10px] flex items-center justify-between text-xs transition cursor-pointer text-left active:scale-[0.99] ${
                              isSelected ? itemActive : itemHover
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 pr-1">
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                              )}
                              <span className={`truncate ${isSelected ? 'font-semibold' : ''}`}>
                                {dateLabel}
                              </span>
                              {entry.date === todayStr && (
                                <span className={countBadge(isSelected)}>
                                  Today
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={countBadge(isSelected)}>
                                {entry.totalTasks > 0
                                  ? entry.isCompleted
                                    ? '✓ Done'
                                    : `${entry.completedTasks}/${entry.totalTasks}`
                                  : 'Memo'}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Ticket Specific Filters (Inbox, Dashboard, Board) */
              <>
                {/* Ticket ID Filter */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                    <span>Ticket ID Filter</span>
                    {ticketIdFilter && onClearTicketIdFilter && (
                      <button
                        onClick={onClearTicketIdFilter}
                        className="text-[11px] text-[#0071e3] dark:text-[#2997ff] hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#86868b] font-semibold select-none pointer-events-none">#</span>
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
                      className={`w-full h-9 pl-6 pr-6 py-1.5 rounded-[10px] text-xs font-mono border outline-none transition-all duration-150 ${inputBg}`}
                    />
                    {ticketIdFilter && onClearTicketIdFilter && (
                      <button
                        type="button"
                        onClick={onClearTicketIdFilter}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition cursor-pointer"
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

                {/* Version Filter — Only on ticket tabs */}
                {isTicketTab && (
                  <div>
                    <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 opacity-70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                          <line x1="7" y1="7" x2="7.01" y2="7" />
                        </svg>
                        <span>Version Filter</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {selectedVersions.length > 0 && onSelectVersion && (
                          <button
                            onClick={() => onSelectVersion('ALL')}
                            className="text-[11px] text-[#0071e3] dark:text-[#2997ff] hover:underline cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                        {onOpenVersionModal && (
                          <button
                            type="button"
                            onClick={onOpenVersionModal}
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${itemHover}`}
                            title="Manage Versions"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-0.5 max-h-44 overflow-y-auto pr-0.5 custom-scrollbar">
                      <button
                        onClick={() => onSelectVersion?.('ALL')}
                        className={`w-full px-2.5 py-1.5 rounded-[10px] flex items-center justify-between text-xs transition cursor-pointer active:scale-[0.99] ${
                          selectedVersions.length === 0 ? itemActive : itemHover
                        }`}
                      >
                        <span className={selectedVersions.length === 0 ? 'font-semibold' : ''}>
                          All Versions
                        </span>
                        <span className={countBadge(selectedVersions.length === 0)}>
                          {ticketCounts?.total ?? 0}
                        </span>
                      </button>
                      {availableVersions
                        .filter((v) => !v.startsWith('version:::') && !v.includes(':::version:::'))
                        .map((ver) => {
                          const isSelected = selectedVersions.includes(ver)
                          const count = versionCounts ? (versionCounts[ver] || 0) : 0
                          return (
                            <button
                              key={ver}
                              onClick={() => onSelectVersion?.(ver)}
                              className={`w-full px-2.5 py-1.5 rounded-[10px] flex items-center justify-between text-xs transition cursor-pointer active:scale-[0.99] ${
                                isSelected ? itemActive : itemHover
                              }`}
                            >
                              <span className={`font-mono text-xs ${isSelected ? 'font-semibold' : ''}`}>
                                {ver}
                              </span>
                              <span className={countBadge(isSelected)}>
                                {count}
                              </span>
                            </button>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Status Filter */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                    <span>Status Filter</span>
                    {activeStatuses.length > 0 && (
                      <button
                        onClick={() => onSelectStatus('ALL')}
                        className="text-[11px] text-[#0071e3] dark:text-[#2997ff] hover:underline cursor-pointer font-medium"
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
                          className={`w-full px-2.5 py-1.5 rounded-[10px] flex items-center justify-between text-xs transition cursor-pointer active:scale-[0.99] ${
                            isSelected ? itemActive : itemHover
                          }`}
                        >
                          <span className={isSelected ? 'font-semibold' : ''}>
                            {item.label}
                          </span>
                          <span className={countBadge(isSelected)}>
                            {item.count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Priority Filter */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                    <span>Priority Filter</span>
                    {activePriorities.length > 0 && (
                      <button
                        onClick={() => onSelectPriority('ALL')}
                        className="text-[11px] text-[#0071e3] dark:text-[#2997ff] hover:underline cursor-pointer font-medium"
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
                          className={`px-2.5 py-1.5 rounded-[10px] text-xs font-medium transition cursor-pointer flex items-center justify-center border active:scale-[0.98] ${
                            item.fullWidth ? 'col-span-2' : ''
                          } ${
                            isSelected
                              ? itemActive
                              : isDark
                              ? 'bg-white/[0.04] border-white/[0.08] text-[#a1a1a6] hover:text-[#f5f5f7] hover:bg-white/[0.08]'
                              : 'bg-white border-[#e5e5ea] text-[#515154] hover:text-[#1d1d1f] hover:bg-[#fafafc] shadow-2xs'
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
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                    <span>Category Filter</span>
                    {activeCategories.length > 0 && (
                      <button
                        onClick={() => onSelectCategory('ALL')}
                        className="text-[11px] text-[#0071e3] dark:text-[#2997ff] hover:underline cursor-pointer font-medium"
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
                          className={`px-2.5 py-1.5 rounded-[10px] text-xs font-medium transition cursor-pointer flex items-center justify-between gap-1 border active:scale-[0.98] ${
                            isAll ? 'col-span-2' : ''
                          } ${
                            isSelected
                              ? itemActive
                              : isDark
                              ? 'bg-white/[0.04] border-white/[0.08] text-[#a1a1a6] hover:text-[#f5f5f7] hover:bg-white/[0.08]'
                              : 'bg-white border-[#e5e5ea] text-[#515154] hover:text-[#1d1d1f] hover:bg-[#fafafc] shadow-2xs'
                          }`}
                        >
                          <span className="truncate">{isAll ? 'All Categories' : item.label}</span>
                          {typeof count === 'number' && (
                            <span className={countBadge(isSelected)}>
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
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                    <span>Date Range Filter</span>
                    {(fromDate || toDate) && (
                      <button
                        onClick={onClearDateRange}
                        className="text-[11px] text-[#ff453a] hover:underline cursor-pointer font-medium"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="block text-[11px] font-medium text-[#86868b] mb-1">From Date</span>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => onSelectFromDate(e.target.value)}
                        className={`w-full rounded-[10px] px-2.5 py-1.5 text-xs focus:outline-none font-mono ${inputBg}`}
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-[#86868b] mb-1">To Date</span>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => onSelectToDate(e.target.value)}
                        className={`w-full rounded-[10px] px-2.5 py-1.5 text-xs focus:outline-none font-mono ${inputBg}`}
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
                className={`absolute bottom-full left-1.5 right-1.5 mb-2 p-1.5 rounded-xl border shadow-2xl backdrop-blur-md z-50 transition-all ${
                  isDark
                    ? 'bg-[#1c1c1e]/95 border-white/[0.12] text-[#f5f5f7] shadow-black/80'
                    : 'bg-white/95 border-[#e5e5ea] text-[#1d1d1f] shadow-xl'
                }`}
              >
                <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                  Settings
                </div>

                {/* Appearance Theme Switcher */}
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[12px] gap-2">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Appearance</span>
                  <div
                    className={`inline-flex items-center p-0.5 rounded-lg border shrink-0 gap-0.5 ${
                      isDark
                        ? 'bg-black/40 border-white/[0.08]'
                        : 'bg-black/[0.04] border-black/[0.06]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => isDark && onToggleTheme()}
                      title="Light"
                      aria-label="Light"
                      className={`w-7 h-7 flex items-center justify-center rounded-md transition cursor-pointer ${
                        !isDark
                          ? 'bg-white text-zinc-900 shadow-xs border border-black/[0.08]'
                          : 'text-zinc-500 hover:text-zinc-200 border border-transparent'
                      }`}
                    >
                      <svg
                        className="w-3.5 h-3.5 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => !isDark && onToggleTheme()}
                      title="Dark"
                      aria-label="Dark"
                      className={`w-7 h-7 flex items-center justify-center rounded-md transition cursor-pointer ${
                        isDark
                          ? 'bg-white/[0.14] text-white shadow-xs border border-white/[0.1]'
                          : 'text-zinc-500 hover:text-zinc-800 border border-transparent'
                      }`}
                    >
                      <svg
                        className="w-3.5 h-3.5 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* App Version */}
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[12px] text-xs">
                  <span className="font-medium text-[#86868b]">Version</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-medium border leading-none select-none ${
                      isDark
                        ? 'bg-white/[0.06] text-[#86868b] border-white/[0.08]'
                        : 'bg-[#e5e5ea]/60 text-[#86868b] border-[#e5e5ea]'
                    }`}
                  >
                    v{packageInfo.version}
                  </span>
                </div>

                <div className={`my-1 border-t ${isDark ? 'border-white/[0.08]' : 'border-[#e5e5ea]'}`} />

                {/* Log Out Option */}
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false)
                      onLogout()
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-xs font-medium transition cursor-pointer text-left active:scale-[0.98] ${
                      isDark
                        ? 'text-zinc-300 hover:text-white hover:bg-white/[0.08]'
                        : 'text-zinc-700 hover:text-zinc-950 hover:bg-black/[0.05]'
                    }`}
                  >
                    <svg
                      className="w-4 h-4 shrink-0 opacity-80"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 8v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" />
                      <polyline points="16 8 20 12 16 16" />
                      <line x1="9" y1="12" x2="20" y2="12" />
                    </svg>
                    <span>Log out</span>
                  </button>
                )}
              </div>
            )}

            {/* Profile Card with Settings Gear Trigger */}
            <div className={`p-2 rounded-[16px] border flex items-center justify-between gap-2.5 transition ${
              isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-white border-[#e5e5ea] shadow-2xs'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-1">
                <div className="relative shrink-0">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/[0.08]"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full font-semibold text-xs flex items-center justify-center shrink-0 uppercase ${
                      isDark ? 'bg-white/[0.1] text-[#f5f5f7]' : 'bg-[#e5e5ea] text-[#1d1d1f]'
                    }`}>
                      {user?.name ? user.name.slice(0, 2) : 'US'}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#34c759] ring-2 ${
                      isDark ? 'ring-[#121214]' : 'ring-white'
                    }`}
                  />
                </div>
                <div className="truncate min-w-0 flex-1">
                  <span className={`block text-xs font-semibold truncate ${textPrimary}`}>
                    {user?.name || 'User'}
                  </span>
                  <span className="block text-[11px] text-[#86868b] truncate">
                    {user?.email || (user?.username ? `@${user.username}` : 'authenticated')}
                  </span>
                </div>
              </div>

              {/* Settings Gear Button */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen((prev) => !prev)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
                  isSettingsOpen
                    ? isDark
                      ? 'bg-white/[0.15] text-white'
                      : 'bg-black/[0.08] text-[#1d1d1f]'
                    : isDark
                      ? 'text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/[0.08]'
                      : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.05]'
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
