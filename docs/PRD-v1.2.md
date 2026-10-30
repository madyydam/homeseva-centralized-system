# HomeSeva: The Centralized System for 10 Businesses

*Product Requirements Document · Version 1.2 · 29 October 2026*

## 1. Overview

HomeSeva is a single ERP, the centralized system for a company group that runs 10 different businesses with about 500 employees. The businesses are very different from each other (for example a product business, a hair wig business and a construction business), so every business gets its own workspace with its own modules and data. One Super Admin controls all of them.

Version 1.2 makes backup a top-level feature. The Super Admin selects one, several or all businesses and takes a backup (section 4), and every part of the system is designed to be backed up business by business.

**Goals**

- Manage all 10 businesses, all employees and all owners from one system
- Strict role-based access: every person sees only what their role and business allow
- An owner of several businesses sees one combined dashboard with the monthly profit and sales of all their businesses
- Backup-friendly from end to end: the Super Admin picks the businesses and takes a backup
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
- The Super Admin console has these top-level areas: Businesses, Users and Roles, Tabs, Group Dashboard, Backup and Restore, Audit Log.

## 3. Users and Roles

| Role | Who | What they can see and do |
| --- | --- | --- |
| Super Admin | The one and only Super Admin account (one person) | Everything in all businesses. The only role that adds, edits or removes employees, creates businesses, assigns owners, roles and tabs, and takes or restores backups. |
| Owner | Owner of one or more businesses (there can be several owners) | Full view of their own businesses and a combined dashboard for them. Nothing from businesses they do not own. |
| Business Head | Head or GM of one business | Everything inside that one business, as allowed by the Super Admin. |
| Department Manager | Manager of a team or department | Manages their own team and gives approvals. Nothing beyond that: no finance, profit, salary or settings access. |
| Functional roles | HR, Accountant, Site Engineer, Store Staff and so on (defined per business) | Only the modules and actions given to the role. |
| Employee | Any staff member | Own profile, attendance, leaves, payslips and assigned tasks. |

The Super Admin can create custom roles from a screen, with no developer needed.

## 4. Backup and Restore

Backup is a top-level feature that only the Super Admin can use. From one screen the Super Admin selects the businesses to protect and takes a backup, on demand or on a schedule.

### 4.1 How it works

1. The Super Admin opens Backup and Restore in the console.
2. The screen lists all 10 businesses with a checkbox each, a Select all option, and the last backup date and status of each.
3. The Super Admin ticks one, several or all businesses and chooses Take backup now, or sets a schedule.
4. The system creates one separate backup package per selected business, in the background, and stays usable meanwhile.
5. Each package is checked, encrypted and saved outside the main server; the Super Admin sees success or failure per business.
6. From the backup history the Super Admin can download a package or restore a business from it.

### 4.2 What a business backup contains

| Part of the business | In its backup |
| --- | --- |
| Business data: employees, attendance, leaves, finance, approvals and every business-specific module | Yes |
| Users, Role IDs, roles and tab assignments (passwords as hashes only) | Yes |
| Business settings, branding, enabled modules and custom fields | Yes |
| Uploaded files and documents | Yes |
| Google Sheet tabs: the links | Yes |
| Google Sheet contents | Only if snapshot copies are switched on (to be confirmed); otherwise they stay in Google |
| Audit log of that business | Yes |
| Data of any other business | Never |

### 4.3 Requirements

- BK-1: The Backup and Restore screen lists all 10 businesses with a checkbox each, a Select all option, and each business’s last backup date and status.
- BK-2: Only the Super Admin can see or use backup and restore. Owners and every other role cannot take, download or restore a backup.
- BK-3: One separate package is made per selected business, so a single business can be restored without touching the others. A backup of all businesses is one package per business plus one small group package (business list and Super Admin settings).
- BK-4: Backups can be taken on demand or on a schedule the Super Admin sets per business (daily by default, to be confirmed).
- BK-5: Backups run in the background from a consistent snapshot, so users keep working and a package never holds half-saved data.
- BK-6: Every package is checked after it is made (checksum), encrypted, labelled with business, date, time, size and who started it, and stored outside the main server.
- BK-7: The Super Admin can download a package. Download asks for the password and a two-factor code again.
- BK-8: Restore works one business at a time, either as a separate copy for checking or over the live business. Restoring over the live business needs the business name typed in and a two-factor code.
- BK-9: A restore never changes any other business.
- BK-10: Old backups are removed automatically by a retention rule (suggested: 7 daily, 4 weekly, 12 monthly; to be confirmed).
- BK-11: Backup history shows every backup, download and restore with business, date, size, result and the person who ran it.
- BK-12: A failed backup raises an alert to the Super Admin straight away.
- BK-13: Every backup, download, restore and delete is written to the audit log.

