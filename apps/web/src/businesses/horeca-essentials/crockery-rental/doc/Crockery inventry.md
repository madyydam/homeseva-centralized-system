# Crockery Rental Manager: Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | Crockery Rental Manager (working name, to be finalised) |
| **Version** | 1.0, Draft |
| **Date** | 28 October 2026 |
| **Owner** | To be filled |
| **Status** | Ready for review and sign-off |

---

## 1. Summary

A web and mobile-friendly application for a business that rents out crockery (plates, bowls, glasses, cups, spoons and similar items) for weddings, functions and parties. The business owns roughly 1,000+ pieces. **None of the pieces can carry a barcode, sticker or number**, so the whole system is built around **counting by item type and quantity**, not tracking individual pieces.

The product covers the full cycle: item master, date-based availability, quotation and booking, dispatch with counting, return with breakage and missing counts, cleaning, invoicing, payments, reports and stock audits.

## 2. Problem statement

Today the business most likely manages bookings and stock on paper, in a notebook or on WhatsApp. This causes:

1. **Double booking.** Nobody can quickly tell how many plates are free on a given date.
2. **Disputes at return.** Nobody has a reliable record of how many pieces went out, how many came back, and what was broken.
3. **Hidden losses.** Breakage and missing pieces are not recorded per customer, so losses build up unnoticed and are hard to recover.
4. **Slow billing.** Rent, transport, damage charges and advance have to be calculated by hand.
5. **No visibility.** The owner cannot see which items earn the most, who owes money, or how much stock has been lost this season.

Because individual pieces cannot be marked, the usual barcode-based inventory software does not work here.

## 3. Goals and non-goals

### 3.1 Goals

- G1. Give an accurate answer to "how many of item X are free on date range Y" in under 5 seconds.
- G2. Make dispatch and return counting fast enough to use at the godown or the customer's gate on a phone.
- G3. Record every change in stock as a ledger entry so that stock always reconciles.
- G4. Generate a correct invoice automatically, including damage and missing charges.
- G5. Give the owner a clear view of money outstanding, losses and item performance.
- G6. Be simple enough that a staff member with no training can create a booking after one demonstration.

### 3.2 Non-goals (for version 1)

- Tracking individual pieces by serial number, barcode or RFID.
- Full accounting (ledgers, balance sheet, payroll). The product exports data to accounting tools instead.
- Online customer self-booking and online payments (planned for phase 3).
- Selling crockery (retail POS). This is a rental product.
- Managing delivery vehicle routes and drivers beyond a simple transport charge and note.

## 4. Users and roles

| Role | Who | What they mainly do |
|---|---|---|
| **Owner** | Business owner | Everything, including prices, settings, reports, approvals, stock audits |
| **Manager** | Senior staff | Bookings, quotations, payments, reports, approvals for discounts and overbooking |
| **Counter staff** | Office or phone staff | Create enquiries, quotations and bookings, record payments, print and share documents |
| **Godown staff** | Dispatch and return team | Count and confirm dispatch and return, take photos, mark cleaning done. Prices are hidden from this role |
| **Accountant** | Part-time or external | View invoices, payments and reports. No stock actions |
| **Customer** (phase 3) | Event host | View booking, challan, invoice and balance through a secure link |

### Permission matrix (version 1)

| Action | Owner | Manager | Counter | Godown | Accountant |
|---|---|---|---|---|---|
| Manage items and prices | Yes | Yes | No | No | No |
| Create or edit booking | Yes | Yes | Yes | No | No |
| Give discount above set limit | Yes | Yes | No | No | No |
| Override availability (overbook) | Yes | Yes | No | No | No |
| Dispatch and return counting | Yes | Yes | Yes | Yes | No |
| Edit a confirmed dispatch or return | Yes | Yes | No | No | No |
| Record payment | Yes | Yes | Yes | No | No |
| View prices and invoices | Yes | Yes | Yes | No | Yes |
| Stock audit and adjustment | Yes | Yes | No | Count only | No |
| Reports | Yes | Yes | Limited | No | Yes |
| Settings and users | Yes | No | No | No | No |

## 5. Core concept: tracking without barcodes

### 5.1 The idea

Stock is tracked as **quantity per item type**, kept in buckets. Every movement between buckets is written to an immutable **stock ledger** (who, when, how many, why, which booking). Nothing is edited in place.

