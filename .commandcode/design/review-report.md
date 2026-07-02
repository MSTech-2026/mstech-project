# Review Report: GIAL DSR Interface

**Date:** 2026-07-02  
**Register:** Product  
**Score:** 4.5/10  
**Surfaces analyzed:** Web admin (Login, Dashboard), Mobile app (LoginScreen, MachineListScreen, ReportEntryScreen)

---

## Gut Reaction

It looks like a Supabase template someone dark-themed. The data is real and the flows work, but the design doesn't carry any weight from its domain. An airport security compliance system should feel precise, operational, and authoritative. This feels generic.

---

## Lens Scores

| Lens | Score | Notes |
|------|-------|-------|
| First Impression | 4/10 | Dark admin with blue buttons. Could be any SaaS. Nothing says "security compliance" or "GIAL" or "Aviation." |
| Hierarchy | 3/10 | 5 identical stat cards. No primary metric. Table and stats compete for attention. Filter bar is disconnected. |
| Color Voice | 3/10 | Tailwind Slate. The only domain color is the EVK status picker (green/red/amber). Everything else is grey. |
| Type Voice | 5/10 | System fonts are fine for product UI. But no scale, no weight contrast. The 11px/12px/13px cluster at the bottom is too tight. |
| Interaction Feel | 4/10 | No hover on stat cards, no loading states, no transitions. The EVK button active states are good. Login form is clean. |
| Data Presentation | 6/10 | Table is the right pattern. Column headers are clear. EVK bubbles work. The "—" for missing failure reason is good. Filter controls are correct. |
| Mobile Experience | 6/10 | MachineList is well-structured for touch. Search is accessible. ReportEntry form is clear. EVK picker is strong. Success state is satisfying. |
| Completeness | 5/10 | Core flows work. Missing: error states for network failure, loading skeleton, empty state for no machines, confirmation before logout. |

---

## Detailed Walkthrough

### Login (Web)
The centered card is the universal pattern. It works, but the `#1e293b` card on `#0f172a` background is almost invisible (only a subtle border). The card needs more separation or the background needs to be slightly lighter. The blue "Sign In" button is the only color on the screen.

### Login (Mobile)
Same issue. The form is clean but the background-card contrast is weak. The "GIAL DSR" title at 32px is fine but has no mark or identity.

### Dashboard
**The stat cards are the main problem.** 5 identical boxes with a number and label, no hierarchy, no action. The primary question for an admin is: "Have all 29 machines been logged today?" The answer should be the first thing they see, in a different size or treatment than the other four metrics.

**The filter bar works functionally** but is visually disconnected from the table. No visual feedback that a filter is active (except by checking the dropdown values).

**The data table is the best element.** Column order makes sense. EVK status bubbles are correctly colored. Time column uses India timezone. The table is scrollable horizontally, which is correct for 9 columns.

### MachineList (Mobile)
Good structure. The search bar is wide enough, the serial number is prominent, the model tag differentiates IONSCAN from Itemiser. The sync banner at the top (amber) is visible but not aggressive. The greeting "Hello, [name]" is a nice human touch.

**Missing:** What happens when there are zero machines? What happens when search returns nothing?

### ReportEntry (Mobile)
The EVK picker is the strongest design element in the entire product. Green, red, amber with semantic meaning. The failure reason text field only appears when EVK=failed, which is correct progressive disclosure.

**Missing:** What happens if sample count is 0? Is that valid? The form allows it but doesn't confirm it's intentional.

---

## Verdict

The data layer is solid. The flows are correct. The interface is usable. What it lacks is any sense of belonging to its domain. The fix is not a full rebuild. The most impactful changes are:

1. **Break the stat card grid** — give the primary metric visual dominance
2. **Tint the neutrals** — shift Slate towards a warm operational grey
3. **Add focus rings** — the keyboard accessibility is currently broken
4. **Add loading and empty states** — the dashboard shows nothing during fetch
