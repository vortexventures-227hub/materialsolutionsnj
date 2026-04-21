# P0 Runtime Capability Matrix

**Canonical runtime:** `~/Desktop/Vortex Ventures/VVAxeOps/Projects/materialsolutionsnj/`
**Last verified by Axis:** 2026-04-17 07:40 EDT
**Last refreshed by Herm:** 2026-04-21 03:06 EDT
**Purpose:** Packet 0 source-backed truth for what is actually wired, degraded, optional, or misleading in the current storefront runtime.

## Runtime authority
- **Authoritative repo for closeout:** `~/Desktop/Vortex Ventures/VVAxeOps/Projects/materialsolutionsnj/`
- **Do not accept prototype-only fixes from:** `~/Desktop/Vortex Ventures/VVAxeOps/material-solutions-app/materialsolutionsnj/`
- **Current git head:** `f60afc7` (was `7c0b233` — corrected 2026-04-21 04:18 EDT)

## Dependency and capability truth

| Surface | Runtime path(s) | Dependencies seen in source | Current truth | Operator note |
|---|---|---|---|---|
| Lead capture | `src/app/api/leads/route.ts` | Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), Telegram (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) | **Partially wired, under repair.** Current worktree shows in-flight lead truth fixes. Do not call hardened until forced-failure proof lands. Inventory contact CTAs now converge onto `/contact` with preserved attribution params instead of reopening chat. | Buyer-path trust blocker. |
| Storefront David chat | `src/components/david/DavidChatWidget.tsx`, `src/stores/chatStore.ts`, `src/app/api/david/chat/route.ts` | Anthropic (`ANTHROPIC_API_KEY`) | **Mounted storefront path uses `/api/david/chat` and now has focused local proof for truthful NDJSON runtime metadata + action receipts.** Current tests cover inventory/detail receipts, truthful fallback when inventory truth is unavailable, and callback-request metadata/receipts on the mounted path. | Treat mounted-widget truth as `/api/david/chat`; buyer-facing claims must stay scoped to what focused tests or fresh public probes actually prove. |
| Parallel David message path | `src/app/api/david/message/route.ts`, `src/lib/david/core.ts` | Gemini (`GEMINI_API_KEY`), Supabase, Telegram, Upstash (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) | **Real code path exists** (`/api/david/message`), but it is NOT the mounted storefront widget path — the mounted path is `/api/david/chat`. `src/components/david/hooks/useDavidConvo.ts` is dead code (removed `e65bc51`). Rate limits depend on Upstash. DB/notification failures are swallowed, so chat can still answer while ops visibility weakens. | Do not let docs for this path overwrite mounted storefront truth. |
| David memory | `src/lib/david/memory.ts` | `ZEP_API_KEY` | **Stubbed optional enhancement.** Env can be set, but add/get/search are placeholder logs, not real memory persistence. | Do not claim live persistent memory. |
| David voice / TTS | `src/app/api/david/tts/route.ts` | OpenAI (`OPENAI_API_KEY`, `OPENAI_TTS_MODEL`, `OPENAI_TTS_VOICE`) | **Real route exists.** Fails closed when OpenAI key is missing. | Voice readiness depends on OpenAI. |
| David avatar / session | `src/app/api/david/session/route.ts`, `src/lib/david/simli.ts` | Simli (`SIMLI_API_KEY`, `SIMLI_FACE_ID`, `NEXT_PUBLIC_SIMLI_FACE_ID`) | **Real route exists.** Disabled when Simli server key missing. | Voice/avatar is optional, not base chat readiness. |
| Rate limiting | `src/lib/ratelimit.ts` | Upstash Redis, daily caps envs | **Governed path exists only when Upstash is configured.** Without Redis, most checks allow traffic. | Missing Upstash means degraded guardrails. |
| Callback booking | `src/app/api/leads/callback/route.ts`, `src/lib/api/leads.ts`, `src/app/api/david/chat/handler.ts` | Supabase | **Route exists and now has focused local + built-app runtime verification.** `tests/callback-route-truth.test.ts` covers operator notification behavior on `POST /api/leads/callback`; `tests/david-chat-handler.test.ts` proves mounted `/api/david/chat` callback intent yields truthful `callbackCaptureState` plus `schedule_callback` receipt metadata; Herm's 2026-04-21 03:06 EDT receipt proves built-app `POST /api/leads/callback` updates a real Supabase `leads` row and survives read-back. | Local/runtime truth is verified; public-production callback readiness still needs a fresh live wire probe before being marketed as newly re-proven. |
| Knowledge / RAG | `knowledge/README.md`, `src/lib/david/core.ts` | knowledge files, Gemini | **Knowledge files exist, active retrieval wiring not proven in inspected message route.** `core.ts` uses prompt + conversation context, not demonstrated RAG fetch. | Do not claim live RAG until wired in code. |
| External backend integration | `src/lib/api/backend.ts` | `NEXT_PUBLIC_BACKEND_URL`, `BACKEND_API_KEY` | **Secondary surface exists.** Separate Render backend contract is present for some client helpers. | Dual-runtime risk remains and must be named in receipts. |

