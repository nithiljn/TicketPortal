'use client'

import React, { useState } from 'react'
import { DailyNote } from '@/types'

interface DailyNotesProps {
  notes: DailyNote[]
  onAddNote: (content: string, date: string) => Promise<void>
  onDeleteNote: (id: string) => Promise<void>
}

export function DailyNotes({ notes, onAddNote, onDeleteNote }: DailyNotesProps) {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Compose Note Section */}
      <div className="lg:col-span-1 rounded-2xl bg-[#111114] border border-white/[0.06] p-4 sm:p-5 h-fit shadow-sm">
        <div className="flex items-center gap-2 pb-3 mb-3.5 border-b border-white/[0.06]">
          <h2 className="text-xs font-semibold tracking-wider uppercase text-zinc-200">
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
              className="w-full rounded-lg bg-black/40 border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white/[0.2] font-mono"
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
                className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06] transition cursor-pointer"
              >
                + Template
              </button>
            </div>
            <textarea
              rows={8}
              placeholder="Record daily achievements, challenges, decisions, or code notes..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/[0.08] p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] font-mono leading-relaxed resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full py-2 rounded-xl bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? 'Saving Entry...' : 'Save Work Log'}
          </button>
        </form>
      </div>

      {/* History / Log Timeline */}
      <div className="lg:col-span-2 rounded-2xl bg-[#111114] border border-white/[0.06] p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold tracking-wider uppercase text-zinc-200">
              Work Logs Timeline
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 border border-white/[0.06] font-mono">
              {filteredNotes.length} entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-lg bg-black/40 border border-white/[0.08] px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-white/[0.2] font-mono"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer"
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
                className="group rounded-xl bg-[#16161a] border border-white/[0.06] p-3.5 transition hover:border-white/[0.1]"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.04] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-white/[0.04] text-zinc-300 font-mono text-[10px] border border-white/[0.06]">
                      {note.date}
                    </span>
                    <span className="text-zinc-400 text-[11px]">
                      By {note.createdBy || 'Nithil'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete this work log entry?')) {
                        onDeleteNote(note.id)
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition text-zinc-400 hover:text-rose-400 text-xs p-1 rounded hover:bg-rose-500/10 cursor-pointer"
                    title="Delete entry"
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
                <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-200 leading-relaxed">
                  {note.content}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