### 5.2 Stock buckets per item

| Bucket | Meaning |
|---|---|
| **In godown** | Clean pieces physically available |
| **Out on rent** | Dispatched to customers, not yet returned |
| **Cleaning** | Returned and waiting to be washed (can be switched off in settings) |
| **Written off** | Broken or missing pieces removed from owned stock (kept in the loss ledger, never deleted) |

**Owned = In godown + Out on rent + Cleaning.** Written-off pieces reduce Owned and are visible in loss reports.

### 5.3 Availability for a date range

```
Reserved(item, range) = sum of quantities in bookings with status Confirmed or Dispatched
                        whose [start - prep days, end + return buffer days] overlaps the range
Available(item, range) = Owned - Reserved(item, range)
```

- Overdue bookings stay reserved until the pieces are actually returned.
- Prep days and return buffer days are configurable (for example 0 days before, 1 day after for washing and re-counting).
- Quotations do not reserve stock unless the user chooses "hold for N days".

### 5.4 Making counting fast and reliable (no marking on pieces)

1. **Pack size per item.** For example, a stack of 25 dinner plates or a tray of 24 glasses. Staff enter "6 stacks + 3 loose" and the system converts to 153.
2. **Crate and stack QR labels (phase 2, optional).** A QR label goes on the **crate, bag or tray**, never on the piece. The label says what the container normally holds. Scanning it during dispatch and return adds the standard pack quantity in one tap, and staff correct only the exception.
3. **Photo evidence.** Photos of loaded crates at dispatch and of broken pieces at return, attached to the booking.
4. **Customer acknowledgement.** Customer signs on screen or confirms through a WhatsApp link, on the dispatch challan and on the return slip.
5. **Periodic stock audit.** A physical count per item compared with the system, with variance explained and adjusted through the ledger.

## 6. Scope by phase

| Phase | Name | Contents |
|---|---|---|
| **P1** | Core (MVP) | Login and roles, item master, customers, availability calendar, quotation and booking, dispatch, return, invoice, payments, dashboard, basic reports |
| **P2** | Business | Packages by guest count, cleaning stage, crate QR labels, WhatsApp messaging, chipped or cracked damage grade, security deposit, stock audit, loss reports, offline-tolerant counting, Hindi and Marathi UI, accounting export |
| **P3** | Scale | Customer portal, online payment links, multiple godowns or branches, sub-rental from other vendors, staff performance, native mobile app, multi-tenant onboarding for other rental businesses |

Version 1 means P1. Everything marked P2 or P3 below is designed for but not built in the first release.

## 7. Functional requirements

Priority is the phase in which the requirement ships.

### 7.1 Authentication and users

| ID | Requirement | Phase |
|---|---|---|
| AUTH-01 | Login with phone number and password, with optional OTP | P1 |
| AUTH-02 | Roles and permissions as per the matrix in section 4 | P1 |
| AUTH-03 | Owner can add, disable and reset users. Disabled users keep their history | P1 |
| AUTH-04 | Session timeout and logout on all devices | P1 |
| AUTH-05 | Every create, edit and delete action is recorded in an audit log with user and time | P1 |

### 7.2 Item master

| ID | Requirement | Phase |
|---|---|---|
| ITEM-01 | Create item with name, category, photo, unit (piece), pack size, rent rate, rent basis, replacement cost | P1 |
| ITEM-02 | Rent basis options: per piece per day (default), per piece per event (flat) | P1 |
| ITEM-03 | Total owned quantity set at creation as an opening stock ledger entry | P1 |
| ITEM-04 | Items are never hard-deleted once used. They can be deactivated | P1 |
| ITEM-05 | Changing a rate affects only future bookings. Existing bookings keep their rate snapshot | P1 |
| ITEM-06 | Different designs of the same item are separate items (for example "Dinner plate, white" and "Dinner plate, gold rim") | P1 |
| ITEM-07 | Category management (plates, bowls, glassware, cups, cutlery, serving ware, other) | P1 |
| ITEM-08 | Optional low-stock threshold per item for season planning | P2 |

### 7.3 Packages (combo sets)

