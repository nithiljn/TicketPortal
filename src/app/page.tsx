'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Ticket, DailyNote, TicketStatus, TicketPriority } from '@/types'
import { fetchGraphQL } from '@/lib/graphql-client'
import { Sidebar } from '@/components/Sidebar'
import { InboxTable } from '@/components/InboxTable'
import { DashboardView } from '@/components/DashboardView'
import { KanbanBoard } from '@/components/KanbanBoard'
import { DailyNotes } from '@/components/DailyNotes'
import { TicketModal } from '@/components/TicketModal'
import { WorkspaceModal } from '@/components/WorkspaceModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { Toast } from '@/components/Toast'
import { LoginScreen } from '@/components/LoginScreen'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const { user, isLoading: isAuthLoading, logout } = useAuth()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([])
  const [availableProjects, setAvailableProjects] = useState<string[]>([
    'Ticket Portal',
  ])
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null)
  const [noteToDelete, setNoteToDelete] = useState<DailyNote | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{
    isOpen: boolean
    title: string
    message?: string
  }>({
    isOpen: false,
    title: '',
    message: '',
  })

  // Theme State: 'dark' | 'light' (Persisted in localStorage)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const savedTheme = localStorage.getItem('tp_theme') as 'dark' | 'light' | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('tp_theme', next)
      return next
    })
  }

  // Mobile Drawer State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Views: 'inbox' | 'dashboard' | 'board' | 'notes'
  const [activeTab, setActiveTab] = useState<'inbox' | 'dashboard' | 'board' | 'notes'>('inbox')

  // Facet Filters
  const [selectedProject, setSelectedProject] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | 'ALL'>('ALL')
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | 'ALL'>('ALL')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)

  // 1. Fetch Data from GraphQL
  const loadData = useCallback(async () => {
    // Security: Do not fetch or flash data before authentication resolves
    if (isAuthLoading || !user?.email) {
      setTickets([])
      setDailyNotes([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const query = /* GraphQL */ `
        query GetPortalData($projectName: String, $search: String, $userEmail: String) {
          projects(userEmail: $userEmail)
          tickets(projectName: $projectName, search: $search, userEmail: $userEmail) {
            id
            title
            description
            status
            priority
            category
            projectName
            createdBy
            updatedBy
            createdAt
            updatedAt
          }
          dailyNotes(userEmail: $userEmail) {
            id
            date
            content
            createdBy
            createdAt
          }
        }
      `

      const data = await fetchGraphQL<{
        projects: string[]
        tickets: Ticket[]
        dailyNotes: DailyNote[]
      }>(query, {
        projectName: selectedProject !== 'ALL' ? selectedProject : null,
        search: searchTerm.trim() || null,
        userEmail: user.email,
      })

      setTickets(data.tickets || [])
      setDailyNotes(data.dailyNotes || [])

      // Merge with user-specific locally stored workspaces
      let localWs: string[] = []
      const storageKey = `tp_workspaces_${user.email.toLowerCase()}`
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          localWs = JSON.parse(stored)
        }
        // Clean legacy un-scoped workspaces cache
        localStorage.removeItem('tp_workspaces')
      } catch {
        // ignore
      }

      const merged = Array.from(
        new Set(['Ticket Portal', ...(data.projects || []), ...localWs])
      )
      setAvailableProjects(merged)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading data'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [selectedProject, searchTerm, user?.email, isAuthLoading])

  useEffect(() => {
    if (!isAuthLoading && user?.email) {
      loadData()
    }
  }, [loadData, isAuthLoading, user?.email])

  // Keyboard shortcut Ctrl+N / Cmd+N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setEditingTicket(null)
        setIsModalOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 2. Filtered Tickets based on Facets + Date Range (From - To)
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedStatus !== 'ALL' && t.status !== selectedStatus) {
        return false
      }
      if (selectedPriority !== 'ALL' && t.priority !== selectedPriority) {
        return false
      }
      // Date Range Filter
      if (fromDate) {
        const ticketDate = t.createdAt.split('T')[0]
        if (ticketDate < fromDate) return false
      }
      if (toDate) {
        const ticketDate = t.createdAt.split('T')[0]
        if (ticketDate > toDate) return false
      }
      return true
    })
  }, [tickets, selectedStatus, selectedPriority, fromDate, toDate])

  // 3. Facet Counts
  const ticketCounts = useMemo(() => {
    const total = tickets.length
    const todo = tickets.filter((t) => t.status === 'TODO').length
    const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS').length
    const done = tickets.filter((t) => t.status === 'DONE').length
    const blocked = tickets.filter((t) => t.status === 'BLOCKED').length
    const notesCount = dailyNotes.length
    return { total, todo, inProgress, done, blocked, notesCount }
  }, [tickets, dailyNotes])

  // 4. GraphQL Mutations
  const handleStatusChange = async (id: string, newStatus: TicketStatus) => {
    try {
      const mutation = /* GraphQL */ `
        mutation UpdateStatus($id: ID!, $status: TicketStatus!) {
          updateTicket(id: $id, input: { status: $status }) {
            id
            status
            updatedAt
          }
        }
      `
      await fetchGraphQL(mutation, { id, status: newStatus })
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      )
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update status')
      loadData()
    }
  }

  const handleSaveTicket = async (ticketData: {
    id?: string
    title: string
    description: string
    status: TicketStatus
    priority: TicketPriority
    category: string
    projectName: string
    author: string
  }) => {
    const currentUserName = user?.email || user?.name || ticketData.author || 'User'

    if (ticketData.id) {
      const mutation = /* GraphQL */ `
        mutation UpdateTicket($id: ID!, $input: UpdateTicketInput!) {
          updateTicket(id: $id, input: $input) {
            id
            title
            description
            status
            priority
            category
            projectName
            updatedBy
            updatedAt
          }
        }
      `
      await fetchGraphQL(mutation, {
        id: ticketData.id,
        input: {
          title: ticketData.title,
          description: ticketData.description,
          status: ticketData.status,
          priority: ticketData.priority,
          category: ticketData.category,
          projectName: ticketData.projectName,
          updatedBy: currentUserName,
        },
      })
      setToast({
        isOpen: true,
        title: 'Ticket Updated Successfully',
        message: `Changes saved for "${ticketData.title}"`,
      })
    } else {
      const mutation = /* GraphQL */ `
        mutation CreateTicket($input: CreateTicketInput!) {
          createTicket(input: $input) {
            id
            title
            description
            status
            priority
            category
            projectName
            createdBy
            createdAt
          }
        }
      `
      await fetchGraphQL(mutation, {
        input: {
          title: ticketData.title,
          description: ticketData.description,
          status: ticketData.status,
          priority: ticketData.priority,
          category: ticketData.category,
          projectName: ticketData.projectName,
          createdBy: currentUserName,
        },
      })
      setToast({
        isOpen: true,
        title: 'Ticket Created Successfully',
        message: `"${ticketData.title}" added to ${ticketData.projectName}`,
      })
    }
    loadData()
  }

  const handleConfirmDeleteTicket = async () => {
    if (!ticketToDelete) return
    const deletedTitle = ticketToDelete.title
    setIsDeleting(true)
    try {
      const mutation = /* GraphQL */ `
        mutation DeleteTicket($id: ID!, $userEmail: String) {
          deleteTicket(id: $id, userEmail: $userEmail)
        }
      `
      await fetchGraphQL(mutation, { id: ticketToDelete.id, userEmail: user?.email })
      setTickets((prev) => prev.filter((t) => t.id !== ticketToDelete.id))
      setTicketToDelete(null)
      setToast({
        isOpen: true,
        title: 'Ticket Deleted',
        message: `"${deletedTitle}" was deleted successfully`,
      })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete ticket')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCreateWorkspace = async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return

    try {
      const mutation = /* GraphQL */ `
        mutation CreateWorkspace($name: String!) {
          createWorkspace(name: $name)
        }
      `
      await fetchGraphQL(mutation, { name: trimmed })
    } catch (err: unknown) {
      console.warn('Workspace GraphQL notice:', err)
    }

    setAvailableProjects((prev) => {
      const updated = Array.from(new Set([...prev, trimmed]))
      if (user?.email) {
        try {
          const storageKey = `tp_workspaces_${user.email.toLowerCase()}`
          localStorage.setItem(storageKey, JSON.stringify(updated))
        } catch {
          // ignore
        }
      }
      return updated
    })

    setSelectedProject(trimmed)
    setIsWorkspaceModalOpen(false)
    setToast({
      isOpen: true,
      title: 'Workspace Created',
      message: `Workspace "${name}" is ready`,
    })
  }

  const handleAddDailyNote = async (content: string, date: string) => {
    const mutation = /* GraphQL */ `
      mutation AddNote($input: CreateDailyNoteInput!) {
        createDailyNote(input: $input) {
          id
          date
          content
          createdBy
          createdAt
        }
      }
    `
    await fetchGraphQL(mutation, {
      input: {
        content,
        date,
        createdBy: user?.email || user?.name || 'User',
      },
    })
    loadData()
  }

  const handleConfirmDeleteDailyNote = async () => {
    if (!noteToDelete) return
    setIsDeleting(true)
    try {
      const mutation = /* GraphQL */ `
        mutation DeleteNote($id: ID!, $userEmail: String) {
          deleteDailyNote(id: $id, userEmail: $userEmail)
        }
      `
      await fetchGraphQL(mutation, { id: noteToDelete.id, userEmail: user?.email })
      setDailyNotes((prev) => prev.filter((n) => n.id !== noteToDelete.id))
      setNoteToDelete(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete note')
    } finally {
      setIsDeleting(false)
    }
  }

  const isDark = theme === 'dark'

  if (isAuthLoading) {
    return (
      <div
        className={`h-screen w-screen flex flex-col items-center justify-center font-sans ${
          theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-50 text-zinc-900'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/[0.1] text-sky-400 flex items-center justify-center animate-pulse mb-3">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2a2 2 0 0 0 0 4v2a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-2a2 2 0 0 0 0-4V9z" />
          </svg>
        </div>
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Authenticating TicketFlow...
        </p>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen theme={theme} onToggleTheme={handleToggleTheme} />
  }

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden font-sans transition-colors duration-150 ${
        isDark
          ? 'bg-[#09090b] text-zinc-100 selection:bg-white/[0.2] selection:text-white'
          : 'bg-zinc-50 text-zinc-900 selection:bg-zinc-900 selection:text-white'
      }`}
    >
      {/* 1. Left Sidebar (ChatGPT-Style with Theme Settings & Date Range) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        onLogout={logout}
        availableProjects={availableProjects}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        selectedPriority={selectedPriority}
        onSelectPriority={setSelectedPriority}
        fromDate={fromDate}
        toDate={toDate}
        onSelectFromDate={setFromDate}
        onSelectToDate={setToDate}
        onClearDateRange={() => {
          setFromDate('')
          setToDate('')
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        ticketCounts={ticketCounts}
        onOpenCreateModal={() => {
          setEditingTicket(null)
          setIsModalOpen(true)
        }}
        onOpenCreateWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
      />

      {/* 2. Main Content Canvas */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden ${
          isDark ? 'bg-[#09090b]' : 'bg-zinc-50'
        }`}
      >
        {/* Top Header Bar: Search on Left + Views Switcher (Inbox, Dashboard, Board, Notes) on Right */}
        <header
          className={`h-14 px-4 sm:px-6 border-b flex items-center justify-between gap-3 shrink-0 ${
            isDark
              ? 'border-white/[0.06] bg-[#09090b]'
              : 'border-zinc-200 bg-white'
          }`}
        >
          {/* Left: Mobile Hamburger + Search Input */}
          <div className="flex items-center gap-2.5 flex-1 max-w-sm">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-lg transition cursor-pointer shrink-0 ${
                isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title="Open Navigation Drawer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Search Input */}
            <div className="relative w-full">
              <svg
                className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full rounded-lg border pl-8 pr-8 py-1.5 text-xs focus:outline-none transition ${
                  isDark
                    ? 'bg-white/[0.04] border-white/[0.06] text-zinc-100 placeholder-zinc-500 focus:border-white/[0.2]'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Right: Views Switcher (Inbox, Dashboard, Board, Notes) + Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Switcher Segmented Pill */}
            <div
              className={`flex items-center p-0.5 rounded-lg border ${
                isDark
                  ? 'bg-white/[0.04] border-white/[0.06]'
                  : 'bg-zinc-100 border-zinc-200'
              }`}
            >
              {/* 1. Inbox Table */}
              <button
                onClick={() => setActiveTab('inbox')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'inbox'
                    ? isDark
                      ? 'bg-white/[0.12] text-white shadow-sm font-semibold'
                      : 'bg-white text-zinc-950 shadow-sm font-semibold'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                  <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                </svg>
                <span className="hidden sm:inline">Inbox</span>
              </button>

              {/* 2. Dashboard (Charts & Status) */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'dashboard'
                    ? isDark
                      ? 'bg-white/[0.12] text-white shadow-sm font-semibold'
                      : 'bg-white text-zinc-950 shadow-sm font-semibold'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              {/* 3. Board (Kanban) */}
              <button
                onClick={() => setActiveTab('board')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'board'
                    ? isDark
                      ? 'bg-white/[0.12] text-white shadow-sm font-semibold'
                      : 'bg-white text-zinc-950 shadow-sm font-semibold'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="18" rx="1" />
                  <rect x="14" y="3" width="7" height="18" rx="1" />
                </svg>
                <span className="hidden sm:inline">Board</span>
              </button>

              {/* 4. Notes (Daily Standup) */}
              <button
                onClick={() => setActiveTab('notes')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'notes'
                    ? isDark
                      ? 'bg-white/[0.12] text-white shadow-sm font-semibold'
                      : 'bg-white text-zinc-950 shadow-sm font-semibold'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span className="hidden sm:inline">Notes</span>
              </button>
            </div>

            {/* Quick Create Ticket Button */}
            <button
              onClick={() => {
                setEditingTicket(null)
                setIsModalOpen(true)
              }}
              className={`hidden sm:flex h-8 px-3 rounded-lg border text-xs font-medium items-center gap-1.5 transition cursor-pointer ${
                isDark
                  ? 'bg-white/[0.1] hover:bg-white/[0.16] border-white/[0.1] text-zinc-100 hover:text-white'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-900 text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create</span>
            </button>

            {/* Quick Logout Button */}
            <button
              onClick={logout}
              className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                isDark
                  ? 'bg-white/[0.04] hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 border-white/[0.08] text-zinc-400'
                  : 'bg-zinc-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border-zinc-200 text-zinc-600'
              }`}
              title="Sign out of TicketFlow"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Error Notification */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadData}
              className="font-semibold underline hover:text-rose-300 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Display Area */}
        <div className="flex-1 overflow-auto flex flex-col">
          {loading && tickets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <svg
                className="w-6 h-6 text-zinc-400 animate-spin mb-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Loading workspace data...
              </p>
            </div>
          ) : (
            <>
              {/* View 1: Inbox (Primary Table View) */}
              {activeTab === 'inbox' && (
                <InboxTable
                  tickets={filteredTickets}
                  onStatusChange={handleStatusChange}
                  onEditTicket={(ticket) => {
                    setEditingTicket(ticket)
                    setIsModalOpen(true)
                  }}
                  onDeleteTicket={(ticket) => setTicketToDelete(ticket)}
                  selectedProject={selectedProject}
                  theme={theme}
                />
              )}

              {/* View 2: Dashboard (Visual Charts & Status Metrics) */}
              {activeTab === 'dashboard' && (
                <DashboardView
                  tickets={filteredTickets}
                  dailyNotes={dailyNotes}
                  availableProjects={availableProjects}
                  theme={theme}
                />
              )}

              {/* View 3: Kanban Board */}
              {activeTab === 'board' && (
                <div className="p-4 sm:p-6">
                  <KanbanBoard
                    tickets={filteredTickets}
                    onStatusChange={handleStatusChange}
                    onEditTicket={(ticket) => {
                      setEditingTicket(ticket)
                      setIsModalOpen(true)
                    }}
                    onDeleteTicket={(ticket) => setTicketToDelete(ticket)}
                    theme={theme}
                  />
                </div>
              )}

              {/* View 4: Daily Work Logs */}
              {activeTab === 'notes' && (
                <div className="p-4 sm:p-6">
                  <DailyNotes
                    notes={dailyNotes}
                    onAddNote={handleAddDailyNote}
                    onDeleteNote={(note) => setNoteToDelete(note)}
                    theme={theme}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Separate Workspace Creation Modal */}
      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onCreateWorkspace={handleCreateWorkspace}
        existingWorkspaces={availableProjects}
        theme={theme}
      />

      {/* Ticket Modal */}
      <TicketModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTicket(null)
        }}
        onSave={handleSaveTicket}
        existingTicket={editingTicket}
        availableProjects={availableProjects}
        currentProject={selectedProject}
        theme={theme}
      />

      {/* Confirm Delete Ticket Modal */}
      <ConfirmModal
        isOpen={Boolean(ticketToDelete)}
        onClose={() => setTicketToDelete(null)}
        onConfirm={handleConfirmDeleteTicket}
        title="Delete Ticket"
        message={
          ticketToDelete
            ? `Are you sure you want to delete "${ticketToDelete.title}"? This action cannot be undone.`
            : 'Are you sure you want to delete this ticket?'
        }
        confirmText="Delete Ticket"
        cancelText="Cancel"
        theme={theme}
        loading={isDeleting}
      />

      {/* Confirm Delete Daily Note Modal */}
      <ConfirmModal
        isOpen={Boolean(noteToDelete)}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleConfirmDeleteDailyNote}
        title="Delete Work Log"
        message={
          noteToDelete
            ? `Are you sure you want to delete this work log for ${noteToDelete.date}? This action cannot be undone.`
            : 'Are you sure you want to delete this log?'
        }
        confirmText="Delete Log"
        cancelText="Cancel"
        theme={theme}
        loading={isDeleting}
      />

      {/* Floating Success / Action Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
        title={toast.title}
        message={toast.message}
        theme={theme}
      />
    </div>
  )
}
