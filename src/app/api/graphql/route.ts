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
    title: String!
    description: String
    commands: String
    status: TicketStatus!
    priority: TicketPriority!
    category: String!
    projectName: String!
    createdBy: String!
    updatedBy: String!
    createdAt: String!
    updatedAt: String!
  }

  type DailyNote {
    id: ID!
    date: String!
    content: String!
    createdBy: String!
    createdAt: String!
  }

  input CreateTicketInput {
    title: String!
    description: String
    commands: String
    status: TicketStatus
    priority: TicketPriority
    category: String
    projectName: String
    createdBy: String
  }

  input UpdateTicketInput {
    title: String
    description: String
    commands: String
    status: TicketStatus
    priority: TicketPriority
    category: String
    projectName: String
    updatedBy: String
  }

  input CreateDailyNoteInput {
    date: String
    content: String!
    createdBy: String
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
    ticket(id: ID!): Ticket
    projects(userEmail: String): [String!]!
    dailyNotes(date: String, userEmail: String): [DailyNote!]!
  }

  # MUTATIONS
  type Mutation {
    createTicket(input: CreateTicketInput!): Ticket!
    updateTicket(id: ID!, input: UpdateTicketInput!): Ticket!
    deleteTicket(id: ID!, userEmail: String): Boolean!
    createDailyNote(input: CreateDailyNoteInput!): DailyNote!
    deleteDailyNote(id: ID!, userEmail: String): Boolean!
    createWorkspace(name: String!, userEmail: String): String!
    deleteWorkspace(name: String!, userEmail: String): Boolean!
  }
