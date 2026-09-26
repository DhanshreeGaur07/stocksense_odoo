# 📦 StockSense — Inventory & Warehouse Management System

> A modern, full-stack inventory and warehouse management application inspired by enterprise ERP workflows, designed to simplify stock tracking, warehouse operations, product management, and inventory movement monitoring.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react\&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite\&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss\&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase\&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

---

## 📌 Overview

**StockSense** is a web-based inventory and warehouse management system built to provide a centralized interface for managing products, stock quantities, warehouse operations, and stock movements.

The application follows an ERP-style workflow where inventory operations can be created, tracked, validated, and monitored through a unified dashboard.

It provides dedicated workflows for:

* 📊 Inventory overview
* 📥 Incoming stock receipts
* 📤 Outgoing deliveries
* 🔄 Internal stock transfers
* 📦 Product and SKU management
* 📉 Low-stock monitoring
* 🧾 Stock movement history
* 📋 List and Kanban operation views
* 🔐 User authentication
* ⚙️ Application settings

---

## ✨ Key Features

### 📊 Inventory Dashboard

The dashboard provides a real-time overview of warehouse activity, including:

* Receipts waiting to be processed
* Late receipts
* Pending deliveries
* Late deliveries
* Waiting deliveries
* Products currently in stock
* Low/out-of-stock products
* Scheduled internal transfers

This gives users a centralized operational view without manually checking individual records.

---

### 📦 Product & Stock Management

Manage the product catalog and monitor inventory levels from a dedicated interface.

Each product can contain:

* Product name
* SKU / product code
* Category
* Unit of measurement
* Per-unit cost
* Minimum reorder quantity

The stock interface also provides:

* On-hand quantity
* Free-to-use quantity
* Warehouse/location information
* Low-stock indicators
* Search by product name or SKU
* Manual stock adjustment

---

### 📥 Receipts

Receipts represent incoming inventory.

Users can create and track incoming stock operations with information such as:

* Reference
* Contact/vendor
* Scheduled date
* Source location
* Destination location
* Products
* Quantities
* Responsible user
* Operation status

---

### 📤 Deliveries

The delivery workflow manages outgoing inventory.

The system tracks:

* Customer/contact
* Source warehouse
* Destination location
* Products
* Quantities
* Scheduled delivery date
* Responsible user
* Current operation status

---

### 🔄 Internal Transfers

Stock can be moved between warehouse locations through internal transfer operations.

This allows the system to model warehouse movements while maintaining a record of inventory changes.

---

### 📋 List & Kanban Views

Operations can be viewed using two different interfaces:

**List View**

* Detailed tabular representation
* Searchable records
* Status information
* Dates and locations
* Contacts and references

**Kanban View**

* Operations grouped by status
* Draft
* Waiting
* Ready
* Done
* Canceled

This provides both operational and visual ways to monitor warehouse workflows.

---

### 🧾 Move History

StockSense maintains a historical record of inventory movements.

The move history includes:

* Operation reference
* Date
* Product
* Contact
* Source location
* Destination location
* Quantity movement
* Movement direction
* Operation status

Users can search and filter historical movements to trace inventory activity.

---

### 🔐 Authentication

Authentication is implemented using **Supabase Auth**.

Supported functionality includes:

* User registration
* Email/password login
* Session management
* Protected application routes
* User profiles
* Logout
* Role/profile information

Unauthenticated users are redirected to the login page, while authenticated users can access the application dashboard and protected modules.

---

## 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │      User / Staff    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   React Frontend     │
                         │   TypeScript + Vite  │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │   React Router       │
                         │ Protected Routes     │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │ Supabase Client      │
                         │ Auth + Database      │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  │                                   │
          ┌───────▼────────┐                 ┌────────▼────────┐
          │ Supabase Auth  │                 │ PostgreSQL DB   │
          │                │                 │                 │
          │ Users/Sessions │                 │ Products        │
          │ Profiles       │                 │ Stock           │
          └────────────────┘                 │ Operations      │
                                             │ Locations       │
                                             │ Move History    │
                                             └─────────────────┘
```

---

## 🛠️ Technology Stack

| Layer           | Technology              |
| --------------- | ----------------------- |
| Frontend        | React 18                |
| Language        | TypeScript              |
| Build Tool      | Vite                    |
| Routing         | React Router            |
| Styling         | Tailwind CSS            |
| Backend / BaaS  | Supabase                |
| Database        | PostgreSQL via Supabase |
| Authentication  | Supabase Auth           |
| Icons           | Lucide React            |
| Code Quality    | ESLint                  |
| Package Manager | npm                     |

The repository's package configuration confirms React, TypeScript, Vite, Tailwind CSS, React Router, Supabase JS, and Lucide React as the primary application dependencies.

---

## 📁 Project Structure

```text
stocksense_odoo/
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── Layout.tsx
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── auth.tsx
│   │   ├── supabase.ts
│   │   ├── types.ts
│   │   └── ...
│   │
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── SignUp.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Products.tsx
│   │   ├── OperationsList.tsx
│   │   ├── OperationDetail.tsx
│   │   ├── MoveHistory.tsx
│   │   └── Settings.tsx
│   │
│   └── App.tsx
│
├── supabase/
│   └── migrations/
│
├── .env.example
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🔄 Application Workflow

