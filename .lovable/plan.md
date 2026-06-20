
## Goal

Adopt estudycard.com's professional structure and visual rhythm across the whole GPGC Portal — keeping the **existing palette** (sky-blue `#0EA5E9` primary, navy text, off-white background) and current fonts. Only **layout, composition, components, hierarchy** change.

## What I'll borrow from estudycard.com

- Clean **white top header** with logo left, horizontal nav center, profile/login right (replaces the dense sidebar on public + marketing pages).
- **Hero**: bold heading + tagline + dual CTA on the left, illustrated phone/dashboard mockup on the right, with a soft tinted background block.
- **Key Features grid**: 6–12 emoji/icon pill-cards, 3-column on desktop, 2-on tablet, 1-on mobile.
- **Why Choose Us**: 3-column card row with circular icon, title, 2-line description, subtle hover lift.
- **Section rhythm**: alternating white and tinted (`bg-muted/30`) full-width bands, generous vertical padding (`py-20`), max-w-6xl centered.
- **Footer**: 4-column (Brand / Quick Links / Resources / Contact) + bottom bar with "Developed By: MYNT".
- **Card style**: rounded-2xl, soft shadow, 1px border, hover translate-y + shadow-lg.
- **Buttons**: solid primary pill with shadow, ghost outline secondary.

## Pages to rework

```
Phase 1 — Shell & Landing (this turn)
├── src/index.css            tighten tokens (radius 0.75rem, softer shadows, section bg)
├── MainLayout.tsx           hybrid: top-nav on public/marketing routes, sidebar on app routes
├── components/layout/
│   ├── PublicHeader.tsx     NEW — white top nav, logo, links, login/avatar
│   └── PublicFooter.tsx     NEW — 4-col footer
├── pages/Index.tsx          hero + features grid + why-choose + CTA band
└── pages/Home.tsx           student dashboard restyled as estudycard "after-login" card grid

Phase 2 — Core student pages
├── Preparation.tsx          split-screen kept, but cards & headers restyled
├── Competition.tsx          stats cards row + table in white card
├── Forum.tsx                3-col layout with sticky right sidebar
└── AITutor / AI Workspace   tab pills row + white chat surface

Phase 3 — Admin & misc
├── Admin.tsx                left tabs + white content card
├── Login.tsx                split-screen: form left, illustration + brand right
├── Coins.tsx, HowItWorks.tsx restyled hero + cards
```

## Technical notes

- No new color palette. Reuse `--primary`, `--secondary`, `--muted` etc. as-is.
- Add 3 utility classes in `index.css`: `.section`, `.section-tinted`, `.feature-card` for the new rhythm.
- Add `--radius: 0.75rem` and a softer `--shadow-lg`.
- Routing: `MainLayout` checks `location.pathname`; public routes (`/`, `/how-it-works`, `/login`) use `PublicHeader`+`PublicFooter` (no sidebar). App routes keep the existing sidebar shell but get the polished header bar and card styles.
- No backend/business-logic changes. No new dependencies.
- Existing components (Mesh Chat, VT Notes, Quiz, Key Notes cleaner, etc.) untouched — only their container shells restyled.

## Delivery

I'll ship **Phase 1 first** (shell + landing + Home) so you can verify the new look. Once approved I'll roll the same system into Phases 2 and 3 in follow-up turns. Each phase is self-contained — the app keeps working between phases.

Reply **"go"** to start Phase 1, or tell me which phase to prioritize.
