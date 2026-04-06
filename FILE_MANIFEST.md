# David Chatbot V1 - File Manifest

Complete list of files created for Material Solutions NJ chatbot system.

## Core System Files

### `/src/lib/constants.ts` (5.5 KB)
**David's System Prompt** - Core personality, company knowledge, and sales approach
- Company info: Material Solutions NJ / Vortex Forklift (27+ years)
- Equipment types: Reach trucks, order pickers, swing reaches, pallet jacks
- Pricing ranges: $4k-$80k depending on equipment
- Personality: Warm, professional, knowledgeable salesman
- Lead qualification flow: Understand → Recommend → Gauge urgency → Capture → Connect
- Tool definitions for inventory search, lead capture, callbacks

### `/src/stores/chatStore.ts` (5.0 KB)
**Zustand Chat State Management**
- State: `isOpen`, `messages`, `isLoading`, `sessionId`, `listingContext`, `hasUserSentMessage`
- Actions: `toggleChat`, `openChat`, `closeChat`, `sendMessage`, `setListingContext`, `clearMessages`
- Real-time streaming support
- Error handling with fallback messages
- Session ID generation with `crypto.randomUUID()`
- Automatic scroll-to-bottom behavior

### `/src/app/api/david/chat/route.ts` (7.4 KB)
**Next.js API Endpoint - Chat Handler**
- POST endpoint at `/api/david/chat`
- Uses Anthropic SDK with `claude-haiku-4-5-20251001` model
- Real-time message streaming with ReadableStream
- Dynamic system prompt building with listing context
- Tool definitions: `search_inventory`, `get_listing_details`, `capture_lead`, `schedule_callback`
- Graceful error handling and fallback responses
- Proper streaming headers for chunked transfer encoding

## UI Components

### `/src/components/david/DavidChatWidget.tsx` (7.2 KB)
**Main Floating Chat Widget**
- Fixed position bottom-right corner (z-50)
- Collapsible floating button with pulsing glow
- Expanded chat panel: 400px wide × 600px tall (responsive)
- Dark theme with golden accents
- Header with David avatar, name, "Online" indicator, minimize/close buttons
- Message area with auto-scroll
- Quick chips on initial load
- Smooth animations using Framer Motion (scale, fade, slide)
- Mobile responsive (full-screen on small screens)
- Uses Zustand chat store for all state

### `/src/components/david/ChatMessage.tsx` (2.4 KB)
**Individual Message Component**
- Supports user and assistant roles
- David messages: left-aligned, dark background, small avatar
- User messages: right-aligned, golden background, dark text
- Typing indicator: three animated dots during streaming
- Timestamp on hover
- Smooth fade-in animation on appearance
- Proper message role styling with rounded corners

### `/src/components/david/ChatInput.tsx` (2.6 KB)
**Message Input Area**
- Auto-growing textarea (max 4 lines, max 100px height)
- Send button with arrow icon (golden color on hover)
- Enter to send, Shift+Enter for newline
- Disabled state when loading
- Smooth transitions and active states
- Proper accessibility labels and ARIA attributes

### `/src/components/david/DavidAvatar.tsx` (1.8 KB)
**Reusable Avatar Component**
- Configurable sizes: sm (32px), md (40px), lg (56px)
- Golden gradient background with border
- Dynamic icon: "D" letter (lg) or Bot icon (sm/md)
- Optional pulsing glow ring
- Optional green "Online" status dot
- Premium styling with CSS gradients

### `/src/components/david/QuickChips.tsx` (1.4 KB)
**Quick Action Buttons**
- Pre-written questions for new users
- 4 default chips: "What forklifts...", "I need a quote", "Tell me about financing", "Speak with someone"
- Styled as rounded-full buttons with subtle borders
- Hover effects (color change, border highlight)
- Smooth fade-in animations with stagger effect
- Hidden after first user message

## Utility Files

### `/src/lib/utils/cn.ts`
**Tailwind Class Utility** - Combines clsx and tailwind-merge for clean class handling

### `/src/lib/supabase/server.ts`
**Server-side Supabase Client** - Exports `getSupabaseServer()` for backend queries

