# TapTrao — Design System & Restyling Brief

## Project Overview
TapTrao is a B2B SaaS trade compliance platform for commodity traders importing from Africa into Europe. This document defines the new visual design system that must be applied across the entire React frontend.

## CRITICAL RULE
**Keep ALL existing functionality, routing, auth, API calls, and database connections exactly as they are. Only change the visual styling, CSS, and layout markup.**

---

## Colour Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--green` | `#4ac329` | Primary CTA, active states, success indicators, green accents |
| `--teal` | `#2e8662` | Secondary green, gradients paired with green |
| `--amber` | `#ea8b43` | Warnings, moderate risk, secondary accent |
| `--red` | `#da3c3d` | Errors, high risk, alert badges |
| `--txt` | `#111111` | Primary text on white/light surfaces |
| `--txt2` | `#555555` | Secondary text |
| `--txt3` | `#999999` | Muted text, labels |
| Background | `#000000` | Page/body background — pure black |
| Surfaces | `#1c1c1e` | Cards, sidebar, panels — slightly grey |
| White cards | `#ffffff` | Stat cards, data cards on dark backgrounds |
| Muted white | `rgba(255,255,255,0.35)` | Muted text on dark surfaces |

### Green Glow Effects
- CTA buttons: `box-shadow: 0 4px 18px rgba(74,195,41,0.4)`
- Logo: `box-shadow: 0 0 16px rgba(74,195,41,0.4)`
- Breathing orb (AI CTA): `radial-gradient(circle, rgba(74,195,41,0.28) 0%, rgba(74,195,41,0.06) 50%, transparent 70%)`

### White Card Radial Glows
White stat cards get a subtle colored glow in the top-left corner:
- Green glow: `radial-gradient(circle at 0% 0%, rgba(74,195,41,0.13) 0%, transparent 60%)`
- Amber glow: `radial-gradient(circle at 0% 0%, rgba(234,139,67,0.11) 0%, transparent 60%)`
- Teal glow: `radial-gradient(circle at 0% 0%, rgba(46,134,98,0.12) 0%, transparent 60%)`

---

## Typography

### Font Imports
```html
<link href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
```

### CSS Variables
```css
--fh: 'Clash Display', sans-serif;  /* Headings, numbers, labels */
--fb: 'DM Sans', sans-serif;        /* Body text, buttons, paragraphs */
```

### Scale
- Hero headline: `clamp(38px, 5.5vw, 64px)`, weight 700, letter-spacing -0.04em
- Section headings: `clamp(26px, 3.5vw, 40px)`, weight 700, letter-spacing -0.03em
- Card titles: `16-17px`, weight 600
- Stat values: `24-28px`, weight 700, letter-spacing -0.04em
- Body: `13-14px`, weight 400
- Labels: `11-12px`, weight 600, uppercase, letter-spacing 0.12em
- Badges: `10-11px`, weight 600-700

---

## Border Radius System

| Element | Radius |
|---------|--------|
| Main containers (sidebar, main area) | `18px` |
| Cards (stat, module, pricing) | `16px` |
| Inner header boxes | `16px` |
| Buttons (primary CTA) | `50px` (pill) |
| Buttons (secondary/action) | `8-10px` |
| Icons/avatars | `8-10px` (square), `50%` (circle) |
| Badges/pills | `20-24px` |
| Input fields | `8px` |

---

## Layout Structure

### Overall Page Layout
```
┌─────────────────────────────────────────────┐
│ BODY: #000 (pure black), padding: 10px      │
│ ┌──────────┐ ┌────────────────────────────┐ │
│ │ SIDEBAR  │ │ MAIN CONTENT BOX           │ │
│ │ #1c1c1e  │ │ gradient: dark green → white│ │
│ │ rounded  │ │ rounded 18px               │ │
│ │ 18px     │ │                            │ │
│ │          │ │ ┌────────────────────────┐  │ │
│ │          │ │ │ GREEN HEADER BOX       │  │ │
│ │          │ │ │ (breadcrumb + tabs)    │  │ │
│ │          │ │ └────────────────────────┘  │ │
│ │          │ │                            │ │
│ │          │ │ [Content on white bg]      │ │
│ └──────────┘ └────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Main Box Gradient (dark green → white)
```css
background: linear-gradient(180deg,
  #1a3832 0%, #1d3d35 8%, #1d3d35 16%, #243f37 26%,
  rgba(24,46,32,0.92) 36%, rgba(22,42,30,0.72) 46%,
  rgba(20,38,27,0.45) 56%, rgba(18,34,24,0.2) 66%,
  rgba(255,255,255,0.6) 76%, #ffffff 86%, #ffffff 100%
);
```

### Inner Green Header Box
```css
background: linear-gradient(180deg,
  #0d2218 0%, #0f2a1e 30%, #143424 55%,
  #1a4030 75%, rgba(26,60,44,0.7) 88%, rgba(26,60,44,0) 100%
);
border-radius: 16px;
margin: 0 14px;
```

---

## Component Patterns

### Sidebar
- Background: `#1c1c1e`
- Width: `210px`
- Rounded: `18px`
- Nav items: `13px`, color `#666`, hover `rgba(255,255,255,0.05)`
- Active nav: `background: rgba(74,195,41,0.12)`, color `var(--green)`, left green bar `3px`
- Badges: Red `rgba(218,60,61,0.2)`, Green `rgba(74,195,41,0.15)`
- History cards: `background: rgba(255,255,255,0.04)`, rounded `8px`

