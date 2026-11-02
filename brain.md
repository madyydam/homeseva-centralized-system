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

---

## 3. DAILY REPORTING & ATTENDANCE SYSTEM

1. **Tab Only — No Floating Buttons**:
   - Daily Reporting must always live inside a dedicated, first-class tab (e.g., "Daily Reporting" tab in the dashboard).
   - Never use floating action buttons (FAB) for daily reporting.
2. **Selectable & Enterable Time (No Punch Buttons)**:
   - Punch-In and Punch-Out must be **enterable and selectable time inputs** (`type="time"`).
   - Users can select time via native clock/picker dropdown or type/edit the time directly via keyboard.
   - Users can clear time or pick quick presets if convenient.
   - **NO automatic timestamping buttons** (no buttons that auto-stamp current time or submit unexpectedly).
3. **User-Controlled Submission**:
   - The user can fill out and submit their daily work report at **any time** of day.
   - Worked hours auto-calculate from in/out times but remain **100% editable** by the user.
   - Dials, connected calls, appointments booked, converted sales, follow-ups, and notes are all manually entered by the user.
4. **All Data Must Persist Durably**:
   - Every submitted report must save directly to Supabase (`telecaller_daily_reports` and `audit_logs`).
   - Studio Manager and Studio Owner can view reports in the "Team" / "Attendance" tab in real time.

---

## 4. AUTHENTICATION & CREDENTIAL RULES

1. **Single Password Authentication**:
   - Strict single password matching verified against Supabase.
   - Never reintroduce dual-password systems, fallback passwords, or unverified backdoor credentials.
2. **Role & Branch Driven**:
   - Role determines accessible tabs and dashboards.
   - Branch isolation (Viman Nagar, Ravet, Kolhapur) must be preserved.

---

## 5. QUALITY ASSURANCE & VERIFICATION PROTOCOL

Before completing any task or replying to the user:
1. **TypeScript Typecheck**: Run `pnpm --filter @homeseva/web exec tsc --noEmit` — Must be **0 errors**.
2. **ESLint**: Run `pnpm --filter @homeseva/web lint` — Must be **0 warnings, 0 errors**.
3. **Production Build**: Run `pnpm --filter @homeseva/web build` — Next.js build must succeed.
4. **Restart Web Daemon**: Restart the active server daemon on port 3000 so the user experiences the changes immediately.
5. **Git Sync**: Commit changes with a clear conventional commit message and push to GitHub `origin main`.

