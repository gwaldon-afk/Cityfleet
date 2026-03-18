# Clock-on steps — outline and procedure

## Steps for clock on (daily flow)

| Step | Description | In app now? |
|------|-------------|-------------|
| **1. Confirm identity & time** | Mechanic is logged in; current date/time shown so they confirm they’re starting at the right time. | ✅ Yes — Clock on page shows live date/time. |
| **2. Confirm site** | Show which site they’re clocking on at (from their role/site). | ✅ Yes — Site name shown when available. |
| **3. Review procedure for the day** | Display the relevant procedure (e.g. daily safety / pre-start / toolbox) they must review before starting. | ✅ Yes — Section on Clock on page; “I have reviewed the procedure for today” must be ticked. Content area is placeholder until procedure source is configured. |
| **4. Note any messages** | Show any messages, announcements or notices (site-wide or role-based) they must acknowledge. | ✅ Yes — “Messages / notices” section; “I have read and noted any messages” must be ticked. Message area is placeholder until messages source is configured. |
| **5. Fit for work declaration** | Explicit confirmation they are fit for work and ready to start (L-01). Required before clock on. | ✅ Yes — Checkbox “I confirm I am fit for work…” stored in `fit_for_work_declaration` on the shift. |
| **6. Clock on** | Submit shift start; creates shift record with `clock_on_at` and optional declaration. | ✅ Yes — Button calls `clockOn()` then redirects to My Jobs. |

---

## Relevant procedure (fit for work, L-01)

- **Technical Architecture:** `POST /api/shifts/clock-on` body includes `fit_for_work_declaration: { ... }` and “Creates shift, validates fit-for-work”.
- **Current implementation:** A single checkbox confirms fit for work; that is sent in `fit_for_work_declaration` (e.g. `{ fit_for_work: true, confirmed_at: ISO string }`). No extra “procedure for the day” or “messages” are required by the API spec, but they are recommended for a proper daily start.

---

## Other steps often included in a full procedure

- **Pre-start / toolbox:** Link or short text for the day’s safety or procedure topic (optional; can be in “Procedure for the day”).
- **Acknowledge messages:** List of messages (e.g. site notices, recalls) with “I have read” or “Acknowledged” before enabling Clock on (optional; “Note any messages”).
- **Equipment / vehicle check:** Sometimes part of fit-for-work; currently covered by the single declaration; could be expanded in `fit_for_work_declaration` later.

---

## Summary

- **All steps in app:** (1) Confirm time and site, (2) **Review procedure for the day** and acknowledge, (3) **Note any messages** and acknowledge, (4) **Fit for work** declaration, (5) **Clock on**. The Clock on button is enabled only when all three checkboxes are ticked.
- **Stored in shift:** `fit_for_work_declaration` JSONB includes `fit_for_work`, `confirmed_at`, `procedure_acknowledged`, `messages_acknowledged`.
- **Procedure / messages content:** Placeholder text is shown until you add a source (e.g. `system_config`, `site_messages` table, or manager-entered daily notice). You can later make the two acknowledgements optional when there is no content.
- **Other steps:** Optional extensions (e.g. toolbox link, equipment check) can be added on top of this flow.
