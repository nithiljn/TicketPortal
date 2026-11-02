'use client'

import React, { useState, useMemo } from 'react'
import { Expense, PaymentMethod, ExpenseSubView, Card } from '@/types'
import { Button } from '@/components/Button'
import { generateExpensePdf } from '@/lib/generateExpensePdf'
import { HighlightText } from '@/components/HighlightText'
import { getCardColorConfig } from '@/components/CreateCardModal'

interface ExpenseTrackerProps {
  expenses: Expense[]
  availableProjects: string[]
  selectedProject: string
  categories: string[]
  availableMonths?: string[]
  onAddExpense: () => void
  onEditExpense: (expense: Expense) => void
  onDeleteExpense: (expense: Expense) => void
  onOpenCategoryManager: () => void
  theme?: 'dark' | 'light'
  // Synced Filter Props from Page / Sidebar
  selectedCategory?: string | 'ALL'
  selectedCategories?: string[]
  onSelectCategory?: (cat: string | 'ALL') => void
  selectedPaymentMethod?: string | 'ALL'
  selectedPaymentMethods?: string[]
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
  onFetchExpenseDetails?: (id: string) => Promise<Expense | null>
  onFetchExpensesForPdf?: () => Promise<Expense[]>
  expenseSubView?: ExpenseSubView
  // Cards & EMI Integration
  cards?: Card[]
  onOpenCardDetail?: (card: Card) => void
  onOpenPayEmi?: (card: Card) => void
  onSwitchToCards?: () => void
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

function formatCardDueNotice(dueDay: number) {
  const today = new Date()
  const currentDay = today.getDate()
  const daysDiff = dueDay - currentDay

  if (daysDiff === 0) {
    return {
      label: 'Due Today',
      color: 'bg-rose-600 text-white border-rose-600 font-medium',
    }
  } else if (daysDiff > 0 && daysDiff <= 7) {
    return {
      label: `Due on ${dueDay}th (in ${daysDiff}d)`,
      color: 'bg-amber-400 text-black border-amber-400 font-medium',
    }
  } else if (daysDiff < 0 && daysDiff >= -5) {
    return {
      label: `Due day passed (${dueDay}th)`,
      color: 'bg-rose-600 text-white border-rose-600 font-medium',
    }
  }
  return {
    label: `Due on ${dueDay}th monthly`,
    color: 'bg-[#080808] text-white border-white/10 font-medium',
  }
}

function formatCompactMoney(val: number) {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
  if (val >= 1000) return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`
  return `₹${Math.round(val)}`
}

export function ExpenseTracker({
  expenses,
  availableProjects,
  selectedProject,
  categories,
  availableMonths: propAvailableMonths,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onOpenCategoryManager,
  theme = 'light',
  selectedCategory: propCategory,
  selectedCategories: propCategories,
  onSelectCategory,
  selectedPaymentMethod: propPaymentMethod,
  selectedPaymentMethods: propPaymentMethods,
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
  onFetchExpenseDetails,
  onFetchExpensesForPdf,
  expenseSubView = 'inbox',
  cards = [],
  onOpenCardDetail,
  onOpenPayEmi,
  onSwitchToCards,
}: ExpenseTrackerProps) {
  const isDark = theme === 'dark'

  // Current Date helpers
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Filters State - sync with props if provided, otherwise internal fallback
  const [internalMonth, setInternalMonth] = useState<string>(currentMonthKey)
  const [internalCategories, setInternalCategories] = useState<string[]>([])
  const [internalPaymentMethods, setInternalPaymentMethods] = useState<string[]>([])
  const [internalHighExpense, setInternalHighExpense] = useState<boolean>(false)
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null)
  const [isLoadingViewingNotes, setIsLoadingViewingNotes] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [hoveredOutflowMonth, setHoveredOutflowMonth] = useState<string | null>(null)

  const handleOpenViewExpense = async (exp: Expense) => {
    setViewingExpense(exp)
    if (exp.notes === undefined || exp.notes === null) {
      if (onFetchExpenseDetails) {
        setIsLoadingViewingNotes(true)
        try {
          const full = await onFetchExpenseDetails(exp.id)
          if (full) {
            setViewingExpense((prev) =>
              prev && prev.id === exp.id ? { ...prev, notes: full.notes } : prev
            )
          }
        } finally {
          setIsLoadingViewingNotes(false)
        }
      }
    }
  }

  const activeMonth = propMonth !== undefined ? propMonth : internalMonth
  const handleMonthChange = (m: string) => {
    setInternalMonth(m)
    if (onSelectMonth) onSelectMonth(m)
  }

  const activeCategories: string[] = useMemo(() => {
    if (propCategories !== undefined) return propCategories
    if (propCategory && propCategory !== 'ALL') return [propCategory]
    return internalCategories
  }, [propCategories, propCategory, internalCategories])

  const activePaymentMethods: string[] = useMemo(() => {
    if (propPaymentMethods !== undefined) return propPaymentMethods
    if (propPaymentMethod && propPaymentMethod !== 'ALL') return [propPaymentMethod]
    return internalPaymentMethods
  }, [propPaymentMethods, propPaymentMethod, internalPaymentMethods])

  const handleCategoryChange = (c: string | 'ALL') => {
    if (onSelectCategory) {
      onSelectCategory(c)
    } else {
      if (c === 'ALL') {
        setInternalCategories([])
      } else {
        setInternalCategories((prev) =>
          prev.some((cat) => cat.toLowerCase() === c.toLowerCase())
            ? prev.filter((cat) => cat.toLowerCase() !== c.toLowerCase())
            : [...prev, c]
        )
      }
    }
  }

  const handlePaymentMethodChange = (pm: string | 'ALL') => {
    if (onSelectPaymentMethod) {
      onSelectPaymentMethod(pm)
    } else {
      if (pm === 'ALL') {
        setInternalPaymentMethods([])
      } else {
        const upper = pm.toUpperCase()
        setInternalPaymentMethods((prev) =>
          prev.includes(upper) ? prev.filter((p) => p !== upper) : [...prev, upper]
        )
      }
    }
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
    activeCategories.length +
    activePaymentMethods.length +
    (Boolean(minAmount || maxAmount) ? 1 : 0) +
    (Boolean(searchQuery && searchQuery.trim()) ? 1 : 0)

  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc')

  // Generate available months from server/prop list + actual expense dates + current month
  const availableMonths = useMemo(() => {
    const set = new Set<string>(propAvailableMonths || [])
    set.add(currentMonthKey)
    expenses.forEach((e) => {
      if (e.date && e.date.length >= 7) {
        set.add(e.date.slice(0, 7))
      }
    })
    return Array.from(set).sort().reverse()
  }, [propAvailableMonths, expenses, currentMonthKey])

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

    // 3. Category Filter (multi-select)
    if (activeCategories.length > 0) {
      const lower = activeCategories.map((c) => c.toLowerCase())
      result = result.filter((e) => lower.includes((e.category || '').toLowerCase()))
    }

    // 4. Payment Method Filter (multi-select)
    if (activePaymentMethods.length > 0) {
      const upper = activePaymentMethods.map((m) => m.toUpperCase())
      result = result.filter((e) => upper.includes((e.paymentMethod || '').toUpperCase()))
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

    // 6. Search Query (title only)
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((e) => (e.title || '').toLowerCase().includes(q))
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
    activeCategories,
    activePaymentMethods,
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

  const dailyMaxSpend = useMemo(() => {
    return Math.max(...dailySpendData.map((d) => d.amount), 100)
  }, [dailySpendData])

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

  // Workspace-filtered Cards
  const relevantCards = useMemo(() => {
    if (!cards || cards.length === 0) return []
    if (selectedProject === 'ALL') return cards
    return cards.filter(
      (c) => (c.projectName || 'General').toLowerCase() === selectedProject.toLowerCase()
    )
  }, [cards, selectedProject])

  // Active cards (unpaid EMIs remaining)
  const activeCards = useMemo(() => {
    return relevantCards.filter((c) => c.isActive !== false && (c.paidEmis ?? 0) < c.totalEmis)
  }, [relevantCards])

  // Completed cards
  const completedCards = useMemo(() => {
    return relevantCards.filter((c) => (c.paidEmis ?? 0) >= c.totalEmis)
  }, [relevantCards])

  // EMI Summary Stats
  const emiStats = useMemo(() => {
    const totalMonthlyCommitment = activeCards.reduce((sum, c) => sum + Number(c.monthlyEmi || 0), 0)
    const totalRemainingDebt = activeCards.reduce(
      (sum, c) => sum + (c.totalEmis - (c.paidEmis ?? 0)) * Number(c.monthlyEmi || 0),
      0
    )
    const totalPaidSoFar = relevantCards.reduce(
      (sum, c) => sum + (c.paidEmis ?? 0) * Number(c.monthlyEmi || 0),
      0
    )
    const totalOriginalDebt = totalRemainingDebt + totalPaidSoFar
    const overallPayoffProgress = totalOriginalDebt > 0 ? Math.round((totalPaidSoFar / totalOriginalDebt) * 100) : 100

    const totalCardLimit = relevantCards.reduce((sum, c) => sum + Number(c.cardLimit || 0), 0)
    const totalLimitUsed = relevantCards.reduce((sum, c) => sum + Number(c.cardLimitUsed || 0), 0)
    const totalAvailableLimit = Math.max(0, totalCardLimit - totalLimitUsed)

    return {
      totalMonthlyCommitment,
      totalRemainingDebt,
      totalPaidSoFar,
      totalOriginalDebt,
      overallPayoffProgress,
      totalCardLimit,
      totalLimitUsed,
      totalAvailableLimit,
      activeCount: activeCards.length,
      completedCount: completedCards.length,
      totalCount: relevantCards.length,
    }
  }, [relevantCards, activeCards, completedCards])

  // Selected Month EMI Commitment
  const selectedMonthEmiCommitment = useMemo(() => {
    if (activeMonth === 'ALL') return emiStats.totalMonthlyCommitment
    let sum = 0
    relevantCards.forEach((c) => {
      const startKey = (c.startDate || '').slice(0, 7)
      if (startKey && activeMonth >= startKey) {
        const [sYear, sMonth] = startKey.split('-').map(Number)
        const [cYear, cMonth] = activeMonth.split('-').map(Number)
        const diffMonths = (cYear - sYear) * 12 + (cMonth - sMonth)
        if (diffMonths >= 0 && diffMonths < c.totalEmis) {
          sum += Number(c.monthlyEmi) || 0
        }
      } else if (!startKey && activeMonth === currentMonthKey && (c.paidEmis ?? 0) < c.totalEmis) {
        sum += Number(c.monthlyEmi) || 0
      }
    })
    return sum
  }, [activeMonth, relevantCards, emiStats.totalMonthlyCommitment, currentMonthKey])

  // Combined Monthly Outflow (Direct Spend + Month EMI Commitment)
  const combinedMonthlyOutflow = stats.totalAmount + selectedMonthEmiCommitment

  // Monthly Outflow 6-Month Comparative Trend (Direct Spend vs Monthly EMI)
  const monthlyOutflowTrend = useMemo(() => {
    const list: {
      key: string
      label: string
      direct: number
      emi: number
      total: number
      directPct: number
      emiPct: number
    }[] = []

    const today = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'short' })

      const direct = expenses
        .filter((e) => {
          if (!e.date || !e.date.startsWith(key)) return false
          if (selectedProject !== 'ALL') {
            return (e.projectName || 'General').toLowerCase() === selectedProject.toLowerCase()
          }
          return true
        })
        .reduce((sum, e) => sum + Number(e.amount), 0)

      let emi = 0
      relevantCards.forEach((c) => {
        const startKey = (c.startDate || '').slice(0, 7)
        if (startKey && key >= startKey) {
          const [sYear, sMonth] = startKey.split('-').map(Number)
          const [cYear, cMonth] = key.split('-').map(Number)
          const diffMonths = (cYear - sYear) * 12 + (cMonth - sMonth)
          if (diffMonths >= 0 && diffMonths < c.totalEmis) {
            emi += Number(c.monthlyEmi) || 0
          }
        } else if (!startKey && key === currentMonthKey && (c.paidEmis ?? 0) < c.totalEmis) {
          emi += Number(c.monthlyEmi) || 0
        }
      })

      list.push({
        key,
        label,
        direct,
        emi,
        total: direct + emi,
        directPct: 0,
        emiPct: 0,
      })
    }

    const maxMonthTotal = Math.max(...list.map((m) => m.total), 1)
    return list.map((m) => ({
      ...m,
      directPct: Math.round((m.direct / maxMonthTotal) * 100),
      emiPct: Math.round((m.emi / maxMonthTotal) * 100),
    }))
  }, [expenses, relevantCards, selectedProject, currentMonthKey])

  // Payment Channels & Outflow Allocation
  const channelBreakdown = useMemo(() => {
    const directTotal = stats.totalAmount
    const emiTotal = selectedMonthEmiCommitment
    const grandTotal = directTotal + emiTotal

    if (grandTotal === 0) return []

    const items: { id: string; label: string; amount: number; color: string; icon: string }[] = []

    if (emiTotal > 0) {
      items.push({
        id: 'EMI',
        label: 'Active EMIs (Commitment)',
        amount: emiTotal,
        color: '#6366f1', // Indigo
        icon: 'CREDIT_CARD',
      })
    }

    const pmTotals: Record<string, number> = {}
    filteredExpenses.forEach((e) => {
      const m = (e.paymentMethod || 'OTHER').toUpperCase()
      pmTotals[m] = (pmTotals[m] || 0) + Number(e.amount)
    })

    const pmColors: Record<string, string> = {
      UPI: '#10b981', // Emerald
      CREDIT_CARD: '#0071e3', // Apple Blue
      DEBIT_CARD: '#06b6d4', // Cyan
      CASH: '#f59e0b', // Amber
      NET_BANKING: '#8b5cf6', // Violet
      OTHER: '#94a3b8', // Slate
    }

    Object.entries(pmTotals).forEach(([method, amt]) => {
      if (amt > 0) {
        items.push({
          id: method,
          label: PAYMENT_METHOD_LABELS[method] || method,
          amount: amt,
          color: pmColors[method] || '#94a3b8',
          icon: method,
        })
      }
    })

    items.sort((a, b) => b.amount - a.amount)

    return items.map((item) => ({
      ...item,
      percentage: Math.round((item.amount / grandTotal) * 100),
    }))
  }, [stats.totalAmount, selectedMonthEmiCommitment, filteredExpenses])

  // Upcoming EMIs this month (sorted by urgency)
  const upcomingEmisThisMonth = useMemo(() => {
    const today = new Date()
    const currentDay = today.getDate()

    return [...activeCards].sort((a, b) => {
      const diffA = a.emiDueDay - currentDay
      const diffB = b.emiDueDay - currentDay
      const scoreA = diffA === 0 ? -1000 : diffA > 0 ? diffA : 100 + diffA
      const scoreB = diffB === 0 ? -1000 : diffB > 0 ? diffB : 100 + diffB
      return scoreA - scoreB
    })
  }, [activeCards])

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
      let expensesForPdf = filteredExpenses

      // Fetch full details with notes if needed for PDF export
      if (onFetchExpensesForPdf) {
        const fullServerExpenses = await onFetchExpensesForPdf()
        if (fullServerExpenses && fullServerExpenses.length > 0) {
          const notesMap = new Map(fullServerExpenses.map((e) => [e.id, e.notes]))
          expensesForPdf = filteredExpenses.map((e) => ({
            ...e,
            notes: notesMap.get(e.id) !== undefined ? notesMap.get(e.id) : e.notes,
          }))
        }
      }

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
        expenses: expensesForPdf,
        activeMonth,
        selectedProject,
        activeCategory: activeCategories.length === 1 ? activeCategories[0] : activeCategories.length === 0 ? 'ALL' : activeCategories.join(', '),
        activePaymentMethod: activePaymentMethods.length === 1 ? activePaymentMethods[0] : activePaymentMethods.length === 0 ? 'ALL' : activePaymentMethods.join(', '),
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

  // Apple Design System Surface & Card Tokens (DESIGN.md)
  const cardBg = isDark
    ? 'bg-[#1c1c1e] border-white/[0.08] text-white shadow-xs'
    : 'bg-white border-[#e5e5ea] text-[#1d1d1f] shadow-xs'
  const filterBtnBg = isDark
    ? 'bg-[#1c1c1e] border-white/[0.1] text-[#f5f5f7]'
    : 'bg-white border-[#e5e5ea] text-[#1d1d1f] shadow-xs'
  const subHeaderBorder = isDark
    ? 'border-white/[0.08] bg-[#000000]/80 backdrop-blur-md'
    : 'border-[#e5e5ea] bg-white/80 backdrop-blur-md'
  const subHeaderTitle = isDark ? 'text-white font-semibold' : 'text-[#1d1d1f] font-semibold'
  const appleCapsule = isDark
    ? 'bg-white/[0.08] border-white/[0.08] text-[#f5f5f7]'
    : 'bg-[#f5f5f7] border-black/[0.06] text-[#1d1d1f]'
  const progressTrack = isDark ? 'bg-white/[0.08]' : 'bg-[#e5e5ea]'
  const appleGhostBtn = isDark
    ? 'border-white/[0.1] hover:border-white/[0.2] bg-white/[0.04] hover:bg-white/[0.08] text-white'
    : 'border-[#e5e5ea] hover:border-[#d2d2d7] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] shadow-xs'
  const appleActionBtn = isDark
    ? 'border-white/[0.08] hover:border-white/[0.18] bg-white/[0.04] hover:bg-white/[0.08] text-[#f5f5f7]'
    : 'border-[#e5e5ea] hover:border-[#d2d2d7] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] shadow-2xs'
  const appleDeleteBtn = isDark
    ? 'border-white/[0.1] hover:border-rose-600 bg-white/[0.04] hover:bg-rose-600 text-zinc-400 hover:text-white transition-all duration-150'
    : 'border-black/[0.12] hover:border-rose-600 bg-white hover:bg-rose-600 text-zinc-600 hover:text-white shadow-2xs transition-all duration-150'

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-[#f5f5f7] dark:bg-[#000000] font-sans">
      {/* Sub-header inside view (Matches InboxTable filtration bar) */}
      <div className={`sticky top-0 z-20 px-4 sm:px-6 py-2.5 sm:py-3 border-b flex items-center justify-between text-xs shrink-0 ${subHeaderBorder}`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={subHeaderTitle}>
            {selectedProject === 'ALL' ? 'All Workspaces' : selectedProject}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-normal border transition-colors ${
              isDark
                ? 'bg-white/[0.06] text-[#ebebf5]/70 border-white/[0.08]'
                : 'bg-black/[0.04] text-[#1d1d1f]/70 border-black/[0.06]'
            }`}
          >
            <span className="font-mono font-medium">{filteredExpenses.length}</span>
            <span className={isDark ? 'text-[#ebebf5]/40 text-[11px]' : 'text-[#1d1d1f]/40 text-[11px]'}>
              {filteredExpenses.length === 1 ? 'item' : 'items'}
            </span>
          </span>

