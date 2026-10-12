# TicketPortal 🎫

A modern, full-stack engineering workspace for ticket tracking, daily standup notes, and personal expense management. Built with Next.js 16, React 19, GraphQL Yoga, Supabase, and Tailwind CSS v4.

---

## 🚀 Overview

**TicketPortal** combines high density task management with daily developer workflows into a unified, distraction free portal. Designed with human crafted, minimalist aesthetics inspired by Linear, Stripe, and GitHub — featuring clean neutral typography, micro SVG icons, and smooth dark/light theme switching.

---

## ✨ Key Features

### 🎫 Workspace & Ticket Management
- **Scoped Workspaces:** Organize tasks under distinct projects or switch to an all workspaces overview.
- **Rich Ticket Details:** Capture title, markdown friendly descriptions, technical categories, priority levels, and execution commands.
- **Dedicated View Mode:** Quick view modal with one click copy for command snippets, author metadata, timestamps, and fast edit switching.
- **Quick Keyboard Shortcuts:** Save tickets instantly with `⌘ / Ctrl + Enter`, or close modals with `Esc`.

### 📊 Multiple Workflow Views
- **Inbox Table View:** High density desktop table and mobile optimized card layout with inline actions and clean neutral status indicators.
- **Kanban Board:** Multi column visual board (`To Do`, `In Progress`, `Completed`, `Blocked`) with ticket counts and fluid card actions.
- **Analytics Dashboard:** Executive KPI metric cards, completion rate progress, interactive status donut chart, priority severity distribution, and workspace workload stats.

### 🔍 Multi-Facet Filtering & Real Time Search
- **Multi Select Filters:** Filter across multiple statuses (e.g. `To Do` + `In Progress` at the same time), priorities (`Urgent` + `High`), and technical categories simultaneously.
- **Global Search:** Fast client side search across titles, descriptions, commands, and authors.
- **Active Filter Chips:** Quick dismiss badges with one click clear all support.

### 💳 Integrated Expense Tracker
- **Monthly & Daily Grouping:** Log and monitor expenses with automatic day totals and month-by-month filtering.
- **KPI Metrics:** Real time Total Spent and transaction count statistics.
- **Custom Categories:** Manage and customize expense categories with the category management modal.
- **Payment Methods:** Support for UPI, Credit Card, Debit Card, Cash, Net Banking, and more.

### 📝 Daily Standup Notes
- Capture daily progress logs, blocker notes, and personal scratchpad entries alongside your tickets.

### 🎨 Human-Crafted Design System
- **Theme Toggle:** Dark and Light mode support with smooth transitions and persistent state.
- **High-Contrast Micro-Icons:** Clean SVG icons replace rainbow color clutter and dot templates.
- **Neutral Idle Actions:** Subtle action buttons that highlight only on user interaction.

### 🔐 Authentication & Account Management
- **Supabase Auth:** Secure authentication with email, password, and session persistence.
- **Password Strength Meter:** Real-time feedback meter inspired by enterprise account registration flows.
- **User Settings Modal:** Quick profile settings, username management, and session logout.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components) |
| **UI Library** | [React 19](https://react.dev/) |
| **API Layer** | [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server) (`/api/graphql`) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |

---

## 📁 Project Structure

```text
ticket-portal/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/lookup/     # Email lookup endpoint
│   │   │   └── graphql/         # GraphQL Yoga endpoint (schema & resolvers)
│   │   ├── globals.css          # Tailwind CSS configuration & theme tokens
│   │   ├── layout.tsx           # Root layout & font definitions
│   │   └── page.tsx             # Main portal page (views, state, handlers)
│   ├── components/
│   │   ├── Button.tsx           # Standardized button variants
│   │   ├── ConfirmModal.tsx     # Destructive action confirmation dialog
│   │   ├── DailyNotes.tsx       # Standup notes editor & logs
│   │   ├── DashboardView.tsx    # Analytics & KPI dashboard
│   │   ├── ExpenseTracker.tsx   # Expense tracker view & statistics
│   │   ├── ExpenseModal.tsx     # Create / Edit expense modal
│   │   ├── ExpenseCategoryModal.tsx # Manage expense categories
│   │   ├── InboxTable.tsx       # Inbox table & mobile list view
│   │   ├── KanbanBoard.tsx      # Kanban board workflow view
│   │   ├── LoginScreen.tsx      # Authentication (Sign In & Sign Up)
│   │   ├── Sidebar.tsx          # Navigation, workspace switcher & multi-filters
│   │   ├── TicketModal.tsx      # Ticket view & edit modal
│   │   └── WorkspaceModal.tsx   # Workspace creation modal
│   ├── context/
│   │   └── AuthContext.tsx      # Supabase authentication provider
│   ├── lib/
│   │   ├── graphql-client.ts    # Frontend GraphQL query & mutation client
│   │   └── supabase.ts          # Supabase client initialization
│   └── types/
│       └── index.ts             # TypeScript interfaces & domain models
├── public/                      # Static assets
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18.17+ or later
- npm, pnpm, or yarn
- A [Supabase](https://supabase.com/) project

### 1. Clone the repository
```bash
git clone https://github.com/your-username/ticket-portal.git
cd ticket-portal
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 4. Database Setup (Supabase)
Run the following SQL in your Supabase SQL Editor:

```sql
-- Tickets Table
create table public.tickets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text default '',
  commands text default '',
  status text not null default 'TODO',
  priority text not null default 'MEDIUM',
  category text not null default 'DEV',
  project_name text not null default 'General',
  created_by text not null default 'James Nithil',
  updated_by text not null default 'James Nithil',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Daily Standup Notes Table
create table public.daily_notes (
  id uuid default gen_random_uuid() primary key,
  date text not null,
  content text not null,
  created_by text not null default 'James Nithil',
  created_at timestamptz default now() not null
);

-- Expenses Table
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  amount numeric(10, 2) not null,
  currency text default 'INR',
  category text not null,
  date text not null,
  payment_method text not null default 'UPI',
  project_name text not null default 'General',
  notes text default '',
  created_by text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Expense Categories Table
create table public.expense_categories (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  created_by text,
  created_at timestamptz default now() not null
);
```

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts local Next.js development server at `localhost:3000` |
| `npm run build` | Compiles and builds production-optimized bundle |
| `npm run start` | Starts production server after build |
| `npm run lint` | Runs ESLint validation across codebase |

---

## ⌨️ Shortcuts Reference

| Shortcut | Action |
|---|---|
| `⌘ / Ctrl + Enter` | Save / Submit ticket form inside modal |
| `Esc` | Dismiss open dialogs and modals |
| `Click on row` | Open ticket details in view mode |

---

## 📄 License

This project is private and maintained for personal engineering workflow tracking.
