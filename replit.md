# Frigo - نظام إدارة الصناديق

## Overview
Frigo is a crate/box ("صندوق/sneda9") tracking and management system. An admin logs in and manages users, tracking how many crates each user currently holds. The admin can add or return crates, view movement history, and export CSV reports. The entire UI is in Arabic with RTL layout.

## Architecture
- **Frontend**: React + TypeScript with Vite, Shadcn/ui components, TanStack Query
- **Backend**: Express.js with session-based authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: No client-side router needed (single dashboard view with login gate)
- **Language**: Arabic (RTL) - `dir="rtl" lang="ar"` on HTML root

## Key Features
1. **Admin Login** - Phone + password authentication (session-based)
2. **User Management** - Create new users who can hold crates
3. **Crate Tracking** - Add/return crates for each user with real-time totals
4. **Movement History** - Full audit trail of all add/return operations per user
5. **CSV Export** - Download movement history as CSV file
6. **Dashboard Stats** - Total users, total crates out, active users

## Data Model
- **users** - id, name, phone (unique), password (hashed), role (admin/user), currentCrates
- **movements** - id, userId (FK), type (ADD/RETURN), quantity, addedBy, date

## Default Credentials
- Admin phone: `00000000`, password: `1234`
- All seed users also use password `1234`

## File Structure
- `shared/schema.ts` - Drizzle schema + Zod validation
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface (DatabaseStorage)
- `server/routes.ts` - Express API routes with session auth
- `server/seed.ts` - Seed data for demo
- `client/src/lib/auth.tsx` - Auth context provider
- `client/src/pages/login.tsx` - Login page
- `client/src/pages/dashboard.tsx` - Main dashboard with user management

## Theme
- Primary color: Teal/cyan (hsl 199 89% 38%)
- Font: Inter
- Clean, professional look with light/dark mode support