| ID | Requirement | Phase |
|---|---|---|
| PKG-01 | Create a package as a list of items with quantity per guest (for example 1 dinner plate, 1 quarter plate, 1 glass, 1 spoon per guest) | P2 |
| PKG-02 | When creating a booking, enter guest count and the package expands into item lines. Quantity = guests × ratio, rounded up, plus an optional buffer percentage for breakage | P2 |
| PKG-03 | Expanded lines remain editable. The booking stores plain item lines, not the package | P2 |

### 7.4 Customers

| ID | Requirement | Phase |
|---|---|---|
| CUST-01 | Create customer with name, phone, alternate phone, address, optional GSTIN, notes | P1 |
| CUST-02 | Search by name or phone while creating a booking. Warn about duplicates by phone number | P1 |
| CUST-03 | Customer profile shows booking history, total billed, total paid, outstanding, and total pieces broken or missing | P1 |
| CUST-04 | Tag customers (regular, caterer, blacklisted). Blacklisted customers trigger a warning at booking | P2 |

### 7.5 Availability calendar

| ID | Requirement | Phase |
|---|---|---|
| CAL-01 | Month view showing, per day, how much stock is committed (for example 70 percent) | P1 |
| CAL-02 | Select an item and a date range to see the free quantity and which bookings use the rest | P1 |
| CAL-03 | Booking form shows "free on these dates" next to every item and blocks quantities above that | P1 |
| CAL-04 | Owner or manager can override with a mandatory reason. The override is logged | P1 |

### 7.6 Quotation and booking

**Status flow:** Enquiry → Quotation → Confirmed → Dispatched → Returned → Closed. A booking can also be Cancelled. "Overdue" is shown automatically when the expected return date has passed.

| ID | Requirement | Phase |
|---|---|---|
| BKG-01 | Create a booking with customer, event type, event date, delivery date, expected return date, venue and address, contact person at venue | P1 |
| BKG-02 | Add item lines with quantity. The system checks availability and shows estimated rent | P1 |
| BKG-03 | Save as Quotation (no stock held) or Confirmed (stock reserved) | P1 |
| BKG-04 | Confirming a booking requires a minimum advance amount (configurable, can be zero) | P1 |
| BKG-05 | Generate a quotation PDF and booking confirmation PDF | P1 |
| BKG-06 | Edit a confirmed booking: quantities can increase only if stock is available. Changes are logged | P1 |
| BKG-07 | Extend or shorten dates, with availability re-checked | P1 |
| BKG-08 | Cancel a booking with reason. Advance refund or retention is applied as per the cancellation policy setting | P1 |
| BKG-09 | Duplicate an existing booking (repeat customers) | P2 |
| BKG-10 | Hold stock on a quotation for a set number of days, then release automatically | P2 |

### 7.7 Dispatch

| ID | Requirement | Phase |
|---|---|---|
| DSP-01 | Dispatch screen lists booked items with expected quantity and a counter per item (stacks, loose pieces, running total) | P1 |
| DSP-02 | Partial dispatch is allowed. The remaining quantity stays pending | P1 |
| DSP-03 | Confirming dispatch moves stock from In godown to Out on rent through ledger entries | P1 |
| DSP-04 | Generate a dispatch challan (PDF) with item counts, date, time, vehicle or person, customer name | P1 |
| DSP-05 | Attach photos of loaded crates (setting: optional or mandatory) | P1 |
| DSP-06 | Customer acknowledgement by on-screen signature | P1 |
| DSP-07 | Scan crate QR to add its standard quantity | P2 |
| DSP-08 | Customer acknowledgement through a WhatsApp confirmation link | P2 |
| DSP-09 | Dispatch cannot exceed booked quantity unless the booking is edited first | P1 |

### 7.8 Return

| ID | Requirement | Phase |
|---|---|---|
| RET-01 | Return screen shows sent quantity per item and asks for **Returned good** and **Broken**. **Missing** is calculated as Sent minus Good minus Broken | P1 |
| RET-02 | Partial return is allowed. Items not yet returned stay on the booking as pending | P1 |
| RET-03 | Photos of broken pieces and of the returned load | P1 |
| RET-04 | Customer acknowledgement of the counts, by signature | P1 |
| RET-05 | Confirming return writes ledger entries: good pieces go to Cleaning (or directly to In godown if cleaning is off), broken and missing go to Written off | P1 |
| RET-06 | Late return: extra days are calculated automatically from the expected return date, using the late-fee rule | P1 |
| RET-07 | Damage grade "Chipped or cracked" with a partial charge percentage (default 50 percent of replacement cost) | P2 |
| RET-08 | Edit of a confirmed return only by owner or manager, with a reason, producing correcting ledger entries (never overwriting) | P1 |
| RET-09 | Missing pieces that are found later can be reversed with a ledger entry and a credit note | P2 |

