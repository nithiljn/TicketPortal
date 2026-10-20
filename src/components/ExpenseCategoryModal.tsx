'use client'

import React, { useState, useEffect } from 'react'

interface ExpenseCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateCategory: (name: string) => Promise<void>
  onDeleteCategory?: (name: string) => Promise<void>
  existingCategories: string[]
  theme?: 'dark' | 'light'
}

const CATEGORY_SUGGESTIONS = [
  'Team Lunch',
  'Software Licenses',
  'Hosting & Infra',
  'Office Stationery',
  'Client Dinners',
  'Travel & Cabs',
  'Advertising & PR',
  'Hardware & Gadgets',
  'Training & Courses',
]

const DEFAULT_LOCKED = [
  'Food & Dining',
  'Travel & Transport',
  'Software & Subscriptions',
  'Office Supplies',
  'Cloud & Hosting',
  'Marketing & Ads',
  'Bills & Utilities',
  'Personal',
  'Miscellaneous',
]

export function ExpenseCategoryModal({
  isOpen,
  onClose,
  onCreateCategory,
  onDeleteCategory,
  existingCategories,
  theme = 'light',
}: ExpenseCategoryModalProps) {
  const [categoryName, setCategoryName] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingName, setDeletingName] = useState<string | null>(null)
  const [error, setError] = useState('')

  const isDark = theme === 'dark'

  useEffect(() => {
    if (isOpen) {
      setCategoryName('')
      setError('')
      setDeletingName(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = categoryName.trim()
    if (!trimmed) {
      setError('Please enter a category name.')
      return
    }
    if (
      existingCategories.some(
        (c) => c.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setError(`Category "${trimmed}" already exists.`)
      return
    }

    setLoading(true)
    setError('')
    try {
      await onCreateCategory(trimmed)
      setCategoryName('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create category.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (cat: string) => {
    if (!onDeleteCategory) return
    setDeletingName(cat)
    try {
      await onDeleteCategory(cat)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete category.'
      setError(msg)
    } finally {
      setDeletingName(null)
    }
  }

  // Apple Design System Surface & Input Tokens (DESIGN.md)
  const overlayBg = 'bg-black/40 backdrop-blur-md'
  const modalBg = isDark
    ? 'bg-[#1c1c1e] border-white/[0.08] text-[#f5f5f7] shadow-2xl'
    : 'bg-white border-[#e5e5ea] text-[#1d1d1f] shadow-2xl'
  const inputBg = isDark
    ? 'bg-white/[0.04] border-white/[0.08] text-[#f5f5f7] placeholder-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/20'
    : 'bg-white border-[#e5e5ea] text-[#1d1d1f] placeholder-[#86868b] focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 shadow-2xs'
  const borderBottom = isDark ? 'border-white/[0.08]' : 'border-[#e5e5ea]'
  const appleGhostBtn = isDark
    ? 'border-white/[0.08] hover:border-white/[0.18] bg-white/[0.04] hover:bg-white/[0.08] text-[#f5f5f7]'
    : 'border-[#e5e5ea] hover:border-[#d2d2d7] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] shadow-2xs'

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${overlayBg} animate-in fade-in duration-150`}>
      <div className={`w-full max-w-lg rounded-[24px] border ${modalBg} flex flex-col max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className={`px-5 sm:px-6 py-4 border-b ${borderBottom} flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 border ${
              isDark
                ? 'bg-white/[0.08] border-white/[0.1] text-white'
                : 'bg-[#f5f5f7] border-black/[0.08] text-[#1d1d1f]'
            }`}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight truncate">Expense Categories</h2>
              <p className="text-[11px] text-[#86868b] dark:text-[#a1a1a6] truncate mt-0.5">
                Create & organize custom spending categories
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-scrollbar">
          {error && (
            <div className="p-3.5 rounded-[12px] bg-[#ff3b30]/10 border border-[#ff3b30]/20 text-[#ff3b30] dark:text-[#ff453a] text-xs">
              {error}
            </div>
          )}

          {/* Create Category Form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6]">
              Create New Category
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Category name (e.g. Server Bills, Office Snacks)..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className={`flex-1 rounded-[12px] border px-3.5 py-2 text-xs focus:outline-none transition ${inputBg}`}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !categoryName.trim()}
                className="px-4 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 active:scale-95"
              >
                {loading ? 'Adding...' : '+ Add Category'}
              </button>
            </div>
          </form>

          {/* Quick Suggestions */}
          <div>
            <span className="text-[11px] text-[#86868b] dark:text-[#a1a1a6] mb-1.5 block">Quick ideas:</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_SUGGESTIONS.filter(
                (s) => !existingCategories.includes(s)
              ).slice(0, 6).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCategoryName(s)}
                  className="text-xs px-3 py-1 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-[#f5f5f7] dark:bg-white/[0.06] hover:border-[#0071e3] text-[#1d1d1f] dark:text-[#f5f5f7] transition-all cursor-pointer active:scale-95"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Existing Categories List */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6] mb-2.5 block">
              Active Categories ({existingCategories.length})
            </span>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {existingCategories.map((cat) => {
                const isLocked = DEFAULT_LOCKED.includes(cat)
                const isDel = deletingName === cat
                return (
                  <div
                    key={cat}
                    className={`flex items-center justify-between px-3.5 py-2 rounded-[14px] border text-xs ${
                      isDark
                        ? 'bg-white/[0.03] border-white/[0.06] text-[#f5f5f7]'
                        : 'bg-[#f5f5f7]/60 border-[#e5e5ea] text-[#1d1d1f]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{cat}</span>
                      {isLocked && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06] text-[#86868b]">
                          System
                        </span>
                      )}
                    </div>
                    {!isLocked && onDeleteCategory && (
                      <button
                        onClick={() => handleDelete(cat)}
                        disabled={isDel}
                        className="text-xs text-[#86868b] hover:text-[#ff3b30] dark:hover:text-[#ff453a] transition cursor-pointer disabled:opacity-50 active:scale-95"
                      >
                        {isDel ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-5 sm:px-6 py-4 border-t ${borderBottom} flex justify-end`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-full border text-xs font-medium cursor-pointer active:scale-95 transition-all ${appleGhostBtn}`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
