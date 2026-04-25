# David Chatbot V1 - Quick Start Guide

Get David Chatbot running in 5 minutes.

## Prerequisites

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS configured
- These packages installed:
  - `@anthropic-ai/sdk`
  - `zustand`
  - `framer-motion`
  - `lucide-react`

## Step 1: Copy Files

Copy all files from David Chatbot system to your project:

```
src/
├── lib/constants.ts
├── lib/utils/cn.ts
├── lib/supabase/server.ts
├── lib/supabase/client.ts
├── stores/chatStore.ts
├── components/david/DavidChatWidget.tsx
├── components/david/ChatMessage.tsx
├── components/david/ChatInput.tsx
├── components/david/DavidAvatar.tsx
├── components/david/QuickChips.tsx
└── app/api/david/chat/route.ts
```

## Step 2: Set Environment Variable

Create `.env.local`:

```bash
ANTHROPIC_API_KEY=sk_your_key_here
```

(Get your key from https://console.anthropic.com)

## Step 3: Add to Layout

In your root layout (`app/layout.tsx`):

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

## Step 4: Test

```bash
npm run dev
```

Look for a golden "D" button in the bottom-right corner.

Click it → Chat opens → Type a message → David responds!

## What You Get

- ✅ Floating chat widget (bottom-right)
- ✅ Real-time message streaming
- ✅ Dark theme with golden accents
- ✅ Mobile responsive
- ✅ Sales-focused AI (not customer support)
- ✅ Lead capture ready
- ✅ Smooth animations

## Customization

### Change Company Info

Edit `src/lib/constants.ts` - Update `DAVID_SYSTEM_PROMPT`

### Change Quick Chips

Edit `src/components/david/QuickChips.tsx` - Update `DEFAULT_CHIPS`

### Change Colors

Update `tailwind.config.ts` with your brand colors, or edit component classes.

## Troubleshooting

**Chat not appearing?**
- Check API key is set in `.env.local`
- Verify `DavidChatWidget` is in your layout
- Check browser console for errors

**Messages not working?**
- Confirm Anthropic API key is valid
- Check network tab - should see `/api/david/chat` request
- Verify response is streaming (chunked encoding)

**Styling issues?**
- Ensure Tailwind colors are configured
- Check that `cn()` utility is imported from `@/lib/utils/cn`

## Next Steps

1. Read `DAVID_SETUP.md` for detailed documentation
2. Read `INTEGRATION_EXAMPLE.md` for advanced features
3. Customize David's system prompt for your needs
4. Add Supabase integration for inventory/leads (optional)
5. Deploy and monitor API usage

## API Reference

### Request: `POST /api/david/chat`

```json
{
  "messages": [
    { "role": "user", "content": "Do you have reach trucks?" }
  ],
  "sessionId": "uuid-string",
  "listingContext": {
    "id": "listing-123",
    "title": "Raymond Reach Truck",
    "make": "Raymond",
    "model": "RX",
    "year": 2020
  }
}
```

### Response

Streaming text with proper headers for chunked transfer.

## File Sizes

- `DavidChatWidget.tsx`: 7.2 KB
- `chatStore.ts`: 5.0 KB
- `route.ts`: 7.4 KB
- `constants.ts`: 5.5 KB
- Other components: ~10 KB total
- **Total: ~35 KB** of code (minified: ~9 KB)

## Performance

- Uses lightweight `claude-haiku-4-5-20251001` model
- Streaming response = instant user feedback
- Zustand = minimal re-renders
- Framer Motion = GPU-accelerated animations
- Chat widget = no impact on page performance

## Company Info (Already Configured)

- **Business**: Material Solutions NJ / Vortex Forklift
- **Experience**: 27+ years
- **Location**: NJ, Eastern PA, NYC metro
- **Equipment**: Raymond, Toyota, Crown forklifts
- **Pricing**: Reach trucks $15k-$18k, Order pickers $14k-$16k, etc.
- **Owner**: Bill White
- **Phone**: (973) 625-5000

## Support Resources

- Anthropic API docs: https://docs.anthropic.com
- Framer Motion: https://www.framer.com/motion/
- Zustand: https://github.com/pmndrs/zustand
- Next.js: https://nextjs.org/docs

---

**Ready to deploy!** Questions? See `DAVID_SETUP.md`

