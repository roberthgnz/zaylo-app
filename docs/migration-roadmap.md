# Zaylo web → React Native migration roadmap

Source of truth for what has been ported from the Next.js web app (root repo)
into this Expo/React Native app, what's deliberately excluded, and what's
deferred to future passes. Update this file at the end of every phase.

## Current migration status

**Migration complete through the Change password phase.** The native app now
has the shared foundation, auth, onboarding, buyer profile/settings, bag,
seller dashboard, public storefront/product-detail, and in-session
change-password surfaces that were selected for the first migration arc.

**This migration arc is closed.** The items that were previously tracked as
backlog (release blockers + post-release parity) are now marked deliberately
excluded from this arc — see "Excluded from this migration arc" below. Any of
them can be picked back up as its own future phase if prioritized later, but
none are in flight.

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

## Done so far (Phase 0 through Phase 5)

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

**Phase 5 — Seller dashboard.** Much bigger than the roadmap's original "~6 screens" estimate — research (3 parallel Explore agents) found ~25 web files (home, new-item's 8 form sub-components, edit, store catalog, settings' 7 cards, assets library, analytics), plus an image pipeline (crop/background-removal/video-thumbnails) that's 100% browser-only. User was shown the real size and chose to do all of it in one pass rather than slice it down further — see the adaptations below for how that was kept shippable.

