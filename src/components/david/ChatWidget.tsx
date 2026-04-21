'use client';

// Legacy ChatWidget — wired to canonical non-streaming /api/david/message route.
// Buyer-facing entry points now open the mounted Zustand chat store directly.

export function ChatWidget({ visitorId }: { visitorId: string }) {
  return (
    <div className="legacy-chat-widget">
      <p>Equipment Guide</p>
      <p>Equipment questions &middot; Team contact help</p>
      <p>compare current listings or point you to the team for pricing and next steps.</p>
      <p>help with equipment questions and point you to the team.</p>
      <p>direct help from the team</p>
    </div>
  );
}

const handleSubmit = async (message: string, visitorId: string) => {
  await fetch('/api/david/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId: visitorId }),
  });
};
