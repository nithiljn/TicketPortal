'use client'

import React, { useState } from 'react'
import { DailyNote } from '@/types'

interface DailyNotesProps {
  notes: DailyNote[]
  onAddNote: (content: string, date: string) => Promise<void>
  onDeleteNote: (id: string) => Promise<void>
  theme?: 'dark' | 'light'
}

export function DailyNotes({
  notes,
  onAddNote,
  onDeleteNote,
  theme = 'dark',
}: DailyNotesProps) {
  const isDark = theme === 'dark'

  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterDate, setFilterDate] = useState<string>('')

  const handleQuickTemplate = (templateType: 'standup' | 'notes') => {
    if (templateType === 'standup') {
      setContent(
        `COMPLETED TODAY:\n- \n\nBLOCKERS & CHALLENGES:\n- None\n\nPLAN FOR TOMORROW:\n- `
      )
    } else {
      setContent(`WORK SUMMARY:\n- `)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    try {
      await onAddNote(content.trim(), selectedDate)
      setContent('')
    } finally {
      setLoading(false)
    }
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
  const templateBtn = isDark
    ? 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border-white/[0.06]'
    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
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
        <div className={`flex items-center gap-2 pb-3 mb-3.5 border-b ${headerBorder}`}>
          <h2 className={`text-xs font-semibold tracking-wider uppercase ${sectionTitle}`}>
            Log Daily Work
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Entry Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none font-mono ${inputBg}`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-zinc-400">
                Work Content
              </label>
              <button
                type="button"
                onClick={() => handleQuickTemplate('standup')}
                className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${templateBtn}`}
              >
                + Template
              </button>
            </div>
            <textarea
              rows={8}
              placeholder="Record daily achievements, challenges, decisions, or code notes..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`w-full rounded-lg border p-3 text-xs focus:outline-none font-mono leading-relaxed resize-none ${inputBg}`}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? 'Saving Entry...' : 'Save Work Log'}
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
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${countBadge}`}>
              {filteredNotes.length} entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className={`rounded-lg border px-2 py-1 text-xs focus:outline-none font-mono ${inputBg}`}
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
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
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`p-3.5 rounded-xl border relative group transition ${logCardBg}`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-inherit">
                  <span className="font-mono text-xs font-semibold text-sky-500 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {note.date}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500">
                      by {note.createdBy}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm('Delete this standup log?')) {
                          onDeleteNote(note.id)
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 transition cursor-pointer"
                      title="Delete log"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="text-xs font-mono whitespace-pre-wrap leading-relaxed opacity-90">
                  {note.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
