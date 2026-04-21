# Masjidh Accounting Solution

Developed By: **Inzeedo (PVT) Ltd.**

## Overview

The **Masjidh Accounting Solution** is a specialized, comprehensive management and accounting system designed specifically for Mosques (Masjids). It streamlines the administration of members, financial transactions, donations, and reporting, providing a modern and secure platform for mosque management committees.

Built with **Next.js 15+**, **Prisma**, and **Tailwind CSS**, the system offers a high-performance, responsive, and user-friendly experience, including Progressive Web App (PWA) support for mobile and offline accessibility.

---

## Key Features

### 👥 Member Management
- Complete member profiling and tracking.
- Unique Member ID generation (Auto/Manual).
- Track "Sanda" (monthly membership) commitments.
- Membership status management (Active/Inactive).

### 🧾 Billing & Invoices
- Automated and manual invoice generation for membership fees.
- Payment tracking (Paid, Pending, Overdue).
- Multi-method payment support (Cash, Bank Transfer).
- Digital receipt generation.

### 💰 Accounting & Finance
- **General Ledger:** Detailed record of all financial movements.
- **Income & Expense Tracking:** Categorized financial tracking with budget limits.
- **Bank Account Management:** Track multiple bank accounts and their balances.
- **Ledger Entries:** Automatic ledger creation for all payments and donations.

### 🎁 Donation Management
- Purpose-based donations (e.g., Mosque Construction, Zakat, Sadaqah).
- Anonymous donation support.
- Donor tracking (Regular vs. Occasional).
- Integration with the general ledger.

### 📊 Reporting & Analytics
- Comprehensive financial reports (Income vs. Expense).
- Member payment status reports.
- Export capabilities to **PDF** and **Excel (XLSX)**.
- Real-time dashboard with financial visualizations (Recharts).

### 🛡️ Admin & Security
- **Role-Based Access Control:** Secure authentication via NextAuth.js.
- **Audit Logs:** Full traceability of all system actions (Create, Update, Delete).
- **System Settings:** Customizable mosque profile, currency, and fiscal year.
- **Data Safety:** "Soft-delete" mechanism with a 7-day recovery period for critical data.

---

## Technology Stack

- **Frontend:** [Next.js 15+](https://nextjs.org/) (App Router, Turbopack)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching:** [SWR](https://swr.vercel.app/)
- **Database/ORM:** [Prisma](https://www.prisma.io/) with **PostgreSQL**
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Forms:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Tables:** [TanStack Table v8](https://tanstack.com/table)
- **Utilities:** [Biome](https://biomejs.dev/) (Linting/Formatting), [date-fns](https://date-fns.org/)
- **PWA:** [@ducanh2912/next-pwa](https://github.com/ducanh2912/next-pwa)
- **Storage:** Flexible provider (Local, AWS S3, Cloudflare R2)

---

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL Database
- NPM or PNPM
- DB : sharjoonibnuhussain99@gmail.com

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd masjid-accounting-solution
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add the following:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/masjid_db?schema=public"
   DIRECT_URL="postgresql://user:password@localhost:5432/masjid_db?schema=public"

   # Authentication
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   # Storage (Optional - defaults to 'local')
   STORAGE_PROVIDER="local" # Options: local, s3, r2
   # If using S3/R2:
   # AWS_ACCESS_KEY_ID=""
   # AWS_SECRET_ACCESS_KEY=""
   # AWS_REGION=""
   # AWS_BUCKET_NAME=""
   # AWS_ENDPOINT=""
   ```

4. Database Setup:
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Push schema to database
   npx prisma db push

   # (Optional) Seed the database with initial data
   npm run seed
   ```

### Running the Project

```bash
# Development mode
npm run dev

# Production build
npm run build

# Start production server
npm run start
```

---

## System Architecture

The project follows the Next.js App Router architecture:

- `src/app`: Routes, pages, and API handlers.
- `src/components`: Reusable UI components (Radix UI based).
- `src/lib`: Utility functions, Prisma client, and shared logic.
- `src/hooks`: Custom React hooks (SWR, Zustand).
- `src/services`: Business logic and data access layer.
- `prisma/`: Database schema and migrations.
- `public/`: Static assets and PWA icons.

---

## Maintenance

The project uses **Biome** for lightning-fast linting and formatting.

```bash
# Check for linting errors
npm run lint

# Automatically format code
npm run format
```

---

## License

Developed By [Inzeedo (PVT) Ltd.](https://inzeedo.com)
All Rights Reserved © 2025
