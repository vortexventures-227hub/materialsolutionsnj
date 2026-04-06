# David Chatbot V1 - Material Solutions NJ

Complete AI sales specialist chatbot system for Material Solutions NJ / Vortex Forklift.

## System Overview

David is a warm, professional AI sales specialist who helps customers find the right forklift equipment. The system consists of:

- **Client Components**: React components with Framer Motion animations
- **Chat Store**: Zustand state management with real-time message streaming
- **API Route**: Next.js API endpoint using Anthropic SDK (claude-haiku-4-5-20251001)
- **System Prompt**: Comprehensive David personality with company knowledge and sales flow

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
# Required
ANTHROPIC_API_KEY=sk_test_xxxxx

# Optional (David works without Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
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
- **Tool Integration**: Can search inventory, get listing details, schedule callbacks
- **Transparent**: Honest about being AI, offers human connection
- **Never Fabricates**: Won't make up inventory or prices

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

### POST `/api/david/chat`

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

**Response:** Streaming text (text/plain with chunked encoding)

**Tools Available:**
- `search_inventory` - Search products by make, type, capacity, price
- `get_listing_details` - Get full details for a specific listing
- `capture_lead` - Log a prospect with contact info
- `schedule_callback` - Schedule a call with the team

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

### Tools not being called?
- Tools are defined but require backend handlers
- Implement tool handlers in API route to query Supabase
- David will naturally suggest tools when appropriate

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
(973) 500-1010
