'use client'

import React from 'react'
import { TicketStatus, TicketPriority } from '@/types'

interface SidebarProps {
  // Mobile drawer state
  isOpen: boolean
  onClose: () => void

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
  isOpen,
  onClose,
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
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0d0d10] border-r border-white/[0.06] flex flex-col justify-between shrink-0 select-none transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-zinc-200 font-semibold text-xs">
                TP
              </div>
              <div>
                <span className="font-semibold text-xs text-zinc-100 tracking-wider">
                  TicketPortal
                </span>
                <span className="block text-[10px] text-zinc-500 font-mono">Workspace OS</span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* "+ New Ticket" Button (ChatGPT style) */}
          <div className="p-3">
            <button
              onClick={() => {
                onOpenCreateModal()
                onClose()
              }}
              className="w-full h-9 px-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/[0.2] text-zinc-100 text-xs font-medium flex items-center justify-between transition group cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-zinc-300 group-hover:rotate-90 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>New Ticket</span>
              </div>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-white/[0.06] text-zinc-400 font-mono">
                ⌘N
              </kbd>
            </button>
          </div>

          {/* Navigation & Facet Filters List */}
          <div className="flex-1 overflow-y-auto px-3 py-1 space-y-5 text-xs text-zinc-400">
            {/* Workspaces List (ChatGPT style) */}
            <div>
              <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <span>Workspaces</span>
                <span className="font-mono text-zinc-600">{availableProjects.length}</span>
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    onSelectProject('ALL')
                    onClose()
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-left ${
                    selectedProject === 'ALL'
                      ? 'bg-white/[0.08] text-white font-medium border border-white/[0.1]'
                      : 'hover:bg-white/[0.04] hover:text-zinc-200 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <svg className="w-3.5 h-3.5 shrink-0 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span className="truncate">All Workspaces</span>
                  </div>
                  {selectedProject === 'ALL' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </button>

                {availableProjects.map((proj) => (
                  <button
                    key={proj}
                    onClick={() => {
                      onSelectProject(proj)
                      onClose()
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-left ${
                      selectedProject === proj
                        ? 'bg-white/[0.08] text-white font-medium border border-white/[0.1]'
                        : 'hover:bg-white/[0.04] hover:text-zinc-200 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <svg className="w-3.5 h-3.5 shrink-0 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="truncate">{proj}</span>
                    </div>
                    {selectedProject === proj && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Workflow Status Facets */}
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Status Filter
              </div>
              <div className="space-y-0.5">
                {[
                  { id: 'ALL', label: 'All Statuses', count: ticketCounts.total },
                  { id: 'TODO', label: 'To Do', count: ticketCounts.todo, dot: 'bg-zinc-400' },
                  { id: 'IN_PROGRESS', label: 'In Progress', count: ticketCounts.inProgress, dot: 'bg-amber-400' },
                  { id: 'DONE', label: 'Completed', count: ticketCounts.done, dot: 'bg-emerald-400' },
                  { id: 'BLOCKED', label: 'Blocked', count: ticketCounts.blocked, dot: 'bg-rose-400' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectStatus(item.id as TicketStatus | 'ALL')
                      onClose()
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                      selectedStatus === item.id
                        ? 'bg-white/[0.08] text-white font-medium border border-white/[0.1]'
                        : 'hover:bg-white/[0.04] hover:text-zinc-200 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />}
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">{item.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Priority Filter
              </div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'URGENT', label: 'Urgent', dot: 'bg-rose-500' },
                  { id: 'HIGH', label: 'High', dot: 'bg-amber-500' },
                  { id: 'MEDIUM', label: 'Medium', dot: 'bg-zinc-400' },
                  { id: 'LOW', label: 'Low', dot: 'bg-emerald-500' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectPriority(item.id as TicketPriority | 'ALL')
                      onClose()
                    }}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                      selectedPriority === item.id
                        ? 'bg-white/[0.1] text-white border-white/[0.15]'
                        : 'bg-black/30 text-zinc-400 border-white/[0.04] hover:border-white/[0.08]'
                    }`}
                  >
                    {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User Profile Footer */}
          <div className="p-3 border-t border-white/[0.06] bg-[#0d0d10]">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-white/[0.1] text-zinc-200 font-semibold text-xs flex items-center justify-center shrink-0">
                  JN
                </div>
                <div className="truncate">
                  <span className="block text-xs font-medium text-zinc-200 truncate">
                    James Nithil
                  </span>
                  <span className="block text-[10px] text-emerald-400 font-mono">
                    PostgreSQL Live
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
