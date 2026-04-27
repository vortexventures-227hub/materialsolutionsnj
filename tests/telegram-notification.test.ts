import test from "node:test";
import assert from "node:assert/strict";

import {
  formatLeadNotificationMessage,
  sendLeadNotification,
  type NotificationPayload,
} from "@/lib/notifications/telegram";

const samplePayload: NotificationPayload = {
  lead: {
    id: "lead-123",
    name: "Markdown_Risky Buyer",
    company: "Asterisk * Co",
    phone: "973-555-1111",
    email: "buyer@example.com",
    message: null,
    interests: ["wire_guided_quote"],
    score: 40,
    status: "warm",
    created_at: "2026-04-18T00:00:00.000Z",
    updated_at: "2026-04-18T00:00:00.000Z",
    source: "contact_form",
    budget_confirmed: false,
    timeline: null,
    use_case: "Need markdown_safe delivery",
  },
  conversationSummary: "Source: contact_form\nCTA Origin: contact_form_submit\nNeed markdown_safe delivery.",
  inventoryInterests: ["wire_guided_quote", "cta_origin:contact_form_submit"],
};

test("formatLeadNotificationMessage returns plain text without markdown formatting markers", () => {
  const message = formatLeadNotificationMessage(samplePayload);

  assert.match(message, /WARM LEAD - Material Solutions NJ/);
  assert.match(message, /Name: Markdown_Risky Buyer/);
  assert.match(message, /Phone: 973-555-1111/);
  assert.match(message, /Email: buyer@example\.com/);
  assert.match(message, /Asterisk \* Co/);
  assert.match(message, /wire_guided_quote/);
  assert.ok(!message.includes("**Contact Info**"));
  assert.ok(!message.includes("parse_mode"));
});

test("sendLeadNotification trims env vars and posts plain text without parse_mode", async () => {
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const previousChat = process.env.TELEGRAM_CHAT_ID;
  const previousDavidToken = process.env.DAVID_LEAD_TELEGRAM_BOT_TOKEN;
  const previousDavidChat = process.env.DAVID_LEAD_TELEGRAM_CHAT_ID;
  const previousFetch = globalThis.fetch;

  process.env.TELEGRAM_BOT_TOKEN = " test-token\n";
  process.env.TELEGRAM_CHAT_ID = " 12345 \n";
  delete process.env.DAVID_LEAD_TELEGRAM_BOT_TOKEN;
  delete process.env.DAVID_LEAD_TELEGRAM_CHAT_ID;

  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (url: string | URL | globalThis.Request, init?: RequestInit) => {
    capturedUrl = String(url);
    capturedInit = init;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as typeof fetch;

  try {
    const sent = await sendLeadNotification(samplePayload);
    assert.equal(sent, true);
    assert.equal(capturedUrl, "https://api.telegram.org/bottest-token/sendMessage");
    assert.ok(capturedInit?.body);
    const body = JSON.parse(String(capturedInit.body)) as Record<string, unknown>;
    assert.equal(body.chat_id, "12345");
    assert.match(String(body.text), /markdown_safe delivery/);
    assert.ok(!("parse_mode" in body));
  } finally {
    if (previousToken === undefined) {
      delete process.env.TELEGRAM_BOT_TOKEN;
    } else {
      process.env.TELEGRAM_BOT_TOKEN = previousToken;
    }
    if (previousChat === undefined) {
      delete process.env.TELEGRAM_CHAT_ID;
    } else {
      process.env.TELEGRAM_CHAT_ID = previousChat;
    }
    if (previousDavidToken === undefined) {
      delete process.env.DAVID_LEAD_TELEGRAM_BOT_TOKEN;
    } else {
      process.env.DAVID_LEAD_TELEGRAM_BOT_TOKEN = previousDavidToken;
    }
    if (previousDavidChat === undefined) {
      delete process.env.DAVID_LEAD_TELEGRAM_CHAT_ID;
    } else {
      process.env.DAVID_LEAD_TELEGRAM_CHAT_ID = previousDavidChat;
    }
    globalThis.fetch = previousFetch;
  }
});

test("sendLeadNotification prefers David-specific lead alert bot env over generic Telegram env", async () => {
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const previousChat = process.env.TELEGRAM_CHAT_ID;
  const previousDavidToken = process.env.DAVID_LEAD_TELEGRAM_BOT_TOKEN;
  const previousDavidChat = process.env.DAVID_LEAD_TELEGRAM_CHAT_ID;
  const previousFetch = globalThis.fetch;

  process.env.TELEGRAM_BOT_TOKEN = " axis-token ";
  process.env.TELEGRAM_CHAT_ID = " axis-chat ";
  process.env.DAVID_LEAD_TELEGRAM_BOT_TOKEN = " david-token ";
  process.env.DAVID_LEAD_TELEGRAM_CHAT_ID = " david-chat ";

  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (url: string | URL | globalThis.Request, init?: RequestInit) => {
    capturedUrl = String(url);
    capturedInit = init;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as typeof fetch;

  try {
    const sent = await sendLeadNotification(samplePayload);
    assert.equal(sent, true);
    assert.equal(capturedUrl, "https://api.telegram.org/botdavid-token/sendMessage");
    const body = JSON.parse(String(capturedInit?.body ?? "{}")) as Record<string, unknown>;
    assert.equal(body.chat_id, "david-chat");
  } finally {
    if (previousToken === undefined) {
      delete process.env.TELEGRAM_BOT_TOKEN;
    } else {
      process.env.TELEGRAM_BOT_TOKEN = previousToken;
    }
    if (previousChat === undefined) {
      delete process.env.TELEGRAM_CHAT_ID;
    } else {
      process.env.TELEGRAM_CHAT_ID = previousChat;
    }
    if (previousDavidToken === undefined) {
      delete process.env.DAVID_LEAD_TELEGRAM_BOT_TOKEN;
    } else {
      process.env.DAVID_LEAD_TELEGRAM_BOT_TOKEN = previousDavidToken;
    }
    if (previousDavidChat === undefined) {
      delete process.env.DAVID_LEAD_TELEGRAM_CHAT_ID;
    } else {
      process.env.DAVID_LEAD_TELEGRAM_CHAT_ID = previousDavidChat;
    }
    globalThis.fetch = previousFetch;
  }
});
