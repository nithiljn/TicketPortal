'use client'

import React, { useState, useEffect } from 'react'
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
  isCheckbox: boolean
  text: string
  completed: boolean
  completedAt: string | null
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

// Parse single markdown line for task state and completion metadata
function parseTaskLine(line: string): ParsedTask {
  const isChecked = /^\s*-\s*\[[xX]\]/.test(line)
  const isUnchecked = /^\s*-\s*\[ \]/.test(line)
  const isCheckbox = isChecked || isUnchecked

  if (!isCheckbox) {
    return {
      isCheckbox: false,
      text: line,
      completed: false,
      completedAt: null,
    }
  }

  const match = line.match(/<!--\s*completed(?:At)?:\s*([^\s>]+)\s*-->/i)
  const completedAt = match ? match[1] : null

  const text = line
    .replace(/^\s*-\s*\[[ xX]\]\s*/, '')
    .replace(/<!--\s*completed(?:At)?:\s*([^\s>]+)\s*-->/i, '')
    .trim()

  return {
    isCheckbox: true,
    text,
    completed: isChecked,
    completedAt,
  }
}

// Format completion timestamp for timeline display
function formatCompletionTime(dateString?: string | null, fallbackDateStr?: string): string {
  if (!dateString && !fallbackDateStr) return ''

  try {
    const d = dateString ? new Date(dateString) : new Date(fallbackDateStr || '')
    if (isNaN(d.getTime())) return ''

    const month = d.toLocaleDateString('en-US', { month: 'short' })
    const day = d.getDate()
    const year = d.getFullYear()
    const currentYear = new Date().getFullYear()

    const time = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    const yearPart = year !== currentYear ? `, ${year}` : ''
    return `${month} ${day}${yearPart} at ${time}`
  } catch {
    return ''
  }
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
    while (insertIndex < lines.length && (lines[insertIndex].trim().startsWith('- [') || lines[insertIndex].trim() === '')) {
      insertIndex++
    }
    lines.splice(insertIndex, 0, `- [ ] ${trimmed}`)
    return lines.join('\n')
  }

  return `TODAY'S PLANS:\n- [ ] ${trimmed}\n\n${content}`
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

  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [plans, setPlans] = useState<PlanItem[]>([])
  const [newPlanText, setNewPlanText] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterDate, setFilterDate] = useState<string>(initialFilterDate || '')
  const [timelineNewTaskText, setTimelineNewTaskText] = useState<Record<string, string>>({})

  // Modal state for irreversible task completion confirmation
  const [confirmingTask, setConfirmingTask] = useState<{
    noteId: string
    noteContent: string
    lineIndex: number
    taskText: string
  } | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    if (initialFilterDate !== undefined) {
      setFilterDate(initialFilterDate)
    }
  }, [initialFilterDate])

  // Dynamically add a new plan item
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

  // Submit and save the compiled work log
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (plans.length === 0 && !additionalNotes.trim()) return

    // Compile dynamic plans and additional notes into structured markdown
    const sections: string[] = []
    if (plans.length > 0) {
      const nowIso = new Date().toISOString()
      const planLines = plans.map(
        (p) =>
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

  // Inline add task to existing timeline note
  const handleInlineAddTask = async (noteId: string, currentContent: string) => {
    const text = (timelineNewTaskText[noteId] || '').trim()
    if (!text || !onUpdateNote) return

    const updated = appendTaskToNote(currentContent, text)
    await onUpdateNote(noteId, updated)
    setTimelineNewTaskText((prev) => ({ ...prev, [noteId]: '' }))
  }

  const filteredNotes = filterDate
    ? notes.filter((n) => n.date === filterDate)
    : notes

  // Theme styles
  const cardContainer = isDark
    ? 'bg-[#111114] border-white/[0.06] text-zinc-100 shadow-sm'
    : 'bg-white border-zinc-200 text-zinc-900 shadow-xs'
  const headerBorder = isDark ? 'border-white/[0.06]' : 'border-zinc-200'
  const sectionTitle = isDark ? 'text-zinc-200' : 'text-zinc-800'
  const inputBg = isDark
    ? 'bg-black/40 border-white/[0.08] text-zinc-200 placeholder-zinc-500 focus:border-white/[0.2]'
    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
  const logCardBg = isDark
    ? 'bg-black/40 border-white/[0.06] text-zinc-200'
    : 'bg-zinc-50/70 border-zinc-200 text-zinc-800'
  const countBadge = isDark
    ? 'bg-white/[0.04] text-zinc-400 border-white/[0.06]'
    : 'bg-zinc-100 text-zinc-600 border-zinc-200'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Compose Note Section */}
      <div className={`lg:col-span-1 rounded-2xl border p-4 sm:p-5 h-fit ${cardContainer}`}>
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

          {/* Dynamic Task & Plan Creator */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Today's Plans & Tasks
            </label>
            <div className="flex gap-2 mb-2.5">
              <input
                type="text"
                placeholder="Type your plan for today (press Enter to add)..."
                value={newPlanText}
                onChange={(e) => setNewPlanText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddPlan()
                  }
                }}
                className={`flex-1 h-9 rounded-lg border px-3 text-xs focus:outline-none font-mono ${inputBg}`}
              />
              <button
                type="button"
                onClick={() => handleAddPlan()}
                disabled={!newPlanText.trim()}
                className={`h-9 px-4 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-40 cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-white/[0.08] hover:bg-white/[0.14] text-zinc-200 border-white/[0.1]'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900 shadow-2xs'
                }`}
              >
                + Add
              </button>
            </div>

            {/* List of dynamically added plans */}
            {plans.length > 0 ? (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono transition ${
                      isDark
                        ? 'bg-black/30 border-white/[0.06] text-zinc-200'
                        : 'bg-white border-zinc-200 text-zinc-800 shadow-2xs'
                    }`}
                  >
                    <div
                      onClick={() => handleTogglePlan(p.id)}
                      className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pr-2 select-none"
                    >
                      <span
                        className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition ${
                          p.completed
                            ? isDark
                              ? 'bg-zinc-200 border-zinc-200 text-zinc-950'
                              : 'bg-zinc-900 border-zinc-900 text-white'
                            : isDark
                            ? 'border-white/[0.2] bg-transparent'
                            : 'border-zinc-300 bg-white'
                        }`}
                      >
                        {p.completed && (
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span className={`truncate ${p.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}`}>
                        {p.text}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePlan(p.id)}
                      className={`h-8 px-3 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isDark
                          ? 'border-white/[0.08] hover:border-white/[0.18] bg-white/[0.02] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 shadow-2xs'
                      }`}
                      title="Remove task"
                    >
                      <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      <span>Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-3 px-3.5 rounded-lg border border-dashed border-zinc-300 dark:border-white/[0.08] text-xs text-zinc-500 dark:text-zinc-400">
                <p className="mb-2.5 font-medium">No plans added yet. Type a plan above and press Enter.</p>
                <div className="flex flex-wrap gap-2">
                  {['Code feature', 'Review PRs', 'Fix bugs', 'Solve LeetCode'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleAddPlan(suggestion)}
                      className={`h-8 px-3.5 text-xs font-medium rounded-lg border transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center justify-center ${
                        isDark
                          ? 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300'
                          : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Optional Additional Notes Textarea */}
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

      {/* History / Log Timeline */}
      <div className={`lg:col-span-2 rounded-2xl border p-4 sm:p-5 ${cardContainer}`}>
        <div className={`flex items-center justify-between pb-3 mb-3.5 border-b ${headerBorder}`}>
          <div className="flex items-center gap-2">
            <h2 className={`text-xs font-semibold tracking-wider uppercase ${sectionTitle}`}>
              Work Logs Timeline
            </h2>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono ${countBadge}`}>
              {filteredNotes.length} entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className={`h-8.5 rounded-lg border px-2.5 text-xs focus:outline-none font-mono ${inputBg}`}
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className={`h-8.5 px-3.5 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                  isDark
                    ? 'border-white/[0.08] text-zinc-300 hover:bg-white/[0.06]'
                    : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100 bg-white shadow-2xs'
                }`}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <p className="text-xs font-mono">No work logs recorded for this date.</p>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredNotes.map((note) => {
              const stats = getNoteStats(note.content)

              return (
                <div
                  key={note.id}
                  className={`p-4 rounded-xl border relative group transition ${logCardBg}`}
                >
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-inherit">
                    <div className="flex items-center gap-2.5">
                      <span className={`font-mono text-xs font-semibold flex items-center gap-1.5 ${
                        isDark ? 'text-zinc-200' : 'text-zinc-800'
                      }`}>
                        <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {note.date}
                      </span>

                      {/* Completion Percentage Badge */}
                      {stats.total > 0 && (
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-md border font-mono font-medium flex items-center gap-1.5 ${
                            stats.percentage === 100
                              ? isDark
                                ? 'border-white/[0.2] bg-white/[0.08] text-white font-semibold'
                                : 'border-zinc-900/20 bg-zinc-900/5 text-zinc-950 font-semibold'
                              : isDark
                              ? 'border-white/[0.08] bg-white/[0.03] text-zinc-300'
                              : 'border-zinc-200 bg-zinc-100 text-zinc-700'
                          }`}
                          title={`${stats.completed} of ${stats.total} tasks completed`}
                        >
                          {stats.percentage === 100 && (
                            <svg className="w-3 h-3 text-zinc-300 dark:text-zinc-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          <span>{stats.percentage}% Done</span>
                          <span className="opacity-60 text-[10px]">({stats.completed}/{stats.total})</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-500">
                        by {note.createdBy?.split('@')[0] || note.createdBy}
                      </span>
                      <button
                        onClick={() => onDeleteNote(note)}
                        className={`h-8 px-3 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center gap-1.5 ${
                          isDark
                            ? 'border-white/[0.08] hover:border-white/[0.18] bg-white/[0.02] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200'
                            : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 shadow-2xs'
                        }`}
                        title="Delete log"
                      >
                        <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Markdown Checkboxes Content with Confirmation */}
                  <div className="text-xs font-mono leading-relaxed space-y-2">
                    {note.content.split('\n').map((line, idx) => {
                      const parsed = parseTaskLine(line)

                      if (parsed.isCheckbox) {
                        const completionTime = parsed.completed
                          ? formatCompletionTime(parsed.completedAt, note.createdAt)
                          : null

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              // If task is not checked, prompt confirmation to mark done permanently
                              if (!parsed.completed) {
                                setConfirmingTask({
                                  noteId: note.id,
                                  noteContent: note.content,
                                  lineIndex: idx,
                                  taskText: parsed.text,
                                })
                              }
                            }}
                            className={`flex items-start gap-2.5 py-1.5 select-none group/item transition rounded-lg px-2 border ${
                              parsed.completed
                                ? isDark
                                  ? 'bg-white/[0.02] border-white/[0.04]'
                                  : 'bg-zinc-100/60 border-zinc-200/70'
                                : isDark
                                ? 'cursor-pointer hover:bg-white/[0.03] border-transparent hover:border-white/[0.08]'
                                : 'cursor-pointer hover:bg-zinc-100 border-transparent hover:border-zinc-200'
                            }`}
                          >
                            <span
                              className={`mt-0.5 w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition ${
                                parsed.completed
                                  ? isDark
                                    ? 'bg-white border-white text-zinc-950 shadow-2xs'
                                    : 'bg-zinc-900 border-zinc-900 text-white shadow-2xs'
                                  : isDark
                                  ? 'border-white/[0.25] group-hover/item:border-white/[0.5] bg-transparent'
                                  : 'border-zinc-300 group-hover/item:border-zinc-500 bg-white'
                              }`}
                              title={parsed.completed ? 'Completed (locked to preserve consistency)' : 'Click to complete'}
                            >
                              {parsed.completed && (
                                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </span>

                            <div className="flex-1 min-w-0">
                              <span
                                className={`block break-words transition ${
                                  parsed.completed
                                    ? 'line-through text-zinc-400 dark:text-zinc-500'
                                    : isDark
                                    ? 'text-zinc-200 group-hover/item:text-white'
                                    : 'text-zinc-800 group-hover/item:text-zinc-950'
                                }`}
                              >
                                {parsed.text}
                              </span>

                              {/* Task Completion Date & Time */}
                              {parsed.completed && completionTime && (
                                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                                  <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  <span>Completed on {completionTime}</span>
                                </div>
                              )}
                            </div>

                            {parsed.completed && (
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-md border shrink-0 select-none ${
                                  isDark
                                    ? 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
                                    : 'bg-white text-zinc-600 border-zinc-200 shadow-2xs'
                                }`}
                                title="Completed and locked"
                              >
                                Done
                              </span>
                            )}
                          </div>
                        )
                      }

                      return (
                        <div key={idx} className={line.trim() === '' ? 'h-2' : 'whitespace-pre-wrap opacity-90'}>
                          {line}
                        </div>
                      )
                    })}
                  </div>

                  {/* Inline quick task adder for existing note */}
                  {onUpdateNote && (
                    <div className="mt-3 pt-2.5 border-t border-inherit flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="+ Add another task to this day..."
                        value={timelineNewTaskText[note.id] || ''}
                        onChange={(e) =>
                          setTimelineNewTaskText((prev) => ({ ...prev, [note.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleInlineAddTask(note.id, note.content)
                          }
                        }}
                        className={`flex-1 h-8.5 rounded-lg border px-3 text-xs focus:outline-none font-mono ${inputBg}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleInlineAddTask(note.id, note.content)}
                        disabled={!(timelineNewTaskText[note.id] || '').trim()}
                        className={`h-8.5 px-4 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-40 cursor-pointer ${
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
              )
            })}
          </div>
        )}
      </div>

      {/* Irreversible Task Completion Confirmation Modal */}
      {confirmingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl border p-5 sm:p-6 shadow-2xl space-y-4 ${
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
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingTask(null)}
                disabled={isConfirming}
                className={`h-9 px-4 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer ${
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
                className={`h-9 px-4 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-sm flex items-center gap-1.5 ${
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
