# HOME-SEVA — BRAIN MEMORY & CORE USER RULES

> **MANDATORY RULES — HAR SESSION ME YAAD RAKHNA HAI**  
> AI Agent ko koi bhi code likhne ya modify karne se pehle ye saare rules strictly follow karne hain.

---

## 1. STRICTLY ZERO MOCK DATA & ZERO ASSUMPTIONS

1. **KABHI BHI MOCK / FAKE DATA MAT BANAO**:
   - Kabhi koi fake staff name mat dalo (e.g. "Priya Sharma", "Anjali Patil", "Ramesh Kale", etc. jaise fake personas strictly prohibited hain).
   - Kabhi fake phone numbers, fake client details, fake call numbers, ya dummy metrics mat daalo.
   - Forms me koi dummy prefill ya fake defaults mat lagao. Initial form hamesha clean aur un-prefilled hona chahiye.
2. **AGAR NAHI PATA TOH DIRECTLY USER SE PUCHO**:
   - Agar staff name, client list, timings, credentials, ya koi bhi business logic nahi pata — **STOP AND ASK THE USER FIRST**.
   - Apne man se koi assumption ya guess mat karo.
   - Staff name ke liye clean input do jahan staff apna actual naam enter kare ya generic "Telecaller" role dikhao, koi hardcoded fake persona nahi.

---

## 2. CLIENT NAMES & CRM FIELDS

1. **Client Name Hamesha Optional Hai**:
   - Client name mandatory nahi hai.
   - Agar blank ho toh automatically `"Don't know"` save hoga.
2. **Name aur Phone Inputs Me NO Placeholders**:
   - Name aur Phone ke input fields me gray placeholder text nahi hona chahiye (no `"e.g. Ramesh Kulkarni"`, no `"e.g. 9822114455"`).
   - Input box completely clean hona chahiye (`placeholder=""`).
3. **Duplicate Phone Number Prevention (Save From Duplicate Data)**:
   - Phone number enter karte hi live duplicate detection hona chahiye.
   - Agar number CRM me already exist karta hai:
     - Warning show karo: `"This phone number already exists in CRM!"` saath me existing lead ki details (Client Name, Status, Studio, Added Date).
     - Save button disable ho jayega (`"Duplicate Exists"`) taaki duplicate lead save na ho sake.
     - Single lead modal, bulk Excel/CSV import, database layer aur API route sab jagah duplicate strictly block hona chahiye.
4. **Studio Branch ONLY Matters When Client Is Converted**:
   - Inquiries, raw leads, calling records, aur follow-ups me **STUDIO NAHI HOTA AUR NA HI PUCHA JAYEGA**.
   - Add Lead modal me regular leads ke liye koi "Target Studio Branch" nahi hoga.
   - Leads table me client name ke neeche non-converted leads ke liye koi studio badge nahi aayega.
   - **Studio sirf aur sirf tab pucha aur dikhaya jayega jab lead ka status `Converted` ho** (jis studio me fitting/order ke liye convert hua).

---

## 3. COMPANIES AUR SUB-COMPANIES KE RULES ALAG HAIN

1. **Sabh Companies & Sub-Companies Ke Liye Rules Alag Ho Sakte Hain**:
   - Jo rule ek company (e.g. Gentle Hair Wigs) ke liye hai, wo dusri company par apne aap apply nahi hota.
   - Har company aur uske branches/sub-companies ke:
     - Shift hours aur attendance cutoffs alag ho sakte hain.
     - Form fields, reporting numbers, aur workflows alag ho sakte hain.
2. **Kabhi Guess Mat Karo — Pucho**:
   - Agar kisi nayi company ya sub-company ke shift timings, attendance rules, ya forms ke baare me nahi pata, toh **pehle user se confirm karo**.
3. **Registered Companies & Sub-Companies List**:
   - **Gentle Hair Wigs Studio**: Branches: `viman-nagar` (Flagship), `ravet` (PCMC), `kolhapur` (Regional).
   - **Prefab Construction Solutions**: Plant / Factory, Project Sites.
   - **HoReCa Essentials & Crockery Rental**: Central Warehouse, Event Dispatch.
   - **Ecolab Institutional Distribution**: Industrial Supply, Healthcare Hygiene.
   - **HS Co-working Spaces**: Location Hubs, Private Suites.
   - **First Mover Advantage**: Performance Marketing, Client Campaigns.
   - **ADJS (Parent Company)**: Sub-Company: **PRINTBOOTH™** (*"THINK IT. PRINT IT."*) — Smart self-service printing kiosks sold directly to merchants & entrepreneurs.
   - **DVR / DVE Enterprises**: Logistics, Industrial Supply.
   - **NDA Security & Facility Care**: Guarding Deployments, Facility Care.
   - **HS Real Estate & Assets**: Commercial Leasing, Residential Sales.

