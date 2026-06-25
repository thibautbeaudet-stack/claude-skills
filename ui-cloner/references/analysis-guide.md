# UI Analysis Guide

This guide defines what to extract from screenshots in each of the five analysis dimensions. Apply all dimensions to every screenshot, then synthesize across all images.

---

## Dimension 1 — Design Tokens

Extract the raw visual values that define the product's visual identity.

### Colors
- **Primary palette**: main brand color(s), with hex/rgb values
- **Secondary/accent**: supporting colors used for highlights, CTAs, badges
- **Neutral scale**: grays used for text, borders, backgrounds (list all distinct shades)
- **Semantic colors**: success (green), warning (yellow/orange), error (red), info (blue) — exact values
- **Background layers**: page bg, card bg, modal bg, sidebar bg — note if dark/light mode is detected
- **Text colors**: heading, body, muted/secondary, placeholder, disabled
- **Surface colors**: input bg, hover bg, selected bg, focus ring color

Output format per color:
```
name: Primary Blue
hex: #2563EB
usage: CTA buttons, active nav items, links
```

### Typography
- **Font families**: identify serif/sans-serif/monospace, guess font name if possible (e.g. Inter, SF Pro, Geist)
- **Type scale**: list every distinct font size observed (px or rem estimate)
- **Font weights**: all weights used (300/400/500/600/700/800)
- **Line heights**: estimate for body text, headings, compact/dense text
- **Letter spacing**: tight (headings), normal (body), wide (labels/caps)
- **Text transforms**: any uppercase, capitalize patterns on labels or nav items

### Spacing
- **Base unit**: identify the spacing grid (4px, 8px, or other)
- **Component padding**: estimate inner padding of buttons, cards, inputs, nav items
- **Section gaps**: vertical gap between page sections
- **Content gaps**: gaps between list items, form fields, grid cells

### Shape
- **Border radius scale**: none/sm/md/lg/full — list all values observed
- **Border widths**: 1px, 2px, etc. and where each is used
- **Border colors**: list distinct border colors (often neutral-200, neutral-700 in dark mode)

### Elevation / Shadows
- **Shadow levels**: none, subtle, card, elevated, modal — describe each
- **Shadow style**: hard (brutalist), soft (neumorphic), standard drop shadow
- **Blur/spread**: estimate blur radius and spread for each level

---

## Dimension 2 — Component Inventory

Identify every distinct UI component present across all screenshots.

For each component, document:
```
Component: [Name]
Variants: [list of visual variants, e.g. primary/secondary/ghost/destructive]
States: [default, hover, active, focus, disabled, loading, selected, error]
Anatomy: [list of sub-elements, e.g. icon + label + badge]
Size options: [sm/md/lg or specific sizes observed]
Usage context: [where it appears in the product]
Notable details: [any unusual or distinctive visual treatment]
```

Common components to look for (document all that appear):
- **Navigation**: top nav, sidebar, tab bar, breadcrumb, pagination
- **Buttons**: all variants and sizes
- **Inputs**: text input, textarea, select/dropdown, checkbox, radio, toggle/switch, slider
- **Cards**: content cards, metric cards, list items
- **Data display**: tables, lists, grids, timelines
- **Feedback**: alerts, toasts/notifications, banners, badges, progress bars, skeletons
- **Overlays**: modals, drawers, tooltips, popovers, context menus
- **Media**: avatars, images, icons (style: outlined/filled/duotone)
- **Charts**: if present, note chart types and color usage
- **Empty states**: illustrations or placeholder content
- **Headers**: page titles, section headings with actions

---

## Dimension 3 — Layout Structure

Document how pages and sections are organized.

### Page-Level Layout
For each distinct page/screen:
```
Page: [name, e.g. Dashboard, Settings, Login]
Layout type: [single column / sidebar + content / split panel / full-width / centered]
Header: [fixed/sticky/none, height estimate, contents]
Sidebar: [left/right/none, width estimate, collapsible?]
Main content: [max-width, padding, scroll behavior]
Footer: [present/none, sticky?]
```

### Grid System
- **Column count**: 12-col, 16-col, or custom
- **Gutter width**: gap between columns
- **Container max-width**: estimate (e.g. 1280px, 1440px, full-width)
- **Breakpoints**: infer from layout if multiple screen sizes are shown

