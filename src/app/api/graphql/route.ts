import { createSchema, createYoga } from 'graphql-yoga'

// 1. GraphQL Type Definitions (Schema)
// Idhu thaan contract - Client kitta enna data irukku, enna kekalaam nu define pandrom.
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
    createdAt: String!
    updatedAt: String!
  }

  type DailyNote {
    id: ID!
    date: String!
    content: String!
    createdAt: String!
  }

  input CreateTicketInput {
    title: String!
    description: String
    status: TicketStatus
    priority: TicketPriority
    category: String
  }

  input UpdateTicketInput {
    title: String
    description: String
    status: TicketStatus
    priority: TicketPriority
    category: String
  }

  input CreateDailyNoteInput {
    date: String!
    content: String!
  }

  # QUERIES: REST API GET requests maadhiri (Data fetch panna)
  type Query {
    tickets(status: TicketStatus, priority: TicketPriority, search: String): [Ticket!]!
    ticket(id: ID!): Ticket
    dailyNotes(date: String): [DailyNote!]!
  }

  # MUTATIONS: REST API POST, PUT, DELETE maadhiri (Data modify panna)
  type Mutation {
    createTicket(input: CreateTicketInput!): Ticket!
    updateTicket(id: ID!, input: UpdateTicketInput!): Ticket!
    deleteTicket(id: ID!): Boolean!
    createDailyNote(input: CreateDailyNoteInput!): DailyNote!
    deleteDailyNote(id: ID!): Boolean!
  }
`

// In-memory mock data (Supabase connect pandradhukku munnadi test panna)
let mockTickets = [
  {
    id: '1',
    title: 'Setup TicketPortal Next.js Project',
    description: 'Install Next.js, configure TypeScript, Tailwind CSS and GraphQL Yoga',
    status: 'DONE',
    priority: 'HIGH',
    category: 'DEV',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Design GraphQL Schema & Resolvers',
    description: 'Define Ticket, DailyNote types, Query and Mutation fields',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    category: 'DEV',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Connect Supabase PostgreSQL Database',
    description: 'Create tickets and daily_notes tables in Supabase and hook up DB client',
    status: 'TODO',
    priority: 'MEDIUM',
    category: 'DATABASE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

let mockNotes = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    content: 'Learned GraphQL basics: TypeDefs, Resolvers, and Yoga server integration with Next.js App Router!',
    createdAt: new Date().toISOString(),
  },
]

// 2. Resolvers
// Query or Mutation call aagum bodhu actual-ah run aagura functions!
const resolvers = {
  Query: {
    tickets: (_: unknown, args: { status?: string; priority?: string; search?: string }) => {
      let filtered = [...mockTickets]
      if (args.status) {
        filtered = filtered.filter((t) => t.status === args.status)
      }
      if (args.priority) {
        filtered = filtered.filter((t) => t.priority === args.priority)
      }
      if (args.search) {
        const query = args.search.toLowerCase()
        filtered = filtered.filter(
          (t) =>
            t.title.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query))
        )
      }
      return filtered
    },
    ticket: (_: unknown, { id }: { id: string }) => {
      return mockTickets.find((t) => t.id === id) || null
    },
    dailyNotes: (_: unknown, { date }: { date?: string }) => {
      if (date) {
        return mockNotes.filter((n) => n.date === date)
      }
      return mockNotes
    },
  },

  Mutation: {
    createTicket: (_: unknown, { input }: { input: any }) => {
      const newTicket = {
        id: String(Date.now()),
        title: input.title,
        description: input.description || '',
        status: input.status || 'TODO',
        priority: input.priority || 'MEDIUM',
        category: input.category || 'GENERAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockTickets.push(newTicket)
      return newTicket
    },
    updateTicket: (_: unknown, { id, input }: { id: string; input: any }) => {
      const index = mockTickets.findIndex((t) => t.id === id)
      if (index === -1) throw new Error('Ticket not found')
      mockTickets[index] = {
        ...mockTickets[index],
        ...input,
        updatedAt: new Date().toISOString(),
      }
      return mockTickets[index]
    },
    deleteTicket: (_: unknown, { id }: { id: string }) => {
      const initialLength = mockTickets.length
      mockTickets = mockTickets.filter((t) => t.id !== id)
      return mockTickets.length < initialLength
    },
    createDailyNote: (_: unknown, { input }: { input: any }) => {
      const newNote = {
        id: String(Date.now()),
        date: input.date,
        content: input.content,
        createdAt: new Date().toISOString(),
      }
      mockNotes.push(newNote)
      return newNote
    },
    deleteDailyNote: (_: unknown, { id }: { id: string }) => {
      const initialLength = mockNotes.length
      mockNotes = mockNotes.filter((n) => n.id !== id)
      return mockNotes.length < initialLength
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

export { handleRequest as GET, handleRequest as POST, handleRequest as OPTIONS }