---

## 4. GENTLE HAIR WIGS: CRM & DAILY REPORTING RULES

1. **Centralized CRM For All 3 Studios**:
   - Gentle Hair Wigs ka CRM aur CRM se related sabhi tabs (`Monthly Leads Sheet`, `Annual 12-Month Sheets`, `Scheduled Follow-ups`, `Converted Clients`, `Telecaller Daily Reporting`, `Team Attendance`) **teeno studios (Viman Nagar, Ravet, Kolhapur) ke liye 100% centralized hain**.
   - Teeno studios me exact same data, same leads, same metrics, aur same reporting show hogi.
   - Studio change karne par CRM data ya daily reporting gayab nahi hona chahiye.
2. **Clock & Easy Number Chooser (NO Typing For Time)**:
   - Punch-In aur Punch-Out ka time keyboard se type nahi karwana.
   - Time select karne ke liye **Clock & Easy Number Chooser** (Hour dropdown `01-12`, Minute dropdown `:00, :05...`, AM/PM toggle, quick chips) hona chahiye.
   - Punch-in aur Punch-out select hote hi total hours auto-calculate hone chahiye.
3. **Attendance Status Rules**:
   - **≥ 5.0 hours worked**: Automatically **Present (Full Day)** (`PRESENT`).
   - **< 5.0 hours worked (aur > 0)**: Automatically **Half Day** (`HALF_DAY`).
   - **Report submit nahi hui**: Count as **Leave** (`LEAVE`).
   - Dropdown me manual override options: `Present (Full Day)`, `Half Day`, `Leave`, `Holiday / Off`.
   - User report din me kisi bhi waqt fill karke submit kar sakta hai.
4. **Daily Reporting Dedicated Tab Me Hogi**:
   - Daily reporting dashboard ke dedicated tab me hi honi chahiye, koi floating button (FAB) nahi.

---

## 5. ADJS & PRINTBOOTH™: MACHINE SALES & CRM RULES

1. **Parent Company & Sub-Company Structure**:
   - Parent Entity: **ADJS** (Group).
   - Sub-Company: **PRINTBOOTH™** (*"THINK IT. PRINT IT."*).
   - Kiosks are sold directly to merchants, stationery shops, colleges, hospitals, and entrepreneurs.
2. **NO Machine Management (Post-Sale)**:
   - Once a kiosk is sold to the merchant, daily machine management (paper, toner, ink, cash, cleaning) belongs entirely to the merchant.
   - System does NOT do paper refill logistics or fleet maintenance routes.
3. **The 5 Operational Roles**:
   - `Owner`: Business P&L, machine sales revenue, manufacturing margins & expansion.
   - `Manager`: Machine order pipeline, merchant onboarding & dispatch operations.
   - `Coldcaller`: Dedicated B2B merchant prospecting & kiosk placement CRM.
   - `Developer`: Kiosk touchscreen OS, Cloud Print APIs & payment gateways.
   - `Staff`: Freight dispatch logistics, invoicing challans & merchant helpdesk.
4. **Centralized CRM Rules (Same as Gentle Hair Wigs architecture)**:
   - 12-Month Annual sheets (Jan - Dec).
   - Clean inputs with ZERO gray placeholders (`placeholder=""`).
   - Duplicate phone number protection: instant warning alert & save button disabled.
   - Up to 5 notes per lead with click-to-edit notes modal.
   - Kiosk model and installation city asked/displayed ONLY when status is `Converted`.


---

## 6. MANDATORY ACTION PLAN CONFIRMATION PROTOCOL

> **CRITICAL RULE**: AI Agent ko koi bhi naya code likhne, database/schema badalne, ya UI overhaul karne se pehle **HAR BAAR** mandatory taur par:

1. **See & Analyze**: Problem aur user request ko thoroughly deep analyze karo.
2. **Present Clear Action Plan**: User ke samne clear, step-by-step Action Plan (points me) rakho — jisme explicitly bataya ho ki kya-kya changes hone wale hain aur UI kaisa dikhega.
3. **Ask Confirmation**: User se explicit confirmation / haan maango:
   - *"Should I proceed with this Action Plan?"*
4. **Execute, Test, Solve, Repeat**:
   - User ka confirmation milne ke baad hi execution start karo.
   - Execution hamesha step-by-step karo, bina kisi mistake ke:
     - **See / Analyze** -> **Plan** -> **Execute** -> **Test** -> **Test** -> **Solve** -> **Repeat**.
   - Har step ke baad compilation aur test verify karo (`pnpm --filter @homeseva/web build`).
   - Agar koi error aaye toh solve karo aur verify karo.

---

## 7. SUPER ADMIN CONSOLE: CLEAN WHITE THEME & LEFT NAVIGATION

