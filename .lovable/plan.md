## Goal
Apply a cohesive **Midnight Indigo** visual system across the app shell and the AI Workspace (Mesh Chat + VT Notes), with modern, responsive, accessible UI.

## Visual System (Midnight Indigo)
Theme tokens in `src/index.css` (HSL), dark-first with refined light mode:

- `--background` deep navy `#0a0a1a` (240 60% 6%)
- `--card` / surface `#141432` (240 50% 14%)
- `--border` indigo-tinted `#1e1e5a` (240 50% 24%)
- `--primary` electric indigo `#4f46e5` (243 75% 59%) + `--primary-glow` `#7c6dff`
- `--accent` violet-cyan for highlights
- `--gradient-primary`, `--gradient-surface`, `--shadow-elegant`, `--shadow-glow`
- Light mode kept clean white with same indigo primary
- Typography: keep Inter body, add **Space Grotesk** display font via `@fontsource/space-grotesk` for headings

## 1. Global Shell
**`src/components/layout/MainLayout.tsx`**
- Sticky glass header (`backdrop-blur` + `bg-background/70` + subtle indigo border)
- Coin chip → pill with indigo gradient + glow
- Avatar ring uses primary; admin badge restyled
- Footer: subtler, centered, with thin top border
- `h-dvh` instead of `h-screen` for mobile correctness

**`src/components/layout/AppSidebar.tsx`**
- Brand block with gradient logo tile + "GPGC Portal" wordmark in Space Grotesk
- Active nav: indigo gradient pill + left accent bar, `aria-current="page"`
- Hover: subtle indigo wash, focus-visible ring
- Collapsed mini-rail keeps icons centered, tooltips on hover
- Admin section visually separated with a labeled group
- Logout button moved to footer with destructive ghost styling

## 2. AI Workspace (`src/pages/AITutor.tsx`)
- Header bar: gradient title "AI Workspace" with descriptive subtitle
- Tabs → segmented control style: pill-shaped active state with indigo gradient + glow, icon + label, full-width on mobile, max-w-2xl centered on desktop
- Background uses subtle radial gradient from primary/10 at top
- Tab content gets consistent inner padding and scroll containers

## 3. Mesh Chat (`src/components/ai-workspace/MeshChat.tsx`)
- Empty state: branded illustration block (no Sparkles-only), quick-prompt chips
- Assistant messages: no bubble, prose styling on background; user messages: indigo gradient bubble with `primary-foreground`
- Composer: floating rounded card with focus ring, send button as indigo gradient icon-button (min 44×44), Stop state when streaming
- Streaming indicator: shimmer "Thinking..." text instead of dots
- Mobile-friendly: full-width composer pinned to bottom, safe-area padding

## 4. VT Notes (`src/components/ai-workspace/VTNotes.tsx`)
- Two-pane responsive layout: collapsible Notes sidebar (drawer on mobile)
- Recorder card: large circular mic with pulsing ring when recording, time + waveform, clear Pause/Resume/Stop with `aria-label`s ≥44px
- Style selector → segmented buttons (Detailed/Concise/Flashcards/Summary)
- Editor: tabs for Raw Transcript ↔ Enhanced Notes, markdown preview with prose-indigo styling
- Sticky export toolbar: PDF / MD / TXT / Copy as icon-buttons with labels
- Search input in sidebar with icon, empty-state when no notes
- All toasts/feedback use semantic tokens

## Accessibility & Responsiveness
- All icon-only buttons get `aria-label`
- `focus-visible` rings on every interactive element
- 44×44 min tap targets on mobile
- `h-dvh`, safe-area-inset utilities preserved
- Semantic landmarks: single `<main>` (already in MainLayout), `<nav>` in sidebar
- Color contrast verified for both themes

## Technical Notes
- Install: `@fontsource/space-grotesk`
- Update: `src/index.css` (tokens + gradients + shadows), `tailwind.config.ts` (add `primary-glow`, `display` font, gradient/shadow utilities)
- Files edited: `MainLayout.tsx`, `AppSidebar.tsx`, `AITutor.tsx`, `MeshChat.tsx`, `VTNotes.tsx`
- No backend, schema, or business-logic changes
- Keep all existing functionality (recording, transcription, PDF export, chat streaming, voice notes edge function) untouched — presentation only

## Out of Scope
- Other pages (Home, Preparation, Forum, etc.) — can be follow-ups
- Light theme overhaul beyond keeping it usable
- Logo/illustration generation (will use refined typographic mark)
