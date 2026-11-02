# HOME-SEVA CENTRAL SYSTEM — CRITICAL CORE PRINCIPLES & BRAIN MEMORY

> **MANDATORY RULES FOR ALL AI AGENTS & SESSIONS**  
> Every agent working on this codebase MUST read and strictly adhere to the rules below before writing, modifying, or testing any code.

---

## 1. ZERO MOCK DATA & ZERO ASSUMPTIONS (STRICT)

1. **NEVER FABRICATE DUMMY / MOCK DATA**:
   - **Never invent fake staff names** (e.g., "Priya Sharma", "Anjali Patil", "Snehal Deshmukh", "Vikram Malhotra", "Ramesh Kale").
   - **Never invent fake phone numbers, fake addresses, fake call logs, or dummy metrics** (e.g. "38 calls made", "25 connected").
   - **Never auto-fill forms with fake/mock defaults**. All initial states must be clean and un-prefilled.
2. **IF YOU DO NOT KNOW, ASK THE USER**:
   - If staff roster, member names, business logic, credentials, or specific fields are unknown, **STOP AND ASK THE USER DIRECTLY**.
   - Never guess, extrapolate, or inject placeholder personas.
   - If the user has not provided staff names, provide a clean manual input where the staff member types their own name or select "Telecaller", never a hardcoded fake person.

---

## 2. CLIENT NAMES & CRM FIELDS

1. **Client Name Is Always Optional**:
   - Client name is **never required**.
   - If blank or unprovided, automatically default to `"Don't know"`.
2. **No Placeholders in Name and Phone Fields**:
   - Do NOT use gray placeholder text inside Name or Phone input fields (e.g. no `"e.g. Ramesh Kulkarni"`, no `"e.g. 9822114455"`, no `"+91..."`).
   - Keep input fields clean with empty placeholders (`placeholder=""` or omitted).
3. **Duplicate Phone Number Prevention (Strict — Save from Duplicate Data)**:
   - When entering a phone number in the CRM or adding a lead, the system must perform **live duplicate detection**.
   - If the phone number already exists in the company's CRM:
     - The system must immediately display: `"This phone number already exists in CRM!"` showing the existing lead's name, status, branch, and added date.
     - The submission button is disabled (`"Duplicate Exists"`) to prevent duplicate records.
     - The backend API (`POST /api/gentle-hair-wigs/crm-leads`) and local database layer (`gentleHairWigsDb`) reject duplicate phone numbers (HTTP 409 Conflict).
     - Excel/CSV bulk import detects existing phone numbers and safely skips duplicate rows.
4. **CRM & All CRM-Related Tabs Are 100% Centralized Across All 3 Studios (Strict Rule)**:
   - For Gentle Hair Wigs, **CRM and all tabs related to CRM are completely centralized across all 3 Studios (`viman-nagar`, `ravet`, `kolhapur`)**:
     - **Monthly Leads Sheet (`sheet`)**: Shows all inquiries and leads across all 3 studios.
     - **Annual 12-Month Sheets (`annual`)**: Aggregates all 12 months across all 3 studios.
     - **Scheduled Follow-ups (`follow-up`)**: Unified callback pipeline across all studios.
     - **Converted Clients (`converted`)**: Converted client handoffs across all studios.
     - **Telecaller Daily Reporting (`daily-reporting`)**: Shift punch-in/out, hours worked, and reporting are unified across all 3 studios.
     - **Team Attendance & Daily Reporting (`team`)**: Defaults to "All Studio Branches" so managers see reports from all 3 studios together.
   - All CRM-related tabs **MUST SHOW THE SAME THINGS, DATA, LEADS, METRICS, AND REPORTING FOR ALL 3 STUDIOS**.
   - Switching between studios must NEVER partition, hide, or empty CRM data or daily reporting.

---

## 3. MULTI-COMPANY & SUB-COMPANY (MULTI-TENANT) ISOLATION (CRITICAL)

HomeSeva is a centralized platform running multiple independent **Companies** (business verticals) and **Sub-Companies** (branches, studios, divisions, and franchise units).

