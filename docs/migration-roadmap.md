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

## Done this pass (Phase 0 + Phase 1)

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

## Deliberate simplifications in this pass (not final behavior)

- **No role-based post-auth routing.** Web's `auth/page.tsx` redirects to `/dashboard`, `/closet`, `/onboarding`, or `/profile` depending on role + onboarding status. None of those screens exist in RN yet, so sign-in/sign-up just let the `Stack.Protected` guard flip from `(auth)` to `(tabs)` (today: the stock Expo tab boilerplate). Revisit once onboarding + dashboard land.
- **Google OAuth is not implemented**, not stubbed. Web uses `supabase.auth.signInWithOAuth({provider: "google"})` with a browser redirect — on RN this needs `expo-auth-session` + a proper deep-link callback, which is its own scope. No button is rendered for it (a non-functional button would be a fake feature); add it as its own phase.
- **PKCE flow, not implicit/cookie flow.** Web's Supabase client goes through `@supabase/ssr` cookies. RN's client sets `flowType: "pkce"` + `detectSessionInUrl: false`; the reset-password screen manually calls `exchangeCodeForSession()`. This is the current official Supabase guidance for native apps, but the deep-link cold-start path (app not running when the email link is tapped) is only verified in code review, not on a physical device/build — flag if issues show up in testing.
- **`database.types.ts` is a static copy**, not regenerated from the Supabase CLI. It's structurally loose (`Row/Insert/Update: any`) on web too, so this isn't a regression, but it means neither app is getting compile-time column checking yet.

## Deferred to future phases

| Area | Web reference | Why deferred |
|---|---|---|
| Onboarding (role, step-1, step-2) | `app/[locale]/onboarding/**` | Needs the role-based routing this pass intentionally simplified away |
| Buyer profile & settings | `app/[locale]/profile`, `app/[locale]/settings` | Depends on onboarding being in place |
| Bag (consolidated + per-store) | `app/[locale]/bag`, `app/[locale]/[username]/bag` | Needs zustand bag store + AsyncStorage persistence port, own phase |
| Seller dashboard (home, new-item×2, item edit, store catalog, analytics, assets library, settings) | `app/[locale]/dashboard/**` | Largest remaining surface, ~6 screens, own multi-phase effort |
| Public store (storefront, product detail, store bag) | `app/[locale]/[username]/**` | Depends on catalog domain port |
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

## Verification checklist run this pass

- `npx tsc --noEmit` — clean
- `npx expo lint` — clean (0 errors; pre-existing `jsx-a11y/alt-text` warnings in untouched Expo boilerplate files left as-is)
- Web preview (`expo start --web`, react-native-web, `web.output: "single"`) — sign-in, sign-up, forgot-password, and reset-password (error state) screens exercised in-browser: zod validation errors confirmed, sign-in ↔ sign-up ↔ forgot-password navigation confirmed, no failed network requests