### 7.9 Cleaning

| ID | Requirement | Phase |
|---|---|---|
| CLN-01 | Cleaning bucket per item. Godown staff mark a quantity as washed and it moves to In godown | P2 |
| CLN-02 | Setting to skip the cleaning stage entirely | P2 |
| CLN-03 | Cleaning pieces are not available for booking until washed, but the return buffer days are used for availability planning | P2 |

### 7.10 Billing and invoicing

| ID | Requirement | Phase |
|---|---|---|
| BIL-01 | Invoice is generated from the booking at return, using quantities that were actually dispatched | P1 |
| BIL-02 | Invoice lines: rent per item, transport charge, extra-day or late fee, damage and missing charges, discount, optional tax | P1 |
| BIL-03 | Damage and missing charge = pieces × replacement cost snapshot. Owner or manager may reduce or waive it with a reason | P1 |
| BIL-04 | Discount as a flat amount or percentage. Discounts above a set limit need manager approval | P1 |
| BIL-05 | Advance and previous payments are deducted to show balance due | P1 |
| BIL-06 | Sequential invoice number per financial year (April to March), for example `26-27/0001`. No gaps, no reuse | P1 |
| BIL-07 | Invoice PDF with business name, logo, address, terms and conditions, bank and UPI details | P1 |
| BIL-08 | Tax is optional and configurable: tax percentage, business GSTIN, customer GSTIN, tax split display. Tax rules must be confirmed with the business's accountant before launch | P2 |
| BIL-09 | Credit note for corrections after an invoice is final. Finalised invoices are never edited | P2 |
| BIL-10 | Security deposit: collected at booking, shown on the invoice, adjusted against damage, remainder refunded and recorded | P2 |
| BIL-11 | Invoice can be shared as PDF by WhatsApp link, email or print | P1 (wa.me link), P2 (API) |

### 7.11 Payments and customer ledger

| ID | Requirement | Phase |
|---|---|---|
| PAY-01 | Record payment against a booking: amount, mode (cash, UPI, bank transfer, cheque), reference, date, received by | P1 |
| PAY-02 | Multiple payments per booking (advance, part payments, final) | P1 |
| PAY-03 | Payment receipt PDF | P1 |
| PAY-04 | Outstanding list sorted by amount and by age | P1 |
| PAY-05 | Customer ledger (bills, payments, balance) | P1 |
| PAY-06 | Refunds (advance on cancellation, deposit) recorded as negative payments | P1 |
| PAY-07 | Online payment link (UPI or card) | P3 |

### 7.12 Stock management

| ID | Requirement | Phase |
|---|---|---|
| STK-01 | Add new stock (purchase) with date, quantity, cost, supplier note | P1 |
| STK-02 | Manual adjustment with mandatory reason (for example found, lost in godown, donated) | P1 |
| STK-03 | Stock ledger view per item, filterable by date, type and booking | P1 |
| STK-04 | Stock audit: select items, godown staff enter physical counts, system shows variance against expected In godown, owner approves, system writes adjustments | P2 |
| STK-05 | Stock never goes negative. Any action that would do so is blocked | P1 |
| STK-06 | Stock valuation report (owned quantity × cost) | P2 |

### 7.13 Notifications

| ID | Requirement | Phase |
|---|---|---|
| NTF-01 | Click-to-send WhatsApp messages with prefilled text (booking confirmation, challan, invoice, payment reminder) using a share link. No API cost | P1 |
| NTF-02 | Automated WhatsApp messages through the WhatsApp Business API with approved templates: booking confirmed, dispatch done, return reminder (one day before and on the day), payment due | P2 |
| NTF-03 | In-app reminders for staff: dispatches due today, returns due today, overdue returns | P1 |
| NTF-04 | Customer consent flag for automated messages | P2 |

### 7.14 Dashboard and reports

**Dashboard (P1):** today's dispatches, today's returns, overdue returns, pieces out on rent, pieces in godown, outstanding payments, this month's revenue, next 7 days of bookings.