### 1. Distinct Rules per Company & Sub-Company (No Shared Assumptions)
- **RULES ARE DIFFERENT FOR EACH COMPANY & SUB-COMPANY**:
  - What is configured for one company (e.g., Gentle Hair Wigs) **DOES NOT AUTOMATICALLY APPLY** to any other company (e.g., Prefab Construction, HoReCa, Ecolab, etc.).
  - Even within the same company, different sub-companies/branches may have localized shifts, opening hours, or operational rules.
  - **Every company and sub-company may have completely different**:
    - **Shift Timings & Attendance Cutoffs**: (e.g., Gentle Hair Wigs uses $\ge 5.0$ hrs for Full Day and $< 5.0$ hrs for Half Day; while another company might use 8.0 hrs, 9.0 hrs, or flexible site-based attendance).
    - **Roles & Permissions**: (e.g., Telecaller/Stylist vs Site Engineer vs Warehouse Manager vs Printing Operator).
    - **CRM & Reporting Fields**: (e.g., Call numbers & wig fittings vs BoQ estimates vs Chemical dispatches vs Crockery rentals).
    - **Workflow Actions**: (e.g., Studio fittings vs Dispatch orders vs Site inspections).
- **IF YOU DO NOT KNOW THE RULES FOR A COMPANY OR SUB-COMPANY, ASK**:
  - Never guess or copy-paste business logic, shift hours, or form fields from another company.
  - Always verify with the user what specific shift hours, attendance thresholds, and metrics apply to that particular company and sub-company.

### 2. Registered Companies & Sub-Companies Catalog
| # | Company Name | Business Slug | ID | Sub-Companies / Branches / Divisions | Current Specific Rules & Notes |
|---|--------------|---------------|----|---------------------------------------|---------------------------------|
| 1 | **Gentle Hair Wigs Studio** | `gentle-hair-wigs` | `3` | • `viman-nagar` (Studio of Viman Nagar - Flagship)<br>• `ravet` (Studio of Ravet - PCMC Lounge)<br>• `kolhapur` (Studio of Kolhapur - Regional) | • Attendance: $\ge 5$ hrs = Present (Full Day), $< 5$ hrs = Half Day, Unsubmitted = Leave.<br>• Punch-In/Out via Clock & Number Chooser (no typing).<br>• CRM: Client name optional (defaults to "Don't know"), empty placeholders.<br>• **CRM & all CRM-related tabs (Monthly Sheets, Annual, Follow-ups, Converted, Daily Reporting) are 100% CENTRALIZED across all 3 studios**.<br>• Operational tabs (inventory, appointments, custom orders) support studio-level tracking. |
| 2 | **Prefab Construction Solutions** | `prefab-construction` | `1` | • Factory/Plant<br>• Project Sites<br>• Estimation & BoQ<br>• Quality Control | • Industrial modular construction workflows.<br>• Verify site shift hours and engineer reporting fields with user before modifying. |
| 3 | **HoReCa Essentials & Crockery Rental** | `horeca-essentials` | `2` | • Central Warehouse<br>• Event Dispatch<br>• Inventory & Losses<br>• Washing & Sanitization | • Hospitality rental and inventory dispatch workflows.<br>• Verify warehouse shift and driver/dispatch metrics with user. |
| 4 | **Ecolab Institutional Distribution** | `ecolab-distribution` | `4` | • Industrial Supply<br>• Healthcare Hygiene<br>• Food & Beverage | • B2B chemical distribution and account manager visits.<br>• Verify sales rep visit reporting rules with user. |
| 5 | **HS Co-working Spaces** | `hs-coworking` | `25cdeb20...` | • Location Hubs<br>• Private Suites<br>• Desk Management | • Coworking desk bookings, passes, and facility front-desk.<br>• Verify center manager shift rules with user. |
| 6 | **First Mover Advantage** | `first-mover-advantage` | `1de2e728...` | • Digital Growth<br>• Performance Marketing<br>• Client Campaigns | • Agency delivery, campaign tracking, and client retainer ops. |
| 7 | **Printbooth Digital Printing** | `printbooth` | `0d900d63...` | • Offset Division<br>• Signage & Large Format<br>• Digital Counter | • Print jobs, material wastage, machine hours, and counter billing. |
| 8 | **DVR Enterprise / DVE Enterprises** | `dvr-enterprise` | `f9d7e763...` | • Logistics<br>• Industrial Supply<br>• Commodity Trading | • Freight tracking, dispatch registers, and trading accounts. |
| 9 | **NDA Security & Facility Care** | `nda-services` | `0178c937...` | • Guarding Deployments<br>• Facility Maintenance<br>• Site Audits | • Security roster, night patrol shifts, and client premise guards. |
| 10 | **HS Real Estate & Assets** | `hs-real-estate` | `4474711a...` | • Commercial Leasing<br>• Residential Sales<br>• Asset Management | • Brokerage pipeline, site visits, and high-value buyer deals. |