1. **Clean White / Light Theme Only**:
   - Super Admin UI dark/black theme (`bg-slate-950`, dark glowing borders) nahi hoga.
   - Modern, professional, crisp White/Light Theme (`bg-slate-50`, `bg-white`, crisp borders `border-slate-200`, text `text-slate-900`) hoga.
2. **Persistent Left Sidebar Navigation**:
   - Screen open hote hi horizontal cluttered dark cards nahi honge.
   - Dedicated Left Sidebar hoga:
     - **Companies** (Primary / Default Module: Company list -> Selected Company Roles -> Role Members with CRUD & password visibility toggle).
     - **Security & Master Keys** (Rotate Super Admin 4-factor master credentials).
     - **Database Backups** (Export / Import data).
     - **Lock Console** (Secure logout).
3. **Individual Multi-Member System**:
   - Har role ke andar multiple individual members add, edit, aur delete ho sakte hain.
   - Universal Demo User: `abc@xyz.com` / `12345678` / `1234` for testing across all roles.
   - Smart Role Verification: Agar member kisi aur role me login karne ki koshish kare, show clear alert: *"You are not {selectedRole}. You are {actualRole}. Please select {actualRole} and try again."*
   - 99-Year Permanent Session Cookie (`homeseva_user_session`) jo user tab close ya refresh karne par expire na ho, sirf manual logout par hi clear ho.

---

## 8. MASTER BLUEPRINT & ARCHITECTURE SOP: ADDING A NEW COMPANY OR SUB-COMPANY

> **GOLDEN RULE**: Kabhi bhi sirf Home Page ya Sub-Company page par naam add karke task khatam mat maano!  
> HomeSeva ERP me koi bhi nayi **Company** ya **Sub-Company / Division / Studio** add karte waqt niche diye gaye **12 LAYERS** ko 100% end-to-end follow karna mandatory hai:

### LAYER 1: Database Schema & Migrations (`packages/db/prisma/schema.prisma` & `supabase_migrations/`)
1. **Parent Company Registration**:
   - Agar nayi Company hai: `businesses` table me entry honi chahiye (`id`, `slug`, `name`, `subtitle`, `description`, `theme_color`, `is_active`, `config`).
   - `config` JSON column me sub-companies ki configuration define karo:
     ```json
     {
       "subcompanies": [
         { "slug": "printbooth", "name": "PRINTBOOTH™", "subtitle": "Smart Self-Service Printing Kiosks", "badge": "Self-Service Kiosk" }
       ]
     }
     ```
2. **Sub-Company Isolation**:
   - Agar sub-company ke paas dedicated entity table hai (jaise Gentle Hair Wigs ke paas `gentle_hair_wigs_studios` hai), toh schema me model define karo with composite unique `@@unique([businessId, slug])`.
   - Business-specific tables (jaise `printbooth_crm_leads`, `printbooth_machine_orders`, `printbooth_support_tickets`) me hamesha `businessId String @default("<slug>") @map("business_id")` foreign index hona chahiye.
3. **SQL Migrations**:
   - `supabase_migrations/01_base_schema_and_businesses.sql` aur master SQL files me `INSERT INTO businesses` update karo with unique slug.

### LAYER 2: Seed & Initialization Data (`packages/db/src/seed.ts`)
1. `otherBusinesses` ya primary seeds me parent company slug aur name register karo.
2. Agar sub-companies hain (jaise studios ya divisions), default sub-company entities ko database me upsert karo.
3. Standard demo staff members seed karo taaki QA/Testing me koi issue na aaye.

### LAYER 3: Backend Auth & Verification APIs (`apps/web/src/app/api/auth/`)
1. **`/api/auth/businesses/route.ts`**:
   - Businesses catalog list me parent company return honi chahiye.
   - Single slug query (`?slug=<slug>`) me company ke sath uske `business_roles`, `tabs`, aur `config.subcompanies` cleanly return hone chahiye.
2. **`/api/auth/role-credentials/route.ts`**:
   - Company ke roles ki verification dynamic database query se honi chahiye.
3. **`/api/auth/me/route.ts` & `/api/auth/member-login/route.ts`**:
   - Session cookie issue karte waqt `businessSlug`, `role`, `memberId`, aur `subcompany` (agar applicable ho) payload me set ho.

### LAYER 4: Super Admin Console (`apps/web/src/app/super-admin/companies/` & `/api/admin/`)
1. **`/api/admin/credentials/route.ts`**:
   - Companies array me company ka slug, name, roles aur uske sub-companies / divisions properly populated hone chahiye.
2. **`/super-admin/companies/page.tsx`**:
   - Left sidebar companies list me parent company ke card par uske sub-companies ki count ya pill badge dikhaye:
     - E.g. `ADJS` -> Pill: `PRINTBOOTH™`
     - E.g. `Gentle Hair Wigs` -> Pill: `3 Studios (Viman Nagar, Ravet, Kolhapur)`
     - E.g. `HORECA Essentials` -> Pill: `2 Divisions (Sales & Rental)`
   - Detail header me sub-company selector / badge present ho.
