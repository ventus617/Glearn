import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('every case has ordered reveal stages, complete analysis, and a valid decision check', async () => {
  const casebook = JSON.parse(await readFile(new URL('../data/cases.json', import.meta.url), 'utf8'));
  assert.equal(casebook.cases.length, 6);

  for (const caseItem of casebook.cases) {
    assert.ok(caseItem.bars.length >= 10, `${caseItem.id} needs enough bars to show a structure`);
    assert.equal(caseItem.stages.length, 5, `${caseItem.id} should preserve the five-stage learning rhythm`);
    assert.deepEqual(
      caseItem.stages.map((stage) => stage.end),
      [...caseItem.stages.map((stage) => stage.end)].sort((a, b) => a - b),
      `${caseItem.id} stages must reveal bars in order`
    );
    assert.equal(caseItem.stages.at(-1).end, caseItem.bars.length, `${caseItem.id} final stage must reveal every bar`);
    assert.ok(caseItem.analysis.invalidation, `${caseItem.id} must be falsifiable`);
    assert.ok(caseItem.analysis.alternative, `${caseItem.id} must include an alternative reading`);
    assert.ok(caseItem.decisionCheck.answer >= 0 && caseItem.decisionCheck.answer < caseItem.decisionCheck.choices.length);
  }
});