| Report | Contents | Phase |
|---|---|---|
| Bookings | Filter by status, date, customer | P1 |
| Revenue | By day, month, customer, item category | P1 |
| Outstanding | Who owes how much and for how long | P1 |
| Item utilisation | Days rented ÷ days available per item, to show what earns and what sits idle | P2 |
| Loss report | Broken and missing by item, by customer, by month, with replacement cost | P2 |
| Customer report | Repeat customers, top customers, most damage | P2 |
| Stock valuation and audit variance | Owned quantity × cost, audit history | P2 |
| Tax report | Invoice-wise tax summary | P2 |
| Exports | CSV and PDF for all reports, accounting export | P2 |

### 7.15 Settings

- Business profile: name, logo, address, phone, GSTIN, bank and UPI details.
- Invoice settings: prefix, financial-year start month, terms and conditions text, footer.
- Rental rules: day-count method, minimum billable days, late-fee multiplier, prep days, return buffer days.
- Policies: minimum advance, cancellation refund rules, discount approval limit, damage waiver rules.
- Toggles: cleaning stage, photo mandatory at dispatch and return, tax on or off, deposit on or off.
- Users and roles.

## 8. Business rules

1. **Day count.** Default: rental days = return date minus dispatch date plus one (both days count). Configurable to count from event date. Minimum 1 day.
2. **Rent.** Per piece per day items: `quantity × rate × days`. Per piece per event items: `quantity × rate`.
3. **Late fee.** Extra days beyond the expected return date are charged at `quantity not yet returned × rate × late multiplier` (default multiplier 1.0).
4. **Damage.** Broken or missing pieces are charged at the replacement cost stored on the booking line when it was created.
5. **Totals.** `Total = rent + transport + late fee + damage − discount (+ tax)`. `Balance = Total − payments (+ deposit adjustments)`.
6. **Availability.** Quotations hold no stock. Confirmed and dispatched bookings do. Overdue bookings keep holding until returned.
7. **Overbooking.** Blocked by default. Owner or manager may override with a reason.
8. **Immutability.** Dispatches, returns and finalised invoices are corrected only through new correcting entries, never by overwriting.
9. **Cancellation.** Governed by a configurable table (for example more than 7 days before the event: full advance refund; 3 to 7 days: 50 percent; under 3 days: no refund).
10. **Rate changes.** Never retroactive.
11. **Deletion.** Soft delete only. Anything linked to a booking or ledger entry cannot be removed.

### Worked example

| | |
|---|---|
| Booking | 300 dinner plates at ₹2 per piece per day, 3 days |
| Rent | 300 × 2 × 3 = ₹1,800 |
| Transport | ₹500 |
| Return count | 296 good, 4 broken (replacement cost ₹80 each) |
| Damage charge | 4 × 80 = ₹320 |
| **Total** | **₹2,620** |
| Advance paid | ₹1,000 |
| **Balance due** | **₹1,620** |

## 9. Key user flows

### 9.1 Create a booking
1. Counter staff opens **New booking** and selects or creates the customer.
2. Enters event type, event date, delivery date and expected return date.
3. Adds items (or a package and guest count). Free quantity per item is shown live.
4. Reviews estimated rent, adds transport and discount.
5. Saves as **Quotation**, or records the advance and saves as **Confirmed**.
6. Shares the quotation or confirmation by WhatsApp or print.

### 9.2 Dispatch
1. Godown staff opens **Today's dispatches** and picks the booking.
2. Counts each item using stacks plus loose pieces. The running total is compared with the booked quantity.
3. Takes photos of the loaded crates.
4. Customer or representative signs on the screen.
5. Staff confirms. Stock moves to Out on rent. The challan PDF is generated and can be shared.

### 9.3 Return
1. Godown staff opens **Today's returns** and picks the booking.
2. Enters Returned good and Broken for each item. Missing is calculated.
3. Photographs broken pieces. Customer signs.
4. Staff confirms. Counts go to Cleaning and Written off. The system prepares the invoice with damage charges.
5. Manager reviews the damage charges (can waive or adjust with a reason) and finalises the invoice.
6. Payment is recorded and the booking is closed once the balance is zero.

### 9.4 Stock audit (phase 2)
1. Owner starts an audit and picks items or all items.
2. Godown staff count physical stock per item and enter the numbers.
3. System shows expected versus counted, with variance.
4. Owner adds reasons and approves. Adjustment entries are written to the ledger.

