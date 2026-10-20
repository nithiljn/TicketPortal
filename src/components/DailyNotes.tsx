'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { DailyNote } from '@/types'

interface DailyNotesProps {
  notes: DailyNote[]
  onAddNote: (content: string, date: string) => Promise<void>
  onUpdateNote?: (id: string, content: string) => Promise<void>
  onDeleteNote: (note: DailyNote) => void
  theme?: 'dark' | 'light'
  initialFilterDate?: string
}

interface PlanItem {
  id: string
  text: string
  completed: boolean
  completedAt?: string
}

interface ParsedTask {
  originalIndex: number
  isCheckbox: boolean
  text: string
  completed: boolean
  completedAt: string | null
  completionTime: string | null
}

const NOTES_LAST_DAY_KEY = 'tp_notes_last_day'

// Format timestamp to localized time (e.g., 8:11 AM, 11:57 PM)
function formatTimelineTime(isoString?: string | null): string {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return ''
  }
}

// Format full date for notebook page header (e.g., Tuesday, Oct 20, 2026)
function formatNotebookDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// Parse checklist statistics from note content
function getNoteStats(content: string) {
  const lines = content.split('\n')
  let total = 0
  let completed = 0

  for (const line of lines) {
    const match = line.match(/^\s*-\s*\[([ xX])\]/)
    if (match) {
      total++
      if (match[1].toLowerCase() === 'x') {
        completed++
      }
    }
  }

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  return { total, completed, percentage }
}

// Parse tasks and separate memo remarks from markdown note content
function parseNoteTasksAndMemos(content: string, noteCreatedAt?: string) {
  const lines = content.split('\n')
  const tasks: ParsedTask[] = []
  const memos: string[] = []
  let inNotesSection = false

  lines.forEach((line, originalIndex) => {
    const trimmed = line.trim()
    if (trimmed.toUpperCase() === 'NOTES:') {
      inNotesSection = true
      return
    }
    if (trimmed.toUpperCase() === "TODAY'S PLANS:") {
      inNotesSection = false
      return
    }

    const isChecked = /^\s*-\s*\[[xX]\]/.test(line)
    const isUnchecked = /^\s*-\s*\[ \]/.test(line)

    if (isChecked || isUnchecked) {
      const match = line.match(/<!--\s*completed(?:At)?:\s*([^\s>]+)\s*-->/i)
      const completedAt = match ? match[1] : null
      const text = line
        .replace(/^\s*-\s*\[[ xX]\]\s*/, '')
        .replace(/<!--\s*completed(?:At)?:\s*([^\s>]+)\s*-->/i, '')
        .trim()

      const completionTime = isChecked
        ? formatTimelineTime(completedAt) || formatTimelineTime(noteCreatedAt) || 'Done'
        : null

      tasks.push({
        originalIndex,
        isCheckbox: true,
        text,
        completed: isChecked,
        completedAt,
        completionTime,
      })
    } else if (inNotesSection || (!isChecked && !isUnchecked && trimmed.length > 0)) {
      memos.push(line)
    }
  })

  return { tasks, memos: memos.join('\n').trim() }
}

// Mark checkbox as completed in markdown note content with completion timestamp
function markNoteTaskCompleted(content: string, lineIndex: number, completedAt?: string): string {
  const lines = content.split('\n')
  if (lineIndex < 0 || lineIndex >= lines.length) return content

  const line = lines[lineIndex]
  if (/^\s*-\s*\[ \]/.test(line)) {
    const timestamp = completedAt || new Date().toISOString()
    const cleanLine = line.replace(/^(\s*-\s*)\[ \]/, '$1[x]')
    lines[lineIndex] = `${cleanLine} <!-- completed:${timestamp} -->`
  }

  return lines.join('\n')
}

