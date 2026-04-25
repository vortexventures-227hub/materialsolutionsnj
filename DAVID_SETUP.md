# David Chatbot V1 - Material Solutions NJ

Complete AI sales specialist chatbot system for Material Solutions NJ / Vortex Forklift.

## System Overview

David is a warm, professional AI sales specialist who helps customers find the right forklift equipment. The system consists of:

- **Client Components**: React components with Framer Motion animations
- **Chat Store**: Zustand state management with real-time message streaming
- **Mounted storefront path today**: `DavidChatWidget` -> `src/stores/chatStore.ts` -> `/api/david/chat`
- **Parallel path on disk**: `/api/david/message` using Gemini + rate-limit/session controls, but it is not the mounted storefront widget route yet
- **System Prompt**: Comprehensive David personality and sales flow, with some older docs still overstating tool/memory readiness

## File Structure

```
src/
├── lib/
│   ├── constants.ts              # David's system prompt
│   ├── utils/
│   │   └── cn.ts                 # Tailwind class utility
│   └── supabase/
│       ├── server.ts             # Server-side Supabase client
│       └── client.ts             # Browser Supabase client
├── stores/
│   └── chatStore.ts              # Zustand chat state management
├── components/david/
│   ├── DavidChatWidget.tsx        # Main floating chat widget
│   ├── ChatMessage.tsx             # Individual message component
│   ├── ChatInput.tsx               # Message input area
│   ├── DavidAvatar.tsx             # Avatar component (reusable)
│   └── QuickChips.tsx              # Quick action buttons
└── app/api/david/
    └── chat/
        └── route.ts              # Chat API endpoint (streaming)
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

**Required packages** (should already be in your project):
- `@anthropic-ai/sdk` - Anthropic API client
- `@supabase/supabase-js` - Supabase client (optional)
- `zustand` - State management
- `framer-motion` - Animations
- `lucide-react` - Icons
- `clsx` + `tailwind-merge` - Class utilities

### 2. Configure Environment Variables

Create a `.env.local` file (see `.env.local.example`):

```bash
# Mounted storefront David path today
ANTHROPIC_API_KEY=sk_test_xxxxx

# Parallel /api/david/message path
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
UPSTASH_REDIS_REST_URL=https://your-upstash-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Optional voice/avatar surfaces
OPENAI_API_KEY=your_openai_key
OPENAI_TTS_MODEL=tts-1-hd
OPENAI_TTS_VOICE=onyx
SIMLI_API_KEY=your_simli_server_key
SIMLI_FACE_ID=your_simli_face_id
NEXT_PUBLIC_SIMLI_FACE_ID=your_public_simli_face_id

# Stubbed / future memory
ZEP_API_KEY=your_zep_key
```

### 3. Add Chat Widget to Your Layout

In your root layout or page where you want David:

```tsx
import { DavidChatWidget } from '@/components/david/DavidChatWidget';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <DavidChatWidget />
      </body>
    </html>
  );
}
```

### 4. Configure Tailwind (if not already done)

Ensure your `tailwind.config.ts` includes the custom colors:

```js
{
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0A0A0F',
        'bg-secondary': '#1a1a24',
        'bg-tertiary': '#2a2a35',
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        'accent-primary': '#E8B800',
        'accent-ai': '#E8B800',
      },
    },
  },
}
```

## Features

### David's Capabilities

- **Warm & Professional**: Natural conversation style, not robotic
- **Intelligent Qualification**: Understands customer needs, budgets, timelines
- **Smart Recommendations**: Suggests equipment based on requirements
- **Lead Capture**: Gathers contact info from serious prospects
- **Backend action receipts**: Mounted `/api/david/chat` can surface verified inventory lookups, listing-detail lookups, lead capture, and callback-request receipts in structured NDJSON frames when those backend actions actually fire
- **Transparent**: Honest about being AI, offers human connection
- **Never Fabricates**: Won't make up inventory or prices

### Runtime truth before you ship

- The mounted storefront widget currently talks to `/api/david/chat` through `src/stores/chatStore.ts`.
- `/api/david/message` is a real parallel path on disk, but it is not the mounted storefront route yet.
- Tool schemas shown in older chat docs do not equal live tool execution.
- `src/lib/david/memory.ts` is currently stubbed, so do not claim live persistent memory.
- Canonical runtime now includes a real `/api/leads/callback` route, and the mounted `/api/david/chat` path locally verifies callback-request capture metadata/receipts in focused tests. Do not overstate this as a fresh public-production probe unless you re-run live wire checks.

### Widget Features

- **Floating Button**: Bottom-right corner with pulsing glow
- **Smooth Animations**: Scale, fade, and entrance animations (Framer Motion)
- **Real-time Streaming**: Messages stream as they're generated
- **Auto-scroll**: Automatically scrolls to latest message
- **Responsive**: Full-screen on mobile, 400px on desktop
- **Quick Chips**: Pre-written questions for new users
- **Typing Indicator**: Shows when David is thinking
- **Dark Theme**: Premium dark UI with golden accents

### Chat Store Features

- **Session ID**: Unique session per visitor
- **Message History**: Full conversation history
- **Streaming Messages**: Real-time text updates
- **Listing Context**: Can be configured with product context
- **Error Handling**: Graceful error messages

## API Endpoint

### POST `/api/david/chat` (currently mounted storefront path)

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Do you have reach trucks?" },
    { "role": "assistant", "content": "..." }
  ],
  "sessionId": "uuid",
  "listingContext": {
    "id": "listing-123",
    "title": "Raymond Reach Truck",
    "make": "Raymond",
    "model": "RX",
    "year": 2020
  }
}
```

