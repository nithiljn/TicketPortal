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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Compose Note Section */}
      <div className="lg:col-span-1 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl backdrop-blur-md h-fit">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800">
          <svg
            className="w-4 h-4 text-cyan-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-100">
            Log Daily Work
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Entry Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg bg-slate-950/80 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Work Content
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickTemplate('standup')}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 transition cursor-pointer font-medium"
                >
                  Standup Template
                </button>
              </div>
            </div>
            <textarea
              rows={9}
              placeholder="Record daily achievements, challenges, decisions, or code notes..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg bg-slate-950/80 border border-slate-800 p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>{loading ? 'Saving Entry...' : 'Save Work Log'}</span>
          </button>
        </form>
      </div>

      {/* History / Log Timeline */}
      <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-cyan-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-100">
              Work Logs Timeline
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800 font-mono">
              {filteredNotes.length} entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <svg
              className="w-8 h-8 text-slate-600 mb-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
            <p className="text-sm">No work logs recorded for this date.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="group rounded-xl bg-slate-950/70 border border-slate-800 p-4 transition hover:border-slate-700"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono text-[11px] font-semibold border border-cyan-500/20">
                      {note.date}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      By {note.createdBy || 'Nithil'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete this work log entry?')) {
                        onDeleteNote(note.id)
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-rose-400 text-xs p-1 rounded hover:bg-rose-500/10 cursor-pointer"
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
                <pre className="whitespace-pre-wrap font-mono text-xs text-slate-200 leading-relaxed">
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
