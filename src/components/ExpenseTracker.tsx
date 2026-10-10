'use client'

import React, { useState, useMemo } from 'react'
import { Expense, PaymentMethod } from '@/types'

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
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#10b981', // Emerald (Theme Primary)
  'Travel & Transport': '#14b8a6', // Teal
  'Software & Subscriptions': '#0ea5e9', // Sky
  'Office Supplies': '#71717a', // Zinc
  'Cloud & Hosting': '#6366f1', // Indigo
  'Marketing & Ads': '#f59e0b', // Subtle Amber
  'Bills & Utilities': '#64748b', // Slate
  'Personal': '#059669', // Deep Emerald
  'Miscellaneous': '#52525b', // Neutral Zinc
}

const FALLBACK_PALETTE = [
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#0ea5e9', // Sky
  '#6366f1', // Indigo
  '#f59e0b', // Subtle Amber
  '#71717a', // Zinc
  '#059669', // Deep Emerald
  '#64748b', // Slate
  '#a1a1aa', // Soft Zinc
]

function getCategoryColor(category: string, index: number): string {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category]
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  UPI: 'UPI',
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

  return (
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
          {/* Manage Categories Button */}
          <button
            onClick={onOpenCategoryManager}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              isDark
                ? 'border-white/[0.08] text-zinc-300 hover:bg-white/[0.06]'
                : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span>Categories</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Spent */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500">
              Total Spent
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono font-medium">
              {stats.count} txns
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono mt-1 text-emerald-500">
            {formatMoney(stats.totalAmount)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {activeMonth === 'ALL' ? 'Total all-time spend' : `Spend for ${formatMonthName(activeMonth)}`}
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
                <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={isDark ? 'stroke-white/[0.06]' : 'stroke-zinc-100'}
                    strokeWidth="12"
                    fill="none"
                  />
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.category}
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={seg.color}
                      strokeWidth="12"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      fill="none"
                      className="transition-all duration-500"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] uppercase font-mono text-zinc-400">Total</span>
                  <span className="text-xs font-bold font-mono">
                    {formatMoney(stats.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <div className="flex-1 w-full space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {donutSegments.map((seg) => (
                  <div
                    key={seg.category}
                    onClick={() => handleCategoryChange(seg.category === activeCategory ? 'ALL' : seg.category)}
                    className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition ${
                      activeCategory === seg.category
                        ? isDark ? 'bg-white/[0.08]' : 'bg-zinc-100'
                        : 'hover:bg-zinc-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="truncate font-medium">{seg.category}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span className="text-zinc-500 text-[11px]">{seg.percentage}%</span>
                      <span className="font-semibold">{formatMoney(seg.amount)}</span>
                    </div>
                  </div>
                ))}
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
              {filteredExpenses.length}
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
            <h3 className="text-sm font-semibold">No expenses found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No transactions match the selected filters or month. Try adjusting your filter or add a new expense.
            </p>
            <button
              onClick={onAddExpense}
              className="mt-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Record First Expense</span>
            </button>
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
                  <div className="font-mono text-xs font-bold text-emerald-500">
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
                        className={`p-3.5 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                          isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50/70'
                        }`}
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
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                                  isDark
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  High
                                </span>
                              )}
                              <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                                isDark
                                  ? 'bg-white/[0.04] text-zinc-300 border-white/[0.08]'
                                  : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                              }`}>
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: getCategoryColor(exp.category, 0) }}
                                />
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
                              <p className="text-[11px] text-zinc-500 line-clamp-1">
                                {exp.notes}
                              </p>
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

                          <div className="flex items-center gap-1">
                            {/* Edit Button */}
                            <button
                              onClick={() => onEditExpense(exp)}
                              className={`p-1.5 rounded-lg border text-zinc-400 hover:text-zinc-200 transition cursor-pointer ${
                                isDark
                                  ? 'border-white/[0.06] hover:bg-white/[0.06]'
                                  : 'border-zinc-200 hover:bg-zinc-100 hover:text-zinc-800'
                              }`}
                              title="Edit Expense"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => onDeleteExpense(exp)}
                              className={`p-1.5 rounded-lg border text-rose-400 hover:text-rose-300 transition cursor-pointer ${
                                isDark
                                  ? 'border-white/[0.06] hover:bg-rose-500/10'
                                  : 'border-zinc-200 hover:bg-rose-50'
                              }`}
                              title="Delete Expense"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
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
    </div>
  )
}