## 10. Edge cases to handle

- Same-day turnaround: pieces returned in the morning and re-booked for the evening (controlled by return buffer days and cleaning state).
- Customer asks for extra pieces on the event day (booking edit after dispatch with availability check and a supplementary challan).
- Customer returns less than sent and says the rest will come tomorrow (partial return with pending balance).
- Customer disputes the broken count after signing (photos and signed return slip are the evidence, edit only by correcting entry).
- Two staff dispatch the same booking at the same time (second confirmation is rejected with a message).
- Entering a quantity bigger than available (blocked, or overridden with a logged reason).
- Event postponed (date change with availability re-check).
- A customer who never returns pieces (booking stays overdue, charges continue under the late-fee rule, escalation notes are kept).
- Item rate changed mid-season (existing bookings unaffected).
- Opening stock entered incorrectly (corrected through an adjustment with a reason).

## 11. Screens

| # | Screen | Purpose | Main users |
|---|---|---|---|
| 1 | Login | Phone and password or OTP | All |
| 2 | Dashboard | Today and upcoming at a glance | Owner, manager |
| 3 | Availability calendar | Month view and item-wise free quantity | Counter, manager |
| 4 | Bookings list | Search and filter by status, date, customer | Counter, manager |
| 5 | Booking form and detail | Create, edit, view timeline of status, payments and documents | Counter, manager |
| 6 | Dispatch counting | Big-button counter, photos, signature | Godown |
| 7 | Return counting | Good and broken entry, photos, signature | Godown |
| 8 | Invoice view | Review, adjust damage, finalise, share | Manager |
| 9 | Payments and outstanding | Record and chase payments | Counter, accountant |
| 10 | Items and packages | Item master and combos | Manager, owner |
| 11 | Stock ledger and adjustments | History and manual corrections | Manager |
| 12 | Cleaning queue (P2) | Mark washed quantities | Godown |
| 13 | Stock audit (P2) | Count and approve variance | Owner, godown |
| 14 | Customers | List and profile | Counter, manager |
| 15 | Reports | All reports and exports | Owner, accountant |
| 16 | Settings and users | Business, invoice and rule configuration | Owner |

### UX principles

- **Mobile first.** Dispatch and return screens are designed for one hand on a phone, with large +/− buttons and a numeric keypad.
- **Fast counting.** Stack-based entry (stacks × pack size + loose) and quick +1, +5, +10 buttons.
- **Safe by default.** Confirm before irreversible actions, clear summaries before confirming dispatch, return or invoice.
- **Plain language.** Labels use words the staff already use. Hindi and Marathi UI in phase 2.
- **Godown staff never see prices.**

## 12. Data model (summary)

Every table carries `business_id` (so the product can later serve more than one rental business), `created_at`, `created_by`, `updated_at`, and is soft-deleted rather than removed.

| Entity | Key fields |
|---|---|
| Business | name, logo, address, GSTIN, bank and UPI, settings JSON |
| User | name, phone, role, active |
| Customer | name, phone, alt phone, address, GSTIN, tags, notes |
| ItemCategory | name |
| Item | name, category, photo, pack size, rent rate, rent basis, replacement cost, active |
| Package, PackageLine | name; item, quantity per guest |
| Booking | number, customer, status, event type, event date, delivery date, expected return date, venue, transport charge, discount, notes |
| BookingLine | booking, item, quantity, rate snapshot, cost snapshot, rent basis |
| Dispatch, DispatchLine | booking, time, dispatched by, vehicle or person, signature; item, quantity |
| Return, ReturnLine | booking, time, received by, signature; item, good, broken, missing, damage grade |
| StockMovement | item, type, quantity, bucket from, bucket to, booking ref, user, reason, time |
| Invoice, InvoiceLine | number, financial year, booking, totals, tax, status (draft or final); description, quantity, rate, amount |
| Payment | booking, customer, amount, mode, reference, direction (received or refund), date |
| CreditNote | invoice, amount, reason |
| StockAudit, AuditLine | date, status; item, expected, counted, variance, reason |
| Crate (P2) | label, item, standard quantity, QR code |
| Media | booking, type (dispatch, return, damage), file URL |
| Notification | booking, channel, template, status, sent time |
| AuditLog | user, action, entity, before and after, time |