3. **`/api/admin/backup/route.ts`**:
   - Backup export aur restore logic me naye business ke tables include karo taaki JSON snapshot complete download ho.

### LAYER 5: Dynamic Role Catalog (`apps/web/src/app/signin/[businessSlug]/page.tsx`)
1. `DEFAULT_BUSINESS_ROLES` dictionary me naye business ke roles configure karo (e.g., `Owner`, `Manager`, `Coldcaller`, `Developer`, `Staff`).
2. Role badges, descriptions, aur departments (Executive, Operations, Sales/CRM, Engineering, Support) explicitly set karo.

### LAYER 6: Business Workspace Module (`apps/web/src/businesses/<slug>/`)
1. `config.ts`: Define `adjsConfig` (id, name, slug, subtitle, description, themeColor, divisions/branches, roles).
2. `types.ts`: Define specific item types, leads, orders, or support ticket models.
3. `db.ts`: Reactive in-memory state manager with automatic PostgreSQL backend synchronization (`syncFromBackend`).
4. `Dashboard.tsx`: Comprehensive role-based dashboard with:
   - Collapsible persistent sidebar (`useSidebarCollapse` hook).
   - Strict RBAC views (Owner overview, Manager dispatch, Developer tools, Staff support).
5. `ColdcallerDashboard.tsx`: If telecalling desk is applicable, render monthly/annual sheets, scheduled follow-ups, and duplicate phone number blocker.
6. `index.ts`: Export `<slug>Module: BusinessModule = { config, Dashboard }`.

### LAYER 7: Business Registry & Types (`apps/web/src/businesses/index.ts`)
1. Import `<slug>Module` into `apps/web/src/businesses/index.ts`.
2. Add `<slug>` to `BUSINESS_MODULES` record mapping.
3. Add to `getAllBusinessModules()` array.

### LAYER 8: Central ERP Portal Home Page (`apps/web/src/app/page.tsx`)
1. `BUSINESSES` array me company card add karo (id, name, subtitle, slug, icon/logoImg, color, bgColor, buttonStyle, hoverEffect).
2. Sub-company indicator badge ya subtitle clear rakho taaki user ko pata chale ki uske andar kaun-kaun se sub-companies hain.

### LAYER 9: Sign-In Ceremony & Sub-Company Selector (`apps/web/src/app/signin/[businessSlug]/page.tsx`)
1. **Step 1: Sub-Company / Division Selection Screen**:
   - Agar company ke paas multiple sub-companies, divisions ya studios hain (jaise ADJS -> Printbooth, HORECA -> Sales/Rental, Gentle -> Studios):
   - Check: `if (isBusinessWithSubcompanies && !selectedSubcompany)`:
     - Show high-fidelity sub-company selection cards.
     - User card par click karega toh `selectedSubcompany` set hoga aur URL me `?subcompany=<slug>` query attach hogi.
2. **Step 2: Sign-In Screen with Active Sub-Company Chip**:
   - Top par brand chip dikhao with sub-company name aur "Switch Sub-Company" link.
3. **Step 3: Dual 3D Padlock Verification Ceremony**:
   - Dynamic flying keys animation for Password & 4-Digit Security PIN.

### LAYER 10: Client-Side Session Persistence (`apps/web/src/lib/clientAuth.ts`)
1. `saveActiveSubcompany`:
   - Supports `{ slug, role, branch, division, subcompany, targetUrl }`.
   - Stores into `localStorage['homeseva_last_active_subcompany']`.
2. `getLastActiveSubcompany`:
   - Home page aur Sign-In par verify karta hai; agar active session valid hai, user ko bina dubara login karaye seedha uske last active sub-company dashboard par bhejta hai.
3. `logoutUser`:
   - Cookies destroy karta hai, local session clear karta hai, aur safe redirect karta hai.

### LAYER 11: Dynamic App Routing (`apps/web/src/app/app/[businessSlug]/dashboard/page.tsx`)
1. URL search params se `subcompany`, `branch`, `division`, `role` parse karo.
2. Business module ke `Dashboard` component ko pass karo via `BusinessDashboardProps`.
3. Re-save active subcompany upon successful page mount.

### LAYER 12: QA Lead Verification & VPS Deployment Readiness
1. TypeScript Strict Type-Check: `pnpm --filter @homeseva/web exec tsc --noEmit` -> Must pass with 0 errors.
2. VPS Deployment Readiness Test Suite: `node scripts/test-vps-readiness.mjs` -> Must pass all tests.
3. Next.js Production Build: `pnpm --filter @homeseva/web build` -> Must build all static & dynamic routes cleanly.
4. Git Commit: Clean descriptive local commit (never `git push` without user instruction).
