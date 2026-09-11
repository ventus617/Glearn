// Pure, point-in-time screening rules shared by the learning UI and tests.
export const defaultRules = Object.freeze({ board: 'main', amountRatio: 2, minGap: 0, maxGap: 4, maxVwapDistance: 2, breadth: 60 });

export function screenSnapshot(snapshot, rules = defaultRules) {
  if (!snapshot || !Array.isArray(snapshot.items) || !snapshot.items.length || snapshot.items.length > 10000) throw new Error('需要 1–10000 条 items 股票快照。');
  if (typeof snapshot.provider !== 'string' || !snapshot.provider.trim()) throw new Error('请填写 provider 数据来源。');
  if (typeof snapshot.asOf !== 'string' || !/^\d{4}-\d{2}-\d{2}T09:35:00\+08:00$/.test(snapshot.asOf) || !Number.isFinite(Date.parse(snapshot.asOf))) throw new Error('此规则只接收北京时间 09:35:00 的完整截面，例如 2024-09-24T09:35:00+08:00。');
  if (new Date(Date.parse(snapshot.asOf) + 8 * 3600000).toISOString().slice(0, 10) !== snapshot.asOf.slice(0, 10)) throw new Error('asOf 的日历日期不存在。');
  if (!['main', 'all'].includes(rules.board) || ['amountRatio', 'minGap', 'maxGap', 'maxVwapDistance', 'breadth'].some(key => !Number.isFinite(rules[key])) || rules.amountRatio <= 0 || rules.minGap > rules.maxGap || rules.maxVwapDistance < 0 || rules.breadth < 0 || rules.breadth > 100) throw new Error('请检查阈值：数值必须有效，下限不能大于上限。');
  const codes = new Map();
  snapshot.items.forEach(item => codes.set(item?.code, (codes.get(item?.code) || 0) + 1));
  return snapshot.items.map(item => {
    const reasons = [];
    const numbers = ['prevClose', 'open', 'last', 'yesterdayHigh', 'vwap', 'amount5m', 'medianAmount5m20', 'sectorBreadthPct', 'historySessions', 'listedSessions'];
    if (!item || typeof item !== 'object') return { item: {}, eligible: false, reasons: ['无效股票记录'], metrics: null };
    if (codes.get(item.code) > 1) reasons.push('代码重复：截面应每股一条');
    const validBoard = (item.board === 'main' && /^(60[0135]\d{3}|00[0123]\d{3})$/.test(item.code)) || (item.board === 'chinext' && /^30[01]\d{3}$/.test(item.code)) || (item.board === 'star' && /^688\d{3}$/.test(item.code));
    if (!validBoard) reasons.push('非已识别沪深 A 股代码／板块，需核对证券主表');
    if (rules.board === 'main' && item.board !== 'main') reasons.push('不在本次主板股票池');
    if (item.asOf !== snapshot.asOf) reasons.push('个股时间与 09:35 截面不一致');
    if (['isST', 'suspended', 'atLimitUp', 'exRightToday'].some(key => typeof item[key] !== 'boolean')) reasons.push('ST／停牌／涨停／除权状态未知');
    if (item.isST || item.suspended || item.atLimitUp || item.exRightToday) reasons.push('排除 ST／停牌／涨停／除权日');
    if (numbers.some(key => typeof item[key] !== 'number' || !Number.isFinite(item[key]))) reasons.push('必需数值缺失或不是数字');
    if (reasons.some(reason => reason.includes('数值'))) return { item, eligible: false, reasons, metrics: null };
    if (item.listedSessions < 60) reasons.push('上市不足 60 个交易日');
    if (item.historySessions !== 20) reasons.push('缺少前 20 个有效同期样本');
    if (['prevClose', 'open', 'last', 'yesterdayHigh', 'vwap', 'amount5m', 'medianAmount5m20'].some(key => item[key] <= 0) || item.sectorBreadthPct < 0 || item.sectorBreadthPct > 100) return { item, eligible: false, reasons: [...reasons, '价格、成交额或板块比例超出有效范围'], metrics: null };
    const metrics = {
      amountRatio: item.amount5m / item.medianAmount5m20,
      gap: (item.open / item.prevClose - 1) * 100,
      vwapDistance: (item.last / item.vwap - 1) * 100,
      breakout: (item.last / item.yesterdayHigh - 1) * 100,
      breadth: item.sectorBreadthPct
    };
    if (metrics.amountRatio < rules.amountRatio) reasons.push('同期成交额未达到倍数门槛');
    if (metrics.gap < rules.minGap || metrics.gap > rules.maxGap) reasons.push('开盘缺口不在设定范围');
    if (metrics.breakout <= 0) reasons.push('截至 9:35 尚未站上昨日最高价');
    if (metrics.vwapDistance < 0 || metrics.vwapDistance > rules.maxVwapDistance) reasons.push('低于均价或离均价过远');
    if (metrics.breadth < rules.breadth) reasons.push('所属板块站上成交均价的股票占比不足');
    return { item, eligible: reasons.length === 0, reasons, metrics };
  }).map(result => ({ ...result, status: !result.metrics || result.reasons.some(reason => /时间|未知|缺少|代码重复|非已识别/.test(reason)) ? 'unknown' : result.eligible ? 'candidate' : 'rejected' }));
}

export function visibleHistory(series, cutoff) {
  return series.bars.filter(bar => bar.time <= cutoff);
}

export function dailyFacts(bars, index) {
  const bar = bars[index];
  const previous = bars[index - 1];
  const baseline = bars.slice(Math.max(0, index - 5), index);
  const average = baseline.length === 5 ? baseline.reduce((sum, item) => sum + item.volume, 0) / 5 : null;
  return {
    change: previous ? (bar.close / previous.close - 1) * 100 : null,
    gap: previous ? (bar.open / previous.close - 1) * 100 : null,
    rangePosition: bar.high > bar.low ? (bar.close - bar.low) / (bar.high - bar.low) * 100 : null,
    relativeVolume: average > 0 ? bar.volume / average : null
  };
}

export function demoSnapshot() {
  const asOf = '2024-09-24T09:35:00+08:00';
  const base = { asOf, board: 'main', isST: false, suspended: false, atLimitUp: false, exRightToday: false, prevClose: 10, open: 10.2, last: 10.42, yesterdayHigh: 10.3, vwap: 10.3, amount5m: 90000000, medianAmount5m20: 30000000, sectorBreadthPct: 72, historySessions: 20, listedSessions: 250 };
  return { provider: '教学虚构截面：代码仅作格式占位，不对应该股票真实行情', asOf, items: [
    { ...base, code: '600000', name: '教学甲 · 条件齐全' },
    { ...base, code: '000001', name: '教学乙 · 放量未突破', last: 10.15 },
    { ...base, code: '600001', name: '教学丙 · 追得太远', last: 10.9 },
    { ...base, code: '000002', name: '教学丁 · 板块孤立', sectorBreadthPct: 32 },
    { ...base, code: '300001', board: 'chinext', name: '教学戊 · 不在主板池' },
    { ...base, code: '600002', name: '教学己 · 缺少基准', medianAmount5m20: null }
  ] };
}
