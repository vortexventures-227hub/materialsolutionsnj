import { createHash } from 'node:crypto';
import { appendFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DEFAULT_LEDGER_URL = new URL('../../../data/publish_proxy_receipts.jsonl', import.meta.url);

function getDefaultLedgerPath(): string {
  const ledgerPath = process.env.PUBLISH_PROXY_RECEIPTS_PATH;
  if (ledgerPath) return ledgerPath;
  return fileURLToPath(DEFAULT_LEDGER_URL);
}

export interface ProxyReceiptEntry {
  receiptId: string;
  idempotencyKey: string;
  unitId: string;
  platform: string;
  timestamp: string;
  fsmResponse: unknown;
  source: string;
}

export function generateReceiptId(
  unitId: string,
  platform: string,
  idempotencyKey: string,
): string {
  return createHash('sha256')
    .update(`${unitId}:${platform}:${idempotencyKey}`)
    .digest('hex')
    .slice(0, 12);
}

export async function writeProxyReceipt(
  entry: Omit<ProxyReceiptEntry, 'receiptId'>,
  ledgerPath?: string,
): Promise<string> {
  const receiptId = generateReceiptId(entry.unitId, entry.platform, entry.idempotencyKey);
  const record = JSON.stringify({ receiptId, ...entry }) + '\n';
  const dest = ledgerPath ?? getDefaultLedgerPath();
  await appendFile(dest, record, 'utf8');
  return receiptId;
}

export async function lookupIdempotencyKey(
  key: string,
  ledgerPath?: string,
): Promise<ProxyReceiptEntry | null> {
  const dest = ledgerPath ?? getDefaultLedgerPath();
  if (!existsSync(dest)) return null;

  let contents: string;
  try {
    contents = await readFile(dest, 'utf8');
  } catch {
    return null;
  }

  const lines = contents.split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const entry = JSON.parse(lines[i]) as ProxyReceiptEntry;
      if (entry.idempotencyKey === key) return entry;
    } catch {
      // skip malformed lines
    }
  }
  return null;
}