### 3. Strict Database & Route Scoping
- Every query, table access, and API route **MUST ALWAYS filter by `business_id` or `business_slug`**.
- Sub-company/branch data **MUST ALWAYS filter by `branch` or `division`**.
- Cross-company data leaks, shared state, or accidental global mutations are strictly prohibited.

---

## 4. DAILY REPORTING & ATTENDANCE SYSTEM (GENTLE HAIR WIGS SPECIFICATION)

1. **Tab Only — No Floating Buttons**:
   - Daily Reporting must always live inside a dedicated, first-class tab (e.g., "Daily Reporting" tab in the dashboard).
   - Never use floating action buttons (FAB) for daily reporting.
2. **Clock & Easy Number Chooser (ZERO Keyboard Typing)**:
   - Punch-In and Punch-Out must be selectable via an intuitive **Clock & Number Chooser**:
     - Hour dropdown (`01` to `12`)
     - Minute dropdown (`:00`, `:05`, `:10`, ..., `:55`)
     - Period toggle buttons (`[ AM ]` and `[ PM ]`)
     - 1-tap quick timing preset chips (`09:00 AM`, `09:30 AM`, `06:30 PM`, `Now`, etc.)
     - Quick `✕ Clear` button.
   - **DO NOT require keyboard typing** for punch in and punch out.
   - **NO automatic timestamping buttons** that auto-stamp or force submit unexpectedly.
3. **Auto-Calculation of Worked Hours**:
   - As soon as Punch-In and Punch-Out are selected, worked hours auto-calculate dynamically (`(out - in) / 60`).
   - Worked hours remain editable by the user.
4. **Attendance Status Rules (Strict)**:
   - **≥ 5.0 hours worked**: Automatically marked as **Present (Full Day)** (`PRESENT`).
   - **< 5.0 hours worked (and > 0)**: Automatically marked as **Half Day** (`HALF_DAY`).
   - **No report submitted on the day**: Counts as **Leave** (`LEAVE`).
   - Manual override options available in status dropdown: `Present (Full Day)`, `Half Day`, `Leave`, `Holiday / Off`.
5. **User-Controlled Submission**:
   - The user can fill out and submit their daily work report at **any time** of day.
   - Dials, connected calls, appointments booked, converted sales, follow-ups, and notes are all manually entered by the user.
6. **All Data Must Persist Durably**:
   - Every submitted report must save directly to Supabase (`telecaller_daily_reports` and `audit_logs`).
   - Studio Manager and Studio Owner can view reports in the "Team" / "Attendance" tab in real time.

---

## 5. AUTHENTICATION & CREDENTIAL RULES

1. **Single Password Authentication**:
   - Strict single password matching verified against Supabase.
   - Never reintroduce dual-password systems, fallback passwords, or unverified backdoor credentials.
2. **Role & Branch Driven**:
   - Role determines accessible tabs and dashboards.
   - Branch isolation (Viman Nagar, Ravet, Kolhapur) must be preserved.

---

## 6. QUALITY ASSURANCE & VERIFICATION PROTOCOL

Before completing any task or replying to the user:
1. **TypeScript Typecheck**: Run `pnpm --filter @homeseva/web exec tsc --noEmit` — Must be **0 errors**.
2. **ESLint**: Run `pnpm --filter @homeseva/web lint` — Must be **0 warnings, 0 errors**.
3. **Production Build**: Run `pnpm --filter @homeseva/web build` — Next.js build must succeed.
4. **Restart Web Daemon**: Restart the active server daemon on port 3000 so the user experiences the changes immediately.
5. **Git Sync**: Commit changes with a clear conventional commit message and push to GitHub `origin main`.

