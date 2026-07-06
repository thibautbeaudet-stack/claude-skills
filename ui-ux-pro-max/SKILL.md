---
name: ui-ux-pro-max
description: AI-powered design intelligence with 84 UI styles, 161 color palettes, 73 font pairings, 99 UX guidelines, and 25 chart types across 17 tech stacks. Use when choosing UI styles, color palettes, typography, chart types, or UX patterns for any frontend project.
license: MIT
source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
---

# UI/UX Pro Max

Design intelligence toolkit with searchable databases of UI styles, color palettes, font pairings, chart types, and UX guidelines.

## Search Command

```bash
python3 /home/user/claude-skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>
```

## Domains

- `style` — UI styles (glassmorphism, minimalism, brutalism) + CSS keywords
- `color` — Color palettes by product type
- `typography` — Font pairings with Google Fonts imports
- `product` — Product type recommendations (SaaS, e-commerce, portfolio)
- `chart` — Chart types and library recommendations
- `ux` — Best practices and anti-patterns
- `landing` — Page structure and CTA strategies
- `gsap` — GSAP animation skeletons (hover, scroll, parallax, etc.)

## Options

```bash
# Stack-specific output (default: html-tailwind)
python3 .../search.py "<query>" --stack react   # or nextjs, vue, svelte, shadcn...

# Design system mode with dials (1-10)
python3 .../search.py "<query>" --design-system --variance 7 --motion 5 --density 3
```

Available stacks: `html-tailwind`, `react`, `nextjs`, `astro`, `vue`, `nuxtjs`, `svelte`, `react-native`, `flutter`, `shadcn`, `swiftui`, `threejs`, `angular`, `laravel`

## Examples

```bash
# Find a luxury e-commerce color palette
python3 /home/user/claude-skills/ui-ux-pro-max/scripts/search.py "luxury retail" --domain color

# Get typography for a SaaS dashboard
python3 /home/user/claude-skills/ui-ux-pro-max/scripts/search.py "dashboard" --domain typography --stack react

# Find scroll animation snippets
python3 /home/user/claude-skills/ui-ux-pro-max/scripts/search.py "scroll reveal" --domain gsap
```

## Usage Pattern

When designing a UI, run a search first to ground your choices, then apply the results to the implementation.
