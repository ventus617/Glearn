import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import { inspectSource } from '../lib/source-checker.js';

test('source checker establishes a baseline and creates a heading diff after a real change', async () => {
  let revision = 1;
  const fixture = http.createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(revision === 1
      ? '<html><title>Study</title><h1>Market Structure</h1><p>Baseline lesson.</p></html>'
      : '<html><title>Study</title><h1>Market Structure</h1><h2>Order Flow</h2><p>Extended lesson.</p></html>');
  });
  await new Promise((resolve) => fixture.listen(0, '127.0.0.1', resolve));

  try {
    const { port } = fixture.address();
    const source = { id: 'fixture', title: 'Fixture', url: `http://127.0.0.1:${port}/` };
    const baseline = await inspectSource(source);
    assert.equal(baseline.snapshot.status, 'ok');
    assert.equal(baseline.changed, false);
    assert.equal(baseline.candidate, null);

    revision = 2;
    const changed = await inspectSource(source, baseline.snapshot);
    assert.equal(changed.changed, true);
    assert.equal(changed.candidate.status, 'pending');
    assert.deepEqual(changed.candidate.addedHeadings, ['Order Flow']);
  } finally {
    await new Promise((resolve, reject) => fixture.close((error) => error ? reject(error) : resolve()));
  }
});
