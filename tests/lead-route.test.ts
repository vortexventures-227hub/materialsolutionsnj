import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createLeadCaptureHandler } from "@/app/api/leads/handler";

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function withLeadCaptureArtifactRoot<T>(artifactRoot: string, run: () => Promise<T>) {
  const previousRoot = process.env.LEAD_CAPTURE_ARTIFACT_ROOT;
  process.env.LEAD_CAPTURE_ARTIFACT_ROOT = artifactRoot;

  try {
    return await run();
  } finally {
    if (previousRoot === undefined) {
      delete process.env.LEAD_CAPTURE_ARTIFACT_ROOT;
    } else {
      process.env.LEAD_CAPTURE_ARTIFACT_ROOT = previousRoot;
    }
  }
}

async function withArtifactRoot<T>(run: (artifactRoot: string) => Promise<T>) {
  const artifactRoot = await mkdtemp(path.join(tmpdir(), "lead-route-artifacts-"));

  try {
    return await withLeadCaptureArtifactRoot(artifactRoot, () => run(artifactRoot));
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
}

test("createLeadCaptureHandler returns degraded queue proof when primary persistence fails", async () => {
  await withArtifactRoot(async (artifactRoot) => {
    const insertedFallbackRows: unknown[] = [];
    const handler = createLeadCaptureHandler({
      getSupabaseAdmin() {
        return {
          from(table: string) {
            if (table === "leads") {
              return {
                insert() {
                  return {
                    select() {
                      return {
                        single: async () => ({ data: null, error: new Error("db offline") }),
                      };
                    },
                  };
                },
              };
            }

            assert.equal(table, "lead_capture_fallback_queue");
            return {
              insert(row: unknown) {
                insertedFallbackRows.push(row);
                return {
                  select(columns: string) {
                    assert.equal(columns, "queue_id");
                    return {
                      single: async () => ({
                        data: { queue_id: (row as { queue_id: string }).queue_id },
                        error: null,
                      }),
                    };
                  },
                };
              },
            };
          },
        };
      },
      async sendLeadNotification() {
        return true;
      },
    });

    const response = await handler(
      makeRequest({
        name: "Degraded Buyer",
        phone: "973-555-0101",
        subject: "Emergency rental",
        source: "contact_form",
        page_origin: "/contact",
        cta_origin: "contact_form_submit",
        listing_id: "forklift-42",
        listing_slug: "toyota-rental-42",
        listing_title: "Toyota Rental 42",
        service_slug: "rentals",
        message: "Need coverage by tomorrow.",
      })
    );

    assert.equal(response.status, 202);
    const payload = await response.json();
    assert.equal(payload.captureState, "degraded");
    assert.equal(payload.degraded, true);
    assert.equal(payload.operator_alerted, true);
    assert.equal(payload.degraded_reason, "primary_persistence_failed");
    assert.equal(
      payload.message,
      "We captured your request into our recovery queue and flagged the team for manual follow-up. If this is urgent, please reach us at info@materialsolutionsnj.com."
    );
    assert.match(payload.queue_id, /^queue_/);
    assert.match(payload.capture_id, /^capture_/);
    assert.equal(
      payload.queue_artifact_path,
      path.join(artifactRoot, "fallback_queue", `${payload.queue_id}.json`)
    );
    assert.equal(
      payload.alert_artifact_path,
      path.join(artifactRoot, "operator_alerts", `${payload.capture_id}.json`)
    );
    assert.equal(
      payload.queue_record_locator,
      `supabase:lead_capture_fallback_queue:${payload.queue_id}`
    );
    assert.equal(insertedFallbackRows.length, 1);
  });
});

test("createLeadCaptureHandler returns success with persisted lead proof and preserved routing context", async () => {
  await withArtifactRoot(async (artifactRoot) => {
    const insertedRows: unknown[] = [];
    const handler = createLeadCaptureHandler({
      getSupabaseAdmin() {
        return {
          from(table: string) {
            assert.equal(table, "leads");
            return {
              insert(row: unknown) {
                insertedRows.push(row);
                return {
                  select() {
                    return {
                      single: async () => ({
                        data: {
                          ...((row ?? {}) as Record<string, unknown>),
                          id: "lead-123",
                          created_at: "2026-04-17T12:34:56.000Z",
                          status: "warm",
                          score: 40,
                          timeline: null,
                          budget_confirmed: false,
                          use_case: null,
                        },
                        error: null,
                      }),
                    };
                  },
                };
              },
            };
          },
        };
      },
      async sendLeadNotification() {
        return true;
      },
    });

    const response = await handler(
      makeRequest({
        name: "Stored Buyer",
        email: "stored@example.com",
        phone: "973-555-0202",
        subject: "Wire guidance retrofit",
        source: "wire_guided_quote",
        page_origin: "/services/wire-guided",
        cta_origin: "wire_guided_bottom_cta",
        listing_id: "forklift-99",
        listing_slug: "crown-turret-99",
        listing_title: "Crown Turret 99",
        service_slug: "wire-guided",
        message: "Need a retrofit estimate.",
      })
    );

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.captureState, "success");
    assert.equal(payload.degraded, false);
    assert.equal(payload.lead_id, "lead-123");
    assert.equal(insertedRows.length, 1);

    const inserted = insertedRows[0] as {
      visitor_id: string;
      interests: string[];
      conversation_summary: string;
    };

    assert.match(inserted.visitor_id, /^capture_/);
    assert.deepEqual(inserted.interests, [
      "Wire guidance retrofit",
      "wire_guided_quote",
      "page_origin:/services/wire-guided",
      "cta_origin:wire_guided_bottom_cta",
      "listing_id:forklift-99",
      "listing_slug:crown-turret-99",
      "listing_title:Crown Turret 99",
      "service_slug:wire-guided",
    ]);
    assert.match(inserted.conversation_summary, /Subject: Wire guidance retrofit/);
    assert.match(inserted.conversation_summary, /Source: wire_guided_quote/);
    assert.match(inserted.conversation_summary, /Page Origin: \/services\/wire-guided/);
    assert.match(inserted.conversation_summary, /CTA Origin: wire_guided_bottom_cta/);
    assert.match(inserted.conversation_summary, /Listing ID: forklift-99/);
    assert.match(inserted.conversation_summary, /Listing Slug: crown-turret-99/);
    assert.match(inserted.conversation_summary, /Listing Title: Crown Turret 99/);
    assert.match(inserted.conversation_summary, /Service Slug: wire-guided/);
    assert.match(inserted.conversation_summary, /Need a retrofit estimate\./);

    const persistedArtifactPath = path.join(artifactRoot, "persisted_records", `${inserted.visitor_id}.json`);
    const persistedArtifact = JSON.parse(await readFile(persistedArtifactPath, "utf8")) as {
      lead_id: string;
      persisted_at: string;
      notification_sent: boolean;
      stored_fields: Record<string, string | null>;
    };

    assert.equal(persistedArtifact.lead_id, "lead-123");
    assert.equal(persistedArtifact.persisted_at, "2026-04-17T12:34:56.000Z");
    assert.equal(persistedArtifact.notification_sent, true);
    assert.deepEqual(persistedArtifact.stored_fields, {
      subject: "Wire guidance retrofit",
      source: "wire_guided_quote",
      page_origin: "/services/wire-guided",
      cta_origin: "wire_guided_bottom_cta",
      listing_id: "forklift-99",
      listing_slug: "crown-turret-99",
      listing_title: "Crown Turret 99",
      service_slug: "wire-guided",
      budget_confirmed: null,
      use_case: null,
      timeline: null,
    });
  });
});

