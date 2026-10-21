'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Ticket, DailyNote, TicketStatus, TicketPriority, Expense } from '@/types'
import { fetchGraphQL } from '@/lib/graphql-client'
import { Sidebar } from '@/components/Sidebar'
import { InboxTable } from '@/components/InboxTable'
import { DashboardView } from '@/components/DashboardView'
import { KanbanBoard } from '@/components/KanbanBoard'
import { DailyNotes } from '@/components/DailyNotes'
import { ExpenseTracker } from '@/components/ExpenseTracker'
import { ThemeSpinner } from '@/components/ThemeSpinner'
import { TicketModal } from '@/components/TicketModal'
import { ExpenseModal } from '@/components/ExpenseModal'
import { ExpenseCategoryModal } from '@/components/ExpenseCategoryModal'
import { WorkspaceModal } from '@/components/WorkspaceModal'
import { VersionModal } from '@/components/VersionModal'
import { DeleteWorkspaceModal } from '@/components/DeleteWorkspaceModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { ActivityHeatmapModal } from '@/components/ActivityHeatmapModal'
import { Toast } from '@/components/Toast'
import { LoginScreen } from '@/components/LoginScreen'
import { Button } from '@/components/Button'
import { useAuth } from '@/context/AuthContext'

const NAV_TABS = [
  {
    id: 'inbox',
    label: 'Inbox',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: 'board',
    label: 'Board',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="18" rx="1" />
        <rect x="14" y="3" width="7" height="18" rx="1" />
      </svg>
    ),
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <line x1="6" y1="15" x2="10" y2="15" />
      </svg>
    ),
  },
] as const

