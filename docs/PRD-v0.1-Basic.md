# HomeSeva: The Centralized System for 10 Businesses

*Product Requirements Document (Basic) · Draft v0.2 · 29 October 2026*

## 1. Overview

HomeSeva is a single ERP, the centralized system for a company group that runs 10 different businesses with about 500 employees. The businesses are very different from each other (for example a product business, a hair wig business and a construction business), so the platform gives every business its own workspace with its own modules and data, while the Super Admin and the Owners get group-level views across businesses.

**Goals**

- Manage all 10 businesses, all employees and all owners from one system
- Strict role-based access: every person sees only what their role and business allow
- An owner of several businesses sees one combined dashboard with the monthly profit and sales of all their businesses
- Load only what is needed: opening one business never loads data from the others
- Add a new business or module later without rebuilding the system

**Out of scope for v1 (assumed)**

- Customer-facing websites or online stores
- Statutory filings (GST returns, PF/ESI filing); the ERP only keeps the data ready
- Replacing a full accounting package such as Tally

## 2. Home Page and Sign-In Flow

HomeSeva opens on a public home page. A person picks a business, signs in with that business’s Role ID and password, and sees only the tabs the Super Admin assigned to them.

**Home page layout**

The heading reads “Welcome to HomeSeva, the centralized system”. Below it, the 10 businesses show as cards, 5 in a row, in 2 rows:

| Business 1 | Business 2 | Business 3 | Business 4 | Business 5 |
| --- | --- | --- | --- | --- |
| Business 6 | Business 7 | Business 8 | Business 9 | Business 10 |

- Each card shows the business name and logo, set by the Super Admin.
- On tablets and phones the cards wrap to fewer per row.
- The home page is public and shows no business data.

**Sign-in flow**

1. The person opens HomeSeva and sees the 10 business cards.
2. They select their business.
3. The sign-in screen for that business opens and asks for Role ID and password.
4. The server checks the credentials and that the Role ID belongs to the selected business.
5. After a successful sign-in the person lands in that business and sees only the tabs the Super Admin assigned to them.

**Authentication requirements**

- AUTH-1: Role IDs and passwords are created by the Super Admin only. Nobody can register themselves.
- AUTH-2: A Role ID works only for the business it was created for. A valid sign-in for one business never opens another.
- AUTH-3: Passwords are stored hashed (argon2 or bcrypt), never in plain text, and the first password must be changed at first sign-in.
- AUTH-4: Sessions use secure, HttpOnly cookies, end after a period of inactivity, and the Super Admin can end any session.
- AUTH-5: Failed sign-ins are rate limited and lock the account after repeated failures. Every attempt is written to the audit log.
- AUTH-6: Two-factor authentication is mandatory for the Super Admin and Owners.
- AUTH-7: The server checks the session, the business and the tab permission on every request; hiding a tab on screen is never the only protection.

**Tabs and the Super Admin**

- The Super Admin assigns tabs to each user or role. A tab can be a module screen, a report or an embedded Google Sheet (section 6.7).
- Users see only their assigned tabs; unassigned tabs are hidden and blocked on the server.
- There is exactly one Super Admin account, held by one person only. No other user can be given Super Admin rights.
- The Super Admin signs in from a separate link on the home page and can open any business without a second sign-in (to be confirmed).
- All data is stored in PostgreSQL (section 8).

**To confirm**

- Does an owner of several businesses use one Role ID for all of them (needed for the combined dashboard), or sign in to each business separately?

## 3. Assumptions

These are working assumptions until the open questions in section 13 are answered.

- Web application first (mobile-responsive); a native mobile app comes later
- English interface first; Hindi and Marathi later
- One company group, about 500 users, 10 businesses, amounts in INR
- Every employee belongs to one primary business; the Super Admin can give access to more
- Built for the group’s own use (a single organization, not sold to many companies)
- No data migration in v1 except CSV import

## 4. Users and Roles

| Role | Who | What they can see and do |
| --- | --- | --- |
| Super Admin | The one and only Super Admin account (one person) | Everything in all businesses. The only role that adds, edits or removes employees, creates businesses, assigns owners and roles, and decides which tabs each user sees. |
| Owner | Owner of one or more businesses (there can be several owners) | Full view of their own businesses and a combined dashboard for them. Nothing from businesses they do not own. |
| Business Head | Head or GM of one business | Everything inside that one business, as allowed by the Super Admin. |
| Department Manager | Manager of a team or department | Manages their own team and gives approvals. Nothing beyond that: no finance, profit, salary or settings access. |
| Functional roles | HR, Accountant, Site Engineer, Store Staff and so on (defined per business) | Only the modules and actions given to the role. |
| Employee | Any staff member | Own profile, attendance, leaves, payslips and assigned tasks. |

The Super Admin can create custom roles from a screen, with no developer needed.

