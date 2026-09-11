import { defaultRules, screenSnapshot, visibleHistory, dailyFacts, demoSnapshot } from './selection-model.js';

const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n = (value, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : '—';
const p = paragraphs => (paragraphs || []).map(text => `<p>${e(text)}</p>`).join('');
const external = (url, title) => /^https?:\/\//.test(url || '') ? `<a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(title)} ↗</a>` : e(title);
let contentPromise;
let snapshot = demoSnapshot();
let rules = { ...defaultRules };
let imported = false;
let chartObserver;
const metricLabels = {
  auction_relative_amount: '竞价成交额倍数', opening_gap_pct: '开盘缺口', upper_limit_room_pct: '距涨停剩余空间',
  relative_amount_0935: '同期成交额倍数', close_location_0935: '区间收盘位置（CLV）', above_open_and_vwap: '站上开盘价与成交均价',
  relative_sector_strength_pp: '个股相对板块强度', sector_breadth: '板块站上均价占比', closed_bar_breakout: '完整分钟突破',
  relative_amount_to_now: '截至此刻的同期成交额', prior_push_pct: '此前上冲幅度', pullback_pace_ratio: '回踩成交速率',
  vwap_reclaim_closed_bars: '重新站上成交均价并保持'
};

function download(name, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function mountAShare(host, section = 'start') {
  chartObserver?.disconnect();
  host.innerHTML = '<div class="a-loading">正在载入沪深选股教材与历史行情…</div>';
  const route = location.hash;
  try {
    contentPromise ||= fetch('/api/ashare').then(async response => { if (!response.ok) throw new Error('教材暂时无法载入，请刷新重试。'); return response.json(); }).catch(error => { contentPromise = null; throw error; });
    const { curriculum, history } = await contentPromise;
    if (location.hash !== route) return;
    const chapter = curriculum.chapters.find(item => item.id === section);
    const tabs = [['start', '选股路线'], ['playbooks', '定时剧本'], ['screen', '筛选试算'], ['history', '真实 K 线']];
    host.innerHTML = `<div class="ashare-page">
      <header class="a-header"><div><span class="a-kicker">A-SHARE FIELD NOTES · 沪 / 深</span><h1>选股，先把条件说清楚。</h1><p>从可观察的数据，走到可复现的筛选规则。<br>不是猜谁在买，而是知道为什么入选、为什么淘汰。</p></div><aside><b>研究状态</b><span>规则可计算 · 效果待验证</span><small>历史案例为静态快照<br>未接入实时全市场行情，不生成当前荐股</small></aside></header>
      <nav class="a-tabs" aria-label="沪深选股导航">${tabs.map(([id, title]) => `<a class="${section === id ? 'active' : ''}" href="#ashare/${id}">${title}</a>`).join('')}<a class="${chapter ? 'active' : ''}" href="#ashare/${e(curriculum.chapters[0].id)}">详细教材 · ${curriculum.chapters.length} 章</a></nav>
      <div class="a-content" id="ashare-content">${section === 'history' ? historyShell(history) : section === 'screen' ? screenShell() : section === 'playbooks' ? playbooksPage(curriculum) : chapter ? chapterPage(chapter, curriculum) : startPage(curriculum)}</div>
    </div>`;
    if (section === 'history') bindHistory(host, history);
    if (section === 'screen') bindScreen(host);
    if (chapter) host.querySelector('.a-reading-nav details').addEventListener('toggle', event => host.querySelector('.a-reading-layout')?.classList.toggle('index-collapsed', !event.target.open));
    window.scrollTo({ top: 0, behavior: 'instant' });
  } catch (error) { if (location.hash === route) host.innerHTML = `<div class="a-loading">${e(error.message)}</div>`; }
}

function startPage(curriculum) {
  return `<section class="a-intro"><span class="a-kicker">01 / THE SELECTION QUESTION</span><h2>“明确的信号”，究竟明确在哪里？</h2><p>机器可以明确判断一只股票是否满足条件，却不能因此保证它接下来上涨。选股是在某一时刻，从一个预先固定的股票池里筛出值得进一步研究的对象；择时决定何时下单，仓位与退出规则决定风险。三件事不能混为一谈。</p><p>例如“早盘资金很强”无法直接编程；“9:30–9:35 成交额达到过去 20 个交易日同一窗口中位数的 2 倍，9:35 最新价高于昨日最高价，且板块站上各自成交均价的股票占比 ≥60%”就可以复现。这里的 2 倍、60% 是待验证的研究起点，并非市场通用的盈利门槛。</p></section>
    <ol class="a-pipeline" aria-label="选股依赖关系"><li><small>01 · 范围</small><b>盘前锁定股票池</b><span>沪深 A 股 → 区分板块 → 排除不可研究标的</span></li><li><small>02 · 证据</small><b>只用截止时刻数据</b><span>同期成交额 + 价格位置 + 板块广度</span></li><li><small>03 · 筛选</small><b>逐项通过，才列候选</b><span>缺失不等于零；活跃不等于看多</span></li><li><small>04 · 验证</small><b>验证可交易的净收益</b><span>次日可卖 + 真实成本 + 样本外对照</span></li></ol>
    <section class="a-two-col"><article><span class="a-kicker">你能做什么</span><h2>先学一套，再验证一套。</h2><p>先读股票池与字段口径，再看四种定时剧本。筛选试算把一个 <b>9:35 突破昨高基础版</b> 实现为可调规则；输入相同快照，就得到相同结果与淘汰理由。</p><a class="a-button" href="#ashare/screen">打开筛选试算 →</a></article><article><span class="a-kicker">真实图能回答什么</span><h2>放量上涨，与放量失败。</h2><p>三只沪深股票的真实日线，保留开盘、最高、最低、收盘和成交量。按开始、中间、最后逐步揭示；不使用事后的全日量去假装预测当天早盘。</p><a class="a-button" href="#ashare/history">逐根读真实 K 线 →</a></article></section>
    <section class="a-chapter-list"><span class="a-kicker">READING PATH · 深度教材</span>${curriculum.chapters.map((item, index) => `<a href="#ashare/${e(item.id)}"><span>${String(index + 1).padStart(2, '0')}</span><div><h3>${e(item.title)}</h3><p>${e(item.intro)}</p></div><b>↗</b></a>`).join('')}</section>`;
}

function chapterPage(chapter, curriculum) {
  return `<div class="a-reading-layout"><aside class="a-reading-nav"><details open><summary>本章目录 · 点击收起</summary>${chapter.sections.map((item, i) => `<a href="#a-section-${i}" data-scroll-section="a-section-${i}">${String(i + 1).padStart(2, '0')} ${e(item.title)}</a>`).join('')}</details><a href="#ashare/playbooks">接着读：选股剧本 →</a></aside><article class="a-prose"><header><span class="a-kicker">${e(chapter.kicker)}</span><h2>${e(chapter.title)}</h2><p class="a-lead">${e(chapter.intro)}</p></header>${chapter.sections.map((item, index) => `<section id="a-section-${index}"><span class="a-kicker">${String(index + 1).padStart(2, '0')}</span><h3>${e(item.title)}</h3>${p(item.paragraphs)}${item.formula ? `<pre class="a-formula">${e(item.formula)}</pre>` : ''}${item.example ? `<aside class="a-example"><b>算一遍 / 想一遍</b><p>${e(item.example)}</p></aside>` : ''}${item.warning ? `<p class="a-note">${e(item.warning)}</p>` : ''}</section>`).join('')}<section class="a-sources"><h3>核对资料</h3>${chapter.sources.map(item => external(item.url, item.title)).join('')}<p>规则核对日期：${e(curriculum.meta.checkedAt)}。具体证券状态、交易权限和执行规则以交易所及券商当日信息为准。</p></section><nav class="a-chapter-end">${curriculum.chapters.filter(item => item.id !== chapter.id).map(item => `<a href="#ashare/${e(item.id)}">${e(item.title)} →</a>`).join('')}</nav></article></div>`;
}

function playbooksPage(curriculum) {
  return `<section class="a-intro"><span class="a-kicker">02 / OBSERVE → FILTER → VALIDATE</span><h2>四种选股剧本，不是一条“必涨公式”。</h2><p>每个剧本都先固定观察时刻，再规定它能读取哪些数据。竞价产生观察名单；开盘后的成交和价格用于进一步筛选。阈值全部是可复现的教学设定，尚未进行沪深全市场回测。</p></section>${curriculum.playbooks.map((book, index) => `<article class="a-playbook"><header><span class="a-kicker">PLAYBOOK 0${index + 1}</span><h2>${e(book.title)}</h2><p class="a-clock">${e(book.time)}</p></header><div class="a-book-body"><p><b>股票池：</b>${e(book.universe)}</p><p><b>研究假设：</b>${e(book.hypothesis)}</p><table><thead><tr><th>观察什么</th><th>怎么算</th><th>示例门槛 / 理由</th></tr></thead><tbody>${book.conditions.map(item => `<tr><th>${e(metricLabels[item.metric] || item.metric)}</th><td><code>${e(item.formula)}</code></td><td><b>${e(item.threshold)}</b><p>${e(item.explanation)}</p></td></tr>`).join('')}</tbody></table><div class="a-two-col"><section><h3>哪些情况剔除？</h3><ul>${book.reject.map(text => `<li>${e(text)}</li>`).join('')}</ul></section><section><h3>怎样检验它？</h3><p>${e(book.validation)}</p></section></div><p><b>执行约束：</b>${e(book.execution)}</p><p class="a-note">${e(book.limitations)}</p></div></article>`).join('')}<a class="a-button" href="#ashare/screen">用快照试算 9:35 基础规则 →</a>`;
}

function screenShell() {
  return `<section class="a-intro"><span class="a-kicker">03 / REPRODUCIBLE SCREEN</span><h2>9:35 突破昨高 · 基础筛选试算</h2><p>所有条件同时成立才进入研究候选，不输出“上涨概率”，也不自动下单。默认输入是六条<b>虚构教学快照</b>，只演示算法。你可以导入按下方字段口径整理的真实快照，在本地浏览器中重新计算；数据不会上传。</p></section>
    <div class="a-data-state" id="screen-data-state"></div>
    <form class="a-rules" id="screen-rules"><label>沪深股票池<select name="board"><option value="main">仅沪深主板</option><option value="all">主板 + 创业板 + 科创板</option></select></label><label>同期成交额 ≥ 倍数<input name="amountRatio" type="number" min="0.1" step="0.1" value="${rules.amountRatio}" required></label><label>开盘缺口下限 %<input name="minGap" type="number" step="0.1" value="${rules.minGap}" required></label><label>开盘缺口上限 %<input name="maxGap" type="number" step="0.1" value="${rules.maxGap}" required></label><label>偏离 VWAP 上限 %<input name="maxVwapDistance" type="number" min="0" step="0.1" value="${rules.maxVwapDistance}" required></label><label>板块站上均价占比 ≥ %<input name="breadth" type="number" min="0" max="100" step="1" value="${rules.breadth}" required></label><button class="a-button" type="submit">重新筛选 →</button></form>
    <p class="a-note">这是独立的基础试算规则，不等同于剧本二的完整条件：尚未加入区间收盘位置、相对板块收益和报价容量校验。固定条件：上市满 60 个交易日、20 个有效同期样本、非 ST / 停牌 / 涨停 / 除权日，且最新价严格高于昨日最高价、不低于 VWAP。阈值示例不是优化结果，当前未计算成交排队、流动性容量和隔夜风险。</p>
    <div class="a-file-tools"><label class="a-button">导入 JSON 快照<input id="snapshot-file" type="file" accept=".json,application/json"></label><button id="snapshot-template">下载字段示例</button><button id="snapshot-reset">恢复教学数据</button><button id="snapshot-export">导出本次筛选记录</button></div><p id="screen-error" class="a-error" role="alert"></p><div id="screen-results" aria-live="polite"></div>
    <section class="a-prose a-wide"><h3>为何这样算，而不是只看“净流入”？</h3><p>成交额是已经成交的总金额。每笔成交同时有买家和卖家，不会凭空多出只有买入、没有卖出的成交。所谓净流入通常是数据商把成交按主动买卖方向分类后做差；算法、逐笔数据质量和订单大小门槛都影响结果。把大单称为“主力”，无法进一步确定真实账户是机构、游资还是散户。</p><p>本试算先选不依赖身份猜测的字段。以教学甲为例：5 分钟成交额 9000 万元，历史同期中位数 3000 万元，得到 3 倍；最新价 10.42 元高于昨日高点 10.30 元，并较 VWAP 高约 1.17%。这组数值只能说明“成交活跃、位置突破、追入距离尚在规则内”，不能证明买入后获利。</p>
      <h3>实时数据接入时，必须对齐的口径</h3><p>此页目前是<b>快照导入 + 本地规则计算</b>，不是实时全 A 股扫描器。接入行情后，需要按交易所日历在 9:35 冻结整张截面；迟到、断流、尚未收齐的股票标记为未知。只有授权的分钟历史和实时数据都齐全，才可以把演示升级为自动扫描。</p><details class="a-contract"><summary>展开数据字段与时间约定</summary><table><thead><tr><th>字段</th><th>含义与约束</th></tr></thead><tbody>
      <tr><td>provider / asOf / items</td><td>顶层来源、决策截止时刻、股票数组；asOf 必须为北京时间 09:35:00，股票的 asOf 必须相同。导出保留输入和阈值。</td></tr>
      <tr><td>code / name / board</td><td>证券主表中的沪深 A 股代码和名称；board 为 main / chinext / star。代码前缀仅做初步防错，不代替当日证券主表。</td></tr>
      <tr><td>isST / suspended / atLimitUp / exRightToday</td><td>截止时刻已知的 ST、停牌、涨停、当日除权除息状态，均需布尔值。示例保守地排除这四类；未知不通过。</td></tr>
      <tr><td>prevClose / yesterdayHigh / open / last</td><td>昨日收盘、昨日最高、今日正式开盘和截止 9:35 的最新成交价；单位元/股。不用复权价与原始价混算；遇除权日先剔除。</td></tr>
      <tr><td>amount5m / medianAmount5m20</td><td>今日 [9:30, 9:35) 连续竞价成交额及此前 20 个有效交易日同一窗口成交额的中位数，单位人民币元；排除 9:25 集合竞价，不含今天作为基准。</td></tr>
      <tr><td>vwap</td><td>同一 [9:30, 9:35) 窗口 Σ成交额 / Σ成交股数；元/股。不能用五根分钟收盘价的简单平均替代。量以“手”输入时须先乘 100。</td></tr>
      <tr><td>sectorBreadthPct</td><td>盘前锁定的行业分类里，截至 9:35 价格高于各自 VWAP 的可交易成分数 / 有有效价格及 VWAP 的可交易成分数 ×100；成员、分母与覆盖率由数据适配层核验。0–100，不是0–1。</td></tr>
      <tr><td>historySessions / listedSessions</td><td>基准有效样本数必须20；上市累计交易日不少于60。停牌日不当作零成交日压低基准。</td></tr>
      </tbody></table><p>输入方还需验证公告发布时间、板块成分的历史版本、数据延迟和证券资格。该导入器只校验结构、必填数值与规则，不证明来源可信或数据准确。</p></details>
      <h3>通过筛选之后，下一步不是立刻买入</h3><p>按所有历史交易日保存候选名单，用下一可成交价模拟买入，普通 A 股当日新买仓位最早次一交易日可卖。要和同日同板块未入选样本比较次日、三日净收益以及最大不利波动，并扣除佣金、卖出税费与滑点；涨停无法买入或跌停无法卖出的样本不能删除。观察胜率之外，还要看平均盈利 / 平均亏损、每笔期望值和尾部损失。只展示成功走势图不构成验证。</p>
    </section>`;
}

function bindScreen(host) {
  const form = host.querySelector('#screen-rules');
  form.elements.board.value = rules.board;
  const render = () => {
    const results = screenSnapshot(snapshot, rules);
    const count = results.filter(item => item.eligible).length;
    host.querySelector('#screen-data-state').innerHTML = `<b>${imported ? '导入快照 · 未验证数据源' : '教学模拟 · 非真实股票行情'}</b><span>${e(snapshot.asOf)} · ${e(snapshot.provider)}</span>`;
    host.querySelector('#screen-results').innerHTML = `<div class="a-result-count"><b>${count} / ${results.length}</b><span>通过规则的研究候选 · 不代表胜率或收益排名</span></div><table class="a-results"><thead><tr><th>标的 / 格式占位</th><th>同期额倍数</th><th>开盘缺口</th><th>突破昨高</th><th>距 VWAP</th><th>板块站上均价</th><th>筛选结论</th></tr></thead><tbody>${results.map(result => `<tr class="${result.eligible ? 'selected' : ''}"><th>${e(result.item.name || result.item.code)}<small>${e(result.item.code)} · ${e(result.item.board)}</small></th><td>${n(result.metrics?.amountRatio)}×</td><td>${n(result.metrics?.gap)}%</td><td>${n(result.metrics?.breakout)}%</td><td>${n(result.metrics?.vwapDistance)}%</td><td>${n(result.metrics?.breadth, 0)}%</td><td><b>${result.eligible ? '符合 · 待验证' : result.status === 'unknown' ? '数据不足／需核对' : '未通过'}</b>${result.reasons.map(reason => `<span>${e(reason)}</span>`).join('')}</td></tr>`).join('')}</tbody></table>`;
    host.querySelector('#screen-error').textContent = '';
  };
  render();
  form.addEventListener('submit', event => { event.preventDefault(); try { const values = new FormData(form); const next = Object.fromEntries([...values].map(([key, value]) => [key, key === 'board' ? value : Number(value)])); screenSnapshot(snapshot, next); rules = next; render(); } catch (error) { host.querySelector('#screen-error').textContent = error.message; } });
  host.querySelector('#snapshot-file').addEventListener('change', async event => {
    try { const file = event.target.files[0]; if (!file) return; if (file.size > 8000000) throw new Error('文件超过 8 MB，请缩小快照。'); const next = JSON.parse(await file.text()); screenSnapshot(next, rules); snapshot = next; imported = true; render(); } catch (error) { host.querySelector('#screen-error').textContent = `导入失败，保留原有数据：${error.message}`; } finally { event.target.value = ''; }
  });
  host.querySelector('#snapshot-template').addEventListener('click', () => download('ashare-snapshot-DEMO.json', JSON.stringify(demoSnapshot(), null, 2)));
  host.querySelector('#snapshot-reset').addEventListener('click', () => { snapshot = demoSnapshot(); imported = false; render(); });
  host.querySelector('#snapshot-export').addEventListener('click', () => download('ashare-screen-research.json', JSON.stringify({ kind: imported ? 'imported-unverified' : 'synthetic-demo', warning: '研究筛选结果，未经策略有效性验证，非当前荐股', rules, snapshot, results: screenSnapshot(snapshot, rules) }, null, 2)));
}

function historyShell(history) {
  return `<section class="a-intro"><span class="a-kicker">04 / REAL OHLCV · 数据不是手绘</span><h2>真实 K 线，逐日看证据变化。</h2><p>腾讯未复权日线 / 新浪财经交叉核对。仅用已揭示日期的 OHLCV 绘制蜡烛和成交量，不补画不存在的分时路径。先判断当时能知道什么，再打开之后的交易日。</p></section><div class="a-history-tools"><label>历史标的<select id="history-symbol">${history.series.map(series => `<option value="${e(series.id)}">${e(series.name)} · ${e(series.symbol)}</option>`).join('')}</select></label><span>日线 · 元/股 · 成交量：万手 · 不复权<br>红柱：收盘 ≥ 开盘；绿柱：收盘 &lt; 开盘</span><button id="history-download">下载此股 OHLCV（CSV）</button></div><div id="history-stage-buttons" class="a-stage-buttons"></div><section class="a-chart-panel"><div id="history-quote" class="a-quote" aria-live="polite"></div><div id="history-chart"></div><div class="a-replay-controls"><button id="history-prev">← 上一交易日</button><label>揭示到 <select id="history-cutoff"></select></label><button id="history-next">下一交易日 →</button><span>点击蜡烛查看该日数值</span></div></section><div id="history-analysis"></div><div id="history-sources" class="a-sources"></div><details class="a-contract"><summary>数据能说明什么、不能说明什么</summary><ul>${history.meta.limitations.map(text => `<li>${e(text)}</li>`).join('')}</ul></details>`;
}

function bindHistory(host, history) {
  let series = history.series[0];
  let cutoff = series.events[0].date;
  let selected = cutoff;
  const chart = host.querySelector('#history-chart');
  const stageDates = () => [series.events[0], series.events[Math.floor((series.events.length - 1) / 2)], series.events[series.events.length - 1]];
  const draw = () => {
    const bars = visibleHistory(series, cutoff);
    const selectedIndex = Math.max(0, bars.findIndex(bar => bar.time === selected));
    const bar = bars[selectedIndex];
    const facts = dailyFacts(bars, selectedIndex);
    host.querySelector('#history-quote').innerHTML = `<b>${e(series.name)} <span>${bar.time}</span></b><dl>${[['开', n(bar.open)], ['高', n(bar.high)], ['低', n(bar.low)], ['收', n(bar.close)], ['成交量', `${n(bar.volume / 10000)} 万手`], ['较昨收', `${n(facts.change)}%`]].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
    const width = Math.max(920, Math.floor(chart.clientWidth));
    const height = 460, left = 40, right = width - 90, top = 40, bottom = 315, volumeTop = 355, volumeBottom = 425;
    const low = Math.min(...bars.map(item => item.low));
    const high = Math.max(...bars.map(item => item.high));
    const pad = (high - low || high * .01) * .12;
    const y = price => bottom - (price - low + pad) / (high - low + pad * 2) * (bottom - top);
    const step = (right - left) / bars.length;
    const candleWidth = Math.min(22, step * .55);
    const maxVolume = Math.max(...bars.map(item => item.volume));
    const ticks = Array.from({ length: 5 }, (_, i) => low - pad + (high - low + 2 * pad) * i / 4);
    chart.innerHTML = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${e(series.name)}真实日 K 与成交量，截止${cutoff}，红涨绿跌"><title>${e(series.symbol)} / 腾讯与新浪日线核对 / 后续交易日隐藏</title>${ticks.map(value => `<line x1="${left}" x2="${right}" y1="${y(value)}" y2="${y(value)}" stroke="#30433f"/><text x="${right + 14}" y="${y(value) + 5}" fill="#bed0ca" font-size="14">${n(value)}</text>`).join('')}<text x="${left}" y="22" fill="#bdc8c3" font-size="14">已揭示 ${bars.length} 根日 K · 之后的价格与成交量均不绘制</text><line x1="${left}" x2="${right}" y1="${volumeBottom}" y2="${volumeBottom}" stroke="#476057"/><text x="${right + 14}" y="${volumeTop + 5}" fill="#bed0ca" font-size="13">${n(maxVolume / 10000, 0)}</text><text x="${right + 14}" y="${volumeTop + 24}" fill="#bed0ca" font-size="13">万手</text>${bars.map((item, index) => {
      const x = left + step * (index + .5), color = item.close >= item.open ? '#f17869' : '#55c8a3';
      const volumeHeight = maxVolume ? item.volume / maxVolume * (volumeBottom - volumeTop) : 0;
      return `<g data-bar-date="${item.time}" class="a-candle" tabindex="0" role="button" aria-label="${item.time} 开${item.open} 高${item.high} 低${item.low} 收${item.close}"><title>${item.time} · 点击查看数值</title><rect x="${x - step / 2}" y="${top}" width="${step}" height="${volumeBottom - top}" fill="${item.time === selected ? '#ffffff10' : 'transparent'}"/><line x1="${x}" x2="${x}" y1="${y(item.high)}" y2="${y(item.low)}" stroke="${color}" stroke-width="1.8"/><rect x="${x - candleWidth / 2}" y="${Math.min(y(item.open), y(item.close))}" width="${candleWidth}" height="${Math.max(1.5, Math.abs(y(item.open) - y(item.close)))}" fill="${color}"/><rect x="${x - candleWidth / 2}" y="${volumeBottom - volumeHeight}" width="${candleWidth}" height="${volumeHeight}" fill="${color}" opacity=".7"/>${index % Math.ceil(bars.length / 8) === 0 || index === bars.length - 1 ? `<text x="${x}" y="449" text-anchor="middle" fill="#bdc8c3" font-size="13">${item.time.slice(5)}</text>` : ''}</g>`;
    }).join('')}</svg>`;
    chart.querySelectorAll('[data-bar-date]').forEach(element => {
      const select = () => { selected = element.dataset.barDate; draw(); };
      element.addEventListener('click', select);
      element.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); select(); chart.querySelector(`[data-bar-date="${selected}"]`)?.focus(); } });
    });
    const event = series.events.find(item => item.date === bar.time);
    host.querySelector('#history-analysis').innerHTML = `<div class="a-history-facts"><article><small>成交强度 · 前五日为基准</small><b>${n(facts.relativeVolume)}×</b><p>当日量 ÷ 此前 5 个交易日平均量。必须等本日收盘，不是早盘的同期量比。</p></article><article><small>收盘在全天区间的位置</small><b>${n(facts.rangePosition, 1)}%</b><p>（收盘−最低）÷（最高−最低）。0% 在最低，100% 在最高；一字板不计算。</p></article><article><small>开盘相对昨收</small><b>${n(facts.gap)}%</b><p>开盘 ÷ 昨收 − 1。开盘缺口与本根蜡烛颜色是两个不同的比较基准。</p></article></div><article class="a-prose a-wide a-event"><span class="a-kicker">${bar.time} 收盘后可做的分析</span><h3>${e(event?.title || '先对照数值，再提出假设')}</h3><p>${e(event?.analysis || '比较开盘与收盘，确定实体方向；再看最高、最低与收盘的位置，最后结合此前成交量。未标注事件的交易日仍提供真实 OHLCV，但不追加没有数据支持的市场故事。')}</p>${bar.corporateAction ? `<p class="a-note">除权除息标记：${e(bar.corporateAction.FHcontent || '请核对公司行动公告')}。此处较昨收的算术变化不是交易所除息参考价口径，也不是含分红总收益。${event?.sourceUrl ? external(event.sourceUrl, '官方分红实施公告') : ''}</p>` : ''}<h4>把案例和选股规则连接起来</h4><p>这张图可以检查“放量是否伴随有效价格推进”，不能判断当日 9:35 是否入选。全日量、最高价与收盘价在早盘尚不可知。要验证开盘选股，须另取当时的分钟成交额、价格和完整股票池，运行相同规则，再观察次日实际可实现的结果。</p></article><details class="a-contract"><summary>查看当前已揭示的 ${bars.length} 根原始数值</summary><table><thead><tr><th>日期</th><th>开盘</th><th>最高</th><th>最低</th><th>收盘</th><th>量 / 手</th></tr></thead><tbody>${bars.map(item => `<tr><td>${item.time}</td><td>${n(item.open)}</td><td>${n(item.high)}</td><td>${n(item.low)}</td><td>${n(item.close)}</td><td>${item.volume}</td></tr>`).join('')}</tbody></table></details>`;
    host.querySelector('#history-prev').disabled = cutoff === series.bars[0].time;
    host.querySelector('#history-next').disabled = cutoff === series.bars[series.bars.length - 1].time;
    host.querySelector('#history-cutoff').value = cutoff;
    host.querySelector('#history-stage-buttons').innerHTML = stageDates().map((item, index) => `<button class="${cutoff === item.date ? 'active' : ''}" data-stage-date="${item.date}"><small>0${index + 1} · ${['开始', '中间', '最后'][index]}</small><b>${item.date}</b><span>只揭示到此日 →</span></button>`).join('');
    host.querySelectorAll('[data-stage-date]').forEach(button => button.addEventListener('click', () => { cutoff = selected = button.dataset.stageDate; draw(); }));
  };
  const loadSeries = () => {
    cutoff = selected = series.events[0].date;
    host.querySelector('#history-cutoff').innerHTML = series.bars.map(bar => `<option value="${bar.time}">${bar.time}</option>`).join('');
    const tvSymbol = `${series.symbol.startsWith('sh') ? 'SSE' : 'SZSE'}-${series.symbol.slice(2)}`;
    host.querySelector('#history-sources').innerHTML = `<h3>数据出处与复核</h3><p>${e(series.source.name)} · ${e(history.meta.provenance)}<br>采集时间：${e(history.meta.retrievedAt)}；复权方式：未复权。</p>${external(series.source.url, '主源：腾讯证券原始查询')}${(series.source.verificationUrls || []).map(url => external(url, '交叉核对：独立数据端点')).join('')}${external(`https://www.tradingview.com/symbols/${tvSymbol}/`, '在 TradingView 核对此证券')}<p>图形在本地按 OHLCV 绘制，没有转载第三方平台截图。公开端点可能失效；仓库保留本次原始响应和 SHA-256 校验值。</p><code>${e(series.source.sha256)}</code>`;
    draw();
  };
  host.querySelector('#history-symbol').addEventListener('change', event => { series = history.series.find(item => item.id === event.target.value); loadSeries(); });
  host.querySelector('#history-cutoff').addEventListener('change', event => { cutoff = selected = event.target.value; draw(); });
  for (const [id, direction] of [['history-prev', -1], ['history-next', 1]]) host.querySelector(`#${id}`).addEventListener('click', () => { const index = series.bars.findIndex(bar => bar.time === cutoff) + direction; if (series.bars[index]) { cutoff = selected = series.bars[index].time; draw(); } });
  host.querySelector('#history-download').addEventListener('click', () => download(`${series.symbol}-visible-through-${cutoff}.csv`, '\uFEFFdate,open,high,low,close,volume_lots\n' + visibleHistory(series, cutoff).map(bar => [bar.time, bar.open, bar.high, bar.low, bar.close, bar.volume].join(',')).join('\n'), 'text/csv;charset=utf-8'));
  loadSeries();
  chartObserver = new ResizeObserver(() => { if (chart.isConnected) draw(); else chartObserver.disconnect(); });
  chartObserver.observe(chart);
}

// Use local section scrolling without changing the SPA route.
document.addEventListener('click', event => {
  const link = event.target.closest('[data-scroll-section]');
  if (link) { event.preventDefault(); document.getElementById(link.dataset.scrollSection)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});
