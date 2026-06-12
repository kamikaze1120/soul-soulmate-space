# Ummah — Developer Memory

> Living document for engineers joining the project. Reflects decisions, architecture, gaps, and the running TODO. Update this file whenever a significant change ships.

Last updated: 2026-06-12

---

## 1. Product

A high-trust, ID-verified Muslim community web app (mobile-first, native planned later) with three private modes:

| Mode key (DB enum) | UI label | Audience | Gender lock |
|---|---|---|---|
| `matrimonial` | **Nikah** | Adults seeking marriage | none |
| `sisterhood` | **Sisterhood** | Verified women only | female |
| `brotherhood` | **Brotherhood** | Verified men only | male |

> The UI label "Matrimonial" was renamed to **Nikah** but the DB enum value remains `matrimonial` (avoids a destructive migration).

**Pricing**: $10.99/mo base · $5.99/mo per add-on mode · $2.99 7-day trial. Stripe NOT yet wired — modes UI shows placeholder toast.

---

## 2. Stack

- **Framework**: TanStack Start (v1, Vite 7, React 19) — file-based routing under `src/routes/`
- **Hosting**: Cloudflare Workers (edge SSR)
- **Backend**: Lovable Cloud (Supabase) — DB, Auth, Storage
- **UI**: Tailwind v4 (tokens in `src/styles.css`) + shadcn/ui
- **Forms / state**: TanStack Query + React Hook Form
- **Animations**: tw-animate-css (Motion can be added per-component)
- **Fonts**: Cormorant Garamond (display serif) + Inter (body) — premium editorial direction

---

## 3. Repository map

```
src/
  routes/
    __root.tsx                      → shell + providers (Query, Auth, Toaster)
    index.tsx                       → public landing
    auth.tsx                        → sign-in / sign-up
    _authenticated/route.tsx        → SSR-off auth gate (redirect to /auth)
    _authenticated/dashboard.tsx    → → redirect to /feed
    _authenticated/_app.tsx         → mounts <AppShell> + <ActiveModeProvider>
    _authenticated/_app/feed.tsx
    _authenticated/_app/discover.tsx
    _authenticated/_app/messages.index.tsx
    _authenticated/_app/messages.$id.tsx
    _authenticated/_app/profile.tsx
    _authenticated/_app/modes.tsx
  components/
    app-shell.tsx                   → header + floating pill nav
    ui/...                          → shadcn primitives
  lib/
    auth.tsx                        → AuthProvider (session + profile + entitlements)
    active-mode.tsx                 → ActiveModeProvider — current mode filter
    modes.ts                        → MODES catalog + visibleModes(gender)
    mock-data.ts                    → MOCK people/feed/threads/messages (placeholder until real data)
    utils.ts                        → cn() helper
  integrations/supabase/            → AUTO-GENERATED — do not edit
  styles.css                        → design tokens (light only currently)
  start.ts                          → TanStack start instance + middleware
  server.ts                         → Worker entry + error boundary
```

---

## 4. Database

Public schema tables (all RLS-enabled):

- **profiles** (id = auth.users.id) — display_name, verified_gender, is_verified, primary_mode, bio, marital_status, has_kids, kids_age_groups, city/country/lat/lon, blur_photos, wali_contact, liveness_video_path
- **mode_entitlements** — user_id, mode, is_active, is_trial, current_period_end, stripe_subscription_id
- **user_roles** — user_id + role (enum `app_role`: admin/moderator/user)

Enums: `app_role`, `gender`, `app_mode`, `marital_status`

Functions:
- `public.has_role(_user_id, _role)` — SECURITY DEFINER, scoped to user_roles
- `public.handle_new_user()` — trigger on `auth.users` insert; creates profile + assigns `user` role
- `public.set_updated_at()` — generic touch trigger

**RLS policy summary**:
- `profiles`: user can SELECT/INSERT/UPDATE own row. DELETE denied.
- `mode_entitlements`: user can SELECT own. INSERT/UPDATE/DELETE go through service role only.
- `user_roles`: user can SELECT own roles. ALL ops gated to admin via `has_role()`. **Explicit deny for non-admin INSERT/UPDATE/DELETE** added to close the privilege-escalation gap flagged by the security scanner.

**Test account** (seeded): `xyz@gmail.com` / `Password@123` — verified, all 3 modes active for 1 year. Used for QA only; do NOT ship to production.

---

## 5. Authentication

- Email/password (HIBP leaked-password protection enabled).
- Default redirect on signup verify: `/dashboard` → `/feed`.
- Profile + roles + entitlements auto-loaded by `AuthProvider` on `onAuthStateChange`.
- **Auth gate**: `_authenticated/route.tsx` is `ssr: false` and uses `beforeLoad` + `supabase.auth.getUser()` to redirect to `/auth`. (Supabase session lives in `localStorage`, so SSR cannot read it — the SSR-off pattern is the documented one.)
- Sign-out flow cancels queries → clears cache → `signOut()` → `navigate({ to: '/auth', replace: true })`.

