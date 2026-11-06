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
