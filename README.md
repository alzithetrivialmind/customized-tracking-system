# EcoGreen SO Tracking System (ETS) — Cloud-Native Edition

A premium, full-stack tracking management system for EcoGreen customer service executives. Built with **React**, **Supabase**, and **Vercel Serverless Functions**.

## 🚀 Architecture

This system uses a modern serverless stack for maximum reliability and scalability:
- **Frontend**: React (Vite) + Lucide Icons.
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS).
- **Authentication**: Supabase Auth with RBAC (Admin/User).
- **Storage**: Supabase Storage Buckets for templates, logs, and exports.
- **Backend / API**: Vercel Serverless Functions (`exceljs`) for in-memory report generation.

## 🛠 Setup Instructions

### 1. Supabase Initialization
1. Create a new project on [Supabase.com](https://supabase.com).
2. Go to the **SQL Editor** and run the contents of [supabase_setup.sql](./supabase_setup.sql).
3. This will create tables, RLS policies, and storage buckets.

### 2. Environment Variables
1. Copy [.env.example](./.env.example) to `.env`.
2. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the frontend.
3. Add your `SUPABASE_SERVICE_ROLE_KEY` to your Vercel project environment settings (SECRET — NEVER EXPOSED TO FRONTEND).

### 3. Local Development
```bash
npm install
npm run dev
```

### 4. Admin Setup
1. Create a user in the Supabase Auth Dashboard (e.g., `admin@ecogreen.com`).
2. Run the SQL snippet at the end of `supabase_setup.sql` to assign them the `admin` role in the `profiles` table.
3. On the first login, the system will force a password change for security.

## ✨ Features

- **Multi-User RBAC**: Isolated workspaces for CS Executives; Master Overview for Admins.
- **Audit Logging**: Mandatory modification reasons and admin-override tracking.
- **Cloud Storage**: Centralized Excel templates and SO attachments.
- **In-Memory Injection**: Enterprise-grade Excel report generation without local file system writes.

---
© 2026 EcoGreen Oleochemicals - Customer Service Executive Tools
