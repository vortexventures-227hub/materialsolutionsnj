import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsxBin = path.join(repoRoot, 'node_modules', '.bin', 'tsx');

function runSupabaseProbe(env: NodeJS.ProcessEnv) {
  const probe = spawnSync(
    tsxBin,
    [
      '-e',
      `
        import { getSupabase, getSupabaseAdmin } from './src/lib/db/supabase.ts';
        const supabase = getSupabase();
        const supabaseAdmin = getSupabaseAdmin();
        console.log(JSON.stringify({
          url: supabase.supabaseUrl,
          anonKey: supabase.supabaseKey,
          adminKey: supabaseAdmin.supabaseKey,
        }));
      `,
    ],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        ...env,
      },
      encoding: 'utf8',
    }
  );

  return probe;
}

test('getSupabase normalizes literal backslash-n-tainted runtime env values before creating clients', () => {
  const result = runSupabaseProbe({
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co\\n',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-test-key\\n',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key\\n',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const parsed = JSON.parse(result.stdout.trim()) as {
    url: string;
    anonKey: string;
    adminKey: string;
  };

  assert.equal(parsed.url, 'https://example.supabase.co');
  assert.equal(parsed.anonKey, 'anon-test-key');
  assert.equal(parsed.adminKey, 'service-role-test-key');
});