```text
                    ┌─────────────┐
                    │    Login    │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Dashboard  │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     ┌─────────┐      ┌──────────┐    ┌────────────┐
     │Products │      │Operations│    │Move History│
     └────┬────┘      └─────┬────┘    └────────────┘
          │                 │
          │        ┌────────┼────────┐
          │        │        │        │
          │        ▼        ▼        ▼
          │     Receipts Deliveries Transfers
          │        │        │        │
          └────────┴────────┴────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Stock Moves │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Move History│
                    └─────────────┘
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/DhanshreeGaur07/stocksense_odoo.git
cd stocksense_odoo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The repository includes an `.env.example` file with the expected Supabase configuration variables.

> **Important:** Never commit your real `.env` file or private credentials to GitHub.

---

### 4. Configure Supabase

Create a Supabase project and configure:

* Authentication
* PostgreSQL database
* Required database tables
* Database functions/RPCs
* Views used by the application
* Supabase migrations

The application uses Supabase for authentication and persistent inventory data.

---

### 5. Start the development server

```bash
npm run dev
```

The application will be available at the local Vite development URL shown in your terminal.

---

## 📜 Available Scripts

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start development server     |
| `npm run build`     | Create production build      |
| `npm run preview`   | Preview production build     |
| `npm run lint`      | Run ESLint                   |
| `npm run typecheck` | Run TypeScript type checking |

---

## 🗃️ Core Data Model

The application is structured around several core entities:

```text
User
 │
 └── Profile
       │
       └── Operations
             │
             ├── Receipt
             ├── Delivery
             └── Internal Transfer
                    │
                    └── Operation Lines
                           │
                           └── Products
                                  │
                                  └── Stock
                                         │
                                         └── Locations
```

The system also exposes inventory-oriented database views/functions for calculating stock information and applying stock updates.

---

## 🔐 Security

StockSense uses Supabase authentication and protected frontend routes.

Key security considerations include:

* Authenticated access to application modules
* Supabase session management
* Environment-based configuration
* No credentials committed to source control
* Database-side access control through Supabase policies
* Separation between public authentication pages and protected application routes

For production deployment, ensure that appropriate **Row Level Security (RLS)** policies are configured in Supabase.

---

## 🎨 UI & UX

StockSense uses a modern dark enterprise-style interface with:

* Responsive layouts
* Dashboard cards
* Interactive tables
* Search and filtering
* Modal-based forms
* Status badges
* Kanban boards
* Loading states
* Empty states
* Animated transitions
* Responsive navigation
* User profile menu

The interface is designed around operational visibility rather than simply presenting raw database records.

---

## 🧪 Validation & Quality Checks

Before deploying the application, run:

```bash
npm run lint
```

and:

```bash
npm run typecheck
```

Then generate a production build:

```bash
npm run build
```

---

## 🌐 Deployment

The frontend can be deployed to modern static/SPA hosting platforms such as:

* Vercel
* Netlify
* Cloudflare Pages
* Any static hosting environment supporting SPA routing

The Supabase project remains responsible for:

* Authentication
* PostgreSQL database
* Database functions
* Data persistence
* Backend services

When deploying, configure the production environment variables:

```env
VITE_SUPABASE_URL=your-production-project-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

---

## 🔮 Future Enhancements

Potential future improvements include:

* 📊 Advanced inventory analytics
* 📈 Inventory forecasting
* 🔔 Low-stock notifications
* 📧 Email notifications
* 🏢 Multi-warehouse management
* 👥 Granular role-based permissions
* 📱 Mobile/PWA support
* 📄 PDF inventory reports
* 📊 Export to CSV/Excel
* 🔎 Advanced inventory filtering
* 📦 Barcode/QR-code scanning
* 🔄 Real-time inventory updates
* 📋 Purchase order management
* 🚚 Supplier and customer management
* 📊 Advanced warehouse performance dashboards
* 🧠 AI-assisted demand forecasting

---

## 💡 Why StockSense?

Traditional inventory workflows can become difficult to manage when stock quantities, incoming shipments, outgoing deliveries, and internal movements are handled separately.

StockSense brings these workflows together into a single application:

```text
Products
   ↓
Inventory
   ↓
Warehouse Operations
   ↓
Stock Movements
   ↓
Historical Tracking
   ↓
Operational Dashboard
```

This creates a centralized workflow for understanding **what is in stock, what is moving, what needs attention, and what has already happened**.

---

## 📸 Screenshots

Add screenshots of the following pages to make the repository more portfolio-ready:

```text
docs/
├── dashboard.png
├── products.png
├── operations.png
├── kanban.png
├── move-history.png
├── login.png
└── settings.png
```

Recommended README section:

```markdown
## 📸 Screenshots

### Dashboard
![Dashboard](docs/dashboard.png)

### Products & Stock
![Products](docs/products.png)

### Warehouse Operations
![Operations](docs/operations.png)

### Move History
![Move History](docs/move-history.png)
```

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/your-feature
```

3. Make your changes
4. Run validation

```bash
npm run lint
npm run typecheck
npm run build
```

5. Commit your changes

```bash
git commit -m "feat: add your feature"
```

6. Push the branch

```bash
git push origin feature/your-feature
```

7. Open a Pull Request

---


> **StockSense — Simplifying inventory visibility, warehouse operations, and stock movement management.**
