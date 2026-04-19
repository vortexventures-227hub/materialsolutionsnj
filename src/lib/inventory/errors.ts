import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface InventoryFailureRecord {
  failure_id: string;
  route: string;
  kind: 'supabase_error' | 'parse_error' | 'unexpected_error';
  operator_alerted: boolean;
  reason: string;
  details: unknown;
  created_at: string;
}

function getInventoryArtifactRoot(): string {
  const configuredRoot = process.env.INVENTORY_ARTIFACT_ROOT?.trim();
  return configuredRoot || path.join(process.cwd(), 'runtime_artifacts', 'inventory_failures');
}

/**
 * Write a durable inventory-failure record with a recoverable failure_id.
 * Satisfies CONTRACTS.md operator-visible requirement:
 *   - durable queue/event/record with recoverable ID
 *   - at least one routed alert surface (Telegram notification wired separately)
 */
export async function writeInventoryFailureArtifact(input: {
  failureId: string;
  route: string;
  kind: InventoryFailureRecord['kind'];
  operatorAlerted: boolean;
  reason: string;
  details?: unknown;
}): Promise<string> {
  const record: InventoryFailureRecord = {
    failure_id: input.failureId,
    route: input.route,
    kind: input.kind,
    operator_alerted: input.operatorAlerted,
    reason: input.reason,
    details: input.details ?? null,
    created_at: new Date().toISOString(),
  };

  const dir = path.join(getInventoryArtifactRoot());
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${input.failureId}.json`);
  await writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  return filePath;
}

/** Generate a stable, sortable failure ID: inv-<unix-ts>-<6-char-urand> */
export function makeInventoryFailureId(): string {
  const ts = Date.now();
  const urand = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
  return `inv-${ts}-${urand}`;
}
