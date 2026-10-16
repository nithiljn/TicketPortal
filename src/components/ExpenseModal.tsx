'use client'

import React, { useState, useEffect } from 'react'
import { Expense, PaymentMethod } from '@/types'
import { Button } from '@/components/Button'

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
}: ExpenseModalProps) {
  const isDark = theme === 'dark'
  const todayStr = new Date().toISOString().split('T')[0]

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
    if (isOpen) {
      setShowCalculator(false)
      setCalcExpression('')
      setCalcResult(null)
      if (expense) {
        setTitle(expense.title)
        setAmount(String(expense.amount))
        setCurrency(expense.currency || 'INR')
        setCategory(expense.category)
        setDate(expense.date || todayStr)
        setPaymentMethod((expense.paymentMethod as PaymentMethod) || 'UPI')
        setProjectName(expense.projectName || 'General')
        setNotes(expense.notes || '')
      } else {
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
      setErrorMessage('')
      setIsAddingCategory(false)
      setNewCatName('')
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

  // Theme-aware styles
  const overlayBg = 'bg-black/60 backdrop-blur-sm'
  const modalBg = isDark
    ? 'bg-[#111114] border-white/[0.08] text-zinc-100 shadow-2xl'
    : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
  const inputBg = isDark
    ? 'bg-black/40 border-white/[0.08] text-zinc-100 placeholder-zinc-500 focus:border-emerald-500/60'
    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500'
  const labelColor = isDark ? 'text-zinc-300' : 'text-zinc-700'
  const borderBottom = isDark ? 'border-white/[0.06]' : 'border-zinc-200'

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 ${overlayBg} animate-in fade-in duration-150`}>
      <div className={`w-full max-w-xl rounded-2xl border ${modalBg} flex flex-col max-h-[92vh] overflow-hidden`}>
        {/* Header */}
        <div className={`px-4 sm:px-5 py-3.5 sm:py-4 border-b ${borderBottom} flex items-center justify-between gap-2.5`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              isDark
                ? 'bg-zinc-800 border border-zinc-700/80 text-white shadow-xs'
                : 'bg-zinc-900 border border-zinc-800 text-white shadow-xs'
            }`}>
              <span className="font-bold text-sm leading-none select-none font-sans">₹</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate">
                {expense ? 'Edit Expense' : 'Record New Expense'}
              </h2>
              <p className="text-[11px] text-zinc-500 truncate">
                {expense ? 'Update transaction details' : 'Log your spending to track daily & monthly expenses'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer shrink-0 ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06]' : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 sm:space-y-4 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Amount & Currency (Hero Input with Quick Calculator) */}
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-black/30 border-white/[0.06]' : 'bg-zinc-50/80 border-zinc-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
                Expense Amount *
              </label>
              <button
                type="button"
                onClick={() => setShowCalculator((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors cursor-pointer select-none ${
                  showCalculator
                    ? isDark
                      ? 'bg-white/[0.12] text-white border-white/[0.2]'
                      : 'bg-zinc-200 text-zinc-900 border-zinc-300'
                    : isDark
                      ? 'bg-white/[0.04] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] border-white/[0.08]'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 border-zinc-200'
                }`}
                title="Toggle quick calculator"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <line x1="8" y1="6" x2="16" y2="6" />
                  <line x1="16" y1="14" x2="16" y2="18" />
                  <path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" />
                </svg>
                <span>{showCalculator ? 'Hide Calculator' : 'Quick Calculator'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative shrink-0 w-24">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={`w-full rounded-lg border px-2.5 py-2 text-xs font-semibold focus:outline-none cursor-pointer ${inputBg}`}
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                </select>
              </div>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400 font-mono">
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
                  className={`w-full rounded-lg border pl-7 pr-3 py-2 text-base font-bold font-mono focus:outline-none ${inputBg}`}
                />
              </div>
            </div>

            {/* Quick Calculator Keypad Widget */}
            {showCalculator && (
              <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/[0.08]' : 'border-zinc-200'}`}>
                {/* Calculator Display */}
                <div className={`p-2.5 rounded-lg border mb-2 flex items-center justify-between font-mono ${
                  isDark ? 'bg-black/50 border-white/[0.08]' : 'bg-white border-zinc-200'
                }`}>
                  <input
                    type="text"
                    value={calcExpression}
                    onChange={(e) => handleCalcInputChange(e.target.value)}
                    placeholder="Type e.g. 40 + 25 + 15"
                    className="bg-transparent border-none outline-none text-xs flex-1 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-0 font-mono"
                  />
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-xs text-zinc-500 mr-1">=</span>
                    <span className="text-sm font-bold text-zinc-950 dark:text-white font-mono">
                      {calcResult !== null ? calcResult.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>

                {/* Keypad Grid */}
                <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                  {[
                    { label: 'C', val: 'C', cls: 'text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 font-semibold' },
                    { label: '(', val: '(', cls: 'text-zinc-500 dark:text-zinc-400' },
                    { label: ')', val: ')', cls: 'text-zinc-500 dark:text-zinc-400' },
                    { label: '÷', val: ' / ', cls: 'text-zinc-800 dark:text-zinc-200 font-bold' },
                    { label: '7', val: '7' },
                    { label: '8', val: '8' },
                    { label: '9', val: '9' },
                    { label: '×', val: ' * ', cls: 'text-zinc-800 dark:text-zinc-200 font-bold' },
                    { label: '4', val: '4' },
                    { label: '5', val: '5' },
                    { label: '6', val: '6' },
                    { label: '-', val: ' - ', cls: 'text-zinc-800 dark:text-zinc-200 font-bold' },
                    { label: '1', val: '1' },
                    { label: '2', val: '2' },
                    { label: '3', val: '3' },
                    { label: '+', val: ' + ', cls: 'text-zinc-800 dark:text-zinc-200 font-bold' },
                    { label: '0', val: '0' },
                    { label: '.', val: '.' },
                    { label: '⌫', val: 'BACK', cls: 'text-zinc-500 dark:text-zinc-400' },
                    {
                      label: '=',
                      val: '=',
                      cls: isDark
                        ? 'bg-white text-zinc-950 hover:bg-zinc-100 font-bold border-white'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800 font-bold border-zinc-900',
                    },
                  ].map((btn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCalcKeyPress(btn.val)}
                      className={`h-7 rounded-md text-xs font-mono transition-colors cursor-pointer select-none border ${
                        btn.cls && btn.cls.includes('bg-')
                          ? btn.cls
                          : isDark
                            ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-zinc-200'
                            : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-800'
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
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold disabled:opacity-40 transition cursor-pointer ${
                      isDark
                        ? 'bg-white hover:bg-zinc-100 text-zinc-950 border border-white shadow-xs'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-900 shadow-xs'
                    }`}
                  >
                    Set as Amount ({calcResult !== null ? `${currency === 'INR' ? '₹' : currency} ${calcResult.toFixed(2)}` : '0.00'})
                  </button>
                  <button
                    type="button"
                    onClick={handleAppendCalcToNotes}
                    disabled={calcResult === null || calcResult <= 0}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-medium border transition cursor-pointer disabled:opacity-40 ${
                      isDark
                        ? 'bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 border-white/[0.1]'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200 shadow-2xs'
                    }`}
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
            <label className={`block text-[11px] font-medium mb-1.5 ${labelColor}`}>
              Expense Title / Paid For *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AWS Cloud Hosting, Team Lunch, Office Chairs..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none ${inputBg}`}
            />
          </div>

          {/* Category & Workspace Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-[11px] font-medium ${labelColor}`}>
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="text-[10px] text-emerald-500 hover:text-emerald-400 font-medium cursor-pointer"
                >
                  {isAddingCategory ? 'Cancel' : '+ New Category'}
                </button>
              </div>

              {isAddingCategory ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="New category..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className={`flex-1 rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none ${inputBg}`}
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddCategory}
                    disabled={catLoading || !newCatName.trim()}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none cursor-pointer ${inputBg}`}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Workspace */}
            <div>
              <label className={`block text-[11px] font-medium mb-1.5 ${labelColor}`}>
                Workspace / Project
              </label>
              <select
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none cursor-pointer ${inputBg}`}
              >
                {availableProjects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={`block text-[11px] font-medium mb-1.5 ${labelColor}`}>
                Expense Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-xs font-mono focus:outline-none ${inputBg}`}
              />
            </div>

            <div>
              <label className={`block text-[11px] font-medium mb-1.5 ${labelColor}`}>
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none cursor-pointer ${inputBg}`}
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-[11px] font-medium ${labelColor}`}>
                Notes / Receipt Remarks (Optional)
              </label>
              <button
                type="button"
                onClick={() => {
                  setNotes((prev) => (prev ? `${prev}\n• ` : '• '))
                }}
                className={`text-[11px] font-medium transition cursor-pointer select-none inline-flex items-center gap-1 ${
                  isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
                }`}
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
              className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none min-h-[96px] max-h-[190px] resize-y overflow-y-auto leading-relaxed custom-scrollbar ${inputBg}`}
            />
            <p className="mt-1 text-[10px] text-zinc-500">
              Tip: Press Enter on a bullet line to automatically continue the next bullet.
            </p>
          </div>

          {/* Footer Actions */}
          <div className={`pt-3 border-t ${borderBottom} flex items-center justify-end gap-2.5`}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="ticket"
              size="sm"
              isLoading={loading}
            >
              {expense ? 'Update Expense' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