## 5. Core Concept: Business Workspaces

The system has two layers.

1. **Platform core (shared by everyone):** login, users, roles and permissions, business registry, employee master, approvals, notifications, file storage, audit log and the group dashboard.
2. **Business modules (switched on per business):** each business only gets the modules it needs, so a wig business never sees construction screens.

**Shared modules (any business can enable)**

| Module | Purpose |
| --- | --- |
| Employees and Attendance | Staff records, daily attendance |
| Leaves and Approvals | Leave requests and approvals |
| Finance Basics | Income, expenses, invoices, monthly closing |
| Payroll (optional) | Salary calculation and payslips |
| Tasks | Assign and track work |
| Documents | Store contracts, bills, IDs |
| Reports | Business-wise reports and exports |

**Business-specific modules (initial ideas, to be confirmed with each business)**

| Business type | Example modules |
| --- | --- |
| Product business | Inventory and stock, purchase, vendors, orders and billing |
| Hair wig business | Wig catalogue, custom orders, customer measurements, appointments |
| Construction business | Projects and sites, material and BOQ, labour attendance, subcontractors, milestone billing |
| Other 7 businesses | To be defined |

## 6. Functional Requirements

### 6.1 Platform core

- FR-1: The Super Admin creates businesses and switches modules on or off for each one.
- FR-2: Only the Super Admin adds, edits and deactivates employees and assigns roles. Others can only raise a request.
- FR-3: Each business can have one or more owners, and one owner can own many businesses.
- FR-4: Permissions are defined as module and action (for example finance.view, employee.create) and grouped into roles.
- FR-5: Access is limited by scope: group, business, department, team or own records.
- FR-6: Field-level visibility: sensitive fields such as salary are hidden unless the role allows them.
- FR-7: Every view, change and export of sensitive data is written to an audit log.
- FR-8: Records are never hard-deleted; they are archived (soft delete).
- FR-9: Two-factor login is mandatory for the Super Admin and Owners; sessions time out; password reset is available.

### 6.2 Group dashboard (Owner and Super Admin)

- FR-10: An owner of several businesses sees one dashboard that combines only their own businesses.
- FR-11: For a selected month it shows total sales, total expenses and net profit, with a business-wise breakdown.
- FR-12: It compares with the previous month and shows a 12-month trend chart.
- FR-13: Salary cost per month can be shown as a separate line (to be confirmed).
- FR-14: The owner can filter by business and click through to that business’s own dashboard.
- FR-15: An owner of a single business sees only that business.
- FR-16: The Super Admin sees the same view for all 10 businesses, plus employee count and pending approvals.
- FR-17: Dashboard numbers must match the underlying business records.

### 6.3 Business workspace

- FR-18: Every business has its own dashboard that shows only its enabled modules.
- FR-19: A user sees only the modules and actions their role allows in that business.
- FR-20: Businesses can have their own forms and custom fields without changing the core system.

### 6.4 Employees and HR basics

- FR-21: Employee master with business, department, role, reporting manager and status.
- FR-22: Attendance and leave with manager approval.
- FR-23: Employees can view only their own payslips and records.

### 6.5 Finance basics

- FR-24: Each business records income and expenses with categories and attachments.
- FR-25: Invoices per business, with GST-ready fields (to be confirmed).
- FR-26: Month-end closing locks the month so reported profit does not change silently.

### 6.6 Approvals and notifications

- FR-27: Only managers give approvals for leave, expenses, purchases and other team requests; no other role can approve. New employee requests go to the Super Admin.
- FR-28: In-app notifications for pending approvals; email or WhatsApp later.

### 6.7 Google Sheets inside HomeSeva

Teams can keep working in Google Sheets while HomeSeva controls who sees which sheet.

- FR-29: The Super Admin can add a Google Sheet link to a business and assign it as a tab. It opens inside HomeSeva in an embedded frame (iframe), so the user never leaves the software.
- FR-30: Each sheet belongs to one business and is shown only to the users or roles the Super Admin assigns to that tab.
- FR-31: The Super Admin can add, rename, replace or remove a sheet tab without any code change.
- FR-32: Embedding depends on Google, so it must be tested early with the real sheets and the sharing settings you plan to use.

**Access caveat:** HomeSeva decides who sees the tab, but Google decides who can open or edit the sheet. A sheet shared as “anyone with the link” can be opened by anyone who has its URL, outside HomeSeva too. For private sheets, users need a Google account with access.

**To confirm**

- Which sheets go in first, and should users be able to edit them or only view them?

## 7. Initial Access Matrix