export default function Home() {
  const { user, isLoading: isAuthLoading, logout } = useAuth()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [inboxPage, setInboxPage] = useState(1)
  const [inboxPageSize, setInboxPageSize] = useState(20)
  const [inboxTotalCount, setInboxTotalCount] = useState(0)
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
    blocked: 0,
    bookmarked: 0,
  })
  const [boardTickets, setBoardTickets] = useState<Ticket[]>([])
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['inbox']))
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseCategories, setExpenseCategories] = useState<string[]>([])
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [availableProjects, setAvailableProjects] = useState<string[]>([])
  const [availableExpenseProjects, setAvailableExpenseProjects] = useState<string[]>([])
  const [availableVersions, setAvailableVersions] = useState<string[]>([])
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false)
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null)
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null)
  const [noteToDelete, setNoteToDelete] = useState<DailyNote | null>(null)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [notesFilterDate, setNotesFilterDate] = useState<string>('')
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

  // Theme State: 'dark' | 'light' (Default: 'light', persisted in localStorage)
  const [theme, setTheme] = useState<'dark' | 'light'>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('tp_theme') as 'dark' | 'light' | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      setTheme('light')
    }
  }, [])

  // Sync theme with root document element class for class-based styling
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('tp_theme', next)
      return next
    })
  }

  // Mobile Drawer State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Views: 'inbox' | 'dashboard' | 'board' | 'notes' | 'expenses'
  const [activeTab, setActiveTab] = useState<'inbox' | 'dashboard' | 'board' | 'notes' | 'expenses'>('inbox')

  // Facet Filters
  const [selectedProject, setSelectedProject] = useState<string>('ALL')
  const [selectedStatuses, setSelectedStatuses] = useState<TicketStatus[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<TicketPriority[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false)
  const [ticketIdFilter, setTicketIdFilter] = useState('')

  // Expense Specific Filters
  const [selectedExpenseProject, setSelectedExpenseProject] = useState<string>('ALL')
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<string | 'ALL'>('ALL')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | 'ALL'>('ALL')
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [expenseMinAmount, setExpenseMinAmount] = useState<string>('')
  const [expenseMaxAmount, setExpenseMaxAmount] = useState<string>('')
  const [expenseSearchQuery, setExpenseSearchQuery] = useState<string>('')

  // Loading & Transition States
  const [loading, setLoading] = useState(true)
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [isTabSwitching, setIsTabSwitching] = useState(false)
  const [tabSwitchTarget, setTabSwitchTarget] = useState<'inbox' | 'dashboard' | 'board' | 'notes' | 'expenses'>('inbox')
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const tabTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const openedTicketFromUrlRef = useRef<string | null>(null)

  // Segmented control refs & smooth sliding pill measurement
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  useEffect(() => {
    const updatePill = () => {
      const activeEl = tabRefs.current[activeTab]
      if (activeEl) {
        setPillStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
        })
      }
    }
    updatePill()
    window.addEventListener('resize', updatePill)
    return () => window.removeEventListener('resize', updatePill)
  }, [activeTab])

  const triggerFilterTransition = useCallback(() => {
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current)
    setIsFilterLoading(true)
    filterTimeoutRef.current = setTimeout(() => {
      setIsFilterLoading(false)
    }, 200)
  }, [])


  const handleSelectWorkspace = useCallback(
    (workspace: string) => {
      if (workspace === selectedProject) return
      setLoading(true)
      setSelectedProject(workspace)
    },
    [selectedProject]
  )

  const handleSelectExpenseWorkspace = useCallback(
    (workspace: string) => {
      setSelectedExpenseProject(workspace)
    },
    []
  )

  const handleSelectStatus = useCallback(
    (status: TicketStatus | 'ALL') => {
      if (status === 'ALL') {
        setSelectedStatuses([])
      } else {
        setSelectedStatuses((prev) =>
          prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
        )
      }
      triggerFilterTransition()
    },
    [triggerFilterTransition]
  )

  const handleSelectPriority = useCallback(
    (priority: TicketPriority | 'ALL') => {
      if (priority === 'ALL') {
        setSelectedPriorities([])
      } else {
        setSelectedPriorities((prev) =>
          prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
        )
      }
      triggerFilterTransition()
    },
    [triggerFilterTransition]
  )

  const handleSelectCategory = useCallback(
    (category: string | 'ALL') => {
      if (category === 'ALL') {
        setSelectedCategories([])
      } else {
        setSelectedCategories((prev) =>
          prev.some((c) => c.toUpperCase() === category.toUpperCase())
            ? prev.filter((c) => c.toUpperCase() !== category.toUpperCase())
            : [...prev, category]
        )
      }
      triggerFilterTransition()
    },
    [triggerFilterTransition]
  )

  const handleSelectVersion = useCallback(
    (version: string | 'ALL') => {
      if (version === 'ALL') {
        setSelectedVersions([])
      } else {
        setSelectedVersions((prev) =>
          prev.includes(version) ? prev.filter((v) => v !== version) : [...prev, version]
        )
      }
      triggerFilterTransition()
    },
    [triggerFilterTransition]
  )

  const handleSelectFromDate = useCallback(
    (date: string) => {
      setFromDate(date)
      triggerFilterTransition()
    },
    [triggerFilterTransition]
  )

  const handleSelectToDate = useCallback(
    (date: string) => {
      setToDate(date)
      triggerFilterTransition()
    },
    [triggerFilterTransition]
  )

  const handleClearDateRange = useCallback(() => {
    setFromDate('')
    setToDate('')
    triggerFilterTransition()
  }, [triggerFilterTransition])

  const handleSelectTicketIdFilter = useCallback(
    (id: string) => {
      setTicketIdFilter(id)
      triggerFilterTransition()
    },
    [triggerFilterTransition]
  )

  const handleClearTicketIdFilter = useCallback(() => {
    setTicketIdFilter('')
    triggerFilterTransition()
  }, [triggerFilterTransition])

  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current)
      if (tabTimeoutRef.current) clearTimeout(tabTimeoutRef.current)
    }
  }, [])

  const [error, setError] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('edit')

  const handleOpenCreateTicket = () => {
    setEditingTicket(null)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleOpenViewTicket = (ticket: Ticket) => {
    setEditingTicket(ticket)
    setModalMode('view')
    setIsModalOpen(true)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('ticket', ticket.ticketId || ticket.id)
      window.history.replaceState(null, '', url.toString())
    }
  }

  const handleOpenEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket)
    setModalMode('edit')
    setIsModalOpen(true)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('ticket', ticket.ticketId || ticket.id)
      window.history.replaceState(null, '', url.toString())
    }
  }

  const handleCloseTicketModal = () => {
    setIsModalOpen(false)
    setEditingTicket(null)
    openedTicketFromUrlRef.current = null
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.has('ticket') || url.searchParams.has('ticketId')) {
        url.searchParams.delete('ticket')
        url.searchParams.delete('ticketId')
        window.history.replaceState(null, '', url.toString())
      }
    }
  }

  // 1. Inbox Data Loader (Server-side Paginated)
  const loadInboxData = useCallback(
    async (page = 1, pageSize = 20) => {
      if (isAuthLoading || !user?.email) {
        setTickets([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const offset = Math.max(0, (page - 1) * pageSize)

        const query = /* GraphQL */ `
          query GetInboxData(
            $projectName: String
            $search: String
            $userEmail: String
            $limit: Int
            $offset: Int
            $status: TicketStatus
            $priority: TicketPriority
            $category: String
            $isBookmarked: Boolean
          ) {
            projects(userEmail: $userEmail, type: "TICKET")
            expenseProjects: projects(userEmail: $userEmail, type: "EXPENSE")
            versions(userEmail: $userEmail)
            tickets(
              projectName: $projectName
              search: $search
              userEmail: $userEmail
              limit: $limit
              offset: $offset
              status: $status
              priority: $priority
              category: $category
              isBookmarked: $isBookmarked
            ) {
              id
              ticketId
              title
              description
              commands
              status
              priority
              category
              version
              projectName
              createdBy
              updatedBy
              createdAt
              updatedAt
              isBookmarked
            }
            ticketsCount(
              projectName: $projectName
              search: $search
              userEmail: $userEmail
              status: $status
              priority: $priority
              category: $category
              isBookmarked: $isBookmarked
            )
            ticketStats(
              projectName: $projectName
              userEmail: $userEmail
            ) {
              total
              todo
              inProgress
              done
              blocked
              bookmarked
            }
          }
        `

        const data = await fetchGraphQL<{
          projects: string[]
          expenseProjects?: string[]
          versions?: string[]
          tickets: Ticket[]
          ticketsCount: number
          ticketStats: {
            total: number
            todo: number
            inProgress: number
            done: number
            blocked: number
            bookmarked: number
          }
        }>(query, {
          projectName: selectedProject !== 'ALL' ? selectedProject : null,
          search: searchTerm.trim() || null,
          userEmail: user.email,
          limit: pageSize,
          offset,
          status: selectedStatuses.length === 1 ? selectedStatuses[0] : null,
          priority: selectedPriorities.length === 1 ? selectedPriorities[0] : null,
          category: selectedCategories.length === 1 ? selectedCategories[0] : null,
          isBookmarked: showOnlyBookmarked ? true : null,
        })

        setTickets(data.tickets || [])
        setInboxTotalCount(data.ticketsCount ?? 0)
        setInboxPage(page)
        setInboxPageSize(pageSize)
        if (data.ticketStats) {
          setTicketStats(data.ticketStats)
        }
        setAvailableVersions(data.versions || [])

        // 1. Process Expense Workspaces for sidebar dropdown
        const serverExpenseProjects = (data.expenseProjects || []).filter(
          (p: string) => !p.startsWith('version:::') && !p.includes(':::version:::')
        )
        let localExpenseWs: string[] = []
        const expenseStorageKey = `tp_expense_workspaces_${user.email.toLowerCase()}`
        try {
          const stored = localStorage.getItem(expenseStorageKey)
          if (stored) {
            localExpenseWs = JSON.parse(stored)
          }
        } catch {
          // ignore
        }
        const mergedExpenseProjects = Array.from(
          new Set([...serverExpenseProjects, ...localExpenseWs])
        ).filter((w) => !w.startsWith('version:::') && !w.includes(':::version:::'))
        if (mergedExpenseProjects.length === 0) {
          mergedExpenseProjects.push('Expense_data')
        }
        setAvailableExpenseProjects(mergedExpenseProjects)

        // 2. Process Ticket Workspaces
        const expenseWsSet = new Set(mergedExpenseProjects.map((w) => w.toLowerCase()))
        let localTicketWs: string[] = []
        const ticketStorageKey = `tp_workspaces_${user.email.toLowerCase()}`
        try {
          const stored = localStorage.getItem(ticketStorageKey)
          if (stored) {
            localTicketWs = JSON.parse(stored)
          }
          localStorage.removeItem('tp_workspaces')
        } catch {
          // ignore
        }

        const serverTicketProjects = (data.projects || []).filter(
          (p: string) =>
            !p.startsWith('version:::') &&
            !p.includes(':::version:::') &&
            !expenseWsSet.has(p.toLowerCase())
        )
        const validLocalTicketWs = localTicketWs.filter(
          (w) =>
            !w.startsWith('version:::') &&
            !w.includes(':::version:::') &&
            !expenseWsSet.has(w.toLowerCase()) &&
            (w !== 'Ticket Portal' || serverTicketProjects.includes('Ticket Portal'))
        )
        const mergedTicketProjects = Array.from(new Set([...serverTicketProjects, ...validLocalTicketWs]))
        setAvailableProjects(mergedTicketProjects)
        if (
          selectedProject.startsWith('version:::') ||
          selectedProject.includes(':::version:::') ||
          expenseWsSet.has(selectedProject.toLowerCase())
        ) {
          setSelectedProject('ALL')
        }

        try {
          localStorage.setItem(ticketStorageKey, JSON.stringify(mergedTicketProjects))
        } catch {
          // ignore
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error loading inbox data'
        setError(msg)
      } finally {
        setLoading(false)
      }
    },
    [
      isAuthLoading,
      user?.email,
      selectedProject,
      searchTerm,
      selectedStatuses,
      selectedPriorities,
      selectedCategories,
      showOnlyBookmarked,
    ]
  )

  // 2. Daily Notes Loader
  const loadNotesData = useCallback(async () => {
    if (!user?.email) return
    try {
      const query = /* GraphQL */ `
        query GetNotesData($userEmail: String, $date: String, $limit: Int, $offset: Int) {
          dailyNotes(userEmail: $userEmail, date: $date, limit: $limit, offset: $offset) {
            id
            date
            content
            createdBy
            createdAt
          }
        }
      `
      const data = await fetchGraphQL<{ dailyNotes: DailyNote[] }>(query, {
        userEmail: user.email,
        limit: 100,
        offset: 0,
      })
      setDailyNotes(data.dailyNotes || [])
    } catch (err) {
      console.error('Error loading notes:', err)
    }
  }, [user?.email])

  // 3. Expenses Loader
  const loadExpensesData = useCallback(async () => {
    if (!user?.email) return
    try {
      const query = /* GraphQL */ `
        query GetExpensesData(
          $userEmail: String
          $projectName: String
          $month: String
          $limit: Int
          $offset: Int
        ) {
          expenseProjects: projects(userEmail: $userEmail, type: "EXPENSE")
          expenses(
            userEmail: $userEmail
            projectName: $projectName
            month: $month
            limit: $limit
            offset: $offset
          ) {
            id
            title
            amount
            currency
            category
            date
            paymentMethod
            projectName
            notes
            createdBy
            createdAt
            updatedAt
          }
          expenseCategories(userEmail: $userEmail)
        }
      `
      const data = await fetchGraphQL<{
        expenseProjects?: string[]
        expenses: Expense[]
        expenseCategories: string[]
      }>(query, {
        userEmail: user.email,
        projectName: selectedExpenseProject !== 'ALL' ? selectedExpenseProject : null,
        month: selectedExpenseMonth !== 'ALL' ? selectedExpenseMonth : null,
        limit: 100,
        offset: 0,
      })

      setExpenses(data.expenses || [])
      setExpenseCategories(data.expenseCategories || [])
      if (data.expenseProjects) {
        const filtered = data.expenseProjects.filter(
          (p) => !p.startsWith('version:::') && !p.includes(':::version:::')
        )
        setAvailableExpenseProjects((prev) => Array.from(new Set([...prev, ...filtered])))
      }
    } catch (err) {
      console.error('Error loading expenses:', err)
    }
  }, [user?.email, selectedExpenseProject, selectedExpenseMonth])

  // 4. Board Loader
  const loadBoardData = useCallback(async () => {
    if (!user?.email) return
    try {
      const query = /* GraphQL */ `
        query GetBoardData(
          $projectName: String
          $search: String
          $userEmail: String
          $limit: Int
          $offset: Int
        ) {
          tickets(
            projectName: $projectName
            search: $search
            userEmail: $userEmail
            limit: $limit
            offset: $offset
          ) {
            id
            ticketId
            title
            description
            commands
            status
            priority
            category
            version
            projectName
            createdBy
            updatedBy
            createdAt
            updatedAt
            isBookmarked
          }
        }
      `
      const data = await fetchGraphQL<{ tickets: Ticket[] }>(query, {
        projectName: selectedProject !== 'ALL' ? selectedProject : null,
        search: searchTerm.trim() || null,
        userEmail: user.email,
        limit: 200,
        offset: 0,
      })
      setBoardTickets(data.tickets || [])
    } catch (err) {
      console.error('Error loading board data:', err)
    }
  }, [user?.email, selectedProject, searchTerm])

  // 5. Dashboard Loader
  const loadDashboardData = useCallback(async () => {
    if (!user?.email) return
    try {
      const query = /* GraphQL */ `
        query GetDashboardData($projectName: String, $userEmail: String) {
          tickets(projectName: $projectName, userEmail: $userEmail, limit: 300, offset: 0) {
            id
            ticketId
            title
            description
            commands
            status
            priority
            category
            version
            projectName
            createdBy
            updatedBy
            createdAt
            updatedAt
            isBookmarked
          }
          dailyNotes(userEmail: $userEmail, limit: 100, offset: 0) {
            id
            date
            content
            createdBy
            createdAt
          }
        }
      `
      const data = await fetchGraphQL<{ tickets: Ticket[]; dailyNotes: DailyNote[] }>(query, {
        projectName: selectedProject !== 'ALL' ? selectedProject : null,
        userEmail: user.email,
      })
      if (data.tickets) setBoardTickets(data.tickets)
      if (data.dailyNotes) setDailyNotes(data.dailyNotes)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    }
  }, [user?.email, selectedProject])

  // General loadData wrapper (for error retry and refresh)
  const loadData = useCallback(() => {
    loadInboxData(inboxPage, inboxPageSize)
    if (loadedTabs.has('notes')) loadNotesData()
    if (loadedTabs.has('expenses')) loadExpensesData()
    if (loadedTabs.has('board')) loadBoardData()
    if (loadedTabs.has('dashboard')) loadDashboardData()
  }, [inboxPage, inboxPageSize, loadInboxData, loadedTabs, loadNotesData, loadExpensesData, loadBoardData, loadDashboardData])

  // Tab change handler with lazy-loading
  const handleTabChange = useCallback(
    async (targetTab: 'inbox' | 'dashboard' | 'board' | 'notes' | 'expenses') => {
      if (targetTab === activeTab) return
      setActiveTab(targetTab)

      if (!loadedTabs.has(targetTab)) {
        setIsTabSwitching(true)
        setTabSwitchTarget(targetTab)
        try {
          if (targetTab === 'notes') await loadNotesData()
          else if (targetTab === 'expenses') await loadExpensesData()
          else if (targetTab === 'board') await loadBoardData()
          else if (targetTab === 'dashboard') await loadDashboardData()
          setLoadedTabs((prev) => new Set(prev).add(targetTab))
        } finally {
          setIsTabSwitching(false)
        }
      }
    },
    [activeTab, loadedTabs, loadNotesData, loadExpensesData, loadBoardData, loadDashboardData]
  )

  useEffect(() => {
    if (!isAuthLoading && user?.email) {
      loadInboxData(1, inboxPageSize)
    }
  }, [loadInboxData, isAuthLoading, user?.email])

  // Re-fetch expenses when expense filters change while on expenses tab
  useEffect(() => {
    if (activeTab === 'expenses' && loadedTabs.has('expenses')) {
      loadExpensesData()
    }
  }, [activeTab, loadedTabs, selectedExpenseProject, selectedExpenseMonth, loadExpensesData])

  // Re-fetch board / dashboard when workspace changes
  useEffect(() => {
    if (activeTab === 'board' && loadedTabs.has('board')) {
      loadBoardData()
    } else if (activeTab === 'dashboard' && loadedTabs.has('dashboard')) {
      loadDashboardData()
    }
  }, [activeTab, loadedTabs, selectedProject, searchTerm, loadBoardData, loadDashboardData])

  // Open ticket modal if ticket or ticketId query param is present in URL
  useEffect(() => {
    if (typeof window === 'undefined' || loading) return
    const params = new URLSearchParams(window.location.search)
    const rawTargetId = params.get('ticket') || params.get('ticketId')
    if (!rawTargetId || openedTicketFromUrlRef.current === rawTargetId) return
    const targetId = rawTargetId.replace(/^#/, '').trim()

    const match = tickets.find(
      (t) =>
        String(t.ticketId || '').toLowerCase() === targetId.toLowerCase() ||
        t.id.toLowerCase() === targetId.toLowerCase() ||
        t.id.slice(0, 4).toLowerCase() === targetId.toLowerCase()
    )

    if (match) {
      openedTicketFromUrlRef.current = rawTargetId
      setEditingTicket(match)
      setModalMode('view')
      setIsModalOpen(true)
    } else {
      fetchGraphQL<{ ticket: Ticket | null }>(
        /* GraphQL */ `
          query GetSingleTicket($ticketId: String, $id: ID) {
            ticket(ticketId: $ticketId, id: $id) {
              id
              ticketId
              title
              description
              commands
              status
              priority
              category
              projectName
              createdBy
              updatedBy
              createdAt
              updatedAt
            }
          }
        `,
        { ticketId: targetId, id: targetId }
      )
        .then((res) => {
          if (res?.ticket) {
            openedTicketFromUrlRef.current = rawTargetId
            setEditingTicket(res.ticket)
            setModalMode('view')
            setIsModalOpen(true)
          }
        })
        .catch(() => {
          // ignore when ticket is not found
        })
    }
  }, [tickets, loading])

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

  // 2. Filtered Tickets based on Facets + Date Range (From - To) + Bookmarks
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (showOnlyBookmarked && !t.isBookmarked) {
        return false
      }
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(t.status)) {
        return false
      }
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(t.priority)) {
        return false
      }
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.some(
          (c) => c.toUpperCase() === (t.category || 'DEV').toUpperCase()
        )
      ) {
        return false
      }
      // Version Filter
      if (selectedVersions.length > 0) {
        if (!t.version || !selectedVersions.includes(t.version)) {
          return false
        }
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
      // Ticket ID Filter
      if (ticketIdFilter.trim()) {
        const cleanFilter = ticketIdFilter.trim().replace(/^#/, '').toLowerCase()
        const tId = (t.ticketId || '').toLowerCase()
        const idPrefix = (t.id || '').toLowerCase()
        const matches =
          tId === cleanFilter ||
          tId.includes(cleanFilter) ||
          idPrefix.startsWith(cleanFilter) ||
          idPrefix.includes(cleanFilter)
        if (!matches) return false
      }
      return true
    })
  }, [tickets, showOnlyBookmarked, selectedStatuses, selectedPriorities, selectedCategories, selectedVersions, fromDate, toDate, ticketIdFilter])

  // Count total bookmarked tickets
  const bookmarkedCount = useMemo(() => {
    return ticketStats.bookmarked || tickets.filter((t) => t.isBookmarked).length
  }, [ticketStats.bookmarked, tickets])

  // 3. Facet Counts
  const ticketCounts = useMemo(() => {
    const total = ticketStats.total || tickets.length
    const todo = ticketStats.todo
    const inProgress = ticketStats.inProgress
    const done = ticketStats.done
    const blocked = ticketStats.blocked
    const notesCount = dailyNotes.length

    // Category counts
    const categoryCounts: Record<string, number> = {
      ALL: total,
    }
    tickets.forEach((t) => {
      const cat = (t.category || 'DEV').toUpperCase()
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })

    // Version counts
    const versionCounts: Record<string, number> = {
      ALL: total,
    }
    tickets.forEach((t) => {
      if (t.version) {
        versionCounts[t.version] = (versionCounts[t.version] || 0) + 1
      }
    })

    return { total, todo, inProgress, done, blocked, notesCount, categoryCounts, versionCounts }
  }, [ticketStats, tickets, dailyNotes])

  // Expense available months
  const availableExpenseMonths = useMemo(() => {
    const set = new Set<string>()
    const now = new Date()
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    set.add(currentMonthKey)
    expenses.forEach((e) => {
      if (e.date && e.date.length >= 7) {
        set.add(e.date.slice(0, 7))
      }
    })
    return Array.from(set).sort().reverse()
  }, [expenses])

  // Expense Counts for Sidebar
  const expenseCounts = useMemo(() => {
    let scoped = expenses
    if (selectedExpenseProject !== 'ALL') {
      scoped = scoped.filter(
        (e) => (e.projectName || 'General').toLowerCase() === selectedExpenseProject.toLowerCase()
      )
    }
    if (selectedExpenseMonth !== 'ALL') {
      scoped = scoped.filter((e) => e.date && e.date.startsWith(selectedExpenseMonth))
    }

    const byCategory: Record<string, number> = {}
    const byMethod: Record<string, number> = {}
    let totalAmount = 0

    scoped.forEach((e) => {
      totalAmount += Number(e.amount) || 0
      const cat = e.category || 'Miscellaneous'
      byCategory[cat] = (byCategory[cat] || 0) + 1
      const pm = (e.paymentMethod || 'OTHER').toUpperCase()
      byMethod[pm] = (byMethod[pm] || 0) + 1
    })

    return {
      total: scoped.length,
      totalAmount,
      byCategory,
      byMethod,
    }
  }, [expenses, selectedExpenseProject, selectedExpenseMonth])

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
      setBoardTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      )
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update status')
      loadInboxData(inboxPage, inboxPageSize)
    }
  }

  const handleSaveTicket = async (ticketData: {
    id?: string
    title: string
    description: string
    commands?: string
    status: TicketStatus
    priority: TicketPriority
    category: string
    version?: string
    projectName: string
    author: string
  }) => {
    const currentUserName = user?.email || user?.name || ticketData.author || 'User'

    if (ticketData.id) {
      const mutation = /* GraphQL */ `
        mutation UpdateTicket($id: ID!, $input: UpdateTicketInput!) {
          updateTicket(id: $id, input: $input) {
            id
            ticketId
            title
            description
            commands
            status
            priority
            category
            version
            projectName
            updatedBy
            updatedAt
            isBookmarked
          }
        }
      `
      await fetchGraphQL(mutation, {
        id: ticketData.id,
        input: {
          title: ticketData.title,
          description: ticketData.description,
          commands: ticketData.commands,
          status: ticketData.status,
          priority: ticketData.priority,
          category: ticketData.category,
          version: ticketData.version,
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
            ticketId
            title
            description
            commands
            status
            priority
            category
            version
            projectName
            createdBy
            createdAt
            isBookmarked
          }
        }
      `
      await fetchGraphQL(mutation, {
        input: {
          title: ticketData.title,
          description: ticketData.description,
          commands: ticketData.commands,
          status: ticketData.status,
          priority: ticketData.priority,
          category: ticketData.category,
          version: ticketData.version,
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
    loadInboxData(inboxPage, inboxPageSize)
    if (loadedTabs.has('board')) loadBoardData()
    if (loadedTabs.has('dashboard')) loadDashboardData()
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
      setBoardTickets((prev) => prev.filter((t) => t.id !== ticketToDelete.id))
      setInboxTotalCount((c) => Math.max(0, c - 1))
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

  const handleToggleBookmark = async (ticket: Ticket) => {
    const nextState = !ticket.isBookmarked
    // Optimistic UI updates across ticket state and active modal
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, isBookmarked: nextState } : t))
    )
    setBoardTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, isBookmarked: nextState } : t))
    )
    setTicketStats((prev) => ({
      ...prev,
      bookmarked: Math.max(0, prev.bookmarked + (nextState ? 1 : -1)),
    }))
    if (editingTicket && editingTicket.id === ticket.id) {
      setEditingTicket((prev) => (prev ? { ...prev, isBookmarked: nextState } : null))
    }

    try {
      const mutation = /* GraphQL */ `
        mutation ToggleBookmark($id: ID!) {
          toggleBookmark(id: $id) {
            id
            isBookmarked
          }
        }
      `
      await fetchGraphQL(mutation, { id: ticket.id })
    } catch (err: unknown) {
      console.error('Failed to toggle bookmark:', err)
      // Rollback on error
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, isBookmarked: !nextState } : t))
      )
      if (editingTicket && editingTicket.id === ticket.id) {
        setEditingTicket((prev) => (prev ? { ...prev, isBookmarked: !nextState } : null))
      }
      setToast({
        isOpen: true,
        title: 'Error',
        message: 'Could not update bookmark. Please try again.',
      })
    }
  }

  const handleCreateWorkspace = async (name: string, type?: 'TICKET' | 'EXPENSE') => {
    const trimmed = name.trim()
    if (!trimmed) return
    const wsType = type || (activeTab === 'expenses' ? 'EXPENSE' : 'TICKET')

    try {
      const mutation = /* GraphQL */ `
        mutation CreateWorkspace($name: String!, $type: String, $userEmail: String) {
          createWorkspace(name: $name, type: $type, userEmail: $userEmail)
        }
      `
      await fetchGraphQL(mutation, { name: trimmed, type: wsType, userEmail: user?.email })
    } catch (err: unknown) {
      console.warn('Workspace GraphQL notice:', err)
    }

    if (wsType === 'EXPENSE') {
      setAvailableExpenseProjects((prev) => {
        const updated = Array.from(new Set([...prev, trimmed]))
        if (user?.email) {
          try {
            const storageKey = `tp_expense_workspaces_${user.email.toLowerCase()}`
            localStorage.setItem(storageKey, JSON.stringify(updated))
          } catch {
            // ignore
          }
        }
        return updated
      })
      setSelectedExpenseProject(trimmed)
    } else {
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
    }

    setIsWorkspaceModalOpen(false)
    setToast({
      isOpen: true,
      title: 'Workspace Created Successfully',
      message: `${wsType === 'EXPENSE' ? 'Expense workspace' : 'Workspace'} "${trimmed}" created successfully`,
    })
  }

  const handleConfirmDeleteWorkspace = async (workspaceName: string) => {
    const isExpense =
      activeTab === 'expenses' ||
      (availableExpenseProjects.includes(workspaceName) && !availableProjects.includes(workspaceName))

    try {
      const mutation = /* GraphQL */ `
        mutation DeleteWorkspace($name: String!, $userEmail: String) {
          deleteWorkspace(name: $name, userEmail: $userEmail)
        }
      `
      await fetchGraphQL(mutation, { name: workspaceName, userEmail: user?.email })

      if (isExpense) {
        setAvailableExpenseProjects((prev) => {
          const updated = prev.filter((p) => p !== workspaceName)
          if (user?.email) {
            try {
              const storageKey = `tp_expense_workspaces_${user.email.toLowerCase()}`
              localStorage.setItem(storageKey, JSON.stringify(updated))
            } catch {
              // ignore
            }
          }
          return updated
        })

        if (selectedExpenseProject === workspaceName) {
          setSelectedExpenseProject('ALL')
        }

        // Remove local expenses that belonged to that workspace
        setExpenses((prev) => prev.filter((e) => e.projectName !== workspaceName))
      } else {
        setAvailableProjects((prev) => {
          const updated = prev.filter((p) => p !== workspaceName)
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

        if (selectedProject === workspaceName) {
          setSelectedProject('ALL')
        }

        // Remove local tickets that belonged to that workspace
        setTickets((prev) => prev.filter((t) => t.projectName !== workspaceName))
      }

      setWorkspaceToDelete(null)
      setToast({
        isOpen: true,
        title: 'Workspace Deleted',
        message: `Workspace "${workspaceName}" has been deleted successfully`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete workspace'
      setToast({
        isOpen: true,
        title: 'Error',
        message: msg,
      })
      throw err
    }
  }

  const handleCreateVersion = async (ver: string) => {
    const trimmed = ver.trim()
    if (!trimmed) return
    try {
      const mutation = /* GraphQL */ `
        mutation CreateVersion($version: String!, $userEmail: String) {
          createVersion(version: $version, userEmail: $userEmail)
        }
      `
      await fetchGraphQL(mutation, { version: trimmed, userEmail: user?.email })
    } catch (err: unknown) {
      console.warn('Version GraphQL notice:', err)
    }

    setAvailableVersions((prev) => Array.from(new Set([...prev, trimmed])))
    setToast({
      isOpen: true,
      title: 'Version Created',
      message: `Version "${trimmed}" has been created`,
    })
  }

  const handleDeleteVersion = async (ver: string) => {
    try {
      const mutation = /* GraphQL */ `
        mutation DeleteVersion($version: String!, $userEmail: String) {
          deleteVersion(version: $version, userEmail: $userEmail)
        }
      `
      await fetchGraphQL(mutation, { version: ver, userEmail: user?.email })
      setAvailableVersions((prev) => prev.filter((v) => v !== ver))
      setToast({
        isOpen: true,
        title: 'Version Removed',
        message: `Version "${ver}" was removed`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete version'
      setToast({
        isOpen: true,
        title: 'Error',
        message: msg,
      })
      throw err
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
        createdBy: user?.email || user?.name || 'User',
      },
    })
    loadNotesData()
  }

  const handleUpdateDailyNote = async (id: string, content: string) => {
    setDailyNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, content } : n))
    )
    const mutation = /* GraphQL */ `
      mutation UpdateNote($id: ID!, $content: String!, $userEmail: String) {
        updateDailyNote(id: $id, content: $content, userEmail: $userEmail) {
          id
          date
          content
          createdBy
          createdAt
        }
      }
    `
    await fetchGraphQL(mutation, { id, content, userEmail: user?.email })
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

  // Expense Handlers
  const handleOpenAddExpense = () => {
    setExpenseToEdit(null)
    setIsExpenseModalOpen(true)
  }

  const handleOpenEditExpense = (exp: Expense) => {
    setExpenseToEdit(exp)
    setIsExpenseModalOpen(true)
  }

  const handleSaveExpense = async (
    expenseData: {
      title: string
      amount: number
      currency: string
      category: string
      date: string
      paymentMethod: string
      projectName: string
      notes?: string
    },
    id?: string
  ) => {
    if (id) {
      const mutation = /* GraphQL */ `
        mutation UpdateExpense($id: ID!, $input: UpdateExpenseInput!, $userEmail: String) {
          updateExpense(id: $id, input: $input, userEmail: $userEmail) {
            id
            title
            amount
            currency
            category
            date
            paymentMethod
            projectName
            notes
            updatedAt
          }
        }
      `
      await fetchGraphQL(mutation, {
        id,
        input: expenseData,
        userEmail: user?.email,
      })
      setToast({
        isOpen: true,
        title: 'Expense Updated',
        message: `Changes saved for "${expenseData.title}"`,
      })
    } else {
      const mutation = /* GraphQL */ `
        mutation CreateExpense($input: CreateExpenseInput!) {
          createExpense(input: $input) {
            id
            title
            amount
            currency
            category
            date
            paymentMethod
            projectName
            notes
            createdAt
          }
        }
      `
      await fetchGraphQL(mutation, {
        input: {
          ...expenseData,
          createdBy: user?.email || user?.name || 'User',
        },
      })
      setToast({
        isOpen: true,
        title: 'Expense Recorded',
        message: `Added ₹${expenseData.amount.toLocaleString()} for "${expenseData.title}"`,
      })
    }
    loadExpensesData()
  }

  const handleConfirmDeleteExpense = async () => {
    if (!expenseToDelete) return
    const deletedTitle = expenseToDelete.title
    setIsDeleting(true)
    try {
      const mutation = /* GraphQL */ `
        mutation DeleteExpense($id: ID!, $userEmail: String) {
          deleteExpense(id: $id, userEmail: $userEmail)
        }
      `
      await fetchGraphQL(mutation, { id: expenseToDelete.id, userEmail: user?.email })
      setExpenses((prev) => prev.filter((e) => e.id !== expenseToDelete.id))
      setExpenseToDelete(null)
      setToast({
        isOpen: true,
        title: 'Expense Deleted',
        message: `"${deletedTitle}" was deleted successfully`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete expense'
      setToast({
        isOpen: true,
        title: 'Error',
        message: msg,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCreateExpenseCategory = async (catName: string) => {
    const mutation = /* GraphQL */ `
      mutation CreateCategory($name: String!, $userEmail: String) {
        createExpenseCategory(name: $name, userEmail: $userEmail)
      }
    `
    await fetchGraphQL(mutation, { name: catName, userEmail: user?.email })
    setExpenseCategories((prev) =>
      prev.includes(catName) ? prev : [...prev, catName]
    )
    setToast({
      isOpen: true,
      title: 'Category Created',
      message: `Category "${catName}" added successfully`,
    })
  }

  const handleDeleteExpenseCategory = async (catName: string) => {
    const mutation = /* GraphQL */ `
      mutation DeleteCategory($name: String!, $userEmail: String) {
        deleteExpenseCategory(name: $name, userEmail: $userEmail)
      }
    `
    await fetchGraphQL(mutation, { name: catName, userEmail: user?.email })
    setExpenseCategories((prev) => prev.filter((c) => c !== catName))
    setToast({
      isOpen: true,
      title: 'Category Removed',
      message: `Category "${catName}" deleted`,
    })
  }

  const isDark = theme === 'dark'

  if (isAuthLoading) {
    return (
      <div
        className={`h-screen w-screen flex flex-col items-center justify-center font-sans ${
          theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-50 text-zinc-900'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/[0.1] text-white flex items-center justify-center animate-pulse mb-3">
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
        availableProjects={activeTab === 'expenses' ? availableExpenseProjects : availableProjects}
        selectedProject={activeTab === 'expenses' ? selectedExpenseProject : selectedProject}
        onSelectProject={activeTab === 'expenses' ? handleSelectExpenseWorkspace : handleSelectWorkspace}
        selectedStatuses={selectedStatuses}
        onSelectStatus={handleSelectStatus}
        selectedPriorities={selectedPriorities}
        onSelectPriority={handleSelectPriority}
        selectedCategories={selectedCategories}
        onSelectCategory={handleSelectCategory}
        categoryCounts={ticketCounts.categoryCounts}
        fromDate={fromDate}
        toDate={toDate}
        onSelectFromDate={handleSelectFromDate}
        onSelectToDate={handleSelectToDate}
        onClearDateRange={handleClearDateRange}
        ticketIdFilter={ticketIdFilter}
        onSelectTicketIdFilter={handleSelectTicketIdFilter}
        onClearTicketIdFilter={handleClearTicketIdFilter}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        ticketCounts={ticketCounts}
        onOpenCreateModal={handleOpenCreateTicket}
        onOpenCreateWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        onDeleteWorkspace={(proj) => setWorkspaceToDelete(proj)}
        activeTab={activeTab}
        expenseCategories={expenseCategories}
        selectedExpenseCategory={selectedExpenseCategory}
        onSelectExpenseCategory={setSelectedExpenseCategory}
        selectedPaymentMethod={selectedPaymentMethod}
        onSelectPaymentMethod={setSelectedPaymentMethod}
        expenseMinAmount={expenseMinAmount}
        expenseMaxAmount={expenseMaxAmount}
        onMinAmountChange={setExpenseMinAmount}
        onMaxAmountChange={setExpenseMaxAmount}
        expenseSearchQuery={expenseSearchQuery}
        onExpenseSearchChange={setExpenseSearchQuery}
        selectedExpenseMonth={selectedExpenseMonth}
        onSelectExpenseMonth={setSelectedExpenseMonth}
        availableExpenseMonths={availableExpenseMonths}
        expenseCounts={expenseCounts}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        onOpenAddExpenseModal={handleOpenAddExpense}
        onOpenActivityModal={() => setIsActivityModalOpen(true)}
        onOpenVersionModal={() => setIsVersionModalOpen(true)}
        availableVersions={availableVersions}
        selectedVersions={selectedVersions}
        onSelectVersion={handleSelectVersion}
        versionCounts={ticketCounts.versionCounts}
      />

      {/* 2. Main Content Canvas */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden ${
          isDark ? 'bg-[#09090b]' : 'bg-zinc-50'
        }`}
      >
        {/* Top Header Bar: Apple Style Frosted Navbar */}
        <header
          className={`h-14 px-3 sm:px-6 border-b flex items-center justify-between gap-2 sm:gap-3 shrink-0 sticky top-0 z-30 transition-colors ${
            isDark
              ? 'border-white/[0.08] bg-[#000000]/80 backdrop-blur-md'
              : 'border-[#e5e5ea] bg-white/80 backdrop-blur-md'
          }`}
        >
          {isMobileSearchOpen ? (
            /* Full-width Mobile Search Bar */
            <div className="flex items-center gap-2 w-full animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className={`w-8.5 h-8.5 rounded-full border flex items-center justify-center transition cursor-pointer shrink-0 active:scale-95 ${
                  isDark
                    ? 'border-white/[0.08] bg-white/[0.06] text-[#86868b] hover:text-white'
                    : 'border-black/[0.06] bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]'
                }`}
                title="Back"
                aria-label="Close search"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>

              <div className="relative flex-1 min-w-0">
                <svg
                  className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b] dark:text-[#a1a1a6] pointer-events-none"
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
                  autoFocus
                  placeholder={activeTab === 'expenses' ? 'Search expenses...' : 'Search tickets...'}
                  value={activeTab === 'expenses' ? expenseSearchQuery : searchTerm}
                  onChange={(e) => {
                    if (activeTab === 'expenses') {
                      setExpenseSearchQuery(e.target.value)
                    } else {
                      setSearchTerm(e.target.value)
                    }
                  }}
                  className={`w-full rounded-full border pl-9 pr-8 py-1.5 text-xs focus:outline-none transition-all duration-150 ${
                    isDark
                      ? 'bg-white/[0.06] border-white/[0.08] text-[#f5f5f7] placeholder-[#86868b] focus:bg-white/[0.1] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/20'
                      : 'bg-[#f5f5f7] border-black/[0.06] text-[#1d1d1f] placeholder-[#86868b] focus:bg-white focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 shadow-2xs'
                  }`}
                />
                {(activeTab === 'expenses' ? expenseSearchQuery : searchTerm) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'expenses') {
                        setExpenseSearchQuery('')
                      } else {
                        setSearchTerm('')
                      }
                    }}
                    className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition cursor-pointer"
                    title="Clear search"
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className={`px-3 py-1.5 text-xs font-normal rounded-full border transition cursor-pointer shrink-0 active:scale-95 ${
                  isDark
                    ? 'border-white/[0.08] bg-white/[0.04] text-[#f5f5f7] hover:bg-white/[0.08]'
                    : 'border-[#e5e5ea] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7] shadow-2xs'
                }`}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Left: Mobile Hamburger + Current View Title + Desktop Apple Pill Search */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0 max-w-xs sm:max-w-sm">
                {/* Mobile Hamburger Button */}
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className={`lg:hidden w-8.5 h-8.5 rounded-full border flex items-center justify-center transition cursor-pointer shrink-0 active:scale-95 ${
                    isDark
                      ? 'border-white/[0.08] bg-white/[0.06] text-[#86868b] hover:text-white'
                      : 'border-black/[0.06] bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]'
                  }`}
                  title="Open Navigation Drawer"
                  aria-label="Open menu"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </svg>
                </button>

                {/* Mobile Current View Title (Apple Clean Typography) */}
                <span className={`sm:hidden text-sm font-semibold tracking-tight truncate ${
                  isDark ? 'text-[#f5f5f7]' : 'text-[#1d1d1f]'
                }`}>
                  {NAV_TABS.find((t) => t.id === activeTab)?.label ?? 'TicketFlow'}
                </span>

                {/* Desktop Apple Pill Search Input */}
                <div className="hidden sm:block relative w-full min-w-0">
                  <svg
                    className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b] dark:text-[#a1a1a6] pointer-events-none"
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
                    placeholder={activeTab === 'expenses' ? 'Search expenses...' : 'Search tickets...'}
                    value={activeTab === 'expenses' ? expenseSearchQuery : searchTerm}
                    onChange={(e) => {
                      if (activeTab === 'expenses') {
                        setExpenseSearchQuery(e.target.value)
                      } else {
                        setSearchTerm(e.target.value)
                      }
                    }}
                    className={`w-full rounded-full border pl-9 pr-8 py-1.5 text-xs focus:outline-none transition-all duration-150 ${
                      isDark
                        ? 'bg-white/[0.06] border-white/[0.08] text-[#f5f5f7] placeholder-[#86868b] focus:bg-white/[0.1] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/20'
                        : 'bg-[#f5f5f7] border-black/[0.06] text-[#1d1d1f] placeholder-[#86868b] focus:bg-white focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 shadow-2xs'
                    }`}
                  />
                  {(activeTab === 'expenses' ? expenseSearchQuery : searchTerm) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'expenses') {
                          setExpenseSearchQuery('')
                        } else {
                          setSearchTerm('')
                        }
                      }}
                      className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition cursor-pointer"
                      title="Clear search"
                    >
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Views Switcher (Apple Segmented Pill on Desktop) + Actions */}
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                {/* Mobile Search Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(true)}
                  className={`sm:hidden w-8.5 h-8.5 rounded-full border flex items-center justify-center transition cursor-pointer shrink-0 active:scale-95 ${
                    isDark
                      ? 'border-white/[0.08] bg-white/[0.06] text-[#86868b] hover:text-white'
                      : 'border-black/[0.06] bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]'
                  }`}
                  title="Search"
                  aria-label="Search"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>

                {/* View Switcher Apple Segmented Control (Desktop Only) */}
                <nav
                  aria-label="View Switcher"
                  className={`hidden sm:flex relative items-center p-1 rounded-full border transition-colors ${
                    isDark
                      ? 'bg-white/[0.06] border-white/[0.08]'
                      : 'bg-[#f5f5f7] border-black/[0.06]'
                  }`}
                >
                  {/* Smooth Gliding Highlight Pill */}
                  <div
                    className={`absolute top-1 bottom-1 rounded-full pointer-events-none shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isDark
                        ? 'bg-white'
                        : 'bg-white border border-black/[0.08]'
                    }`}
                    style={{
                      transform: `translateX(${pillStyle.left}px)`,
                      width: `${pillStyle.width}px`,
                      opacity: pillStyle.width > 0 ? 1 : 0,
                    }}
                  />

                  {NAV_TABS.map((tab) => {
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        ref={(el) => { tabRefs.current[tab.id] = el }}
                        type="button"
                        onClick={() => handleTabChange(tab.id)}
                        className={`relative z-10 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                          isActive
                            ? isDark
                              ? 'text-zinc-950 font-semibold'
                              : 'text-[#1d1d1f] font-semibold'
                            : isDark
                            ? 'text-zinc-400 hover:text-white'
                            : 'text-zinc-500 hover:text-zinc-900'
                        } ${isActive && pillStyle.width === 0 ? (isDark ? 'bg-white text-zinc-950' : 'bg-white text-[#1d1d1f] shadow-xs') : ''}`}
                        title={tab.label}
                      >
                        <span className="opacity-80">{tab.icon}</span>
                        <span className="hidden md:inline">{tab.label}</span>
                      </button>
                    )
                  })}
                </nav>

                {/* Primary Action Button (Theme-colored Capsule) */}
                <button
                  type="button"
                  onClick={activeTab === 'expenses' ? handleOpenAddExpense : handleOpenCreateTicket}
                  className={`h-8.5 px-3 sm:px-4 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 inline-flex items-center gap-1.5 shadow-xs shrink-0 ${
                    isDark
                      ? 'bg-white hover:bg-zinc-100 text-zinc-950 border border-white'
                      : 'bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-950'
                  }`}
                  title={activeTab === 'expenses' ? 'Add Expense' : 'New Ticket'}
                  aria-label={activeTab === 'expenses' ? 'Add Expense' : 'New Ticket'}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span className="hidden sm:inline">
                    {activeTab === 'expenses' ? 'Add Expense' : 'New Ticket'}
                  </span>
                </button>
              </div>
            </>
          )}
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
          {loading || isFilterLoading || isTabSwitching ? (
            <ThemeSpinner
              theme={theme}
              title={
                loading
                  ? selectedProject === 'ALL'
                    ? 'Loading All Workspaces...'
                    : `Loading workspace "${selectedProject}"...`
                  : isTabSwitching
                  ? tabSwitchTarget === 'dashboard'
                    ? 'Preparing Dashboard Analytics...'
                    : tabSwitchTarget === 'board'
                    ? 'Organizing Kanban Board...'
                    : tabSwitchTarget === 'notes'
                    ? 'Loading Daily Standup Notes...'
                    : tabSwitchTarget === 'expenses'
                    ? 'Loading Expense Tracker & Analytics...'
                    : 'Loading Inbox & Tickets...'
                  : 'Updating filtered tickets...'
              }
              subtitle={
                loading
                  ? 'TicketFlow • Syncing with server'
                  : isTabSwitching
                  ? 'TicketFlow • Switching View'
                  : 'TicketFlow • Applying Filter'
              }
            />
          ) : (
            <div className="flex-1 flex flex-col min-w-0 animate-in fade-in duration-150">
              {/* View 1: Inbox (Primary Table View) */}
              {activeTab === 'inbox' && (
                <InboxTable
                  tickets={tickets}
                  serverPagination={true}
                  currentPage={inboxPage}
                  pageSize={inboxPageSize}
                  totalTicketsCount={inboxTotalCount}
                  onPageChange={(page) => loadInboxData(page, inboxPageSize)}
                  onPageSizeChange={(size) => loadInboxData(1, size)}
                  onStatusChange={handleStatusChange}
                  onViewTicket={handleOpenViewTicket}
                  onEditTicket={handleOpenEditTicket}
                  onDeleteTicket={(ticket) => setTicketToDelete(ticket)}
                  selectedProject={selectedProject}
                  selectedCategories={selectedCategories}
                  onRemoveCategory={(cat) => handleSelectCategory(cat)}
                  onClearAllCategories={() => setSelectedCategories([])}
                  selectedPriorities={selectedPriorities}
                  onRemovePriority={(pr) => handleSelectPriority(pr)}
                  onClearAllPriorities={() => setSelectedPriorities([])}
                  selectedStatuses={selectedStatuses}
                  onRemoveStatus={(st) => handleSelectStatus(st)}
                  onClearAllStatuses={() => setSelectedStatuses([])}
                  selectedVersions={selectedVersions}
                  onRemoveVersion={(ver) => handleSelectVersion(ver)}
                  onClearAllVersions={() => setSelectedVersions([])}
                  ticketIdFilter={ticketIdFilter}
                  onSelectTicketIdFilter={handleSelectTicketIdFilter}
                  onClearTicketIdFilter={handleClearTicketIdFilter}
                  onToggleBookmark={handleToggleBookmark}
                  showOnlyBookmarked={showOnlyBookmarked}
                  onToggleBookmarkedFilter={() => setShowOnlyBookmarked((prev) => !prev)}
                  bookmarkedCount={bookmarkedCount}
                  onClearAllFilters={() => {
                    setSelectedStatuses([])
                    setSelectedPriorities([])
                    setSelectedCategories([])
                    setSelectedVersions([])
                    setShowOnlyBookmarked(false)
                    setTicketIdFilter('')
                  }}
                  theme={theme}
                />
              )}

              {/* View 2: Dashboard (Visual Charts & Status Metrics) */}
              {activeTab === 'dashboard' && (
                <DashboardView
                  tickets={boardTickets.length > 0 ? boardTickets : tickets}
                  dailyNotes={dailyNotes}
                  availableProjects={availableProjects}
                  theme={theme}
                />
              )}

              {/* View 3: Kanban Board */}
              {activeTab === 'board' && (
                <div className="p-4 sm:p-6">
                  <KanbanBoard
                    tickets={boardTickets.length > 0 ? boardTickets : tickets}
                    onStatusChange={handleStatusChange}
                    onViewTicket={handleOpenViewTicket}
                    onEditTicket={handleOpenEditTicket}
                    onDeleteTicket={(ticket) => setTicketToDelete(ticket)}
                    theme={theme}
                  />
                </div>
              )}

              {/* View 4: Daily Work Logs */}
              {activeTab === 'notes' && (
                <div className="p-2.5 sm:p-6">
                  <DailyNotes
                    notes={dailyNotes}
                    onAddNote={handleAddDailyNote}
                    onUpdateNote={handleUpdateDailyNote}
                    onDeleteNote={(note) => setNoteToDelete(note)}
                    theme={theme}
                    initialFilterDate={notesFilterDate}
                  />
                </div>
              )}

              {/* View 5: Expense Tracker */}
              {activeTab === 'expenses' && (
                <ExpenseTracker
                  expenses={expenses}
                  availableProjects={availableExpenseProjects}
                  selectedProject={selectedExpenseProject}
                  categories={expenseCategories}
                  onAddExpense={handleOpenAddExpense}
                  onEditExpense={handleOpenEditExpense}
                  onDeleteExpense={(exp) => setExpenseToDelete(exp)}
                  onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
                  theme={theme}
                  selectedCategory={selectedExpenseCategory}
                  onSelectCategory={setSelectedExpenseCategory}
                  selectedPaymentMethod={selectedPaymentMethod}
                  onSelectPaymentMethod={setSelectedPaymentMethod}
                  selectedMonth={selectedExpenseMonth}
                  onSelectMonth={setSelectedExpenseMonth}
                  minAmount={expenseMinAmount}
                  maxAmount={expenseMaxAmount}
                  onMinAmountChange={setExpenseMinAmount}
                  onMaxAmountChange={setExpenseMaxAmount}
                  searchQuery={expenseSearchQuery}
                  onExpenseSearchChange={setExpenseSearchQuery}
                  onSelectWorkspace={setSelectedExpenseProject}
                  onClearAllFilters={() => {
                    setSelectedExpenseCategory('ALL')
                    setSelectedPaymentMethod('ALL')
                    setSelectedExpenseMonth('ALL')
                    setSelectedExpenseProject('ALL')
                    setExpenseMinAmount('')
                    setExpenseMaxAmount('')
                    setExpenseSearchQuery('')
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Mobile Bottom Tab Bar — Apple iOS Style */}
        <nav
          aria-label="Mobile Navigation"
          className={`sm:hidden shrink-0 h-16 border-t flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)] transition-colors select-none z-20 ${
            isDark
              ? 'border-white/[0.08] bg-[#000000]/85 backdrop-blur-md'
              : 'border-[#e5e5ea] bg-white/85 backdrop-blur-md'
          }`}
        >
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 transition-all active:scale-95 cursor-pointer ${
                  isActive
                    ? isDark
                      ? 'text-white'
                      : 'text-[#1d1d1f]'
                    : isDark
                    ? 'text-[#86868b] hover:text-[#f5f5f7]'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
                title={tab.label}
                aria-label={tab.label}
              >
                <span className={`transition-transform duration-150 [&>svg]:w-4.5 [&>svg]:h-4.5 ${isActive ? 'scale-110 opacity-100' : 'opacity-60'}`}>
                  {tab.icon}
                </span>
                <span className={`text-[10px] tracking-tight leading-none ${isActive ? 'font-semibold' : 'font-normal opacity-70'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Separate Workspace Creation Modal */}
      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onCreateWorkspace={handleCreateWorkspace}
        existingWorkspaces={activeTab === 'expenses' ? availableExpenseProjects : availableProjects}
        workspaceType={activeTab === 'expenses' ? 'EXPENSE' : 'TICKET'}
        theme={theme}
      />

      {/* Ticket Modal */}
      <TicketModal
        isOpen={isModalOpen}
        onClose={handleCloseTicketModal}
        onSave={handleSaveTicket}
        existingTicket={editingTicket}
        initialMode={modalMode}
        availableProjects={availableProjects}
        availableVersions={availableVersions}
        currentProject={selectedProject}
        theme={theme}
        onToggleBookmark={handleToggleBookmark}
        onOpenCreateVersionModal={() => setIsVersionModalOpen(true)}
      />

      {/* Separate Version Creation & Management Modal */}
      <VersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        versions={availableVersions}
        onCreateVersion={handleCreateVersion}
        onDeleteVersion={handleDeleteVersion}
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

      {/* Delete Workspace Confirmation Modal */}
      {workspaceToDelete && (
        <DeleteWorkspaceModal
          isOpen={Boolean(workspaceToDelete)}
          onClose={() => setWorkspaceToDelete(null)}
          workspaceName={workspaceToDelete}
          ticketCount={
            activeTab === 'expenses' ||
            (availableExpenseProjects.includes(workspaceToDelete) && !availableProjects.includes(workspaceToDelete))
              ? expenses.filter((e) => e.projectName === workspaceToDelete).length
              : tickets.filter((t) => t.projectName === workspaceToDelete).length
          }
          itemType={
            activeTab === 'expenses' ||
            (availableExpenseProjects.includes(workspaceToDelete) && !availableProjects.includes(workspaceToDelete))
              ? 'expense'
              : 'ticket'
          }
          onConfirmDelete={handleConfirmDeleteWorkspace}
          theme={theme}
        />
      )}

      {/* Expense Modal (Create & Edit) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false)
          setExpenseToEdit(null)
        }}
        onSave={handleSaveExpense}
        expense={expenseToEdit}
        categories={expenseCategories}
        availableProjects={availableExpenseProjects}
        currentWorkspace={selectedExpenseProject}
        onCreateCategory={handleCreateExpenseCategory}
        theme={theme}
      />

      {/* Expense Category Manager Modal */}
      <ExpenseCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCreateCategory={handleCreateExpenseCategory}
        onDeleteCategory={handleDeleteExpenseCategory}
        existingCategories={expenseCategories}
        theme={theme}
      />

      {/* Confirm Delete Expense Modal */}
      <ConfirmModal
        isOpen={Boolean(expenseToDelete)}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleConfirmDeleteExpense}
        title="Delete Expense Record"
        message={
          expenseToDelete
            ? `Are you sure you want to delete "${expenseToDelete.title}" (₹${Number(expenseToDelete.amount).toLocaleString()})? This action cannot be undone.`
            : 'Are you sure you want to delete this expense?'
        }
        confirmText="Delete Expense"
        cancelText="Cancel"
        theme={theme}
        loading={isDeleting}
      />

      {/* Activity Heatmap Modal */}
      <ActivityHeatmapModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        notes={dailyNotes}
        theme={theme}
        onSelectDate={(date) => {
          setNotesFilterDate(date)
          handleTabChange('notes')
        }}
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
