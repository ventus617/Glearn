import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dailyFacts, defaultRules, demoSnapshot, screenSnapshot, visibleHistory } from '../public/selection-model.js';

const history = JSON.parse(await readFile(new URL('../data/market/ashare-history.json', import.meta.url), 'utf8'));
const stock = symbol => history.series.find(series => series.symbol === symbol);
const factsOn = (series, date) => dailyFacts(series.bars, series.bars.findIndex(bar => bar.time === date));
const closeTo = (actual, expected, tolerance = 0.005) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be close to ${expected}`);

test('archived A-share prices match raw sources and preserve real candle geometry', async () => {
  for (const series of history.series) {
    const sources = [series.source, series.source.verificationSource];
    const [tencentBytes, sinaBytes] = await Promise.all(sources.map(source => readFile(new URL(`../${source.rawFile}`, import.meta.url))));
    [tencentBytes, sinaBytes].forEach((bytes, index) => {
      assert.equal(createHash('sha256').update(bytes).digest('hex'), sources[index].sha256);
    });
    const tencent = JSON.parse(tencentBytes).data[series.symbol].day;
    const jsonp = sinaBytes.toString('utf8');
    const sina = JSON.parse(jsonp.slice(jsonp.indexOf('=(') + 2, jsonp.lastIndexOf(');')));
    assert.equal(series.bars.length, 37);
    for (const bar of series.bars) {
      const raw = tencent.find(row => row[0] === bar.time);
      assert.deepEqual([bar.open, bar.close, bar.high, bar.low, bar.volume], raw.slice(1, 6).map(Number));
      const verification = sina.find(row => row.day === bar.time);
      for (const key of ['open', 'high', 'low', 'close']) assert.equal(bar[key], Number(verification[key]));
      assert.ok(Math.abs(bar.volume * 100 - Number(verification.volume)) <= 50);
      assert.ok(bar.high >= Math.max(bar.open, bar.close) && bar.low <= Math.min(bar.open, bar.close));
    }
    for (const event of series.events) assert.ok(series.bars.some(bar => bar.time === event.date));
  }

  const eastmoney = factsOn(stock('sz300059'), '2024-10-09');
  closeTo(eastmoney.change, 2.22);
  closeTo(eastmoney.relativeVolume, 2.58);
  closeTo(eastmoney.rangePosition, 35.837, 0.001);
  assert.equal(factsOn(stock('sh600030'), '2024-10-08').rangePosition, null);
  const pingan = stock('sh601318');
  const candle = pingan.bars.find(bar => bar.time === '2024-10-08');
  assert.ok(candle.close < candle.open, 'a positive change from yesterday can still be a down candle');
  closeTo(factsOn(pingan, candle.time).change, 8.13);
});

test('historical replay and daily volume calculations cannot use bars after the selected date', () => {
  const series = stock('sz300059');
  const cutoff = '2024-09-24';
  const visible = visibleHistory(series, cutoff);
  assert.equal(visible.at(-1).time, cutoff);
  assert.ok(visible.every(bar => bar.time <= cutoff));
  const facts = dailyFacts(visible, visible.length - 1);
  closeTo(facts.relativeVolume, 5.03);
  closeTo(facts.change, 11.46);
  assert.equal(dailyFacts(visible, 4).relativeVolume, null, 'five completed prior sessions are required');

  const changedFuture = { ...series, bars: series.bars.map(bar => bar.time > cutoff ? { ...bar, close: 9999, volume: 1e12 } : bar) };
  assert.deepEqual(visibleHistory(changedFuture, cutoff), visible);
  assert.deepEqual(dailyFacts(changedFuture.bars, visible.length - 1), facts);
});

test('09:35 screening applies thresholds and never passes incomplete or incompatible imports', () => {
  const snapshot = demoSnapshot();
  const eligibleCodes = (input, rules = defaultRules) => screenSnapshot(input, rules).filter(row => row.eligible).map(row => row.item.code);
  assert.deepEqual(eligibleCodes(snapshot), ['600000']);
  assert.deepEqual(eligibleCodes(snapshot, { ...defaultRules, board: 'all' }), ['600000', '300001']);
  assert.deepEqual(eligibleCodes(snapshot, { ...defaultRules, amountRatio: 3 }), ['600000']);
  assert.deepEqual(eligibleCodes(snapshot, { ...defaultRules, amountRatio: 3.01 }), []);

  const candidate = snapshot.items[0];
  const invalidItems = [
    { ...candidate, medianAmount5m20: undefined },
    { ...candidate, medianAmount5m20: 0 },
    { ...candidate, asOf: '2024-09-24T09:36:00+08:00' },
    { ...candidate, amount5m: '90000000' },
    { ...candidate, isST: undefined },
    { ...candidate, historySessions: 19 }
  ];
  for (const item of invalidItems) {
    const [result] = screenSnapshot({ ...snapshot, items: [item] });
    assert.equal(result.eligible, false);
    assert.ok(result.reasons.length > 0);
  }
  assert.equal(screenSnapshot({ ...snapshot, items: [{ ...candidate, medianAmount5m20: 0 }] })[0].metrics, null);

  const impossibleDate = '2024-02-30T09:35:00+08:00';
  for (const invalid of [null, { ...snapshot, items: [] }, { ...snapshot, provider: '' }, { ...snapshot, asOf: '2024-09-24T15:00:00+08:00' }, { ...snapshot, asOf: impossibleDate, items: [{ ...candidate, asOf: impossibleDate }] }]) {
    assert.throws(() => screenSnapshot(invalid));
  }
  assert.throws(() => screenSnapshot(snapshot, { ...defaultRules, amountRatio: NaN }));
  assert.throws(() => screenSnapshot(snapshot, { ...defaultRules, minGap: 5, maxGap: 4 }));
});
