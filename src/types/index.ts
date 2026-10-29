export type TicketStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Ticket {
  id: string
  ticketId?: string
  title: string
  description: string
  commands?: string
  status: TicketStatus
  priority: TicketPriority
  category: string
  version?: string
  projectName: string
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  isBookmarked?: boolean
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
  ticketId?: string
  description?: string
  commands?: string
  status?: TicketStatus
  priority?: TicketPriority
  category?: string
  version?: string
  projectName?: string
  createdBy?: string
  isBookmarked?: boolean
}

export interface UpdateTicketInput {
  title?: string
  ticketId?: string
  description?: string
  commands?: string
  status?: TicketStatus
  priority?: TicketPriority
  category?: string
  version?: string
  projectName?: string
  updatedBy?: string
  isBookmarked?: boolean
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

export type PaymentMethod =
  | 'UPI'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'CASH'
  | 'NET_BANKING'
  | 'OTHER'

export interface Expense {
  id: string
  title: string
  amount: number
  currency: string
  category: string
  date: string
  paymentMethod: string
  projectName: string
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CreateExpenseInput {
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

export interface UpdateExpenseInput {
  title?: string
  amount?: number
  currency?: string
  category?: string
  date?: string
  paymentMethod?: string
  projectName?: string
  notes?: string
}

export type ExpenseSubView = 'inbox' | 'dashboard' | 'cards'

export interface Card {
  id: string
  userEmail: string
  bankName: string
  cardName: string
  cardNumber: string
  description?: string
  cardLimit: number
  cardLimitUsed: number
  cardColor: string
  monthlyEmi: number
  totalEmis: number
  paidEmis: number
  startDate: string
  endDate: string
  emiDueDay: number
  projectName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CardEmiPayment {
  id: string
  cardId: string
  userEmail: string
  emiNumber: number
  amount: number
  paidDate: string
  transactionId?: string
  notes?: string
  createdAt: string
}

export interface CreateCardInput {
  bankName: string
  cardName: string
  cardNumber: string
  description?: string
  cardLimit?: number
  cardLimitUsed?: number
  cardColor?: string
  monthlyEmi: number
  totalEmis: number
  paidEmis?: number
  startDate: string
  endDate?: string
  emiDueDay: number
  projectName?: string
}

export interface UpdateCardInput {
  bankName?: string
  cardName?: string
  cardNumber?: string
  description?: string
  cardLimit?: number
  cardLimitUsed?: number
  cardColor?: string
  monthlyEmi?: number
  totalEmis?: number
  paidEmis?: number
  startDate?: string
  endDate?: string
  emiDueDay?: number
  projectName?: string
  isActive?: boolean
}

export interface RecordEmiPaymentInput {
  cardId: string
  emiNumber: number
  amount: number
  paidDate: string
  transactionId?: string
  notes?: string
  recordAsExpense?: boolean
  expenseCategory?: string
}

