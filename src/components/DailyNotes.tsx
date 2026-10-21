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

// Apple-inspired Notebook Wire-O spiral binding
function SpiralBinding({ isDark }: { isDark: boolean }) {
  const rings = Array.from({ length: 16 })

  return (
    <div className="relative w-full h-7 flex items-center justify-around px-3 sm:px-6 select-none pointer-events-none">
      {rings.map((_, i) => (
        <div key={i} className="relative flex items-center justify-center">
          {/* Notebook paper punch hole slot */}
          <div
            className={`w-2.5 h-3.5 rounded-[3px] border ${
              isDark
                ? 'bg-[#0e0e11] border-white/[0.1] shadow-inner'
                : 'bg-[#e5e5ea] border-[#d2d2d7] shadow-inner'
            }`}
          />
          {/* Wire coil loop spanning across the top binding */}
          <div
            className={`absolute -top-3 w-1.5 h-6.5 rounded-full border ${
              isDark
                ? 'bg-zinc-500 border-zinc-400/40 shadow-xs'
                : 'bg-zinc-600 border-zinc-700/30 shadow-xs'
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

  // Apple Design System Tokens
  const cardContainer = isDark
    ? 'bg-[#161618] border-white/[0.08] text-[#f5f5f7] shadow-sm'
    : 'bg-white border-[#e5e5ea] text-[#1d1d1f] shadow-xs'
  const headerBorder = isDark ? 'border-white/[0.08]' : 'border-[#e5e5ea]'
  const sectionTitle = isDark ? 'text-[#f5f5f7]' : 'text-[#1d1d1f]'
  const inputBg = isDark
    ? 'bg-white/[0.04] border-white/[0.08] text-[#f5f5f7] placeholder-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/20'
    : 'bg-[#fafafc] border-[#e5e5ea] text-[#1d1d1f] placeholder-[#86868b] focus:bg-white focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 shadow-2xs'
  const countBadge = isDark
    ? 'bg-white/[0.06] text-[#86868b] border-white/[0.08]'
    : 'bg-[#f5f5f7] text-[#86868b] border-[#e5e5ea]'

  // Page surface paper styling
  const notebookPaperBg = isDark
    ? 'bg-[#18181b] border-white/[0.08] text-[#f5f5f7] shadow-2xl shadow-black/80'
    : 'bg-white border-[#e5e5ea] text-[#1d1d1f] shadow-xl shadow-black/5'

  const notebookBindingBg = isDark
    ? 'bg-[#121214] border-b border-white/[0.08]'
    : 'bg-[#f5f5f7] border-b border-[#e5e5ea]'

  const pageFlipAnimClass =
    flipDirection === 'prev'
      ? 'notebook-page-flip-prev'
      : 'notebook-page-flip-next'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-5">
      {/* Left Column: Compose Note Section */}
      <div className={`lg:col-span-1 rounded-[20px] border p-4 sm:p-5 h-fit ${cardContainer}`}>
        <div className={`flex items-center justify-between pb-3 mb-3.5 border-b ${headerBorder}`}>
          <h2 className="text-[11px] font-semibold tracking-wider uppercase text-[#86868b]">
            Log Daily Work
          </h2>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono ${countBadge}`}>
            {plans.length} {plans.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-[#86868b] mb-1.5">
              Entry Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`w-full h-9 rounded-[10px] border px-3 text-xs focus:outline-none font-mono ${inputBg}`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#86868b] mb-1.5">
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
                className={`flex-1 min-w-0 h-9 rounded-[10px] border px-3 text-xs focus:outline-none font-mono ${inputBg}`}
              />
              <button
                type="button"
                onClick={() => handleAddPlan()}
                className={`h-9 px-4 rounded-full border text-xs font-semibold active:scale-95 transition-all shrink-0 cursor-pointer ${
                  isDark
                    ? 'border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-white'
                    : 'border-[#e5e5ea] bg-white hover:bg-[#fafafc] text-[#1d1d1f] shadow-2xs'
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
                    className={`flex items-center justify-between p-2.5 rounded-[12px] border text-xs font-mono transition group ${
                      isDark
                        ? 'bg-white/[0.02] border-white/[0.06]'
                        : 'bg-[#f5f5f7]/70 border-[#e5e5ea]'
                    }`}
                  >
                    <div
                      className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleTogglePlan(p.id)}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 transition-transform active:scale-90 flex items-center justify-center shrink-0 ${
                          p.completed
                            ? isDark
                              ? 'bg-white border-white text-zinc-950'
                              : 'bg-black border-black text-white'
                            : 'border-[#86868b]/50 bg-transparent'
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
                            ? 'line-through text-[#86868b]'
                            : 'text-[#1d1d1f] dark:text-[#f5f5f7]'
                        }`}
                      >
                        {p.text}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePlan(p.id)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition cursor-pointer"
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
                <span className="text-[10px] font-mono text-[#86868b] uppercase tracking-wider block">
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
                      className={`px-3 py-1 text-[11px] font-medium rounded-full border transition cursor-pointer active:scale-95 ${
                        isDark
                          ? 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-[#a1a1a6] hover:text-white'
                          : 'border-[#e5e5ea] bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#515154] hover:text-[#1d1d1f]'
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
            <label className="block text-[11px] font-medium text-[#86868b] mb-1.5">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Record decisions, challenges, or work notes..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className={`w-full rounded-[12px] border p-3 text-xs focus:outline-none font-mono leading-relaxed resize-none ${inputBg}`}
            />
          </div>

          <button
            type="submit"
            disabled={loading || (plans.length === 0 && !additionalNotes.trim())}
            className={`w-full h-10 rounded-full font-semibold text-xs transition-all duration-150 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center gap-2 ${
              isDark
                ? 'bg-white hover:bg-zinc-100 text-zinc-950'
                : 'bg-black hover:bg-zinc-800 text-white'
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
        <div className={`p-3 rounded-[20px] border flex flex-wrap items-center justify-between gap-2.5 ${cardContainer}`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevDay}
              className={`h-8.5 px-3.5 rounded-full border text-xs font-medium transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-[#f5f5f7]'
                  : 'border-[#e5e5ea] bg-white hover:bg-[#fafafc] text-[#1d1d1f] shadow-2xs'
              }`}
              title="Previous day / entry"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Prev</span>
            </button>

            {/* Page Count Indicator */}
            <span className={`text-[11px] font-mono px-3 py-1 rounded-full border select-none ${
              isDark ? 'bg-white/[0.04] text-[#86868b] border-white/[0.08]' : 'bg-[#f5f5f7] text-[#86868b] border-[#e5e5ea]'
            }`}>
              {currentEntryIndex !== -1
                ? `Page ${currentEntryIndex + 1} of ${sortedUniqueDates.length}`
                : 'Empty Day'}
            </span>

            <button
              type="button"
              onClick={handleNextDay}
              className={`h-8.5 px-3.5 rounded-full border text-xs font-medium transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-[#f5f5f7]'
                  : 'border-[#e5e5ea] bg-white hover:bg-[#fafafc] text-[#1d1d1f] shadow-2xs'
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
              className={`h-8.5 rounded-[10px] border px-2.5 text-xs font-mono focus:outline-none ${inputBg}`}
              title="Jump directly to any date"
            />

            {/* Jump to Today */}
            {activeDate !== todayStr && (
              <button
                type="button"
                onClick={() => handleDateSelect(todayStr)}
                className={`h-8.5 px-3.5 rounded-full border text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                  isDark
                    ? 'border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-[#f5f5f7]'
                    : 'border-[#e5e5ea] bg-white hover:bg-[#fafafc] text-[#1d1d1f] shadow-2xs'
                }`}
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* The Spiral Notebook Container */}
        <div className={`rounded-[24px] border overflow-hidden transition-all ${notebookPaperBg}`}>
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
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] font-sans">
                    {formatNotebookDate(activeDate)}
                  </h3>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-[#e5e5ea] dark:border-white/[0.08] bg-[#f5f5f7] dark:bg-white/[0.04] text-[#86868b]">
                    {activeDate}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1.5 text-xs text-[#86868b] font-mono flex-wrap">
                  {currentNote ? (
                    <>
                      <span>
                        by{' '}
                        <strong className="text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold">
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
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
                              parsedPageData.stats.percentage === 100
                                ? isDark
                                  ? 'bg-white text-zinc-950 border-white font-semibold shadow-xs'
                                  : 'bg-black text-white border-black font-semibold shadow-xs'
                                : isDark
                                ? 'bg-white/[0.06] text-[#f5f5f7] border-white/[0.08]'
                                : 'bg-[#f5f5f7] text-[#1d1d1f] border-[#e5e5ea]'
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
                    className={`h-8 px-3.5 rounded-full border text-xs font-normal transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                      isDark
                        ? 'border-white/[0.08] hover:border-white/[0.18] bg-white/[0.04] hover:bg-white/[0.08] text-[#86868b] hover:text-[#f5f5f7]'
                        : 'border-black/[0.08] hover:border-black/[0.18] bg-white hover:bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f] shadow-2xs'
                    }`}
                    title="Delete this day's work log"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <div className={`w-12 h-12 rounded-[16px] border border-dashed flex items-center justify-center mb-3 text-[#86868b] ${
                  isDark ? 'border-white/10 bg-white/[0.02]' : 'border-black/10 bg-black/[0.02]'
                }`}>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                  No work log on this page
                </h4>
                <p className="text-xs text-[#86868b] mt-1 max-w-sm font-mono leading-relaxed">
                  You haven't recorded any tasks or notes for {activeDate} yet.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedDate(activeDate)}
                  className={`mt-4 px-5 py-2.5 rounded-full text-xs font-semibold active:scale-95 transition-all shadow-sm cursor-pointer ${
                    isDark
                      ? 'bg-white hover:bg-zinc-100 text-zinc-950'
                      : 'bg-black hover:bg-zinc-800 text-white'
                  }`}
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
                      <div className="absolute left-[9px] top-3 bottom-3 w-[2px] bg-[#e5e5ea] dark:bg-white/[0.08]" />

                      {parsedPageData.tasks.map((task) => (
                        <div key={task.originalIndex} className="relative pl-8 group">
                          {/* Timeline node sitting directly on the line */}
                          <div className="absolute left-0 top-1 z-10 flex items-center justify-center">
                            {task.completed ? (
                              <div
                                className="w-5 h-5 rounded-full bg-[#34c759] text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-[#18181b]"
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
                                className="w-5 h-5 rounded-full border-2 border-[#86868b]/40 hover:border-[#0071e3] dark:hover:border-[#2997ff] bg-white dark:bg-[#18181b] active:scale-90 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
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
                            className={`flex-1 min-w-0 p-3 rounded-[14px] border transition ${
                              task.completed
                                ? isDark
                                  ? 'bg-white/[0.02] border-white/[0.04]'
                                  : 'bg-[#f5f5f7]/60 border-[#e5e5ea]/80'
                                : isDark
                                ? 'bg-white/[0.04] border-white/[0.08] hover:border-white/[0.16] cursor-pointer'
                                : 'bg-white border-[#e5e5ea] hover:border-[#0071e3]/40 cursor-pointer shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                              {/* Time Marker Badge */}
                              {task.completed ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#f5f5f7] dark:bg-white/[0.06] text-[#1d1d1f] dark:text-[#f5f5f7] border border-[#e5e5ea] dark:border-white/[0.08]">
                                  <svg className="w-2.5 h-2.5 text-[#86868b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  <span>{task.completionTime}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#86868b]">
                                  <span>To-do</span>
                                </span>
                              )}

                              {task.completed && (
                                <span className="text-[10px] font-mono text-[#34c759] font-medium">
                                  ✓ Done
                                </span>
                              )}
                            </div>

                            <p
                              className={`text-xs font-mono break-words leading-relaxed ${
                                task.completed
                                  ? 'line-through text-[#86868b]'
                                  : 'text-[#1d1d1f] dark:text-[#f5f5f7]'
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
                    <div className="mt-4 pt-3 border-t border-dashed border-[#e5e5ea] dark:border-white/[0.08] flex items-center gap-2">
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
                        className={`flex-1 min-w-0 h-9 rounded-[10px] border px-3 text-xs focus:outline-none font-mono ${inputBg}`}
                      />
                      <button
                        type="button"
                        onClick={handleInlineAddTask}
                        disabled={!inlineNewTaskText.trim()}
                        className={`h-9 px-4 rounded-full text-xs font-semibold transition active:scale-95 cursor-pointer disabled:opacity-40 shrink-0 ${
                          isDark
                            ? 'bg-white hover:bg-zinc-100 text-zinc-950'
                            : 'bg-black hover:bg-zinc-800 text-white shadow-2xs'
                        }`}
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Notes Area (Memos & Remarks at Bottom of Page) */}
                {parsedPageData.memos && (
                  <div className="mt-6 pt-4 border-t border-dashed border-[#e5e5ea] dark:border-white/[0.08]">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#86868b] mb-2">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      <span>Additional Notes & Remarks</span>
                    </div>
                    <div className="p-3.5 rounded-[16px] border bg-[#f5f5f7]/60 dark:bg-white/[0.02] border-[#e5e5ea] dark:border-white/[0.06] text-xs font-mono leading-relaxed whitespace-pre-wrap text-[#1d1d1f] dark:text-[#f5f5f7]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 select-none animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-[24px] border p-5 sm:p-6 shadow-2xl space-y-4 backdrop-blur-2xl ${
              isDark ? 'bg-[#1c1c1e]/95 border-white/[0.12] text-[#f5f5f7] shadow-black/80' : 'bg-white/95 border-[#e5e5ea] text-[#1d1d1f] shadow-2xl'
            }`}
          >
            {/* Modal Header with Clean Icon */}
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-[12px] border flex items-center justify-center shrink-0 ${
                  isDark
                    ? 'bg-white/[0.06] border-white/[0.1] text-white'
                    : 'bg-[#f5f5f7] border-[#e5e5ea] text-[#1d1d1f]'
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
                <p className="text-xs text-[#86868b] mt-1">
                  Are you sure you have completed this work today?
                </p>
              </div>
            </div>

            {/* Task Item Highlight Card */}
            <div
              className={`p-3.5 rounded-[14px] border text-xs font-mono leading-relaxed ${
                isDark ? 'bg-black/40 border-white/[0.06] text-[#f5f5f7]' : 'bg-[#f5f5f7] border-[#e5e5ea] text-[#1d1d1f]'
              }`}
            >
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#86868b] block mb-1">
                Task Plan
              </span>
              <p className="font-medium break-words">"{confirmingTask.taskText}"</p>
            </div>

            {/* Consistency Discipline Notice */}
            <div
              className={`p-3 rounded-[12px] border text-[11px] leading-relaxed flex items-start gap-2.5 ${
                isDark
                  ? 'bg-white/[0.02] border-white/[0.06] text-[#86868b]'
                  : 'bg-[#f5f5f7] border-[#e5e5ea] text-[#86868b]'
              }`}
            >
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5 font-mono text-[10px] text-[#86868b] uppercase tracking-wider">
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
                className={`w-full sm:w-auto h-9.5 px-4 rounded-full border text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer ${
                  isDark
                    ? 'border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-[#f5f5f7]'
                    : 'border-[#e5e5ea] bg-white hover:bg-[#fafafc] text-[#1d1d1f] shadow-2xs'
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmTaskCompletion}
                disabled={isConfirming}
                className={`w-full sm:w-auto h-9.5 px-5 rounded-full text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer shadow-sm flex items-center justify-center gap-1.5 ${
                  isDark
                    ? 'bg-white hover:bg-zinc-100 text-zinc-950'
                    : 'bg-black hover:bg-zinc-800 text-white'
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
