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

  useEffect(() => {
    if (isOpen) {
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
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${overlayBg} animate-in fade-in duration-150`}>
      <div className={`w-full max-w-xl rounded-2xl border ${modalBg} flex flex-col max-h-[92vh] overflow-hidden`}>
        {/* Header */}
        <div className={`px-5 py-4 border-b ${borderBottom} flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              isDark
                ? 'bg-zinc-800 border border-zinc-700/80 text-white shadow-xs'
                : 'bg-zinc-900 border border-zinc-800 text-white shadow-xs'
            }`}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold">
                {expense ? 'Edit Expense' : 'Record New Expense'}
              </h2>
              <p className="text-[11px] text-zinc-500">
                {expense ? 'Update transaction details' : 'Log your spending to track daily & monthly expenses'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Amount & Currency (Hero Input) */}
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-black/30 border-white/[0.06]' : 'bg-zinc-50/80 border-zinc-200'
          }`}>
            <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-2 ${labelColor}`}>
              Expense Amount *
            </label>
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
            <label className={`block text-[11px] font-medium mb-1.5 ${labelColor}`}>
              Notes / Receipt Remarks (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add optional notes, invoice ID, or vendor info..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none resize-none ${inputBg}`}
            />
          </div>

          {/* Footer Actions */}
          <div className={`pt-3 border-t ${borderBottom} flex items-center justify-end gap-2.5`}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                isDark
                  ? 'border-white/[0.08] text-zinc-300 hover:bg-white/[0.04]'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
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
