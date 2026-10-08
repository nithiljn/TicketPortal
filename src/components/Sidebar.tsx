import React, { useState, useRef, useEffect } from 'react'
import { TicketStatus, TicketPriority, AuthUser } from '@/types'

interface SidebarProps {
  // Mobile drawer state
  isOpen: boolean
  onClose: () => void

  // User Auth & Role
  user?: AuthUser | null
  onLogout?: () => void

  // Projects
  availableProjects: string[]
  selectedProject: string
  onSelectProject: (proj: string) => void

  // Status & Priority Filters
  selectedStatus: TicketStatus | 'ALL'
  onSelectStatus: (status: TicketStatus | 'ALL') => void

  selectedPriority: TicketPriority | 'ALL'
  onSelectPriority: (p: TicketPriority | 'ALL') => void

  // Date Range Filter (From - To)
  fromDate: string
  toDate: string
  onSelectFromDate: (d: string) => void
  onSelectToDate: (d: string) => void
  onClearDateRange: () => void

  // Theme Settings
  theme: 'dark' | 'light'
  onToggleTheme: () => void

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
  onOpenCreateWorkspaceModal?: () => void
}

export function Sidebar({
  isOpen,
  onClose,
  user,
  onLogout,
  availableProjects,
  selectedProject,
  onSelectProject,
  selectedStatus,
  onSelectStatus,
  selectedPriority,
  onSelectPriority,
  fromDate,
  toDate,
  onSelectFromDate,
  onSelectToDate,
  onClearDateRange,
  theme,
  onToggleTheme,
  ticketCounts,
  onOpenCreateModal,
  onOpenCreateWorkspaceModal,
}: SidebarProps) {
  const isDark = theme === 'dark'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false)
      }
    }
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSettingsOpen])

  const sidebarBg = isDark
    ? 'bg-[#0d0d10] border-white/[0.06] text-zinc-400'
    : 'bg-white border-zinc-200 text-zinc-600'
  const headerBorder = isDark ? 'border-white/[0.06]' : 'border-zinc-200'
  const textPrimary = isDark ? 'text-zinc-100' : 'text-zinc-900'
  const itemHover = isDark ? 'hover:bg-white/[0.04] hover:text-zinc-200' : 'hover:bg-zinc-100 hover:text-zinc-900'
  const itemActive = isDark
    ? 'bg-white/[0.08] text-white font-medium border border-white/[0.12]'
    : 'bg-zinc-100 text-zinc-950 font-semibold border border-zinc-300/80 shadow-2xs'
  const inputBg = isDark
    ? 'bg-black/40 border-white/[0.08] text-zinc-200'
    : 'bg-zinc-50 border-zinc-200 text-zinc-900'

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 border-r flex flex-col justify-between shrink-0 select-none transition-transform duration-200 ease-in-out ${sidebarBg} ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className={`h-14 px-4 flex items-center justify-between border-b ${headerBorder}`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                isDark
                  ? 'bg-zinc-800 border border-zinc-700/80 text-white shadow-xs'
                  : 'bg-zinc-900 border border-zinc-800 text-white shadow-xs'
              }`}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                  <line x1="13" y1="5" x2="13" y2="7" />
                  <line x1="13" y1="11" x2="13" y2="13" />
                  <line x1="13" y1="17" x2="13" y2="19" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`font-semibold text-xs tracking-wider ${textPrimary}`}>
                    TicketFlow
                  </span>
                </div>
                <span className={`block text-[11px] font-medium leading-none ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Maintain Daily Work
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className={`lg:hidden p-1.5 rounded-lg transition ${itemHover}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Action Button: "+ New Ticket" */}
          <div className="p-3">
            <button
              onClick={() => {
                onOpenCreateModal()
                onClose()
              }}
              className={`w-full h-9 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${
                isDark
                  ? 'bg-white hover:bg-zinc-200 border-white text-zinc-950'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-900 text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Ticket</span>
            </button>
          </div>

          {/* Scrollable Navigation & Facets */}
          <div className="flex-1 overflow-y-auto px-3 py-1 space-y-5 text-xs">
            {/* Workspaces Facet */}
            <div>
              <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <span>Workspaces</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono">{availableProjects.length}</span>
                  {onOpenCreateWorkspaceModal && (
                    <button
                      onClick={onOpenCreateWorkspaceModal}
                      type="button"
                      className="p-0.5 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
                      title="Create new project workspace"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    onSelectProject('ALL')
                    onClose()
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-left ${
                    selectedProject === 'ALL' ? itemActive : itemHover
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span className="truncate">All Workspaces</span>
                  </div>
                  {selectedProject === 'ALL' && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                </button>

                {availableProjects.map((proj) => (
                  <button
                    key={proj}
                    onClick={() => {
                      onSelectProject(proj)
                      onClose()
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-left ${
                      selectedProject === proj ? itemActive : itemHover
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="truncate">{proj}</span>
                    </div>
                    {selectedProject === proj && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                  </button>
                ))}

                {onOpenCreateWorkspaceModal && (
                  <button
                    onClick={onOpenCreateWorkspaceModal}
                    type="button"
                    className={`w-full mt-1.5 px-2.5 py-1.5 rounded-lg border border-dashed flex items-center gap-2 transition cursor-pointer text-left text-xs ${
                      isDark
                        ? 'border-white/[0.1] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.2] hover:bg-white/[0.02]'
                        : 'border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400 hover:bg-zinc-100'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>New Workspace</span>
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter Facet */}
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
                      selectedStatus === item.id ? itemActive : itemHover
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />}
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-60">{item.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter Facet */}
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
                      selectedPriority === item.id ? itemActive : `${inputBg} ${itemHover}`
                    }`}
                  >
                    {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filtration (From - To) */}
            <div>
              <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <span>Date Range Filter</span>
                {(fromDate || toDate) && (
                  <button
                    onClick={onClearDateRange}
                    className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="block text-[10px] text-zinc-500 mb-0.5">From Date</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => onSelectFromDate(e.target.value)}
                    className={`w-full rounded-lg px-2.5 py-1 text-[11px] focus:outline-none font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-500 mb-0.5">To Date</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => onSelectToDate(e.target.value)}
                    className={`w-full rounded-lg px-2.5 py-1 text-[11px] focus:outline-none font-mono ${inputBg}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Profile & Settings Footer */}
          <div className={`p-3 border-t ${headerBorder} relative`} ref={settingsRef}>
            {/* Settings Popover Dropdown Menu (Anchored above the profile card) */}
            {isSettingsOpen && (
              <div
                className={`absolute bottom-full left-3 right-3 mb-2.5 p-2 rounded-2xl border shadow-2xl z-50 transition-all ${
                  isDark
                    ? 'bg-[#151518] border-white/[0.12] text-zinc-200 shadow-black/80'
                    : 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-500/20'
                }`}
              >
                <div className="px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Settings & Preferences
                </div>

                {/* Appearance Theme Switcher */}
                <div className={`flex items-center justify-between p-2 rounded-xl transition ${
                  isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-zinc-50'
                }`}>
                  <div className="flex items-center gap-2">
                    {isDark ? (
                      <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    )}
                    <span className="text-xs font-medium">Appearance</span>
                  </div>

                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      isDark
                        ? 'bg-white/[0.08] border-white/[0.12] text-zinc-200 hover:bg-white/[0.12]'
                        : 'bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
                    }`}
                  >
                    <span>{isDark ? 'Dark' : 'Light'}</span>
                  </button>
                </div>

                <div className={`my-1 border-t ${isDark ? 'border-white/[0.08]' : 'border-zinc-100'}`} />

                {/* Log Out Option */}
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false)
                      onLogout()
                    }}
                    className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                      isDark
                        ? 'hover:bg-rose-500/10 text-rose-400 hover:text-rose-300'
                        : 'hover:bg-rose-50 text-rose-700'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Log Out</span>
                  </button>
                )}
              </div>
            )}

            {/* Profile Card with Settings Gear Trigger */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
              isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/[0.08]"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-lg font-semibold text-xs flex items-center justify-center shrink-0 uppercase ${
                    isDark ? 'bg-white/[0.08] text-zinc-200' : 'bg-zinc-200 text-zinc-800'
                  }`}>
                    {user?.name ? user.name.slice(0, 2) : 'US'}
                  </div>
                )}
                <div className="truncate min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`block text-xs font-semibold truncate ${textPrimary}`}>
                      {user?.name || 'User'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Active
                    </span>
                  </div>
                  <span className="block text-[10px] text-zinc-500 truncate">
                    {user?.email || (user?.username ? `@${user.username}` : 'authenticated')}
                  </span>
                </div>
              </div>

              {/* Settings Gear Button */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen((prev) => !prev)}
                className={`p-1.5 rounded-lg border transition cursor-pointer shrink-0 ${
                  isSettingsOpen
                    ? isDark
                      ? 'bg-white/[0.1] border-white/[0.2] text-white'
                      : 'bg-zinc-200 border-zinc-300 text-zinc-900'
                    : isDark
                      ? 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] hover:border-white/[0.08]'
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 hover:border-zinc-300'
                }`}
                title="Settings & Appearance"
                aria-label="Settings"
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isSettingsOpen ? 'rotate-90' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