### 4.4 Backup-friendly by design

These rules apply to every screen and module, so that nothing is left out of a backup:

- BF-1: Every table that holds business data carries a business ID, so one business can be exported or restored on its own.
- BF-2: Uploaded files are stored in a separate folder per business in S3-compatible storage, with their records in the database, so files and data are backed up together.
- BF-3: Settings (enabled modules, roles, tab assignments, branding, sheet links) are stored as data in PostgreSQL, never in code or on the server’s disk.
- BF-4: A restore brings back data, files and settings together, in a consistent state.
- BF-5: Every package carries a schema version, so an older backup can still be restored after HomeSeva is upgraded.
- BF-6: No module is released until it declares what data it stores and that data is covered by the backup. An automated test fails the build if a new table has no business ID or backup coverage.

## 5. Core Concept: Business Workspaces

The system has two layers.

1. **Platform core (shared by everyone):** home page, sign-in, users, roles and permissions, tab assignment, business registry, employee master, approvals, notifications, file storage, audit log, backup and restore, and the group dashboard.
2. **Business modules (switched on per business):** each business only gets the modules it needs, so a wig business never sees construction screens.

**Shared modules (any business can enable)**

| Module | Purpose |
| --- | --- |
| Employees and Attendance | Staff records, daily attendance |
| Leaves and Approvals | Leave requests and manager approvals |
| Finance Basics | Income, expenses, invoices, monthly closing |
| Payroll (optional) | Salary calculation and payslips |
| Tasks | Assign and track work |
| Documents | Store contracts, bills, IDs |
| Google Sheets | Open a Google Sheet inside HomeSeva as a tab |
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
- FR-2: Only the Super Admin adds, edits and deactivates employees and assigns roles and tabs. Others can only raise a request.
- FR-3: Each business can have one or more owners, and one owner can own many businesses.
- FR-4: Permissions are defined as module and action (for example finance.view, employee.create) and grouped into roles.
- FR-5: Access is limited by scope: group, business, department, team or own records.
- FR-6: Field-level visibility: sensitive fields such as salary are hidden unless the role allows them.
- FR-7: Every view, change and export of sensitive data, and every backup and restore, is written to an audit log.
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

## 7. Initial Access Matrix

| Area | Super Admin | Owner | Business Head | Dept Manager | Employee |
| --- | --- | --- | --- | --- | --- |
| Add or remove employees, assign roles and tabs | Yes (only) | Request only | No | No | No |
| Backup and restore | Yes (only) | No | No | No | No |
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

**Core tables:** businesses, users (Role ID, password hash, business), roles, tabs, user\_tab\_access, sheet\_links, sessions, audit\_log, backup\_jobs and backup\_packages.

**Two kinds of backup:** (1) per-business packages that the Super Admin selects, which are a scoped export of that business’s rows and files, and (2) whole-database backups for disaster recovery, which the server runs every night. Both are kept outside the main server.

## 9. Performance: Load Only What Is Needed

- PF-1: After login the app loads only the user’s shell and the list of businesses they may open.
- PF-2: Each business workspace and each module is a separate piece of code loaded only when first opened (lazy loading).
- PF-3: Every API call carries a business ID and is checked against the user’s scope. No endpoint returns data across businesses, except the summary endpoints for dashboards.
- PF-4: The group dashboard reads pre-calculated monthly summaries, never the raw transactions of all businesses.
- PF-5: Lists use server-side pagination, search and filters. Heavy reports and backups run in the background and are delivered when ready.
- PF-6: Permissions and summaries are cached in Redis and refreshed when they change.
- Targets (to be validated): app shell under 2 seconds, dashboard under 2 seconds, list pages under 1 second, with about 100 users online at once.

## 10. Non-Functional Requirements

