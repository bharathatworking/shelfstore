# ShelfStore guidelines

## Code
- React + TypeScript + Tailwind. Small files: one component per file.
- ALL data access goes through src/services/api.ts (async functions returning Promises). Components never import mock data directly.
- Mock data lives in src/data/ as arrays shaped like MongoDB documents (string \_id, ISO date strings).
- Shared UI components live in src/components/ui/. Reuse them; never restyle a one-off.

## Look
- Light mode only. Warm paper feel. No gradients, no glassmorphism, no blur, no emoji, no indigo/violet.
- Page bg #FBFAF7, surfaces #FFFFFF, sunken #F3F1EC, hover #F6F4EF.
- Borders 1px #E5E1D8 (inputs #D1CCC0). Cards have a border, NO shadow.
- Primary #2B4C6F (hover #234058, tint #EAF0F5). Accent #B06C3B, used max once per screen, never on buttons.
- Text #1F1D1A / #5E594F / #8A8375.
- Fonts: Source Serif 4 (600) for h1/h2 and book titles; IBM Plex Sans for UI; IBM Plex Mono for barcodes, ISBNs, shelf codes.
- Sizes: h1 28, h2 22, h3 17 (sans 600), body 15, small 13, caption 11 uppercase.
- Radius: 4px inputs/badges, 6px buttons/cards, 8px modals. Never larger.
- Shadows only on dropdowns and modals.
- Icons: lucide-react, outline, 1.5 stroke.
- Sentence case for all text. No exclamation marks.

## Status badges (pill, 22px, 1px border, fill/border/text)
- success #EDF4EE/#BBD4C1/#3B6B49: available, approved, returned
- warning #FBF2E0/#E8D199/#8A6318: due soon, hold expiring, damaged
- danger  #F9ECEB/#E3BEBA/#9B3B33: overdue, rejected, lost, blocked
- info    #EAF0F5/#C2D2E0/#2B4C6F: on hold, pending
- neutral #F3F1EC/#DEDAD1/#5E594F: borrowed, expired, archived

## States
- Loading = skeleton blocks (#F3F1EC, subtle pulse). Spinners only inside buttons.
- Every list has an empty state: muted lucide icon, h3, one line, optional button.
