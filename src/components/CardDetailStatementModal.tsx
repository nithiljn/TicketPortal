'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardEmiPayment } from '@/types'
import { CARD_COLORS, getCardColorConfig } from '@/components/CreateCardModal'
import { ConfirmModal } from '@/components/ConfirmModal'

interface CardDetailStatementModalProps {
  isOpen: boolean
  onClose: () => void
  card: Card | null
  payments: CardEmiPayment[]
  onOpenPayEmi: (card: Card, emiNumber?: number) => void
  onDeletePayment: (paymentId: string) => Promise<void>
  onEditCard: (card: Card) => void
  onDeleteCard: (card: Card) => void
  theme?: 'dark' | 'light'
}

interface InstallmentRow {
  emiNumber: number
  dueDate: string
  amount: number
  status: 'PAID' | 'OVERDUE' | 'DUE_SOON' | 'UPCOMING'
  paidRecord?: CardEmiPayment
}

function calculateInstallmentDueDate(startDateStr: string, dueDay: number, monthIndex: number): string {
  try {
    const [y, m] = startDateStr.split('-').map(Number)
    if (!y || !m) return startDateStr
    const totalMonths = (m - 1) + monthIndex
    const targetY = y + Math.floor(totalMonths / 12)
    const targetM = (totalMonths % 12) + 1
    const daysInMonth = new Date(targetY, targetM, 0).getDate()
    const validDay = Math.min(dueDay, daysInMonth)
    return `${targetY}-${String(targetM).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`
  } catch {
    return startDateStr
  }
}

function formatDisplayDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    return dt.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function CardDetailStatementModal({
  isOpen,
  onClose,
  card,
  payments,
  onOpenPayEmi,
  onDeletePayment,
  onEditCard,
  onDeleteCard,
  theme = 'light',
}: CardDetailStatementModalProps) {
  const isDark = theme === 'dark'
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Map of payments by emi_number
  const paymentMap = useMemo(() => {
    const map = new Map<number, CardEmiPayment>()
    payments.forEach((p) => {
      map.set(p.emiNumber, p)
    })
    return map
  }, [payments])

  // Build the complete schedule (All 1 to totalEmis rows)
  const scheduleRows: InstallmentRow[] = useMemo(() => {
    if (!card) return []
    const rows: InstallmentRow[] = []
    const today = new Date().toISOString().split('T')[0]
    const currentMonthPrefix = today.slice(0, 7)

    for (let i = 0; i < card.totalEmis; i++) {
      const emiNo = i + 1
      const dueDate = calculateInstallmentDueDate(card.startDate, card.emiDueDay, i)
      const paidRec = paymentMap.get(emiNo)

      let status: InstallmentRow['status'] = 'UPCOMING'
      if (paidRec || emiNo <= card.paidEmis) {
        status = 'PAID'
      } else if (dueDate < today) {
        status = 'OVERDUE'
      } else if (dueDate.startsWith(currentMonthPrefix)) {
        status = 'DUE_SOON'
      } else {
        status = 'UPCOMING'
      }

      rows.push({
        emiNumber: emiNo,
        dueDate,
        amount: card.monthlyEmi,
        status,
        paidRecord: paidRec,
      })
    }

    return rows
  }, [card, paymentMap])

  if (!isOpen || !card) return null

  const colorConfig = getCardColorConfig(card.cardColor)
  const totalLoanValue = card.monthlyEmi * card.totalEmis
  const totalPaidValue = card.monthlyEmi * card.paidEmis
  const balanceValue = Math.max(0, totalLoanValue - totalPaidValue)
  const remainingMonths = Math.max(0, card.totalEmis - card.paidEmis)
  const progressPercent = Math.min(100, Math.round((card.paidEmis / card.totalEmis) * 100))

  // Find next unpaid installment
  const nextUnpaid = scheduleRows.find((r) => r.status !== 'PAID')

  const cardBg = isDark ? 'bg-[#18181b] text-white border-white/[0.08]' : 'bg-white text-zinc-900 border-black/[0.08]'
  const tableHeaderBg = isDark ? 'bg-white/[0.04] text-[#86868b]' : 'bg-[#f5f5f7] text-[#1d1d1f]/60'
  const rowBorder = isDark ? 'border-white/[0.06] hover:bg-white/[0.02]' : 'border-black/[0.06] hover:bg-black/[0.01]'
  const deleteBtn = isDark
    ? 'border-white/[0.1] hover:border-[#C04742] bg-white/[0.04] hover:bg-rose-600 text-zinc-400 hover:text-white transition-all duration-150'
    : 'border-black/[0.12] hover:border-[#C04742] bg-white hover:bg-rose-600 text-zinc-600 hover:text-white shadow-2xs transition-all duration-150'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className={`w-full max-w-4xl rounded-[22px] sm:rounded-[28px] border shadow-2xl overflow-hidden transition-all my-auto flex flex-col max-h-[92vh] sm:max-h-[90vh] ${cardBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header - Fully responsive on mobile */}
        <div className="px-4 py-3 sm:px-6 sm:py-4.5 border-b border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-start sm:items-center justify-between gap-2 w-full sm:w-auto min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-6 sm:w-10 sm:h-7 rounded-md border flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: colorConfig.preview }}
              >
                <div className="w-4 h-3 sm:w-5 sm:h-3.5 border border-white/20 rounded-xs bg-white/10" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base md:text-lg font-bold tracking-tight truncate max-w-[150px] sm:max-w-none">
                    {card.cardName}
                  </h2>
                  <span className="text-[10px] sm:text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.03] dark:bg-white/[0.06]">
                    {card.bankName}
                  </span>
                </div>
                {card.description && (
                  <p className="text-[11px] sm:text-xs text-[#86868b] truncate mt-0.5 max-w-[180px] sm:max-w-none">
                    {card.description}
                  </p>
                )}
              </div>
            </div>

            {/* Mobile-only Delete and Close in top-right */}
            <div className="flex sm:hidden items-center gap-1.5 shrink-0 ml-1">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className={`w-7.5 h-7.5 rounded-full border text-xs font-normal transition-all duration-150 active:scale-95 cursor-pointer inline-flex items-center justify-center shrink-0 group/del ${deleteBtn}`}
                title="Delete Card"
                aria-label="Delete Card"
              >
                <svg className="w-3.5 h-3.5 shrink-0 opacity-80 group-hover/del:opacity-100 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-7.5 h-7.5 rounded-full flex items-center justify-center transition hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Sub Row on mobile / Right cluster on desktop */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0 pt-0.5 sm:pt-0">
            <span className="text-[11px] font-mono text-[#86868b]">
              {card.cardNumber}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEditCard(card)}
                className="px-3 py-1 sm:py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
              >
                Edit Card
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className={`w-8 h-8 rounded-full border text-xs font-normal transition-all duration-150 active:scale-95 cursor-pointer inline-flex items-center justify-center shrink-0 group/del ${deleteBtn}`}
                  title="Delete Card"
                  aria-label="Delete Card"
                >
                  <svg className="w-3.5 h-3.5 shrink-0 opacity-80 group-hover/del:opacity-100 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer ml-1"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          {/* Top Banner: Metrics Summary Card */}
          <div className="p-4 sm:p-6 rounded-[20px] sm:rounded-[22px] border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] space-y-4 sm:space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#86868b] block truncate">
                  Total Loan / Value
                </span>
                <span className="text-lg sm:text-2xl font-bold font-mono tracking-tight mt-1 block truncate">
                  ₹{totalLoanValue.toLocaleString()}
                </span>
                <span className="text-[10px] sm:text-[11px] text-[#86868b] mt-0.5 block truncate">
                  {card.totalEmis} Total Months
                </span>
              </div>

              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#86868b] block truncate">
                  Total Paid
                </span>
                <span className="text-lg sm:text-2xl font-bold font-mono tracking-tight text-emerald-500 mt-1 block truncate">
                  ₹{totalPaidValue.toLocaleString()}
                </span>
                <span className="text-[10px] sm:text-[11px] text-[#86868b] font-medium mt-0.5 block truncate">
                  {card.paidEmis} of {card.totalEmis} EMIs Paid
                </span>
              </div>

              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#86868b] block truncate">
                  Balance to Pay
                </span>
                <span className="text-lg sm:text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 mt-1 block truncate">
                  ₹{balanceValue.toLocaleString()}
                </span>
                <span className="text-[10px] sm:text-[11px] text-[#86868b] mt-0.5 block truncate">
                  {remainingMonths} {remainingMonths === 1 ? 'Month' : 'Months'} Left
                </span>
              </div>

              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#86868b] block truncate">
                  Monthly Installment
                </span>
                <span className="text-lg sm:text-2xl font-bold font-mono tracking-tight mt-1 block truncate">
                  ₹{card.monthlyEmi.toLocaleString()}
                </span>
                <span className="text-[10px] sm:text-[11px] text-[#86868b] mt-0.5 block truncate">
                  Due on {card.emiDueDay}th monthly
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-[#86868b]">
                  Repayment Progress: <strong className="text-[#1d1d1f] dark:text-white font-mono">{progressPercent}%</strong>
                </span>
                <span className="text-[11px] text-[#86868b]">
                  {card.paidEmis} Completed / {remainingMonths} Remaining
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Next Due Callout Action */}
            {nextUnpaid && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 text-zinc-800 dark:text-zinc-200 shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold block text-zinc-900 dark:text-zinc-100 truncate">
                      Next Due: EMI #{nextUnpaid.emiNumber} on {formatDisplayDate(nextUnpaid.dueDate)}
                    </span>
                    <span className="text-[11px] text-[#86868b] font-mono block">
                      Amount: ₹{nextUnpaid.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenPayEmi(card, nextUnpaid.emiNumber)}
                  className="w-full sm:w-auto px-4.5 py-2 rounded-full text-xs font-semibold transition shadow-xs cursor-pointer shrink-0 text-center active:scale-95 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 border border-zinc-950 dark:border-white"
                >
                  Pay Next EMI (₹{nextUnpaid.amount.toLocaleString()})
                </button>
              </div>
            )}
          </div>

          {/* Full EMI Schedule / Installment Inbox */}
          <div className="space-y-3">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 sm:gap-2">
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  Full EMI Schedule Statement
                </h3>
                <p className="text-[11px] sm:text-xs text-[#86868b]">
                  Complete list of paid installments and future scheduled dates
                </p>
              </div>
              <span className="self-start xs:self-auto text-[11px] sm:text-xs font-mono text-[#86868b] px-2.5 py-0.5 rounded-full border border-black/[0.08] dark:border-white/[0.08] shrink-0">
                {card.totalEmis} Installments
              </span>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className={`border-b border-black/[0.06] dark:border-white/[0.08] ${tableHeaderBg}`}>
                    <tr>
                      <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-semibold uppercase tracking-wider text-[10px]">EMI #</th>
                      <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-semibold uppercase tracking-wider text-[10px]">Due Date</th>
                      <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-semibold uppercase tracking-wider text-[10px]">Amount</th>
                      <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                      <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-semibold uppercase tracking-wider text-[10px]">Paid Date</th>
                      <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-semibold uppercase tracking-wider text-[10px]">Transaction ID</th>
                      <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-semibold uppercase tracking-wider text-[10px] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                    {scheduleRows.map((row) => {
                      const isPaid = row.status === 'PAID'
                      const isOverdue = row.status === 'OVERDUE'
                      const isDueSoon = row.status === 'DUE_SOON'

                      return (
                        <tr key={row.emiNumber} className={`transition-colors ${rowBorder}`}>
                          <td className="py-2.5 px-3 sm:py-3 sm:px-4 font-mono font-medium">
                            EMI #{row.emiNumber}
                          </td>
                          <td className="py-2.5 px-3 sm:py-3 sm:px-4 font-mono">
                            {formatDisplayDate(row.dueDate)}
                          </td>
                          <td className="py-2.5 px-3 sm:py-3 sm:px-4 font-mono font-semibold">
                            ₹{row.amount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 sm:py-3 sm:px-4">
                            {isPaid ? (
                              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white bg-emerald-600 shadow-2xs">
                                Paid
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white bg-rose-600 shadow-2xs">
                                Overdue
                              </span>
                            ) : isDueSoon ? (
                              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium text-black bg-amber-400 border border-amber-400 shadow-2xs">
                                Due Soon
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white bg-[#080808] border border-white/10 shadow-2xs">
                                Upcoming
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 sm:py-3 sm:px-4 font-mono text-zinc-600 dark:text-zinc-400">
                            {row.paidRecord?.paidDate
                              ? formatDisplayDate(row.paidRecord.paidDate)
                              : isPaid
                              ? formatDisplayDate(row.dueDate)
                              : '—'}
                          </td>
                          <td className="py-2.5 px-3 sm:py-3 sm:px-4 font-mono text-[11px] truncate max-w-[150px]">
                            {row.paidRecord?.transactionId || '—'}
                          </td>
                          <td className="py-2.5 px-3 sm:py-3 sm:px-4 text-right">
                            {isPaid ? (
                              row.paidRecord ? (
                                <button
                                  type="button"
                                  onClick={() => onDeletePayment(row.paidRecord!.id)}
                                  className="text-[11px] text-zinc-400 hover:text-rose-500 hover:underline cursor-pointer transition-colors"
                                  title="Revert payment"
                                >
                                  Undo
                                </button>
                              ) : (
                                <span className="text-[11px] text-zinc-400">Recorded</span>
                              )
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenPayEmi(card, row.emiNumber)}
                                className="px-3 py-1 rounded-full text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
                              >
                                <span>Pay</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Card Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          setShowDeleteModal(false)
          onDeleteCard(card)
        }}
        title="Delete Card"
        message={`Are you sure you want to delete "${card.cardName}" (${card.bankName} •••• ${card.cardNumber.slice(-4)})? All recorded EMI payments will also be deleted. This cannot be undone.`}
        confirmText="Delete Card"
        cancelText="Cancel"
        theme={theme}
      />
    </div>
  )
}