- **Navigation:** `app-tabs.tsx`/`.web.tsx` are now role-aware. Sellers (`user.profile.roles.includes('seller')`) get three more tabs — Store, New Item, Assets (`sf`/`md` icon names, no new PNGs) — registered conditionally; buyers don't see them at all, matching web's own role-gated `BottomNav`. The **Home tab is also role-aware**: sellers get the real dashboard home (`DashboardHomeScreen`); buyers still get the Phase 0 Expo boilerplate (`src/components/home-placeholder.tsx`, extracted verbatim from the old `index.tsx`) since fixing the buyer home screen isn't in scope here and Profile already covers buyers (Phase 3).
- **Domain layer:** `src/lib/domains/{catalog,analytics,assets}/{client,queries,types}.ts` — verbatim ports (thin `apiRequest` wrappers + react-query hooks, same pattern as bag/onboarding/profile). Added `ZayloItem`/`ItemInput`/`ItemStatus`/`BusinessAnalyticsSummary`/`ZayloAsset` to `src/lib/zaylo/types.ts`. Dropped `getItemBySlug`/`useItemBySlugQuery` and the `setItemStatusInCaches` cross-update into `["stores","by-username"]` caches — both are public-store-only concerns, not needed until that phase exists.
- `src/lib/core/storage.ts` — new `uploadPublicFile(path, {uri, name, type})` + `localFileToBlob()`. Web builds a `Blob` straight from a `blob:`/`data:` URL; RN resolves a local file `uri` to a real `Blob` via `fetch(uri).blob()` first (works uniformly on native and web preview, unlike passing a raw `{uri, name, type}` object straight to `FormData.append` — the latter is a common RN native pattern but react-native-web's `fetch`/`FormData` doesn't understand the bare "uri" file convention, so it would've silently failed in web preview specifically). Same `/api/storage/upload` endpoint, no backend change needed.
- **Shared item-list UI** (`src/components/dashboard/{ItemCard,ItemStatusBadge,ItemDetailSheet,ItemList}.tsx`) — one component covers what web splits across `DashboardItemList` + the seller's own store-catalog view: status-filter chips, tap-to-select (long-press or tap-in-selection-mode) with a bulk action bar (archive/delete), and a single-item detail bottom sheet (`Modal`, replacing `vaul`) with edit/status-toggle/duplicate/delete. Delete confirmations use RN's built-in `Alert.alert` instead of a custom confirmation dialog component.
- **Dashboard home** (`(tabs)/index.tsx` → `DashboardHomeScreen`) — stats tiles (active/reserved/sold), an analytics funnel widget (`useBusinessAnalyticsSummaryQuery(7)`, `Share.share()` instead of `navigator.share()`+clipboard fallback), and the shared `ItemList`.
- **New item** (`(tabs)/new-item/{format,details}.tsx`) + **item edit** (`(tabs)/dashboard-store/[itemId]/edit.tsx`) both render one shared `ItemForm` component (`src/components/dashboard/ItemForm.tsx`) — same zod schema (`item-form-schema.ts`), same upload orchestration (`upload-item-photos.ts`: uploads local picks, passes through already-`https://` URLs unchanged for edits).
- **Store catalog** (`(tabs)/dashboard-store/index.tsx`) — search + sort wrapper around the shared `ItemList`.
- **Store settings** (`(tabs)/profile/store-settings.tsx`, reachable from `profile/settings.tsx` when seller) — shop name/username/bio/shipping-policy/currency, accent color (4 presets + custom hex), logo upload, Instagram/TikTok/WhatsApp (reusing `PhoneInput` from Phase 2). Added `updateUserProfile` to `src/lib/domains/profile/client.ts` (was missing — only `getUserProfile`/`subscribeUserProfile`/`isUsernameAvailable` existed before).
- **Assets library** (`(tabs)/assets/index.tsx`) — grid merging uploaded assets with read-only item-photo entries (`asset-utils.ts`: `itemPhotosToAssets`, `mergeUniqueAssets`, `formatSize`, ported as pure logic), multi-pick upload, delete (DB assets only), preview modal.
- **Analytics** (`(tabs)/profile/analytics.tsx`) — 7/30-day filter, funnel stats grid. Web's own "chart" is already a numeric placeholder, not a real chart component — ported the numbers, didn't invent a chart library dependency to match a chart web doesn't really have either.

**Public store — storefront + product detail** (`src/app/(tabs)/store/[username]/**`)

- **Domain layer:** `src/lib/domains/public-store/{types,queries}.ts` (new) — `useStoreByUsernameQuery(username)` resolves a profile via `getUserByUsername` (new `profile/client.ts` fn hitting `/api/profiles/by-username/{username}`) then that seller's catalog via `getItemsByUserId`. Web's version branches for showcase-only sellers into a second query against `/api/closet/public/{username}` (closet looks/lookbooks/items) — **that branch is skipped entirely**, not ported; showcase-only profiles simply resolve to an empty catalog here, no special-casing needed since the branch web takes is purely additive on top of the catalog query this app already has. Restored `getItemBySlug`/`useItemBySlugQuery` to the catalog domain (dropped in Phase 5 as unused-at-the-time). Added `useProfileByIdQuery` (`src/lib/domains/profile/queries.ts`, new) for the product page's seller-summary card.
- `src/components/store/StoreItemCard.tsx` (new) — grid card, reuses `ItemStatusBadge` from the dashboard components, navigates to `/store/[username]/product/[itemId]`.
- **Storefront** (`store/[username]/index.tsx`) — avatar/name/bio header, Share (`Share.share()`) + WhatsApp (`Linking.openURL`) buttons, category chips, search, item grid. Simplified from web: skipped the curated "Featured Picks"/collection-row sections (`app/[locale]/[username]/**`'s editorial layer) and the promo/signup modal shown to anonymous web visitors — both are marketing/growth surface, not core marketplace-loop functionality.
- **Product detail** (`store/[username]/product/[itemId].tsx`) — consolidated web's ~8 split sub-components (`ProductGallery`, `ProductBottomCta`, `SellerSummaryCard`, `OwnerActionsCard`, `ProductHeaderSection`, `ProductAttributesGrid`, etc.) into one screen file: photo gallery (prev/next/dot indicators — no video-thumbnail-seek, since video-as-media is still the Phase 5 deferral), size chips, brand/condition/description/shipping-policy/tags, seller summary card, "more from this store" grid, owner-only status-management actions, and a fixed bottom CTA bar (owner: share+edit+add-new; buyer: share+add-to-bag or a disabled state once sold/reserved).
- **Navigation wiring:** restored the bag screens' "View product" link (`bag/[username].tsx`, was omitted in Phase 4 — see backlog note below, now resolved) pointing at the new product route; `DashboardHomeScreen` gained a "Go to store" button linking to `/store/[username]` for sellers with a username set; `bottom-nav.tsx`'s `FULLSCREEN_ROUTE_PATTERNS` gained `/^\/store\/[^/]+\/product\/[^/]+/` so the floating pill nav doesn't overlap product detail's own fixed bottom CTA bar.

**Change password** (`src/app/(tabs)/profile/change-password.tsx`)

- Resolves the backlog item noted in Phase 5/Public store: web's settings page links "Change password" to `/forgot-password` (the email-reset flow), but that route lives in the `(auth)` group which `Stack.Protected` unmounts while a user is authenticated — unreachable from a logged-in buyer/seller. Instead of routing there, this is a dedicated authenticated screen calling `supabase.auth.updateUser({ password })` directly — the session already exists, so no reset-email round-trip is needed.
- Form/schema mirrors `(auth)/reset-password.tsx` (password + confirm, min 8 chars, match validation via zod `.refine`) minus the PKCE `exchangeCodeForSession` step, since there's no deep-link code to exchange here.
- Reached from `profile/settings.tsx`'s account-details card (new "Change password" row, same disclosure-chevron pattern as the seller-only "Store settings" row). English-only, no new i18n namespace — matches `settings.tsx`/`profile/index.tsx`, which are also hardcoded English (Phase 3 note: web doesn't localize these pages either).
- Not yet verified against a live session (needs a real authenticated user to confirm `updateUser` actually rotates the password and doesn't invalidate the session unexpectedly) — same live-backend caveat as every phase since onboarding.

## Deliberate simplifications in this pass (not final behavior)

- **Post-auth/onboarding routing is now real for the onboarding steps, but terminal destinations still fall through to the tabs boilerplate.** Buyer role-selection, showcase-only step-1 completion, and seller step-2 completion all flip `onboardingComplete` server-side; RN just refreshes the profile and lets the guard swap to `(tabs)` — it never navigates to `/profile`, `/dashboard`, or `/closet` specifically, because none of those screens exist yet (closet never will). Revisit once profile/dashboard land, at which point `(tabs)` should route by role internally.
- **Google OAuth is not implemented**, not stubbed. Web uses `supabase.auth.signInWithOAuth({provider: "google"})` with a browser redirect — on RN this needs `expo-auth-session` + a proper deep-link callback, which is its own scope. No button is rendered for it (a non-functional button would be a fake feature); add it as its own phase.
- **PKCE flow, not implicit/cookie flow.** Web's Supabase client goes through `@supabase/ssr` cookies. RN's client sets `flowType: "pkce"` + `detectSessionInUrl: false`; the reset-password screen manually calls `exchangeCodeForSession()`. This is the current official Supabase guidance for native apps, but the deep-link cold-start path (app not running when the email link is tapped) is only verified in code review, not on a physical device/build — flag if issues show up in testing.
- **`database.types.ts` is a static copy**, not regenerated from the Supabase CLI. It's structurally loose (`Row/Insert/Update: any`) on web too, so this isn't a regression, but it means neither app is getting compile-time column checking yet.
- **Onboarding's live end-to-end flow (real sign-up → role → step-1 → step-2 → tabs handoff) was not exercised against a live Supabase project + running Next.js API server in this pass** — verification here was `tsc`/lint clean plus confirming the new 3-way auth guard doesn't regress the unauthenticated redirect (still lands on sign-in). Please try it on-device against your real backend and report back if anything doesn't flip over as expected.
- ~~**"Change password" ... is omitted from settings/profile, not stubbed.**~~ Resolved — see the Change password phase above.
- **"Become a seller" is omitted from settings/profile, not stubbed.** Web's settings page links it to `/onboarding` — that route lives in the `(onboarding)` group which `Stack.Protected` unmounts once `onboardingComplete` is true, so it's unreachable from an already-onboarded buyer today. Real fix, not a workaround: needs a role-upgrade path that can re-enter `(onboarding)` for an already-complete profile, which the guard doesn't support yet. Scoped follow-up, noted here rather than half-built.
- **Profile/settings live end-to-end flow (viewing real account data, language switch persisting, sign-out landing back on sign-in) was not exercised against a live authenticated session in this pass** — same reason as onboarding above (needs a live Supabase account). Verified: `tsc`/lint clean, tab restructuring doesn't break the unauthenticated redirect.
- ~~**"View product" is omitted from the per-store bag screen, not stubbed.**~~ Resolved in the Public store phase — `bag/[username].tsx` now links to `/store/[username]/product/[itemId]`.
- **`ProductMedia`'s video-rendering branch was never ported**, only the still-image path (via `expo-image`) — see Phase 4 note above for why that's actually correct for these two screens, not a shortcut. Whichever future screen first needs to render a *live* video (not a poster) — likely product detail or the seller dashboard's asset library — is what should introduce the `expo-video` port, not this phase.
- **Bag's live end-to-end flow (add-to-bag from a real store, guest→auth merge on login, WhatsApp checkout deep link) was not exercised against a live backend in this pass** — same reasoning as onboarding/profile above. Note in particular: add-to-bag itself isn't reachable from any RN screen yet either (it lives on the public-store product page, not yet ported), so the guest bag can currently only be populated via direct API calls or dev tools — worth keeping in mind when testing.
- **Image crop UI, background removal, "prettify" AI enhancement, and video-as-main-media are all dropped from item creation/edit, not stubbed.** Web's pipeline (`react-easy-crop` canvas crop → optional `@imgly/background-removal` WASM → optional prettify API round-trip → optional video + `generateVideoThumbnailBlobs` frame extraction → resumable tus upload) is entirely browser-only. What ported: `expo-image-picker` with `allowsEditing`/`aspect:[4,5]` for the OS's native crop UI (same trade-off pattern as SF Symbol tab icons — native affordance over pixel parity). What didn't: background removal and prettify need a net-new ML dependency, not a port; video needs frame-extraction (`expo-video-thumbnails`-equivalent) that doesn't exist yet in this app. Item creation ships fully functional, photo-only.
- **Several web form interactions were simplified, not degraded in data model.** Category: web is a full parent/child drill-down tree with nested custom-category creation inside a search drawer; RN is a flat top-level list (`CATALOG.CATEGORIES`, 10 items) plus free-text custom entry — same `category` field, one less navigation level. Tags/Collections: web's multi-select drawers with presets became plain comma-separated text inputs. Stock: web's dedicated drawer with a "committed/available" breakdown (that references bag-reservation concepts not built here) became a plain number field. Variants (nested option/value picker producing a JSON array) was **dropped entirely** — lowest core value, most nested-UI complexity; `ItemInput.variants` is simply never populated by this pass.
- **Dashboard screens are English-only — the extensive `NewItem`/`DashboardPage`/`DashboardStats`/`Settings`/`AssetsPage`/`AnalyticsPage` i18n namespaces were not ported.** Given the sheer size of this phase, cutting i18n copy (a polish layer) was the most sensible place to economize while keeping 100% of the functional/data-model parity. Every other phase (auth, onboarding, profile, bag) is fully localized en/es; dashboard is the one gap. Worth a dedicated follow-up pass.
- **`Authorization: Bearer <token>` header added to `src/lib/api/client.ts`'s `apiRequest()`** (attaches the current Supabase session's access token to every request unless already set). This landed outside this conversation partway through the phase — noted here since every domain client built in this pass (catalog/analytics/assets, plus all earlier phases retroactively) depends on it for the backend to recognize the calling user in RN, where there's no shared cookie jar with the web app the way `@supabase/ssr` provides on web.
- ~~**Store catalog / public storefront / product detail duality confirmed but not acted on.**~~ Public storefront + product detail landed in the Public store phase below — this pass only built the seller-facing "manage my own catalog" screen (`dashboard-store/index.tsx`).
- **Public store's curated sections and promo modal are dropped, not stubbed.** Web's `[username]/**` route has a "Featured Picks"/collection-row editorial layer and an anonymous-visitor promo/signup modal — both are marketing/growth surface layered on top of the core catalog-browsing loop, not part of it. Skipped for this pass; revisit if/when the native app grows a growth-marketing surface.
- **Product detail's photo gallery has no video-thumbnail-seek.** Consistent with Phase 5's video-as-main-media deferral — the gallery only renders stills (`expo-image`), never a live video frame-scrub.
- **Public store's live end-to-end flow (real seller storefront, add-to-bag from product detail, WhatsApp checkout from both storefront and product page) was not exercised against a live backend in this pass** — same reasoning as every phase since onboarding. This is the phase that finally makes bag's add-to-bag path reachable in the UI — worth prioritizing for real-device testing since it closes the marketplace loop end-to-end for the first time.
- **Dashboard's live end-to-end flow (real seller account, item photo upload hitting `/api/storage/upload`, realtime item list updates, analytics numbers) was not exercised against a live backend in this pass** — same reasoning as every phase since onboarding. This is the largest phase yet to need real-device verification; prioritize testing item creation (the image upload path) first since it's the newest kind of operation (multipart file upload) this app has attempted.

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

## Excluded from this migration arc

Everything below was in flight as backlog through the Change password phase.
The arc is now closed with these deliberately left out — not stubbed, not
half-built, just not started. Each can become its own future phase if
reprioritized.

| Area | Web reference | Why it's excluded |
|---|---|---|
| Legal pages (privacy, terms) | `app/[locale]/privacy`, `app/[locale]/terms` | Simple static screens; needed for eventual app-store submission but not for this arc |
| Live backend/device verification | All migrated phases | Authenticated onboarding, profile/settings, bag, item creation/upload, realtime catalog updates, analytics, checkout, and change-password all still need exercising against the real Supabase/API stack — flagged throughout, not done in this arc |
| Become a seller (role upgrade) | Web reuses `/onboarding` | Needs a role-upgrade path that can re-enter `(onboarding)` for an already-`onboardingComplete` profile |
| Item variants (option/value pairs) | `item-details-form/VariantsField.tsx` | Nested option→value picker UI, dropped for this pass — `ItemInput.variants` unpopulated |
| Background removal / "prettify" AI photo enhancement | `PhotosSection.tsx` | Needs a net-new ML dependency (WASM-based on web), not a straightforward port |
| Video as item main-media | `ImageUploadSlot.tsx`, `video-thumbnails.ts` | Needs frame-extraction capability (`expo-video-thumbnails`-equivalent) not yet in this app |
| Dashboard i18n (en/es copy) | `NewItem`/`DashboardPage`/`Settings`/`AssetsPage`/`AnalyticsPage` namespaces | English-only for now — cut to keep the dashboard phase shippable; every other phase is fully localized |
| `ProductMedia` video-rendering branch | `components/ProductMedia.tsx` | No RN screen renders a *live* video yet (bag/dashboard/product-gallery only ever show poster stills) |
| Google OAuth | `auth/page.tsx` `signInWithOAuth` | Needs `expo-auth-session` deep-link callback flow |
| Public store curated sections + promo modal | `app/[locale]/[username]/**` "Featured Picks"/collection rows, anonymous promo modal | Marketing/growth layer on top of the core catalog-browsing loop, dropped for this pass |

## Dependency compatibility (condensed)

| Reuse as-is | Swap for RN |
|---|---|
| zustand, @tanstack/react-query, zod, react-hook-form, @hookform/resolvers, @supabase/supabase-js, i18next/react-i18next, libphonenumber-js, class-variance-authority | framer-motion/motion → react-native-reanimated; shadcn/@radix-ui/cmdk → NativeWind primitives (this pass) / tamagui-restyle if the primitive set grows; vaul → RN Modal or `@gorhom/bottom-sheet`; sonner → a RN toast lib; recharts → Victory Native or react-native-chart-kit; lucide-react → lucide-react-native or expo-symbols; tailwindcss v4 (web) → separate NativeWind + tailwindcss v3 config here (independent packages, no conflict); react-easy-crop → expo-image-picker/native crop; onnxruntime-web / @imgly/background-removal → onnxruntime-react-native or drop (closet-only, N/A here); next-intl/next-i18next → i18next/react-i18next directly (done) |

## Known dev-only quirk resolved: NativeWind dark mode

Earlier web-preview runs (`expo start --web`, dev mode only) hit NativeWind's
web runtime error:

`Cannot manually set color scheme, as dark mode is type 'media'...`

`tailwind.config.js` now sets `darkMode: 'class'`, which removes the dev
overlay. That switch alone doesn't auto-follow the OS the way `'media'` did,
though — verified via web preview that `document.documentElement.className`
stayed empty under a dark `colorScheme` until a bridge was added: `src/app/_layout.tsx`
now calls NativeWind's `colorScheme.set()` inside a `useEffect` keyed on RN's
own `useColorScheme()`, so the app still auto-follows the device (matches
`app.json`'s `userInterfaceStyle: "automatic"`) instead of requiring a manual
theme toggle. Re-verified after the fix: `documentElement.className` is
`"dark"` under a dark `colorScheme` and the background renders black.

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

**Phase 5 (seller dashboard):**
- `npx tsc --noEmit` — clean. Same route-typegen lag as every phase that adds routes, plus one extra wrinkle this time: `/new-item` (the bare tab-group root) never becomes a valid typed-route literal because the group has no `index.tsx` (only `format.tsx`/`details.tsx`) — fixed by pointing `app-tabs.web.tsx`'s web `TabTrigger href` at `/new-item/format` directly instead of the group root (native's `NativeTabs.Trigger name="new-item"` doesn't have this issue since it references the segment by name, not a typed href).
- `npx expo lint` — clean (0 errors after two real fixes: a `Date.now()` call flagged by `react-hooks/purity` because it was inline inside a component's event handler — moved into a module-level helper function outside the component, same pattern already used elsewhere; an unescaped apostrophe in JSX text). One pre-existing-pattern warning left as-is: React Compiler skips memoizing around react-hook-form's `watch()` (inherent to the library, not something introduced carelessly, matches the same the class of warning already accepted on `phone-input.tsx` etc.)
- Web preview — confirmed the now much-larger route tree (role-aware tabs, nested stacks for `dashboard-store`/`new-item`, `assets`, `profile/store-settings`, `profile/analytics`) still redirects an unauthenticated session to `/sign-in` correctly; first bundle took ~13s (1739 modules, up from ~1700) due to `expo-image-picker`, not an error.
- Not yet verified: any live data — this phase has zero live-backend verification (see simplifications note above), and is the largest surface added in one pass. Prioritize testing the item-creation image upload path first on a real device/seller account.

**Public store (storefront + product detail):**
- `npx tsc --noEmit` — clean (0 errors)
- `npx expo lint` — clean (0 errors, 7 pre-existing warnings, none new). Fixed a React Compiler "could not preserve manual memoization" error in product detail (a `useMemo` dependency array `[item?.tags]` didn't match the compiler's inferred `[item]` — changed to match) and an `exhaustive-deps` warning in the storefront screen (wrapped `items` in its own `useMemo`). Also caught and fixed a real UI bug pre-verification: the floating bottom-nav pill overlapped product detail's own fixed bottom CTA bar — added a `FULLSCREEN_ROUTE_PATTERNS` entry in `bottom-nav.tsx`.
- Web preview — confirmed the new `store/[username]` and `store/[username]/product/[itemId]` routes bundle clean (1817ms, 1715 modules, 0 errors) and the root guard still redirects an unauthenticated session to `/sign-in` correctly (no regression from the new routes or the bottom-nav pattern change).
- Not yet verified: any live data — same reasoning as every phase since onboarding. This phase is the highest-value one to test on a real device first, since it's what finally makes add-to-bag reachable from the UI and closes the marketplace loop end-to-end.

**Change password:**
- `npx tsc --noEmit` — clean (0 errors)
- `npx expo lint` — clean (0 errors, same 7 pre-existing warnings, none new)
- Web preview — new `/profile/change-password` route bundled clean (1616ms, 1751 modules, 0 errors); confirmed the root guard still redirects an unauthenticated session to `/sign-in` correctly (no regression).
- Not yet verified: calling `updateUser({password})` against a live authenticated session — needs a real account to confirm the password actually rotates and the session survives the update.
