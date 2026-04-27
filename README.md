# Material Solutions NJ

**27+ years serving New Jersey with quality forklifts and warehouse solutions.**

A Next.js storefront for Material Solutions NJ. Current runtime includes buyer-facing inventory, lead capture, and David chat surfaces, but some advanced AI capability claims in older docs are ahead of the inspected production-hardening state. Use `docs/P0_RUNTIME_CAPABILITY_MATRIX.md` as the source of truth during Packet 0 closeout.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **AI:** Anthropic on the currently mounted David widget path, with a parallel Gemini message path also present in the repo
- **Memory:** Zep scaffolding exists, but the inspected runtime integration is currently stubbed
- **Notifications:** Telegram Bot API
- **Rate limiting:** Upstash Redis on the active `/api/david/message` path
- **Deployment:** Vercel-ready

## ✨ Features

### David AI Sales Agent
- Buyer-facing chat widget mounted in the storefront layout
- Context-aware responses based on page and viewed inventory
- Lead scoring and notification plumbing
- A mounted David widget path today on `/api/david/chat`, plus a separate `/api/david/message` path under parallel development
- Optional voice/avatar surfaces behind separate OpenAI and Simli configuration

> Runtime truth note: do not claim live persistent memory, callback scheduling, or tool-executing chat unless you have re-verified those paths in the canonical runtime.

### Inventory System
- Filterable listings (type, capacity, price, hours)
- Individual listing pages with photo galleries
- Full specifications display
- Multi-point inspection checklist
- Warranty information
- Transparent pricing

### Lead Management
- Automatic scoring based on conversation signals
- Contact info extraction from chat
- Hot/warm/cool lead classification
- Telegram notifications for qualified leads

## 📁 Project Structure

```
materialsolutionsnj/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── david/         # David AI endpoints
│   │   │   ├── inventory/     # Inventory CRUD
│   │   │   └── leads/         # Lead capture
│   │   ├── inventory/         # Inventory pages
│   │   ├── about/             # About page
│   │   └── contact/           # Contact page
│   ├── components/            # React components
│   │   ├── david/            # Chat widget
│   │   ├── inventory/        # Listing cards, filters, gallery
│   │   └── ui/               # Shared UI components
│   └── lib/                  # Utilities
│       ├── david/            # AI core, prompts, scoring
│       ├── db/               # Supabase client
│       └── notifications/    # Telegram integration
├── knowledge/                # David's knowledge base
└── public/                   # Static assets
```

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
cd ~/Desktop/Vortex Ventures/VVAxeOps/Projects/materialsolutionsnj
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

Base production variables depend on which surfaces you expect to run:
- `ANTHROPIC_API_KEY` — required for the currently mounted David widget path on `/api/david/chat`
- `GEMINI_API_KEY` — required for the separate `/api/david/message` path if you are explicitly enabling that flow
- `NEXT_PUBLIC_SUPABASE_URL` — required for production lead + lead-state data paths
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required for client/server Supabase access
- `SUPABASE_SERVICE_ROLE_KEY` — required for server-side writes
- `DAVID_LEAD_TELEGRAM_BOT_TOKEN` — preferred bot token for customer lead alerts; should be David's bot, not an internal agent bot
- `DAVID_LEAD_TELEGRAM_CHAT_ID` — preferred destination chat for customer lead alerts
- `TELEGRAM_BOT_TOKEN` — legacy fallback for notifications when a David-specific lead bot is not configured
- `TELEGRAM_CHAT_ID` — legacy fallback destination when a David-specific lead chat is not configured

Feature-specific or path-specific variables:
- `UPSTASH_REDIS_REST_URL` — required for governed rate limits on `/api/david/message`
- `UPSTASH_REDIS_REST_TOKEN` — required for governed rate limits on `/api/david/message`
- `OPENAI_API_KEY` / `OPENAI_TTS_MODEL` / `OPENAI_TTS_VOICE` — TTS route
- `SIMLI_API_KEY` / `SIMLI_FACE_ID` / `NEXT_PUBLIC_SIMLI_FACE_ID` — avatar/session route
- `ZEP_API_KEY` — memory scaffolding exists, but current inspected integration is stubbed
- `FSM_API_BASE` / `FSM_SERVICE_JWT` — preferred production external backend client helper paths
- `NEXT_PUBLIC_BACKEND_URL` / `BACKEND_API_KEY` — legacy aliases for external backend client helper paths

### 3. Database Setup

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor
3. Run the contents of `supabase-schema.sql`
4. Copy your project URL and keys to `.env.local`

### 4. Zep Cloud Setup (Optional)

1. Create account at https://www.getzep.com/
2. Get your API key
3. Add to `.env.local`

### 5. Telegram Bot Setup

1. Message @BotFather on Telegram
2. Create a new bot with `/newbot`
3. Copy David's bot token to `DAVID_LEAD_TELEGRAM_BOT_TOKEN`
4. Get your chat ID (message the bot, then check `https://api.telegram.org/bot<token>/getUpdates`)
5. Add the destination chat ID to `DAVID_LEAD_TELEGRAM_CHAT_ID`
6. Keep `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` only as legacy fallback values; do not point customer lead alerts at Axis/Patch/Herm bots.

### 6. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add the exact environment variables needed for the surfaces you are actually enabling
4. Deploy

Before calling a deploy production-ready, verify against `docs/P0_RUNTIME_CAPABILITY_MATRIX.md` so older docs do not overstate memory, callback, or tool-execution readiness.

### Manual

```bash
npm run build
npm start
```

## 📝 Adding Inventory

1. Go to Supabase dashboard
2. Navigate to Table Editor → inventory
3. Insert new rows with equipment data
4. Or use the API: `POST /api/inventory` (requires service role)

## 🔧 Configuration

### Lead Scoring Points (src/lib/david/scoring.ts)
- Return visit: +10
- Multiple inventory views: +15
- Pricing questions: +20
- Financing questions: +25
- Contact info provided: +30
- Timeline mentioned: +20
- Fleet buyer: +25

### Lead Status Thresholds
- 🔥 HOT: 80+ points
- 🟡 WARM: 40-79 points
- 🔵 COOL: 0-39 points

## 📱 Customization

### Update Business Info
- Phone number: Search for `(XXX) XXX-XXXX` and replace
- Email: Update `info@materialsolutionsnj.com`
- Address: Add in Footer and Contact page

### David's Personality
Edit `src/lib/david/prompts.ts` to adjust David's tone, knowledge, and conversation style.

## 🔒 Security Notes

- Never commit `.env.local`
- Use Supabase RLS for production
- Service role key only on server-side
- Sanitize user inputs
- Treat build success as insufficient proof of runtime readiness
- Missing Upstash means `/api/david/message` loses most meaningful rate-governance
- Callback-booking claims must stay fenced unless the canonical `/api/leads/callback` route and mounted `/api/david/chat` callback receipts remain verified. Current repo state has both route presence and focused local coverage; re-run live wire proof before claiming fresh public-production callback readiness.

## 📈 Analytics (Coming in Phase 2)

- PostHog integration planned
- Conversion tracking
- Conversation analytics
- Lead source attribution

---

Built with 🪓 by the Vortex Ventures team
