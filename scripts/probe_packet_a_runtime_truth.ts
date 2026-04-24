import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const execFile = promisify(execFileCallback);

type EnvProbe = {
  key: string;
  present: boolean;
  placeholderLike: boolean;
  formatNotes: string[];
};

type HttpHop = {
  url: string;
  status: number;
  location: string | null;
  body: string;
  bodyPreview: string;
};

type NamedProbe = {
  name: string;
  requestBody: Record<string, unknown>;
};

type DeployedChunkProbe = {
  chunkPath: string;
  absoluteUrl: string;
  headers: Record<string, string>;
  legacyStringsPresent: Record<string, boolean>;
};

type HomepageProbe = {
  url: string;
  finalUrl: string;
  title: string | null;
  status: number;
  headers: Record<string, string>;
  legacyStringsPresent: Record<string, boolean>;
  chunkPaths: string[];
  chunkProbes: DeployedChunkProbe[];
};

type JsonRouteProbe = {
  url: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  json: unknown;
};

type LocalBuildSnapshot = {
  buildId: string | null;
  appChunks: string[];
  legacyStringsPresentInLayoutChunk: Record<string, boolean>;
  legacyStringsPresentInPageChunk: Record<string, boolean>;
};

type CommandProbe = {
  command: string[];
  ok: boolean;
  stdout: string;
  stderr: string;
};

type ProductionEnvProbe = {
  key: string;
  presentInListing: boolean;
  presentInPulledEnv: boolean;
  escapedNewlinePresent: boolean;
  actualNewlinePresent: boolean;
  suggestedSanitizedValue: string | null;
  rawLength: number;
};

function parseEnv(text: string) {
  const values = new Map<string, string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values.set(key, value);
  }

  return values;
}

function inspectEnvValue(key: string, value: string | undefined): EnvProbe {
  if (!value) {
    return {
      key,
      present: false,
      placeholderLike: false,
      formatNotes: ['missing'],
    };
  }

  const lower = value.toLowerCase();
  const formatNotes: string[] = [];
  const placeholderSignals = [
    'your_',
    'your-',
    'example',
    'placeholder',
    'changeme',
    'replace_me',
    'test_',
    'dummy',
  ];

  if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
    if (value.startsWith('https://') && value.includes('.supabase.co')) {
      formatNotes.push('looks_like_supabase_url');
    } else {
      formatNotes.push('not_valid_supabase_url_shape');
    }
  }

  if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' || key === 'SUPABASE_SERVICE_ROLE_KEY') {
    if (value.split('.').length === 3) {
      formatNotes.push('looks_like_jwt_shape');
    } else {
      formatNotes.push('not_jwt_shape');
    }
  }

  const placeholderLike = placeholderSignals.some((signal) => lower.includes(signal)) ||
    formatNotes.includes('not_valid_supabase_url_shape') ||
    formatNotes.includes('not_jwt_shape');

  return {
    key,
    present: true,
    placeholderLike,
    formatNotes,
  };
}

async function runProbe(startUrl: string, body: Record<string, unknown>) {
  const hops: HttpHop[] = [];
  let currentUrl = startUrl;

  for (let i = 0; i < 5; i += 1) {
    const response = await fetch(currentUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'manual',
    });

    const responseBody = await response.text();
    const location = response.headers.get('location');
    hops.push({
      url: currentUrl,
      status: response.status,
      location,
      body: responseBody,
      bodyPreview: responseBody.slice(0, 400),
    });

    if (location && response.status >= 300 && response.status < 400) {
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    break;
  }

  return hops;
}

