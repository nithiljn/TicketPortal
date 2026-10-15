'use client'

import React, { useState, useMemo } from 'react'
import { Expense, PaymentMethod } from '@/types'
import { Button } from '@/components/Button'
import { generateExpensePdf } from '@/lib/generateExpensePdf'

interface ExpenseTrackerProps {
  expenses: Expense[]
  availableProjects: string[]
  selectedProject: string
  categories: string[]
  onAddExpense: () => void
  onEditExpense: (expense: Expense) => void
  onDeleteExpense: (expense: Expense) => void
  onOpenCategoryManager: () => void
  theme?: 'dark' | 'light'
  // Synced Filter Props from Page / Sidebar
  selectedCategory?: string | 'ALL'
  onSelectCategory?: (cat: string | 'ALL') => void
  selectedPaymentMethod?: string | 'ALL'
  onSelectPaymentMethod?: (pm: string | 'ALL') => void
  selectedMonth?: string
  onSelectMonth?: (m: string) => void
  minAmount?: string
  maxAmount?: string
  searchQuery?: string
  onSelectWorkspace?: (ws: string) => void
  onMinAmountChange?: (val: string) => void
  onMaxAmountChange?: (val: string) => void
  onExpenseSearchChange?: (val: string) => void
  onClearAllFilters?: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  // 1. Food & Dining: Vibrant Emerald (Theme Primary)
  'Food & Dining': '#10b981',

  // 2. Travel & Transport: Electric Cyan (distinct from emerald green)
  'Travel & Transport': '#06b6d4',

  // 3. Software & Subscriptions: Vivid Purple / Violet
  'Software & Subscriptions': '#8b5cf6',

  // 4. Office Supplies: Warm Amber / Orange (distinct, never grey)
  'Office Supplies': '#f97316',

  // 5. Cloud & Hosting: Tech Royal Blue
  'Cloud & Hosting': '#3b82f6',

  // 6. Marketing & Ads: Bright Gold / Yellow
  'Marketing & Ads': '#eab308',

  // 7. Bills & Utilities: Coral Red / Crimson (essential bills, vibrant, never grey)
  'Bills & Utilities': '#ef4444',

  // 8. Personal: Radiant Fuchsia / Magenta
  'Personal': '#d946ef',

  // 9. Clothes & Products: Hot Pink (shopping/retail, completely distinct from bills & food)
  'Clothes and products': '#ec4899',
  'Clothes & Products': '#ec4899',
  'Clothing & Apparel': '#ec4899',
  'Shopping': '#ec4899',

  // 10. Health & Wellness: Bright Lime Green
  'Health & Wellness': '#84cc16',
  'Medical & Healthcare': '#84cc16',
  'Fitness': '#84cc16',

  // 11. Entertainment: Rich Indigo
  'Entertainment': '#6366f1',
  'Entertainment & Leisure': '#6366f1',

  // 12. Education: Deep Sky Blue
  'Education': '#0ea5e9',
  'Education & Learning': '#0ea5e9',

  // 13. Miscellaneous: Clean Slate Grey
  'Miscellaneous': '#94a3b8',
  'General': '#94a3b8',
  'Other': '#94a3b8',
}

// 32-color curated palette with wide hue distribution for automatic assignment
const DYNAMIC_PALETTE = [
  '#10b981', // Emerald
  '#3b82f6', // Royal Blue
  '#f97316', // Orange
  '#8b5cf6', // Violet
  '#ec4899', // Hot Pink
  '#06b6d4', // Cyan
  '#eab308', // Gold
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#6366f1', // Indigo
  '#d946ef', // Fuchsia
  '#0ea5e9', // Sky Blue
  '#84cc16', // Lime
  '#fb7185', // Rose
  '#22c55e', // Green
  '#38bdf8', // Light Blue
  '#c084fc', // Lavender
  '#fb923c', // Peach Orange
  '#4ade80', // Mint
  '#e879f9', // Orchid
  '#2dd4bf', // Aqua
  '#f43f5e', // Crimson
  '#60a5fa', // Cornflower
  '#a3e635', // Yellow Green
  '#f472b6', // Carnation
  '#818cf8', // Periwinkle
  '#34d399', // Sea Green
  '#facc15', // Sunflower
  '#93c5fd', // Soft Blue
  '#94a3b8', // Slate
]

function getCategoryColor(category: string, index?: number): string {
  if (!category) return '#94a3b8'
  const normalized = category.trim().toLowerCase()

  // 1. Direct match or case-insensitive match against CATEGORY_COLORS
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (key.trim().toLowerCase() === normalized) {
      return color
    }
  }

  // 2. Deterministic string hash for any custom/new category
  // Guarantees stable color assignment that never changes based on sorting or filter
  let hash = 0
  const clean = normalized.replace(/[^a-z0-9]/g, '')
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i)
    hash |= 0
  }
  const paletteIndex = Math.abs(hash) % DYNAMIC_PALETTE.length
  return DYNAMIC_PALETTE[paletteIndex]
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  UPI: 'UPI / GPay',
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  CASH: 'Cash',
  NET_BANKING: 'Net Banking',
  OTHER: 'Other',
}

