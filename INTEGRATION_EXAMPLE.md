# David Chatbot Integration Examples

## Basic Integration

### Add to Root Layout (Next.js App Router)

```tsx
// app/layout.tsx
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

---

## Advanced Usage

### Using Chat Store Directly

```tsx
// components/CustomChatButton.tsx
'use client';

import { useChatStore } from '@/stores/chatStore';

export function CustomChatButton() {
  const { openChat, sendMessage } = useChatStore();

  const handleQuickStart = () => {
    openChat();
    // Optionally send a message immediately
    sendMessage("I'm interested in reach trucks");
  };

  return (
    <button onClick={handleQuickStart}>
      Chat with David
    </button>
  );
}
```

### Set Listing Context on Product Pages

```tsx
// app/products/[id]/page.tsx
'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { DavidChatWidget } from '@/components/david/DavidChatWidget';

export default function ProductPage({ params }: { params: { id: string } }) {
  const setListingContext = useChatStore((s) => s.setListingContext);

  useEffect(() => {
    // Set context when user views a product
    setListingContext({
      id: params.id,
      title: 'Raymond Reach Truck RX-50',
      make: 'Raymond',
      model: 'RX-50',
      year: 2021,
    });

    return () => {
      // Clear context when leaving page
      setListingContext(null);
    };
  }, [params.id, setListingContext]);

  return (
    <div>
      <h1>Raymond Reach Truck RX-50</h1>
      {/* Product details */}
      <DavidChatWidget />
    </div>
  );
}
```

### Track Chat Messages (Analytics)

```tsx
// hooks/useChatAnalytics.ts
'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';

export function useChatAnalytics() {
  const messages = useChatStore((s) => s.messages);

  useEffect(() => {
    // Track new messages
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage?.role === 'user') {
      // Send to analytics
      console.log('User message:', lastMessage.content);
      // Example: Segment, Mixpanel, etc.
    }
  }, [messages]);
}
```

---

## Styling Customizations

### Change Widget Colors

```tsx
// src/components/david/DavidChatWidget.tsx - Modify theme colors

// Instead of hardcoded colors, use CSS variables
const buttonClass = 'bg-[var(--chat-primary)] text-[var(--chat-text)]';
```

Then in `globals.css`:
```css
:root {
  --chat-primary: #E8B800;
  --chat-text: #F8FAFC;
  --chat-bg: #0A0A0F;
}

[data-theme="light"] {
  --chat-primary: #0066cc;
  --chat-text: #000;
  --chat-bg: #fff;
}
```

### Custom Message Styling

```tsx
// components/david/ChatMessage.tsx - Override message styles

const customMessageClass = cn(
  isAssistant
    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
    : 'bg-gray-200 text-gray-900',
);
```

---

## API Integration Examples

### Implement Tool Handlers

In `src/app/api/david/chat/route.ts`, add tool handling:

```typescript
// Inside the stream handler:
for await (const chunk of stream) {
  if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
    const toolName = chunk.content_block.name;
    const toolInput = chunk.content_block.input;

    let toolResult = '';

    if (toolName === 'search_inventory') {
      // Query Supabase
      const supabase = getSupabaseServer();
      const { data } = await supabase
        .from('listings')
        .select('*')
        .match(toolInput)
        .limit(5);
      toolResult = JSON.stringify(data);
    }

    // Send tool result back
    controller.enqueue(new TextEncoder().encode(toolResult));
  }
}
```

### Capture Lead in Database

```typescript
if (toolName === 'capture_lead') {
  const supabase = getSupabaseServer();
  
  const { error } = await supabase.from('leads').insert({
    name: input.name,
    email: input.email,
    phone: input.phone,
    company: input.company,
    needs: input.needs,
    urgency: input.urgency,
    interested_listings: input.interested_listings,
    created_at: new Date().toISOString(),
  });

  if (error) {
    toolResult = JSON.stringify({ error: error.message });
  } else {
    toolResult = JSON.stringify({ success: true, message: 'Lead captured!' });
  }
}
```

---

## Mobile Optimization

### Disable Widget on Small Screens

```tsx
'use client';

import { useEffect, useState } from 'react';
import { DavidChatWidget } from '@/components/david/DavidChatWidget';

export function ConditionalDavid() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return null; // Hide on very small screens
  }

  return <DavidChatWidget />;
}
```

---

## Testing

### Unit Test Example (Jest + React Testing Library)

```tsx
// __tests__/DavidChatWidget.test.tsx
import { render, screen } from '@testing-library/react';
import { DavidChatWidget } from '@/components/david/DavidChatWidget';

describe('DavidChatWidget', () => {
  it('renders floating button', () => {
    render(<DavidChatWidget />);
    expect(screen.getByRole('button', { name: /chat with david/i })).toBeInTheDocument();
  });

  it('opens chat on button click', async () => {
    const { getByRole } = render(<DavidChatWidget />);
    const button = getByRole('button', { name: /chat with david/i });
    
    await userEvent.click(button);
    
    expect(screen.getByPlaceholderText(/ask david anything/i)).toBeInTheDocument();
  });
});
```

---

## Environment Setup Checklist

- [ ] `.env.local` created with `ANTHROPIC_API_KEY`
- [ ] Next.js app router configured
- [ ] Tailwind CSS with custom colors configured
- [ ] TypeScript paths configured (`@/*`)
- [ ] Required dependencies installed
- [ ] `DavidChatWidget` added to layout
- [ ] API route at `/api/david/chat` working
- [ ] Chat widget appearing on page
- [ ] Streaming messages working
- [ ] Mobile responsive tested

---

## Common Issues & Solutions

### Issue: Widget not showing
**Solution**: Ensure `DavidChatWidget` is imported in a client component and added to layout. Check browser console for errors.

### Issue: API errors
**Solution**: Verify `ANTHROPIC_API_KEY` is set correctly. Check network tab in browser DevTools for response details.

### Issue: Streaming cuts off
**Solution**: Ensure API route is returning proper headers with chunked encoding. Check for network timeouts.

### Issue: Messages not scrolling
**Solution**: Verify `useEffect` in DavidChatWidget is running. Check that `messagesEndRef` is properly rendered in message list.

---

## Next Steps

1. Test David locally with your Next.js app
2. Customize system prompt in `src/lib/constants.ts` if needed
3. Implement tool handlers in API route for Supabase integration
4. Add analytics/logging for lead tracking
5. Deploy to production
6. Monitor API usage and optimize as needed