// Append a new task to an existing markdown note
function appendTaskToNote(content: string, taskText: string): string {
  const trimmed = taskText.trim()
  if (!trimmed) return content

  const lines = content.split('\n')
  const plansHeaderIndex = lines.findIndex((l) => l.trim().toUpperCase() === "TODAY'S PLANS:")

  if (plansHeaderIndex !== -1) {
    let insertIndex = plansHeaderIndex + 1
    while (
      insertIndex < lines.length &&
      (lines[insertIndex].trim().startsWith('- [') || lines[insertIndex].trim() === '')
    ) {
      insertIndex++
    }
    lines.splice(insertIndex, 0, `- [ ] ${trimmed}`)
    return lines.join('\n')
  }

  return `TODAY'S PLANS:\n- [ ] ${trimmed}\n\n${content}`
}

// Architectural Wire-O spiral binding matching our site's developer design system
function SpiralBinding({ isDark }: { isDark: boolean }) {
  const rings = Array.from({ length: 16 })

  return (
    <div className="relative w-full h-7 flex items-center justify-around px-3 sm:px-6 select-none pointer-events-none">
      {rings.map((_, i) => (
        <div key={i} className="relative flex items-center justify-center">
          {/* Notebook paper punch hole slot */}
          <div
            className={`w-2.5 h-3.5 rounded-[2px] border ${
              isDark
                ? 'bg-[#09090b] border-white/[0.08] shadow-inner'
                : 'bg-zinc-200 border-zinc-300 shadow-inner'
            }`}
          />
          {/* Wire coil loop spanning across the top binding */}
          <div
            className={`absolute -top-3 w-1.5 h-6.5 rounded-full border ${
              isDark
                ? 'bg-zinc-600 border-zinc-500/40 shadow-xs'
                : 'bg-zinc-700 border-zinc-800/30 shadow-xs'
            }`}
          />
        </div>
      ))}
    </div>
  )
}