test("createLeadCaptureHandler returns success with delayed-followup proof when telegram notification fails after persistence", async () => {
  await withArtifactRoot(async (artifactRoot) => {
    const insertedRows: unknown[] = [];
    const handler = createLeadCaptureHandler({
      getSupabaseAdmin() {
        return {
          from(table: string) {
            assert.equal(table, "leads");
            return {
              insert(row: unknown) {
                insertedRows.push(row);
                return {
                  select() {
                    return {
                      single: async () => ({
                        data: {
                          ...((row ?? {}) as Record<string, unknown>),
                          id: "lead-telegram-fail",
                          created_at: "2026-04-18T00:00:00.000Z",
                          status: "warm",
                          score: 40,
                          timeline: null,
                          budget_confirmed: false,
                          use_case: null,
                        },
                        error: null,
                      }),
                    };
                  },
                };
              },
            };
          },
        };
      },
      async sendLeadNotification() {
        return false;
      },
    });

    const response = await handler(
      makeRequest({
        name: "Notification Delay Buyer",
        email: "delay@example.com",
        subject: "Aisle reconfiguration",
        source: "contact_form",
        page_origin: "/contact",
        cta_origin: "contact_form_submit",
        message: "Need a revised aisle layout.",
      })
    );

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.captureState, "success");
    assert.equal(payload.success, true);
    assert.equal(payload.degraded, false);
    assert.equal(payload.lead_id, "lead-telegram-fail");
    assert.equal(payload.operator_alerted, false);
    assert.match(payload.message, /instant alert failed/i);
    assert.match(payload.alert_artifact_path, new RegExp(`${path.sep.replace(/\\/g, "\\\\")}operator_alerts${path.sep.replace(/\\/g, "\\\\")}capture_`));

    assert.equal(insertedRows.length, 1);
    const inserted = insertedRows[0] as { visitor_id: string };
    const persistedArtifactPath = path.join(artifactRoot, "persisted_records", `${inserted.visitor_id}.json`);
    const persistedArtifact = JSON.parse(await readFile(persistedArtifactPath, "utf8")) as {
      operator_alerted: boolean;
      notification_sent: boolean;
      alert_artifact_path: string;
      lead_id: string;
    };
    assert.equal(persistedArtifact.lead_id, "lead-telegram-fail");
    assert.equal(persistedArtifact.notification_sent, false);
    assert.equal(persistedArtifact.operator_alerted, false);
    assert.equal(persistedArtifact.alert_artifact_path, payload.alert_artifact_path);

    const alertArtifact = JSON.parse(await readFile(payload.alert_artifact_path, "utf8")) as {
      kind: string;
      operator_alerted: boolean;
      reason: string;
      details: { lead_id: string; persisted_at: string };
    };
    assert.equal(alertArtifact.kind, "notification_failure");
    assert.equal(alertArtifact.operator_alerted, false);
    assert.equal(alertArtifact.reason, "telegram_notification_failed_after_persist");
    assert.equal(alertArtifact.details.lead_id, "lead-telegram-fail");
    assert.equal(alertArtifact.details.persisted_at, "2026-04-18T00:00:00.000Z");
  });
});

