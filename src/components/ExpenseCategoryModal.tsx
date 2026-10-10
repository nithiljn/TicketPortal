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

  const overlayBg = 'bg-black/60 backdrop-blur-sm'
  const modalBg = isDark
    ? 'bg-[#111114] border-white/[0.08] text-zinc-100 shadow-2xl'
    : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
  const inputBg = isDark
    ? 'bg-black/40 border-white/[0.08] text-zinc-100 placeholder-zinc-500 focus:border-emerald-500/60'
    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500'
  const borderBottom = isDark ? 'border-white/[0.06]' : 'border-zinc-200'

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${overlayBg} animate-in fade-in duration-150`}>
      <div className={`w-full max-w-lg rounded-2xl border ${modalBg} flex flex-col max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className={`px-5 py-4 border-b ${borderBottom} flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              isDark
                ? 'bg-zinc-800 border border-zinc-700/80 text-white shadow-xs'
                : 'bg-zinc-900 border border-zinc-800 text-white shadow-xs'
            }`}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold">Expense Categories</h2>
              <p className="text-[11px] text-zinc-500">
                Create & organize custom spending categories
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Create Category Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Create New Category
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Category name (e.g. Server Bills, Office Snacks)..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs focus:outline-none ${inputBg}`}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !categoryName.trim()}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {loading ? 'Adding...' : '+ Add Category'}
              </button>
            </div>
          </form>

          {/* Quick Suggestions */}
          <div>
            <span className="text-[11px] text-zinc-500 mb-1.5 block">Quick ideas:</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_SUGGESTIONS.filter(
                (s) => !existingCategories.includes(s)
              ).slice(0, 6).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCategoryName(s)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                    isDark
                      ? 'border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                      : 'border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Existing Categories List */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 block">
              Active Categories ({existingCategories.length})
            </span>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {existingCategories.map((cat) => {
                const isLocked = DEFAULT_LOCKED.includes(cat)
                const isDel = deletingName === cat
                return (
                  <div
                    key={cat}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                      isDark
                        ? 'bg-black/30 border-white/[0.05] text-zinc-300'
                        : 'bg-zinc-50/70 border-zinc-200 text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-medium">{cat}</span>
                      {isLocked && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-500/10 text-zinc-400">
                          System
                        </span>
                      )}
                    </div>
                    {!isLocked && onDeleteCategory && (
                      <button
                        onClick={() => handleDelete(cat)}
                        disabled={isDel}
                        className="text-[11px] text-rose-400 hover:text-rose-300 transition cursor-pointer disabled:opacity-50"
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
        <div className={`px-5 py-3 border-t ${borderBottom} flex justify-end`}>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
              isDark
                ? 'border-white/[0.08] text-zinc-300 hover:bg-white/[0.04]'
                : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
