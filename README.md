# Invoicify - SaaS Invoicing App

Invoicify is a modern, full-stack Software-as-a-Service (SaaS) invoicing application. It enables businesses to manage customers, track inventory items, generate professional PDF invoices, and monitor their financial health through an intuitive dashboard.

The application is built with a multi-tenant architecture, ensuring data isolation per organization and supporting Role-Based Access Control (RBAC) to differentiate between Admin and Staff capabilities.

## 🚀 Features

### Core Functionality
- **Dashboard & Analytics:** View quick statistics, revenue charts, and recent invoice activity.
- **Customer Management:** Maintain a directory of clients with their contact and billing information.
- **Item/Product Management:** Keep a catalog of frequently billed products or services to speed up invoice creation.
- **Invoice Generation:** Create detailed invoices, calculate taxes and totals automatically, and track statuses (Draft, Sent, Paid, Overdue).
- **Quotations:** Create estimates/quotes for customers, export as PDFs, and allow tracking statuses.
- **PDF Export:** Instantly generate and download professional PDF versions of your invoices and quotes.

### Security & Architecture
- **JWT Authentication:** Secure login and registration using HTTP-only, secure cookies to prevent XSS attacks.
- **Multi-Tenancy (Organization Isolation):** Data is strictly isolated. Users only ever see customers, items, and invoices belonging to their specific organization.
- **Role-Based Access Control (RBAC):**
  - **Admins:** Have full access to manage the organization, invite/deactivate staff, view reports, and modify organization settings.
  - **Staff:** Can manage day-to-day operations like customers, items, and invoices, but cannot access administrative settings or user management.
- **Account Status Validation:** Deactivated staff members immediately lose access to the system via global middleware checks.

## 🛠️ Technology Stack

**Frontend:**
- [Next.js](https://nextjs.org/) (App Router)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) for robust form validation
- [Recharts](https://recharts.org/) for dashboard analytics
- [@react-pdf/renderer](https://react-pdf.org/) for client-side PDF generation
- Axios for API communication

**Backend:**
- [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- [Prisma ORM](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/) (Hosted on Neon)
- JSON Web Tokens (JWT) & bcrypt for secure authentication
- Cookie-parser for managing HTTP-only auth cookies

---

## 💻 Local Development Setup

To run this project locally, you will need Node.js installed and a PostgreSQL database (like Neon, Supabase, or a local instance).

### 1. Clone the repository

```bash
git clone https://github.com/kritgarg/Invoicify.git
cd Invoicify
```

### 2. Backend Setup

Navigate to the server directory:
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and add the following variables:
```env
PORT=8080
DATABASE_URL="postgresql://user:password@localhost:5432/invoicify?sslmode=require" # Replace with your Postgres URL
FRONTEND_URL="http://localhost:3000"
ACCESS_TOKEN_SECRET="generate_a_very_secure_random_string_here"
JWT_EXPIRES_IN="7d"
```

Push the database schema and start the backend development server:
```bash
npx prisma db push
npm run dev
```
*The backend will be running at `http://localhost:8080`*

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:
```env

NEXT_PUBLIC_API_URL="http://localhost:8080/api"
```

Start the frontend development server:
```bash
npm run dev
```
*The frontend will be running at `http://localhost:3000`*

### 4. Create your account

1. Open your browser and go to `http://localhost:3000/register`.
2. Create your first account. This will automatically generate a new Organization and set you as the `admin`.
3. You can now invite other staff members from the "User Management" tab in the dashboard!