> **Known preview-only issue**: Sign-in/sign-up can fail with `TypeError: Failed to fetch` inside the Lovable preview iframe because the preview's fetch proxy interferes with Supabase auth POSTs. **Always test auth on the published URL** (`*.lovable.app`) — not the preview.

---

## 6. Mode system

`ActiveModeProvider` exposes `{ active, setActive, available }`. A user's `available` modes = gender-locked visible modes ∪ any mode where they hold an active entitlement (so gender-lock overrides are respected when entitled). All feed/discover/messages screens are pure client filters on `mode === active`.

---

## 7. Messages

Thread model now supports **DM + Group** (the latter for Nikah conversations where a sister adds her Wali):

```ts
type Thread = {
  id, mode, lastMessage, timeAgo, unread, online,
  kind: 'dm' | 'group',
  personId?: string,          // DM
  members?: string[],          // group (incl. wali)
  title?: string,              // group display title
}
```

Group rendering: overlapping avatars, member chip row in header, "Add Wali" CTA in any Nikah DM that promotes the thread to a group.

> Messages are currently mock data (`src/lib/mock-data.ts`). Realtime + persistence are TODO.

---

## 8. Design system — "Premium & Editorial"

Direction chosen by stakeholder: deep jewel tones, serif display headings, generous whitespace, restrained micro-interactions. The visual language is closer to a Condé Nast property or a luxury boutique brand than a social app — intentional, to differentiate from Instagram/Tinder clones and to set the tone for "halal-first".

Token surface in `styles.css`:
- `--background` ivory · `--foreground` near-black ink
- `--primary` deep emerald · `--accent` burnished gold
- Mode tokens — Nikah plum, Sisterhood rose-gold, Brotherhood emerald
- `--gradient-hero` · `--gradient-card` · `--gradient-gold`
- `--shadow-soft` · `--shadow-elevated` · `--shadow-gold`
- `--font-display` Cormorant Garamond · `--font-body` Inter

Never hardcode hex/`text-white` etc. — always go through tokens.

---

## 9. Security posture

| Concern | Status | Notes |
|---|---|---|
| RLS on every public table | ✅ | profiles / mode_entitlements / user_roles |
| Privilege escalation on user_roles | ✅ Fixed | Explicit deny policies for non-admin INSERT/UPDATE/DELETE |
| Auth gate runs server-side | ✅ Fixed | Migrated to `_authenticated/route.tsx` (ssr:false + beforeLoad) |
| HIBP leaked-password check | ✅ Enabled |
| Service role key client exposure | ✅ Blocked | `*.server.ts` filename enforcement |
| Form input validation | ✅ | zod schema on auth forms (length + email + trim) |
| Storage policies for liveness videos | ⏳ TODO | Bucket not yet created |
| `requireSupabaseAuth` global default | ⏳ Deferred | No protected server fns yet; will add when first one lands |
| Rate-limit on auth | ✅ via Supabase | Native Supabase Auth throttling |

### What must never happen
- A non-admin user gaining the admin role via direct INSERT into `user_roles`.
- A user reading another user's profile, entitlements, or future liveness video.
- The service-role key landing in the browser bundle.

---

## 10. Open TODOs

1. **Stripe payments** — wire checkout for trial / mode purchase / mode add-on; webhook → write `mode_entitlements`.
2. **Identity verification** — Stripe Identity + custom 3-second liveness video; create `verification-videos` private storage bucket with owner-only RLS.
3. **Real data**: feed/discover/messages move off `mock-data.ts` to Supabase queries with realtime subscription on messages.
4. **Wali invite flow** — email-only group invite when a Nikah DM is promoted to a Wali group.
5. **Modesty blur server-enforced** — currently UI-only.
6. **Reporting & moderation queue** — admin-only route.
7. **Native shell** (Expo / Capacitor) — deferred.

---

## 11. Change log (high-level)

- **2026-06-12** — Big pass: premium editorial redesign across all surfaces; Wali group threads; SSR-safe auth gate; privilege-escalation hardening; HIBP enabled; memory.md created.
- **2026-06-12** — Matrimonial → Nikah label rename; brotherhood unlocked for test user; chat opening fixed (route hierarchy).
- **2026-06-12** — Test user seeded.
- **2026-06-12** — Mobile-first redesign #1 (Instagram-y); feed/discover/messages/profile/modes created.
- **2026-06-12** — Initial scaffold: profiles, entitlements, user_roles, auth, dashboard.