- **Security:** encrypted connections, hashed passwords, 2FA for powerful roles, least-privilege defaults
- **Backup:** a nightly whole-database backup plus per-business packages. Targets (to be validated): lose at most 24 hours of data in a disaster, restore one business within a few hours, and test a restore at least once a month
- **Auditability:** complete audit trail of sensitive actions, including every backup and restore
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
| Files | S3-compatible storage, one folder per business |
| Backup | Per-business packages made by HomeSeva itself; whole-database backups with pg\_dump or pgBackRest; encrypted copies in S3-compatible storage outside the main server |
| Hosting | Docker on a VPS with Nginx |

## 12. Roadmap

| Phase | Focus | Outcome |
| --- | --- | --- |
| 1. Foundation | Home page, business selection, sign-in (Role ID and password), employees, roles, tab assignment, audit log, nightly whole-database backup | Super Admin can create businesses and users; access rules work; data is protected from day one |
| 2. Backup and Restore | Backup screen, per-business packages, schedules, download, restore, verification | Super Admin selects businesses and takes or restores a backup |
| 3. Money and dashboard | Finance basics, monthly summaries, owner and group dashboards | Owners see monthly sales and profit across their businesses |
| 4. Business modules | One business at a time, each with backup coverage before release | Each business runs its daily work in HomeSeva |
| 5. HR and approvals | Attendance, leaves, payroll, manager approval flows | Staff self-service and manager approvals |
| 6. Growth | Mobile app, integrations, more reports | Field use and automation |

Timeline and budget to be set after the open questions are answered.

## 13. Assumptions and Open Questions

**Working assumptions**

- Web application first (mobile-responsive); a native mobile app comes later
- English interface first; Hindi and Marathi later
- One company group, about 500 users, 10 businesses, amounts in INR
- Every employee belongs to one primary business; the Super Admin can give access to more
- Built for the group’s own use (a single organization, not sold to many companies)
- No data migration in v1 except CSV import

**Open questions**

1. What are the other 7 businesses, and what does each one track?
2. Do businesses share customers, vendors, stock or staff?
3. Do you need billing between businesses and group-level accounting?
4. Can owners see salaries, or only totals?
5. Do you need more roles than listed in section 3?
6. Can one employee work in more than one business?
7. Should the Business Head also give approvals, and who approves a manager’s own requests?
8. Which modules are must-have for version 1?
9. Do you need GST, TDS and PF/ESI features?
10. Web only, or a mobile app as well (for example attendance with GPS or selfie)?
11. Which languages are needed?
12. Which integrations (WhatsApp, payment gateway, Tally, biometric devices)?
13. Is there existing data to move (Excel, Tally, an old ERP)?
14. Is this for your own group or for a client, and what are the timeline and budget?
15. Does an owner of several businesses use one Role ID for all of them, or sign in to each business separately?
16. Should the Super Admin sign in from a separate link on the home page?
17. On the dashboard, should “sales of the month” show revenue, salary cost, or both?
18. Which Google Sheets go in first, and should users edit them or only view them?
19. Where should backups be stored: a cloud bucket, your own server, or both?
20. How often should automatic backups run, and how long should they be kept?
21. Should Google Sheet contents be copied into the backup, or only the sheet links?
22. Should a restore be allowed over a live business, or only as a separate copy first?

## 14. Risks

| Risk | How we handle it |
| --- | --- |
| Ten very different businesses cause scope to grow | Build the platform first, then one business at a time |
| Permission rules become complex | Keep one access matrix and test it for every role |
| Owners lose trust if dashboard numbers differ | Month-end closing and reconciliation of summaries |
| System slows down as data grows | Lazy loading, summaries, pagination, caching |
| Moving old data is messy | CSV import templates and a clean-up step per business |
| A new table or module is left out of the backup | BF-6: modules declare their data, and an automated test fails the build otherwise |
| Per-business backup is harder in one shared database | A scoped export that follows every table, tested on every release; the whole-database backup runs as a safety net |
| A backup is never tested and fails when needed | Automatic checksum after each backup and a test restore every month |
| A backup file is stolen | Encryption, storage outside the main server, password and two-factor code for download |
| A restore overwrites live data by mistake | Restore as a separate copy first; business name and two-factor code to restore over live data |
| Google Sheet contents are not in the database | Only links are backed up unless snapshot copies are switched on |
