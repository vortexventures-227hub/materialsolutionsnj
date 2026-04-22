import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const sampleFaqs = [
  {
    question: 'Do you deliver equipment?',
    answer: 'We can arrange delivery nationwide based on the machine and route.',
  },
  {
    question: 'Can I finance a purchase?',
    answer: 'Yes. We can connect buyers with equipment financing partners.',
  },
];

test('FAQBlock renders FAQPage JSON-LD and accessible expand/collapse markup', async () => {
  const { FAQBlock } = await import('../src/components/marketing/FAQBlock.tsx');

  const html = renderToStaticMarkup(
    React.createElement(FAQBlock, {
      faqs: sampleFaqs,
      heading: 'Common buyer questions',
    })
  );

  assert.match(html, /Common buyer questions/);
  assert.match(html, /type="application\/ld\+json"/);
  assert.match(html, /Do you deliver equipment\?/);
  assert.match(html, /Can I finance a purchase\?/);
  assert.match(html, /<details/);
  assert.match(html, /<summary/);
  assert.match(html, /faq-answer-0/);
  assert.match(html, /faq-answer-1/);

  const [, schemaJson] = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/) ?? [];
  assert.ok(schemaJson, 'expected FAQPage JSON-LD script');

  const schema = JSON.parse(schemaJson);
  assert.equal(schema['@context'], 'https://schema.org');
  assert.equal(schema['@type'], 'FAQPage');
  assert.equal(schema.mainEntity.length, sampleFaqs.length);
  assert.equal(schema.mainEntity[0].name, sampleFaqs[0].question);
  assert.equal(schema.mainEntity[0].acceptedAnswer.text, sampleFaqs[0].answer);
});
