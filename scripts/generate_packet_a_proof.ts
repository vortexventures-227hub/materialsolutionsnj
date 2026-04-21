import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createLeadCaptureHandler } from '@/app/api/leads/handler';

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function writeJson(targetPath: string, payload: unknown) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function main() {
  const bundleRoot = process.argv[2];

  if (!bundleRoot) {
    throw new Error('Usage: npx tsx scripts/generate_packet_a_proof.ts <bundle-root>');
  }

  const artifactRoot = path.join(bundleRoot, 'lead_capture_artifacts');
  process.env.LEAD_CAPTURE_ARTIFACT_ROOT = artifactRoot;

  await mkdir(bundleRoot, { recursive: true });

  const degradedHandler = createLeadCaptureHandler({
    getSupabaseAdmin() {
      return {
        from(table: string) {
          if (table === 'leads') {
            return {
              insert() {
                return {
                  select() {
                    return {
                      single: async () => ({ data: null, error: new Error('db offline') }),
                    };
                  },
                };
              },
            };
          }
          if (table === 'lead_capture_fallback_queue') {
            return {
              insert(_row: Record<string, unknown>) {
                return {
                  select(_cols: string) {
                    return {
                      single: async () => ({ data: { queue_id: 'queue-proof-456' }, error: null }),
                    };
                  },
                };
              },
            };
          }
          throw new Error(`unexpected table ${table}`);
        },
      };
    },
    sendLeadNotification: async () => true,
  });

  const successHandler = createLeadCaptureHandler({
    getSupabaseAdmin() {
      return {
        from(table: string) {
          if (table !== 'leads') {
            throw new Error(`unexpected table ${table}`);
          }

          return {
            insert(row: Record<string, unknown>) {
              return {
                select() {
                  return {
                    single: async () => ({
                      data: {
                        ...row,
                        id: 'lead-proof-123',
                        created_at: '2026-04-17T13:34:00.000Z',
                        status: 'warm',
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

  const degradedResponse = await degradedHandler(
    makeRequest({
      name: 'Degraded Buyer',
      phone: '973-555-0101',
      subject: 'Emergency rental',
      source: 'contact_form',
      page_origin: '/contact',
      cta_origin: 'contact_form_submit',
      listing_id: 'forklift-42',
      listing_slug: 'toyota-rental-42',
      listing_title: 'Toyota Rental 42',
      service_slug: 'rentals',
      message: 'Need coverage by tomorrow.',
    })
  );

  const degradedPayload = await degradedResponse.json();
  await writeJson(path.join(bundleRoot, 'responses', 'degraded.json'), {
    status: degradedResponse.status,
    payload: degradedPayload,
  });

  const successResponse = await successHandler(
    makeRequest({
      name: 'Stored Buyer',
      email: 'stored@example.com',
      phone: '973-555-0202',
      subject: 'Wire guidance retrofit',
      source: 'wire_guided_quote',
      page_origin: '/services/wire-guided',
      cta_origin: 'wire_guided_bottom_cta',
      listing_id: 'forklift-99',
      listing_slug: 'crown-turret-99',
      listing_title: 'Crown Turret 99',
      service_slug: 'wire-guided',
      message: 'Need a retrofit estimate.',
    })
  );

  const successPayload = await successResponse.json();
  await writeJson(path.join(bundleRoot, 'responses', 'success.json'), {
    status: successResponse.status,
    payload: successPayload,
  });

  const persistedRecordDir = path.join(artifactRoot, 'persisted_records');
  const persistedRecordFiles = await readdir(persistedRecordDir);

  await writeJson(path.join(bundleRoot, 'manifest.json'), {
    generated_at: new Date().toISOString(),
    bundle_root: bundleRoot,
    artifact_root: artifactRoot,
    files: {
      degraded_response: path.join(bundleRoot, 'responses', 'degraded.json'),
      success_response: path.join(bundleRoot, 'responses', 'success.json'),
      degraded_queue_artifact: path.join(artifactRoot, 'fallback_queue', `${degradedPayload.queue_id}.json`),
      degraded_alert_artifact: path.join(artifactRoot, 'operator_alerts', `${degradedPayload.capture_id}.json`),
      success_persisted_artifact: persistedRecordFiles.length === 1
        ? path.join(persistedRecordDir, persistedRecordFiles[0])
        : null,
      success_persisted_record_dir: persistedRecordDir,
    },
    persisted_record_files: persistedRecordFiles,
  });

  console.log(bundleRoot);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
