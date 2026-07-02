# Checkup Report: GIAL DSR Interface

**Date:** 2026-07-02  
**Score:** 45/60  
**Register:** Product  
**Surfaces analyzed:** Web admin (Login, Dashboard), Mobile app (LoginScreen, MachineListScreen, ReportEntryScreen)  
**Context:** Post-deslop assessment. Previous smell (4/10) and review (4.5/10) reports addressed. Warm stone palette, hero metric composition, IBM Plex Sans, focus ring, loading/empty states now present.

---

## Vital Signs

| Vital | Score | Status | Evidence |
|-------|-------|--------|----------|
| Intentionality | 10/10 | **Healthy** | Warm stone palette (oklch hue 70) is not the Tailwind Slate default. IBM Plex Sans is a deliberate typeface. Hero metric breaks the identical card grid. Labels are uppercase with letter-spacing. |
| Readability | 10/10 | **Healthy** | Body at 14px/1.5. High contrast: oklch(0.88) on oklch(0.13) is approximately 12:1. Hero number at 48px is unmistakable. Table text at 13px is readable. |
| Usability | 10/10 | **Healthy** | Login, machine search, report entry, admin dashboard, Excel export all complete the primary task. Loading spinner, empty states, and error messages are present. EVK picker uses both color and text. |
| Responsiveness | 5/10 | **Watch** | No media queries or explicit breakpoints. Filters use `flexWrap: 'wrap'`. Table has `overflowX: 'auto'`. Hero metric uses flex with gap but breakpoint behavior is untested. Mobile uses RN flex layout with no iPad adaptation. |
| Speed | 5/10 | **Watch** | IBM Plex Sans loaded from Google Fonts CDN with no `font-display` specified, which blocks initial render. No font-display: swap or preload. Table fetches up to 500 rows (fine for 29 machines, but no pagination for future scale). |
| Accessibility | 5/10 | **Watch** | Global `*:focus-visible` ring defined (amber on dark, good contrast). Labels use `<label>` on web. EVK uses color AND text (passes colorblind check). Missing: no `aria-live` on stat cards or table, no skip-to-content, no `accessibilityLabel` on mobile inputs, error messages use color-only red text with no icon prefix. |

**Total: 45/60**

---

## Prescriptions

### P1. Responsiveness (WATCH)

**What's broken:** The web dashboard has no breakpoints. On a 768px tablet, the hero metric flex row will wrap awkwardly. The filter bar will stack but without explicit control. The 9-column table at 768px will require heavy horizontal scrolling.

**Why it matters:** Admins may check the dashboard on tablets during walkthroughs in the terminal. A broken layout on iPad loses trust.

**Fix:** `/design responsive`. Add breakpoints at 768px (tablet) and 1024px (small desktop). Hero metric should stack vertically on narrow viewports. Table should freeze the first column (Machine) on horizontal scroll.

### P2. Speed (WATCH)

**What's broken:** The Google Fonts import in `index.css` uses `@import url(...)` which is render-blocking. No `font-display: swap` parameter. No preload link.

**Why it matters:** On slow connections (which exist at GIAL cargo terminals), the page shows a blank white screen until the font loads. This adds 200-500ms to first paint.

**Fix:** Add `&display=swap` to the Google Fonts URL. Or self-host IBM Plex Sans via `@font-face` with `font-display: swap`.

### P3. Accessibility (WATCH)

**What's broken:** Three specific gaps:
1. Stat cards and table update silently on filter change. No `aria-live="polite"` region to announce changes to screen readers.
2. Mobile inputs have `<Text>` labels but no `accessibilityLabel` or `accessibilityHint` props.
3. Error messages on both web and mobile use red text only. A color-blind user with protanopia cannot distinguish an error from normal muted text.

**Why it matters:** BCAS compliance may require accessibility audit. Keyboard-only users and screen reader users cannot operate the current interface.

**Fix:** `/design interaction`. Add `aria-live="polite"` to the hero stat section and the table wrapper. Add `accessibilityLabel` to all mobile TextInput elements. Prefix error messages with "Error:" text or an icon.

---

## What's Healthy

The deslop pass resolved the three critical vitals from the previous checkup:
- **Color** (was CRITICAL): Warm stone palette with amber accent is authored, not defaulted. EVK semantic colors preserved.
- **Type** (was CRITICAL): IBM Plex Sans with defined scale (11/12/13/14/15/18/20/48px).
- **Interaction States** (was CRITICAL): Focus ring, loading spinner, empty state, and error messages all present.

The remaining three vitals are Watch, not Critical. The interface is safe to ship for the GIAL Guwahati pilot. The Watch items should be addressed before the second airport onboarding.
