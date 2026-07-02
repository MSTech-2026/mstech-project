# GIAL DSR Design Constitution

## Register

**Product.** This is an instrument, not an experience. The interface earns trust through consistency, speed, and precision. Operators (technicians and admins) open these screens daily. They should move without thinking.

## Users and Context

**Field Technician** — On the ground at Guwahati International Airport. Uses a handheld mobile device (iOS/Android via Expo) in noisy, sometimes low-connectivity environments (baggage halls, cargo warehouses). Pressure: complete 29 machine verifications per shift before the next shift begins. Needs fast search, large touch targets, clear status indicators, and offline capability.

**Admin** (Lead Security Officer, Duty Manager, CSO) — At a desk in the airport operations office. Uses a desktop browser. Pressure: ensure 100% machine verification coverage daily, respond to BCAS audit requests within minutes, identify equipment faults before they cause operational delays. Needs real-time dashboard, filterable data, instant Excel export.

**SysAdmin** (AAHL Central IT) — Remote or centralized. Uses a desktop browser. Pressure: onboard new airports (Mumbai, Navi Mumbai, Ahmedabad) without data leakage between sites. Needs site provisioning, user management, role assignment.

## Product Purpose

Digitize the daily pre-operational verification of 29 Explosive Trace Detection (ETD) machines at GIAL, replacing a paper-based workflow that produces 5% log gaps, 12-24 hour fault detection delays, and 2-3 day audit compilation times. The system must enforce BCAS compliance, maintain immutable audit trails, and scale to multiple AAHL airports.

## Voice

**Precise. Operational. Authoritative.** This is a security compliance tool, not a startup dashboard. The voice should feel like a well-maintained control room: clear labels, no decoration, no enthusiasm. Sentence case everywhere. No exclamation points. Errors state what happened and what to do next. Empty states explain what belongs here and how to fill it.

## Anti-References

- **Tailwind Slate dark mode** — The default `#0f172a` through `#e2e8f0` palette with `#3b82f6` accent. Every AI-generated admin panel since 2022.
- **Generic SaaS dashboard** — 5 identical stat cards in a row, centered hero, blue CTA buttons, Inter font.
- **Blue-purple tech aesthetic** — Indigo-to-violet gradients, cyan accents, "AI startup" visual language.
- **Startup enthusiasm** — Exclamation points, "Welcome back!", "Great job!", motivational empty states.

## Design Principles

1. **The primary metric dominates.** "Have all 29 machines been logged today?" is the first question. The answer gets the largest type, a progress bar, and the top-left position. Secondary metrics (verified count, failed count, bypass count) are smaller, to the right.

2. **Status uses color AND shape.** EVK status (verified/failed/bypass) is communicated through both colored backgrounds AND text labels. Never color alone. A color-blind user with protanopia must still distinguish verified from failed.

3. **Offline is a state, not an error.** When a technician submits a report offline, the UI says "Saved locally. Will sync when connection is restored." It does not say "Error: no connection." The sync banner is informational, not alarming.

4. **Labels are always visible.** Form fields use visible labels above the input, not placeholder text. Placeholders show format examples ("0", "you@gial.com") and disappear on focus.

5. **One verb per button.** "Sign in", "Export .xlsx", "Refresh", "Submit report". Not "OK", "Confirm", "Yes".

6. **Data is immutable once submitted.** Daily reports are read-only after the 2-hour edit window. Corrections are a separate record linked to the original. The UI never suggests overwriting audit data.

7. **Restraint over decoration.** No gradients, no glassmorphism, no decorative icons, no animated transitions. The interface is a tool. It earns trust through precision, not polish.

## Accessibility

- **Focus ring:** 2px solid amber (`--focus`), offset 2px, on all interactive elements via `*:focus-visible`.
- **Contrast:** Body text at minimum 7:1 against background. Status colors at minimum 4.5:1 against their backgrounds.
- **Keyboard:** All interactive elements reachable via Tab. Login form, filters, table rows, export button all keyboard-operable.
- **Screen reader:** Labels connected to inputs via `<label>`. Dynamic content (stat cards, table updates) should use `aria-live="polite"` (not yet implemented).
- **Color blindness:** EVK status uses color + text, never color alone. Verified (green), failed (red), bypass (amber) are distinguishable in deuteranopia, protanopia, and tritanopia simulations.
- **Reduced motion:** No animation currently exists. If animation is added, respect `prefers-reduced-motion`.

## Visual Foundation

### Color (OKLCH)

**Strategy:** Whisper. Near-neutral surfaces with one accent for primary actions. Semantic colors for status.