### `/src/lib/supabase/client.ts`
**Browser Supabase Client** - Exports `getSupabaseBrowser()` with singleton pattern

## Configuration Files

### `/.env.local.example`
**Environment Variables Template**
```
ANTHROPIC_API_KEY=sk_test_xxxxx
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### `/tsconfig.json`
**TypeScript Configuration** - Includes path aliases (`@/*` → `./src/*`)

## Documentation Files

### `/DAVID_SETUP.md` (Comprehensive Guide)
- System overview and architecture
- File structure breakdown
- Step-by-step setup instructions
- Feature overview
- Customization guides
- Troubleshooting section
- Performance tips
- Production checklist

### `/INTEGRATION_EXAMPLE.md` (Code Examples)
- Basic integration into Next.js layout
- Using chat store directly
- Setting listing context on product pages
- Analytics tracking
- Styling customizations
- API tool handler implementation
- Mobile optimization
- Unit testing examples
- Common issues and solutions

### `/FILE_MANIFEST.md` (This File)
- Complete file listing
- Description of each component
- Setup instructions
- Key features per file

## File Tree

```
src/
├── lib/
│   ├── constants.ts              [5.5 KB] ← DAVID_SYSTEM_PROMPT
│   ├── utils/
│   │   └── cn.ts                 [Utility]
│   └── supabase/
│       ├── server.ts             [Utility]
│       └── client.ts             [Utility]
├── stores/
│   └── chatStore.ts              [5.0 KB] ← Chat state management
├── components/david/
│   ├── DavidChatWidget.tsx        [7.2 KB] ← Main widget
│   ├── ChatMessage.tsx             [2.4 KB]
│   ├── ChatInput.tsx               [2.6 KB]
│   ├── DavidAvatar.tsx             [1.8 KB]
│   └── QuickChips.tsx              [1.4 KB]
└── app/api/david/
    └── chat/
        └── route.ts              [7.4 KB] ← API endpoint

Documentation:
├── DAVID_SETUP.md                [Setup guide]
├── INTEGRATION_EXAMPLE.md        [Code examples]
├── FILE_MANIFEST.md              [This file]
└── .env.local.example            [Configuration template]
```

## Installation Summary

1. **Copy all files** to your Next.js 14 project
2. **Install dependencies** (should already be installed):
   - `@anthropic-ai/sdk`
   - `zustand`
   - `framer-motion`
   - `lucide-react`
   - `clsx` + `tailwind-merge`

3. **Configure environment**:
   - Copy `.env.local.example` → `.env.local`
   - Add `ANTHROPIC_API_KEY=sk_...`

4. **Add to layout**:
   ```tsx
   import { DavidChatWidget } from '@/components/david/DavidChatWidget';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <DavidChatWidget />
         </body>
       </html>
     );
   }
   ```

5. **Test**:
   - Run `npm run dev`
   - Look for floating "D" button bottom-right
   - Click to open chat
   - Send a message to David

## Total System Size

- **TypeScript/TSX files**: ~27 KB of component and logic code
- **Documentation**: ~15 KB of setup and integration guides
- **Configuration**: Environment and TypeScript config files
- **Zero external bloat**: Uses only essential dependencies

## Key Architecture Decisions

1. **Streaming First**: Real-time message streaming with ReadableStream for responsive UX
2. **Zustand for State**: Lightweight, reactive state management
3. **Framer Motion for Animations**: GPU-accelerated, smooth animations
4. **Modular Components**: Each component has single responsibility
5. **Graceful Degradation**: Works without Supabase, Anthropic key only required
6. **Type Safety**: Full TypeScript implementation
7. **Dark Theme**: Premium Material Solutions NJ branding

## Next Steps After Installation

1. ✅ Copy files to project
2. ✅ Install dependencies
3. ✅ Configure `.env.local`
4. ✅ Add widget to layout
5. ⏭️ Test in development
6. ⏭️ Customize system prompt (optional)
7. ⏭️ Implement Supabase tool handlers (optional)
8. ⏭️ Deploy to production
9. ⏭️ Monitor API usage
10. ⏭️ Integrate analytics (optional)

---

**Created**: April 5, 2026
**System**: David Chatbot V1 for Material Solutions NJ
**Status**: Ready for integration
