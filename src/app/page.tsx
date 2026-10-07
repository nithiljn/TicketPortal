'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Ticket, DailyNote, TicketStatus, TicketPriority } from '@/types'
import { fetchGraphQL } from '@/lib/graphql-client'
import { Sidebar } from '@/components/Sidebar'
import { InboxTable } from '@/components/InboxTable'
import { KanbanBoard } from '@/components/KanbanBoard'
import { DailyNotes } from '@/components/DailyNotes'
import { TicketModal } from '@/components/TicketModal'

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([])
  const [availableProjects, setAvailableProjects] = useState<string[]>([
    'Ticket Portal',
  ])

  // Mobile Drawer State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Top Right View Switcher: 'inbox' | 'board' | 'notes'
  const [activeTab, setActiveTab] = useState<'inbox' | 'board' | 'notes'>('inbox')

  // Facet Filters (Managed via Sidebar)
  const [selectedProject, setSelectedProject] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | 'ALL'>('ALL')
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | 'ALL'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)

  // 1. Fetch Data from GraphQL
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const query = /* GraphQL */ `
        query GetPortalData($projectName: String, $search: String) {
          projects
          tickets(projectName: $projectName, search: $search) {
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
          dailyNotes {
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
      })

      setTickets(data.tickets || [])
      setDailyNotes(data.dailyNotes || [])

      if (data.projects && data.projects.length > 0) {
        setAvailableProjects(data.projects)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading data'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [selectedProject, searchTerm])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Keyboard shortcut Ctrl+N or Cmd+N
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

  // 2. Filtered Tickets based on Facet Selections
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedStatus !== 'ALL' && t.status !== selectedStatus) {
        return false
      }
      if (selectedPriority !== 'ALL' && t.priority !== selectedPriority) {
        return false
      }
      return true
    })
  }, [tickets, selectedStatus, selectedPriority])

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
          updatedBy: ticketData.author,
        },
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
          createdBy: ticketData.author,
        },
      })
    }
    loadData()
  }

  const handleDeleteTicket = async (id: string) => {
    try {
      const mutation = /* GraphQL */ `
        mutation DeleteTicket($id: ID!) {
          deleteTicket(id: $id)
        }
      `
      await fetchGraphQL(mutation, { id })
      setTickets((prev) => prev.filter((t) => t.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete ticket')
    }
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
        createdBy: 'Nithil',
      },
    })
    loadData()
  }

  const handleDeleteDailyNote = async (id: string) => {
    const mutation = /* GraphQL */ `
      mutation DeleteNote($id: ID!) {
        deleteDailyNote(id: $id)
      }
    `
    await fetchGraphQL(mutation, { id })
    setDailyNotes((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 font-sans selection:bg-white/[0.2] selection:text-white">
      {/* 1. Left Sidebar (ChatGPT-style with Mobile Drawer support) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        availableProjects={availableProjects}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        selectedPriority={selectedPriority}
        onSelectPriority={setSelectedPriority}
        ticketCounts={ticketCounts}
        onOpenCreateModal={() => {
          setEditingTicket(null)
          setIsModalOpen(true)
        }}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#09090b]">
        {/* Top Header Bar: Search on Left + Views Switcher on Right */}
        <header className="h-14 px-4 sm:px-6 border-b border-white/[0.06] flex items-center justify-between gap-3 bg-[#09090b] shrink-0">
          {/* Left: Mobile Hamburger + Search Input */}
          <div className="flex items-center gap-2.5 flex-1 max-w-sm">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer shrink-0"
              title="Open Navigation"
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
                className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500"
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
                className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] pl-8 pr-8 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right: Views Switcher (Inbox Table, Board, Daily Notes) + Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Switcher Pill (Top Right of Inbox area) */}
            <div className="flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'inbox'
                    ? 'bg-white/[0.12] text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                  <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                </svg>
                <span className="hidden sm:inline">Inbox</span>
              </button>

              <button
                onClick={() => setActiveTab('board')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'board'
                    ? 'bg-white/[0.12] text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="18" rx="1" />
                  <rect x="14" y="3" width="7" height="18" rx="1" />
                </svg>
                <span className="hidden sm:inline">Board</span>
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'notes'
                    ? 'bg-white/[0.12] text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
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
              className="hidden sm:flex h-8 px-3 rounded-lg bg-white/[0.1] hover:bg-white/[0.16] border border-white/[0.1] text-zinc-100 hover:text-white text-xs font-medium items-center gap-1.5 transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create</span>
            </button>
          </div>
        </header>

        {/* Error Notification */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadData}
              className="font-semibold underline hover:text-rose-200 cursor-pointer"
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
                Loading PostgreSQL workspace data...
              </p>
            </div>
          ) : (
            <>
              {/* Primary View: Inbox Table Structure */}
              {activeTab === 'inbox' && (
                <InboxTable
                  tickets={filteredTickets}
                  onStatusChange={handleStatusChange}
                  onEditTicket={(ticket) => {
                    setEditingTicket(ticket)
                    setIsModalOpen(true)
                  }}
                  onDeleteTicket={handleDeleteTicket}
                  selectedProject={selectedProject}
                />
              )}

              {/* View 2: Kanban Board */}
              {activeTab === 'board' && (
                <div className="p-4 sm:p-6">
                  <KanbanBoard
                    tickets={filteredTickets}
                    onStatusChange={handleStatusChange}
                    onEditTicket={(ticket) => {
                      setEditingTicket(ticket)
                      setIsModalOpen(true)
                    }}
                    onDeleteTicket={handleDeleteTicket}
                  />
                </div>
              )}

              {/* View 3: Daily Work Logs */}
              {activeTab === 'notes' && (
                <div className="p-4 sm:p-6">
                  <DailyNotes
                    notes={dailyNotes}
                    onAddNote={handleAddDailyNote}
                    onDeleteNote={handleDeleteDailyNote}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
      />
    </div>
  )
}