| Role | Variable | OKLCH | Hex (approx) | Use |
|------|----------|-------|---------------|-----|
| Background 0 | `--bg-0` | oklch(0.10 0.01 70) | #171412 | Page background |
| Background 1 | `--bg-1` | oklch(0.14 0.01 70) | #1e1b18 | Header, hero section |
| Background 2 | `--bg-2` | oklch(0.18 0.01 70) | #272320 | Cards, form inputs |
| Background 3 | `--bg-3` | oklch(0.22 0.01 70) | #302b27 | Elevated surfaces |
| Border default | `--border-default` | oklch(0.28 0.01 70) | #3d3732 | Input borders, dividers |
| Text 0 | `--text-0` | oklch(0.94 0.003 70) | #f2efec | Headings |
| Text 1 | `--text-1` | oklch(0.86 0.006 70) | #dbd5cf | Body text |
| Text 3 | `--text-3` | oklch(0.56 0.01 70) | #8c8278 | Labels, muted text |
| Accent | `--accent` | oklch(0.76 0.14 55) | #d4940a | Primary action buttons, progress bar |
| Verified | `--verified` | oklch(0.58 0.14 155) | #3daa6d | Passed EVK status |
| Failed | `--failed` | oklch(0.58 0.20 25) | #d44a3a | Failed EVK status |
| Bypass | `--bypass` | oklch(0.68 0.14 70) | #b89a3d | Bypass EVK status |

**Mobile hex equivalents** are defined in `packages/mobile/src/screens/LoginScreen.tsx` as the exported `colors` object.

### Typography

**Font:** IBM Plex Sans (400, 500, 600, 700). Chosen for precision and technical authority. Loaded from Google Fonts with `display=swap`.

| Step | Size | Weight | Use |
|------|------|--------|-----|
| Hero number | 48px | 700 | Primary metric (machines logged today) |
| Page title | 18-20px | 700 | Header title |
| Section heading | 15-16px | 600 | Machine serial, form section |
| Body | 13-14px | 400 | Table cells, descriptions |
| Label | 11px | 500-600 | Uppercase, letter-spacing 0.5px. Form labels, filter labels, column headers |
| Badge | 10px | 600 | Role badge, EVK bubble |

### Spacing

Based on 4px base unit:
- **Micro (4px):** Icon padding, inline gaps
- **Small (8px):** Label-to-input gap, list item gaps
- **Medium (16px):** Card padding, section padding, form field margins
- **Large (24px):** Hero section padding, section breaks
- **XL (32px):** Page padding, header padding

### Border Radius

- **4px:** Badges, EVK bubbles
- **6px:** Buttons, inputs, filter controls
- **8px:** Cards, machine list items
- **10px:** Login card

## Component Rules

### Buttons
- **Primary:** `background: var(--accent)`, `color: var(--accent-fg)`, `font-weight: 600`. Used for "Sign in", "Export .xlsx", "Submit report".
- **Secondary:** `background: var(--bg-2)`, `border: 1px solid var(--border-default)`, `color: var(--text-2)`. Used for "Refresh", "Sign out".
- **Danger:** `border: 1px solid var(--border-default)`, `color: var(--text-3)`. Used for "Sign out". Subtle, not aggressive.

### Status Indicators
- **EVK Bubble:** 11px, 600 weight, lowercase. Background uses `--verified-bg`/`--failed-bg`/`--bypass-bg`. Text uses `--verified-fg`/`--failed-fg`/`--bypass-fg`.
- **Sync Banner:** `background: var(--warning-bg)`, `color: var(--warning-fg)`. Informational, not alarming.
- **Progress Bar:** 6px height, `background: var(--bg-3)`, fill uses `--accent`. Animated width transition.

### Forms
- Labels are uppercase, 11px, 500 weight, letter-spacing 0.5px, color `--text-3`.
- Inputs have `background: var(--bg-1)`, `border: 1px solid var(--border-default)`, `color: var(--text-1)`.
- Error text uses `--failed` color with visible "Error:" prefix or icon (not yet implemented).

### Tables
- Column headers: uppercase, 11px, 600 weight, letter-spacing 0.8px, color `--text-3`.
- Row hover: `background: var(--bg-2)`.
- Cell text: 13px, color `--text-1`.
- First column (serial number): `font-weight: 500`, `font-variant-numeric: tabular-nums`.

## Responsive Behavior

- **Desktop (1024px+):** Full layout. Hero metric as horizontal row. Filters as horizontal row.
- **Tablet (768px):** Header stacks vertically. Hero metric stacks vertically. Filters wrap. Table scrolls horizontally.
- **Phone (480px):** Filters stack vertically. Filter actions stack vertically. Table cells get tighter padding.
- **Mobile app:** Handled by React Native flex layout. No explicit breakpoints needed.

## Composition Patterns

| Screen | Pattern | Rationale |
|--------|---------|-----------|
| Login | Centered card | Single task, no navigation needed |
| Dashboard | Monitor | Admin needs to see status at a glance, then drill into data |
| Machine List | Explore | Technician searches, filters, and selects from a list |
| Report Entry | Configure | Technician fills a form with structured inputs |

## What This Is Not

This is not a marketing site. It is not a SaaS product with pricing tiers. It is not an AI tool with a terminal aesthetic. It is a security compliance instrument used by airport personnel under regulatory pressure. The design must earn trust through precision, not personality.
