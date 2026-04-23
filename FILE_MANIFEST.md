# Push Button — File Manifest
**Last refreshed by audit:** 2026-04-21 07:06 EDT
**Canonical runtime:** `/Users/vortexventures/Desktop/Vortex Ventures/VVAxeOps/Projects/materialsolutionsnj/` @ commit `f777c58`
**Status:** Documents the actual on-disk state as verified by direct file-system enumeration. Not a spec — a factual inventory of what exists on disk.

---

## David Chat System — UI Components

### `/src/components/david/DavidChatWidget.tsx`
Main floating chat widget. Fixed bottom-right, collapsible, dark theme + golden accents. Streaming support via Zustand chatStore. Framer Motion animations. Quick chips on first load.

### `/src/components/david/DavidWidget.tsx`
Re-export shim — re-exports `DavidChatWidget` (the streaming Zustand-backed widget). No independent non-streaming routing.

### `/src/components/david/ChatWidget.tsx`
Dead code — legacy standalone widget, NOT imported anywhere in the app. Supplants by `DavidChatWidget` (mounted in layout.tsx). Routes to non-streaming `/api/david/message`. No functional role in current runtime.

### `/src/components/david/ChatMessage.tsx`
Individual message bubble. User (right, golden) vs. assistant (left, dark). Typing indicator (3 animated dots). Timestamp on hover.

### `/src/components/david/ChatInput.tsx`
Auto-growing textarea (max 4 lines / 100px). Enter to send, Shift+Enter for newline. Disabled during streaming.

### `/src/components/david/DavidAvatar.tsx`
Configurable sizes (sm/md/lg). Golden gradient. Pulsing glow ring. Green "Online" dot option.

### `/src/components/david/QuickChips.tsx`
Pre-written quick-action chips: "What forklifts...", "I need a quote", "Tell me about financing", "Speak with someone". Hidden after first user message.

### `/src/components/david/DavidControls.tsx`
David control surface — voice/speech input and Simli avatar controls.

### `/src/components/david/DavidHero.tsx`
Hero section component for the Meet David landing surface.

### `/src/components/david/DavidVideo.tsx`
Video component for the David surface.

---

## David Chat System — Hooks

### `/src/components/david/hooks/useDavidConvo.ts`
Conversation management hook for David. Handles streaming message state, session lifecycle.

### `/src/components/david/hooks/useSimli.ts`
Simli avatar integration hook.

### `/src/components/david/hooks/useSpeechInput.ts`
Speech-to-text input hook for voice-driven David interactions.

---

## David Chat System — API Routes

### `/src/app/api/david/chat/route.ts`
Primary mounted streaming endpoint at `POST /api/david/chat`. Streams NDJSON. Contract: `tool-less-structured-context-v1`. Advertises headers: `X-David-Stream-Protocol: ndjson-v1`, `X-David-Contract-Mode: tool-less-structured-context-v1`. Returns truthful fallback (no live inventory guessing) on production.

### `/src/app/api/david/chat/handler.ts`
Shared handler logic for the chat route. Used by route.ts.

### `/src/app/api/david/health/route.ts`
Health/readiness endpoint. Verifies Anthropic API key with a real call. Documents split David contract (Anthropic + Gemini).

### `/src/app/api/david/message/route.ts`
Canonical non-streaming message route. Legacy ChatWidget and legacy `/api/david` GET delegate here.

### `/src/app/api/david/session/route.ts`
Session management endpoint.

### `/src/app/api/david/tts/route.ts`
Text-to-speech endpoint.

### `/src/app/api/david/route.ts`
Legacy alias. GET returns `{"status":"legacy_alias","authoritative_route":"/api/david/chat"}`. Fenced to `/api/david/message` handler.

---

## David Chat System — Library

### `/src/lib/david/prompts.ts`
David system prompt (8.2 KB). Material Solutions NJ / Vortex Forklift (29 years). Equipment: reach trucks, order pickers, swing reaches, pallet jacks. Pricing: $2,500–$80k. Warm professional salesman personality. Lead qualification: Understand → Recommend → Gauge urgency → Capture → Connect.

### `/src/lib/david/core.ts`
Core David logic.

### `/src/lib/david/memory.ts`
Conversation memory management.

### `/src/lib/david/scoring.ts`
Lead scoring logic.

### `/src/lib/david/simli.ts`
Simli avatar configuration.

---

## Inventory API

### `/src/app/api/inventory/route.ts`
Inventory list endpoint. Production returns HTTP 200 with live DB rows — `public.inventory` table exists and PostgREST resolves it. When the table does not exist or PostgREST schema cache is stale, Supabase returns `{ data: null, error: null }`; handler.ts null-coalesces to `[]` and still returns 200 (graceful degradation). The `public.inventory` table **exists in production** (migration 009 applied, live probe confirmed 2026-04-20 00:55 EDT: 9 available order-picker units from MD-LOT-001, all `source_type: "lot_unit"`).

