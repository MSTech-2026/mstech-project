# Smell Report: GIAL DSR Interface

**Date:** 2026-07-02  
**Score:** 4/10 — STRONG  
**Register:** Product  
**Surfaces analyzed:** Web admin (Login, Dashboard), Mobile app (LoginScreen, MachineListScreen, ReportEntryScreen)

---

## Verdict

The interface is competent and functional but smells unmistakably of the Tailwind Slate dark-mode admin template. Every color, layout shape, and type decision could have come from a default Vite + Supabase starter kit. The design makes zero project-specific decisions that could not be moved into an unrelated dashboard.

---

## Heuristics

| Odor | Present | Evidence |
|------|---------|----------|
| Tech gradient | No | No gradients anywhere. Clean. |
| **Generic tech hue** | **Yes** | `#3b82f6` (Tailwind blue-500) is the sole primary accent. Every SaaS admin uses this blue. No airport, security, or aviation-specific reason for it. |
| **Feature tile grid** | **Yes** | Dashboard shows 5 identical stat cards in a flex row: Today's Reports, Verified, Failed, Avg Sample Count, Completion. Each is a `centered` label + number in a `#1e293b` box. No hierarchy, no variation, no prioritization. |
| Accent rail | No | No decorative side-stripe borders. |
| Unearned blur | No | No glassmorphism. |
| **Stat monument** | **Yes** | `font-size: 24px; font-weight: 700` for the numbers. They're the visual center of the dashboard, sized and weighted to dominate, but they don't carry any sense of what to do about them. |
| Icon topper | No | No decorative icons on sections. |
| Bounce everywhere | No | No animation at all. |
| **Default type** | **Yes** | `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`. No reason, no voice. The system stack appeared because no choice was made. |
| **Center stack** | **Yes** | Both Login screens (web and mobile) are the universal centered-card-on-dark-background pattern. The web dashboard has `flex-direction: column; align-items: center` behavior for the stat row. No composition decision was made. |

**Heuristic sum:** 5/10 absent → Score: 4/10

---

## Structural Findings

### S1. The Tailwind Slate Prison

Every neutral in this interface comes from the Tailwind Slate scale:

- Background: `#0f172a` (slate-900)
- Card surface: `#1e293b` (slate-800)
- Border: `#334155` (slate-700)
- Muted text: `#94a3b8` (slate-400)
- Secondary text: `#64748b` (slate-500)
- Primary text: `#e2e8f0` (slate-200)
- Bright text: `#ffffff`

This is literally the `tailwind.config.js` dark mode preset copy-pasted. A single chromatic tint toward the domain (aviation blue-grey? security green? warm earth?) would differentiate this immediately. As-is, it is indistinguishable from 10,000 other admin panels built since 2022.

### S2. Five Identical Stat Cards

The dashboard stat row (`statsRow`) renders 5 cards with identical styling:

```
flex: '1 1 140px'
backgroundColor: '#1e293b'
borderRadius: '8px'
padding: '16px'
border: '1px solid #334155'
textAlign: 'center'
```

There is no differentiation between "Today's Reports: 14/29" (the primary operational indicator) and "Avg Sample Count: 47" (a secondary metric). They have the same size, same weight, same container. If a technician needs to know one thing at a glance, the design does not tell them which thing that is.

The stat monument smell is structural: these cards fill the upper 25% of the dashboard with numbers that demand attention but offer no call to action.

### S3. Composition Absence in the Data Table

The report table renders 9 columns in a single scrollable band with `white-space: nowrap`. This is the table layout that data-grid libraries use as a default. The EVK status column uses colored bubbles (`#065f46` for verified, `#7f1d1d` for failed, `#78350f` for bypass), which is the correct pattern for status indicators. But the filter bar above it is a uniform flex row of groups with no visual connection to the table below.

### S4. Mobile Card List

The `MachineListScreen` renders machines as `#1e293b` cards with a serial number, model tag, and location. The model tag (`#3b82f6` text on `#1e3a5f` background) is the only visual distinction between machines. The search bar is identical to the Login input field.

### S5. EVK Buttons in ReportEntry

The EVK status picker uses solid-colored backgrounds: green for verified, red for failed, amber for bypass. This is the right visual pattern for safety-critical status selection and is one of the few domain-specific design decisions in the entire interface. Do not remove this in a cleanup pass.

---

## What This Is Not

This is not a badly built interface. The data flows work, the layout is legible, the touch targets are adequate, the status colors are correct. The smell is not incompetence. It is absence of authorship. The interface was generated rather than designed.

---

## Severity Map

| Area | Severity | Fix Mode |
|------|----------|----------|
| Slate-scale color system | High | `/design recolor` |
| Identical stat cards | High | `/design relayout` |
| System font stack | Medium | `/design typeset` |
| Centered login screens | Low | `/design relayout` |
| Missing composition hierarchy | High | `/design relayout` or `/design redesign` |

---

## Fix Guidance

The dominant smell is **domain-reflex color** (Slate + Blue admin template) paired with **composition absence** (identical cards, no hierarchy). A `redesign` pass that picks a color strategy and restructures the dashboard composition would clear most smells in one pass.

An airport security compliance tool has a natural visual lane that is not the Tailwind dark admin template. The domain suggests: urgency when equipment fails, calm when everything passes, precision in data display, and the weight of regulatory compliance. None of those come through.