function renderPaymentMethodIcon(method: string) {
  const iconCls = "w-4 h-4 text-zinc-400"
  switch (method?.toUpperCase()) {
    case 'UPI':
      return (
        <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      )
    case 'CREDIT_CARD':
      return (
        <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      )
    case 'DEBIT_CARD':
      return (
        <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <circle cx="7" cy="15" r="1.5" />
          <circle cx="12" cy="15" r="1.5" />
        </svg>
      )
    case 'CASH':
      return (
        <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      )
    case 'NET_BANKING':
      return (
        <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18M3 10h18M5 6l7-4 7 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
        </svg>
      )
    case 'OTHER':
    default:
      return (
        <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      )
  }
}

export function ExpenseTracker({
  expenses,
  availableProjects,
  selectedProject,
  categories,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onOpenCategoryManager,
  theme = 'light',
  selectedCategory: propCategory,
  onSelectCategory,
  selectedPaymentMethod: propPaymentMethod,
  onSelectPaymentMethod,
  selectedMonth: propMonth,
  onSelectMonth,
  minAmount = '',
  maxAmount = '',
  searchQuery = '',
  onSelectWorkspace,
  onMinAmountChange,
  onMaxAmountChange,
  onExpenseSearchChange,
  onClearAllFilters,
}: ExpenseTrackerProps) {
  const isDark = theme === 'dark'

  // Current Date helpers
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Filters State - sync with props if provided, otherwise internal fallback
  const [internalMonth, setInternalMonth] = useState<string>('ALL')
  const [internalCategory, setInternalCategory] = useState<string>('ALL')
  const [internalPaymentMethod, setInternalPaymentMethod] = useState<string>('ALL')
  const [internalHighExpense, setInternalHighExpense] = useState<boolean>(false)
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const activeMonth = propMonth !== undefined ? propMonth : internalMonth
  const handleMonthChange = (m: string) => {
    setInternalMonth(m)
    if (onSelectMonth) onSelectMonth(m)
  }

  const activeCategory = propCategory !== undefined ? propCategory : internalCategory
  const handleCategoryChange = (c: string | 'ALL') => {
    setInternalCategory(c)
    if (onSelectCategory) onSelectCategory(c)
  }

  const activePaymentMethod = propPaymentMethod !== undefined ? propPaymentMethod : internalPaymentMethod
  const handlePaymentMethodChange = (pm: string | 'ALL') => {
    setInternalPaymentMethod(pm)
    if (onSelectPaymentMethod) onSelectPaymentMethod(pm)
  }

  const handleClearMonth = () => {
    handleMonthChange('ALL')
  }

  const handleClearCategory = () => {
    handleCategoryChange('ALL')
  }

  const handleClearPaymentMethod = () => {
    handlePaymentMethodChange('ALL')
  }

  const handleClearWorkspace = () => {
    onSelectWorkspace?.('ALL')
  }

  const handleClearAmount = () => {
    onMinAmountChange?.('')
    onMaxAmountChange?.('')
  }

  const handleClearSearch = () => {
    onExpenseSearchChange?.('')
  }

  const handleClearAll = () => {
    if (onClearAllFilters) {
      onClearAllFilters()
    }
    handleMonthChange('ALL')
    handleCategoryChange('ALL')
    handlePaymentMethodChange('ALL')
    onSelectWorkspace?.('ALL')
    onMinAmountChange?.('')
    onMaxAmountChange?.('')
    onExpenseSearchChange?.('')
  }

  const activeFiltersCount =
    (selectedProject !== 'ALL' ? 1 : 0) +
    (activeMonth !== 'ALL' ? 1 : 0) +
    (activeCategory !== 'ALL' ? 1 : 0) +
    (activePaymentMethod !== 'ALL' ? 1 : 0) +
    (Boolean(minAmount || maxAmount) ? 1 : 0) +
    (Boolean(searchQuery && searchQuery.trim()) ? 1 : 0)

  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc')

  // Generate available months from actual expense dates + current month
  const availableMonths = useMemo(() => {
    const set = new Set<string>()
    set.add(currentMonthKey)
    expenses.forEach((e) => {
      if (e.date && e.date.length >= 7) {
        set.add(e.date.slice(0, 7))
      }
    })
    return Array.from(set).sort().reverse()
  }, [expenses, currentMonthKey])

  // Filtered expenses based on all active criteria
  const filteredExpenses = useMemo(() => {
    let result = [...expenses]

    // 1. Month Filter
    if (activeMonth !== 'ALL') {
      result = result.filter((e) => e.date && e.date.startsWith(activeMonth))
    }

    // 2. Workspace Filter
    if (selectedProject !== 'ALL') {
      result = result.filter(
        (e) => (e.projectName || 'General').toLowerCase() === selectedProject.toLowerCase()
      )
    }

    // 3. Category Filter
    if (activeCategory !== 'ALL') {
      result = result.filter(
        (e) => (e.category || '').toLowerCase() === activeCategory.toLowerCase()
      )
    }

    // 4. Payment Method Filter
    if (activePaymentMethod !== 'ALL') {
      result = result.filter(
        (e) => (e.paymentMethod || '').toUpperCase() === activePaymentMethod.toUpperCase()
      )
    }

    // 5. Amount Range Filter (Custom Spending Level)
    const minVal = minAmount ? parseFloat(minAmount) : NaN
    const maxVal = maxAmount ? parseFloat(maxAmount) : NaN

    if (!isNaN(minVal)) {
      result = result.filter((e) => Number(e.amount) >= minVal)
    }
    if (!isNaN(maxVal)) {
      result = result.filter((e) => Number(e.amount) <= maxVal)
    }

    // 6. Search Query (title, category, or notes)
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          e.projectName.toLowerCase().includes(q)
      )
    }

    // 7. Sort
    result.sort((a, b) => {
      if (sortBy === 'amount-desc') return Number(b.amount) - Number(a.amount)
      if (sortBy === 'amount-asc') return Number(a.amount) - Number(b.amount)
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date)
      return b.date.localeCompare(a.date) // 'date-desc' default
    })

    return result
  }, [
    expenses,
    activeMonth,
    selectedProject,
    activeCategory,
    activePaymentMethod,
    minAmount,
    maxAmount,
    searchQuery,
    sortBy,
  ])

  // KPI Calculations
  const stats = useMemo(() => {
    const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const count = filteredExpenses.length

    // Today spend
    const todayStr = new Date().toISOString().split('T')[0]
    const todayAmount = filteredExpenses
      .filter((e) => e.date === todayStr)
      .reduce((sum, e) => sum + Number(e.amount), 0)

    // Category breakdown
    const categoryTotals: Record<string, number> = {}
    filteredExpenses.forEach((e) => {
      const cat = e.category || 'Miscellaneous'
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount)
    })

    let topCategory = 'None'
    let topCategoryAmount = 0
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      if (amt > topCategoryAmount) {
        topCategory = cat
        topCategoryAmount = amt
      }
    })

    // Highest single transaction
    let highestSingle = 0
    let highestTitle = ''
    filteredExpenses.forEach((e) => {
      if (Number(e.amount) > highestSingle) {
        highestSingle = Number(e.amount)
        highestTitle = e.title
      }
    })

    // Average per day
    const uniqueDays = new Set(filteredExpenses.map((e) => e.date)).size
    const dailyAverage = uniqueDays > 0 ? totalAmount / uniqueDays : 0

    return {
      totalAmount,
      count,
      todayAmount,
      topCategory,
      topCategoryAmount,
      topCategoryPercent: totalAmount > 0 ? Math.round((topCategoryAmount / totalAmount) * 100) : 0,
      highestSingle,
      highestTitle,
      dailyAverage,
      categoryTotals,
    }
  }, [filteredExpenses])

  // Category Donut Chart Segments
  const donutSegments = useMemo(() => {
    const total = stats.totalAmount
    if (total === 0) return []

    const RADIUS = 40
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS
    let accumulatedAngle = 0

    const entries = Object.entries(stats.categoryTotals).sort((a, b) => b[1] - a[1])
    return entries.map(([category, amount], idx) => {
      const percentage = (amount / total) * 100
      const strokeDasharray = `${(percentage / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`
      const strokeDashoffset = -accumulatedAngle
      accumulatedAngle += (percentage / 100) * CIRCUMFERENCE
      const color = getCategoryColor(category, idx)
      return {
        category,
        amount,
        percentage: Math.round(percentage),
        strokeDasharray,
        strokeDashoffset,
        color,
      }
    })
  }, [stats.categoryTotals, stats.totalAmount])

  // Currently hovered category segment for circle graph zoom & center readout
  const hoveredSeg = useMemo(() => {
    if (!hoveredCategory) return null
    return (
      donutSegments.find(
        (s) => s.category.toLowerCase() === hoveredCategory.toLowerCase()
      ) || null
    )
  }, [hoveredCategory, donutSegments])

  // Daily Spending Trend Data (Last 14 days or days in selected month)
  const dailySpendData = useMemo(() => {
    const dayMap: Record<string, number> = {}
    filteredExpenses.forEach((e) => {
      if (e.date) {
        dayMap[e.date] = (dayMap[e.date] || 0) + Number(e.amount)
      }
    })

    const days = Object.keys(dayMap).sort()
    const maxSpend = Math.max(...Object.values(dayMap), 1)

    return days.slice(-12).map((d) => ({
      date: d,
      displayDate: d.slice(5), // MM-DD
      amount: dayMap[d],
      percentage: Math.min(100, Math.round((dayMap[d] / maxSpend) * 100)),
    }))
  }, [filteredExpenses])

  // Grouped expenses by Date
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {}
    filteredExpenses.forEach((e) => {
      const d = e.date || 'Unknown'
      if (!groups[d]) groups[d] = []
      groups[d].push(e)
    })
    return groups
  }, [filteredExpenses])

  // Format currency
  const formatMoney = (val: number) => {
    return `₹${val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // Month navigation
  const formatMonthName = (mKey: string) => {
    if (mKey === 'ALL') return 'All Time'
    const [year, month] = mKey.split('-')
    const dateObj = new Date(Number(year), Number(month) - 1, 1)
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Download PDF Report Handler
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const handleDownloadPdf = async () => {
    if (filteredExpenses.length === 0 || isGeneratingPdf) return
    setIsGeneratingPdf(true)
    try {
      const categoryBreakdown = Object.entries(stats.categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount], idx) => ({
          category,
          amount,
          percentage: stats.totalAmount > 0 ? Math.round((amount / stats.totalAmount) * 100) : 0,
          color: getCategoryColor(category, idx),
        }))

      await new Promise((resolve) => setTimeout(resolve, 60))

      generateExpensePdf({
        expenses: filteredExpenses,
        activeMonth,
        selectedProject,
        activeCategory,
        activePaymentMethod,
        minAmount,
        maxAmount,
        searchQuery,
        stats,
        categoryBreakdown,
        dailyTrend: dailySpendData,
      })
    } catch (err) {
      console.error('Failed to generate expense PDF report:', err)
      alert('Unable to generate PDF report. Please try again.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Styles
  const cardBg = isDark
    ? 'bg-[#111114] border-white/[0.06] text-zinc-100'
    : 'bg-white border-zinc-200 text-zinc-900'
  const filterBtnBg = isDark
    ? 'bg-black/40 border-white/[0.08] text-zinc-300'
    : 'bg-zinc-50 border-zinc-200 text-zinc-700'
  const pillActive = isDark
    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-semibold'
    : 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold'
  const subHeaderBorder = isDark ? 'border-white/[0.06] bg-[#09090b]' : 'border-zinc-200 bg-white'
  const subHeaderTitle = isDark ? 'text-zinc-200 font-semibold' : 'text-zinc-800 font-semibold'
  const categoryBadge = isDark
    ? 'bg-white/[0.03] border-white/[0.08] text-zinc-300'
    : 'bg-zinc-50 border-zinc-200 text-zinc-700'

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Sub-header inside view (Matches InboxTable filtration bar) */}
      <div className={`px-4 sm:px-6 py-2.5 sm:py-3 border-b flex items-center justify-between text-xs shrink-0 ${subHeaderBorder}`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={subHeaderTitle}>
            {selectedProject === 'ALL' ? 'All Workspaces' : selectedProject}
          </span>
          <span className={isDark ? 'text-zinc-600' : 'text-zinc-300'}>•</span>
          <span className="font-mono text-[11px] text-zinc-500">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'item' : 'items'}
          </span>

          {/* Active Workspace Filter Chip */}
          {selectedProject !== 'ALL' && (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${categoryBadge}`}
            >
              <span className="text-zinc-500 text-[11px]">Workspace:</span>
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{selectedProject}</span>
              {onSelectWorkspace && (
                <button
                  type="button"
                  onClick={handleClearWorkspace}
                  className={`p-0.5 rounded transition cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200'
                  }`}
                  title="Reset to All Workspaces"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </span>
          )}

          {/* Active Month Filter Chip */}
          {activeMonth !== 'ALL' && (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${categoryBadge}`}
            >
              <span className="text-zinc-500 text-[11px]">Month:</span>
              <span>{formatMonthName(activeMonth)}</span>
              <button
                type="button"
                onClick={handleClearMonth}
                className={`p-0.5 rounded transition cursor-pointer ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200'
                }`}
                title="Reset to All Time"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          )}

          {/* Active Category Filter Chip */}
          {activeCategory !== 'ALL' && (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${categoryBadge}`}
            >
              <span className="text-zinc-500 text-[11px]">Category:</span>
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{activeCategory}</span>
              <button
                type="button"
                onClick={handleClearCategory}
                className={`p-0.5 rounded transition cursor-pointer ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200'
                }`}
                title={`Remove ${activeCategory} filter`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          )}

          {/* Active Payment Method Filter Chip */}
          {activePaymentMethod !== 'ALL' && (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${categoryBadge}`}
            >
              <span className="text-zinc-500 text-[11px]">Payment:</span>
              <span>{PAYMENT_METHOD_LABELS[activePaymentMethod] || activePaymentMethod}</span>
              <button
                type="button"
                onClick={handleClearPaymentMethod}
                className={`p-0.5 rounded transition cursor-pointer ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200'
                }`}
                title="Remove payment method filter"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          )}

          {/* Active Amount Range Filter Chip */}
          {(minAmount || maxAmount) && (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${categoryBadge}`}
            >
              <span className="text-zinc-500 text-[11px]">Amount:</span>
              <span className="font-mono">
                {minAmount && maxAmount
                  ? `₹${minAmount} - ₹${maxAmount}`
                  : minAmount
                  ? `≥ ₹${minAmount}`
                  : `≤ ₹${maxAmount}`}
              </span>
              <button
                type="button"
                onClick={handleClearAmount}
                className={`p-0.5 rounded transition cursor-pointer ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200'
                }`}
                title="Remove amount range filter"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          )}

          {/* Active Search Query Filter Chip */}
          {searchQuery && searchQuery.trim() && (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${categoryBadge}`}
            >
              <span className="text-zinc-500 text-[11px]">Search:</span>
              <span className="truncate max-w-[140px] sm:max-w-[200px]">&quot;{searchQuery.trim()}&quot;</span>
              <button
                type="button"
                onClick={handleClearSearch}
                className={`p-0.5 rounded transition cursor-pointer ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200'
                }`}
                title="Clear search query"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          )}

          {/* Clear All Filters */}
          {activeFiltersCount >= 1 && (
            <button
              type="button"
              onClick={handleClearAll}
              className={`text-[11px] font-medium transition cursor-pointer underline ml-1 ${
                isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Right side: Filtered Spend Summary */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-zinc-500">Filtered Total:</span>
          <span className="font-mono font-semibold text-xs text-zinc-900 dark:text-zinc-100">
            {formatMoney(stats.totalAmount)}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* 1. Header & Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base transition-all shrink-0 ${
                isDark
                  ? 'bg-zinc-800 border border-zinc-700/80 text-white shadow-xs'
                  : 'bg-zinc-900 border border-zinc-800 text-white shadow-xs'
              }`}>
                ₹
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight">
                  Expense Tracker
                </h1>
                <p className="text-xs text-zinc-500">
                  Monitor spending, manage categories, and review daily expenditure
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Month Filter Selector */}
            <select
              value={activeMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className={`h-8 px-2.5 rounded-xl border text-xs font-medium focus:outline-none cursor-pointer transition ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 shadow-2xs'
              }`}
              title="Filter expenses by month"
            >
              <option value="ALL">All Time</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthName(m)}
                </option>
              ))}
            </select>

            {/* Download PDF Report Button (Left side of Categories) */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || filteredExpenses.length === 0}
              className={`h-8 px-3 rounded-xl border text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 disabled:opacity-50'
                : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 shadow-2xs disabled:opacity-50'
            }`}
            title={
              filteredExpenses.length === 0
                ? 'No expenses to export'
                : `Download ${activeMonth !== 'ALL' ? formatMonthName(activeMonth) : 'current'} expense report as PDF`
            }
          >
            {isGeneratingPdf ? (
              <svg className="w-3.5 h-3.5 animate-spin text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="16" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
            <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
          </button>

          {/* Manage Categories Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCategoryManager}
            leftIcon={
              <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            }
          >
            Categories
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Spent */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              Total Spent
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono border ${
              isDark ? 'bg-white/[0.04] text-zinc-400 border-white/[0.06]' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}>
              {stats.count} txns
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono mt-1 text-zinc-900 dark:text-zinc-100">
            {formatMoney(stats.totalAmount)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {activeMonth === 'ALL' ? 'Total all time spend' : `Spend for ${formatMonthName(activeMonth)}`}
          </div>
        </div>

        {/* Card 2: Today's Spend */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Today&apos;s Spend
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono mt-1 text-zinc-900 dark:text-zinc-100">
            {formatMoney(stats.todayAmount)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Recorded expenses for today
          </div>
        </div>

        {/* Card 3: Daily Average */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Daily Average
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono mt-1 text-zinc-900 dark:text-zinc-100">
            {formatMoney(stats.dailyAverage)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Average spent per active day
          </div>
        </div>

        {/* Card 4: Top Category */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              Top Category
            </span>
            {stats.topCategoryPercent > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-500/10 text-zinc-400 font-mono font-medium">
                {stats.topCategoryPercent}%
              </span>
            )}
          </div>
          <div className="text-sm sm:text-base font-bold font-mono truncate mt-1 text-zinc-900 dark:text-zinc-100">
            {stats.topCategory}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 font-mono">
            {stats.topCategoryAmount > 0 ? formatMoney(stats.topCategoryAmount) : 'No data'}
          </div>
        </div>
      </div>

      {/* 3. Analytics Section: Donut Chart + Daily Spend Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Category Circular Donut Chart */}
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-inherit">
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Category Distribution
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">
              {donutSegments.length} categories
            </span>
          </div>

          {donutSegments.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-zinc-500 text-xs">
              <span>No expenses recorded for this period</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
              {/* Circular SVG Donut Chart */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg
                  className="w-36 h-36 transform -rotate-90 overflow-visible"
                  viewBox="0 0 100 100"
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={isDark ? 'stroke-white/[0.06]' : 'stroke-zinc-100'}
                    strokeWidth="12"
                    fill="none"
                  />
                  {donutSegments.map((seg) => {
                    const isHovered =
                      hoveredCategory?.toLowerCase() === seg.category.toLowerCase()
                    const isSelected =
                      activeCategory?.toLowerCase() === seg.category.toLowerCase()
                    const isAnyHovered = Boolean(hoveredCategory)

                    return (
                      <circle
                        key={seg.category}
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={seg.color}
                        strokeWidth={isHovered ? 16 : isSelected ? 14 : isAnyHovered ? 10 : 12}
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                        fill="none"
                        opacity={isHovered || isSelected ? 1 : isAnyHovered ? 0.35 : 1}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredCategory(seg.category)}
                        onClick={() =>
                          handleCategoryChange(seg.category === activeCategory ? 'ALL' : seg.category)
                        }
                      >
                        <title>{`${seg.category}: ${formatMoney(seg.amount)} (${seg.percentage}%)`}</title>
                      </circle>
                    )
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1 transition-all duration-200">
                  {hoveredSeg ? (
                    <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center max-w-[85px]">
                      <span
                        className="text-[10px] font-bold font-mono uppercase tracking-tight truncate max-w-full"
                        style={{ color: hoveredSeg.color }}
                        title={hoveredSeg.category}
                      >
                        {hoveredSeg.category}
                      </span>
                      <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 truncate max-w-full mt-0.5">
                        {formatMoney(hoveredSeg.amount)}
                      </span>
                      <span className="text-[10px] font-mono font-medium text-zinc-500">
                        {hoveredSeg.percentage}%
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] uppercase font-mono text-zinc-400">Total</span>
                      <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                        {formatMoney(stats.totalAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Legend List */}
              <div
                className="flex-1 w-full space-y-1.5 max-h-48 overflow-y-auto pr-1"
                onMouseLeave={() => setHoveredCategory(null)}
              >
                {donutSegments.map((seg) => {
                  const isHovered =
                    hoveredCategory?.toLowerCase() === seg.category.toLowerCase()
                  const isSelected = activeCategory === seg.category

                  return (
                    <div
                      key={seg.category}
                      onMouseEnter={() => setHoveredCategory(seg.category)}
                      onClick={() =>
                        handleCategoryChange(seg.category === activeCategory ? 'ALL' : seg.category)
                      }
                      className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? isDark
                            ? 'bg-white/[0.12] ring-1 ring-white/20'
                            : 'bg-zinc-200 ring-1 ring-zinc-300'
                          : isHovered
                          ? isDark
                            ? 'bg-white/[0.08] translate-x-1'
                            : 'bg-zinc-100 translate-x-1'
                          : 'hover:bg-zinc-500/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`rounded-full shrink-0 transition-transform duration-150 ${
                            isHovered ? 'w-3 h-3 scale-125' : 'w-2.5 h-2.5'
                          }`}
                          style={{ backgroundColor: seg.color }}
                        />
                        <span
                          className={`truncate ${
                            isHovered || isSelected
                              ? 'font-semibold text-zinc-900 dark:text-zinc-100'
                              : 'font-medium'
                          }`}
                        >
                          {seg.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className="text-zinc-500 text-[11px]">{seg.percentage}%</span>
                        <span
                          className={`font-semibold ${
                            isHovered ? 'text-zinc-950 dark:text-white' : ''
                          }`}
                        >
                          {formatMoney(seg.amount)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Daily Spending Trend Bars */}
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-inherit">
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Daily Spending Trend
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">
              Recent Activity
            </span>
          </div>

          {dailySpendData.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-zinc-500 text-xs">
              <span>No daily spend trend to display</span>
            </div>
          ) : (
            <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-1">
              {dailySpendData.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-7 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-mono whitespace-nowrap shadow-lg">
                      {formatMoney(d.amount)}
                    </span>
                  </div>
                  {/* Bar */}
                  <div className="w-full max-w-[28px] bg-zinc-500/10 rounded-t-md flex items-end h-full overflow-hidden">
                    <div
                      className="w-full bg-emerald-500 hover:bg-emerald-400 rounded-t-md transition-all duration-300"
                      style={{ height: `${Math.max(8, d.percentage)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 truncate">
                    {d.displayDate}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Grouped Expenses List */}
      <div className="space-y-4">
        {/* Section Header with Count & Sort */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Transactions
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400">
              {filteredExpenses.length !== expenses.length
                ? `${filteredExpenses.length} of ${expenses.length}`
                : filteredExpenses.length}
            </span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`rounded-lg border px-2.5 py-1 text-xs focus:outline-none cursor-pointer ${filterBtnBg}`}
          >
            <option value="date-desc">Sort: Newest Date</option>
            <option value="date-asc">Sort: Oldest Date</option>
            <option value="amount-desc">Sort: Highest Amount</option>
            <option value="amount-asc">Sort: Lowest Amount</option>
          </select>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className={`p-12 rounded-2xl border text-center ${cardBg} space-y-3`}>
            <div className="w-12 h-12 rounded-2xl bg-zinc-500/10 flex items-center justify-center mx-auto text-zinc-400">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold">
              {activeFiltersCount > 0 ? 'No matching expenses found' : 'No expenses found'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {activeFiltersCount > 0
                ? 'No transactions match your active filters. Try adjusting your filters or clear them to view all expenses.'
                : 'No transactions match the selected filters or month. Try adjusting your filter or add a new expense.'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                    isDark
                      ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-200'
                      : 'border-zinc-300 hover:bg-zinc-100 text-zinc-800 shadow-2xs'
                  }`}
                >
                  Clear all filters
                </button>
              )}
              <button
                type="button"
                onClick={onAddExpense}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Record First Expense</span>
              </button>
            </div>
          </div>
        ) : (
          Object.keys(groupedExpenses).map((dateStr) => {
            const dayExpenses = groupedExpenses[dateStr]
            const dayTotal = dayExpenses.reduce((s, e) => s + Number(e.amount), 0)

            return (
              <div key={dateStr} className={`rounded-2xl border overflow-hidden ${cardBg}`}>
                {/* Date Header */}
                <div className={`px-4 sm:px-5 py-2.5 border-b border-inherit flex items-center justify-between ${
                  isDark ? 'bg-black/20' : 'bg-zinc-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="text-xs font-bold font-mono">
                      {dateStr === now.toISOString().split('T')[0] ? 'Today - ' : ''}
                      {dateStr}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      ({dayExpenses.length} {dayExpenses.length === 1 ? 'transaction' : 'transactions'})
                    </span>
                  </div>
                  <div className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Day Total: {formatMoney(dayTotal)}
                  </div>
                </div>

                {/* Day Expense Items */}
                <div className="divide-y divide-inherit">
                  {dayExpenses.map((exp) => {
                    const isHigh = Number(exp.amount) >= 2000
                    const methodLabel = PAYMENT_METHOD_LABELS[exp.paymentMethod] || exp.paymentMethod

                    return (
                      <div
                        key={exp.id}
                        onDoubleClick={() => setViewingExpense(exp)}
                        className={`p-3.5 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition cursor-pointer select-none ${
                          isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-zinc-50'
                        }`}
                        title="Double-click to view receipt details"
                      >
                        {/* Left Info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-zinc-100 border-zinc-200'
                          }`}>
                            {renderPaymentMethodIcon(exp.paymentMethod)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="text-xs font-semibold text-zinc-100 sm:text-zinc-900 dark:text-zinc-100">
                                {exp.title}
                              </span>
                              {isHigh && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-semibold ${
                                  isDark
                                    ? 'bg-white/[0.06] text-zinc-200 border-white/[0.1]'
                                    : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                                }`}>
                                  High
                                </span>
                              )}
                              <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                                isDark
                                  ? 'bg-white/[0.04] text-zinc-300 border-white/[0.08]'
                                  : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                              }`}>
                                {exp.category}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-mono ${
                                isDark
                                  ? 'bg-white/[0.02] text-zinc-400 border-white/[0.06]'
                                  : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                              }`}>
                                #{exp.projectName}
                              </span>
                            </div>

                            {exp.notes && (
                              <div className="mt-1">
                                <p className="text-[11px] text-zinc-400 whitespace-pre-line line-clamp-2 leading-relaxed">
                                  {exp.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 pl-11 sm:pl-0">
                          <div className="text-right">
                            <div className="text-sm sm:text-base font-bold font-mono text-zinc-100 sm:text-zinc-900 dark:text-zinc-100">
                              {formatMoney(Number(exp.amount))}
                            </div>
                            <span className="text-[10px] text-zinc-500">
                              via {methodLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* View Details Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setViewingExpense(exp)
                              }}
                              className={`h-7.5 px-2.5 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 ${
                                isDark
                                  ? 'border-white/[0.08] hover:border-white/[0.18] bg-white/[0.02] hover:bg-white/[0.08] text-zinc-300 hover:text-white'
                                  : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 shadow-2xs'
                              }`}
                              title="View Details"
                            >
                              <svg className="w-3.5 h-3.5 shrink-0 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              <span>View</span>
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEditExpense(exp)
                              }}
                              className={`h-7.5 px-2.5 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 ${
                                isDark
                                  ? 'border-white/[0.08] hover:border-white/[0.18] bg-white/[0.02] hover:bg-white/[0.08] text-zinc-300 hover:text-white'
                                  : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 shadow-2xs'
                              }`}
                              title="Edit Expense"
                            >
                              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                              <span>Edit</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteExpense(exp)
                              }}
                              className={`h-7.5 px-2.5 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 ${
                                isDark
                                  ? 'border-white/[0.08] hover:border-white/[0.18] bg-white/[0.02] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200'
                                  : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 shadow-2xs'
                              }`}
                              title="Delete Expense"
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
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 5. Expense View Modal (Triggered by Double-Click or View Button) */}
      {viewingExpense && (
        <div
          onClick={() => setViewingExpense(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
              isDark
                ? 'bg-[#151518] border-white/[0.12] text-zinc-100 shadow-black/80'
                : 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-500/20'
            }`}
          >
            {/* Modal Header */}
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-zinc-100 bg-zinc-50/60'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-zinc-100 border-zinc-200'
                }`}>
                  {renderPaymentMethodIcon(viewingExpense.paymentMethod)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-none">
                    Expense Details
                  </h3>
                  <span className="text-[11px] text-zinc-500 mt-1 block font-mono">
                    #{viewingExpense.projectName} • {viewingExpense.date}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const exp = viewingExpense
                    setViewingExpense(null)
                    onEditExpense(exp)
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer inline-flex items-center gap-1.5 ${
                    isDark
                      ? 'border-white/[0.1] hover:bg-white/[0.08] text-zinc-300'
                      : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                  }`}
                  title="Edit this expense"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingExpense(null)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.08] text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                  }`}
                  title="Close modal"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
              {/* Hero Amount & Title Card */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-black/30 border-white/[0.06]' : 'bg-zinc-50 border-zinc-200/80'
              }`}>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                  Total Amount Paid
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-2xl font-extrabold font-mono tracking-tight text-zinc-950 dark:text-white">
                    {formatMoney(Number(viewingExpense.amount))}
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${
                    isDark ? 'bg-white/[0.06] text-zinc-200 border-white/[0.1]' : 'bg-zinc-200 text-zinc-800 border-zinc-300'
                  }`}>
                    {PAYMENT_METHOD_LABELS[viewingExpense.paymentMethod] || viewingExpense.paymentMethod}
                  </span>
                </div>
                <div className="mt-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {viewingExpense.title}
                </div>
              </div>

              {/* Transaction Attributes Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-zinc-50/50 border-zinc-200/70'
                }`}>
                  <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-mono mb-1">
                    Category
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{viewingExpense.category}</span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-zinc-50/50 border-zinc-200/70'
                }`}>
                  <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-mono mb-1">
                    Workspace
                  </span>
                  <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">#{viewingExpense.projectName}</span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-zinc-50/50 border-zinc-200/70'
                }`}>
                  <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-mono mb-1">
                    Date
                  </span>
                  <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">{viewingExpense.date}</span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-zinc-50/50 border-zinc-200/70'
                }`}>
                  <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-mono mb-1">
                    Currency
                  </span>
                  <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">{viewingExpense.currency || 'INR'}</span>
                </div>
              </div>

              {/* Receipt Breakdown & Notes Card */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-zinc-50/50 border-zinc-200/70'
              }`}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Receipt Breakdown & Remarks
                  </span>
                  {viewingExpense.notes && (
                    <span className="text-[10px] font-mono text-zinc-500">
                      {viewingExpense.notes.split('\n').filter((l) => l.trim().length > 0).length} entries
                    </span>
                  )}
                </div>

                {viewingExpense.notes ? (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                    {viewingExpense.notes.split('\n').map((line, idx) => {
                      const trimmed = line.trim()
                      if (!trimmed) return null
                      const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')
                      const cleanContent = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : trimmed

                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs leading-relaxed transition ${
                            isDark
                              ? 'bg-black/30 border-white/[0.05] text-zinc-300'
                              : 'bg-white border-zinc-200/70 text-zinc-800'
                          }`}
                        >
                          <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs shrink-0 select-none mt-0.5">•</span>
                          <span className="flex-1 whitespace-pre-wrap">{cleanContent}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic py-1">
                    No receipt remarks or breakdown notes recorded for this transaction.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-between gap-3 ${
              isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-zinc-100 bg-zinc-50/60'
            }`}>
              <button
                type="button"
                onClick={() => {
                  const exp = viewingExpense
                  setViewingExpense(null)
                  onDeleteExpense(exp)
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer inline-flex items-center gap-1.5 ${
                  isDark
                    ? 'border-white/[0.08] hover:border-red-500/30 bg-white/[0.02] hover:bg-red-500/10 text-zinc-400 hover:text-red-400'
                    : 'border-zinc-200 hover:border-red-300 bg-white hover:bg-red-50 text-zinc-600 hover:text-red-600 shadow-2xs'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const exp = viewingExpense
                    setViewingExpense(null)
                    onEditExpense(exp)
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 ${
                    isDark
                      ? 'bg-white hover:bg-zinc-100 text-zinc-950 border border-white shadow-xs'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-900 shadow-xs'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>Edit Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingExpense(null)}
                  className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                    isDark
                      ? 'bg-white/[0.08] hover:bg-white/[0.14] text-zinc-200 border-white/[0.1]'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200 shadow-2xs'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
    </div>
  )
}