### `/src/app/api/inventory/[slug]/route.ts`
Inventory detail endpoint. Uses `inventory` table (not legacy `listings`).

### `/src/app/api/inventory/handler.ts`
Shared handler for inventory routes.

---

## Leads API

### `/src/app/api/leads/route.ts`
Lead capture endpoint.

### `/src/app/api/leads/callback/route.ts`
Callback scheduling endpoint.

### `/src/app/api/leads/handler.ts`
Shared handler for leads routes.

---

## State Management

### `/src/stores/chatStore.ts`
Zustand store. State: `isOpen`, `messages`, `isLoading`, `sessionId`, `listingContext`, `hasUserSentMessage`. Actions: `toggleChat`, `openChat`, `closeChat`, `sendMessage`, `setListingContext`, `clearMessages`. Session ID via `crypto.randomUUID()`.

---

## Database

### `/src/lib/supabase/server.ts`
Server-side Supabase client (`getSupabaseServer()`).

### `/src/lib/supabase/client.ts`
Browser Supabase client singleton (`getSupabaseBrowser()`).

---

## Utility

### `/src/lib/utils/cn.ts`
Tailwind class utility (clsx + tailwind-merge).

---

## Schema Migrations (on disk, not yet applied to production)

| File | Purpose | Production status |
|---|---|---|
| `supabase/migrations/007_add_lead_capture_fields.sql` | Lead capture schema additions | Applied (leads table responds HTTP 200) |
| `supabase/migrations/008_add_lead_capture_fallback_queue.sql` | Fallback queue table | Applied (queue table responds HTTP 200) |
| `supabase/migrations/009_create_inventory_table.sql` | Creates `public.inventory` | **APPLIED** — live probe @ 23:35 EDT: GET /api/inventory → 10 available units (9 lot units from MD-LOT-001 + standalone `RT-752R45TT-2018`); PostgREST schema cache resolves `inventory` |
| `supabase/migrations/010_create_inventory_marketing.sql` | Creates `public.inventory_marketing` canonical marketing cache | On disk; this lane already enforces the canonical path and removed the old legacy shadow copy. Production apply still depends on Chris/Nexus deploy sequencing. |
| `supabase/migrations/011_create_listing_status.sql` | Creates `public.listing_status` publish-status cache with unique `(unit_id, platform)` rows | On disk at the canonical Supabase path as of 2026-04-22; production apply still depends on the separate deploy/migration step from the pre-deploy runbook. |

---

## Open operational gaps

| Gap | Units | Status |
|---|---|---|
| 4 previously-held standalone units (now active per Chris 2026-04-21) — need reseed to production | `2016 Raymond 970CSR30T` (`RT-970CSR30T-2016`, legacy `SR-970CSR30T-2016`), `2018 Raymond 960CSR30TT` (`SR-960CSR30TT-2018`), `2019 Raymond 970CSR30T` (`RT-970CSR30T-2019`, legacy `SR-970CSR30T-2019`), `2019 Bendi B40` (`BENDI-B40-LANDOLL`) — all now `available`, `is_available=true`, `hold_reason: null` (Chris 2026-04-21 lock — serial confirmation gate cleared) | `RT-752R45TT-2018` is already synced to production as an available standalone. Chris's 2026-04-21 inventory lock reclassified the two `970CSR30T` units from swing reach to reach truck in source JSON; the remaining hold-unit sync is no longer a business decision — Chris 2026-04-21 lock cleared all 4 for publication. |
| `public.inventory` table | Live production proof @ 23:35 EDT: `curl https://www.materialsolutionsnj.com/api/inventory` returned HTTP 200 with 10 available units | Healthy from this seat; buyer-facing inventory truth is closed. |

---

## Verification commands

```bash
# Local test suite
npm test  # 98/98 PASS @ 81a316e

# Local build
npm run build  # PASS @ 81a316e

# Public chat streaming proof (production, live)
curl -X POST https://www.materialsolutionsnj.com/api/david/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What do you have?"}]}' \
  | head -5  # → NDJSON frames

# Public inventory proof (production, live)
curl https://www.materialsolutionsnj.com/api/inventory
# → HTTP 200, 10 available units: 9 lot_units (MD-LOT-001) + 1 standalone (RT-752R45TT-2018)
# 4 previously-held standalone units from data/forklift-inventory.json — now active per Chris 2026-04-21, need production reseed

# Featured filter (public route is healthy, currently no featured units)
curl "https://www.materialsolutionsnj.com/api/inventory?featured=true"
# → HTTP 200, 0 units (is_featured=false on all current units)

# Direct REST auth check (production Supabase)
curl https://材料...supabase.co/rest/v1/leads?select=id&limit=1 \
  -H "apikey: ..." -H "Authorization: Bearer ..."
# → HTTP 200 (credentials valid, project up)
```

---

## Push Button Sync — Gap Status

