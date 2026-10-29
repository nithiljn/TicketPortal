'use client'

import React, { useState } from 'react'
import { Card, RecordEmiPaymentInput } from '@/types'

interface MarkEmiPaidModalProps {
  isOpen: boolean
  onClose: () => void
  card: Card | null
  targetEmiNumber?: number
  onConfirmPayment: (input: RecordEmiPaymentInput) => Promise<void>
  expenseCategories?: string[]
  theme?: 'dark' | 'light'
}

export function MarkEmiPaidModal({
  isOpen,
  onClose,
  card,
  targetEmiNumber,
  onConfirmPayment,
  expenseCategories = ['Bills & Utilities', 'Miscellaneous', 'Personal'],
  theme = 'light',
}: MarkEmiPaidModalProps) {
  const isDark = theme === 'dark'

  const emiNo = targetEmiNumber || ((card?.paidEmis || 0) + 1)
  const defaultAmount = card?.monthlyEmi || 0

  const [amount, setAmount] = useState(String(defaultAmount))
  const [paidDate, setPaidDate] = useState(() => new Date().toISOString().split('T')[0])
  const [transactionId, setTransactionId] = useState('')
  const [notes, setNotes] = useState('')
  const [recordAsExpense, setRecordAsExpense] = useState(true)
  const [expenseCategory, setExpenseCategory] = useState('Bills & Utilities')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen || !card) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const val = Number(amount)
    if (!val || val <= 0) {
      setErrorMsg('Please enter a valid payment amount')
      return
    }

    if (!paidDate) {
      setErrorMsg('Please select paid date')
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirmPayment({
        cardId: card.id,
        emiNumber: emiNo,
        amount: val,
        paidDate,
        transactionId: transactionId.trim() || undefined,
        notes: notes.trim() || undefined,
        recordAsExpense,
        expenseCategory: recordAsExpense ? expenseCategory : undefined,
      })
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record payment'
      setErrorMsg(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const cardBg = isDark ? 'bg-[#1c1c1e] text-white border-white/[0.08]' : 'bg-white text-zinc-900 border-black/[0.08]'
  const inputBg = isDark
    ? 'bg-white/[0.06] border-white/[0.1] text-white placeholder-zinc-500 focus:border-[#0071e3]'
    : 'bg-[#f5f5f7] border-black/[0.08] text-zinc-900 placeholder-zinc-400 focus:border-[#0071e3]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-[24px] border shadow-2xl overflow-hidden transition-all my-auto ${cardBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Record EMI Payment</h2>
              <p className="text-xs text-[#86868b]">
                {card.bankName} • {card.cardName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl text-xs font-medium bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* EMI Indicator Capsule */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                Installment
              </span>
              <div className="text-sm font-semibold font-mono mt-0.5">
                EMI #{emiNo} of {card.totalEmis}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#86868b]">Monthly Scheduled</span>
              <div className="text-sm font-mono font-bold">₹{card.monthlyEmi.toLocaleString()}</div>
            </div>
          </div>

          {/* Amount & Paid Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                Amount Paid (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full h-10 px-3 text-xs rounded-xl border outline-none font-mono ${inputBg}`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                Paid Date *
              </label>
              <input
                type="date"
                required
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className={`w-full h-10 px-3 text-xs rounded-xl border outline-none ${inputBg}`}
              />
            </div>
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
              Transaction ID / UTR / UPI Ref (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. UPI/428919283719 or IMPS-9021"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className={`w-full h-10 px-3 text-xs font-mono rounded-xl border outline-none ${inputBg}`}
            />
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via GPay auto-debit"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full h-10 px-3 text-xs rounded-xl border outline-none ${inputBg}`}
            />
          </div>

          {/* Auto-Sync with Expense Inbox */}
          <div className="p-3.5 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={recordAsExpense}
                onChange={(e) => setRecordAsExpense(e.target.checked)}
                className="w-4 h-4 rounded text-[#0071e3] focus:ring-0 cursor-pointer accent-[#0071e3]"
              />
              <span className="text-xs font-medium">
                Also record as an expense in Expense Inbox
              </span>
            </label>

            {recordAsExpense && (
              <div className="pl-6.5 pt-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#86868b] mb-1">
                  Expense Category
                </label>
                <div className="relative">
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className={`w-full h-8 pl-2.5 pr-8 rounded-lg border text-xs font-medium outline-none cursor-pointer appearance-none ${inputBg}`}
                  >
                    {expenseCategories.map((cat) => (
                      <option key={cat} value={cat} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#86868b]">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-black/[0.06] dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-full border text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{isSubmitting ? 'Recording...' : 'Mark as Paid'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