function readImportantHeaders(headers: Headers) {
  const wanted = ['server', 'x-vercel-cache', 'x-matched-path', 'cache-control', 'content-type'];
  return Object.fromEntries(
    wanted
      .map((key) => [key, headers.get(key)] as const)
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

function detectLegacyStrings(source: string, strings: string[]) {
  return Object.fromEntries(strings.map((candidate) => [candidate, source.includes(candidate)]));
}

const HOMEPAGE_LEGACY_STRINGS = [
  'AI Equipment Specialist',
  'AI-Verified',
  'Your AI Sales Specialist',
  'David AI Available',
  'Online now',
];

const CHUNK_LEGACY_STRINGS = [
  'AI Sales Specialist',
  'AI Equipment Specialist',
  'AI-Verified',
  'AI-Powered Forklift Sales',
  'David AI Available',
  'Online now',
];

async function probeChunk(baseUrl: string, chunkPath: string): Promise<DeployedChunkProbe> {
  const absoluteUrl = new URL(chunkPath, baseUrl).toString();
  const response = await fetch(absoluteUrl, { redirect: 'follow' });
  const source = await response.text();

  return {
    chunkPath,
    absoluteUrl,
    headers: readImportantHeaders(response.headers),
    legacyStringsPresent: detectLegacyStrings(source, CHUNK_LEGACY_STRINGS),
  };
}

async function probeHomepage(url: string): Promise<HomepageProbe> {
  const response = await fetch(url, { redirect: 'follow' });
  const html = await response.text();
  const titleMatch = html.match(/<title>(.*?)<\/title>/is);
  const chunkPaths = Array.from(new Set(html.match(/\/_next\/static\/chunks\/app\/[^"']+\.js/g) ?? [])).sort();
  const importantChunkPaths = chunkPaths.filter((chunkPath) => /\/(layout|page)-[^/]+\.js$/.test(chunkPath));
  const chunkProbes = await Promise.all(
    importantChunkPaths.map((chunkPath) => probeChunk(response.url, chunkPath))
  );

  return {
    url,
    finalUrl: response.url,
    title: titleMatch?.[1]?.trim() ?? null,
    status: response.status,
    headers: readImportantHeaders(response.headers),
    legacyStringsPresent: detectLegacyStrings(html, HOMEPAGE_LEGACY_STRINGS),
    chunkPaths,
    chunkProbes,
  };
}

async function probeJsonRoute(url: string): Promise<JsonRouteProbe> {
  const response = await fetch(url, { redirect: 'follow' });
  const text = await response.text();

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  return {
    url,
    finalUrl: response.url,
    status: response.status,
    headers: readImportantHeaders(response.headers),
    json,
  };
}

async function readLocalBuildSnapshot(repoRoot: string): Promise<LocalBuildSnapshot> {
  const buildIdPath = path.join(repoRoot, '.next', 'BUILD_ID');
  const appChunkDir = path.join(repoRoot, '.next', 'static', 'chunks', 'app');

  let buildId: string | null = null;
  try {
    buildId = (await readFile(buildIdPath, 'utf8')).trim();
  } catch {
    buildId = null;
  }

  let appChunks: string[] = [];
  try {
    appChunks = (await readdir(appChunkDir))
      .filter((entry) => /^(layout|page)-.*\.js$/.test(entry))
      .sort();
  } catch {
    appChunks = [];
  }

  const layoutChunk = appChunks.find((entry) => entry.startsWith('layout-')) ?? null;
  const pageChunk = appChunks.find((entry) => entry.startsWith('page-')) ?? null;

  let legacyStringsPresentInLayoutChunk = Object.fromEntries(
    CHUNK_LEGACY_STRINGS.map((candidate) => [candidate, false])
  ) as Record<string, boolean>;

  let legacyStringsPresentInPageChunk = Object.fromEntries(
    CHUNK_LEGACY_STRINGS.map((candidate) => [candidate, false])
  ) as Record<string, boolean>;

  if (layoutChunk) {
    try {
      const layoutSource = await readFile(path.join(appChunkDir, layoutChunk), 'utf8');
      legacyStringsPresentInLayoutChunk = detectLegacyStrings(layoutSource, CHUNK_LEGACY_STRINGS);
    } catch {
      // keep default false map if the chunk cannot be read
    }
  }

  if (pageChunk) {
    try {
      const pageSource = await readFile(path.join(appChunkDir, pageChunk), 'utf8');
      legacyStringsPresentInPageChunk = detectLegacyStrings(pageSource, CHUNK_LEGACY_STRINGS);
    } catch {
      // keep default false map if the chunk cannot be read
    }
  }

  return {
    buildId,
    appChunks,
    legacyStringsPresentInLayoutChunk,
    legacyStringsPresentInPageChunk,
  };
}

async function writeJson(targetPath: string, payload: unknown) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function runCommand(command: string, args: string[], cwd: string): Promise<CommandProbe> {
  try {
    const { stdout, stderr } = await execFile(command, args, { cwd });
    return {
      command: [command, ...args],
      ok: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  } catch (error) {
    const stdout = typeof error === 'object' && error && 'stdout' in error && typeof error.stdout === 'string'
      ? error.stdout
      : '';
    const stderr = typeof error === 'object' && error && 'stderr' in error && typeof error.stderr === 'string'
      ? error.stderr
      : error instanceof Error
        ? error.message
        : String(error);

    return {
      command: [command, ...args],
      ok: false,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  }
}

function inspectProductionEnvKey(key: string, listedOutput: string, pulledEnv: Map<string, string>): ProductionEnvProbe {
  const listedRegex = new RegExp(`(^|\\n)\\s*${key}\\s+Encrypted\\s+`, 'm');
  const pulledValue = pulledEnv.get(key);
  const escapedNewlinePresent = typeof pulledValue === 'string' && pulledValue.includes('\\n');
  const actualNewlinePresent = typeof pulledValue === 'string' && /[\r\n]/.test(pulledValue);
  const suggestedSanitizedValue = typeof pulledValue === 'string'
    ? pulledValue.replace(/\\n/g, '').trim()
    : null;

  return {
    key,
    presentInListing: listedRegex.test(listedOutput),
    presentInPulledEnv: pulledValue !== undefined,
    escapedNewlinePresent,
    actualNewlinePresent,
    suggestedSanitizedValue:
      typeof pulledValue === 'string' && suggestedSanitizedValue !== pulledValue
        ? suggestedSanitizedValue
        : null,
    rawLength: typeof pulledValue === 'string' ? pulledValue.length : 0,
  };
}

async function main() {
  const bundleRoot = process.argv[2];

  if (!bundleRoot) {
    throw new Error('Usage: npx tsx scripts/probe_packet_a_runtime_truth.ts <bundle-root>');
  }

  const repoRoot = process.cwd();
  const envPath = path.join(repoRoot, '.env.local');
  const handlerPath = path.join(repoRoot, 'src/app/api/leads/handler.ts');
  const envText = await readFile(envPath, 'utf8');
  const handlerSource = await readFile(handlerPath, 'utf8');
  const env = parseEnv(envText);

  const envSummary = [
    inspectEnvValue('NEXT_PUBLIC_SUPABASE_URL', env.get('NEXT_PUBLIC_SUPABASE_URL')),
    inspectEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY', env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')),
    inspectEnvValue('SUPABASE_SERVICE_ROLE_KEY', env.get('SUPABASE_SERVICE_ROLE_KEY')),
  ];
  const localLiveSuccessPossible = envSummary.every((entry) => entry.present && !entry.placeholderLike);
  const sourceMapsHardFailureToFallbackFailure =
    handlerSource.includes("buildQueuedDegradedResponse") &&
    handlerSource.includes("errorCode: 'lead_capture_unavailable'") &&
    handlerSource.includes('catch (fallbackError)');
  const productionEnvPullPath = path.join(bundleRoot, 'vercel_env.production');

  const [
    apexHomepage,
    wwwHomepage,
    davidAliasRoute,
    davidHealthRoute,
    localBuild,
    gitHead,
    vercelWhoami,
    vercelEnvList,
    vercelEnvPull,
  ] = await Promise.all([
    probeHomepage('https://materialsolutionsnj.com'),
    probeHomepage('https://www.materialsolutionsnj.com'),
    probeJsonRoute('https://www.materialsolutionsnj.com/api/david'),
    probeJsonRoute('https://www.materialsolutionsnj.com/api/david/health'),
    readLocalBuildSnapshot(repoRoot),
    runCommand('git', ['rev-parse', '--short', 'HEAD'], repoRoot),
    runCommand('vercel', ['whoami'], repoRoot),
    runCommand('vercel', ['env', 'ls'], repoRoot),
    runCommand('vercel', ['env', 'pull', productionEnvPullPath, '--environment=production'], repoRoot),
  ]);

  const pulledProductionEnv = vercelEnvPull.ok
    ? parseEnv(await readFile(productionEnvPullPath, 'utf8'))
    : new Map<string, string>();
  const productionEnvSummary = [
    inspectProductionEnvKey('TELEGRAM_BOT_TOKEN', vercelEnvList.stdout, pulledProductionEnv),
    inspectProductionEnvKey('TELEGRAM_CHAT_ID', vercelEnvList.stdout, pulledProductionEnv),
    inspectProductionEnvKey('LEAD_CAPTURE_ARTIFACT_ROOT', vercelEnvList.stdout, pulledProductionEnv),
  ];
  const productionTelegramEnvMissing = productionEnvSummary
    .filter((entry) => entry.key.startsWith('TELEGRAM_'))
    .some((entry) => !entry.presentInListing && !entry.presentInPulledEnv);
  const productionArtifactRootProbe = productionEnvSummary.find((entry) => entry.key === 'LEAD_CAPTURE_ARTIFACT_ROOT') ?? null;
  const productionArtifactRootEscapedNewline = productionArtifactRootProbe?.escapedNewlinePresent ?? false;
  const productionArtifactRootActualNewline = productionArtifactRootProbe?.actualNewlinePresent ?? false;

  const productionProbes: NamedProbe[] = [
    {
      name: 'missing_contact_method',
      requestBody: { source: 'contact_form' },
    },
    {
      name: 'name_and_message_only',
      requestBody: {
        name: 'Runtime Probe',
        message: 'Need pricing',
        source: 'contact_form',
      },
    },
    {
      name: 'email_present',
      requestBody: {
        name: 'Runtime Probe',
        email: 'probe@example.com',
        message: 'Need pricing',
        source: 'contact_form',
      },
    },
  ];

  const probeResults = [];
  for (const probe of productionProbes) {
    const hops = await runProbe('https://materialsolutionsnj.com/api/leads', probe.requestBody);
    const finalHop = hops[hops.length - 1] ?? null;
    probeResults.push({
      name: probe.name,
      request_body: probe.requestBody,
      hops,
      final_status: finalHop?.status ?? null,
      final_body: finalHop?.body ?? null,
      final_body_preview: finalHop?.bodyPreview ?? null,
    });
  }

  const missingContactProbe = probeResults.find((probe) => probe.name === 'missing_contact_method') ?? null;
  const emailProbe = probeResults.find((probe) => probe.name === 'email_present') ?? null;

  const missingContactBody = typeof missingContactProbe?.final_body === 'string'
    ? missingContactProbe.final_body
    : missingContactProbe?.final_body_preview ?? '';
  const emailProbeBody = typeof emailProbe?.final_body === 'string'
    ? emailProbe.final_body
    : emailProbe?.final_body_preview ?? '';

  let emailProbeJson: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(emailProbeBody);
    if (parsed && typeof parsed === 'object') {
      emailProbeJson = parsed as Record<string, unknown>;
    }
  } catch {
    emailProbeJson = null;
  }

  const missingContactLooksLegacy = missingContactBody.includes('Email or phone required');
  const missingContactLooksHardened = missingContactBody.includes('Please provide an email address or phone number.');
  const emailProbeLooksLegacyFalseSuccess = Boolean(
    emailProbe?.final_status === 200 &&
      emailProbeBody.includes('Lead captured (database temporarily unavailable)')
  );
  const emailProbeLooksHardenedFailure = Boolean(
    emailProbe?.final_status === 500 &&
      emailProbeBody.includes('lead_capture_unavailable') &&
      emailProbeBody.includes('We could not save your request. Please reach us at info@materialsolutionsnj.com.')
  );
  const emailProbeLooksPersistedButAlertFailed = Boolean(
    emailProbe?.final_status === 201 &&
      emailProbeJson?.success === true &&
      emailProbeJson?.operator_alerted === false &&
      typeof emailProbeJson?.message === 'string' &&
      emailProbeJson.message.includes('instant alert failed')
  );
  const emailProbeHasNewlineTaintedArtifactPath = Boolean(
    typeof emailProbeJson?.alert_artifact_path === 'string' &&
      emailProbeJson.alert_artifact_path.includes('\n')
  );
  const homepageLegacyDetected = [apexHomepage, wwwHomepage].some((homepage) =>
    Object.values(homepage.legacyStringsPresent).some(Boolean)
  );
  const homepageChunksDifferFromLocal = [apexHomepage, wwwHomepage].some((homepage) =>
    homepage.chunkPaths.some((chunkPath) => {
      const filename = chunkPath.split('/').pop();
      return filename ? !localBuild.appChunks.includes(filename) : false;
    })
  );

  await writeJson(path.join(bundleRoot, 'runtime_truth.json'), {
    generated_at: new Date().toISOString(),
    repo_root: repoRoot,
    env_path: envPath,
    env_summary: envSummary,
    local_live_success_possible: localLiveSuccessPossible,
    source_truth: {
      lead_handler_path: handlerPath,
      hard_failure_maps_to_fallback_failure: sourceMapsHardFailureToFallbackFailure,
    },
    homepage_probes: {
      apex: apexHomepage,
      www: wwwHomepage,
    },
    route_probes: {
      david_alias: davidAliasRoute,
      david_health: davidHealthRoute,
    },
    command_probes: {
      git_head: gitHead,
      vercel_whoami: vercelWhoami,
      vercel_env_ls: vercelEnvList,
      vercel_env_pull: vercelEnvPull,
    },
    production_env_summary: productionEnvSummary,
    local_build: localBuild,
    production_probes: probeResults,
    findings: {
      local_env_truth: localLiveSuccessPossible
        ? 'local_env_appears_live'
        : 'local_env_still_placeholder_or_shape_invalid',
      local_supabase_truth: localLiveSuccessPossible
        ? 'local_supabase_credentials_shape_looks_live'
        : 'local_supabase_credentials_are_placeholder_or_shape_invalid',
      production_project_env_truth: productionTelegramEnvMissing
        ? 'production_project_missing_telegram_credentials'
        : productionArtifactRootEscapedNewline
          ? 'production_project_env_contains_literal_backslash_n_in_artifact_root'
          : productionArtifactRootActualNewline
            ? 'production_project_env_contains_actual_newline_in_artifact_root'
            : 'production_project_env_appears_present_for_packet_a_inputs',
      production_contract_truth: missingContactLooksLegacy
        ? 'production_still_serves_legacy_validation_contract'
        : missingContactLooksHardened
          ? 'production_serves_hardened_validation_contract'
          : 'production_contract_changed_or_inconclusive',
      production_false_success_truth: emailProbeLooksLegacyFalseSuccess
        ? 'production_email_probe_still_returns_legacy_false_success_message'
        : emailProbeLooksHardenedFailure
          ? 'production_email_probe_honestly_fails_without_false_success'
          : 'production_email_probe_not_false_success_or_inconclusive',
      production_success_path_truth:
        emailProbeLooksHardenedFailure && sourceMapsHardFailureToFallbackFailure
          ? 'production_email_probe_reaches_hard_failure_so_both_primary_persistence_and_fallback_queue_are_unavailable'
          : emailProbeLooksLegacyFalseSuccess
            ? 'production_email_probe_still_masks_persistence_failure_with_legacy_false_success'
            : emailProbeLooksPersistedButAlertFailed && productionTelegramEnvMissing
              ? 'production_email_probe_persists_but_operator_alert_fails_because_telegram_env_is_missing'
              : emailProbeLooksPersistedButAlertFailed
                ? 'production_email_probe_persists_but_operator_alert_still_fails'
                : 'production_success_path_unproven_or_inconclusive',
      production_notification_truth: emailProbeLooksPersistedButAlertFailed && productionTelegramEnvMissing
        ? 'production_returns_201_success_with_operator_alerted_false_and_missing_telegram_env'
        : emailProbeLooksPersistedButAlertFailed
          ? 'production_returns_201_success_with_operator_alerted_false'
          : 'production_notification_state_inconclusive',
      production_artifact_path_truth: emailProbeHasNewlineTaintedArtifactPath && productionArtifactRootEscapedNewline
        ? 'production_alert_artifact_path_inherits_literal_backslash_n_from_project_env_root'
        : emailProbeHasNewlineTaintedArtifactPath && productionArtifactRootActualNewline
          ? 'production_alert_artifact_path_inherits_actual_newline_from_project_env_root'
          : emailProbeHasNewlineTaintedArtifactPath
            ? 'production_alert_artifact_path_still_contains_newline_tainted_root'
            : 'production_alert_artifact_path_not_newline_tainted_or_inconclusive',
      homepage_truth: homepageLegacyDetected
        ? 'production_homepage_still_exposes_legacy_ai_marketing_strings'
        : 'production_homepage_legacy_strings_not_detected',
      chunk_truth: homepageChunksDifferFromLocal
        ? 'production_homepage_chunks_differ_from_current_local_build'
        : 'production_homepage_chunks_match_local_build_or_inconclusive',
      david_alias_truth:
        davidAliasRoute.status === 200 &&
        typeof davidAliasRoute.json === 'object' &&
        davidAliasRoute.json !== null &&
        'status' in davidAliasRoute.json &&
        (davidAliasRoute.json as { status?: unknown }).status === 'legacy_alias'
          ? 'production_david_alias_route_matches_expected_fence'
          : 'production_david_alias_route_unexpected_or_inconclusive',
      david_health_truth:
        davidHealthRoute.status === 200 &&
        typeof davidHealthRoute.json === 'object' &&
        davidHealthRoute.json !== null &&
        'healthState' in davidHealthRoute.json &&
        (davidHealthRoute.json as { healthState?: unknown }).healthState === 'healthy'
          ? 'production_david_health_route_reports_healthy'
          : 'production_david_health_route_unexpected_or_inconclusive',
      vercel_auth_truth: vercelWhoami.ok
        ? 'vercel_credentials_present'
        : 'vercel_credentials_unavailable_from_this_seat',
    },
  });

  console.log(bundleRoot);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