export function DailyNotes({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  theme = 'dark',
  initialFilterDate,
}: DailyNotesProps) {
  const isDark = theme === 'dark'
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Sorted unique dates with work logs (most recent first)
  const sortedUniqueDates = useMemo(() => {
    const dates = Array.from(new Set(notes.map((n) => n.date)))
    return dates.sort().reverse()
  }, [notes])

  // Active notebook page date (initialized from prop -> localStorage -> latest logged date -> today)
  const [activeDate, setActiveDate] = useState<string>(() => {
    if (initialFilterDate) return initialFilterDate
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(NOTES_LAST_DAY_KEY)
      if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) {
        return saved
      }
    }
    return todayStr
  })

  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next')
  const [flipKey, setFlipKey] = useState(0)

  // Compose form states
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [plans, setPlans] = useState<PlanItem[]>([])
  const [newPlanText, setNewPlanText] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [inlineNewTaskText, setInlineNewTaskText] = useState('')

  // Modal state for irreversible task completion confirmation
  const [confirmingTask, setConfirmingTask] = useState<{
    noteId: string
    noteContent: string
    lineIndex: number
    taskText: string
  } | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  // Sync prop changes (e.g., clicking on a day in ActivityHeatmap)
  useEffect(() => {
    if (initialFilterDate) {
      setActiveDate(initialFilterDate)
    }
  }, [initialFilterDate])

  // Persist current notebook page to localStorage
  useEffect(() => {
    if (activeDate && typeof window !== 'undefined') {
      localStorage.setItem(NOTES_LAST_DAY_KEY, activeDate)
    }
  }, [activeDate])

  // Find the note for the currently displayed notebook page
  const currentNote = useMemo(() => {
    return notes.find((n) => n.date === activeDate) || null
  }, [notes, activeDate])

  // Current page index in the sorted list of logged entries
  const currentEntryIndex = sortedUniqueDates.indexOf(activeDate)

  // Navigation handlers
  const handlePrevDay = () => {
    setFlipDirection('prev')
    setFlipKey((k) => k + 1)
    if (currentEntryIndex !== -1 && currentEntryIndex < sortedUniqueDates.length - 1) {
      // Flip backward to previous logged entry
      setActiveDate(sortedUniqueDates[currentEntryIndex + 1])
    } else {
      // Step backward 1 calendar day
      const [y, m, d] = activeDate.split('-').map(Number)
      const prevDate = new Date(y, m - 1, d - 1)
      setActiveDate(prevDate.toISOString().split('T')[0])
    }
  }

  const handleNextDay = () => {
    setFlipDirection('next')
    setFlipKey((k) => k + 1)
    if (currentEntryIndex > 0) {
      // Flip forward to next logged entry
      setActiveDate(sortedUniqueDates[currentEntryIndex - 1])
    } else {
      // Step forward 1 calendar day
      const [y, m, d] = activeDate.split('-').map(Number)
      const nextDate = new Date(y, m - 1, d + 1)
      setActiveDate(nextDate.toISOString().split('T')[0])
    }
  }

  const handleDateSelect = (date: string) => {
    if (!date) return
    setFlipDirection(date > activeDate ? 'next' : 'prev')
    setFlipKey((k) => k + 1)
    setActiveDate(date)
  }

  // Dynamically add a plan item to the compose form
  const handleAddPlan = (textToAdd?: string) => {
    const text = (textToAdd ?? newPlanText).trim()
    if (!text) return

    setPlans((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text,
        completed: false,
      },
    ])
    if (!textToAdd) {
      setNewPlanText('')
    }
  }

  // Toggle checkbox of a pending plan item in compose form
  const handleTogglePlan = (id: string) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextCompleted = !p.completed
          return {
            ...p,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          }
        }
        return p
      })
    )
  }

  // Remove a plan item from draft
  const handleRemovePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id))
  }

  // Submit and save the compiled work log from the compose form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (plans.length === 0 && !additionalNotes.trim()) return

    const sections: string[] = []
    if (plans.length > 0) {
      const nowIso = new Date().toISOString()
      const planLines = plans.map((p) =>
        p.completed
          ? `- [x] ${p.text} <!-- completed:${p.completedAt || nowIso} -->`
          : `- [ ] ${p.text}`
      )
      sections.push(`TODAY'S PLANS:\n${planLines.join('\n')}`)
    }
    if (additionalNotes.trim()) {
      sections.push(`NOTES:\n${additionalNotes.trim()}`)
    }

    const compiledContent = sections.join('\n\n')

    setLoading(true)
    try {
      await onAddNote(compiledContent, selectedDate)
      setPlans([])
      setNewPlanText('')
      setAdditionalNotes('')
      // Immediately open the newly logged date in the notebook
      setActiveDate(selectedDate)
    } finally {
      setLoading(false)
    }
  }

  // Confirm task completion and lock it permanently
  const handleConfirmTaskCompletion = async () => {
    if (!confirmingTask || !onUpdateNote) return

    setIsConfirming(true)
    try {
      const nowIso = new Date().toISOString()
      const updated = markNoteTaskCompleted(
        confirmingTask.noteContent,
        confirmingTask.lineIndex,
        nowIso
      )
      await onUpdateNote(confirmingTask.noteId, updated)
      setConfirmingTask(null)
    } finally {
      setIsConfirming(false)
    }
  }

  // Inline add task to the current notebook page's note
  const handleInlineAddTask = async () => {
    const text = inlineNewTaskText.trim()
    if (!text || !currentNote || !onUpdateNote) return

    const updated = appendTaskToNote(currentNote.content, text)
    await onUpdateNote(currentNote.id, updated)
    setInlineNewTaskText('')
  }

  // Parsed tasks and memos for current notebook page
  const parsedPageData = useMemo(() => {
    if (!currentNote) return { tasks: [], memos: '', stats: { total: 0, completed: 0, percentage: 0 } }
    const { tasks, memos } = parseNoteTasksAndMemos(currentNote.content, currentNote.createdAt)
    const stats = getNoteStats(currentNote.content)
    return { tasks, memos, stats }
  }, [currentNote])

  // Theme styles
  const cardContainer = isDark
    ? 'bg-[#111114] border-white/[0.06] text-zinc-100 shadow-sm'
    : 'bg-white border-zinc-200 text-zinc-900 shadow-xs'
  const headerBorder = isDark ? 'border-white/[0.06]' : 'border-zinc-200'
  const sectionTitle = isDark ? 'text-zinc-200' : 'text-zinc-800'
  const inputBg = isDark
    ? 'bg-black/40 border-white/[0.08] text-zinc-200 placeholder-zinc-500 focus:border-white/[0.2]'
    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
  const countBadge = isDark
    ? 'bg-white/[0.04] text-zinc-400 border-white/[0.06]'
    : 'bg-zinc-100 text-zinc-600 border-zinc-200'

  // Page surface paper styling
  const notebookPaperBg = isDark
    ? 'bg-[#141418] border-white/[0.08] text-zinc-100 shadow-2xl shadow-black/60'
    : 'bg-[#fdfdfc] border-stone-200/90 text-zinc-900 shadow-xl shadow-zinc-950/5'

  const notebookBindingBg = isDark
    ? 'bg-[#0e0e11] border-b border-white/[0.06]'
    : 'bg-[#f4f4f2] border-b border-stone-200'

  const pageFlipAnimClass =
    flipDirection === 'prev'
      ? 'notebook-page-flip-prev'
      : 'notebook-page-flip-next'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-5">
      {/* Left Column: Compose Note Section */}
      <div className={`lg:col-span-1 rounded-2xl border p-3.5 sm:p-5 h-fit ${cardContainer}`}>
        <div className={`flex items-center justify-between pb-3 mb-3.5 border-b ${headerBorder}`}>
          <h2 className={`text-xs font-semibold tracking-wider uppercase ${sectionTitle}`}>
            Log Daily Work
          </h2>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono ${countBadge}`}>
            {plans.length} {plans.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Entry Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`w-full h-9 rounded-lg border px-3 text-xs focus:outline-none font-mono ${inputBg}`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Today's Plan Checklist
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Solve LeetCode, Review PR #42..."
                value={newPlanText}
                onChange={(e) => setNewPlanText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddPlan()
                  }
                }}
                className={`flex-1 min-w-0 h-9 rounded-lg border px-3 text-xs focus:outline-none font-mono ${inputBg}`}
              />
              <button
                type="button"
                onClick={() => handleAddPlan()}
                className={`h-9 px-3.5 rounded-lg border text-xs font-medium transition cursor-pointer shrink-0 ${
                  isDark
                    ? 'border-white/[0.08] hover:bg-white/[0.06] text-zinc-300'
                    : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700 bg-white shadow-2xs'
                }`}
              >
                + Add
              </button>
            </div>

            {/* Draft Plan Items */}
            {plans.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition group ${
                      isDark
                        ? 'bg-black/30 border-white/[0.05]'
                        : 'bg-zinc-50/80 border-zinc-200'
                    }`}
                  >
                    <div
                      className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleTogglePlan(p.id)}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition ${
                          p.completed
                            ? isDark
                              ? 'bg-white border-white text-zinc-950'
                              : 'bg-zinc-900 border-zinc-900 text-white'
                            : 'border-zinc-400 dark:border-zinc-600 bg-transparent'
                        }`}
                      >
                        {p.completed && (
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span
                        className={`truncate ${
                          p.completed
                            ? 'line-through text-zinc-400 dark:text-zinc-500'
                            : 'text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        {p.text}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePlan(p.id)}
                      className="text-zinc-400 hover:text-rose-500 p-1 rounded transition cursor-pointer"
                      title="Remove task"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Routine Tasks Suggestions */}
            {plans.length === 0 && (
              <div className="mt-2.5 space-y-1.5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                  Quick routines:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Speak English for 30 min',
                    'Solve 1 LeetCode Problem',
                    'Review PRs & Issues',
                    'Update Daily Expenses',
                  ].map((routine) => (
                    <button
                      key={routine}
                      type="button"
                      onClick={() => handleAddPlan(routine)}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded border transition cursor-pointer ${
                        isDark
                          ? 'border-white/[0.06] hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200'
                          : 'border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 bg-zinc-50'
                      }`}
                    >
                      + {routine}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Optional Additional Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Record decisions, challenges, or work notes..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className={`w-full rounded-lg border p-3 text-xs focus:outline-none font-mono leading-relaxed resize-none ${inputBg}`}
            />
          </div>

          <button
            type="submit"
            disabled={loading || (plans.length === 0 && !additionalNotes.trim())}
            className={`w-full h-10 rounded-xl font-medium text-xs transition-all duration-150 active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center gap-2 ${
              isDark
                ? 'bg-white hover:bg-zinc-200 text-zinc-950'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white'
            }`}
          >
            {loading ? (
              <span>Saving Entry...</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Save Work Log</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Redesigned Spiral Notebook (One Page Per Day with Timeline) */}
      <div className="lg:col-span-2 flex flex-col space-y-3">
        {/* Navigation & Jump Bar */}
        <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2.5 ${cardContainer}`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevDay}
              className={`h-8.5 px-3 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'border-white/[0.08] hover:bg-white/[0.06] text-zinc-300'
                  : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700 bg-white shadow-2xs'
              }`}
              title="Previous day / entry"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Prev</span>
            </button>

            {/* Page Count Indicator */}
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.06] select-none">
              {currentEntryIndex !== -1
                ? `Page ${currentEntryIndex + 1} of ${sortedUniqueDates.length}`
                : 'Empty Day'}
            </span>

            <button
              type="button"
              onClick={handleNextDay}
              className={`h-8.5 px-3 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'border-white/[0.08] hover:bg-white/[0.06] text-zinc-300'
                  : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700 bg-white shadow-2xs'
              }`}
              title="Next day / entry"
            >
              <span>Next</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Date Picker Jump */}
            <input
              type="date"
              value={activeDate}
              onChange={(e) => handleDateSelect(e.target.value)}
              className={`h-8.5 rounded-lg border px-2.5 text-xs font-mono focus:outline-none ${inputBg}`}
              title="Jump directly to any date"
            />

            {/* Jump to Today */}
            {activeDate !== todayStr && (
              <button
                type="button"
                onClick={() => handleDateSelect(todayStr)}
                className={`h-8.5 px-2.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                  isDark
                    ? 'border-white/[0.08] hover:bg-white/[0.06] text-zinc-300'
                    : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700 bg-white shadow-2xs'
                }`}
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* The Spiral Notebook Container */}
        <div className={`rounded-2xl border overflow-hidden transition-all ${notebookPaperBg}`}>
          {/* Top Spiral Binding Strip */}
          <div className={`pt-2.5 pb-1 ${notebookBindingBg}`}>
            <SpiralBinding isDark={isDark} />
          </div>

          {/* Notebook Page Content Area (With Top Spiral 3D Page Flip Animation) */}
          <div
            key={`${activeDate}-${flipKey}`}
            className={`p-4 sm:p-6 min-h-[500px] flex flex-col ${pageFlipAnimClass}`}
          >
            {/* Page Header: Date, Stats, Author & Actions */}
            <div className={`pb-4 mb-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${headerBorder}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50 font-sans">
                    {formatNotebookDate(activeDate)}
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-zinc-200 dark:border-white/[0.08] bg-zinc-100/70 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400">
                    {activeDate}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono flex-wrap">
                  {currentNote ? (
                    <>
                      <span>
                        by{' '}
                        <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">
                          {currentNote.createdBy?.startsWith('@')
                            ? currentNote.createdBy
                            : `@${(currentNote.createdBy?.includes('@') ? currentNote.createdBy.split('@')[0] : currentNote.createdBy) || 'user'}`}
                        </strong>
                      </span>

                      {/* Completed % Progress Badge (Monochrome, No AI Colors) */}
                      {parsedPageData.stats.total > 0 && (
                        <>
                          <span>•</span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                              parsedPageData.stats.percentage === 100
                                ? isDark
                                  ? 'bg-white text-zinc-950 border-white font-semibold shadow-2xs'
                                  : 'bg-zinc-900 text-white border-zinc-900 font-semibold shadow-2xs'
                                : 'bg-zinc-100 dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/[0.08]'
                            }`}
                          >
                            {parsedPageData.stats.percentage === 100 && (
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                            <span>
                              {parsedPageData.stats.percentage}% Done ({parsedPageData.stats.completed}/{parsedPageData.stats.total})
                            </span>
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <span>No entry recorded for this day</span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Delete Page Option */}
              {currentNote && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onDeleteNote(currentNote)}
                    className="h-8 px-3 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center gap-1.5 border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 dark:border-white/[0.08] dark:hover:border-white/[0.18] dark:bg-white/[0.02] dark:hover:bg-white/[0.08] dark:text-zinc-400 dark:hover:text-zinc-200 shadow-2xs"
                    title="Delete this day's work log"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Delete Page</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notebook Page Body: Timeline vs Empty State */}
            {!currentNote ? (
              /* Clear Empty State for Days with No Log */
              <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl border border-dashed border-zinc-300 dark:border-white/10 flex items-center justify-center mb-3 text-zinc-400">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  No work log on this page
                </h4>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-sm font-mono leading-relaxed">
                  You haven't recorded any tasks or notes for {activeDate} yet.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedDate(activeDate)}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 transition-colors shadow-sm cursor-pointer"
                >
                  Write Log for {activeDate}
                </button>
              </div>
            ) : (
              /* Populated Page Content */
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {/* Vertical Timeline with Completion Time Markers */}
                  {parsedPageData.tasks.length > 0 && (
                    <div className="relative space-y-4 my-2">
                      {/* Vertical spine timeline line centered exactly on the 20px nodes (center at 10px) */}
                      <div className="absolute left-[9px] top-3 bottom-3 w-[2px] bg-zinc-200 dark:bg-white/[0.08]" />

                      {parsedPageData.tasks.map((task) => (
                        <div key={task.originalIndex} className="relative pl-8 group">
                          {/* Timeline node sitting directly on the line */}
                          <div className="absolute left-0 top-1 z-10 flex items-center justify-center">
                            {task.completed ? (
                              <div
                                className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-xs border-2 border-[#fdfdfc] dark:border-[#141418]"
                                title="Task completed"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmingTask({
                                    noteId: currentNote.id,
                                    noteContent: currentNote.content,
                                    lineIndex: task.originalIndex,
                                    taskText: task.text,
                                  })
                                }}
                                className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 bg-[#fdfdfc] dark:bg-[#141418] hover:border-zinc-800 dark:hover:border-white transition-colors cursor-pointer flex items-center justify-center shadow-2xs"
                                title="Click to complete task"
                              />
                            )}
                          </div>

                          {/* Task Content Card */}
                          <div
                            onClick={() => {
                              if (!task.completed) {
                                setConfirmingTask({
                                  noteId: currentNote.id,
                                  noteContent: currentNote.content,
                                  lineIndex: task.originalIndex,
                                  taskText: task.text,
                                })
                              }
                            }}
                            className={`flex-1 min-w-0 p-2.5 sm:p-3 rounded-xl border transition ${
                              task.completed
                                ? isDark
                                  ? 'bg-white/[0.02] border-white/[0.04]'
                                  : 'bg-zinc-50 border-zinc-200/60'
                                : isDark
                                ? 'bg-black/30 border-white/[0.06] hover:border-white/[0.12] cursor-pointer'
                                : 'bg-white border-zinc-200/80 hover:border-zinc-300 cursor-pointer shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                              {/* Time Marker Badge */}
                              {task.completed ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-zinc-100 dark:bg-white/[0.06] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/[0.08]">
                                  <svg className="w-2.5 h-2.5 text-zinc-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  <span>{task.completionTime}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                                  <span>To-do</span>
                                </span>
                              )}

                              {task.completed && (
                                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 font-medium">
                                  ✓ Done
                                </span>
                              )}
                            </div>

                            <p
                              className={`text-xs font-mono break-words leading-relaxed ${
                                task.completed
                                  ? 'line-through text-zinc-400 dark:text-zinc-500'
                                  : 'text-zinc-800 dark:text-zinc-200'
                              }`}
                            >
                              {task.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Task Adder on Current Day's Page */}
                  {onUpdateNote && (
                    <div className="mt-4 pt-3 border-t border-dashed border-zinc-200 dark:border-white/[0.08] flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="+ Add another task to this page..."
                        value={inlineNewTaskText}
                        onChange={(e) => setInlineNewTaskText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleInlineAddTask()
                          }
                        }}
                        className={`flex-1 min-w-0 h-9 rounded-lg border px-3 text-xs focus:outline-none font-mono ${inputBg}`}
                      />
                      <button
                        type="button"
                        onClick={handleInlineAddTask}
                        disabled={!inlineNewTaskText.trim()}
                        className={`h-9 px-3.5 rounded-lg border text-xs font-medium transition cursor-pointer disabled:opacity-40 shrink-0 ${
                          isDark
                            ? 'bg-white/[0.08] hover:bg-white/[0.14] text-zinc-200 border-white/[0.1]'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900 shadow-2xs'
                        }`}
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Notes Area (Memos & Remarks at Bottom of Page) */}
                {parsedPageData.memos && (
                  <div className="mt-6 pt-4 border-t border-dashed border-zinc-200 dark:border-white/[0.08]">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      <span>Additional Notes & Remarks</span>
                    </div>
                    <div className="p-3.5 rounded-xl border bg-zinc-50/70 dark:bg-black/30 border-zinc-200/80 dark:border-white/[0.06] text-xs font-mono leading-relaxed whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                      {parsedPageData.memos}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Irreversible Task Completion Confirmation Modal */}
      {confirmingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 select-none animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl border p-4 sm:p-6 shadow-2xl space-y-4 ${
              isDark ? 'bg-[#121215] border-white/[0.08] text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            {/* Modal Header with Clean Icon */}
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                  isDark
                    ? 'bg-white/[0.04] border-white/[0.08] text-zinc-200'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold tracking-wide">
                  Confirm Task Completion
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Are you sure you have completed this work today?
                </p>
              </div>
            </div>

            {/* Task Item Highlight Card */}
            <div
              className={`p-3.5 rounded-xl border text-xs font-mono leading-relaxed ${
                isDark ? 'bg-black/40 border-white/[0.06] text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
              }`}
            >
              <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block mb-1">
                Task Plan
              </span>
              <p className="font-medium break-words">"{confirmingTask.taskText}"</p>
            </div>

            {/* Consistency Discipline Notice */}
            <div
              className={`p-3 rounded-lg border text-[11px] leading-relaxed flex items-start gap-2.5 ${
                isDark
                  ? 'bg-white/[0.02] border-white/[0.06] text-zinc-400'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-600'
              }`}
            >
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5 font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="font-semibold">Locked:</span>
              </div>
              <span>
                Once confirmed, this task is permanently completed and cannot be undone to maintain your heatmap consistency.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 sm:gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingTask(null)}
                disabled={isConfirming}
                className={`w-full sm:w-auto h-9 px-4 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                  isDark
                    ? 'border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 shadow-2xs'
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmTaskCompletion}
                disabled={isConfirming}
                className={`w-full sm:w-auto h-9 px-4 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-sm flex items-center justify-center gap-1.5 ${
                  isDark
                    ? 'bg-white hover:bg-zinc-200 text-zinc-950'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                }`}
              >
                {isConfirming ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Yes, Mark Completed</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
