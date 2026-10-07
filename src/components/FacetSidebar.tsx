'use client'

import React from 'react'
import { TicketStatus, TicketPriority } from '@/types'

interface FacetSidebarProps {
  availableProjects: string[]
  selectedProject: string
  onSelectProject: (proj: string) => void

  selectedStatuses: TicketStatus[]
  onToggleStatus: (status: TicketStatus) => void

  selectedPriorities: TicketPriority[]
  onTogglePriority: (priority: TicketPriority) => void

  availableCategories: string[]
  selectedCategories: string[]
  onToggleCategory: (cat: string) => void

  onResetFilters: () => void
  activeFilterCount: number
  totalTicketsCount: number
  filteredTicketsCount: number
}

const STATUS_OPTIONS: { id: TicketStatus; label: string; dotColor: string }[] = [
  { id: 'TODO', label: 'To Do', dotColor: 'bg-sky-400' },
  { id: 'IN_PROGRESS', label: 'In Progress', dotColor: 'bg-cyan-400' },
  { id: 'DONE', label: 'Completed', dotColor: 'bg-emerald-400' },
  { id: 'BLOCKED', label: 'Blocked', dotColor: 'bg-rose-400' },
]

const PRIORITY_OPTIONS: { id: TicketPriority; label: string; dotColor: string }[] = [
  { id: 'URGENT', label: 'Urgent', dotColor: 'bg-rose-500' },
  { id: 'HIGH', label: 'High', dotColor: 'bg-amber-500' },
  { id: 'MEDIUM', label: 'Medium', dotColor: 'bg-sky-500' },
  { id: 'LOW', label: 'Low', dotColor: 'bg-teal-500' },
]

export function FacetSidebar({
  availableProjects,
  selectedProject,
  onSelectProject,
  selectedStatuses,
  onToggleStatus,
  selectedPriorities,
  onTogglePriority,
  availableCategories,
  selectedCategories,
  onToggleCategory,
  onResetFilters,
  activeFilterCount,
  totalTicketsCount,
  filteredTicketsCount,
}: FacetSidebarProps) {
  return (
    <aside className="w-full lg:w-72 shrink-0 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 backdrop-blur-md shadow-xl flex flex-col gap-6 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="text-sm font-semibold tracking-wide text-slate-100 uppercase text-xs">
            Filter Facets
          </span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {activeFilterCount}
            </span>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={onResetFilters}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Results Count Meter */}
      <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3 text-xs flex items-center justify-between">
        <span className="text-slate-400">Matching Items</span>
        <span className="font-mono font-semibold text-cyan-300">
          {filteredTicketsCount} / {totalTicketsCount}
        </span>
      </div>

      {/* Facet 1: Project Workspace */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Project Workspace
        </label>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectProject('ALL')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between cursor-pointer ${
              selectedProject === 'ALL'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <span>All Projects</span>
            {selectedProject === 'ALL' && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </button>

          {availableProjects.map((proj) => (
            <button
              key={proj}
              type="button"
              onClick={() => onSelectProject(proj)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                selectedProject === proj
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <span className="truncate">{proj}</span>
              {selectedProject === proj && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Facet 2: Status */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Workflow Status
        </label>
        <div className="space-y-1.5">
          {STATUS_OPTIONS.map((item) => {
            const isChecked = selectedStatuses.includes(item.id)
            return (
              <label
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer text-xs transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${item.dotColor}`} />
                  <span className={isChecked ? 'text-slate-100 font-medium' : 'text-slate-400'}>
                    {item.label}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleStatus(item.id)}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 h-3.5 w-3.5 cursor-pointer accent-cyan-500"
                />
              </label>
            )
          })}
        </div>
      </div>

      {/* Facet 3: Priority */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Priority Level
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {PRIORITY_OPTIONS.map((item) => {
            const isChecked = selectedPriorities.includes(item.id)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTogglePriority(item.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  isChecked
                    ? 'bg-slate-800 text-slate-100 border-cyan-500/50'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${item.dotColor}`} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Facet 4: Category */}
      {availableCategories.length > 0 && (
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Categories
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableCategories.map((cat) => {
              const isChecked = selectedCategories.includes(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onToggleCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition cursor-pointer ${
                    isChecked
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </aside>
  )
}