| Area | Super Admin | Owner | Business Head | Dept Manager | Employee |
| --- | --- | --- | --- | --- | --- |
| Add or remove employees, assign roles | Yes (only) | Request only | No | No | No |
| Finance and profit | All businesses | Own businesses | Own business | No | No |
| Salary and payroll | All | Summary of own businesses | No | No | Own payslip |
| Attendance and leaves | All | View | Own business | Own team | Own |
| Give approvals (leave, expenses, purchases) | View only | View only | View only | Yes, own team (the only approving role) | Raise own requests |
| Business-specific modules | All | Own businesses | Own business | As assigned | As assigned |
| Group dashboard | All 10 businesses | Own businesses | Own business | No | No |
| Settings and audit log | Yes (only) | No | No | No | No |

## 8. Data Approach

- One PostgreSQL database for the whole group. Every record carries a business ID.
- Shared tables for common data (employees, roles, finance entries).
- Separate tables for each business module (for example construction projects, wig orders), so the different businesses do not crowd one another’s data.
- A small set of flexible custom fields for minor differences between businesses.
- Row Level Security in the database as a safety net, so a bug can never show one business’s data to another.
- A monthly summary table (business, month, sales, expenses, profit, salary cost) is updated whenever a transaction is posted and re-checked every night. The group dashboard reads this table.

**Core tables:** businesses, users (Role ID, password hash, business), roles, tabs, user\_tab\_access, sheet\_links, sessions and audit\_log.

## 9. Performance: Load Only What Is Needed

- PF-1: After login the app loads only the user’s shell and the list of businesses they may open.
- PF-2: Each business workspace and each module is a separate piece of code loaded only when first opened (lazy loading).
- PF-3: Every API call carries a business ID and is checked against the user’s scope. No endpoint returns data across businesses, except the summary endpoints for dashboards.
- PF-4: The group dashboard reads pre-calculated monthly summaries, never the raw transactions of all businesses.
- PF-5: Lists use server-side pagination, search and filters. Heavy reports run in the background and are delivered when ready.
- PF-6: Permissions and summaries are cached in Redis and refreshed when they change.
- Targets (to be validated): app shell under 2 seconds, dashboard under 2 seconds, list pages under 1 second, with about 100 users online at once.

## 10. Non-Functional Requirements

- **Security:** encrypted connections, hashed passwords, 2FA for powerful roles, least-privilege defaults
- **Backup:** automatic daily database backups with a tested restore
- **Auditability:** complete audit trail of sensitive actions
- **Usability:** responsive on phone, tablet and desktop; simple screens for non-technical staff
- **Scalability:** comfortable with 500 users and 10 businesses, able to add more businesses later
- **Data export:** Excel/CSV export, controlled by permissions

## 11. Proposed Tech Stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, TypeScript, NestJS (modular) |
| Database | PostgreSQL with Prisma |
| Permissions | CASL (shared rules for backend and frontend) |
| Auth | Auth.js or Better Auth with 2FA |
| Cache | Redis |
| Files | S3-compatible storage |
| Hosting | Docker on a VPS with Nginx, daily backups |

## 12. Roadmap

| Phase | Focus | Outcome |
| --- | --- | --- |
| 1. Foundation | Home page, business selection, sign-in (Role ID and password), employees, roles, tab assignment, audit log | Super Admin can create businesses and add employees; access rules work |
| 2. Money and dashboard | Finance basics, monthly summaries, owner and group dashboards | Owners see monthly sales and profit across their businesses |
| 3. Business modules | One business at a time (start with the easiest and most valuable) | Each business runs its daily work in the ERP |
| 4. HR and approvals | Attendance, leaves, payroll, approval flows | Staff self-service and manager approvals |
| 5. Growth | Mobile app, integrations, more reports | Field use and automation |

Timeline and budget to be set after the open questions are answered.

## 13. Open Questions

1. What are the other 7 businesses, and what does each one track?
2. Do businesses share customers, vendors, stock or staff?
3. Do you need billing between businesses and group-level accounting?
4. Can owners see salaries, or only totals?
5. Do you need more roles than listed in section 4?
6. Can one employee work in more than one business?
7. Which approvals are needed?
8. Which modules are must-have for version 1?
9. Do you need GST, TDS and PF/ESI features?
10. Web only, or a mobile app as well (for example attendance with GPS or selfie)?
11. Which languages are needed?
12. Which integrations (WhatsApp, payment gateway, Tally, biometric devices)?
13. Is there existing data to move (Excel, Tally, an old ERP)?
14. Is this for your own group or for a client, and what are the timeline and budget?
15. On the dashboard, should “sales of the month” show revenue, salary cost, or both?

## 14. Risks

| Risk | How we handle it |
| --- | --- |
| Ten very different businesses cause scope to grow | Build the platform first, then one business at a time |
| Permission rules become complex | Keep one access matrix and test it for every role |
| Owners lose trust if dashboard numbers differ | Month-end closing and reconciliation of summaries |
| System slows down as data grows | Lazy loading, summaries, pagination, caching |
| Moving old data is messy | CSV import templates and a clean-up step per business |
