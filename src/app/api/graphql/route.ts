import { createSchema, createYoga } from 'graphql-yoga'
import { supabase } from '@/lib/supabase'

// 1. GraphQL Type Definitions (Schema)
const typeDefs = /* GraphQL */ `
  enum TicketStatus {
    TODO
    IN_PROGRESS
    DONE
    BLOCKED
  }

  enum TicketPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  type Ticket {
    id: ID!
    ticketId: String
    title: String!
    description: String
    commands: String
    status: TicketStatus!
    priority: TicketPriority!
    category: String!
    version: String
    projectName: String!
    createdBy: String!
    updatedBy: String!
    createdAt: String!
    updatedAt: String!
    isBookmarked: Boolean
  }

  type DailyNote {
    id: ID!
    date: String!
    content: String!
    createdBy: String!
    createdAt: String!
  }

  type Expense {
    id: ID!
    title: String!
    amount: Float!
    currency: String!
    category: String!
    date: String!
    paymentMethod: String!
    projectName: String!
    notes: String
    createdBy: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateTicketInput {
    title: String!
    ticketId: String
    description: String
    commands: String
    status: TicketStatus
    priority: TicketPriority
    category: String
    version: String
    projectName: String
    createdBy: String
    isBookmarked: Boolean
  }

  input UpdateTicketInput {
    title: String
    ticketId: String
    description: String
    commands: String
    status: TicketStatus
    priority: TicketPriority
    category: String
    version: String
    projectName: String
    updatedBy: String
    isBookmarked: Boolean
  }

  input CreateDailyNoteInput {
    date: String
    content: String!
    createdBy: String
  }

  input CreateExpenseInput {
    title: String!
    amount: Float!
    currency: String
    category: String!
    date: String
    paymentMethod: String
    projectName: String
    notes: String
    createdBy: String
  }

  input UpdateExpenseInput {
    title: String
    amount: Float
    currency: String
    category: String
    date: String
    paymentMethod: String
    projectName: String
    notes: String
  }

  # QUERIES
  type Query {
    tickets(
      status: TicketStatus
      priority: TicketPriority
      category: String
      projectName: String
      search: String
      userEmail: String
    ): [Ticket!]!
    ticket(id: ID, ticketId: String): Ticket
    projects(userEmail: String): [String!]!
    versions(userEmail: String): [String!]!
    dailyNotes(date: String, userEmail: String): [DailyNote!]!
    expenses(
      userEmail: String
      projectName: String
      category: String
      paymentMethod: String
      month: String
      search: String
    ): [Expense!]!
    expenseCategories(userEmail: String): [String!]!
  }

  # MUTATIONS
  type Mutation {
    createTicket(input: CreateTicketInput!): Ticket!
    updateTicket(id: ID!, input: UpdateTicketInput!): Ticket!
    toggleBookmark(id: ID!): Ticket!
    deleteTicket(id: ID!, userEmail: String): Boolean!
    createVersion(version: String!, userEmail: String): String!
    deleteVersion(version: String!, userEmail: String): Boolean!
    createDailyNote(input: CreateDailyNoteInput!): DailyNote!
    updateDailyNote(id: ID!, content: String!, userEmail: String): DailyNote!
    deleteDailyNote(id: ID!, userEmail: String): Boolean!
    createWorkspace(name: String!, userEmail: String): String!
    deleteWorkspace(name: String!, userEmail: String): Boolean!
    createExpense(input: CreateExpenseInput!): Expense!
    updateExpense(id: ID!, input: UpdateExpenseInput!, userEmail: String): Expense!
    deleteExpense(id: ID!, userEmail: String): Boolean!
    createExpenseCategory(name: String!, userEmail: String): String!
    deleteExpenseCategory(name: String!, userEmail: String): Boolean!
  }
`

// Helper: Database snake_case columns -> GraphQL camelCase fields
interface TicketRow {
  id: string
  ticket_id?: string | number | null
  title: string
  description: string | null
  commands?: string | null
  status: string
  priority: string
  category: string
  version?: string | null
  project_name: string
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
  is_bookmarked?: boolean | null
}

const COMMANDS_START = '<!-- TICKET_COMMANDS_START -->'
const COMMANDS_END = '<!-- TICKET_COMMANDS_END -->'

const TICKET_REF_START = '<!-- TICKET_REF_ID:'
const TICKET_REF_END = ' -->'

const BOOKMARK_TAG = '<!-- TICKET_BOOKMARKED -->'

function extractBookmark(rawDesc: string | null): { cleanDescription: string; isBookmarked: boolean } {
  if (!rawDesc) return { cleanDescription: '', isBookmarked: false }
  if (rawDesc.includes(BOOKMARK_TAG)) {
    const cleanDescription = rawDesc.replace(/<!-- TICKET_BOOKMARKED -->/g, '').trim()
    return { cleanDescription, isBookmarked: true }
  }
  return { cleanDescription: rawDesc, isBookmarked: false }
}

function packBookmark(desc: string | null, isBookmarked?: boolean | null): string | null {
  if (!desc && !isBookmarked) return null
  const clean = desc ? desc.replace(/<!-- TICKET_BOOKMARKED -->/g, '').trim() : ''
  if (!isBookmarked) return clean || null
  return clean ? `${clean}\n\n${BOOKMARK_TAG}` : BOOKMARK_TAG
}

function extractTicketRefId(rawDesc: string | null): string | null {
  if (!rawDesc) return null
  const sIdx = rawDesc.indexOf(TICKET_REF_START)
  if (sIdx !== -1) {
    const eIdx = rawDesc.indexOf(TICKET_REF_END, sIdx)
    if (eIdx !== -1) {
      return rawDesc.substring(sIdx + TICKET_REF_START.length, eIdx).trim()
    }
  }
  return null
}

