'use client'

import React, { useState, useEffect } from 'react'
import { Card, CreateCardInput } from '@/types'

interface CreateCardModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (input: CreateCardInput) => Promise<void>
  existingCard?: Card | null
  availableProjects: string[]
  currentWorkspace?: string
  theme?: 'dark' | 'light'
}

const POPULAR_BANKS = [
  'HDFC Bank',
  'ICICI Bank',
  'SBI Card',
  'Axis Bank',
  'Kotak Mahindra',
  'American Express',
  'OneCard',
  'RBL Bank',
  'Federal Bank',
  'Custom',
]

export const CARD_COLORS: Record<
  string,
  { label: string; gradient: string; border: string; accent: string; preview: string }
> = {
  black: {
    label: 'Obsidian Titanium',
    gradient: 'from-[#141517] via-[#1a1c20] to-[#0a0a0b]',
    border: 'border-white/[0.12]',
    accent: '#f5f5f7',
    preview: '#1a1c20',
  },
  blue: {
    label: 'Royal Sapphire',
    gradient: 'from-[#0a2540] via-[#0d3b66] to-[#081a2e]',
    border: 'border-blue-400/30',
    accent: '#60a5fa',
    preview: '#0d3b66',
  },
  emerald: {
    label: 'Emerald Matrix',
    gradient: 'from-[#062c20] via-[#0b4a36] to-[#041c14]',
    border: 'border-emerald-400/30',
    accent: '#34d399',
    preview: '#0b4a36',
  },
  purple: {
    label: 'OneCard Violet',
    gradient: 'from-[#2e1065] via-[#4c1d95] to-[#1e0845]',
    border: 'border-purple-400/30',
    accent: '#c084fc',
    preview: '#4c1d95',
  },
  ruby: {
    label: 'Crimson Ruby',
    gradient: 'from-[#4c0519] via-[#881337] to-[#2b020d]',
    border: 'border-rose-400/30',
    accent: '#fb7185',
    preview: '#881337',
  },
  silver: {
    label: 'Apple Silver',
    gradient: 'from-[#374151] via-[#4b5563] to-[#1f2937]',
    border: 'border-white/20',
    accent: '#e5e7eb',
    preview: '#4b5563',
  },
}

function generateRandomCardNumber(bankName: string): string {
  // Common BIN prefix based on bank
  let bin = '4532'
  if (bankName.includes('HDFC')) bin = '4111'
  else if (bankName.includes('ICICI')) bin = '4532'
  else if (bankName.includes('SBI')) bin = '5241'
  else if (bankName.includes('Axis')) bin = '4628'
  else if (bankName.includes('Amex')) bin = '3782'
  else if (bankName.includes('OneCard')) bin = '4862'

  const randomPart = Math.floor(1000 + Math.random() * 9000).toString()
  const last4 = Math.floor(1000 + Math.random() * 9000).toString()

  // Format: 4532 •••• •••• 8821
  return `${bin} •••• •••• ${last4}`
}

function calculateEndDate(startDateStr: string, totalMonths: number): string {
  try {
    const [y, m, d] = startDateStr.split('-').map(Number)
    if (!y || !m || !d) return startDateStr
    const dt = new Date(y, m - 1 + (Math.max(1, totalMonths) - 1), d)
    return dt.toISOString().split('T')[0]
  } catch {
    return startDateStr
  }
}