`

// Helper: Database snake_case columns -> GraphQL camelCase fields
interface TicketRow {
  id: string
  title: string
  description: string | null
  commands?: string | null
  status: string
  priority: string
  category: string
  project_name: string
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

const COMMANDS_START = '<!-- TICKET_COMMANDS_START -->'
const COMMANDS_END = '<!-- TICKET_COMMANDS_END -->'

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

function formatTicket(row: TicketRow) {
  const displayAuthor = formatAuthor(row.created_by)
  const { cleanDescription, commands: extractedCmds } = extractCommands(row.description)
  const finalCommands =
    row.commands !== undefined && row.commands !== null ? row.commands : extractedCmds
  const finalDescription =
    row.commands !== undefined && row.commands !== null ? row.description || '' : cleanDescription

  return {
    id: row.id,
    title: row.title,
    description: finalDescription,
    commands: finalCommands || '',
    status: row.status,
    priority: row.priority,
    category: row.category,
    projectName: row.project_name || 'General',
    createdBy: displayAuthor,
    updatedBy: formatAuthor(row.updated_by || row.created_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
      }
    ) => {
      // Security: Never return tickets if userEmail is missing or unauthenticated
      if (!args.userEmail || !args.userEmail.trim()) {
        return []
      }

      const userEmail = args.userEmail.trim().toLowerCase()
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
      return ((data as TicketRow[]) || []).map(formatTicket)
    },

    projects: async (_: unknown, args: { userEmail?: string }) => {
      const projectSet = new Set<string>()

      // Security: Only return projects if userEmail is provided
      if (!args.userEmail || !args.userEmail.trim()) {
        return []
      }

      const userEmail = args.userEmail.trim().toLowerCase()
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

    ticket: async (_: unknown, { id }: { id: string }) => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Supabase ticket query error:', error)
        return null
      }
      return formatTicket(data as TicketRow)
    },

    dailyNotes: async (
      _: unknown,
      { date, userEmail }: { date?: string; userEmail?: string }
    ) => {
      // Security: Never return daily notes if userEmail is missing or unauthenticated
      if (!userEmail || !userEmail.trim()) {
        return []
      }

      const email = userEmail.trim().toLowerCase()
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
  },

  Mutation: {
    createTicket: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          title: string
          description?: string
          commands?: string
          status?: string
          priority?: string
          category?: string
          projectName?: string
          createdBy?: string
        }
      }
    ) => {
      // 1. First attempt to insert with native 'commands' column
      const basePayload: Record<string, unknown> = {
        title: input.title,
        description: input.description || null,
        commands: input.commands || null,
        status: input.status || 'TODO',
        priority: input.priority || 'MEDIUM',
        category: input.category || 'DEV',
        project_name: input.projectName || 'General',
        created_by: input.createdBy || 'Nithil',
        updated_by: input.createdBy || 'Nithil',
      }

      const { data, error } = await supabase
        .from('tickets')
        .insert([basePayload])
        .select()
        .single()

      if (error) {
        // Fallback: If commands column doesn't exist yet on Supabase table (PGRST204)
        if (error.code === 'PGRST204' || error.message?.toLowerCase().includes('commands')) {
          delete basePayload.commands
          basePayload.description = packDescription(input.description || null, input.commands || null)
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

        console.error('Supabase createTicket error:', error)
        throw new Error(error.message)
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
          description?: string
          commands?: string
          status?: string
          priority?: string
          category?: string
          projectName?: string
          updatedBy?: string
        }
      }
    ) => {
      const updateData: Record<string, unknown> = {}
      if (input.title !== undefined) updateData.title = input.title
      if (input.description !== undefined) updateData.description = input.description
      if (input.commands !== undefined) updateData.commands = input.commands
      if (input.status !== undefined) updateData.status = input.status
      if (input.priority !== undefined) updateData.priority = input.priority
      if (input.category !== undefined) updateData.category = input.category
      if (input.projectName !== undefined) updateData.project_name = input.projectName
      if (input.updatedBy !== undefined) updateData.updated_by = input.updatedBy

      const { data, error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        // Fallback: If commands column doesn't exist yet on Supabase table (PGRST204)
        if (error.code === 'PGRST204' || error.message?.toLowerCase().includes('commands')) {
          delete updateData.commands

          let baseDesc = input.description
          if (baseDesc === undefined) {
            const { data: cur } = await supabase.from('tickets').select('description').eq('id', id).single()
            const { cleanDescription } = extractCommands(cur?.description || null)
            baseDesc = cleanDescription
          }

          updateData.description = packDescription(baseDesc, input.commands)

          const { data: fbData, error: fbError } = await supabase
            .from('tickets')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

          if (fbError) {
            console.error('Supabase updateTicket fallback error:', fbError)
            throw new Error(fbError.message)
          }
          return formatTicket(fbData as TicketRow)
        }

        console.error('Supabase updateTicket error:', error)
        throw new Error(error.message)
      }
      return formatTicket(data as TicketRow)
    },

    deleteTicket: async (
      _: unknown,
      { id, userEmail }: { id: string; userEmail?: string }
    ) => {
      if (!userEmail || !userEmail.trim()) {
        throw new Error('Unauthorized: user email required to delete a ticket')
      }
      const email = userEmail.trim().toLowerCase()
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

    createDailyNote: async (
      _: unknown,
      { input }: { input: { date?: string; content: string; createdBy?: string } }
    ) => {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('daily_notes')
        .insert([
          {
            date: input.date || today,
            content: input.content,
            created_by: input.createdBy || 'Nithil',
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

    deleteDailyNote: async (
      _: unknown,
      { id, userEmail }: { id: string; userEmail?: string }
    ) => {
      if (!userEmail || !userEmail.trim()) {
        throw new Error('Unauthorized: user email required to delete a note')
      }
      const email = userEmail.trim().toLowerCase()
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
      { name, userEmail }: { name: string; userEmail?: string }
    ) => {
      const trimmed = name.trim()
      if (!trimmed) {
        throw new Error('Workspace name cannot be empty')
      }

      const email = userEmail?.trim().toLowerCase()
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
      { name, userEmail }: { name: string; userEmail?: string }
    ) => {
      const email = userEmail?.trim().toLowerCase()
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
  },
}

// 3. Create Yoga Server instance
const { handleRequest } = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
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