**Response:** NDJSON stream of structured frames (`context`, optional `action_receipt`, `text_delta`, `done`) carrying truthful runtime metadata and any backend-action receipts that actually fired.

**Important truth note:** the currently mounted storefront path should not be sold as generic tool-executing or persistently stateful. What is source/test-verified in the canonical runtime today is narrower: `/api/david/chat` can emit truthful backend-action receipts (inventory lookup, listing details, lead capture, callback request) when those paths succeed. `/api/david/message` should stay fenced until the widget is actually converged onto it.

## Customization

### Change David's Personality

Edit `src/lib/constants.ts` - Update `DAVID_SYSTEM_PROMPT` with new personality traits, company info, or sales approach.

### Customize Colors

Update theme colors in `tailwind.config.ts` or Tailwind classes in components.

### Modify Quick Chips

Edit `src/components/david/QuickChips.tsx` - Change `DEFAULT_CHIPS` array.

### Add Tool Handlers

Extend the API route (`src/app/api/david/chat/route.ts`) to handle tool calls with Supabase queries.

## Troubleshooting

### Chat not appearing?
- Ensure `DavidChatWidget` is added to your layout
- Check browser console for errors
- Verify Anthropic API key is set

### Streaming not working?
- Check that Response stream headers are correct
- Verify API endpoint is accessible
- Look at network tab for streaming response

### Tool behavior unclear?
- Older docs refer to tool-backed behavior, but the currently mounted storefront behavior must be verified from `/api/david/chat`
- The parallel `/api/david/message` path should not be treated as buyer-path truth until the widget actually uses it
- If you want to market tool execution, wire and verify it first in the real mounted path

### Styling issues?
- Ensure Tailwind CSS is properly configured
- Check that custom color tokens are defined
- Verify `cn()` utility is imported correctly

## Performance Tips

- David uses `claude-haiku-4-5-20251001` for low latency
- Messages stream in real-time (no waiting for full response)
- Chat store uses Zustand for efficient state updates
- Components use React.memo and proper key props for optimization
- Framer Motion animations are GPU-accelerated

## Production Checklist

- [ ] Anthropic key configured for the currently mounted `/api/david/chat` path
- [ ] Gemini key configured if you are explicitly enabling `/api/david/message`
- [ ] Supabase + Telegram configured for lead-state and owner visibility
- [ ] Upstash configured if you expect production rate governance
- [ ] Any voice/avatar feature gated unless OpenAI + Simli are configured
- [ ] No persistent-memory claim unless Zep is implemented beyond the current stub
- [x] Canonical runtime callback route exists and focused coverage is on disk (`tests/callback-route-truth.test.ts`, `tests/david-chat-handler.test.ts`)
- [ ] API key configured in environment variables
- [ ] Error handling tested with network issues
- [ ] Streaming response tested in production environment
- [ ] Mobile responsiveness verified on real devices
- [ ] Accessibility tested (ARIA labels, keyboard navigation)
- [ ] Rate limiting configured if needed
- [ ] Supabase configured if using tool handlers
- [ ] Analytics integrated if desired
- [ ] Feedback mechanism for customers implemented

## Support

For issues or questions about David Chatbot V1, refer to:
- Anthropic API docs: https://docs.anthropic.com
- Framer Motion: https://www.framer.com/motion/
- Zustand: https://github.com/pmndrs/zustand

---

**Built for Material Solutions NJ / Vortex Forklift**
27+ years in business, serving NJ, Eastern PA, and NYC metro
(973) 625-5000
