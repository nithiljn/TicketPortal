'use client'

import React from 'react'
import { TicketStatus, TicketPriority } from '@/types'

interface SidebarProps {
  // Active primary view
  activeTab: 'inbox' | 'board' | 'notes'
  onSelectTab: (tab: 'inbox' | 'board' | 'notes') => void

  // Projects
  availableProjects: string[]
  selectedProject: string
  onSelectProject: (proj: string) => void

  // Filters
  selectedStatus: TicketStatus | 'ALL'
  onSelectStatus: (status: TicketStatus | 'ALL') => void

  selectedPriority: TicketPriority | 'ALL'
  onSelectPriority: (p: TicketPriority | 'ALL') => void

  // Stats
  ticketCounts: {
    total: number
    todo: number
    inProgress: number
    done: number
    blocked: number
    notesCount: number
  }

  // Trigger modal
  onOpenCreateModal: () => void
}

export function Sidebar({
  activeTab,
  onSelectTab,
  availableProjects,
  selectedProject,
  onSelectProject,
  selectedStatus,
  onSelectStatus,
  selectedPriority,
  onSelectPriority,
  ticketCounts,
  onOpenCreateModal,
}: SidebarProps) {
  return (
    <aside className="w-64 h-screen bg-slate-950 border-r border-slate-850 flex flex-col justify-between shrink-0 select-none">
      {/* Top Header & Navigation */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-850/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-xs text-slate-100 tracking-wider uppercase">
                TicketPortal
              </span>
              <span className="block text-[10px] text-cyan-400/80 font-mono">Workspace OS</span>
            </div>
          </div>
        </div>

        {/* Action Button: "+ New Ticket" (styled like ChatGPT New Chat button) */}
        <div className="p-3">
          <button
            onClick={onOpenCreateModal}
            className="w-full h-10 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-white text-xs font-medium flex items-center justify-between transition group shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400 group-hover:rotate-90 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Ticket</span>
            </div>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-mono">
              Ctrl+N
            </kbd>
          </button>
        </div>

        {/* Scrollable Navigation & Facets */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-5 text-xs text-slate-400">
          {/* Section 1: Primary Views */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Views
            </div>
            <div className="space-y-0.5">
              {/* Inbox (Primary Table View) */}
              <button
                onClick={() => onSelectTab('inbox')}
                className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between transition cursor-pointer ${
                  activeTab === 'inbox'
                    ? 'bg-cyan-500/15 text-cyan-300 font-medium border border-cyan-500/30'
                    : 'hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                  </svg>
                  <span>Inbox</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">{ticketCounts.total}</span>
              </button>

              {/* Kanban Board */}
              <button
                onClick={() => onSelectTab('board')}
                className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between transition cursor-pointer ${
                  activeTab === 'board'
                    ? 'bg-cyan-500/15 text-cyan-300 font-medium border border-cyan-500/30'
                    : 'hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="18" rx="1" />
                    <rect x="14" y="3" width="7" height="18" rx="1" />
                  </svg>
                  <span>Kanban Board</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">{ticketCounts.total}</span>
              </button>

              {/* Daily Standup Notes */}
              <button
                onClick={() => onSelectTab('notes')}
                className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between transition cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-cyan-500/15 text-cyan-300 font-medium border border-cyan-500/30'
                    : 'hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <span>Daily Work Logs</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">{ticketCounts.notesCount}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Project Workspaces (ChatGPT-like Project List) */}
          <div>
            <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <span>Workspaces</span>
              <span className="font-mono text-slate-600">{availableProjects.length}</span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => onSelectProject('ALL')}
                className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-left ${
                  selectedProject === 'ALL'
                    ? 'bg-slate-900 text-cyan-300 font-medium border border-slate-800'
                    : 'hover:bg-slate-900/60 hover:text-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span className="truncate">All Workspaces</span>
                </div>
                {selectedProject === 'ALL' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </button>

              {availableProjects.map((proj) => (
                <button
                  key={proj}
                  onClick={() => onSelectProject(proj)}
                  className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-left ${
                    selectedProject === proj
                      ? 'bg-slate-900 text-cyan-300 font-medium border border-slate-800'
                      : 'hover:bg-slate-900/60 hover:text-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <svg className="w-3.5 h-3.5 shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="truncate">{proj}</span>
                  </div>
                  {selectedProject === proj && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Status Filters */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Status Filter
            </div>
            <div className="space-y-0.5">
              {[
                { id: 'ALL', label: 'All Statuses', count: ticketCounts.total },
                { id: 'TODO', label: 'To Do', count: ticketCounts.todo, dot: 'bg-sky-400' },
                { id: 'IN_PROGRESS', label: 'In Progress', count: ticketCounts.inProgress, dot: 'bg-cyan-400' },
                { id: 'DONE', label: 'Completed', count: ticketCounts.done, dot: 'bg-emerald-400' },
                { id: 'BLOCKED', label: 'Blocked', count: ticketCounts.blocked, dot: 'bg-rose-400' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectStatus(item.id as TicketStatus | 'ALL')}
                  className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                    selectedStatus === item.id
                      ? 'bg-slate-900 text-slate-100 font-medium border border-slate-800'
                      : 'hover:bg-slate-900/60 hover:text-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />}
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{item.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Priority Filters */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Priority Filter
            </div>
            <div className="grid grid-cols-2 gap-1">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'URGENT', label: 'Urgent', dot: 'bg-rose-500' },
                { id: 'HIGH', label: 'High', dot: 'bg-amber-500' },
                { id: 'MEDIUM', label: 'Medium', dot: 'bg-sky-500' },
                { id: 'LOW', label: 'Low', dot: 'bg-teal-500' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectPriority(item.id as TicketPriority | 'ALL')}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                    selectedPriority === item.id
                      ? 'bg-slate-900 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile Footer (like ChatGPT) */}
        <div className="p-3 border-t border-slate-850/80 bg-slate-950">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-850">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-cyan-600/30 text-cyan-300 font-semibold text-xs flex items-center justify-center border border-cyan-500/30 shrink-0">
                JN
              </div>
              <div className="truncate">
                <span className="block text-xs font-medium text-slate-200 truncate">
                  James Nithil
                </span>
                <span className="block text-[10px] text-emerald-400 font-mono">
                  Online (PostgreSQL)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
