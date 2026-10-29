'use client'

import React, { useState, useMemo } from 'react'
import { Card } from '@/types'
import { CARD_COLORS, getCardColorConfig } from '@/components/CreateCardModal'

interface ExpenseCardsViewProps {
  cards: Card[]
  selectedProject: string
  onOpenCreateCard: () => void
  onOpenCardDetail: (card: Card) => void
  onOpenPayEmi: (card: Card) => void
  onEditCard: (card: Card) => void
  onDeleteCard: (card: Card) => void
  theme?: 'dark' | 'light'
}

function formatMoney(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

function formatCardDueNotice(dueDay: number) {
  const today = new Date()
  const currentDay = today.getDate()
  const daysDiff = dueDay - currentDay

  if (daysDiff === 0) {
    return { label: 'Due Today! ⚠️', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse' }
  } else if (daysDiff > 0 && daysDiff <= 7) {
    return {
      label: `Due on ${dueDay}th (in ${daysDiff}d)`,
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    }
  } else if (daysDiff < 0 && daysDiff >= -5) {
    return {
      label: `Due day passed (${dueDay}th)`,
      color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    }
  }
  return {
    label: `Due on ${dueDay}th monthly`,
    color: 'bg-black/5 dark:bg-white/10 text-[#86868b] border-black/10 dark:border-white/10',
  }
}

export function ExpenseCardsView({
  cards,
  selectedProject,
  onOpenCreateCard,
  onOpenCardDetail,
  onOpenPayEmi,
  onEditCard,
  onDeleteCard,
  theme = 'light',
}: ExpenseCardsViewProps) {
  const isDark = theme === 'dark'
  const [searchQuery, setSearchQuery] = useState('')

  // Filter cards by workspace and search
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchProject = selectedProject === 'ALL' || card.projectName === selectedProject
      const matchSearch =
        !searchQuery.trim() ||
        card.cardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.cardNumber.toLowerCase().includes(searchQuery.toLowerCase())
      return matchProject && matchSearch
    })
  }, [cards, selectedProject, searchQuery])

  // Summary Metrics
  const summary = useMemo(() => {
    let totalMonthlyCommitment = 0
    let totalRemainingBalance = 0
    let totalPaidValue = 0

    filteredCards.forEach((c) => {
      totalMonthlyCommitment += c.monthlyEmi
      const totalLoan = c.monthlyEmi * c.totalEmis
      const paid = c.monthlyEmi * c.paidEmis
      totalPaidValue += paid
      totalRemainingBalance += Math.max(0, totalLoan - paid)
    })

    return {
      totalMonthlyCommitment,
      totalRemainingBalance,
      totalPaidValue,
      activeCardsCount: filteredCards.filter((c) => c.isActive).length,
    }
  }, [filteredCards])

  const subHeaderBorder = isDark ? 'border-white/[0.08] bg-[#000000]' : 'border-black/[0.06] bg-[#f5f5f7]'
  const cardBg = isDark ? 'bg-[#18181b] border-white/[0.08]' : 'bg-white border-black/[0.08]'
  const appleCapsule = isDark
    ? 'bg-white/[0.04] text-[#ebebf5]/70 border-white/[0.08]'
    : 'bg-black/[0.04] text-[#1d1d1f]/70 border-black/[0.06]'

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-[#f5f5f7] dark:bg-[#000000] font-sans">
      {/* Sub-header Filter & Info Bar */}
      <div
        className={`sticky top-0 z-20 px-4 sm:px-6 py-2.5 sm:py-3 border-b flex items-center justify-between text-xs shrink-0 ${subHeaderBorder}`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm tracking-tight text-[#1d1d1f] dark:text-white">
            {selectedProject === 'ALL' ? 'All Workspaces' : selectedProject}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-normal border transition-colors ${
              isDark
                ? 'bg-white/[0.06] text-[#ebebf5]/70 border-white/[0.08]'
                : 'bg-black/[0.04] text-[#1d1d1f]/70 border-black/[0.06]'
            }`}
          >
            <span className="font-mono font-medium">{filteredCards.length}</span>
            <span className={isDark ? 'text-[#ebebf5]/40 text-[11px]' : 'text-[#1d1d1f]/40 text-[11px]'}>
              {filteredCards.length === 1 ? 'card' : 'cards'}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`h-8.5 pl-8 pr-3 text-xs rounded-full border outline-none transition-all w-36 sm:w-48 ${
                isDark
                  ? 'bg-white/[0.06] border-white/[0.1] text-white focus:w-56'
                  : 'bg-white border-black/[0.08] text-zinc-900 focus:w-56'
              }`}
            />
            <svg
              className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#86868b] pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Top Summary Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-5 rounded-[20px] border shadow-xs ${cardBg}`}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] block">
              Monthly Commitment
            </span>
            <div className="text-2xl font-bold font-mono tracking-tight mt-1">
              {formatMoney(summary.totalMonthlyCommitment)}
            </div>
            <span className="text-[11px] text-[#86868b] mt-1 block">
              Total debited every month
            </span>
          </div>

          <div className={`p-5 rounded-[20px] border shadow-xs ${cardBg}`}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] block">
              Total Outstanding Balance
            </span>
            <div className="text-2xl font-bold font-mono tracking-tight text-rose-500 mt-1">
              {formatMoney(summary.totalRemainingBalance)}
            </div>
            <span className="text-[11px] text-[#86868b] mt-1 block">
              Remaining debt across cards
            </span>
          </div>

          <div className={`p-5 rounded-[20px] border shadow-xs ${cardBg}`}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] block">
              Total Repaid So Far
            </span>
            <div className="text-2xl font-bold font-mono tracking-tight text-emerald-500 mt-1">
              {formatMoney(summary.totalPaidValue)}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">
              Successful payments
            </span>
          </div>

          <div className={`p-5 rounded-[20px] border shadow-xs ${cardBg}`}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] block">
              Active Cards / EMIs
            </span>
            <div className="text-2xl font-bold font-mono tracking-tight mt-1">
              {summary.activeCardsCount}
            </div>
            <span className="text-[11px] text-[#86868b] mt-1 block">
              {filteredCards.length} Total Registered
            </span>
          </div>
        </div>

        {/* Cards Grid */}
        {filteredCards.length === 0 ? (
          <div className={`p-12 text-center rounded-[24px] border border-dashed border-black/10 dark:border-white/10 ${cardBg}`}>
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-[#0071e3]/10 text-[#0071e3] mb-4">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <h3 className="text-base font-semibold">No EMI Cards Found</h3>
            <p className="text-xs text-[#86868b] max-w-sm mx-auto mt-1 mb-5">
              Track your credit card EMIs (Bike, Mobile, Laptop, Loan), see upcoming due dates, and record payments with transaction IDs.
            </p>
            <button
              type="button"
              onClick={onOpenCreateCard}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] active:scale-95 transition shadow-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create Your First Card</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCards.map((card) => {
              const colorConfig = getCardColorConfig(card.cardColor)
              const totalLoan = card.monthlyEmi * card.totalEmis
              const totalPaid = card.monthlyEmi * card.paidEmis
              const balance = Math.max(0, totalLoan - totalPaid)
              const remainingMonths = Math.max(0, card.totalEmis - card.paidEmis)
              const progressPercent = Math.min(100, Math.round((card.paidEmis / card.totalEmis) * 100))
              const dueNotice = formatCardDueNotice(card.emiDueDay)

              return (
                <div
                  key={card.id}
                  onDoubleClick={() => onOpenCardDetail(card)}
                  className={`rounded-[24px] border transition-all duration-200 overflow-hidden flex flex-col justify-between group shadow-sm hover:shadow-lg ${cardBg}`}
                >
                  {/* Top: Realistic 3D Apple-style Credit Card Surface */}
                  <div className="p-4 sm:p-5">
                    <div
                      className={`w-full h-[200px] rounded-[20px] p-5 text-white relative shadow-lg overflow-hidden transition-transform duration-300 group-hover:scale-[1.02] flex flex-col justify-between select-none cursor-pointer ${
                        colorConfig.gradient ? `bg-gradient-to-br ${colorConfig.gradient}` : ''
                      } ${colorConfig.border} border`}
                      style={colorConfig.style}
                      title="Double-click to view complete EMI statement & payment schedule"
                    >
                      {/* Ambient light overlay */}
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

                      {/* Top Row: Bank & Chip */}
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="font-bold tracking-wider text-xs uppercase font-mono drop-shadow-sm">
                            {card.bankName}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md uppercase font-semibold">
                            EMI
                          </span>
                        </div>
                        {/* Contactless waves */}
                        <svg className="w-5 h-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8.5 16.5a5 5 0 0 1 0-7" />
                          <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                          <path d="M15.5 21.5a12 12 0 0 0 0-19" />
                        </svg>
                      </div>

                      {/* Middle: EMV Chip + Masked Card Number */}
                      <div className="space-y-2 relative z-10">
                        <div className="w-9 h-7 rounded-md bg-gradient-to-r from-amber-200 to-yellow-400 border border-yellow-500/50 shadow-inner flex items-center justify-center opacity-90">
                          <div className="w-6 h-4 border border-black/20 rounded-xs" />
                        </div>
                        <div className="font-mono text-base tracking-[0.18em] font-medium drop-shadow-sm">
                          {card.cardNumber}
                        </div>
                      </div>

                      {/* Bottom Row: Title & Monthly EMI */}
                      <div className="flex items-end justify-between relative z-10 text-xs">
                        <div className="min-w-0 pr-2">
                          <div className="text-[9px] uppercase tracking-wider opacity-70">Card Name</div>
                          <div className="font-semibold tracking-wide truncate max-w-[160px]">
                            {card.cardName}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[9px] uppercase tracking-wider opacity-70">Monthly EMI</div>
                          <div className="font-bold font-mono text-sm">
                            {formatMoney(card.monthlyEmi)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Financial Details & Progress */}
                  <div className="px-5 pb-5 pt-0 space-y-4">
                    {/* Status & Due Date Chips */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${dueNotice.color}`}>
                        {dueNotice.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono border ${appleCapsule}`}>
                        #{card.projectName}
                      </span>
                    </div>

                    {/* EMI Counts & Balance Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
                      <div>
                        <span className="text-[10px] text-[#86868b] uppercase tracking-wider block">Paid EMIs</span>
                        <span className="font-semibold text-emerald-500 font-mono text-sm">
                          {card.paidEmis} / {card.totalEmis}
                        </span>
                        <span className="text-[10px] text-[#86868b] block">
                          ({formatMoney(totalPaid)})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#86868b] uppercase tracking-wider block">Remaining</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono text-sm">
                          {remainingMonths} {remainingMonths === 1 ? 'Month' : 'Months'}
                        </span>
                        <span className="text-[10px] text-[#86868b] block">
                          ({formatMoney(balance)})
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[#86868b]">
                        <span>Progress</span>
                        <span className="font-mono font-semibold text-[#1d1d1f] dark:text-white">
                          {progressPercent}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => onOpenCardDetail(card)}
                        className="px-3 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex-1 text-center"
                      >
                        View Statement
                      </button>

                      {card.paidEmis < card.totalEmis ? (
                        <button
                          type="button"
                          onClick={() => onOpenPayEmi(card)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition shadow-2xs cursor-pointer inline-flex items-center justify-center gap-1.5 flex-1"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Pay EMI</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-center flex-1">
                          Completed 🎉
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
