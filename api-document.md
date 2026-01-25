# Masjidh Accounting Solution - API Documentation

This document provides details about the available API endpoints in the Masjidh Accounting Solution. All APIs follow RESTful principles and return JSON responses.

## Authentication
NextAuth.js is used for authentication. Most system routes require an active session.

- **URL:** `/api/auth/[...nextauth]`
- **Methods:** `GET`, `POST`
- **Description:** Handles sign-in, sign-out, and session management.

---

## Dashboard
Provides summarized statistics and recent activities for the dashboard.

### Get Dashboard Data
- **URL:** `/api/dashboard`
- **Method:** `GET`
- **Response Example:**
  ```json
  {
    "stats": [
      { "title": "Total Income", "value": "Rs. 1,250,000", "change": "+5.2%", "trend": "up", "iconName": "Wallet" },
      ...
    ],
    "activities": [
      { "id": "don-1", "type": "Donation", "title": "Donation from Ahmed", "amount": "+ Rs. 5,000", "date": "2025-03-01T10:00:00Z" },
      ...
    ],
    "chartData": [
      { "name": "Jan", "Income": 45000, "Expense": 32000 },
      ...
    ]
  }
  ```

---

## Members
Manage masjid members and their membership ("Sanda") details.

### Get All Members
- **URL:** `/api/members`
- **Method:** `GET`
- **Response:** Array of Member objects.

### Create Member
- **URL:** `/api/members`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "name": "Member Name",
    "contact": "0771234567",
    "address": "123 Street, City",
    "email": "member@example.com",
    "payment_frequency": "Monthly",
    "amount_per_cycle": 500,
    "start_date": "2025-01-01",
    "memberNo": "MEM-001" (Optional if Auto-ID is enabled)
  }
  ```

### Get Member Statement
- **URL:** `/api/members/[id]/statement`
- **Method:** `GET`
- **Description:** Retrieves the payment history and balance for a specific member.

---

## Accounting

### Expenses
#### Get Expenses
- **URL:** `/api/accounting/expenses`
- **Method:** `GET`
- **Query Params:** `category` (optional), `search` (optional)

#### Create Expense
- **URL:** `/api/accounting/expenses`
- **Method:** `POST`
- **Payload:** `FormData` (supports file uploads)
  - `amount`: Number
  - `date`: Date String
  - `categoryId`: String
  - `description`: String
  - `payee`: String
  - `bankAccountId`: String (Optional)
  - `file`: File (Optional Receipt Image)

### Income (Other Income)
#### Create Income
- **URL:** `/api/accounting/income`
- **Method:** `POST`
- **Payload:** Similar to Expense (supports bank account integration).

### Bank Accounts
#### Get All Accounts
- **URL:** `/api/accounting/bank-accounts`
- **Method:** `GET`

#### Create Bank Account
- **URL:** `/api/accounting/bank-accounts`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "bankName": "Bank Name",
    "accountName": "Main Account",
    "accountNumber": "123456789",
    "branch": "Colombo",
    "type": "Savings",
    "balance": 10000,
    "color": "blue"
  }
  ```

### Ledger
#### Get Ledger Entries
- **URL:** `/api/accounting/ledger`
- **Method:** `GET`
- **Description:** Returns a unified view of all transactions across all accounts.

---

## Billing & Sanda

### Get Invoices
- **URL:** `/api/billing/invoices`
- **Method:** `GET`
- **Query Params:** `period` (e.g., 2025-03), `status` (all, pending, paid)

### Record Payment
- **URL:** `/api/sanda/pay`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "invoiceId": "inv_id",
    "amount": 500,
    "method": "Cash",
    "bankAccountId": "bank_id", (If method is Bank Transfer)
    "date": "2025-03-01"
  }
  ```

---

## Donations

### Get All Donations
- **URL:** `/api/donations`
- **Method:** `GET`

### Record Donation
- **URL:** `/api/donations`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "amount": 1000,
    "purpose": "Mosque Construction",
    "paymentMethod": "Cash",
    "donorType": "guest", (member or guest)
    "donorName": "Donor Name",
    "isAnonymous": false,
    "bankAccountId": "account_id"
  }
  ```

---

## Reports
Detailed data export for financial and member analysis.

- **Financial Report:** `/api/reports/financial` (GET)
- **Sanda Report:** `/api/reports/sanda` (GET)

---

## System & Admin

### Audit Logs
- **URL:** `/api/audit-logs`
- **Method:** `GET`
- **Description:** Fetches all tracked actions performed in the system.

### App Settings
- **URL:** `/api/settings/app`
- **Method:** `GET`, `PUT`
- **Description:** Manage Mosque profile, member ID formats, and financial configurations.

### System Status
- **URL:** `/api/system/status`
- **Method:** `GET`
- **Description:** Checks database connectivity and system environment info.