**Stock movement types:** OPENING, PURCHASE, DISPATCH, RETURN_GOOD, RETURN_BROKEN, RETURN_MISSING, WASH_DONE, ADJUSTMENT, AUDIT_CORRECTION, REVERSAL.

## 13. Non-functional requirements

| Area | Requirement |
|---|---|
| **Devices** | Works on Android and iPhone browsers, tablets and desktop. Installable as a PWA |
| **Performance** | Main pages load in under 3 seconds on a normal 4G connection. Availability check returns in under 2 seconds |
| **Reliability** | Target availability of 99.5 percent. Daily automatic backups kept for 30 days, with a tested restore |
| **Offline** | P1 needs internet. P2 adds an offline queue for dispatch and return counts so a weak signal at a venue does not block work |
| **Security** | HTTPS everywhere, hashed passwords, role-based access, audit log, rate limiting on login, no sensitive data in URLs |
| **Privacy** | Customer data used only for the business. Consent flag for marketing or automated messages. Data export and deletion on request |
| **Data integrity** | Stock ledger is append-only. Database constraints prevent negative stock and duplicate invoice numbers |
| **Scalability** | Designed for tens of thousands of bookings per year and several users at once. Tenant column from day one |
| **Localisation** | English first. Hindi and Marathi in phase 2. Indian number format and ₹ currency. Dates as DD/MM/YYYY |
| **Accessibility** | Readable font sizes, sufficient contrast, tap targets of at least 44 px |
| **Documents** | PDFs generated server-side so they look the same everywhere |

## 14. Suggested technical approach

This is a recommendation for the build team and can be changed.

| Layer | Suggestion |
|---|---|
| Frontend | Next.js with React, TypeScript and Tailwind CSS, built as a PWA |
| Backend | Next.js API routes or a Node.js and Express service in TypeScript |
| Database | PostgreSQL with an ORM such as Prisma. Transactions for every stock movement |
| Auth | Phone and password with optional OTP, JWT or session cookies |
| File storage | S3-compatible object storage for photos and PDFs |
| PDF generation | Server-side HTML to PDF (for challan, invoice, quotation, receipt) |
| WhatsApp | Click-to-send links in P1. WhatsApp Business API through an approved provider in P2 |
| Hosting | Managed cloud with automated backups, staging and production environments |
| Observability | Error tracking, uptime monitoring, structured logs |

### Main API groups

`/auth`, `/users`, `/items`, `/packages`, `/customers`, `/availability`, `/bookings`, `/bookings/:id/dispatch`, `/bookings/:id/return`, `/invoices`, `/payments`, `/stock/movements`, `/stock/audits`, `/reports/*`, `/settings`, `/media`.

Critical rule for the build: **availability checks and every stock movement run inside a single database transaction with row locking**, so two staff members can never both take the last 50 plates.

## 15. Roadmap and estimates

Estimates assume one or two developers and are indicative only.

| Phase | Duration | Milestones |
|---|---|---|
| **P1 Core** | About 4 weeks | Week 1: setup, auth, roles, item master, customers. Week 2: availability engine, calendar, booking and quotation. Week 3: dispatch, return, stock ledger, photos, signatures. Week 4: invoice, payments, dashboard, basic reports, testing and pilot with real stock |
| **P2 Business** | About 4 weeks | Packages, cleaning, crate QR labels, WhatsApp API, deposit, chipped damage grade, stock audit, loss and utilisation reports, offline queue, Hindi and Marathi, tax and accounting export |
| **P3 Scale** | About 6 weeks | Customer portal, online payment links, multiple godowns, sub-rental, native app, multi-business onboarding |

**Pilot plan:** run P1 alongside the existing paper or notebook method for two weeks, compare counts, fix gaps, then switch fully.

## 16. Success metrics

Targets to be confirmed with the business owner after measuring the current baseline.

| Metric | Target |
|---|---|
| Double bookings | Zero |
| Time to create a booking | Under 3 minutes |
| Dispatches with counts recorded | 100 percent |
| Returns with counts recorded | 100 percent |
| Invoice ready after return confirmation | Under 5 minutes |
| Stock variance at audit | Under 1 percent of owned pieces |
| Damage and missing charges billed | At least 95 percent of recorded losses |
| Outstanding payments older than 30 days | Reduced every month |

## 17. Acceptance criteria for P1