### Top Navigation Bar
- Transparent background (sits on the dark green gradient)
- Links: `13px`, color `rgba(255,255,255,0.35)`, active `#fff`
- Icon buttons: `30px` square, `background: rgba(255,255,255,0.07)`, rounded `8px`
- User avatar: `30px` circle, `gradient: var(--green) → var(--teal)`

### White Stat Cards
- Background: `#fff`, rounded `16px`
- Box shadow: `0 4px 20px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)`
- Hover: `translateY(-3px)`, shadow `0 10px 30px rgba(0,0,0,0.14)`
- Colored radial glow via `::before` pseudo-element
- Icon: `36px` square, rounded `10px`, tinted background
- Value: Clash Display, `24-28px`, weight 700

### Dark CTA Card (AI/Action)
- Background: `#0a0a0a`
- Green breathing orb in corner
- Number: Clash Display, `32px`, weight 800, color `var(--green)`
- Button: green with glow shadow

### Dark Content Cards
- Background: `#1c1c1e`, rounded `16px`
- Green top border: `3px` height
- Hover: `translateY(-3px)`, `box-shadow: 0 10px 30px rgba(0,0,0,0.3)`

### Buttons
- Primary: `background: var(--green)`, color `#000`, weight 700, rounded `50px`, glow shadow
- Secondary: `background: rgba(255,255,255,0.06)`, border `1px solid rgba(255,255,255,0.1)`, rounded `50px`
- Small action: `background: rgba(255,255,255,0.06)`, rounded `10px`, border `1px solid rgba(255,255,255,0.1)`

### Status Pills
- Pending: `background: rgba(245,158,11,0.1)`, color amber
- Compliant: `background: rgba(74,195,41,0.1)`, color green
- Review/Risk: `background: rgba(218,60,61,0.1)`, color red

### Table Rows
- White background, hover `var(--grey)`
- Borders: `1px solid #f0f1f1`
- Commodity cells: icon (32px, rounded 8px) + name + HS code subtitle

---

## Animation Patterns

### Breathing Green Orb (AI elements)
```css
@keyframes breathe {
  0%, 100% { transform: scale(1) }
  50% { transform: scale(1.18) }
}
animation: breathe 3.5s ease-in-out infinite;
```

### Pulsing Dot (status indicators)
```css
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(74,195,41,0.5) }
  50% { box-shadow: 0 0 0 6px rgba(74,195,41,0) }
}
animation: pulse 2s ease-in-out infinite;
```

### Card Hover
```css
transition: transform 0.2s, box-shadow 0.2s;
/* On hover: */
transform: translateY(-3px);
```

---

## Pages to Restyle

### 1. Landing Page (Homepage)
- Green gradient hero box with headline "Know your compliance before you commit."
- Trust bar with regulation badges (ECOWAS, AfCFTA, EUDR, etc.)
- White stat cards (4-column grid)
- Free lookup banner (dark card with green left border)
- How it works (3 dark cards with numbered steps)
- Six modules grid (dark cards with colored price badges)
- LC Document Check section (dark cards with green/amber left borders)
- Pricing (4-column pack cards, "MOST POPULAR" with green border ring)
- Footer

### 2. Dashboard
- Sidebar + Main box with dark-green-to-white gradient
- Inner green header box with breadcrumb + tabs
- "Compliance: Pending" title on gradient transition zone
- 4 stat cards (3 white + 1 dark AI CTA)
- Recent Trades table
- Pending Compliance Docs panel
- Required Actions grid

### 3. LC Document Checker
- Same sidebar + main box structure
- Stepper progress (done/active/pending states)
- Upload and results panels
- Document validation cards

### 4. All Other Pages
- Apply the same dark theme, card patterns, and green accents
- Maintain consistent sidebar + main box structure

---

## Files to Reference
The following HTML mock files in the repo show the exact target design:
- `design-refs/homepage.html` — Landing page design
- `design-refs/dashboard.html` — Dashboard design
- `design-refs/lc-checker.html` — LC Checker design

These are visual references only. Extract the CSS patterns from them but keep the React component logic intact.