          {/* Active Workspace Filter Chip */}
          {selectedProject !== 'ALL' && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-normal border ${appleCapsule}`}
            >
              <span className="text-[#86868b] dark:text-[#a1a1a6] text-[11px]">Workspace:</span>
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{selectedProject}</span>
              {onSelectWorkspace && (
                <button
                  type="button"
                  onClick={handleClearWorkspace}
                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-60 cursor-pointer ml-0.5"
                  title="Reset to All Workspaces"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-normal border ${appleCapsule}`}
            >
              <span className="text-[#86868b] dark:text-[#a1a1a6] text-[11px]">Month:</span>
              <span>{formatMonthName(activeMonth)}</span>
              <button
                type="button"
                onClick={handleClearMonth}
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-60 cursor-pointer ml-0.5"
                title="Reset to All Time"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          )}

          {/* Active Category Filter Chips (Multi-select) */}
          {activeCategories.map((cat) => (
            <span
              key={cat}
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-normal border ${appleCapsule}`}
            >
              <span className="text-[#86868b] dark:text-[#a1a1a6] text-[11px]">Category:</span>
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{cat}</span>
              <button
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-60 cursor-pointer ml-0.5"
                title={`Remove ${cat} filter`}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}

          {/* Active Payment Method Filter Chips (Multi-select) */}
          {activePaymentMethods.map((pm) => (
            <span
              key={pm}
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-normal border ${appleCapsule}`}
            >
              <span className="text-[#86868b] dark:text-[#a1a1a6] text-[11px]">Payment:</span>
              <span>{PAYMENT_METHOD_LABELS[pm] || pm}</span>
              <button
                type="button"
                onClick={() => handlePaymentMethodChange(pm)}
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-60 cursor-pointer ml-0.5"
                title={`Remove ${PAYMENT_METHOD_LABELS[pm] || pm} filter`}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}

          {/* Active Amount Range Filter Chip */}
          {(minAmount || maxAmount) && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-normal border ${appleCapsule}`}
            >
              <span className="text-[#86868b] dark:text-[#a1a1a6] text-[11px]">Amount:</span>
              <span>
                {minAmount && maxAmount
                  ? `₹${minAmount} - ₹${maxAmount}`
                  : minAmount
                  ? `≥ ₹${minAmount}`
                  : `≤ ₹${maxAmount}`}
              </span>
              <button
                type="button"
                onClick={handleClearAmount}
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-60 cursor-pointer ml-0.5"
                title="Remove amount range filter"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          )}

          {/* Active Search Query Filter Chip */}
          {searchQuery && searchQuery.trim() && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-normal border ${appleCapsule}`}
            >
              <span className="text-[#86868b] dark:text-[#a1a1a6] text-[11px]">Search:</span>
              <span className="truncate max-w-[140px] sm:max-w-[200px]">&quot;{searchQuery.trim()}&quot;</span>
              <button
                type="button"
                onClick={handleClearSearch}
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-60 cursor-pointer ml-0.5"
                title="Clear search query"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              className={`text-[11px] font-normal transition cursor-pointer underline ml-1 ${
                isDark ? 'text-[#86868b] hover:text-white' : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Right side: Filtered Spend Summary */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-[#86868b] dark:text-[#a1a1a6]">Filtered Total:</span>
          <span className="font-semibold text-xs text-[#1d1d1f] dark:text-white">
            {formatMoney(stats.totalAmount)}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
        {/* 1. Header & Actions Bar (Apple Style) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-base shrink-0 border ${
                isDark
                  ? 'bg-[#0071e3] border-white/[0.1] text-white shadow-xs'
                  : 'bg-[#0071e3] border-black/[0.08] text-white shadow-xs'
              }`}>
                ₹
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white truncate">
                  Expense Tracker
                </h1>
                <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] truncate mt-0.5">
                  Monitor spending, manage categories and review daily expenditure
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Quick Month Filter Selector */}
            <div className="relative inline-flex items-center">
              <select
                value={activeMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className={`h-8.5 pl-4 pr-8 rounded-full border text-xs font-medium focus:outline-none cursor-pointer transition active:scale-95 appearance-none ${filterBtnBg}`}
                title="Filter expenses by month"
              >
                <option value="ALL" className={isDark ? 'bg-[#1c1c1e] text-white' : 'bg-white text-zinc-900'}>
                  All Time
                </option>
                {availableMonths.map((m) => (
                  <option key={m} value={m} className={isDark ? 'bg-[#1c1c1e] text-white' : 'bg-white text-zinc-900'}>
                    {formatMonthName(m)}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 flex items-center text-[#86868b]">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            {/* Download PDF Report Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || filteredExpenses.length === 0}
              className={`h-8.5 px-3.5 rounded-full border text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer inline-flex items-center gap-1.5 ${appleGhostBtn} disabled:opacity-50`}
              title={
                filteredExpenses.length === 0
                  ? 'No expenses to export'
                  : `Download ${activeMonth !== 'ALL' ? formatMonthName(activeMonth) : 'current'} expense report as PDF`
              }
            >
              {isGeneratingPdf ? (
                <svg className="w-3.5 h-3.5 animate-spin text-[#86868b] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="16" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-[#86868b] dark:text-[#a1a1a6] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
              <span className="hidden min-[480px]:inline">{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
              <span className="min-[480px]:hidden">{isGeneratingPdf ? 'PDF...' : 'PDF'}</span>
            </button>

            {/* Manage Categories Button */}
            <button
              type="button"
              onClick={onOpenCategoryManager}
              className={`h-8.5 px-3.5 rounded-full border text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer inline-flex items-center gap-1.5 ${appleGhostBtn}`}
            >
              <svg className="w-3.5 h-3.5 text-[#86868b] dark:text-[#a1a1a6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span>Categories</span>
            </button>
          </div>
        </div>

        {/* 2 & 3. Executive Dashboard: Outflow, Commitments, Analytics & EMI Payoff Tracker */}
        {expenseSubView === 'dashboard' && (
          <div className="space-y-6 sm:space-y-8">
            {/* 1. Primary Financial Health & Outflow Overview Cards (Apple Utility Cards Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Card 1: Combined Monthly Outflow */}
              <div className={`p-5 sm:p-6 rounded-[20px] border transition-all duration-200 ${cardBg}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6] truncate">
                    Total Monthly Outflow
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border shrink-0 ${appleCapsule}`}>
                    Direct + EMI
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white mt-2.5 truncate">
                  {formatMoney(combinedMonthlyOutflow)}
                </div>
                <div className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-1.5 truncate">
                  {formatMoney(stats.totalAmount)} spend + {formatMoney(selectedMonthEmiCommitment)} EMI
                </div>
              </div>

              {/* Card 2: Active Monthly EMI Commitment */}
              <div className={`p-5 sm:p-6 rounded-[20px] border transition-all duration-200 ${cardBg}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6] truncate">
                    Active EMI Commitment
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border shrink-0 ${appleCapsule}`}>
                    {emiStats.activeCount} {emiStats.activeCount === 1 ? 'plan' : 'plans'}
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white mt-2.5 truncate">
                  {formatMoney(selectedMonthEmiCommitment)}
                </div>
                <div className="flex items-center justify-between text-xs text-[#86868b] dark:text-[#a1a1a6] mt-1.5 truncate">
                  <span>Monthly auto-debit</span>
                  {onSwitchToCards && (
                    <button
                      type="button"
                      onClick={onSwitchToCards}
                      className="text-[#0071e3] hover:underline cursor-pointer font-medium ml-1"
                    >
                      Cards & EMI →
                    </button>
                  )}
                </div>
              </div>

              {/* Card 3: Total Outstanding EMI Liability */}
              <div className={`p-5 sm:p-6 rounded-[20px] border transition-all duration-200 ${cardBg}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6] truncate">
                    Total EMI Debt
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border shrink-0 ${appleCapsule}`}>
                    {emiStats.overallPayoffProgress}% paid
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white mt-2.5 truncate">
                  {formatMoney(emiStats.totalRemainingDebt)}
                </div>
                {/* Mini Payoff Bar */}
                <div className={`w-full h-1.5 ${progressTrack} rounded-full overflow-hidden mt-2`}>
                  <div
                    className="h-full bg-gradient-to-r from-[#0071e3] to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(4, emiStats.overallPayoffProgress))}%` }}
                  />
                </div>
                <div className="text-[11px] text-[#86868b] dark:text-[#a1a1a6] mt-1.5 truncate">
                  {formatMoney(emiStats.totalPaidSoFar)} cleared so far
                </div>
              </div>

              {/* Card 4: Direct Flexible Spend */}
              <div className={`p-5 sm:p-6 rounded-[20px] border transition-all duration-200 ${cardBg}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6] truncate">
                    Direct Expenses
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border shrink-0 ${appleCapsule}`}>
                    {stats.count} {stats.count === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white mt-2.5 truncate">
                  {formatMoney(stats.totalAmount)}
                </div>
                <div className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-1.5 truncate">
                  Avg {formatMoney(stats.dailyAverage)}/day • Today: {formatMoney(stats.todayAmount)}
                </div>
              </div>
            </div>

            {/* 2. Visual Analytics Row 1: Category Donut + Multi-Month Outflow Comparison (Direct vs EMI) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* Left: Category Circular Donut Chart */}
              <div className={`p-6 rounded-[20px] border transition-all duration-200 ${cardBg}`}>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-inherit">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
                      Category Distribution
                    </h3>
                    <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-0.5">
                      Breakdown of direct spending across categories
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border shrink-0 ${appleCapsule}`}>
                    {donutSegments.length} categories
                  </span>
                </div>

                {donutSegments.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-zinc-500 text-xs">
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
                            activeCategories.some((c) => c.toLowerCase() === seg.category.toLowerCase())
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
                              onClick={() => handleCategoryChange(seg.category)}
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
                        const isSelected = activeCategories.some(
                          (c) => c.toLowerCase() === seg.category.toLowerCase()
                        )

                        return (
                          <div
                            key={seg.category}
                            onMouseEnter={() => setHoveredCategory(seg.category)}
                            onClick={() => handleCategoryChange(seg.category)}
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

              {/* Right: Monthly Outflow Comparison: Direct Spend vs Card EMIs */}
              <div className={`p-6 rounded-[20px] border transition-all duration-200 ${cardBg}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-inherit">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
                      Monthly Outflow: Spend vs EMI
                    </h3>
                    <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-0.5">
                      Direct flexible expenses vs fixed credit EMI commitments
                    </p>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                      <span className="text-[#86868b] dark:text-[#a1a1a6]">Direct</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
                      <span className="text-[#86868b] dark:text-[#a1a1a6]">Card EMI</span>
                    </div>
                  </div>
                </div>

                {monthlyOutflowTrend.every((m) => m.total === 0) ? (
                  <div className="h-56 flex flex-col items-center justify-center text-zinc-500 text-xs">
                    <span>No historical outflow data to display</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar -mx-1 px-1">
                    <div className="h-56 flex items-end justify-between gap-3 pt-16 pb-2 px-3 min-w-[340px] relative">
                      {monthlyOutflowTrend.map((m, idx) => {
                        const isCurrent = m.key === currentMonthKey
                        const isSelected = activeMonth === m.key
                        const isHovered = hoveredOutflowMonth === m.key

                        return (
                          <div
                            key={m.key}
                            className="flex-1 min-w-[42px] flex flex-col items-center gap-1.5 h-full justify-end group relative cursor-pointer"
                            onMouseEnter={() => setHoveredOutflowMonth(m.key)}
                            onMouseLeave={() => setHoveredOutflowMonth(null)}
                            onClick={() => handleMonthChange(m.key)}
                          >
                            {/* Hover Tooltip - Positioned within container headroom to prevent clipping */}
                            {isHovered && (
                              <div
                                className={`absolute top-1 z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-100 ${
                                  idx === 0
                                    ? 'left-0'
                                    : idx === monthlyOutflowTrend.length - 1
                                    ? 'right-0'
                                    : 'left-1/2 -translate-x-1/2'
                                }`}
                              >
                                <div className="px-3 py-1.5 rounded-xl bg-[#1c1c1e] text-white dark:bg-[#252528] text-xs font-medium shadow-2xl border border-white/10 dark:border-white/15 flex flex-col items-center whitespace-nowrap">
                                  <div className="flex items-center gap-2 font-semibold text-[11px] text-zinc-100">
                                    <span>{formatMonthName(m.key)}</span>
                                    <span className="text-zinc-500">•</span>
                                    <span className="font-mono text-white">Total: {formatMoney(m.total)}</span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 font-mono text-[10px]">
                                    <span className="flex items-center gap-1.5 text-emerald-400">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      Spend: {formatMoney(m.direct)}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-indigo-400">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                      EMI: {formatMoney(m.emi)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Twin Bars (Direct vs EMI) */}
                            <div className="w-full flex items-end justify-center gap-1.5 h-full pb-1">
                              {/* Direct Spend Bar */}
                              <div
                                className={`w-3 sm:w-3.5 ${progressTrack} rounded-full flex items-end h-full overflow-hidden`}
                                title={`Direct Spend: ${formatMoney(m.direct)}`}
                              >
                                <div
                                  className="w-full bg-[#10b981] hover:bg-[#059669] rounded-full transition-all duration-300"
                                  style={{ height: `${Math.max(6, m.directPct)}%` }}
                                />
                              </div>
                              {/* EMI Commitment Bar */}
                              <div
                                className={`w-3 sm:w-3.5 ${progressTrack} rounded-full flex items-end h-full overflow-hidden`}
                                title={`EMI Commitment: ${formatMoney(m.emi)}`}
                              >
                                <div
                                  className="w-full bg-[#6366f1] hover:bg-[#4f46e5] rounded-full transition-all duration-300"
                                  style={{ height: `${Math.max(6, m.emiPct)}%` }}
                                />
                              </div>
                            </div>

                            {/* Month Label & Total Indicator */}
                            <div className="flex flex-col items-center">
                              <span
                                className={`text-[11px] truncate max-w-full transition-colors ${
                                  isSelected || isCurrent
                                    ? 'font-bold text-[#0071e3] dark:text-[#2997ff]'
                                    : 'font-medium text-[#86868b] dark:text-[#a1a1a6]'
                                }`}
                              >
                                {m.label}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-400 truncate">
                                {m.total >= 1000 ? `₹${(m.total / 1000).toFixed(0)}k` : `₹${m.total}`}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Visual Analytics Row 2: Daily Rhythm Trend + Payment Channels & Outflow Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* Left: Daily Spending Rhythm */}
              <div className={`p-6 rounded-[20px] border transition-all duration-200 ${cardBg}`}>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-inherit">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
                      Daily Spending Trend
                    </h3>
                    <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-0.5">
                      Day-by-day flexible spending pattern
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border shrink-0 ${appleCapsule}`}>
                    Recent Activity
                  </span>
                </div>

                {dailySpendData.length === 0 ? (
                  <div className="h-60 flex flex-col items-center justify-center text-[#86868b] dark:text-[#a1a1a6] text-xs">
                    <span>No daily spend trend to display</span>
                  </div>
                ) : (
                  <div className="relative flex items-stretch h-64 select-none pt-8 pb-1">
                    {/* Y-Axis Column */}
                    <div className="w-12 sm:w-14 shrink-0 flex flex-col justify-between text-right pr-2 pb-6 text-[10px] font-mono text-[#86868b] dark:text-[#a1a1a6] border-r border-zinc-200/80 dark:border-white/10 select-none">
                      <span className="truncate">{formatCompactMoney(dailyMaxSpend)}</span>
                      <span className="truncate">{formatCompactMoney(dailyMaxSpend * 0.66)}</span>
                      <span className="truncate">{formatCompactMoney(dailyMaxSpend * 0.33)}</span>
                      <span>₹0</span>
                    </div>

                    {/* Plot Area */}
                    <div className="relative flex-1 h-full min-w-0">
                      {/* Horizontal Gridlines & Baseline */}
                      <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none z-0">
                        <div className="w-full border-b border-dashed border-zinc-200/70 dark:border-white/5" />
                        <div className="w-full border-b border-dashed border-zinc-200/70 dark:border-white/5" />
                        <div className="w-full border-b border-dashed border-zinc-200/70 dark:border-white/5" />
                        <div className="w-full border-b border-zinc-300/80 dark:border-white/15" /> {/* Baseline */}
                      </div>

                      {/* Tubes Row with X-Axis */}
                      <div
                        className={`relative z-10 h-full flex items-end ${
                          dailySpendData.length <= 4
                            ? 'justify-around'
                            : 'justify-between sm:justify-around'
                        } px-3 overflow-x-auto custom-scrollbar gap-2 sm:gap-4`}
                      >
                        {dailySpendData.map((d) => (
                          <div
                            key={d.date}
                            className="group relative flex flex-col items-center h-full justify-end shrink-0 min-w-[40px] pb-0.5"
                          >
                            {/* Hover Tooltip Popover */}
                            <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 z-50 pointer-events-none">
                              <div className="px-2.5 py-1.5 rounded-xl bg-[#1c1c1e] text-white dark:bg-[#252528] text-[11px] shadow-2xl border border-white/15 dark:border-white/20 whitespace-nowrap flex flex-col items-center">
                                <span className="font-mono font-bold text-emerald-400 text-xs">
                                  {formatMoney(d.amount)}
                                </span>
                                <span className="text-[9px] text-zinc-400 font-mono mt-0.5">
                                  {d.percentage}% peak day
                                </span>
                                {/* Downward Arrow Triangle */}
                                <div className="w-2 h-2 bg-[#1c1c1e] dark:bg-[#252528] rotate-45 border-r border-b border-white/15 dark:border-white/20 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                              </div>
                            </div>

                            {/* Liquid Tube Container */}
                            <div className="flex flex-col items-center mb-1">
                              {/* Top Glass Rim / Flange */}
                              <div className="w-9 sm:w-10 h-1 rounded-full bg-zinc-300/80 dark:bg-white/25 border border-zinc-400/40 dark:border-white/30 shadow-xs z-20 mb-[-1px]" />

                              {/* Glass Cylinder Body */}
                              <div className="relative w-8 sm:w-9 h-[150px] rounded-b-full border-x-2 border-b-2 border-zinc-300/80 dark:border-white/20 bg-zinc-100/50 dark:bg-white/[0.04] backdrop-blur-[2px] shadow-inner overflow-hidden flex flex-col justify-end group-hover:border-emerald-500/70 group-hover:shadow-[0_0_16px_rgba(16,185,129,0.3)] transition-all duration-300">
                                {/* Left Glass Sheen Highlight */}
                                <div className="absolute left-1 top-1 bottom-3 w-[2px] rounded-full bg-gradient-to-b from-white/70 via-white/25 to-transparent pointer-events-none z-30" />

                                {/* Glass Measurement Ticks (Graduations) */}
                                <div className="absolute right-0 top-[25%] w-1.5 border-t border-zinc-400/50 dark:border-white/30 pointer-events-none z-30" />
                                <div className="absolute right-0 top-[50%] w-2 border-t border-zinc-400/60 dark:border-white/40 pointer-events-none z-30" />
                                <div className="absolute right-0 top-[75%] w-1.5 border-t border-zinc-400/50 dark:border-white/30 pointer-events-none z-30" />

                                {/* Fluid / Water Fill */}
                                <div
                                  className="relative w-full rounded-b-full overflow-hidden transition-[height] duration-700 ease-out flex flex-col justify-end"
                                  style={{
                                    height: `${d.amount > 0 ? Math.max(12, d.percentage) : 3}%`,
                                  }}
                                >
                                  {/* Water Column Gradient */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400 dark:from-emerald-700 dark:via-teal-500/90 dark:to-emerald-400" />

                                  {/* Animated Water Surface Slosh Wave */}
                                  {d.amount > 0 && (
                                    <div className="absolute top-0 inset-x-0 h-3 -translate-y-1 overflow-hidden pointer-events-none animate-liquidSway">
                                      {/* Wave Layer 1 (Front wave) */}
                                      <svg
                                        className="absolute top-0 left-0 w-[200%] h-full fill-teal-100/70 dark:fill-teal-200/60 animate-liquidWaveFront pointer-events-none"
                                        viewBox="0 0 200 20"
                                        preserveAspectRatio="none"
                                      >
                                        <path d="M0,10 Q25,3 50,10 T100,10 Q125,3 150,10 T200,10 L200,20 L0,20 Z" />
                                      </svg>
                                      {/* Wave Layer 2 (Back wave) */}
                                      <svg
                                        className="absolute top-0 left-0 w-[200%] h-full fill-emerald-200/50 dark:fill-emerald-300/40 animate-liquidWaveBack pointer-events-none"
                                        viewBox="0 0 200 20"
                                        preserveAspectRatio="none"
                                      >
                                        <path d="M0,10 Q25,17 50,10 T100,10 Q125,17 150,10 T200,10 L200,20 L0,20 Z" />
                                      </svg>
                                    </div>
                                  )}

                                  {/* Floating Bubbles */}
                                  {d.amount > 0 && (
                                    <>
                                      <div className="absolute bottom-1 left-1.5 w-1.5 h-1.5 rounded-full bg-white/70 animate-liquidBubble1 pointer-events-none" />
                                      <div className="absolute bottom-3 right-1.5 w-1 h-1 rounded-full bg-white/60 animate-liquidBubble2 pointer-events-none" />
                                      <div className="absolute bottom-2 left-3 w-1 h-1 rounded-full bg-white/50 animate-liquidBubble3 pointer-events-none" />
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* X-Axis Tick Notch & Date Label */}
                            <div className="flex flex-col items-center">
                              <div className="w-0.5 h-1 bg-zinc-300 dark:bg-white/20 mb-1 group-hover:bg-emerald-400 transition-colors" />
                              <span className="text-[10px] text-[#86868b] dark:text-[#a1a1a6] font-mono group-hover:text-emerald-500 dark:group-hover:text-emerald-400 font-medium transition-colors">
                                {d.displayDate}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Payment Channels & Outflow Allocation */}
              <div className={`p-6 rounded-[20px] border transition-all duration-200 ${cardBg}`}>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-inherit">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
                      Outflow Allocation by Method
                    </h3>
                    <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-0.5">
                      Distribution across digital, cash, and active EMI auto-debit
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border shrink-0 ${appleCapsule}`}>
                    {channelBreakdown.length} channels
                  </span>
                </div>

                {channelBreakdown.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-[#86868b] dark:text-[#a1a1a6] text-xs">
                    <span>No outflow recorded for this period</span>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                    {channelBreakdown.map((ch) => (
                      <div key={ch.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: ch.color }}
                            />
                            <span className="font-medium text-[#1d1d1f] dark:text-white truncate">
                              {ch.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-mono">
                            <span className="text-[#86868b] dark:text-[#a1a1a6] text-[11px]">
                              {ch.percentage}%
                            </span>
                            <span className="font-semibold text-[#1d1d1f] dark:text-white">
                              {formatMoney(ch.amount)}
                            </span>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className={`w-full h-2 rounded-full ${progressTrack} overflow-hidden`}>
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.max(4, ch.percentage)}%`,
                              backgroundColor: ch.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 4. EMI Command Center: Active Cards Payoff Progress & Upcoming Due Dates Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
              {/* Left Column (2 Cols): Active Cards & EMI Payoff Status */}
              <div className={`lg:col-span-2 p-6 rounded-[20px] border transition-all duration-200 ${cardBg}`}>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-inherit">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
                      Active EMI Plans & Payoff Tracker
                    </h3>
                    <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-0.5">
                      Real-time installment payoff tracking and remaining liability
                    </p>
                  </div>
                  {onSwitchToCards && (
                    <button
                      type="button"
                      onClick={onSwitchToCards}
                      className="px-3 py-1 rounded-full text-xs font-medium text-[#0071e3] hover:bg-blue-500/10 transition cursor-pointer shrink-0"
                    >
                      Manage Cards →
                    </button>
                  )}
                </div>

                {activeCards.length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-[#1d1d1f] dark:text-white">
                      No Active EMI Commitments
                    </p>
                    <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-1 max-w-xs">
                      All credit card EMIs for this workspace are fully settled, or no cards have been added yet.
                    </p>
                    {onSwitchToCards && (
                      <button
                        type="button"
                        onClick={onSwitchToCards}
                        className="mt-3.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white transition cursor-pointer"
                      >
                        Open Cards & EMI View
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeCards.map((c) => {
                      const colorCfg = getCardColorConfig(c.cardColor)
                      const dueNotice = formatCardDueNotice(c.emiDueDay)
                      const paidCount = c.paidEmis ?? 0
                      const payoffPct = Math.min(100, Math.round((paidCount / c.totalEmis) * 100))
                      const remainingDebt = (c.totalEmis - paidCount) * Number(c.monthlyEmi || 0)
                      const availLimit = Math.max(0, Number(c.cardLimit || 0) - Number(c.cardLimitUsed || 0))

                      return (
                        <div
                          key={c.id}
                          className="p-4 rounded-[16px] border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] flex flex-col justify-between gap-3 transition hover:border-[#0071e3]/40"
                        >
                          <div>
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 truncate">
                                <span
                                  className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                                  style={{ backgroundColor: colorCfg.accent }}
                                />
                                <div className="truncate">
                                  <h4 className="text-xs font-bold text-[#1d1d1f] dark:text-white truncate">
                                    {c.bankName} • {c.cardName}
                                  </h4>
                                  <span className="text-[10px] text-[#86868b] dark:text-[#a1a1a6] font-mono">
                                    •••• {c.cardNumber.slice(-4)}
                                  </span>
                                </div>
                              </div>
                              {/* Urgency Badge (Matches User Rules: Yellow Due Soon, Dark Upcoming) */}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 border ${dueNotice.color}`}>
                                {dueNotice.label}
                              </span>
                            </div>

                            {/* Figures Row */}
                            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                              <div>
                                <span className="text-[10px] text-[#86868b] dark:text-[#a1a1a6] block">
                                  Monthly EMI
                                </span>
                                <span className="font-bold text-[#1d1d1f] dark:text-white font-mono">
                                  ₹{c.monthlyEmi.toLocaleString('en-IN')}/mo
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#86868b] dark:text-[#a1a1a6] block">
                                  Remaining Debt
                                </span>
                                <span className="font-bold text-[#1d1d1f] dark:text-white font-mono">
                                  ₹{remainingDebt.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>

                            {/* Payoff Progress Bar */}
                            <div className="mt-3 space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-[#86868b] dark:text-[#a1a1a6]">
                                  {paidCount} of {c.totalEmis} paid
                                </span>
                                <span className="font-semibold text-[#1d1d1f] dark:text-white font-mono">
                                  {payoffPct}%
                                </span>
                              </div>
                              <div className={`w-full h-1.5 rounded-full ${progressTrack} overflow-hidden`}>
                                <div
                                  className="h-full bg-gradient-to-r from-[#0071e3] to-indigo-500 rounded-full transition-all duration-300"
                                  style={{ width: `${payoffPct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2">
                            <span className="text-[10px] text-[#86868b] dark:text-[#a1a1a6] truncate font-mono">
                              Avail: ₹{availLimit.toLocaleString('en-IN')}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {onOpenCardDetail && (
                                <button
                                  type="button"
                                  onClick={() => onOpenCardDetail(c)}
                                  className={`px-2.5 py-1 rounded-full border text-[11px] font-medium cursor-pointer transition active:scale-95 ${appleGhostBtn}`}
                                >
                                  Statement
                                </button>
                              )}
                              {onOpenPayEmi && (
                                <button
                                  type="button"
                                  onClick={() => onOpenPayEmi(c)}
                                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white cursor-pointer transition shadow-2xs active:scale-95"
                                >
                                  Pay Next
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Right Column (1 Col): Upcoming EMI Schedule Calendar Widget */}
              <div className={`p-6 rounded-[20px] border transition-all duration-200 ${cardBg}`}>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-inherit">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
                      Upcoming EMI Schedule
                    </h3>
                    <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-0.5">
                      Debits due this month
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border shrink-0 ${appleCapsule}`}>
                    {upcomingEmisThisMonth.length} due
                  </span>
                </div>

                {upcomingEmisThisMonth.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-[#86868b] dark:text-[#a1a1a6] text-xs text-center px-2">
                    <svg className="w-8 h-8 text-emerald-500 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 14 14" />
                    </svg>
                    <span>All monthly EMIs are paid or no cards registered.</span>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {upcomingEmisThisMonth.map((c) => {
                      const dueNotice = formatCardDueNotice(c.emiDueDay)
                      const paidCount = c.paidEmis ?? 0

                      return (
                        <div
                          key={c.id}
                          className="p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-between gap-3 transition hover:border-[#0071e3]/30"
                        >
                          <div className="truncate">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-xs font-semibold text-[#1d1d1f] dark:text-white truncate">
                                {c.bankName} {c.cardName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#86868b] dark:text-[#a1a1a6]">
                              <span className="font-mono">Installment #{paidCount + 1} of {c.totalEmis}</span>
                            </div>
                            {/* Notice Badge */}
                            <div className="mt-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] border ${dueNotice.color}`}>
                                {dueNotice.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="text-xs font-bold text-[#1d1d1f] dark:text-white font-mono">
                              ₹{c.monthlyEmi.toLocaleString('en-IN')}
                            </span>
                            {onOpenPayEmi && (
                              <button
                                type="button"
                                onClick={() => onOpenPayEmi(c)}
                                className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white cursor-pointer transition shadow-2xs active:scale-95"
                              >
                                Pay
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* 4. Grouped Expenses List (Apple Style Transactions Inbox - Shown on Inbox) */}
      {expenseSubView === 'inbox' && (
      <div className="space-y-4">
        {/* Section Header with Count & Sort */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              Transactions
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-normal border ${appleCapsule}`}>
              {filteredExpenses.length !== expenses.length
                ? `${filteredExpenses.length} of ${expenses.length}`
                : filteredExpenses.length}
            </span>
          </div>
          <div className="relative inline-flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`h-8.5 pl-4 pr-8 rounded-full border text-xs font-medium focus:outline-none cursor-pointer transition active:scale-95 appearance-none ${filterBtnBg}`}
            >
              <option value="date-desc" className={isDark ? 'bg-[#1c1c1e] text-white' : 'bg-white text-zinc-900'}>
                Sort: Newest Date
              </option>
              <option value="date-asc" className={isDark ? 'bg-[#1c1c1e] text-white' : 'bg-white text-zinc-900'}>
                Sort: Oldest Date
              </option>
              <option value="amount-desc" className={isDark ? 'bg-[#1c1c1e] text-white' : 'bg-white text-zinc-900'}>
                Sort: Highest Amount
              </option>
              <option value="amount-asc" className={isDark ? 'bg-[#1c1c1e] text-white' : 'bg-white text-zinc-900'}>
                Sort: Lowest Amount
              </option>
            </select>
            <div className="pointer-events-none absolute right-3 flex items-center text-[#86868b]">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className={`p-12 rounded-[20px] border text-center ${cardBg} space-y-3`}>
            <div className="w-12 h-12 rounded-full bg-[#f5f5f7] dark:bg-white/[0.08] flex items-center justify-center mx-auto text-[#86868b]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-white">
              {activeFiltersCount > 0 ? 'No matching expenses found' : 'No expenses found'}
            </h3>
            <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] max-w-sm mx-auto">
              {activeFiltersCount > 0
                ? 'No transactions match your active filters. Try adjusting your filters or clear them to view all expenses.'
                : 'No transactions match the selected filters or month. Try adjusting your filter or add a new expense.'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className={`px-4 py-2 rounded-full border text-xs font-medium cursor-pointer transition active:scale-95 ${appleGhostBtn}`}
                >
                  Clear all filters
                </button>
              )}
              <button
                type="button"
                onClick={onAddExpense}
                className="px-4 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium cursor-pointer inline-flex items-center gap-1.5 active:scale-95 shadow-xs"
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
              <div key={dateStr} className={`rounded-[20px] border overflow-hidden transition-all duration-200 ${cardBg}`}>
                {/* Date Header */}
                <div className={`px-5 py-3 border-b border-inherit flex flex-wrap items-center justify-between gap-2 ${
                  isDark ? 'bg-[#242426]' : 'bg-[#fafafc]'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="w-3.5 h-3.5 text-[#86868b] dark:text-[#a1a1a6] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="text-xs font-semibold text-[#1d1d1f] dark:text-white whitespace-nowrap">
                      {dateStr === now.toISOString().split('T')[0] ? 'Today • ' : ''}
                      {dateStr}
                    </span>
                    <span className="text-[11px] text-[#86868b] dark:text-[#a1a1a6] whitespace-nowrap">
                      ({dayExpenses.length} {dayExpenses.length === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#1d1d1f] dark:text-white whitespace-nowrap">
                    <span className="text-[#86868b] dark:text-[#a1a1a6] text-[11px] font-normal mr-1.5">Day Total:</span>
                    {formatMoney(dayTotal)}
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
                        onDoubleClick={() => handleOpenViewExpense(exp)}
                        className={`p-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition cursor-pointer select-none ${
                          isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-[#f5f5f7]/60'
                        }`}
                        title="Double-click to view receipt details"
                      >
                        {/* Left Info - Vertically Centered */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                            isDark ? 'bg-white/[0.06] border-white/[0.08]' : 'bg-[#f5f5f7] border-black/[0.04]'
                          }`}>
                            {renderPaymentMethodIcon(exp.paymentMethod)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-semibold text-[#1d1d1f] dark:text-white break-words">
                                <HighlightText text={exp.title} query={searchQuery} />
                              </span>
                              {isHigh && (
                                <span
                                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full border shrink-0 ${appleCapsule}`}
                                  title="High expense (≥ ₹2,000)"
                                >
                                  <svg className="w-3 h-3 text-[#86868b] dark:text-[#a1a1a6] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                    <polyline points="17 6 23 6 23 12" />
                                  </svg>
                                </span>
                              )}
                              <span className={`inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full border font-normal shrink-0 ${appleCapsule}`}>
                                {exp.category}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${appleCapsule}`}>
                                #{exp.projectName}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3.5 shrink-0 pl-10 sm:pl-0">
                          <div className="text-left sm:text-right">
                            <div className="text-sm sm:text-base font-semibold font-mono text-[#1d1d1f] dark:text-[#f5f5f7] whitespace-nowrap">
                              {formatMoney(Number(exp.amount))}
                            </div>
                            <span className="text-[11px] text-[#86868b] dark:text-[#a1a1a6] whitespace-nowrap block">
                              via {methodLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                            {/* View Details Button (Icon Only) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenViewExpense(exp)
                              }}
                              className={`w-7.5 h-7.5 rounded-full border text-xs font-normal transition-all duration-150 active:scale-95 cursor-pointer inline-flex items-center justify-center shrink-0 ${appleActionBtn}`}
                              title="View Details"
                              aria-label="View Details"
                            >
                              <svg className="w-3.5 h-3.5 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>

                            {/* Edit Button (Icon Only) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEditExpense(exp)
                              }}
                              className={`w-7.5 h-7.5 rounded-full border text-xs font-normal transition-all duration-150 active:scale-95 cursor-pointer inline-flex items-center justify-center shrink-0 ${appleActionBtn}`}
                              title="Edit Expense"
                              aria-label="Edit Expense"
                            >
                              <svg className="w-3.5 h-3.5 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                            </button>

                            {/* Delete Button (Icon Only) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteExpense(exp)
                              }}
                              className={`w-7.5 h-7.5 rounded-full border text-xs font-normal transition-all duration-150 active:scale-95 cursor-pointer inline-flex items-center justify-center shrink-0 group/del ${appleDeleteBtn}`}
                              title="Delete Expense"
                              aria-label="Delete Expense"
                            >
                              <svg className="w-3.5 h-3.5 shrink-0 opacity-80 group-hover/del:opacity-100 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      )}

      {/* 5. Expense View Modal (Triggered by Double-Click or View Button) */}
      {viewingExpense && (
        <div
          onClick={() => setViewingExpense(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-md transition-opacity"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg rounded-[24px] border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
              isDark
                ? 'bg-[#1c1c1e] border-white/[0.12] text-[#f5f5f7] shadow-black/80'
                : 'bg-white border-[#e5e5ea] text-[#1d1d1f] shadow-2xl'
            }`}
          >
            {/* Modal Header */}
            <div className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between ${
              isDark ? 'border-white/[0.08] bg-[#1c1c1e]' : 'border-[#e5e5ea] bg-white'
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                  isDark ? 'bg-white/[0.06] border-white/[0.08] text-white' : 'bg-[#f5f5f7] border-black/[0.06] text-[#1d1d1f]'
                }`}>
                  {renderPaymentMethodIcon(viewingExpense.paymentMethod)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold leading-none truncate tracking-tight">
                    Expense Details
                  </h3>
                  <span className="text-[11px] text-[#86868b] dark:text-[#a1a1a6] mt-1 block truncate">
                    #{viewingExpense.projectName} • {viewingExpense.date}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const exp = viewingExpense
                    setViewingExpense(null)
                    onEditExpense(exp)
                  }}
                  className={`hidden sm:inline-flex px-3 py-1 rounded-full border text-xs font-medium transition cursor-pointer items-center gap-1.5 active:scale-95 ${appleActionBtn}`}
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
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition cursor-pointer active:scale-95 ${appleGhostBtn}`}
                  title="Close modal"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar">
              {/* Hero Amount & Title Card */}
              <div className={`p-4 rounded-[16px] border ${
                isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-[#f5f5f7] border-[#e5e5ea]'
              }`}>
                <div className="text-[11px] font-normal uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6] mb-1">
                  Total Amount Paid
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
                    {formatMoney(Number(viewingExpense.amount))}
                  </div>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-normal border shrink-0 ${appleCapsule}`}>
                    {PAYMENT_METHOD_LABELS[viewingExpense.paymentMethod] || viewingExpense.paymentMethod}
                  </span>
                </div>
                <div className="mt-2.5 text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7] break-words">
                  {viewingExpense.title}
                </div>
              </div>

              {/* Transaction Attributes Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className={`p-3 rounded-[14px] border ${
                  isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-[#f5f5f7]/60 border-[#e5e5ea]'
                }`}>
                  <span className="block text-[11px] text-[#86868b] dark:text-[#a1a1a6] mb-1 truncate">
                    Category
                  </span>
                  <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7] truncate block">{viewingExpense.category}</span>
                </div>
                <div className={`p-3 rounded-[14px] border ${
                  isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-[#f5f5f7]/60 border-[#e5e5ea]'
                }`}>
                  <span className="block text-[11px] text-[#86868b] dark:text-[#a1a1a6] mb-1 truncate">
                    Workspace
                  </span>
                  <span className="font-medium font-mono text-[#1d1d1f] dark:text-[#f5f5f7] truncate block">#{viewingExpense.projectName}</span>
                </div>
                <div className={`p-3 rounded-[14px] border ${
                  isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-[#f5f5f7]/60 border-[#e5e5ea]'
                }`}>
                  <span className="block text-[11px] text-[#86868b] dark:text-[#a1a1a6] mb-1 truncate">
                    Date
                  </span>
                  <span className="font-medium font-mono text-[#1d1d1f] dark:text-[#f5f5f7] truncate block">{viewingExpense.date}</span>
                </div>
                <div className={`p-3 rounded-[14px] border ${
                  isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-[#f5f5f7]/60 border-[#e5e5ea]'
                }`}>
                  <span className="block text-[11px] text-[#86868b] dark:text-[#a1a1a6] mb-1 truncate">
                    Currency
                  </span>
                  <span className="font-medium font-mono text-[#1d1d1f] dark:text-[#f5f5f7] truncate block">{viewingExpense.currency || 'INR'}</span>
                </div>
              </div>

              {/* Receipt Breakdown & Notes Card */}
              <div className={`p-4 rounded-[16px] border ${
                isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-[#f5f5f7]/60 border-[#e5e5ea]'
              }`}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-semibold tracking-tight text-[#86868b] dark:text-[#a1a1a6]">
                    Receipt Breakdown & Remarks
                  </span>
                  {viewingExpense.notes && (
                    <span className="text-[11px] text-[#86868b] dark:text-[#a1a1a6]">
                      {viewingExpense.notes.split('\n').filter((l) => l.trim().length > 0).length} entries
                    </span>
                  )}
                </div>

                {isLoadingViewingNotes ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-[#86868b] dark:text-[#a1a1a6]">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin shrink-0" />
                    <span>Loading receipt remarks from server...</span>
                  </div>
                ) : viewingExpense.notes ? (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                    {viewingExpense.notes.split('\n').map((line, idx) => {
                      const trimmed = line.trim()
                      if (!trimmed) return null
                      const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')
                      const cleanContent = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : trimmed

                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-2.5 p-2.5 rounded-[12px] border text-xs leading-relaxed transition ${
                            isDark
                              ? 'bg-black/40 border-white/[0.06] text-[#f5f5f7]'
                              : 'bg-white border-[#e5e5ea] text-[#1d1d1f]'
                          }`}
                        >
                          <span className="text-[#86868b] dark:text-[#a1a1a6] text-xs shrink-0 select-none mt-0.5">•</span>
                          <span className="flex-1 whitespace-pre-wrap break-words">{cleanContent}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] italic py-1">
                    No receipt remarks or breakdown notes recorded for this transaction.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 sm:p-5 border-t flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 ${
              isDark ? 'border-white/[0.08] bg-[#1c1c1e]' : 'border-[#e5e5ea] bg-white'
            }`}>
              <button
                type="button"
                onClick={() => {
                  const exp = viewingExpense
                  setViewingExpense(null)
                  onDeleteExpense(exp)
                }}
                className={`w-full sm:w-auto px-4 py-2 rounded-full border text-xs font-medium transition cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-95 group/del ${appleDeleteBtn}`}
              >
                <svg className="w-3.5 h-3.5 group-hover/del:text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setViewingExpense(null)}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-full border text-xs font-medium transition cursor-pointer text-center active:scale-95 ${appleGhostBtn}`}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const exp = viewingExpense
                    setViewingExpense(null)
                    onEditExpense(exp)
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-95 bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-xs"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>Edit Expense</span>
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