1. A booking cannot be confirmed for more than the free quantity of any item on its dates, unless an owner or manager overrides with a reason.
2. Two overlapping bookings that together exceed owned stock cannot both be confirmed.
3. Dispatch confirmation reduces In godown and increases Out on rent by exactly the counted quantities, and a ledger entry exists for each.
4. Return confirmation computes Missing correctly and moves broken and missing pieces to Written off, reducing Owned.
5. The invoice total matches the business rules in section 8 for the worked example.
6. Invoice numbers are sequential with no gaps within a financial year.
7. A finalised invoice cannot be edited, only corrected by new entries.
8. Godown staff cannot see any price, invoice or payment screen.
9. Every stock-changing action appears in the audit log with user and time.
10. The stock ledger for any item adds up exactly to its current bucket quantities.
11. Dispatch and return screens work on a 5-inch Android phone with one hand.
12. Challan, quotation, invoice and receipt PDFs open correctly and can be shared through WhatsApp.

## 18. Test scenarios (UAT)

1. Book 300 plates for three days and complete dispatch and return with 4 broken. Check the invoice against the worked example.
2. Create a second booking for the same dates asking for more plates than remain. It must be blocked.
3. Return only part of a booking, then return the rest next day. Check late fee and ledger.
4. Cancel a confirmed booking five days before the event. Check refund per the cancellation table.
5. Two staff try to dispatch the same booking at once. Only one succeeds.
6. Change an item's rent rate. Existing bookings keep the old rate.
7. Record an advance, a part payment and a final payment. Check outstanding and customer ledger.
8. Finalise an invoice, then try to edit it. It must be blocked, and a credit note path must exist (P2).
9. Run a stock audit with a deliberate shortage and approve it (P2).
10. Disable a user. They can no longer log in, and their past entries remain.

## 19. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Staff skip counting under time pressure | Wrong stock and disputes | Fast stack-based counter, mandatory counts, photo requirement, manager review of exceptions |
| Disputes over breakage | Lost money and relationships | Signed counts, photos, clear terms printed on challan and invoice |
| Stock drifts from reality over a season | Overbooking | Regular stock audits, ledger-based reconciliation, variance reports |
| Weak mobile network at venues | Counting blocked | Offline queue in P2, counting can also be done at the godown |
| Resistance to new software | Low adoption | Pilot alongside paper, short training, simple screens, Hindi and Marathi labels |
| Incorrect tax handling | Compliance issues | Confirm tax treatment with the accountant before enabling tax. Tax is a setting, not hard-coded |
| Data loss | Business stops | Daily backups, tested restore, soft deletes |
| Scope creep | Late delivery | Strict phase scope, change requests reviewed against this PRD |

## 20. Open questions

These answers will refine the PRD before the build starts.

1. Is rent charged per piece per day, per piece per event, or per 100 pieces? Does it differ by item?
2. Does the business charge tax on rentals, and does it need GST invoices?
3. Is a refundable security deposit taken, and how much?
4. What is the late-return rule (extra day charge, fixed penalty)?
5. Is there a charge for chipped or cracked pieces, or only for fully broken and missing ones?
6. How many people will use the system, and how many godowns or locations are there?
7. Does the business also rent other things (tables, chairs, utensils, tents) that should be added later?
8. Does the business deliver itself, or do customers collect? Is transport a flat or per-distance charge?
9. Is there an existing invoice or challan format that should be matched?
10. How many pieces of each item exist today, and in what pack sizes are they stored?
11. Should customers be able to see their booking and balance online?
12. Is the product only for this business, or should it be built to sell to other rental businesses too?

## 21. Glossary

| Term | Meaning |
|---|---|
| **Item** | A type of crockery, such as "Dinner plate, white" |
| **Pack size** | Standard number of pieces in a stack, tray or crate |
| **Challan** | Dispatch slip listing what was sent to the customer |
| **Bucket** | A stock state: In godown, Out on rent, Cleaning, Written off |
| **Ledger** | Append-only record of every stock movement |
| **Written off** | Broken or missing pieces removed from owned stock |
| **Overdue** | Past the expected return date and not fully returned |
| **Package** | A combo of items per guest, such as a dinner set |
| **Replacement cost** | The amount charged for a broken or missing piece |
| **Audit** | Physical count compared with the system |

---

*End of document.*
