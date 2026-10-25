'use client'

import React, { useState, useEffect } from 'react'
import { Expense, PaymentMethod } from '@/types'

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (
    data: {
      title: string
      amount: number
      currency: string
      category: string
      date: string
      paymentMethod: string
      projectName: string
      notes?: string
    },
    id?: string
  ) => Promise<void>
  expense?: Expense | null
  categories: string[]
  availableProjects: string[]
  currentWorkspace?: string
  onCreateCategory?: (newCategory: string) => Promise<void>
  theme?: 'dark' | 'light'
  isLoadingNotes?: boolean
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'UPI', label: 'UPI / GPay / PhonePe' },
  { id: 'CREDIT_CARD', label: 'Credit Card' },
  { id: 'DEBIT_CARD', label: 'Debit Card' },
  { id: 'CASH', label: 'Cash' },
  { id: 'NET_BANKING', label: 'Net Banking' },
  { id: 'OTHER', label: 'Other' },
]

export function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  expense,
  categories,
  availableProjects,
  currentWorkspace,
  onCreateCategory,
  theme = 'light',
  isLoadingNotes = false,
}: ExpenseModalProps) {
  const isDark = theme === 'dark'
  const todayStr = new Date().toISOString().split('T')[0]
  const prevExpenseIdRef = React.useRef<string | null>(null)
  const prevOpenRef = React.useRef(false)

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(todayStr)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI')
  const [projectName, setProjectName] = useState('General')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Inline Quick Add Category
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [catLoading, setCatLoading] = useState(false)

  // Quick Calculator State
  const [showCalculator, setShowCalculator] = useState(false)
  const [calcExpression, setCalcExpression] = useState('')
  const [calcResult, setCalcResult] = useState<number | null>(null)

  const evaluateCalc = (expr: string): number | null => {
    const cleaned = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '').trim()
    if (!cleaned) return null
    if (!/^[\d\s+\-*/.()]+$/.test(cleaned)) return null
    try {
      const result = new Function(`"use strict"; return (${cleaned});`)()
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Math.round(result * 100) / 100
      }
    } catch {
      return null
    }
    return null
  }

  const handleCalcInputChange = (val: string) => {
    setCalcExpression(val)
    setCalcResult(evaluateCalc(val))
  }

  const handleCalcKeyPress = (key: string) => {
    if (key === 'C') {
      setCalcExpression('')
      setCalcResult(null)
      return
    }
    if (key === 'BACK') {
      const next = calcExpression.slice(0, -1)
      setCalcExpression(next)
      setCalcResult(evaluateCalc(next))
      return
    }
    if (key === '=') {
      const evaluated = evaluateCalc(calcExpression)
      if (evaluated !== null) {
        setCalcExpression(String(evaluated))
        setCalcResult(evaluated)
      }
      return
    }
    const next = calcExpression + key
    setCalcExpression(next)
    setCalcResult(evaluateCalc(next))
  }

  const handleApplyCalcToAmount = () => {
    const res = calcResult ?? evaluateCalc(calcExpression)
    if (res !== null && res > 0) {
      setAmount(String(res))
      setShowCalculator(false)
    }
  }

  const handleAppendCalcToNotes = () => {
    const res = calcResult ?? evaluateCalc(calcExpression)
    if (res !== null) {
      const entry = `• Total calculated: ${calcExpression} = ₹${res}`
      setNotes((prev) => (prev ? `${prev}\n${entry}` : entry))
    }
  }

  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const target = e.currentTarget
      const { selectionStart, value } = target
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
      const currentLine = value.substring(lineStart, selectionStart)

      if (currentLine.trim().startsWith('•') || currentLine.trim().startsWith('-')) {
        e.preventDefault()
        const isBullet = currentLine.trim().startsWith('•')
        const marker = isBullet ? '• ' : '- '

        if (currentLine.trim() === '•' || currentLine.trim() === '-') {
          const before = value.substring(0, lineStart)
          const after = value.substring(selectionStart)
          setNotes(before + after)
          return
        }

        const before = value.substring(0, selectionStart)
        const after = value.substring(selectionStart)
        const nextValue = `${before}\n${marker}${after}`
        setNotes(nextValue)
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = selectionStart + marker.length + 1
        }, 0)
      }
    }
  }

  useEffect(() => {
    if (!isOpen) {
      prevOpenRef.current = false
      prevExpenseIdRef.current = null
      return
    }

    const wasClosed = !prevOpenRef.current
    prevOpenRef.current = true

    if (wasClosed) {
      // Modal just opened: initialize form fields once
      setShowCalculator(false)
      setCalcExpression('')
      setCalcResult(null)
      setErrorMessage('')
      setIsAddingCategory(false)
      setNewCatName('')

      if (expense) {
        prevExpenseIdRef.current = expense.id
        setTitle(expense.title || '')
        setAmount(expense.amount !== undefined && expense.amount !== null ? String(expense.amount) : '')
        setCurrency(expense.currency || 'INR')
        setCategory(expense.category || categories[0] || 'Food & Dining')
        setDate(expense.date || todayStr)
        setPaymentMethod((expense.paymentMethod as PaymentMethod) || 'UPI')
        setProjectName(expense.projectName || 'General')
        setNotes(expense.notes || '')
      } else {
        prevExpenseIdRef.current = null
        setTitle('')
        setAmount('')
        setCurrency('INR')
        setCategory(categories[0] || 'Food & Dining')
        setDate(todayStr)
        setPaymentMethod('UPI')
        const initialWs =
          currentWorkspace && currentWorkspace !== 'ALL'
            ? currentWorkspace
            : availableProjects[0] || 'General'
        setProjectName(initialWs)
        setNotes('')
      }
    } else {
      // Modal is already open: only react if expense prop changes
      if (expense) {
        if (expense.id !== prevExpenseIdRef.current) {
          prevExpenseIdRef.current = expense.id
          setTitle(expense.title || '')
          setAmount(expense.amount !== undefined && expense.amount !== null ? String(expense.amount) : '')
          setCurrency(expense.currency || 'INR')
          setCategory(expense.category || categories[0] || 'Food & Dining')
          setDate(expense.date || todayStr)
          setPaymentMethod((expense.paymentMethod as PaymentMethod) || 'UPI')
          setProjectName(expense.projectName || 'General')
          setNotes(expense.notes || '')
        } else if (expense.notes !== undefined && expense.notes !== null) {
          // If notes arrived asynchronously for the same expense being edited
          setNotes((currentNotes) => (currentNotes ? currentNotes : (expense.notes || '')))
        }
      }
    }
  }, [isOpen, expense, categories, availableProjects, currentWorkspace, todayStr])

  if (!isOpen) return null

  const handleQuickAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setCatLoading(true)
    try {
      if (onCreateCategory) {
        await onCreateCategory(newCatName.trim())
      }
      setCategory(newCatName.trim())
      setNewCatName('')
      setIsAddingCategory(false)
    } finally {
      setCatLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMessage('Please enter an expense title / description.')
      return
    }
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid positive amount.')
      return
    }
    if (!category.trim()) {
      setErrorMessage('Please select or create a category.')
      return
    }

    setLoading(true)
    setErrorMessage('')
    try {
      await onSave(
        {
          title: title.trim(),
          amount: parsedAmount,
          currency,
          category: category.trim(),
          date,
          paymentMethod,
          projectName: projectName.trim() || 'General',
          notes: notes.trim() || undefined,
        },
        expense?.id
      )
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save expense.'
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  // Apple Design System Surface & Input Tokens (DESIGN.md)
  const overlayBg = 'bg-black/40 backdrop-blur-md'
  const modalBg = isDark
    ? 'bg-[#1c1c1e] border-white/[0.08] text-[#f5f5f7] shadow-2xl'
    : 'bg-white border-[#e5e5ea] text-[#1d1d1f] shadow-2xl'
  const cardSectionBg = isDark
    ? 'bg-white/[0.03] border-white/[0.08]'
    : 'bg-[#f5f5f7] border-[#e5e5ea]'
  const inputBg = isDark
    ? 'bg-white/[0.04] border-white/[0.08] text-[#f5f5f7] placeholder-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/20'
    : 'bg-white border-[#e5e5ea] text-[#1d1d1f] placeholder-[#86868b] focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 shadow-2xs'
  const labelColor = isDark ? 'text-[#a1a1a6]' : 'text-[#86868b]'
  const borderBottom = isDark ? 'border-white/[0.08]' : 'border-[#e5e5ea]'
  const appleGhostBtn = isDark
    ? 'border-white/[0.08] hover:border-white/[0.18] bg-white/[0.04] hover:bg-white/[0.08] text-[#f5f5f7]'
    : 'border-[#e5e5ea] hover:border-[#d2d2d7] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] shadow-2xs'

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${overlayBg} animate-in fade-in duration-150`}>
      <div className={`w-full max-w-xl rounded-[24px] border ${modalBg} flex flex-col max-h-[92vh] overflow-hidden`}>
        {/* Header */}
        <div className={`px-5 sm:px-6 py-4 border-b ${borderBottom} flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 bg-[#0071e3] text-white shadow-xs">
              <span className="font-semibold text-[15px] leading-none select-none font-sans text-white">₹</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight truncate">
                {expense ? 'Edit Expense' : 'Record New Expense'}
              </h2>
              <p className="text-[11px] text-[#86868b] dark:text-[#a1a1a6] truncate mt-0.5">
                {expense ? 'Update transaction details' : 'Log your spending to track daily & monthly expenses'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-[#f5f5f7] dark:bg-white/[0.06] hover:bg-[#e5e5ea] dark:hover:bg-white/[0.12] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white flex items-center justify-center transition cursor-pointer shrink-0 active:scale-95"
            title="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-scrollbar">
          {errorMessage && (
            <div className="p-3.5 rounded-[12px] bg-[#ff3b30]/10 border border-[#ff3b30]/20 text-[#ff3b30] dark:text-[#ff453a] text-xs">
              {errorMessage}
            </div>
          )}

          {/* Amount & Currency (Hero Input with Quick Calculator) */}
          <div className={`p-4 sm:p-4.5 rounded-[18px] border ${cardSectionBg}`}>
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
                Expense Amount <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCalculator((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal border transition-all duration-150 cursor-pointer select-none active:scale-95 ${
                  showCalculator
                    ? 'bg-[#0071e3] text-white border-[#0071e3]'
                    : appleGhostBtn
                }`}
                title="Toggle quick calculator"
              >
                <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <line x1="8" y1="6" x2="16" y2="6" />
                  <line x1="16" y1="14" x2="16" y2="18" />
                  <path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" />
                </svg>
                <span>{showCalculator ? 'Hide Calculator' : 'Quick Calculator'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0 w-28">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={`w-full h-11 rounded-[12px] border pl-3 pr-8 text-xs font-semibold focus:outline-none cursor-pointer transition appearance-none ${inputBg}`}
                >
                  <option value="INR" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>₹ INR</option>
                  <option value="USD" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>$ USD</option>
                  <option value="EUR" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>€ EUR</option>
                  <option value="GBP" className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>£ GBP</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#86868b]">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#86868b] font-mono pointer-events-none">
                  {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full h-11 rounded-[12px] border pl-8 pr-3 text-base font-semibold font-mono focus:outline-none transition ${inputBg}`}
                />
              </div>
            </div>

            {/* Quick Calculator Keypad Widget */}
            {showCalculator && (
              <div className={`mt-3 pt-3 border-t ${borderBottom}`}>
                {/* Calculator Display */}
                <div className={`p-2.5 rounded-[12px] border mb-2.5 flex items-center justify-between font-mono ${
                  isDark ? 'bg-black/50 border-white/[0.08]' : 'bg-white border-[#e5e5ea]'
                }`}>
                  <input
                    type="text"
                    value={calcExpression}
                    onChange={(e) => handleCalcInputChange(e.target.value)}
                    placeholder="Type e.g. 40 + 25 + 15"
                    className="bg-transparent border-none outline-none text-xs flex-1 text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] focus:ring-0 font-mono"
                  />
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-xs text-[#86868b] mr-1">=</span>
                    <span className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] font-mono">
                      {calcResult !== null ? calcResult.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>

                {/* Keypad Grid */}
                <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                  {[
                    { label: 'C', val: 'C', cls: 'text-[#ff3b30] dark:text-[#ff453a] font-semibold' },
                    { label: '(', val: '(', cls: 'text-[#86868b]' },
                    { label: ')', val: ')', cls: 'text-[#86868b]' },
                    { label: '÷', val: ' / ', cls: 'text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold' },
                    { label: '7', val: '7' },
                    { label: '8', val: '8' },
                    { label: '9', val: '9' },
                    { label: '×', val: ' * ', cls: 'text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold' },
                    { label: '4', val: '4' },
                    { label: '5', val: '5' },
                    { label: '6', val: '6' },
                    { label: '-', val: ' - ', cls: 'text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold' },
                    { label: '1', val: '1' },
                    { label: '2', val: '2' },
                    { label: '3', val: '3' },
                    { label: '+', val: ' + ', cls: 'text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold' },
                    { label: '0', val: '0' },
                    { label: '.', val: '.' },
                    { label: '⌫', val: 'BACK', cls: 'text-[#86868b]' },
                    {
                      label: '=',
                      val: '=',
                      cls: 'bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold border-[#0071e3]',
                    },
                  ].map((btn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCalcKeyPress(btn.val)}
                      className={`h-7.5 rounded-[10px] text-xs font-mono transition-all duration-150 cursor-pointer select-none active:scale-95 border ${
                        btn.cls && btn.cls.includes('bg-')
                          ? btn.cls
                          : isDark
                            ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-[#f5f5f7]'
                            : 'bg-white hover:bg-[#f5f5f7] border-[#e5e5ea] text-[#1d1d1f]'
                      } ${btn.cls || ''}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Apply Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyCalcToAmount}
                    disabled={calcResult === null || calcResult <= 0}
                    className="flex-1 py-1.5 px-3.5 rounded-full text-xs font-medium disabled:opacity-40 transition cursor-pointer active:scale-95 bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-xs"
                  >
                    Set as Amount ({calcResult !== null ? `${currency === 'INR' ? '₹' : currency} ${calcResult.toFixed(2)}` : '0.00'})
                  </button>
                  <button
                    type="button"
                    onClick={handleAppendCalcToNotes}
                    disabled={calcResult === null || calcResult <= 0}
                    className={`py-1.5 px-3 rounded-full text-xs font-medium border transition cursor-pointer disabled:opacity-40 active:scale-95 ${appleGhostBtn}`}
                    title="Insert total breakdown into notes"
                  >
                    + Add to Notes
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5 h-5">
              <label className={`block text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
                Expense Title / Paid For <span className="text-red-500">*</span>
              </label>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. AWS Cloud Hosting, Team Lunch, Office Chairs..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full h-10 rounded-[12px] border px-3.5 text-xs focus:outline-none transition ${inputBg}`}
            />
          </div>

          {/* Category & Workspace Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1.5 h-5">
                <label className={`text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
                  Category <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="text-xs text-[#0071e3] dark:text-[#2997ff] hover:underline font-normal cursor-pointer transition-colors leading-none"
                >
                  {isAddingCategory ? 'Cancel' : '+ New Category'}
                </button>
              </div>

              {isAddingCategory ? (
                <div className="flex items-center gap-1.5 h-10">
                  <input
                    type="text"
                    placeholder="New category..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className={`flex-1 h-10 rounded-[12px] border px-3 text-xs focus:outline-none transition ${inputBg}`}
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddCategory}
                    disabled={catLoading || !newCatName.trim()}
                    className="h-10 px-3.5 rounded-[12px] bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium cursor-pointer disabled:opacity-50 active:scale-95 transition-all shadow-xs shrink-0"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full h-10 rounded-[12px] border pl-3.5 pr-8 text-xs font-medium focus:outline-none cursor-pointer transition appearance-none ${inputBg}`}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#86868b]">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Workspace */}
            <div>
              <div className="flex items-center justify-between mb-1.5 h-5">
                <label className={`block text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
                  Workspace / Project
                </label>
              </div>
              <div className="relative">
                <select
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className={`w-full h-10 rounded-[12px] border pl-3.5 pr-8 text-xs font-medium focus:outline-none cursor-pointer transition appearance-none ${inputBg}`}
                >
                  {availableProjects.map((p) => (
                    <option key={p} value={p} className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>
                      {p}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#86868b]">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1.5 h-5">
                <label className={`block text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
                  Expense Date
                </label>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full h-10 rounded-[12px] border px-3.5 text-xs font-mono focus:outline-none transition ${inputBg}`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 h-5">
                <label className={`block text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
                  Payment Method
                </label>
              </div>
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className={`w-full h-10 rounded-[12px] border pl-3.5 pr-8 text-xs font-medium focus:outline-none cursor-pointer transition appearance-none ${inputBg}`}
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.id} value={pm.id} className={isDark ? 'bg-[#1c1c1e]' : 'bg-white'}>
                      {pm.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#86868b]">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5 h-5">
              <div className="flex items-center gap-2">
                <label className={`text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
                  Notes / Receipt Remarks (Optional)
                </label>
                {isLoadingNotes && (
                  <span className="text-[10px] text-[#0071e3] dark:text-[#2997ff] flex items-center gap-1 font-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] dark:bg-[#2997ff] animate-ping" />
                    loading remarks...
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setNotes((prev) => (prev ? `${prev}\n• ` : '• '))
                }}
                className="text-xs text-[#0071e3] dark:text-[#2997ff] hover:underline font-normal cursor-pointer select-none inline-flex items-center gap-1 transition-colors leading-none"
              >
                <span>+ Add Bullet (•)</span>
              </button>
            </div>
            <textarea
              rows={4}
              placeholder={'Add itemized breakdown or notes, e.g.:\n• Morning food - 40 rs\n• Evening snacks - 25 rs\n• Evening tea - 15 rs'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={handleNotesKeyDown}
              className={`w-full rounded-[14px] border p-3.5 text-xs focus:outline-none min-h-[96px] max-h-[190px] resize-y overflow-y-auto leading-relaxed custom-scrollbar transition ${inputBg}`}
            />
          </div>

          {/* Footer Actions */}
          <div className={`pt-4 border-t ${borderBottom} flex items-center justify-end gap-2.5`}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2 rounded-full border text-xs font-medium cursor-pointer active:scale-95 transition-all ${appleGhostBtn} disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-full text-xs font-medium cursor-pointer active:scale-95 transition-all inline-flex items-center justify-center gap-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="16" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{expense ? 'Update Expense' : 'Add Expense'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