**Script:** `scripts/pushbutton_inventory_sync.mjs`
**Status: PARTIAL — production Vercel deployment `dpl_8gSEXFvQwBzq7MqnMosENDW7H99C` is live on `https://www.materialsolutionsnj.com`, and public `GET /api/inventory` now returns HTTP 200 with the 14 available units (9 lot units + 3 reach trucks + 1 swing reach + 1 bendy — all active per Chris 2026-04-21 lock). The remaining gap is production reseed: the 4 previously-held standalone units are now `available` in source JSON but not yet pushed to Supabase. Chris 2026-04-21 cleared the hold.**

### What a live sync would do
`node scripts/pushbutton_inventory_sync.mjs --dry-run` (no credentials required) confirms:
- **9 rows** from `MD-LOT-001` lot_units — in production DB, upsert would refresh them
- **1 row** from `standalone_units` (RT-752R45TT-2018) — row confirmed in Supabase and now visible through the live public frontend/API
- **4 rows** from `standalone_units` (now `available` per 2026-04-21 lock) — pending production reseed

### Standalone units sync status

| external_key | title | status | hold_reason | Supabase row | Live frontend |
|---|---|---|---|---|---|
| `RT-752R45TT-2018` | 2018 Raymond 752R45TT Reach Truck | available | null | **WRITTEN** (2026-04-20 22:45 EDT) | **YES** — live on `www.materialsolutionsnj.com` |
| `RT-970CSR30T-2016` (legacy `SR-970CSR30T-2016`) | 2016 Raymond 970CSR30T Reach Truck | available | null | NOT YET synced | N/A |
| `SR-960CSR30TT-2018` | 2018 Raymond 960CSR30TT Swing Reach | available | null | NOT YET synced | N/A |
| `RT-970CSR30T-2019` (legacy `SR-970CSR30T-2019`) | 2019 Raymond 970CSR30T Reach Truck | available | null | NOT YET synced | N/A |
| `BENDI-B40-LANDOLL` | 2019 Bendi B40 Articulated | available | null | NOT YET synced | N/A |

### Deployment status (re-grounded 2026-04-21 07:06 EDT)
- `HOME=/Users/vortexventures vercel inspect www.materialsolutionsnj.com` → **Ready**, custom domain aliased to `dpl_EZBct6MVj5F4nawhCxH1f5LAGdYv`
- `curl -i https://www.materialsolutionsnj.com/api/inventory` → **HTTP 200**, public API returns the live inventory payload
- `material-solutions.com/api/inventory` remains WordPress/legacy and is not the Push Button production domain
- Supabase `lrlwrxhapzainvxwygas.supabase.co` remains **LIVE** behind the current production deployment

### Decision required before running live
The sync script uses `upsert` (idempotent). The business question is not "will it break?" — it won't. The question is:
- ~~Should the 4 hold-status units be included in production inventory before serials are confirmed from Bill?~~ **RESOLVED 2026-04-21: Chris cleared all 4 for publication. Next action is production reseed, not a decision.**
- If no: ~~(obsolete)~~
- Action: all 4 now-active units sync in one shot with `node scripts/pushbutton_inventory_sync.mjs` (Chris-cleared 2026-04-21).

### Script verification (no credentials needed)
```bash
cd ~/Desktop/Vortex\\ Ventures/VVAxeOps/Projects/materialsolutionsnj/
node scripts/pushbutton_inventory_sync.mjs --dry-run
# → prints attempted: 14, statusCounts: { available: 14, hold: 0 } (post 2026-04-21 lock)
# → note: 10 available now includes RT-752R45TT-2018 (synced 2026-04-20 22:45 EDT)

node scripts/pushbutton_inventory_sync.mjs --preflight
# → safe readiness probe; reports envPath, envFileExists, inventoryExists,
#   missingEnv, and readyForWrite without attempting Supabase auth or writes

HOME=/Users/vortexventures npx -y tsx scripts/email_campaign_acceptance_probe.mjs --preflight
# → safe email QA acceptance probe; renders all 3 inbound + 12 cold-outreach touches,
#   verifies compliance-footer coverage + template availability, and reports
#   spamassassin/spamc presence plus readyForOfflineSpamCheck from the current host

HOME=/Users/vortexventures ./node_modules/.bin/tsx scripts/lane_h_readiness_probe.mjs --preflight
# → aggregate read-only closeout probe; combines email acceptance, inventory sync,
#   and inventory marketing seed readiness into one JSON blocker report

HOME=/Users/vortexventures ./node_modules/.bin/tsx scripts/lane_h_readiness_probe.mjs --preflight --assert-ready
# → same JSON report, but exits non-zero when any blocker remains so CI / operators
#   can gate on overallReady without hand-parsing stdout
```

### Run live (after decision)
```bash
node scripts/pushbutton_inventory_sync.mjs
# → requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.production.pull
# → auth preflight still runs before any write attempt
```

---

**Last verified:** 2026-04-21 07:06 EDT from the live production custom domain + Vercel inspect
