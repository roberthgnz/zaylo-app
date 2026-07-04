# Zaylo web → React Native migration roadmap

Source of truth for what has been ported from the Next.js web app (root repo)
into this Expo/React Native app, what's deliberately excluded, and what's
deferred to future passes. Update this file at the end of every phase.

## Hard exclusion: `closet`

Nothing under the following paths was read, ported, or referenced. No
placeholder screens or nav entries point at it:

- `app/[locale]/closet/**`, `app/[locale]/dashboard/closet/**`
- `app/api/closet/**`
- `features/closet/**`
- `lib/domains/closet/**`, `lib/services/closet/**`
- Closet-related Supabase migrations/functions (`supabase/migrations/*closet*`, `supabase/functions/queue-worker/handlers/closet-*`)
- Closet i18n JSON files (`ClosetHome`, `ClosetItemsPage`, `ClosetPlannerPage`, `ClosetStylePage`, `ClosetLookDetail`, `ClosetLooksPage`)

Where web types mixed closet fields into shared files (`lib/zaylo/types.ts`,
`lib/zaylo/mappers.ts`), only the non-closet subset (profile) was copied into
`src/lib/zaylo/`. `DbProfile.closet_visibility` was kept as a typed field
(it's data the profile API returns) but no closet UI/logic was built around it.

## Permanently excluded: marketing pages

User decision — native apps don't carry a marketing/landing surface; that
stays web-only:

- `app/[locale]/page.tsx` (landing)
- `app/[locale]/sell-more-clothes-on-instagram/**` (lead magnet)
- `app/[locale]/sentry-test/**` (dev-only test page)

## Done so far (Phase 0 through Phase 4)

**Phase 0 — Foundation**
- Deps installed via `npx expo install`: nativewind + tailwindcss v3, `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, zustand, `@tanstack/react-query`, react-hook-form + resolvers + zod, i18next + react-i18next, expo-localization, clsx/tailwind-merge/class-variance-authority.
- NativeWind wired: `tailwind.config.js`, `babel.config.js`, `metro.config.js`, `nativewind-env.d.ts`, `@tailwind` directives added to `src/global.css` (kept the existing web font-var block).
- `zaylo-app/.env` (gitignored) + `.env.example` — `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY/STORAGE_BUCKET`, `EXPO_PUBLIC_API_BASE_URL`.
- `src/lib/supabase/{config,client,database.types}.ts` — RN client using AsyncStorage session storage, `flowType: "pkce"` (see reset-password note below). No `@supabase/ssr` (that's Next.js-only).
- `src/lib/zaylo/{types,mappers}.ts` — profile-only subset of the web files.
- `src/lib/api/client.ts` — `apiRequest()` port of `lib/core/api-client.ts`, prefixed with `EXPO_PUBLIC_API_BASE_URL` since RN has no same-origin concept.
- `src/lib/domains/profile/client.ts` — `getUserProfile` + realtime `subscribeUserProfile`, ported as-is (already API-route-based, no closet coupling).
- `src/lib/current-user/{current-user,CurrentUserProvider}.tsx` — port of web's auth context. Dropped the `initialUser` SSR prop (no server render in RN); everything resolves client-side from `supabase.auth.getSession()`.
- `src/lib/i18n/**` — i18next init (device locale via `expo-localization`, fallback `es`), only `Common`/`AuthPage`/`ForgotPassword`/`ResetPassword` namespaces copied (en+es).
- `src/components/QueryProvider.tsx` — verbatim port.
- `src/components/ui/{button,text-field,form-banner}.tsx` — thin NativeWind primitives (not a full shadcn port), matching web's monochrome button identity (black/white, rounded, h-11/h-14-ish).
- Root layout restructured: `index.tsx`/`explore.tsx` moved into a `(tabs)` group; added `(auth)` group; `src/app/_layout.tsx` now wraps `SafeAreaProvider` → `I18nextProvider` → `QueryProvider` → `CurrentUserProvider` → `ThemeProvider`, and uses `Stack.Protected guard={...}` to switch between `(auth)` and `(tabs)` based on session state.
- `app.json`: `web.output` changed from `"static"` to `"single"`. The scaffold's default `"static"` mode makes Expo Router server-render routes in Node during `expo start --web`; the Supabase client (via the AsyncStorage adapter) touches browser globals at construction time, which crashed with `ReferenceError: window is not defined` under SSR. This app's web target is a dev-preview convenience (react-native-web), not the product's real web surface — that's the separate Next.js app — so client-only `"single"` output is the correct fit here, not a workaround.

**Phase 1 — Auth screens** (`src/app/(auth)/`)
- `sign-in.tsx` / `sign-up.tsx` — share one `AuthForm` component (`src/components/auth/AuthForm.tsx`), zod schema ported verbatim from web (`email` + `password >= 8`), Supabase `signInWithPassword` / `signUp`.
- `forgot-password.tsx` — email-only schema, `resetPasswordForEmail()` with deep-link `redirectTo` via `Linking.createURL("/reset-password")`.
- `reset-password.tsx` — password+confirm schema (match validation), exchanges the PKCE `code` query param from the deep link via `supabase.auth.exchangeCodeForSession()`, then `updateUser({password})`.
- Loading/error/info states on every screen; `KeyboardAvoidingView` + `ScrollView` for keyboard handling and scroll on small screens; `SafeAreaView` for insets.

**Phase 2 — Onboarding** (`src/app/(onboarding)/`)
- Root layout (`src/app/_layout.tsx`) gained a third `Stack.Protected` branch: `guard={!!user && !onboardingComplete}` → `(onboarding)`, alongside the existing `(auth)` and `(tabs)` branches. `onboardingComplete` reads from `user.profile.onboardingComplete` (defaults `false` if profile missing). This replaces part of Phase 1's "no role-based post-auth routing" simplification — see below.
- `src/lib/current-user/CurrentUserProvider.tsx` now exposes `refreshProfile(): Promise<void>` in its context value. Each onboarding screen calls it right after a successful submit, before navigating — needed because, unlike web (which re-fetches profile server-side on every navigation), RN's `CurrentUserProvider` is the single client-side source of truth and only otherwise updates via the Supabase realtime subscription, which could lag a beat behind the local mutation.
- `role.tsx`, `step-1.tsx`, `step-2.tsx` — ported from `OnboardingRoleClient.tsx`, `OnboardingStep1Client.tsx`, `OnboardingStep2Client.tsx`. Same zod schemas (`_step1-schema` → `src/lib/domains/onboarding/step1-schema.ts`, `_step2-schema` → `.../step2-schema.ts`), same debounced (350ms) username-availability check via `isUsernameAvailable` (added to `src/lib/domains/profile/client.ts`), same seller-only guard on step-2 (client-side `useEffect` redirect instead of web's server-component redirect).
- `src/lib/domains/onboarding/client.ts` — `submitOnboardingRole/Step1/Step2`, verbatim port (thin `apiRequest` wrappers, same `/api/onboarding/*` contracts).
- `src/lib/navigation/useOnboardingNav.ts` — the `redirectTo` web sends back (`/profile`, `/dashboard`, `/closet`, `/onboarding/step-1`, `/onboarding/step-2`) is a **web path**; only the two onboarding-step paths correspond to real RN routes today. `advance(redirectTo)` pushes to `/step-1` or `/step-2` when applicable and otherwise does nothing — the `Stack.Protected` guard (once `refreshProfile()` picks up the flipped `onboardingComplete`) swaps the app from `(onboarding)` to `(tabs)` on its own. This means the code never hardcodes or references `/closet` anywhere, for any role, satisfying the exclusion rule without special-casing showcase users.
- `src/components/ui/phone-input.tsx` + `country-code-selector.tsx` — new RN port of web's `PhoneInput`/`CountryCodeSelector` (used by step-2's required WhatsApp field): flag-emoji + calling-code prefix, country picker as a `Modal` + searchable `FlatList` instead of web's `vaul` drawer.
- i18n: `OnboardingRole`, `OnboardingStep1`, `OnboardingStep2` namespaces (en/es) added to `src/lib/i18n/index.ts`.

**Phase 3 — Buyer profile & settings** (`src/app/(tabs)/profile/`)
- **Tab restructuring (architecture decision):** removed the Expo boilerplate "Explore" tab entirely (tutorial content, zero relevance to Zaylo — `explore.tsx` and its only consumer `components/ui/collapsible.tsx` deleted, not left as dead code) and replaced it with a real "Profile" tab. `(tabs)/profile/` is now its own nested `Stack` (`_layout.tsx`) with `index.tsx` (the profile hub, tab root) and `settings.tsx` (pushed on top, hides the tab bar — matches web's `hideBottomNav` intent for these two screens). `app-tabs.tsx`/`app-tabs.web.tsx` triggers updated accordingly. Tab icon uses `NativeTabs.Trigger.Icon sf="person.crop.circle" md="person"` (SF Symbol + Material icon name) instead of custom PNGs — no new asset files needed.
- `profile/index.tsx` — ported from `ProfilePage`: hero card (avatar initial, email, "Buyer" badge), single "Account settings" action row (pushes to `settings.tsx`), a "coming next" card. **Dropped the bag-count tile and "Review your bag" action at the time** — bag wasn't ported yet and `/bag` didn't exist as an RN route, so linking to it would've been a dead link. **Restored in Phase 4** once bag landed — see below.
- `profile/settings.tsx` — ported from `BuyerSettingsPage`: account details (email, role badge, `LanguageSelector`), sign-out action. Web doesn't call `useTranslation` on either page (all copy is hardcoded English inline there too) — ported verbatim, no invented i18n namespace.
- Sign-out doesn't navigate explicitly: `supabase.auth.signOut()` clears the session, `CurrentUserProvider`'s `onAuthStateChange` listener picks it up, and the root `Stack.Protected` guard swaps to `(auth)` on its own — same pattern used for onboarding-completion elsewhere.
- `src/components/LanguageSelector.tsx` — new RN port. Web's version changes the URL locale segment (`router.replace(pathname, {locale})`); RN has no locale-prefixed routing, so it calls `i18n.changeLanguage()` directly and persists the choice via `src/lib/i18n/persistLocale.ts` (`AsyncStorage`, key `zaylo_locale_v1`). `applyPersistedLocale()` runs once at app start (`src/app/_layout.tsx` module scope) so a saved choice overrides the device-locale auto-detect from Phase 0 on subsequent launches.
- `LanguageSelector` i18n namespace (en/es) copied for the picker's own labels.

**Phase 4 — Bag (consolidated + per-store)** (`src/app/(tabs)/bag/`)
- `src/lib/stores/useBagStore.ts` — zustand `persist` port of the guest bag store, same shape/versioned migration, storage swapped from `localStorage` to `AsyncStorage` via `createJSONStorage(() => AsyncStorage)`.
- `src/lib/domains/bag/{client,queries,types}.ts` — verbatim port (`getBag`, `addBagItem`, `removeBagItem`, `clearBag`, `clearBagStore`, `mergeBag`, plus their react-query mutation wrappers). Added `ZayloBag`/`ZayloBagItem`/`ZayloBagStoreGroup` to `src/lib/zaylo/types.ts` (still no closet types there).
- `src/lib/bag.ts`, `src/lib/useBagData.ts` — pure helpers and the merge-guest-or-auth hook, ported as-is.
- `src/components/BagSyncProvider.tsx` — merges the guest bag into the server bag on login. Web's version does a synchronous `window.localStorage.getItem(key) === "done"` check inside the effect; `AsyncStorage.getItem` is async, so the check moved inside the async `run()` function instead of gating the effect itself. Mounted in `src/app/_layout.tsx` alongside the other root providers.
- `src/lib/analytics.ts` (`trackBusinessEvent`) — web uses `navigator.sendBeacon` + `window.localStorage` (anon id) + `window.location.pathname` (default sourcePath); RN has none of those, so: plain `fetch` (best-effort, errors swallowed — analytics must never block UI), `AsyncStorage` for the anon id, and `sourcePath` is now a required-in-practice param the caller supplies via `usePathname()` instead of an implicit default.
- `bag/index.tsx` (consolidated) / `bag/[username].tsx` (per-store) — ported from `BagPage`/`StoreBagPage`. Thumbnails use `expo-image` directly rather than porting the full web `ProductMedia` component — every call site here resolves through `getMainMediaPreview()` first, which always returns a still-image URL (a video's poster/thumbnail, never a live video src), so the video-rendering branch of `ProductMedia` is genuinely unexercised by these two screens. Checkout uses `Linking.openURL(whatsappUrl)` instead of `<a target="_blank">`.
- Restored the bag tile + "Review your bag" action on `profile/index.tsx` now that `/bag` is a real route.

## Deliberate simplifications in this pass (not final behavior)

- **Post-auth/onboarding routing is now real for the onboarding steps, but terminal destinations still fall through to the tabs boilerplate.** Buyer role-selection, showcase-only step-1 completion, and seller step-2 completion all flip `onboardingComplete` server-side; RN just refreshes the profile and lets the guard swap to `(tabs)` — it never navigates to `/profile`, `/dashboard`, or `/closet` specifically, because none of those screens exist yet (closet never will). Revisit once profile/dashboard land, at which point `(tabs)` should route by role internally.
- **Google OAuth is not implemented**, not stubbed. Web uses `supabase.auth.signInWithOAuth({provider: "google"})` with a browser redirect — on RN this needs `expo-auth-session` + a proper deep-link callback, which is its own scope. No button is rendered for it (a non-functional button would be a fake feature); add it as its own phase.
- **PKCE flow, not implicit/cookie flow.** Web's Supabase client goes through `@supabase/ssr` cookies. RN's client sets `flowType: "pkce"` + `detectSessionInUrl: false`; the reset-password screen manually calls `exchangeCodeForSession()`. This is the current official Supabase guidance for native apps, but the deep-link cold-start path (app not running when the email link is tapped) is only verified in code review, not on a physical device/build — flag if issues show up in testing.
- **`database.types.ts` is a static copy**, not regenerated from the Supabase CLI. It's structurally loose (`Row/Insert/Update: any`) on web too, so this isn't a regression, but it means neither app is getting compile-time column checking yet.
- **Onboarding's live end-to-end flow (real sign-up → role → step-1 → step-2 → tabs handoff) was not exercised against a live Supabase project + running Next.js API server in this pass** — verification here was `tsc`/lint clean plus confirming the new 3-way auth guard doesn't regress the unauthenticated redirect (still lands on sign-in). Please try it on-device against your real backend and report back if anything doesn't flip over as expected.
- **"Change password" and "Become a seller" are omitted from settings/profile, not stubbed.** Web's settings page links "Change password" to `/forgot-password` and "Become a seller" to `/onboarding` — both routes live in RN groups that `Stack.Protected` unmounts while a user is authenticated+onboarded (`(auth)` requires `!user`; `(onboarding)` requires `!onboardingComplete`), so neither is reachable from an authenticated buyer today. Real fixes, not workarounds: change-password should call `supabase.auth.updateUser({password})` directly (session already exists, no reset-email round-trip needed) via its own small screen; become-a-seller needs a role-upgrade path that can re-enter `(onboarding)` for an already-complete profile, which the guard doesn't support yet. Both are real, scoped follow-ups — noted here rather than half-built.
- **Profile/settings live end-to-end flow (viewing real account data, language switch persisting, sign-out landing back on sign-in) was not exercised against a live authenticated session in this pass** — same reason as onboarding above (needs a live Supabase account). Verified: `tsc`/lint clean, tab restructuring doesn't break the unauthenticated redirect.
- **"View product" is omitted from the per-store bag screen, not stubbed.** Web links each bag item to `/{username}/product/{itemId}`, i.e. the public-store product detail page — that phase hasn't landed in RN yet, so the link would be dead. Re-add once public store ships.
- **`ProductMedia`'s video-rendering branch was never ported**, only the still-image path (via `expo-image`) — see Phase 4 note above for why that's actually correct for these two screens, not a shortcut. Whichever future screen first needs to render a *live* video (not a poster) — likely product detail or the seller dashboard's asset library — is what should introduce the `expo-video` port, not this phase.
- **Bag's live end-to-end flow (add-to-bag from a real store, guest→auth merge on login, WhatsApp checkout deep link) was not exercised against a live backend in this pass** — same reasoning as onboarding/profile above. Note in particular: add-to-bag itself isn't reachable from any RN screen yet either (it lives on the public-store product page, not yet ported), so the guest bag can currently only be populated via direct API calls or dev tools — worth keeping in mind when testing.

## Gotcha hit this pass: underscore-prefixed files inside `src/app/` are NOT ignored

Assumed (wrongly) that prefixing a non-screen helper file with `_` inside a route
group (e.g. `src/app/(onboarding)/_useOnboardingNav.ts`) would exclude it from
Expo Router's route scanning, the way `_layout.tsx` is special-cased. It isn't —
checked `expo-router`'s `matchers.js`/`getRoutes.js` directly: only the literal
`_layout` filename (and `+not-found`/`+api`/`+html` suffixes) get special
handling. Any other `_foo.ts` under `app/` is scanned as a route and Metro/Expo
Router warns `"missing the required default export"` and can fail to resolve
relative imports across reloads. Fix: keep non-route helpers (schemas, hooks)
out of `src/app/` entirely — they now live in `src/lib/domains/onboarding/` and
`src/lib/navigation/`. Worth remembering for every future phase (AGENTS.md's
"Expo HAS CHANGED" warning was right to flag this).

## Deferred to future phases

| Area | Web reference | Why deferred |
|---|---|---|
| Change password (from settings) | Web reuses `/forgot-password` | Needs its own screen calling `updateUser({password})` directly — `(auth)` group is unreachable while logged in |
| Become a seller (role upgrade) | Web reuses `/onboarding` | Needs a role-upgrade path that can re-enter `(onboarding)` for an already-`onboardingComplete` profile |
| Seller dashboard (home, new-item×2, item edit, store catalog, analytics, assets library, settings) | `app/[locale]/dashboard/**` | Largest remaining surface, ~6 screens, own multi-phase effort |
| Public store (storefront, product detail, store bag) | `app/[locale]/[username]/**` | Depends on catalog domain port — also unblocks add-to-bag and bag's "view product" link |
| `ProductMedia` video-rendering branch | `components/ProductMedia.tsx` | No RN screen renders a *live* video yet (bag only ever shows poster stills); add via `expo-video` when one does |
| Legal pages (privacy, terms) | `app/[locale]/privacy`, `app/[locale]/terms` | Simple static screens, low priority but required for app store submission — do before release, not blocking dev |
| Google OAuth | `auth/page.tsx` `signInWithOAuth` | Needs `expo-auth-session` deep-link callback flow |

## Dependency compatibility (condensed)

| Reuse as-is | Swap for RN |
|---|---|
| zustand, @tanstack/react-query, zod, react-hook-form, @hookform/resolvers, @supabase/supabase-js, i18next/react-i18next, libphonenumber-js, class-variance-authority | framer-motion/motion → react-native-reanimated; shadcn/@radix-ui/cmdk → NativeWind primitives (this pass) / tamagui-restyle if the primitive set grows; vaul → RN Modal or `@gorhom/bottom-sheet`; sonner → a RN toast lib; recharts → Victory Native or react-native-chart-kit; lucide-react → lucide-react-native or expo-symbols; tailwindcss v4 (web) → separate NativeWind + tailwindcss v3 config here (independent packages, no conflict); react-easy-crop → expo-image-picker/native crop; onnxruntime-web / @imgly/background-removal → onnxruntime-react-native or drop (closet-only, N/A here); next-intl/next-i18next → i18next/react-i18next directly (done) |

## Known dev-only quirk (web preview, not native)

On `expo start --web` (dev mode only), NativeWind's web runtime
(`react-native-css-interop/dist/runtime/web/color-scheme.js`) throws
`Cannot manually set color scheme, as dark mode is type 'media'...` from its
own internal `MutationObserver` callback the first time it observes the
injected stylesheet's darkMode flag. Confirmed by grepping all of
`node_modules` — nothing in application code (ours, expo-router, or
react-navigation) calls `colorScheme.set`/`.toggle` anywhere; it's NativeWind
self-triggering against its own guard. It only surfaces as Expo's dev LogBox
overlay (never appears in production/native builds — native uses a
completely different file, `runtime/native/appearance-observables.js`, with
no such throw) and doesn't block any functionality underneath — all four
auth screens render and behave correctly with the overlay dismissed. Since
`darkMode: 'media'` (auto-follow OS) is the correct choice for the real
native target (matches `app.json`'s `userInterfaceStyle: "automatic"`),
this wasn't changed. If it becomes noisy during web-preview dev sessions,
revisit with an upstream NativeWind issue/version bump — not a reason to
switch to `class`-based dark mode, which would require manual toggling logic
we don't otherwise need.

## Verification checklist

**Phase 0 + 1 (auth):**
- `npx tsc --noEmit` — clean
- `npx expo lint` — clean (0 errors; pre-existing `jsx-a11y/alt-text` warnings in untouched Expo boilerplate files left as-is)
- Web preview (`expo start --web`, react-native-web, `web.output: "single"`) — sign-in, sign-up, forgot-password, and reset-password (error state) screens exercised in-browser: zod validation errors confirmed, sign-in ↔ sign-up ↔ forgot-password navigation confirmed, no failed network requests

**Phase 2 (onboarding):**
- `npx tsc --noEmit` — clean
- `npx expo lint` — clean (0 errors, same pre-existing warnings only)
- Web preview — confirmed the new 3-way root guard still redirects an unauthenticated session to `/sign-in` (no regression from adding the `(onboarding)` branch)
- Not yet verified: full authenticated flow (role → step-1 → step-2 → tabs handoff) against a live backend — see simplifications note above

**Phase 3 (profile & settings):**
- `npx tsc --noEmit` — clean (regenerated `.expo/types/router.d.ts` via a preview run first — typed routes for `/profile` and `/profile/settings` didn't exist until Metro rebuilt once)
- `npx expo lint` — clean (0 errors; down to 6 pre-existing warnings, 2 fewer than before since deleting `explore.tsx` removed its `alt-text` warnings)
- Not yet verified: live authenticated profile/settings data, language-switch persistence across restart, sign-out → sign-in handoff — needs a live Supabase session (see simplifications note above)

**Phase 4 (bag):**
- `npx tsc --noEmit` — clean (same route-typegen-lag as Phase 3, same fix: one preview run to regenerate `/bag` and `/bag/[username]` typed routes)
- `npx expo lint` — clean (0 errors; added `alt` text to the two new `expo-image` usages rather than leaving warnings, unlike the untouched pre-existing boilerplate ones)
- Not yet verified: any live data at all — bag has no reachable "add to bag" entry point in RN yet (that's on the unported public-store product page), so this phase could only be verified structurally (types, lint, guard non-regression), not by actually filling a bag end-to-end. Worth an explicit test once public store lands.
