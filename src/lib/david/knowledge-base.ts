import inventorySource from '../../../data/forklift-inventory.json';

export interface DavidKnowledgeBaseInventoryItem {
  id: string;
  title: string;
  type: string;
  price: string;
  specs: string[];
  condition: string;
  location: string;
  photosUrl: string;
  status: string;
}

export interface DavidKnowledgeBase {
  company: {
    name: string;
    summary: string;
    publicEmail: string;
    phone: string;
    location: string;
  };
  people: {
    chris: {
      name: string;
      role: string;
      email: string;
      escalation: string;
    };
    bill: {
      name: string;
      role: string;
      email: string;
      escalation: string;
    };
  };
  inventory: DavidKnowledgeBaseInventoryItem[];
}

type ForkliftInventorySource = typeof inventorySource;

type StandaloneUnit = ForkliftInventorySource['inventory']['standalone_units'][number];
type InventoryLot = ForkliftInventorySource['inventory']['lots'][number];

function formatUsd(value: number | undefined | null): string {
  if (!value) return 'price not listed';
  return `$${value.toLocaleString('en-US')}`;
}

function formatLot(lot: InventoryLot): DavidKnowledgeBaseInventoryItem {
  return {
    id: lot.lot_id,
    title: lot.title,
    type: lot.unit_type,
    price: `${formatUsd(lot.lot_asking_price_usd)} lot`,
    specs: [
      `${lot.units.length} units sold as one lot only`,
      `${lot.mast_collapsed_inches}\" collapsed mast / ${lot.mast_extended_inches}\" extended mast`,
      `${lot.hours_avg.toLocaleString('en-US')} average hours`,
      lot.battery_and_charger_included ? 'battery and charger included' : 'battery/charger status not listed',
      lot.seller_responsibility,
    ],
    condition: lot.condition,
    location: lot.location,
    photosUrl: lot.lot_photos[0] ?? '',
    status: lot.status,
  };
}

function firstPhoto(unit: StandaloneUnit): string {
  return unit.media_paths?.[0] ?? unit.video_paths?.[0] ?? '';
}

function formatStandalone(unit: StandaloneUnit): DavidKnowledgeBaseInventoryItem {
  const specs = [
    `${unit.year} ${unit.make} ${unit.model}`,
    unit.capacity_lbs ? `${unit.capacity_lbs.toLocaleString('en-US')} lb capacity` : null,
    unit.mast_collapsed_inches && unit.mast_extended_inches
      ? `${unit.mast_collapsed_inches}\" collapsed mast / ${unit.mast_extended_inches}\" extended mast`
      : null,
    'guidance' in unit && unit.guidance ? `${unit.guidance}` : null,
    unit.battery ? unit.battery : null,
    unit.hours_approx ? `${unit.hours_approx.toLocaleString('en-US')} approximate hours` : null,
  ].filter((value): value is string => Boolean(value));

  return {
    id: unit.unit_id,
    title: `${unit.year} ${unit.make} ${unit.model} ${unit.unit_type}`.replace(/\s+/g, ' ').trim(),
    type: unit.unit_type,
    price: formatUsd(unit.asking_price_usd),
    specs,
    condition: unit.condition ?? 'Used — Running',
    location: unit.location,
    photosUrl: firstPhoto(unit),
    status: unit.status,
  };
}

export function loadDavidKnowledgeBase(): DavidKnowledgeBase {
  const { inventory } = inventorySource;
  const contacts = inventory.contacts_2026_04_21;

  return {
    company: {
      name: 'Material Solutions NJ',
      summary:
        'Material Solutions NJ sells and services used warehouse equipment with a focus on narrow-aisle forklifts, reach trucks, swing reaches, order pickers, and Bendi/articulated units.',
      publicEmail: contacts.public_contact_email,
      phone: contacts.phone_public,
      location: 'Hamilton, NJ / New Jersey, with selected equipment staged in Baltimore, Maryland',
    },
    people: {
      chris: {
        name: 'Chris Razzuoli',
        role: 'Material Solutions NJ operator / sales owner contact',
        email: contacts.customer_business_email_primary,
        escalation: 'sales/owner/operator escalation',
      },
      bill: {
        name: 'Bill White',
        role: 'Material Solutions equipment/customer follow-up contact',
        email: contacts.customer_business_email_secondary,
        escalation: 'equipment/customer follow-up escalation',
      },
    },
    inventory: [
      ...inventory.lots.map(formatLot),
      ...inventory.standalone_units.map(formatStandalone),
    ],
  };
}

export function buildDavidKnowledgeBasePromptBlock(kb = loadDavidKnowledgeBase()): string {
  const people = [kb.people.chris, kb.people.bill]
    .map((person) => `- ${person.name}: ${person.role}; use for ${person.escalation}; email ${person.email}.`)
    .join('\n');

  const inventoryLines = kb.inventory
    .map((item) => {
      const specs = item.specs.length ? ` Specs: ${item.specs.join('; ')}.` : '';
      const photo = item.photosUrl ? ` Photo/media: ${item.photosUrl}.` : '';
      return `- ${item.id}: ${item.title}; ${item.price}; ${item.condition}; ${item.location}; status ${item.status}.${specs}${photo}`;
    })
    .join('\n');

  return `## DAVID STATIC KNOWLEDGE BASE
Company: ${kb.company.name}. ${kb.company.summary}
Public contact: ${kb.company.publicEmail}; phone ${kb.company.phone}; location ${kb.company.location}.

People and escalation:
${people}

Canonical current inventory:
${inventoryLines}

Use this static knowledge base as session context only. If current availability or pricing could have changed, say that the team should confirm before purchase.`;
}