export function CreateCardModal({
  isOpen,
  onClose,
  onSave,
  existingCard,
  availableProjects,
  currentWorkspace = 'Personal',
  theme = 'light',
}: CreateCardModalProps) {
  const isDark = theme === 'dark'

  const [bankName, setBankName] = useState('HDFC Bank')
  const [customBankName, setCustomBankName] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [description, setDescription] = useState('')
  const [cardLimit, setCardLimit] = useState('')
  const [cardLimitUsed, setCardLimitUsed] = useState('')
  const [cardColor, setCardColor] = useState('black')
  const [monthlyEmi, setMonthlyEmi] = useState('')
  const [totalEmis, setTotalEmis] = useState('12')
  const [paidEmis, setPaidEmis] = useState('0')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [emiDueDay, setEmiDueDay] = useState('5')
  const [projectName, setProjectName] = useState(currentWorkspace === 'ALL' ? 'Personal' : currentWorkspace)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Prefill or generate card defaults
  useEffect(() => {
    if (existingCard) {
      if (POPULAR_BANKS.includes(existingCard.bankName)) {
        setBankName(existingCard.bankName)
        setCustomBankName('')
      } else {
        setBankName('Custom')
        setCustomBankName(existingCard.bankName)
      }
      setCardName(existingCard.cardName)
      setCardNumber(existingCard.cardNumber)
      setDescription(existingCard.description || '')
      setCardLimit(existingCard.cardLimit ? String(existingCard.cardLimit) : '')
      setCardLimitUsed(existingCard.cardLimitUsed ? String(existingCard.cardLimitUsed) : '')
      setCardColor(existingCard.cardColor || 'black')
      setMonthlyEmi(String(existingCard.monthlyEmi))
      setTotalEmis(String(existingCard.totalEmis))
      setPaidEmis(String(existingCard.paidEmis || 0))
      setStartDate(existingCard.startDate)
      setEmiDueDay(String(existingCard.emiDueDay))
      setProjectName(existingCard.projectName || 'Personal')
    } else {
      setBankName('HDFC Bank')
      setCustomBankName('')
      setCardName('')
      setCardNumber(generateRandomCardNumber('HDFC Bank'))
      setDescription('')
      setCardLimit('150000')
      setCardLimitUsed('')
      setCardColor('black')
      setMonthlyEmi('')
      setTotalEmis('12')
      setPaidEmis('0')
      setStartDate(new Date().toISOString().split('T')[0])
      setEmiDueDay('5')
      setProjectName(currentWorkspace === 'ALL' ? 'Personal' : currentWorkspace)
    }
    setErrorMsg('')
  }, [existingCard, isOpen, currentWorkspace])

  if (!isOpen) return null

  const resolvedBankName = bankName === 'Custom' ? customBankName.trim() : bankName
  const computedEndDate = calculateEndDate(startDate, Number(totalEmis) || 12)
  const totalLoanValue = (Number(monthlyEmi) || 0) * (Number(totalEmis) || 0)
  const totalPaidValue = (Number(monthlyEmi) || 0) * (Number(paidEmis) || 0)
  const balanceValue = Math.max(0, totalLoanValue - totalPaidValue)

  const handleBankChange = (newBank: string) => {
    setBankName(newBank)
    if (!existingCard) {
      setCardNumber(generateRandomCardNumber(newBank))
    }
  }

  const handleRandomizeCardNumber = () => {
    setCardNumber(generateRandomCardNumber(resolvedBankName || 'Card'))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!resolvedBankName) {
      setErrorMsg('Please specify bank name')
      return
    }

    if (!cardName.trim()) {
      setErrorMsg('Please enter an EMI name (e.g. "Bike EMI", "Personal EMI")')
      return
    }

    const emiAmount = Number(monthlyEmi)
    if (!emiAmount || emiAmount <= 0) {
      setErrorMsg('Please enter a valid monthly EMI amount')
      return
    }

    const tenure = Number(totalEmis)
    if (!tenure || tenure <= 0) {
      setErrorMsg('Please enter total number of EMIs (tenure)')
      return
    }

    const day = Number(emiDueDay)
    if (!day || day < 1 || day > 31) {
      setErrorMsg('EMI due day must be between 1 and 31')
      return
    }

    setIsSubmitting(true)
    try {
      await onSave({
        bankName: resolvedBankName,
        cardName: cardName.trim(),
        cardNumber: cardNumber.trim() || generateRandomCardNumber(resolvedBankName),
        description: description.trim() || undefined,
        cardLimit: Number(cardLimit) || 0,
        cardLimitUsed: Number(cardLimitUsed) || Number(monthlyEmi) || 0,
        cardColor,
        monthlyEmi: emiAmount,
        totalEmis: tenure,
        paidEmis: Number(paidEmis) || 0,
        startDate,
        endDate: computedEndDate,
        emiDueDay: day,
        projectName: projectName || 'Personal',
      })
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save card'
      setErrorMsg(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const colorConfig = CARD_COLORS[cardColor] || CARD_COLORS.black
  const cardBg = isDark ? 'bg-[#1c1c1e] text-white border-white/[0.08]' : 'bg-white text-zinc-900 border-black/[0.08]'
  const inputBg = isDark
    ? 'bg-white/[0.06] border-white/[0.1] text-white placeholder-zinc-500 focus:border-[#0071e3]'
    : 'bg-[#f5f5f7] border-black/[0.08] text-zinc-900 placeholder-zinc-400 focus:border-[#0071e3]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl rounded-[24px] border shadow-2xl overflow-hidden transition-all my-auto ${cardBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {existingCard ? 'Edit EMI Card' : 'Create New EMI Card'}
            </h2>
            <p className="text-xs text-[#86868b] mt-0.5">
              Add credit card details, EMI tenure, and monthly debit dates
            </p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
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

          {/* Interactive Live Card Preview */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-2 self-start">
              Live Card Preview
            </span>
            <div
              className={`w-full max-w-[360px] h-[200px] rounded-[18px] p-5 border text-white relative shadow-xl overflow-hidden bg-gradient-to-br ${colorConfig.gradient} ${colorConfig.border} flex flex-col justify-between`}
            >
              {/* Background ambient light */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

              {/* Top Row: Bank & Chip */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-wider text-xs uppercase font-mono">
                    {resolvedBankName || 'BANK NAME'}
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

              {/* Middle: EMV Chip + Card Number */}
              <div className="space-y-3 relative z-10">
                <div className="w-9 h-7 rounded-md bg-gradient-to-r from-amber-200 to-yellow-400 border border-yellow-500/50 shadow-inner flex items-center justify-center opacity-90">
                  <div className="w-6 h-4 border border-black/20 rounded-xs" />
                </div>
                <div className="font-mono text-base tracking-[0.18em] font-medium drop-shadow-sm">
                  {cardNumber || '4532 •••• •••• 8821'}
                </div>
              </div>

              {/* Bottom Row: Name & Expiry */}
              <div className="flex items-end justify-between relative z-10 text-xs">
                <div>
                  <div className="text-[9px] uppercase tracking-wider opacity-60">EMI Title</div>
                  <div className="font-semibold tracking-wide truncate max-w-[190px]">
                    {cardName || 'e.g. BIKE EMI'}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[9px] uppercase tracking-wider opacity-60">Ends</div>
                  <div className="font-medium text-[11px]">{computedEndDate || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Color Palette Chooser */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-2">
              Card Color Theme
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Object.entries(CARD_COLORS).map(([key, item]) => {
                const isSelected = cardColor === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCardColor(key)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'border-[#0071e3] ring-2 ring-[#0071e3]/30 bg-blue-500/10'
                        : 'border-black/[0.08] dark:border-white/[0.08] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full shadow-sm border border-white/20"
                      style={{ backgroundColor: item.preview }}
                    />
                    <span className="text-[10px] font-medium truncate max-w-full">{item.label.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 1: Bank & Card Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                Bank / Card Company *
              </label>
              <select
                value={bankName}
                onChange={(e) => handleBankChange(e.target.value)}
                className={`w-full h-10 px-3 rounded-xl border text-xs font-medium outline-none cursor-pointer ${inputBg}`}
              >
                {POPULAR_BANKS.map((bank) => (
                  <option key={bank} value={bank} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            {bankName === 'Custom' ? (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                  Custom Bank Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Chartered"
                  value={customBankName}
                  onChange={(e) => setCustomBankName(e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl border text-xs outline-none ${inputBg}`}
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                  Card Name / Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BIKE EMI, iPhone 16 EMI"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl border text-xs outline-none ${inputBg}`}
                />
              </div>
            )}
          </div>

          {bankName === 'Custom' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                Card Name / Purpose *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BIKE EMI, iPhone 16 EMI"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className={`w-full h-10 px-3 rounded-xl border text-xs outline-none ${inputBg}`}
              />
            </div>
          )}

          {/* Card Number & Randomizer */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                Card Number (Auto-Generated / Masked)
              </label>
              <button
                type="button"
                onClick={handleRandomizeCardNumber}
                className="text-[11px] text-[#0071e3] dark:text-[#2997ff] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>🎲 Randomize</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="4532 •••• •••• 8821"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className={`w-full h-10 px-3 font-mono text-xs rounded-xl border outline-none ${inputBg}`}
            />
            <p className="text-[10px] text-[#86868b] mt-1">
              Maintains real card structure while masking middle numbers for security.
            </p>
          </div>

          {/* Credit Limit & Used Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                Total Card Limit (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 150000"
                value={cardLimit}
                onChange={(e) => setCardLimit(e.target.value)}
                className={`w-full h-10 px-3 text-xs rounded-xl border outline-none font-mono ${inputBg}`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                Card Limit Used / Blocked (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 45000"
                value={cardLimitUsed}
                onChange={(e) => setCardLimitUsed(e.target.value)}
                className={`w-full h-10 px-3 text-xs rounded-xl border outline-none font-mono ${inputBg}`}
              />
            </div>
          </div>

          {/* Section 2: EMI Financials & Dates */}
          <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-1.5">
              <span>EMI Installment Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                  Monthly EMI (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 6500"
                  value={monthlyEmi}
                  onChange={(e) => setMonthlyEmi(e.target.value)}
                  className={`w-full h-10 px-3 text-xs rounded-xl border outline-none font-mono ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                  Total EMIs (Months) *
                </label>
                <select
                  value={totalEmis}
                  onChange={(e) => setTotalEmis(e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl border text-xs font-medium outline-none cursor-pointer ${inputBg}`}
                >
                  {[3, 6, 9, 12, 18, 24, 36, 48, 60].map((m) => (
                    <option key={m} value={m} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}>
                      {m} Months
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                  Paid EMIs (So Far)
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalEmis}
                  value={paidEmis}
                  onChange={(e) => setPaidEmis(e.target.value)}
                  className={`w-full h-10 px-3 text-xs rounded-xl border outline-none font-mono ${inputBg}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full h-10 px-3 text-xs rounded-xl border outline-none ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                  EMI Due Day (1-31) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  placeholder="e.g. 5"
                  value={emiDueDay}
                  onChange={(e) => setEmiDueDay(e.target.value)}
                  className={`w-full h-10 px-3 text-xs rounded-xl border outline-none font-mono ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                  End Date (Auto)
                </label>
                <input
                  type="text"
                  disabled
                  value={computedEndDate}
                  className={`w-full h-10 px-3 text-xs rounded-xl border outline-none font-mono opacity-70 ${inputBg}`}
                />
              </div>
            </div>

            {/* Calculations Summary Card */}
            {totalLoanValue > 0 && (
              <div className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#86868b]">Total Payable: </span>
                  <strong className="font-mono font-semibold">₹{totalLoanValue.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-[#86868b]">Paid: </span>
                  <span className="text-emerald-500 font-mono font-medium">₹{totalPaidValue.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[#86868b]">Balance: </span>
                  <span className="text-rose-500 font-mono font-medium">₹{balanceValue.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Optional Notes & Workspace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                Workspace / Category Folder
              </label>
              <select
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={`w-full h-10 px-3 rounded-xl border text-xs font-medium outline-none cursor-pointer ${inputBg}`}
              >
                {availableProjects
                  .filter((p) => p !== 'ALL')
                  .map((p) => (
                    <option key={p} value={p} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}>
                      {p}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                Description / Purpose (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Royal Enfield Hunter 350 loan"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full h-10 px-3 rounded-xl border text-xs outline-none ${inputBg}`}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-black/[0.06] dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-full border text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] active:scale-95 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : existingCard ? 'Update Card' : 'Create Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
