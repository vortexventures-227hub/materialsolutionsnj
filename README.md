# Material Solutions NJ

**27+ years serving New Jersey with quality forklifts and warehouse solutions.**

A cutting-edge, agentic AI-powered website for Material Solutions NJ. Features David, an AI sales specialist powered by Claude, with persistent memory, lead scoring, and real-time owner notifications.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude API (Sonnet) via Anthropic SDK
- **Memory:** Zep Cloud (conversation persistence)
- **Notifications:** Telegram Bot API
- **Deployment:** Vercel-ready

## ✨ Features

### David AI Sales Agent
- 24/7 AI-powered chat widget
- Context-aware responses based on page/inventory viewed
- Persistent conversation memory (Zep Cloud)
- Automatic lead scoring
- Real-time owner notifications via Telegram

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
cd ~/Desktop/VVAxeOps/Projects/materialsolutionsnj
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

Required variables:
- `ANTHROPIC_API_KEY` — Claude API for David
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role
- `ZEP_API_KEY` — Zep Cloud for memory (optional but recommended)
- `TELEGRAM_BOT_TOKEN` — For owner notifications
- `TELEGRAM_CHAT_ID` — Chat to send notifications to

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
3. Copy the token to `TELEGRAM_BOT_TOKEN`
4. Get your chat ID (message the bot, then check `https://api.telegram.org/bot<token>/getUpdates`)
5. Add chat ID to `TELEGRAM_CHAT_ID`

### 6. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

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

## 📈 Analytics (Coming in Phase 2)

- PostHog integration planned
- Conversion tracking
- Conversation analytics
- Lead source attribution

---

Built with 🪓 by the Vortex Ventures team
