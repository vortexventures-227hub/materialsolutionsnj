import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const MIGRATION = join(ROOT, 'supabase', 'migrations', '20260429230000_create_david_memory.sql');
const MONITORING_PLAN = join(ROOT, 'docs', 'david-memory-staging-monitoring.md');

test('David memory Supabase migration is reviewable SQL with RLS and grants', () => {
  assert.equal(existsSync(MIGRATION), true, 'migration SQL file must exist');
  const sql = readFileSync(MIGRATION, 'utf8');

  assert.match(sql, /create\s+table\s+(if\s+not\s+exists\s+)?(?:public\.)?david_memory/i);
  assert.match(sql, /identity_key\s+text\s+not\s+null/i);
  assert.match(sql, /pii_fingerprint\s+text/i);
  assert.match(sql, /category\s+text\s+not\s+null/i);
  assert.match(sql, /inventory_ref\s+jsonb/i);
  assert.match(sql, /alter\s+table\s+(?:public\.)?david_memory\s+enable\s+row\s+level\s+security/i);
  assert.match(sql, /create\s+policy\s+"david_memory_select_own_identity"/i);
  assert.match(sql, /create\s+policy\s+"david_memory_insert_own_identity"/i);
  assert.match(sql, /create\s+policy\s+"david_memory_update_own_identity"/i);
  assert.match(sql, /current_setting\('request\.jwt\.claims'/i);
  assert.match(sql, /grant\s+select\s+on\s+(?:public\.)?david_memory\s+to\s+authenticated/i);
  assert.match(sql, /grant\s+insert\s*,\s*update\s+on\s+(?:public\.)?david_memory\s+to\s+service_role/i);
  assert.match(sql, /revoke\s+all\s+on\s+(?:public\.)?david_memory\s+from\s+anon/i);
});

test('David memory migration has identity updated_at descending retrieval index', () => {
  assert.equal(existsSync(MIGRATION), true, 'migration SQL file must exist');
  const sql = readFileSync(MIGRATION, 'utf8');

  assert.match(
    sql,
    /create\s+index\s+(?:concurrently\s+)?(?:if\s+not\s+exists\s+)?david_memory_identity_updated_at_idx\s+on\s+(?:public\.)?david_memory\s*\(\s*identity_key\s*,\s*updated_at\s+desc\s*\)/i
  );
});

test('David memory staging monitoring plan names metrics, thresholds, and alert surfaces', () => {
  assert.equal(existsSync(MONITORING_PLAN), true, 'staging monitoring plan must exist');
  const plan = readFileSync(MONITORING_PLAN, 'utf8');

  for (const required of [
    /write success rate/i,
    /retrieve latency/i,
    /p50/i,
    /p95/i,
    /PII[- ]redaction hit rate/i,
    /error rate/i,
    /threshold/i,
    /Vercel logs/i,
    /Supabase logs/i,
    /Telegram/i,
  ]) {
    assert.match(plan, required);
  }
});
