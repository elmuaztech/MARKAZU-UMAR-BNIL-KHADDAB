# Markazu Umar bn Al-Khattab School Management System (MSSMS)
## System Overview, Architectural Blueprint, Operating Workflow & Commercial Valuation

---

### Executive Overview
* **Institution:** Markazu Umar bn Al-Khattab Centre for Qur'an Memorization & Islamic Studies (Daneji, Kano State, Nigeria)
* **Production URL:** [https://mubkdaneji.com](https://mubkdaneji.com)
* **Infrastructure:** Hostinger Ubuntu 22.04 LTS VPS (`82.29.168.139`)
* **Core Technology:** Unified Next.js 14 App Router, PostgreSQL 16, Prisma ORM 5, Docker, Nginx SSL Reverse Proxy, GitHub Actions CI/CD.

---

## 1. How the Software Was Created

The Markazu Umar School Management System (MSSMS) was custom-architected as an enterprise-grade, bilingual (English & Arabic) school management platform.

### Modern Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router) + React 18 | High-performance server-side rendering (SSR), static generation, and interactive client portals. |
| **Language** | TypeScript | Static typing across all models, APIs, and client components to prevent runtime errors. |
| **Styling & Design System** | Tailwind CSS + Framer Motion + Lucide Icons | Custom glassmorphism aesthetic, responsive Islamic-inspired branding, fluid micro-interactions, dark/light theme switching. |
| **Database & ORM** | PostgreSQL 16 + Prisma ORM 5 | Relational database schema serving as the **single source of truth** for all records. Fully normalized with foreign key constraints. |
| **Authentication & Security** | Custom Dual-Layer RBAC + Bcrypt/Argon2 | Case-insensitive lookup, brute-force rate-limiting, temporary password first-login enforcement, 4-digit OTP password reset. |
| **Email Service** | Nodemailer + Custom Responsive HTML | Automated email notification engine with **dual-port fallback** (Port 465 Direct SSL with automatic failover to Port 587 STARTTLS). |
| **Containerization** | Docker + Docker Compose | Multi-stage production container (`node:20-alpine`) ensuring identical execution across development and VPS environments. |
| **Reverse Proxy & SSL** | Nginx + Let's Encrypt | Automated HTTPS SSL certificates with HTTP-to-HTTPS redirect, HSTS, and port isolation. |
| **Continuous Integration (CI/CD)** | GitHub Actions (`deploy.yml`) | Automated continuous deployment pipeline that automatically connects via SSH to the VPS, pulls code, rebuilds containers, and pushes database migrations whenever code is pushed to GitHub `main`. |

---

## 2. How the Software Works (Operational Workflow)

The software coordinates school activities across **5 distinct user roles** with dedicated portals and role-based access control (RBAC):

### A. Core Modules & Features

1. **Public Information & Admissions Portal (`/` & `/enroll`)**:
   * Interactive public website detailing school history, curriculum, academic calendar, and admission requirements.
   * Online admission application form allowing parents to apply and submit student details directly into the school's review queue.

2. **Director / Administrator Dashboard (`/dashboard`)**:
   * Complete institutional management: user accounts, student enrollments, class creation, curriculum management, and teacher assignments.
   * System health monitoring, audit trail logs (tracking all logins, grade modifications, and administrative approvals), and database backups.

3. **Headmaster / Principal Portal (`/headmaster`)**:
   * Academic oversight: approval and verification of continuous assessment scores and term exam grades before release to parents.
   * Teacher workload monitoring and curriculum compliance tracking.

4. **Teacher Management & Grading Grid (`/dashboard/teachers`, `/dashboard/assessment`)**:
   * Rapid spreadsheet-style Result Entry Grid for CA1, CA2, CA3, and Exam scores.
   * Real-time grade calculation, positioning, remark generation, and one-click submission for administrative approval.
   * Daily Attendance Register with morning/afternoon tracking and absence rate alerts.

5. **Tahfizul Qur'an Memorization Tracker (`/dashboard/tahfiz`)**:
   * Specialized module designed specifically for Quran memorization centers.
   * Tracks individual student progress by Surah, Ayah range, and Juz level.
   * Records memorization status: New Memorization (*Hifz*), Daily Revision (*Sabqi*), and Long-term Revision (*Muraja'ah*).
   * Generates Tajweed accuracy scores and visual progress charts.

6. **Parent & Student Portal (`/login`)**:
   * Secure credential-based access for parents to track their children's real-time attendance, Tahfiz progress, and academic grades.
   * Generates and downloads official school report cards in printable/PDF format with school watermark and verification stamps.

7. **Communication & Notification System (`/dashboard/communication`)**:
   * School-wide announcement broadcasts.
   * Automated email dispatch for:
     * New account welcome emails with auto-generated temporary credentials.
     * 4-digit OTP password recovery verification codes.
     * Password change security confirmations.
     * Direct WhatsApp messaging integration with pre-filled parent templates.

---

## 3. Commercial Valuation & Cost Breakdown

Developing an institutional software system of this scale with custom Tahfiz workflows, multi-role RBAC, real-time database sync, and containerized cloud deployment represents significant engineering investment.

### A. Professional Development Valuation (Industry Standards)

| Development Phase | Description & Deliverables | Est. Market Cost (USD) | Est. Market Cost (NGN) |
| :--- | :--- | :---: | :---: |
| **Phase 1: Architecture, UI/UX & System Design** | Information architecture, bilingual responsive design, database entity-relationship modeling (ERD), design tokens. | $2,500 – $3,500 | ₦4,000,000 – ₦5,600,000 |
| **Phase 2: Full-Stack Engineering & Custom Modules** | Next.js 14 frontend, 5 dedicated portals (Admin, Headmaster, Teacher, Parent, Student), Result Computation Engine, Tahfiz Tracker. | $7,000 – $10,500 | ₦11,200,000 – ₦16,800,000 |
| **Phase 3: Database & Email Engine** | PostgreSQL schema, Prisma ORM migrations, dual-port SMTP failover engine, transactional responsive email templates. | $2,000 – $3,000 | ₦3,200,000 – ₦4,800,000 |
| **Phase 4: Cloud Infrastructure, DevOps & CI/CD** | Multi-stage Docker containers, Hostinger Ubuntu VPS configuration, Nginx reverse proxy, Let's Encrypt SSL, GitHub Actions auto-deploy. | $1,500 – $2,500 | ₦2,400,000 – ₦4,000,000 |
| **Phase 5: Quality Assurance, Security & Performance** | Penetration testing, brute-force protection, responsive cross-browser/cross-device audit, Core Web Vitals optimization. | $1,000 – $1,500 | ₦1,600,000 – ₦2,400,000 |
| **TOTAL COMMERCIAL VALUATION** | **Turnkey Enterprise School Management System** | **$14,000 – $21,000 USD** | **₦22,400,000 – ₦33,600,000 NGN** |

---

### B. Ongoing Operational & Hosting Costs (Annual Recurring)

| Service | Provider / Type | Annual Cost (USD) | Annual Cost (NGN) |
| :--- | :--- | :---: | :---: |
| **Virtual Private Server (VPS)** | Hostinger Cloud VPS (Ubuntu 22.04 LTS) | ~$80 – $120 / year | ~₦130,000 – ₦190,000 / year |
| **Domain Registration** | `mubkdaneji.com` (.com TLD) | ~$15 – $20 / year | ~₦24,000 – ₦32,000 / year |
| **SSL Security Certificate** | Let's Encrypt Authority | **FREE** (Auto-renewing) | **FREE** |
| **Database Engine** | Self-hosted PostgreSQL inside Docker on VPS | **FREE** (No managed DB fees) | **FREE** |
| **Email SMTP Service** | Google Workspace / Gmail App Engine | **FREE** (Under Google Tier) | **FREE** |
| **Maintenance & Support (Optional)** | Routine updates, security patches, data backups | ~$1,200 – $2,400 / year | ~₦1,900,000 – ₦3,800,000 / year |

---

### Summary
The Markazu Umar School Management System is a comprehensive, production-ready institutional platform that replaces manual paperwork, disjointed spreadsheets, and fragmented record-keeping with a unified, high-security cloud system that operates seamlessly across all modern devices.
