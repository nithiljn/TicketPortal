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
    status: TicketStatus
    priority: TicketPriority
    category: String
    projectName: String
    createdBy: String
  }

  input UpdateTicketInput {
    title: String
    description: String
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
      projectName: String
      search: String
    ): [Ticket!]!
    ticket(id: ID!): Ticket
    projects: [String!]!
    dailyNotes(date: String): [DailyNote!]!
  }

  # MUTATIONS
  type Mutation {
    createTicket(input: CreateTicketInput!): Ticket!
    updateTicket(id: ID!, input: UpdateTicketInput!): Ticket!
    deleteTicket(id: ID!): Boolean!
    createDailyNote(input: CreateDailyNoteInput!): DailyNote!
    deleteDailyNote(id: ID!): Boolean!
  }
`

// Helper: Database snake_case columns -> GraphQL camelCase fields
interface TicketRow {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  category: string
  project_name: string
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

interface NoteRow {
  id: string
  date: string
  content: string
  created_by: string
  created_at: string
}

function formatTicket(row: TicketRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    status: row.status,
    priority: row.priority,
    category: row.category,
    projectName: row.project_name || 'Ticket Portal',
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function formatDailyNote(row: NoteRow) {
  return {
    id: row.id,
    date: row.date,
    content: row.content,
    createdBy: row.created_by,
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
        projectName?: string
        search?: string
      }
    ) => {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (args.projectName && args.projectName !== 'ALL') {
        query = query.eq('project_name', args.projectName)
      }
      if (args.status) {
        query = query.eq('status', args.status)
      }
      if (args.priority) {
        query = query.eq('priority', args.priority)
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
      return (data as TicketRow[] || []).map(formatTicket)
    },

    projects: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('project_name')

      if (error) {
        console.error('Supabase projects query error:', error)
        return ['Ticket Portal']
      }

      // Unique project names extract pandrom
      const uniqueProjects = Array.from(
        new Set(
          (data || [])
            .map((t: { project_name: string }) => t.project_name)
            .filter(Boolean)
        )
      )

      if (uniqueProjects.length === 0) {
        uniqueProjects.push('Ticket Portal')
      }

      return uniqueProjects
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

    dailyNotes: async (_: unknown, { date }: { date?: string }) => {
      let query = supabase
        .from('daily_notes')
        .select('*')
        .order('created_at', { ascending: false })

      if (date) {
        query = query.eq('date', date)
      }

      const { data, error } = await query
      if (error) {
        console.error('Supabase dailyNotes query error:', error)
        throw new Error(error.message)
      }
      return (data as NoteRow[] || []).map(formatDailyNote)
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
          status?: string
          priority?: string
          category?: string
          projectName?: string
          createdBy?: string
        }
      }
    ) => {
      const { data, error } = await supabase
        .from('tickets')
        .insert([
          {
            title: input.title,
            description: input.description || null,
            status: input.status || 'TODO',
            priority: input.priority || 'MEDIUM',
            category: input.category || 'DEV',
            project_name: input.projectName || 'Ticket Portal',
            created_by: input.createdBy || 'Nithil',
            updated_by: input.createdBy || 'Nithil',
          },
        ])
        .select()
        .single()

      if (error) {
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
        console.error('Supabase updateTicket error:', error)
        throw new Error(error.message)
      }
      return formatTicket(data as TicketRow)
    },

    deleteTicket: async (_: unknown, { id }: { id: string }) => {
      const { error } = await supabase.from('tickets').delete().eq('id', id)
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

    deleteDailyNote: async (_: unknown, { id }: { id: string }) => {
      const { error } = await supabase.from('daily_notes').delete().eq('id', id)
      if (error) {
        console.error('Supabase deleteDailyNote error:', error)
        throw new Error(error.message)
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