## Required env truth

### Required for base storefront build
- none enforced at install time beyond standard Next.js build deps, but build-green is **not** runtime-ready proof

### Required for trustworthy lead capture in production
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

### Required for currently mounted storefront David path
- `ANTHROPIC_API_KEY`

### Required for the parallel `/api/david/message` path
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Optional or feature-specific
- `OPENAI_API_KEY`, `OPENAI_TTS_MODEL`, `OPENAI_TTS_VOICE` for TTS
- `SIMLI_API_KEY`, `SIMLI_FACE_ID`, `NEXT_PUBLIC_SIMLI_FACE_ID` for avatar/session
- `ZEP_API_KEY` for future memory integration, currently stubbed
- `NEXT_PUBLIC_BACKEND_URL`, `BACKEND_API_KEY` for external backend client paths
- `MAX_DAILY_SESSIONS`, `MAX_DAILY_LLM_REQUESTS`, `MAX_DAILY_TTS_CHARS` for cost/abuse caps

## Shared definitions
- **operator-visible:** both of these must exist: 1) a durable recoverable record, and 2) a routed human-alert surface.
- **degraded mode:** feature stays buyer-visible only if the runtime truthfully discloses the limitation and still creates operator-visible evidence where applicable.
- **callback-capable:** only true once a real callback route or durable queue is present in the canonical runtime and verified. Current repo satisfies that bar locally via route presence + focused tests; a separate public-production probe is still a different proof tier.

## Verification commands
Run from `~/Desktop/Vortex Ventures/VVAxeOps/Projects/materialsolutionsnj/`:

```bash
git rev-parse --short HEAD
git status --short
rg -n "process\.env\.[A-Z0-9_]+" src | sed -E 's/.*process\.env\.([A-Z0-9_]+).*/\1/' | sort -u
rg -n "/api/david/message|/api/david/chat|schedule_callback|api/leads/callback|ZEP_API_KEY|UPSTASH|SIMLI|OPENAI|GEMINI|TELEGRAM" src README.md DAVID_SETUP.md knowledge/README.md vercel.json
npm run build
```

## Current Packet 0 closeout status
- Canonical runtime lock: **set**
- Dependency/capability truth matrix: **set**
- Callback capability truth: **locally + built-app runtime verified in canonical runtime; not freshly public-probed on this rep**
- Storefront David endpoint truth: **corrected to mounted `/api/david/chat`; `/api/david/message` exists but is not the mounted buyer path**
- Proof harness list beyond build: **set**
- Remaining blockers: any future public-production callback proof if operator packaging needs a fresh wire receipt beyond the now-closed local/runtime durability proof
