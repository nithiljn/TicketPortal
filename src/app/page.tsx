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

  // Navigation & Facet Filters (Managed via ChatGPT Left Sidebar)
  const [activeTab, setActiveTab] = useState<'inbox' | 'board' | 'notes'>('inbox')
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

  // Keyboard shortcut Ctrl+N or Cmd+N for New Ticket
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

  // 2. Filtered Tickets based on Sidebar Status & Priority Facets
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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* 1. ChatGPT-Style Full-Height Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
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
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-950">
        {/* Top Global Search & Metric Bar */}
        <header className="h-14 px-6 border-b border-slate-850 flex items-center justify-between gap-4 bg-slate-950 shrink-0">
          {/* Search Box */}
          <div className="relative w-72 sm:w-96">
            <svg
              className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500"
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
              placeholder="Search tickets by title, details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-800 pl-8 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="hidden md:flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">
              Scope: <strong className="text-slate-200">{ticketCounts.total}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400">
              In Progress: <strong>{ticketCounts.inProgress}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">
              Completed: <strong>{ticketCounts.done}</strong>
            </span>
          </div>
        </header>

        {/* Error Notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadData}
              className="font-semibold underline hover:text-rose-200 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main View Display */}
        <div className="flex-1 overflow-auto flex flex-col">
          {loading && tickets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <svg
                className="w-6 h-6 text-cyan-400 animate-spin mb-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Fetching records from PostgreSQL...
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
                <div className="p-6">
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
                <div className="p-6">
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