function packTicketRefId(desc: string | null, ticketId: string | null): string | null {
  if (!ticketId) return desc
  const clean = desc ? desc.replace(/<!-- TICKET_REF_ID:.*? -->/g, '').trim() : ''
  const tag = `${TICKET_REF_START}${ticketId}${TICKET_REF_END}`
  return clean ? `${clean}\n\n${tag}` : tag
}

function extractCommands(rawDesc: string | null): { cleanDescription: string; commands: string } {
  if (!rawDesc) return { cleanDescription: '', commands: '' }
  const startIdx = rawDesc.indexOf(COMMANDS_START)
  const endIdx = rawDesc.indexOf(COMMANDS_END)
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const commands = rawDesc.substring(startIdx + COMMANDS_START.length, endIdx).trim()
    const cleanDescription = (rawDesc.substring(0, startIdx) + rawDesc.substring(endIdx + COMMANDS_END.length)).trim()
    return { cleanDescription, commands }
  }
  return { cleanDescription: rawDesc, commands: '' }
}

function packDescription(desc: string | null, commands?: string | null): string | null {
  const clean = desc ? desc.trim() : ''
  const cmds = commands ? commands.trim() : ''
  if (!cmds) return clean || null
  if (!clean) return `${COMMANDS_START}\n${cmds}\n${COMMANDS_END}`
  return `${clean}\n\n${COMMANDS_START}\n${cmds}\n${COMMANDS_END}`
}

const VERSION_TAG_START = '<!-- TICKET_VERSION:'
const VERSION_TAG_END = ' -->'

function extractVersion(rawDesc: string | null): { cleanDescription: string; version?: string } {
  if (!rawDesc) return { cleanDescription: '' }
  const sIdx = rawDesc.indexOf(VERSION_TAG_START)
  if (sIdx !== -1) {
    const eIdx = rawDesc.indexOf(VERSION_TAG_END, sIdx)
    if (eIdx !== -1) {
      const version = rawDesc.substring(sIdx + VERSION_TAG_START.length, eIdx).trim()
      const cleanDescription = (rawDesc.substring(0, sIdx) + rawDesc.substring(eIdx + VERSION_TAG_END.length)).trim()
      return { cleanDescription, version }
    }
  }
  return { cleanDescription: rawDesc }
}

function packVersion(desc: string | null, version?: string | null): string | null {
  if (!version) return desc
  const clean = desc ? desc.replace(/<!-- TICKET_VERSION:.*? -->/g, '').trim() : ''
  const tag = `${VERSION_TAG_START}${version.trim()}${VERSION_TAG_END}`
  return clean ? `${clean}\n\n${tag}` : tag
}

// In-memory fallback version registry per user
const inMemoryUserVersions = new Map<string, Set<string>>()

interface NoteRow {
  id: string
  date: string
  content: string
  created_by: string
  created_at: string
}

function formatAuthor(raw: string): string {
  if (!raw) return '@user'
  if (raw.includes('@') && raw.includes('.')) {
    return `@${raw.split('@')[0]}`
  }
  return raw.startsWith('@') ? raw : `@${raw}`
}

function formatTicket(row: TicketRow, fallbackSeq?: number) {
  const displayAuthor = formatAuthor(row.created_by)
  const { cleanDescription: rawCleanDesc, commands: extractedCmds } = extractCommands(row.description)
  const { cleanDescription: descWithoutBm, isBookmarked: embeddedBookmark } = extractBookmark(rawCleanDesc)
  const { cleanDescription: descWithoutVer, version: embeddedVersion } = extractVersion(descWithoutBm)
  const embeddedId = extractTicketRefId(descWithoutVer)
  const cleanDescription = descWithoutVer
    ? descWithoutVer.replace(/<!-- TICKET_REF_ID:.*? -->/g, '').trim()
    : ''

  const finalCommands =
    row.commands !== undefined && row.commands !== null ? row.commands : extractedCmds
  const finalDescription =
    row.commands !== undefined && row.commands !== null ? cleanDescription || '' : cleanDescription

  const isBookmarked =
    row.is_bookmarked !== undefined && row.is_bookmarked !== null
      ? Boolean(row.is_bookmarked)
      : embeddedBookmark

  // Resolve 4-digit Ticket ID
  let resolvedTicketId = ''
  if (row.ticket_id !== undefined && row.ticket_id !== null && String(row.ticket_id).trim() !== '') {
    resolvedTicketId = String(row.ticket_id).trim()
  } else if (embeddedId) {
    resolvedTicketId = embeddedId
  } else if (fallbackSeq !== undefined && fallbackSeq > 0) {
    resolvedTicketId = String(1000 + fallbackSeq)
  } else {
    // Deterministic 4-digit fallback from UUID
    let hash = 0
    for (let i = 0; i < (row.id || '').length; i++) {
      hash = (hash * 31 + row.id.charCodeAt(i)) >>> 0
    }
    resolvedTicketId = String(1000 + (hash % 9000))
  }

  const finalVersion = row.version || embeddedVersion || undefined

  return {
    id: row.id,
    ticketId: resolvedTicketId,
    title: row.title,
    description: finalDescription,
    commands: finalCommands || '',
    status: row.status,
    priority: row.priority,
    category: row.category,
    version: finalVersion,
    projectName: row.project_name || 'General',
    createdBy: displayAuthor,
    updatedBy: formatAuthor(row.updated_by || row.created_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isBookmarked,
  }
}

function formatDailyNote(row: NoteRow) {
  return {
    id: row.id,
    date: row.date,
    content: row.content,
    createdBy: formatAuthor(row.created_by),
    createdAt: row.created_at,
  }
}

interface ExpenseRow {
  id: string
  title: string
  amount: number | string
  currency?: string | null
  category: string
  date: string
  payment_method?: string | null
  project_name?: string | null
  notes?: string | null
  created_by: string
  created_at: string
  updated_at?: string | null
}

const DEFAULT_EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Travel & Transport',
  'Software & Subscriptions',
  'Office Supplies',
  'Cloud & Hosting',
  'Marketing & Ads',
  'Bills & Utilities',
  'Personal',
  'Miscellaneous',
]

