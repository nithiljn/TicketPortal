# TicketFlow

A unified developer workspace for managing engineering tickets, tracking daily standup logs, building work consistency, and monitoring project expenses.

Built with Next.js 16, React 19, GraphQL Yoga, Supabase, and Tailwind CSS.

---

## Overview

TicketFlow is designed for software developers and engineering teams who want a fast, focused tool to manage their day to day work without jumping between multiple apps.

Instead of keeping tickets in one tool, standup notes in another, and personal or project expenses in a spreadsheet, TicketFlow brings everything into a single, clean workspace. The interface follows a minimalist black and white theme with high contrast typography and smooth transitions between views.

---

## What TicketFlow Does

### Ticket Management
Every ticket gets an automatic four digit reference ID starting from 1001. Tickets are organized by project workspaces so you can isolate work between different repositories or view everything combined. You can store execution commands, technical categories, priority tags, and descriptions. Opening any ticket updates the browser link, allowing you to share the exact ticket directly with a teammate using a quick URL.

### Multiple Views
Work the way you prefer:
* Inbox Table View: A structured table for desktop and a touch friendly card view for mobile.
* Kanban Board: Move tasks across To Do, In Progress, Completed, and Blocked columns.
* Analytics Dashboard: Review completion rates, priority distribution, and workspace workloads.

### Consistency Activity Heatmap
A GitHub style contribution heatmap tracks your day to day momentum over the past fourteen weeks. Developers can schedule daily task goals with one time completion checks to build steady habits and maintain delivery consistency without burn out.

### Daily Standup Logs
Keep clean records of daily progress, notes, and blockers alongside your active tasks. Useful for standup meetings and end of day reviews.

### Expense Tracking and PDF Reports
Record project expenditures by date, workspace, category, and payment method. The tracker calculates total spending, highest transactions, and daily averages. When you need to share or archive your spending, a single click exports your current filtered view into a formatted PDF complete with vector branding, metric cards, a category distribution chart, and daily trend visuals.

### Human Centered Design
Built with an interface that stays quiet and out of your way. Dark and light themes are fully supported with zero neon gradients or noisy colors. Modals respond to standard keyboard shortcuts such as Escape to close and Command Enter to submit.

---

## Tech Stack

* Framework: Next.js 16 with Turbopack and the App Router
* Front End: React 19 and TypeScript 5
* Styling: Tailwind CSS v4 with custom dark and light themes
* API Layer: GraphQL Yoga running on Next.js route handlers
* Database and Auth: Supabase with PostgreSQL
* PDF Generation: jsPDF and AutoTable for client side vector exports

---

## Project Structure

```text
ticket-portal/
├── public/
│   ├── ticket-icon.png
│   ├── apple-touch-icon.png
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/lookup/          # User lookup endpoint
│   │   │   └── graphql/              # GraphQL Yoga schema and resolvers
│   │   ├── globals.css               # Theme tokens and base styles
│   │   ├── layout.tsx                # Metadata, fonts, and root provider
│   │   ├── opengraph-image.tsx       # Social share image generator
│   │   └── page.tsx                  # Main workspace controller and deep linking
│   ├── components/
│   │   ├── ActivityHeatmapModal.tsx  # Contribution heatmap and task confirmations
│   │   ├── Button.tsx                # Standard button component
│   │   ├── ConfirmModal.tsx          # Confirmation dialogs
│   │   ├── DailyNotes.tsx            # Daily work log editor
│   │   ├── DashboardView.tsx         # Analytics and KPI view
│   │   ├── ExpenseCategoryModal.tsx  # Custom expense category manager
│   │   ├── ExpenseModal.tsx          # Expense creation and edit form
│   │   ├── ExpenseTracker.tsx        # Expense tracker, metrics, and export button
│   │   ├── InboxTable.tsx            # Inbox table and mobile touch cards
│   │   ├── KanbanBoard.tsx           # Multi column task board
│   │   ├── LoginScreen.tsx           # Authentication view
│   │   ├── Sidebar.tsx               # Navigation, workspace switcher, and filters
│   │   ├── TicketModal.tsx           # Ticket view and edit modal
│   │   ├── Toast.tsx                 # Non intrusive notification banners
│   │   └── WorkspaceModal.tsx        # Workspace management dialog
│   ├── context/
│   │   └── AuthContext.tsx           # Supabase session and user state
│   ├── lib/
│   │   ├── generateExpensePdf.ts     # Client side PDF report generator
│   │   ├── graphql-client.ts         # GraphQL client utilities
│   │   └── supabase.ts               # Supabase client setup
│   └── types/
│       └── index.ts                  # Shared TypeScript interfaces
├── package.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

* Node.js 18.17 or later
* npm, pnpm, or yarn
* A Supabase project

### 1. Clone the repository

```bash
git clone https://github.com/nithiljn/TicketPortal.git
cd TicketPortal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

Run the following SQL commands in your Supabase SQL Editor:

```sql
-- Tickets Table
create table public.tickets (
  id uuid default gen_random_uuid() primary key,
  ticket_id varchar(10) unique,
  title text not null,
  description text default '',
  commands text default '',
  status text not null default 'TODO',
  priority text not null default 'MEDIUM',
  category text not null default 'DEV',
  project_name text not null default 'General',
  created_by text not null default 'User',
  updated_by text not null default 'User',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Daily Standup Notes Table
create table public.daily_notes (
  id uuid default gen_random_uuid() primary key,
  date text not null,
  content text not null,
  created_by text not null default 'User',
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

Open http://localhost:3000 in your browser to view the application.

---

## Keyboard Shortcuts

* Command + Enter (or Ctrl + Enter): Save and submit open ticket forms
* Escape: Close open modals and dialogs
* Command + N (or Ctrl + N): Open new ticket creation modal

---

## License

This project is open source and available under the [MIT License](LICENSE).