### Section Patterns
- **Card grids**: how many cards per row, gap between cards
- **List layouts**: single-column list vs. split-pane vs. master-detail
- **Form layouts**: single-column vs. multi-column, label position (top/left/floating)
- **Dashboard widgets**: arrangement, relative sizing, scrollable regions

### Navigation Structure
- **Primary nav**: top bar / left sidebar / bottom tab bar
- **Secondary nav**: sub-navigation, tabs within pages, breadcrumbs
- **Active state**: how the current page/section is indicated
- **Collapse behavior**: is the sidebar collapsible? icon-only mode?

---

## Dimension 4 — Visual Style

Identify the overall aesthetic language of the product.

### Style Classification
Match against one or more of the following (multiple can apply):

| Style | Key Indicators |
|-------|----------------|
| **Minimalism** | Lots of whitespace, few colors, thin typography, minimal decoration |
| **Flat Design** | No shadows/gradients, solid colors, clean geometry |
| **Material Design** | Elevation shadows, ripple effects, FAB buttons, card-heavy |
| **Glassmorphism** | Frosted/blurred backgrounds, semi-transparent surfaces, light borders |
| **Neumorphism** | Soft inset/outset shadows on same-color background, tactile feel |
| **Claymorphism** | Puffy 3D shapes, saturated pastels, thick borders |
| **Brutalism** | Raw typography, high contrast, intentional "ugly" aesthetics, harsh borders |
| **Bento Grid** | Mosaic card layout, varied card sizes, grid-dominant composition |
| **Dark Mode** | Dark backgrounds (gray-900+), light text, reduced contrast borders |
| **Skeuomorphism** | Realistic textures, gradients mimicking physical objects |
| **Corporate/SaaS** | Professional, muted palette, structured data-heavy layouts |
| **Playful/Consumer** | Bright colors, rounded shapes, illustrations, friendly tone |

Document:
- Primary style(s) detected
- Confidence level (high/medium/low)
- Key visual evidence from the screenshots

### Brand Expression
- **Tone**: formal / friendly / technical / playful / minimal / bold
- **Imagery**: illustrations (flat/3D/hand-drawn), photos, icons only, no imagery
- **Icon style**: outlined / filled / duotone / custom / emoji
- **Animation hints**: any motion indicators (spinners, progress, skeleton screens suggest animation is used)

---

## Dimension 5 — Interaction Patterns

Infer interaction behavior from static visual cues.

### State Indicators
Look for and document:
- **Hover states**: buttons/cards that appear to have hover styling (subtle bg change, border, shadow lift)
- **Active/selected states**: highlighted nav items, selected rows, active tabs
- **Focus states**: focus rings visible on inputs or buttons
- **Disabled states**: grayed-out or reduced-opacity elements
- **Loading states**: spinners, skeleton screens, progress bars, shimmer effects
- **Error states**: red borders, error text, alert icons on inputs
- **Empty states**: placeholder content, zero-data illustrations

### Feedback Patterns
- **Toast/notification**: position (top-right, bottom-center, etc.), style
- **Inline validation**: where error messages appear relative to inputs
- **Success confirmation**: how successful actions are communicated
- **Destructive actions**: warning modals, red buttons, confirmation dialogs

### Micro-interaction Hints
- **Expandable sections**: accordions, collapsible panels (look for chevron icons)
- **Drag and drop**: drag handles, reorder indicators
- **Infinite scroll vs. pagination**: presence of pagination controls or load-more buttons
- **Keyboard shortcuts**: any visible shortcut hints (⌘K, /, etc.)
- **Tooltips**: hover-triggered labels visible on icons or truncated text

---

## Synthesis Rules

When combining findings across multiple screenshots:

1. **Merge tokens**: if a color appears on multiple pages, it's confirmed. If only once, mark as "observed once — confirm".
2. **Prefer the most complete value**: if spacing is 8px on most pages but 6px on one, note both but flag the 8px as primary.
3. **Union of components**: include every component seen across all pages — do not exclude components just because they appear on only one page.
4. **Resolve conflicts explicitly**: never silently pick one value over another. Document: `Primary button: #2563EB (3 pages) / #1D4ED8 (1 page) — likely same color, rendering difference`.
5. **Page inventory**: list every distinct page/screen identified, even if analysis is incomplete for some.
