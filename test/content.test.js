import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readJson(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, import.meta.url), 'utf8'));
}

test('beginner curriculum links every lesson, source, quiz, guide, detailed term, worked case, and textbook expansion', async () => {
  const [content, beginner, glossaryDetails, lessonDepth, textbookChapters, sources] = await Promise.all([
    readJson('../data/content.json'),
    readJson('../data/beginner.json'),
    readJson('../data/glossary-details.json'),
    readJson('../data/lesson-depth.json'),
    readJson('../data/textbook-chapters.json'),
    readJson('../data/sources.json')
  ]);
  const lessonIds = new Set(content.lessons.map((lesson) => lesson.id));
  const sourceIds = new Set(sources.map((source) => source.id));

  assert.deepEqual(content.tracks.map((track) => track.id), ['foundation', 'smc', 'flow']);
  assert.equal(content.lessons.length, 21);
  assert.equal(Object.keys(beginner.guides).length, content.lessons.length);
  assert.equal(Object.keys(glossaryDetails.details).length, content.glossary.length);
  assert.equal(Object.keys(lessonDepth.lessons).length, content.lessons.length);
  assert.equal(Object.values(lessonDepth.lessons).reduce((total, item) => total + item.cases.length, 0), 42);
  assert.ok(textbookChapters.meta.completedRounds >= 1 && textbookChapters.meta.completedRounds <= 5);
  assert.equal(Object.keys(textbookChapters.chapters).length, textbookChapters.meta.completedRounds);

  for (const track of content.tracks) {
    assert.ok(track.lessonIds.length > 0, `${track.id} needs lessons`);
    track.lessonIds.forEach((id) => assert.ok(lessonIds.has(id), `${track.id} references missing lesson ${id}`));
  }

  for (const lesson of content.lessons) {
    const guide = beginner.guides[lesson.id];
    const depth = lessonDepth.lessons[lesson.id];
    assert.ok(guide?.plain && guide?.analogy && guide?.misconception && guide?.prerequisite, `${lesson.id} needs a complete beginner guide`);
    assert.equal(guide.readOrder.length, 4, `${lesson.id} needs a four-step reading order`);
    lesson.sourceIds.forEach((id) => assert.ok(sourceIds.has(id), `${lesson.id} references missing source ${id}`));
    assert.ok(lesson.quiz.answer >= 0 && lesson.quiz.answer < lesson.quiz.choices.length, `${lesson.id} has an invalid quiz answer`);
    assert.ok(depth?.overview, `${lesson.id} needs a deep-study overview`);
    assert.equal(depth.mechanics.length, 2, `${lesson.id} needs two mechanism chapters`);
    assert.equal(depth.cases.length, 2, `${lesson.id} needs two contrasting cases`);
    assert.equal(depth.practice.length, 3, `${lesson.id} needs three independent-practice prompts`);
    depth.cases.forEach((caseItem) => {
      assert.ok(caseItem.setup && caseItem.decision && caseItem.invalidation && caseItem.takeaway, `${lesson.id}/${caseItem.title} needs a complete reasoning outcome`);
      assert.equal(caseItem.reasoning.length, 3, `${lesson.id}/${caseItem.title} needs a three-step reasoning chain`);
    });
  }

  for (const term of content.glossary) {
    const detail = glossaryDetails.details[term.term];
    assert.ok(detail?.mechanism && detail?.distinction && detail?.application && detail?.mistake, `${term.term} needs a complete detailed explanation`);
    assert.equal(detail.recognition.length, 2, `${term.term} needs a two-step recognition or calculation guide`);
  }

  for (const [lessonId, chapter] of Object.entries(textbookChapters.chapters)) {
    assert.ok(lessonIds.has(lessonId), `textbook chapter references missing lesson ${lessonId}`);
    const theory = [
      chapter.question,
      ...chapter.lead,
      ...chapter.definition.paragraphs,
      ...chapter.mechanism.paragraphs,
      ...chapter.model.paragraphs,
      chapter.model.boundary,
      chapter.workedExample.setup,
      chapter.workedExample.interpretation,
      ...chapter.evidence.paragraphs,
      ...chapter.summary
    ].join('');
    const chineseCharacters = [...theory].filter((character) => /[\u3400-\u9fff]/u.test(character)).length;
    assert.ok(chineseCharacters >= textbookChapters.meta.theoryMinimumCharacters, `${lessonId} textbook theory is too short: ${chineseCharacters}`);
    assert.equal(chapter.cases.length, 3, `${lessonId} needs valid, failed, and no-trade textbook cases`);
    assert.ok(chapter.cases.some((item) => item.type.includes('成立')), `${lessonId} needs a constructive case`);
    assert.ok(chapter.cases.some((item) => item.type.includes('失败')), `${lessonId} needs a failed counterexample`);
    assert.ok(chapter.cases.some((item) => item.type.includes('冲突')), `${lessonId} needs a conflict/no-trade case`);
    assert.ok(chapter.misconceptions.length >= 3, `${lessonId} needs misconception rebuttals`);
    assert.ok(chapter.questions.length >= 3, `${lessonId} needs layered questions`);
    assert.ok(chapter.tree.nextBranch, `${lessonId} needs the next DFS branch`);
    chapter.sources.forEach((item) => assert.ok(sourceIds.has(item.sourceId), `${lessonId} references missing textbook source ${item.sourceId}`));
  }
});
