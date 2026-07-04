# Checkup Report: GIAL DSR Admin Portal

**Date:** 2026-07-04
**Score:** 40/60
**Register:** Product
**Surfaces analyzed:** Login, DailyView (Dashboard), MonthlyReport, Select component
**Context:** Post-rebuild. Stack: React 18 + Vite, GSAP animations, custom Select component, exceljs exports, warm/cool color tokens via CSS variables.

---

## Vital Signs

| Vital | Score | Status | Evidence |
|-------|-------|--------|----------|
| Intentionality | 8/10 | **Healthy** | Brand palette (midnight blue + accent blue), defined shadow scale, Inter/Poppil font stack, structured sidebar/top-bar layout. Looked chosen. |
| Readability | 5/10 | **Watch** | Body at 14px, line-height 1.5. Some inline `font-size: '12px'` overrides (table timestamps, sample counts). Color contrast on dark mode text-0 (#F9FAFB) on bg-2 (#1F2937) is high (~13:1) but light mode text-1 (#475569) on bg-0 (#F8FAFC) is ~7:1 (borderline AAA). |
| Usability | 8/10 | **Healthy** | Login flow works. Dashboard has date/EVK/machine filters + Export. Monthly report has month selector + Export. Core task (log in → view reports → export) is completable. |
| Responsiveness | 3/10 | **Watch** | `content-body` has `@media (max-width: 1024px)` for column stacking. No breakpoints below 1024px tested. Monthly pivot table is `overflowX: 'auto'` inside `minWidth: '100%'` table — at 480px the 31-day columns + machine column = 36+ units width will scroll heavily. No RTL/direction handling. |
| Speed | 5/10 | **Watch** | GSAP imports are bundled eagerly even when not animating. `exceljs` (~150KB gzipped) and `file-saver` are in main bundle despite only being needed for two buttons. No code splitting. |
| Accessibility | 1/10 | **Critical** | No `aria-label` on any icon-only button (logout, refresh, sidebar nav). No `aria-live` for hero stat or table. No skip-to-content link. Login error uses color-only red text with no "Error:" prefix (we added this earlier in mobile, not here). Tab order not tested. No focus-visible styles on buttons. |

**Total: 40/60**

---

## Prescriptions

### P1. Accessibility (CRITICAL)

**What's broken:**
- Logout button has only an emoji character as label, no `aria-label`
- Sidebar nav items have no semantic `role` or `aria-current`
- Hero stat updates silently (no `aria-live`)
- Table updates silently when filter changes
- Login form errors use red color only (accessibility failure for protanopia)
- No skip-to-content link for keyboard users

**Why it matters:** This is a security compliance tool used by airport staff under regulatory pressure. Keyboard-only and screen-reader users cannot operate it. BCAS audit requirements likely include accessibility compliance.

**Fix:** `/design interaction` — add `aria-label` to icon buttons, `aria-live="polite"` to dynamic content, "Error:" prefix to login errors, skip-to-content link.

### P2. Responsiveness (WATCH)

**What's broken:** No mobile breakpoints below 1024px. Monthly pivot table (29 machines × 31 days) will overflow heavily on phones.

**Why it matters:** Sysadmins may check the dashboard on tablets during walkthroughs. The monthly report is exactly the view a CSO would open on an iPad before a board meeting.

**Fix:** `/design responsive` — add 768px breakpoint (tablet) and 480px breakpoint (phone). Consider switching the monthly pivot to a stacked card view on phones.

### P3. Speed (WATCH)

**What's broken:** `exceljs` (~150KB gzipped) and `file-saver` are in the main bundle despite only being needed when the user clicks Export.

**Why it matters:** On slow connections (cargo terminals), a 200-400KB larger initial bundle is meaningful. The export code is not needed until the user explicitly wants it.

**Fix:** Use `import()` dynamic imports for `excel.ts` inside the export handler. Reduces initial bundle by ~150KB.

### P4. Readability (WATCH)

**What's broken:** Light mode text contrast is borderline at #475569 on #F8FAFC. Some table cell text is 12px which is below the 14px body baseline.

**Why it matters:** Aging workforce in airport operations. WCAG AA requires 4.5:1 for body text. Current is ~7:1 which is technically AA, but for a tool used 8+ hours a shift, AAA (7:1+) for body text is the right target.

**Fix:** `/design recolor` — deepen `--text-1` from #475569 to #334155. Audit all 12px text and either bump to 13px or confirm it's truly secondary (timestamps, technical IDs).

---

## What's Healthy

- **Intentionality:** The brand palette (midnight blue + accent blue) and the Poppins/Inter pairing are deliberate choices, not defaults. The shadow scale uses brand hue, not generic black.
- **Usability:** The core flow is completable. Login, dashboard, monthly report, and export all function.
- **Composition:** The sidebar/top-bar/data pattern is a known monitor surface, and the metrics card on the left + filter bar above the data table is a valid compare composition.
- **No generative design tells:** This is not Tailwind Slate + Blue-500. The accent blue (#2563EB) is committed with a reason. The shadow system uses brand-tinted colors.

## What's Inherited (Not Implemented Yet)

- No onboarding flow for first-time admins
- No notification or toast system (errors just appear as text)
- No undo for admin actions (e.g., machine management)
- No bulk operations
- No data export beyond the two prescribed formats
- No accessibility audit evidence

## Edge State Audit

- **Empty dashboard:** Shows "No reports found" + context text. Works.
- **Empty monthly report:** Shows "No reports for [Month]" with helpful subtext. Works.
- **Failed login:** Shows red error message, but the "Error:" prefix was removed when the CSS was refactored. Color-only failure for color-blind users.
- **Network failure:** No retry button. The error appears once and the user must manually refresh.
- **Session expired:** The `getUser()` call will fail, the app will set `loading=false` with no profile, and the user sees the login screen. No explicit "Session expired" message.

## Resolved From Previous Checkup

- Focus ring is now global (`*:focus-visible`)
- Loading and empty states are present on both Daily and Monthly views
- TypeScript compiles with 0 errors
- Vite build succeeds

## Files Touched

- `packages/web/src/components/Dashboard.tsx` — tab nav (Daily/Monthly)
- `packages/web/src/components/MonthlyReport.tsx` — new pivot view
- `packages/web/src/components/Select.tsx` — custom dropdown with keyboard nav
- `packages/web/src/lib/excel.ts` — exceljs with colored EVK cells
- `packages/web/src/index.css` — full design token system

## Verdict

The interface has crossed from "looks generated" to "looks intentional." The product can be demoed. The remaining Watch/Critical items are polish and production-readiness, not showstoppers.

**Safe to demo:** Yes.
**Safe to ship to GIAL:** Not yet. Fix P1 (accessibility) and run a 1-day shadow logging period.
