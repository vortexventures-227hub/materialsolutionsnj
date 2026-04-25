import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read prompts.ts source directly so this test doesn't require compilation
const promptsSource = readFileSync(
  join(__dirname, '../src/lib/david/prompts.ts'),
  'utf-8'
);

const inventorySource = JSON.parse(
  readFileSync(join(__dirname, '../data/forklift-inventory.json'), 'utf-8')
);

// Canonical OSHA pricing formula: $799 base for 5 students, $79 per additional
function computeOSHAPrice(students: number): number {
  if (students <= 0) return 0;
  if (students <= 5) return 799;
  return 799 + (students - 5) * 79;
}

// --- formula correctness ---

test('OSHA formula: 5 students = $799', () => {
  assert.equal(computeOSHAPrice(5), 799);
});

test('OSHA formula: 6 students = $878', () => {
  assert.equal(computeOSHAPrice(6), 878);
});

test('OSHA formula: 10 students = $1,194', () => {
  assert.equal(computeOSHAPrice(10), 1194);
});

// Regression: David previously estimated $1,665 for 20 students (off by $319)
test('OSHA formula: 20 students = $1,984 (not $1,665)', () => {
  assert.equal(computeOSHAPrice(20), 1984);
  assert.notEqual(computeOSHAPrice(20), 1665, 'Must not return the previously wrong value $1,665');
});

test('OSHA formula: 15 students = $1,589', () => {
  assert.equal(computeOSHAPrice(15), 1589);
});

// --- prompts.ts content checks ---

test('prompts.ts states base price $799 for first 5 students', () => {
  assert.ok(
    promptsSource.includes('$799 for first 5 students'),
    'Base price must be explicit in prompts.ts'
  );
});

test('prompts.ts states per-student add-on rate $79', () => {
  assert.ok(
    promptsSource.includes('$79 each additional'),
    'Per-student add-on rate must be in prompts.ts'
  );
});

// Regression: the prompt must contain the pre-computed $1,984 value so David
// quotes correctly for 20-student requests without doing runtime math.
test('prompts.ts contains precomputed 20-student price $1,984', () => {
  assert.ok(
    promptsSource.includes('1,984'),
    'prompts.ts must contain precomputed price $1,984 for 20 students — previously David quoted $1,665 (wrong)'
  );
});

test('prompts.ts does NOT contain the previously wrong value $1,665 as a quoted price', () => {
  // $1,665 should not appear in the table as the 20-student price
  const lines = promptsSource.split('\n');
  const tableLines = lines.filter(l => l.includes('1,665') || l.includes('$1665'));
  // It's acceptable for $1,668 (16-student price) to appear, but not $1,665
  const wrongPrice = tableLines.some(l => l.includes('1,665'));
  assert.ok(!wrongPrice, 'The wrong price $1,665 must not appear as a precomputed price');
});

test('prompts.ts uses the corrected 752R45TT model name instead of stale 7530RST', () => {
  assert.ok(
    promptsSource.includes('2018 Raymond 752R45TT Reach Truck — $29,500'),
    'prompts.ts must name the corrected 752R45TT reach truck in the current inventory section'
  );
  assert.ok(
    !promptsSource.includes('2018 Raymond 7530RST Reach Truck — $29,500'),
    'prompts.ts must not carry the stale 7530RST model string in buyer-facing inventory copy'
  );
});

test('prompts.ts no longer marks the 752R45TT as spec-pending hold inventory', () => {
  assert.ok(
    !promptsSource.includes('HOLD: serial, capacity, lift height, battery, hours all pending'),
    'prompts.ts must not describe the corrected 752R45TT as a hold item with all specs pending'
  );
});

test('prompts.ts reflects Chris 4/18 source classification of the two 970CSR30T units as swing reach forklifts', () => {
  assert.ok(
    promptsSource.includes('2016 Raymond 970CSR30T Swing Reach Forklift — $72,850'),
    'prompts.ts must describe the 2016 970CSR30T unit as a swing reach forklift per Chris 4/18 source text'
  );
  assert.ok(
    promptsSource.includes('2019 Raymond 970CSR30T Swing Reach Forklift — $79,675'),
    'prompts.ts must describe the 2019 970CSR30T unit as a swing reach forklift per Chris 4/18 source text'
  );
  assert.ok(
    !promptsSource.includes('2016 Raymond 970CSR30T Reach Truck — $72,850'),
    'prompts.ts must not keep the stale reach-truck label for the 2016 970CSR30T unit'
  );
  assert.ok(
    !promptsSource.includes('2019 Raymond 970CSR30T Reach Truck — $79,675'),
    'prompts.ts must not keep the stale reach-truck label for the 2019 970CSR30T unit'
  );
});

test('forklift-inventory.json reconciles the 14-unit count with Chris 4/18 swing reach source truth', () => {
  const inventory = inventorySource.inventory;
  assert.equal(inventory.locked_count_2026_04_21.total, 14);
  assert.equal(inventory.locked_count_2026_04_21.order_pickers, 9);
  assert.equal(inventory.locked_count_2026_04_21.reach_trucks, 1);
  assert.equal(inventory.locked_count_2026_04_21.swing_reaches, 3);
  assert.equal(inventory.locked_count_2026_04_21.bendies, 1);

  const standaloneById = new Map(
    inventory.standalone_units.map((unit: Record<string, unknown>) => [String(unit.unit_id), unit])
  );

  const reach2016 = standaloneById.get('RT-970CSR30T-2016') as Record<string, unknown>;
  const reach2019 = standaloneById.get('RT-970CSR30T-2019') as Record<string, unknown>;
  const swing2018 = standaloneById.get('SR-960CSR30TT-2018') as Record<string, unknown>;
  const bendi2019 = standaloneById.get('BENDI-B40-LANDOLL') as Record<string, unknown>;

  assert.equal(reach2016.unit_type, 'Swing Reach Forklift');
  assert.equal(reach2016.legacy_unit_id, 'SR-970CSR30T-2016');
  assert.equal(reach2016.status, 'available');
  assert.equal(reach2016.hold_reason, null);

  assert.equal(reach2019.unit_type, 'Swing Reach Forklift');
  assert.equal(reach2019.legacy_unit_id, 'SR-970CSR30T-2019');
  assert.equal(reach2019.status, 'available');
  assert.equal(reach2019.hold_reason, null);

  assert.equal(swing2018.unit_type, 'Swing Reach');
  assert.equal(swing2018.status, 'available');
  assert.equal(swing2018.hold_reason, null);

  assert.equal(bendi2019.status, 'available');
  assert.equal(bendi2019.hold_reason, null);
  assert.equal(inventory.pending_new_units.count_approx, 0);
});
