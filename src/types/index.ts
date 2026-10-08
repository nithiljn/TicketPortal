export type TicketStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: string
  projectName: string
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export interface DailyNote {
  id: string
  date: string
  content: string
  createdBy: string
  createdAt: string
}

export interface CreateTicketInput {
  title: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  category?: string
  projectName?: string
  createdBy?: string
}

export interface UpdateTicketInput {
  title?: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  category?: string
  projectName?: string
  updatedBy?: string
}

export type UserRole = 'USER' | 'ADMIN' | 'VIEWER'

export interface AuthUser {
  id: string
  email: string
  name: string
  username?: string
  role?: string
  avatarUrl?: string
}