// In-memory fallback caches ensuring seamless resilience
let fallbackExpenses: Array<{
  id: string
  title: string
  amount: number
  currency: string
  category: string
  date: string
  paymentMethod: string
  projectName: string
  notes?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}> = []
const fallbackCategories = new Set<string>()

function formatExpense(row: ExpenseRow) {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount) || 0,
    currency: row.currency || 'INR',
    category: row.category || 'Miscellaneous',
    date: row.date
      ? typeof row.date === 'string'
        ? row.date.split('T')[0]
        : String(row.date)
      : new Date().toISOString().split('T')[0],
    paymentMethod: row.payment_method || 'UPI',
    projectName: row.project_name || 'General',
    notes: row.notes || null,
    createdBy: formatAuthor(row.created_by),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
  }
}

export interface GraphQLContext {
  currentUser?: {
    id: string
    email: string
  } | null
}

function resolveTargetEmail(
  argsEmail?: string | null,
  context?: GraphQLContext
): string | null {
  if (context?.currentUser?.email) {
    return context.currentUser.email
  }
  if (argsEmail && argsEmail.trim()) {
    return argsEmail.trim().toLowerCase()
  }
  return null
}

// 2. Resolvers: Connect to Supabase PostgreSQL Database!
const resolvers = {
  Query: {
    tickets: async (
      _: unknown,
      args: {
        status?: string
        priority?: string
        category?: string
        projectName?: string
        search?: string
        userEmail?: string
      },
      context?: GraphQLContext
    ) => {
      // Security: Prioritize cryptographically verified token email over client-provided argument
      const userEmail = resolveTargetEmail(args.userEmail, context)
      if (!userEmail) {
        return []
      }
      const prefix = userEmail.split('@')[0]

      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (userEmail === 'admin@ticketflow.io') {
        query = query.or(
          'created_by.eq.admin@ticketflow.io,created_by.eq.James Nithil,created_by.eq.Nithil'
        )
      } else {
        query = query.or(
          `created_by.eq.${userEmail},created_by.eq.@${prefix},created_by.eq.${prefix}`
        )
      }

      if (args.projectName && args.projectName !== 'ALL') {
        query = query.eq('project_name', args.projectName)
      }
      if (args.status) {
        query = query.eq('status', args.status)
      }
      if (args.priority) {
        query = query.eq('priority', args.priority)
      }
      if (args.category && args.category !== 'ALL') {
        query = query.ilike('category', args.category)
      }
      if (args.search) {
        query = query.or(
          `title.ilike.%${args.search}%,description.ilike.%${args.search}%`
        )
      }

      const { data, error } = await query
      if (error) {
        console.error('Supabase tickets query error:', error)
        throw new Error(error.message)
      }
      const rawRows = (data as TicketRow[]) || []
      // Build chronological index map so existing tickets get sequential fallback 1001, 1002, etc.
      const chronological = [...rawRows].sort((a, b) => {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })
      const seqMap = new Map<string, number>()
      chronological.forEach((r, idx) => {
        seqMap.set(r.id, idx + 1)
      })

      return rawRows.map((r) => formatTicket(r, seqMap.get(r.id)))
    },

    projects: async (
      _: unknown,
      args: { userEmail?: string },
      context?: GraphQLContext
    ) => {
      const projectSet = new Set<string>()
      const userEmail = resolveTargetEmail(args.userEmail, context)
      if (!userEmail) {
        return []
      }
      const prefix = userEmail.split('@')[0]

      // 1. Check user-specific tickets for project names
      try {
        let tQuery = supabase.from('tickets').select('project_name')
        if (userEmail === 'admin@ticketflow.io') {
          tQuery = tQuery.or(
            'created_by.eq.admin@ticketflow.io,created_by.eq.James Nithil,created_by.eq.Nithil'
          )
        } else {
          tQuery = tQuery.or(
            `created_by.eq.${userEmail},created_by.eq.@${prefix},created_by.eq.${prefix}`
          )
        }
        const { data: tData, error: tError } = await tQuery
        if (!tError && tData) {
          tData.forEach((t: { project_name: string }) => {
            if (t.project_name) projectSet.add(t.project_name)
          })
        }
      } catch {
        // Tickets table error
      }

      // 2. Also check persisted user-scoped workspaces in Supabase
      try {
        const { data: wData, error: wError } = await supabase
          .from('workspaces')
          .select('name')
        if (!wError && wData) {
          const userPrefix = `${userEmail}:::`
          wData.forEach((w: { name: string }) => {
            if (w.name.startsWith(userPrefix)) {
              projectSet.add(w.name.slice(userPrefix.length))
            }
          })
        }
      } catch {
        // Workspaces table error
      }

      return Array.from(projectSet)
    },

    versions: async (
      _: unknown,
      { userEmail }: { userEmail?: string },
      context?: GraphQLContext
    ) => {
      const email = resolveTargetEmail(userEmail, context) || 'default'
      const versionSet = new Set<string>(['v1.0.0', 'v1.1.0', 'v2.0.0'])

      // Add user in-memory versions
      const userVers = inMemoryUserVersions.get(email)
      if (userVers) {
        userVers.forEach((v) => versionSet.add(v))
      }

      // Check persisted user-scoped versions in workspaces table (name format `${email}:::version:::${versionName}`)
      try {
        const { data: wData } = await supabase.from('workspaces').select('name')
        if (wData) {
          const userPrefix = `${email}:::version:::`
          wData.forEach((w: { name: string }) => {
            if (w.name.startsWith(userPrefix)) {
              versionSet.add(w.name.slice(userPrefix.length))
            }
          })
        }
      } catch {
        // ignore
      }

      // Also extract any versions already assigned to tickets
      try {
        const { data: tData } = await supabase.from('tickets').select('description')
        if (tData) {
          tData.forEach((t: { description: string | null }) => {
            const { version } = extractVersion(t.description)
            if (version) versionSet.add(version)
          })
        }
      } catch {
        // ignore
      }

      return Array.from(versionSet)
    },

    ticket: async (
      _: unknown,
      { id, ticketId }: { id?: string; ticketId?: string }
    ) => {
      if (id) {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', id)
          .single()

        if (!error && data) {
          return formatTicket(data as TicketRow)
        }
      }

      if (ticketId) {
        const cleanId = ticketId.replace(/^#/, '').trim()
        try {
          const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('ticket_id', cleanId)
            .single()

          if (!error && data) {
            return formatTicket(data as TicketRow)
          }
        } catch {
          // Column might not exist yet
        }

        const { data: all } = await supabase
          .from('tickets')
          .select('*')
          .order('created_at', { ascending: true })

        if (all) {
          const rows = all as TicketRow[]
          const found = rows.find((r, idx) => {
            const formatted = formatTicket(r, idx + 1)
            return (
              formatted.ticketId === cleanId ||
              formatted.id === cleanId
            )
          })
          if (found) {
            const idx = rows.indexOf(found)
            return formatTicket(found, idx + 1)
          }
        }
      }

      return null
    },

    dailyNotes: async (
      _: unknown,
      { date, userEmail }: { date?: string; userEmail?: string },
      context?: GraphQLContext
    ) => {
      // Security: Prioritize cryptographically verified token email
      const email = resolveTargetEmail(userEmail, context)
      if (!email) {
        return []
      }

      const prefix = email.split('@')[0]

      let query = supabase
        .from('daily_notes')
        .select('*')
        .order('created_at', { ascending: false })

      if (date) {
        query = query.eq('date', date)
      }

      if (email === 'admin@ticketflow.io') {
        query = query.or(
          'created_by.eq.admin@ticketflow.io,created_by.eq.James Nithil,created_by.eq.Nithil'
        )
      } else {
        query = query.or(
          `created_by.eq.${email},created_by.eq.@${prefix},created_by.eq.${prefix}`
        )
      }

      const { data, error } = await query
      if (error) {
        console.error('Supabase dailyNotes query error:', error)
        throw new Error(error.message)
      }
      return ((data as NoteRow[]) || []).map(formatDailyNote)
    },

    expenses: async (
      _: unknown,
      {
        userEmail,
        projectName,
        category,
        paymentMethod,
        month,
        search,
      }: {
        userEmail?: string
        projectName?: string
        category?: string
        paymentMethod?: string
        month?: string
        search?: string
      },
      context?: GraphQLContext
    ) => {
      const email = resolveTargetEmail(userEmail, context)
      if (!email) {
        return []
      }
      const prefix = email.split('@')[0]

      try {
        let query = supabase
          .from('expenses')
          .select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })

        if (email === 'admin@ticketflow.io') {
          query = query.or(
            'created_by.eq.admin@ticketflow.io,created_by.eq.James Nithil,created_by.eq.Nithil'
          )
        } else {
          query = query.or(
            `created_by.eq.${email},created_by.eq.@${prefix},created_by.eq.${prefix}`
          )
        }

        if (projectName && projectName !== 'ALL') {
          query = query.eq('project_name', projectName)
        }

        if (category && category !== 'ALL') {
          query = query.eq('category', category)
        }

        if (paymentMethod && paymentMethod !== 'ALL') {
          query = query.eq('payment_method', paymentMethod)
        }

        if (month) {
          const startDate = `${month}-01`
          const [y, m] = month.split('-').map(Number)
          const nextMonth =
            m === 12
              ? `${y + 1}-01-01`
              : `${y}-${String(m + 1).padStart(2, '0')}-01`
          query = query.gte('date', startDate).lt('date', nextMonth)
        }

        const { data, error } = await query

        if (error) {
          console.warn('Supabase expenses query fallback:', error.message)
          let items = fallbackExpenses.filter((e) => {
            if (projectName && projectName !== 'ALL' && e.projectName !== projectName)
              return false
            if (category && category !== 'ALL' && e.category !== category)
              return false
            if (
              paymentMethod &&
              paymentMethod !== 'ALL' &&
              e.paymentMethod !== paymentMethod
            )
              return false
            if (month && !e.date.startsWith(month)) return false
            return true
          })
          if (search && search.trim()) {
            const q = search.trim().toLowerCase()
            items = items.filter(
              (r) =>
                r.title.toLowerCase().includes(q) ||
                r.category.toLowerCase().includes(q) ||
                (r.notes && r.notes.toLowerCase().includes(q))
            )
          }
          return items
        }

        let results = ((data as ExpenseRow[]) || []).map(formatExpense)

        if (search && search.trim()) {
          const q = search.trim().toLowerCase()
          results = results.filter(
            (r) =>
              r.title.toLowerCase().includes(q) ||
              r.category.toLowerCase().includes(q) ||
              (r.notes && r.notes.toLowerCase().includes(q))
          )
        }

        return results
      } catch (err) {
        console.warn('Expenses query error:', err)
        return []
      }
    },

    expenseCategories: async (
      _: unknown,
      { userEmail }: { userEmail?: string },
      context?: GraphQLContext
    ) => {
      const categorySet = new Set<string>(DEFAULT_EXPENSE_CATEGORIES)
      const email = resolveTargetEmail(userEmail, context)

      if (!email) {
        return Array.from(categorySet)
      }

      const prefix = email.split('@')[0]

      // 1. Fetch custom categories from expense_categories table
      try {
        let q = supabase.from('expense_categories').select('name')
        if (email === 'admin@ticketflow.io') {
          q = q.or(
            'created_by.eq.admin@ticketflow.io,created_by.eq.James Nithil,created_by.eq.Nithil'
          )
        } else {
          q = q.or(
            `created_by.eq.${email},created_by.eq.@${prefix},created_by.eq.${prefix}`
          )
        }
        const { data, error } = await q
        if (!error && data) {
          data.forEach((r: { name: string }) => {
            if (r.name && r.name.trim()) categorySet.add(r.name.trim())
          })
        }
      } catch {
        // Table not ready yet
      }

      // 2. Fetch distinct categories from expenses table
      try {
        let q = supabase.from('expenses').select('category')
        if (email === 'admin@ticketflow.io') {
          q = q.or(
            'created_by.eq.admin@ticketflow.io,created_by.eq.James Nithil,created_by.eq.Nithil'
          )
        } else {
          q = q.or(
            `created_by.eq.${email},created_by.eq.@${prefix},created_by.eq.${prefix}`
          )
        }
        const { data, error } = await q
        if (!error && data) {
          data.forEach((r: { category: string }) => {
            if (r.category && r.category.trim()) categorySet.add(r.category.trim())
          })
        }
      } catch {
        // Table not ready yet
      }

      fallbackCategories.forEach((c) => categorySet.add(c))
      return Array.from(categorySet)
    },
  },

  Mutation: {
    createTicket: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          title: string
          ticketId?: string
          description?: string
          commands?: string
          status?: string
          priority?: string
          category?: string
          version?: string
          projectName?: string
          createdBy?: string
          isBookmarked?: boolean
        }
      },
      context?: GraphQLContext
    ) => {
      // Determine unique 4-digit ticketId
      let nextSeq = 1001
      try {
        const { data: existing } = await supabase
          .from('tickets')
          .select('id, created_at, ticket_id, description')
          .order('created_at', { ascending: false })
          .limit(100)
        if (existing && existing.length > 0) {
          let maxNum = 1000
          for (const item of existing) {
            const raw = item.ticket_id || extractTicketRefId(item.description)
            const num = raw ? parseInt(String(raw), 10) : NaN
            if (!isNaN(num) && num >= 1000 && num > maxNum) {
              maxNum = num
            }
          }
          if (maxNum >= 1000) {
            nextSeq = maxNum + 1
          } else {
            nextSeq = 1000 + existing.length + 1
          }
        }
      } catch {
        nextSeq = 1000 + Math.floor(Math.random() * 8999) + 1
      }

      const assignedTicketId = (input.ticketId && input.ticketId.trim()) || String(nextSeq)

      // 1. First attempt to insert with native columns
      const basePayload: Record<string, unknown> = {
        ticket_id: assignedTicketId,
        title: input.title,
        description: input.description || null,
        commands: input.commands || null,
        status: input.status || 'TODO',
        priority: input.priority || 'MEDIUM',
        category: input.category || 'DEV',
        project_name: input.projectName || 'General',
        created_by: context?.currentUser?.email || input.createdBy || 'Nithil',
        updated_by: context?.currentUser?.email || input.createdBy || 'Nithil',
      }
      if (input.version !== undefined) {
        basePayload.version = input.version || null
      }
      if (input.isBookmarked !== undefined) {
        basePayload.is_bookmarked = input.isBookmarked
      }

      const { data, error } = await supabase
        .from('tickets')
        .insert([basePayload])
        .select()
        .single()

      if (error) {
        // Fallback: If ticket_id, commands, is_bookmarked, or version column doesn't exist yet on Supabase table (PGRST204)
        delete basePayload.ticket_id
        if (error.code === 'PGRST204' || error.message?.toLowerCase().includes('commands')) {
          delete basePayload.commands
        }
        if (error.code === 'PGRST204' || error.message?.toLowerCase().includes('is_bookmarked')) {
          delete basePayload.is_bookmarked
        }
        if (error.code === 'PGRST204' || error.message?.toLowerCase().includes('version')) {
          delete basePayload.version
        }

        let packed = packDescription(input.description || null, input.commands || null)
        packed = packTicketRefId(packed, assignedTicketId)
        if (input.isBookmarked) {
          packed = packBookmark(packed, input.isBookmarked)
        }
        if (input.version) {
          packed = packVersion(packed, input.version)
        }
        basePayload.description = packed

        const { data: fbData, error: fbError } = await supabase
          .from('tickets')
          .insert([basePayload])
          .select()
          .single()

        if (fbError) {
          console.error('Supabase createTicket fallback error:', fbError)
          throw new Error(fbError.message)
        }
        return formatTicket(fbData as TicketRow)
      }
      return formatTicket(data as TicketRow)
    },

    updateTicket: async (
      _: unknown,
      {
        id,
        input,
      }: {
        id: string
        input: {
          title?: string
          ticketId?: string
          description?: string
          commands?: string
          status?: string
          priority?: string
          category?: string
          version?: string
          projectName?: string
          updatedBy?: string
          isBookmarked?: boolean
        }
      }
    ) => {
      const updateData: Record<string, unknown> = {}
      if (input.title !== undefined) updateData.title = input.title
      if (input.ticketId !== undefined) updateData.ticket_id = input.ticketId
      if (input.description !== undefined) updateData.description = input.description
      if (input.commands !== undefined) updateData.commands = input.commands
      if (input.status !== undefined) updateData.status = input.status
      if (input.priority !== undefined) updateData.priority = input.priority
      if (input.category !== undefined) updateData.category = input.category
      if (input.version !== undefined) updateData.version = input.version || null
      if (input.projectName !== undefined) updateData.project_name = input.projectName
      if (input.updatedBy !== undefined) updateData.updated_by = input.updatedBy
      if (input.isBookmarked !== undefined) updateData.is_bookmarked = input.isBookmarked

      const { data, error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        let shouldRetry = false
        if (error.code === 'PGRST204' || error.message?.toLowerCase().includes('ticket_id')) {
          delete updateData.ticket_id
          shouldRetry = true
        }
        if (error.code === 'PGRST204' || error.message?.toLowerCase().includes('commands')) {
          delete updateData.commands
          let baseDesc = input.description
          if (baseDesc === undefined) {
            const { data: cur } = await supabase.from('tickets').select('description').eq('id', id).single()
            const { cleanDescription } = extractCommands(cur?.description || null)
            baseDesc = cleanDescription
          }
          updateData.description = packDescription(baseDesc, input.commands)
          shouldRetry = true
        }
        if (error.code === 'PGRST204' || error.message?.toLowerCase().includes('is_bookmarked')) {
          delete updateData.is_bookmarked
          let baseDesc = (updateData.description as string | undefined) ?? input.description
          if (baseDesc === undefined) {
            const { data: cur } = await supabase.from('tickets').select('description').eq('id', id).single()
            baseDesc = cur?.description || null
          }
          updateData.description = packBookmark(baseDesc ?? null, input.isBookmarked)
          shouldRetry = true
        }
        if (error.code === 'PGRST204' || error.message?.toLowerCase().includes('version')) {
          delete updateData.version
          let baseDesc = (updateData.description as string | undefined) ?? input.description
          if (baseDesc === undefined) {
            const { data: cur } = await supabase.from('tickets').select('description').eq('id', id).single()
            baseDesc = cur?.description || null
          }
          updateData.description = packVersion(baseDesc ?? null, input.version)
          shouldRetry = true
        }

        if (shouldRetry) {
          const { data: fbData, error: fbError } = await supabase
            .from('tickets')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

          if (!fbError && fbData) {
            return formatTicket(fbData as TicketRow)
          }
        }

        console.error('Supabase updateTicket error:', error)
        throw new Error(error.message)
      }
      return formatTicket(data as TicketRow)
    },

    toggleBookmark: async (
      _: unknown,
      { id }: { id: string }
    ) => {
      const { data: cur, error: fetchErr } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchErr || !cur) {
        throw new Error(fetchErr?.message || 'Ticket not found')
      }

      const currentRow = cur as TicketRow
      const currentBookmarked =
        currentRow.is_bookmarked !== undefined && currentRow.is_bookmarked !== null
          ? Boolean(currentRow.is_bookmarked)
          : (currentRow.description || '').includes(BOOKMARK_TAG)

      const nextBookmarked = !currentBookmarked

      // 1. Try updating is_bookmarked column
      const { data, error } = await supabase
        .from('tickets')
        .update({ is_bookmarked: nextBookmarked })
        .eq('id', id)
        .select()
        .single()

      if (!error && data) {
        return formatTicket(data as TicketRow)
      }

      // 2. Fallback: embed bookmark tag into description
      const updatedDesc = packBookmark(currentRow.description, nextBookmarked)
      const { data: fbData, error: fbError } = await supabase
        .from('tickets')
        .update({ description: updatedDesc })
        .eq('id', id)
        .select()
        .single()

      if (fbError || !fbData) {
        throw new Error(fbError?.message || 'Failed to update bookmark')
      }

      return formatTicket(fbData as TicketRow)
    },

    deleteTicket: async (
      _: unknown,
      { id, userEmail }: { id: string; userEmail?: string },
      context?: GraphQLContext
    ) => {
      const email = resolveTargetEmail(userEmail, context)
      if (!email) {
        throw new Error('Unauthorized: valid user required to delete a ticket')
      }
      const prefix = email.split('@')[0]

      let q = supabase.from('tickets').delete().eq('id', id)
      if (email === 'admin@ticketflow.io') {
        q = q.or(
          'created_by.eq.admin@ticketflow.io,created_by.eq.James Nithil,created_by.eq.Nithil'
        )
      } else {
        q = q.or(
          `created_by.eq.${email},created_by.eq.@${prefix},created_by.eq.${prefix}`
        )
      }
      const { error } = await q
      if (error) {
        console.error('Supabase deleteTicket error:', error)
        throw new Error(error.message)
      }
      return true
    },

    createVersion: async (
      _: unknown,
      { version, userEmail }: { version: string; userEmail?: string },
      context?: GraphQLContext
    ) => {
      const email = resolveTargetEmail(userEmail, context) || 'default'
      const trimmed = version.trim()
      if (!trimmed) throw new Error('Version cannot be empty')

      if (!inMemoryUserVersions.has(email)) {
        inMemoryUserVersions.set(email, new Set(['v1.0.0', 'v1.1.0', 'v2.0.0']))
      }
      inMemoryUserVersions.get(email)!.add(trimmed)

      try {
        const userWorkspaceVersionKey = `${email}:::version:::${trimmed}`
        await supabase.from('workspaces').insert([{ name: userWorkspaceVersionKey }])
      } catch {
        // ignore error if workspaces table unavailable
      }

      return trimmed
    },

    deleteVersion: async (
      _: unknown,
      { version, userEmail }: { version: string; userEmail?: string },
      context?: GraphQLContext
    ) => {
      const email = resolveTargetEmail(userEmail, context) || 'default'
      const trimmed = version.trim()

      const userVers = inMemoryUserVersions.get(email)
      if (userVers) {
        userVers.delete(trimmed)
      }

      try {
        const userWorkspaceVersionKey = `${email}:::version:::${trimmed}`
        await supabase.from('workspaces').delete().eq('name', userWorkspaceVersionKey)
      } catch {
        // ignore
      }

      return true
    },

    createDailyNote: async (
      _: unknown,
      { input }: { input: { date?: string; content: string; createdBy?: string } },
      context?: GraphQLContext
    ) => {
      const today = new Date().toISOString().split('T')[0]
      const author = context?.currentUser?.email || input.createdBy || 'Nithil'
      const { data, error } = await supabase
        .from('daily_notes')
        .insert([
          {
            date: input.date || today,
            content: input.content,
            created_by: author,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error('Supabase createDailyNote error:', error)
        throw new Error(error.message)
      }
      return formatDailyNote(data as NoteRow)
    },

    updateDailyNote: async (
      _: unknown,
      { id, content }: { id: string; content: string; userEmail?: string },
      _context?: GraphQLContext
    ) => {
      const { data, error } = await supabase
        .from('daily_notes')
        .update({ content })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Supabase updateDailyNote error:', error)
        throw new Error(error.message)
      }
      return formatDailyNote(data as NoteRow)
    },

    deleteDailyNote: async (
      _: unknown,
      { id, userEmail }: { id: string; userEmail?: string },
      context?: GraphQLContext
    ) => {
      const email = resolveTargetEmail(userEmail, context)
      if (!email) {
        throw new Error('Unauthorized: valid user required to delete a note')
      }
      const prefix = email.split('@')[0]

      let q = supabase.from('daily_notes').delete().eq('id', id)
      if (email === 'admin@ticketflow.io') {
        q = q.or(
          'created_by.eq.admin@ticketflow.io,created_by.eq.James Nithil,created_by.eq.Nithil'
        )
      } else {
        q = q.or(
          `created_by.eq.${email},created_by.eq.@${prefix},created_by.eq.${prefix}`
        )
      }
      const { error } = await q
      if (error) {
        console.error('Supabase deleteDailyNote error:', error)
        throw new Error(error.message)
      }
      return true
    },

    createWorkspace: async (
      _: unknown,
      { name, userEmail }: { name: string; userEmail?: string },
      context?: GraphQLContext
    ) => {
      const trimmed = name.trim()
      if (!trimmed) {
        throw new Error('Workspace name cannot be empty')
      }

      const email = resolveTargetEmail(userEmail, context)
      const scopedName = email ? `${email}:::${trimmed}` : trimmed

      // Upsert so duplicate names across different users never error
      try {
        await supabase
          .from('workspaces')
          .upsert({ name: scopedName }, { onConflict: 'name', ignoreDuplicates: true })
      } catch (err) {
        console.warn('Workspaces table insert notice:', err)
      }
      return trimmed
    },

    deleteWorkspace: async (
      _: unknown,
      { name, userEmail }: { name: string; userEmail?: string },
      context?: GraphQLContext
    ) => {
      const email = resolveTargetEmail(userEmail, context)
      const scopedName = email ? `${email}:::${name}` : name

      try {
        await supabase
          .from('workspaces')
          .delete()
          .or(`name.eq.${scopedName},name.eq.${name}`)

        // Delete tickets belonging to this workspace for this user
        let tQuery = supabase.from('tickets').delete().eq('project_name', name)
        if (email) {
          const prefix = email.split('@')[0]
          if (email === 'admin@ticketflow.io') {
            tQuery = tQuery.or(
              'created_by.eq.admin@ticketflow.io,created_by.eq.James Nithil,created_by.eq.Nithil'
            )
          } else {
            tQuery = tQuery.or(
              `created_by.eq.${email},created_by.eq.@${prefix},created_by.eq.${prefix}`
            )
          }
        }
        await tQuery
      } catch (err) {
        console.warn('Workspaces table delete notice:', err)
      }
      return true
    },

    createExpense: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          title: string
          amount: number
          currency?: string
          category: string
          date?: string
          paymentMethod?: string
          projectName?: string
          notes?: string
          createdBy?: string
        }
      },
      context?: GraphQLContext
    ) => {
      const today = new Date().toISOString().split('T')[0]
      const author = context?.currentUser?.email || input.createdBy || 'Nithil'
      const payload = {
        title: input.title,
        amount: input.amount,
        currency: input.currency || 'INR',
        category: input.category,
        date: input.date || today,
        payment_method: input.paymentMethod || 'UPI',
        project_name: input.projectName || 'General',
        notes: input.notes || null,
        created_by: author,
      }

      try {
        const { data, error } = await supabase
          .from('expenses')
          .insert([payload])
          .select()
          .single()

        if (error) {
          console.warn('Supabase createExpense fallback:', error.message)
          const fallback = {
            id: `exp-${Date.now()}`,
            title: input.title,
            amount: Number(input.amount) || 0,
            currency: input.currency || 'INR',
            category: input.category,
            date: input.date || today,
            paymentMethod: input.paymentMethod || 'UPI',
            projectName: input.projectName || 'General',
            notes: input.notes || null,
            createdBy: formatAuthor(author),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          fallbackExpenses.unshift(fallback)
          return fallback
        }

        return formatExpense(data as ExpenseRow)
      } catch (err) {
        console.warn('createExpense exception fallback:', err)
        const fallback = {
          id: `exp-${Date.now()}`,
          title: input.title,
          amount: Number(input.amount) || 0,
          currency: input.currency || 'INR',
          category: input.category,
          date: input.date || today,
          paymentMethod: input.paymentMethod || 'UPI',
          projectName: input.projectName || 'General',
          notes: input.notes || null,
          createdBy: formatAuthor(author),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        fallbackExpenses.unshift(fallback)
        return fallback
      }
    },

    updateExpense: async (
      _: unknown,
      {
        id,
        input,
        userEmail,
      }: {
        id: string
        input: {
          title?: string
          amount?: number
          currency?: string
          category?: string
          date?: string
          paymentMethod?: string
          projectName?: string
          notes?: string
        }
        userEmail?: string
      },
      context?: GraphQLContext
    ) => {
      const email = resolveTargetEmail(userEmail, context)
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }
      if (input.title !== undefined) updateData.title = input.title
      if (input.amount !== undefined) updateData.amount = input.amount
      if (input.currency !== undefined) updateData.currency = input.currency
      if (input.category !== undefined) updateData.category = input.category
      if (input.date !== undefined) updateData.date = input.date
      if (input.paymentMethod !== undefined)
        updateData.payment_method = input.paymentMethod
      if (input.projectName !== undefined)
        updateData.project_name = input.projectName
      if (input.notes !== undefined) updateData.notes = input.notes

      try {
        let q = supabase.from('expenses').update(updateData).eq('id', id)

        if (email) {
          const prefix = email.split('@')[0]
          if (email === 'admin@ticketflow.io') {
            q = q.or(
              'created_by.eq.admin@ticketflow.io,created_by.eq.James Nithil,created_by.eq.Nithil'
            )
          } else {
            q = q.or(
              `created_by.eq.${email},created_by.eq.@${prefix},created_by.eq.${prefix}`
            )
          }
        }

        const { data, error } = await q.select().single()
        if (error) {
          console.warn('Supabase updateExpense fallback:', error.message)
          const idx = fallbackExpenses.findIndex((e) => e.id === id)
          if (idx !== -1) {
            fallbackExpenses[idx] = {
              ...fallbackExpenses[idx],
              ...input,
              updatedAt: new Date().toISOString(),
            }
            return fallbackExpenses[idx]
          }
          throw new Error(error.message)
        }
        return formatExpense(data as ExpenseRow)
      } catch (err) {
        console.warn('updateExpense exception fallback:', err)
        const idx = fallbackExpenses.findIndex((e) => e.id === id)
        if (idx !== -1) {
          fallbackExpenses[idx] = {
            ...fallbackExpenses[idx],
            ...input,
            updatedAt: new Date().toISOString(),
          }
          return fallbackExpenses[idx]
        }
        throw new Error('Failed to update expense')
      }
    },

    deleteExpense: async (
      _: unknown,
      { id, userEmail }: { id: string; userEmail?: string },
      context?: GraphQLContext
    ) => {
      const email = resolveTargetEmail(userEmail, context)
      if (!email) {
        throw new Error('Unauthorized: valid user required to delete an expense')
      }
      const prefix = email.split('@')[0]

      try {
        let q = supabase.from('expenses').delete().eq('id', id)
        if (email === 'admin@ticketflow.io') {
          q = q.or(
            'created_by.eq.admin@ticketflow.io,created_by.eq.James Nithil,created_by.eq.Nithil'
          )
        } else {
          q = q.or(
            `created_by.eq.${email},created_by.eq.@${prefix},created_by.eq.${prefix}`
          )
        }
        const { error } = await q
        if (error) {
          console.warn('deleteExpense fallback:', error.message)
        }
        fallbackExpenses = fallbackExpenses.filter((e) => e.id !== id)
        return true
      } catch (err) {
        console.warn('deleteExpense exception fallback:', err)
        fallbackExpenses = fallbackExpenses.filter((e) => e.id !== id)
        return true
      }
    },

    createExpenseCategory: async (
      _: unknown,
      { name, userEmail }: { name: string; userEmail?: string },
      context?: GraphQLContext
    ) => {
      const trimmed = name.trim()
      if (!trimmed) throw new Error('Category name cannot be empty')
      const email = resolveTargetEmail(userEmail, context) || 'nithil'

      try {
        await supabase
          .from('expense_categories')
          .insert([{ name: trimmed, created_by: email }])
      } catch (err) {
        console.warn('createExpenseCategory notice:', err)
      }
      fallbackCategories.add(trimmed)
      return trimmed
    },

    deleteExpenseCategory: async (
      _: unknown,
      { name, userEmail }: { name: string; userEmail?: string },
      context?: GraphQLContext
    ) => {
      const email = resolveTargetEmail(userEmail, context)
      try {
        let q = supabase.from('expense_categories').delete().eq('name', name)
        if (email) {
          const prefix = email.split('@')[0]
          if (email === 'admin@ticketflow.io') {
            q = q.or(
              'created_by.eq.admin@ticketflow.io,created_by.eq.James Nithil,created_by.eq.Nithil'
            )
          } else {
            q = q.or(
              `created_by.eq.${email},created_by.eq.@${prefix},created_by.eq.${prefix}`
            )
          }
        }
        await q
      } catch (err) {
        console.warn('deleteExpenseCategory notice:', err)
      }
      fallbackCategories.delete(name)
      return true
    },
  },
}

// 3. Create Yoga Server instance with Token Verification Context
const { handleRequest } = createYoga<GraphQLContext>({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
  graphiql: process.env.NODE_ENV === 'development',
  context: async ({ request }) => {
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim()
      try {
        const { data, error } = await supabase.auth.getUser(token)
        if (!error && data?.user?.email) {
          return {
            currentUser: {
              id: data.user.id,
              email: data.user.email.toLowerCase(),
            },
          }
        }
      } catch (err) {
        console.warn('Supabase token verification error:', err)
      }
    }
    return { currentUser: null }
  },
})

export async function GET(request: Request) {
  return handleRequest(request, {})
}

export async function POST(request: Request) {
  return handleRequest(request, {})
}

export async function OPTIONS(request: Request) {
  return handleRequest(request, {})
}