async function runNotificationFailureScenario() {
  const handler = createLeadCaptureHandler({
    getSupabaseAdmin() {
      return {
        from(table: string) {
          assert.equal(table, "leads");
          return {
            insert(row: unknown) {
              return {
                select() {
                  return {
                    single: async () => ({
                      data: {
                        ...((row ?? {}) as Record<string, unknown>),
                        id: "lead-trimmed-root",
                        created_at: "2026-04-18T00:00:00.000Z",
                        status: "warm",
                        score: 40,
                        timeline: null,
                        budget_confirmed: false,
                        use_case: null,
                      },
                      error: null,
                    }),
                  };
                },
              };
            },
          };
        },
      };
    },
    async sendLeadNotification() {
      return false;
    },
  });

  return handler(
    makeRequest({
      name: "Trimmed Artifact Root Buyer",
      email: "trimmed@example.com",
      subject: "Wire guided quote",
      source: "wire_guided_quote",
      page_origin: "/services/wire-guided",
      cta_origin: "wire_guided_bottom_cta",
      message: "Need a trim-proof artifact path.",
    })
  );
}

test("createLeadCaptureHandler trims LEAD_CAPTURE_ARTIFACT_ROOT before returning notification-failure artifact paths", async () => {
  const cleanArtifactRoot = await mkdtemp(path.join(tmpdir(), "lead-route-trimmed-root-"));

  try {
    await withLeadCaptureArtifactRoot(`  ${cleanArtifactRoot}\n`, async () => {
      const response = await runNotificationFailureScenario();

      assert.equal(response.status, 201);
      const payload = await response.json();
      assert.equal(payload.operator_alerted, false);
      assert.ok(!payload.alert_artifact_path.includes("\n"));
      assert.ok(!payload.alert_artifact_path.includes("  "));
      assert.match(payload.alert_artifact_path, new RegExp(`^${cleanArtifactRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
      await readFile(payload.alert_artifact_path, "utf8");
    });
  } finally {
    await rm(cleanArtifactRoot, { recursive: true, force: true });
  }
});

test("createLeadCaptureHandler strips trailing literal backslash-n from LEAD_CAPTURE_ARTIFACT_ROOT before returning notification-failure artifact paths", async () => {
  const cleanArtifactRoot = await mkdtemp(path.join(tmpdir(), "lead-route-literal-backslash-n-root-"));

  try {
    await withLeadCaptureArtifactRoot(`${cleanArtifactRoot}\\n`, async () => {
      const response = await runNotificationFailureScenario();

      assert.equal(response.status, 201);
      const payload = await response.json();
      assert.equal(payload.operator_alerted, false);
      assert.ok(!payload.alert_artifact_path.includes("\\n"));
      assert.match(payload.alert_artifact_path, new RegExp(`^${cleanArtifactRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
      await readFile(payload.alert_artifact_path, "utf8");
    });
  } finally {
    await rm(cleanArtifactRoot, { recursive: true, force: true });
  }
});

test("createLeadCaptureHandler returns hard failure when fallback persistence also fails", async () => {
  await withLeadCaptureArtifactRoot("/dev/null", async () => {
    const handler = createLeadCaptureHandler({
      getSupabaseAdmin() {
        return {
          from(table: string) {
            return {
              insert() {
                return {
                  select() {
                    return {
                      single: async () => ({
                        data: null,
                        error: new Error(table === "leads" ? "db offline" : "queue offline"),
                      }),
                    };
                  },
                };
              },
            };
          },
        };
      },
      async sendLeadNotification() {
        return true;
      },
    });

    const response = await handler(
      makeRequest({
        name: "Hard Failure Buyer",
        phone: "973-555-0303",
        subject: "Emergency rental",
        source: "contact_form",
        page_origin: "/contact",
        cta_origin: "contact_form_submit",
        message: "Need help tonight.",
      })
    );

    assert.equal(response.status, 500);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.degraded, false);
    assert.equal(payload.captureState, "failure");
    assert.equal(payload.error_code, "lead_capture_unavailable");
    assert.equal(payload.operator_alerted, false);
    assert.equal(payload.message, "We could not save your request. Please reach us at info@materialsolutionsnj.com.");
    assert.equal(payload.error, "We could not save your request. Please reach us at info@materialsolutionsnj.com.");
  });
});

// --- Internal probe filter tests (2026-04-21 AxeForge refresh-probe spam incident) ---

function makeProbeFilterHandler() {
  const insertedRows: unknown[] = [];
  const notificationCalls: unknown[] = [];
  const handler = createLeadCaptureHandler({
    getSupabaseAdmin() {
      return {
        from(table: string) {
          return {
            insert(row: unknown) {
              insertedRows.push({ table, row });
              return {
                select() {
                  return {
                    single: async () => ({
                      data: {
                        ...((row ?? {}) as Record<string, unknown>),
                        id: "should-not-be-reached",
                        created_at: "2026-04-21T00:00:00.000Z",
                        status: "warm",
                        score: 40,
                        timeline: null,
                        budget_confirmed: false,
                        use_case: null,
                      },
                      error: null,
                    }),
                  };
                },
              };
            },
          };
        },
      };
    },
    async sendLeadNotification(payload) {
      notificationCalls.push(payload);
      return true;
    },
  });
  return { handler, insertedRows, notificationCalls };
}

test("isInternalProbeEmail: axerefresh@axeops.internal is filtered — 202, no leads row, no notification", async () => {
  const { handler, insertedRows, notificationCalls } = makeProbeFilterHandler();
  const response = await handler(makeRequest({ name: "AxeForge Probe", email: "axerefresh@axeops.internal", source: "axeforge_refresh" }));
  assert.equal(response.status, 202);
  const payload = await response.json();
  assert.equal(payload.accepted, true);
  assert.equal(payload.filtered, true);
  assert.equal(insertedRows.length, 0);
  assert.equal(notificationCalls.length, 0);
});

test("isInternalProbeEmail: test@example.internal is filtered — 202, no leads row, no notification", async () => {
  const { handler, insertedRows, notificationCalls } = makeProbeFilterHandler();
  const response = await handler(makeRequest({ name: "Test Probe", email: "test@example.internal", source: "probe" }));
  assert.equal(response.status, 202);
  const payload = await response.json();
  assert.equal(payload.accepted, true);
  assert.equal(payload.filtered, true);
  assert.equal(insertedRows.length, 0);
  assert.equal(notificationCalls.length, 0);
});

test("isInternalProbeEmail: foo@bar.internal is filtered — 202, no leads row, no notification", async () => {
  const { handler, insertedRows, notificationCalls } = makeProbeFilterHandler();
  const response = await handler(makeRequest({ name: "Foo Probe", email: "foo@bar.internal", source: "probe" }));
  assert.equal(response.status, 202);
  const payload = await response.json();
  assert.equal(payload.accepted, true);
  assert.equal(payload.filtered, true);
  assert.equal(insertedRows.length, 0);
  assert.equal(notificationCalls.length, 0);
});

test("isInternalProbeEmail: david@materialsolutionsnj.com is NOT filtered — passes to normal flow", async () => {
  const { handler, insertedRows } = makeProbeFilterHandler();
  const response = await handler(makeRequest({ name: "David Real", email: "david@materialsolutionsnj.com", source: "contact_form" }));
  assert.notEqual(response.status, 202);
});

test("isInternalProbeEmail: user@internal-systems.com is NOT filtered — .com TLD, not .internal", async () => {
  const { handler, insertedRows } = makeProbeFilterHandler();
  const response = await handler(makeRequest({ name: "Real User", email: "user@internal-systems.com", source: "contact_form" }));
  assert.notEqual(response.status, 202);
});

test("isInternalProbeEmail: empty string email is NOT filtered — goes through normal validation", async () => {
  const { handler } = makeProbeFilterHandler();
  const response = await handler(makeRequest({ name: "Empty Email", email: "", phone: "973-555-9999", source: "contact_form" }));
  assert.notEqual(response.status, 202);
});

test("isInternalProbeEmail: null email is NOT filtered — goes through normal validation", async () => {
  const { handler } = makeProbeFilterHandler();
  const response = await handler(makeRequest({ name: "Null Email", email: null, phone: "973-555-9999", source: "contact_form" }));
  assert.notEqual(response.status, 202);
});
