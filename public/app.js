const app = document.querySelector('#app');
const nav = document.querySelector('.main-nav');
const menuToggle = document.querySelector('#menu-toggle');
const toastRegion = document.querySelector('#toast-region');
const beginnerModeButton = document.querySelector('#beginner-mode');

function savedBeginnerMode() {
  try { return localStorage.getItem('structure-flow-beginner') !== 'off'; }
  catch { return true; }
}

function savedSidebarCollapsed() {
  try { return localStorage.getItem('structure-flow-course-sidebar') === 'collapsed'; }
  catch { return false; }
}

const state = {
  content: null,
  beginner: { meta: {}, guides: {} },
  glossaryDetails: { meta: {}, details: {} },
  lessonDepth: { meta: {}, lessons: {} },
  textbookChapters: { meta: {}, chapters: {} },
  casebook: { meta: {}, cases: [] },
  sources: [],
  progress: { completedLessons: [], quizResults: {} },
  updates: { candidates: [], snapshots: {} },
  glossaryFilter: 'all',
  glossarySearch: '',
  beginnerMode: savedBeginnerMode(),
  sidebarCollapsed: savedSidebarCollapsed(),
  caseLab: { caseId: null, stage: 0, reveal: false, layers: { structure: true, liquidity: true, zones: true, flow: true } }
};

const html = String.raw;

const caseVisualPatterns = {
  up: [24, 31, 28, 38, 35, 48, 45, 59, 56, 70, 67, 82],
  down: [82, 75, 78, 66, 69, 57, 60, 47, 51, 39, 42, 28],
  sweepUp: [48, 43, 39, 25, 46, 55, 52, 65, 61, 75, 72, 84],
  sweepDown: [58, 64, 70, 86, 65, 56, 60, 46, 50, 37, 40, 28],
  acceptUp: [28, 34, 39, 51, 57, 64, 61, 69, 66, 75, 73, 80],
  acceptDown: [80, 74, 67, 56, 49, 42, 45, 36, 39, 30, 33, 24],
  falseUp: [30, 36, 43, 55, 68, 80, 66, 55, 48, 40, 34, 29],
  falseDown: [78, 70, 62, 49, 34, 20, 37, 50, 58, 67, 73, 79],
  range: [43, 56, 47, 61, 52, 65, 49, 58, 45, 62, 51, 57],
  conflict: [46, 58, 43, 64, 49, 60, 45, 63, 48, 57, 44, 54],
  spike: [49, 47, 45, 18, 76, 51, 48, 54, 50, 52, 49, 51],
  retestUp: [28, 38, 49, 62, 75, 68, 57, 48, 60, 69, 78, 86],
  retestDown: [82, 72, 61, 48, 35, 42, 53, 62, 50, 41, 33, 24],
  decay: [32, 45, 56, 50, 60, 53, 61, 55, 59, 50, 43, 34],
  absorbUp: [52, 45, 37, 29, 28, 30, 32, 45, 58, 66, 74, 81],
  absorbDown: [48, 56, 65, 73, 74, 72, 69, 57, 46, 38, 31, 24],
  exposure: [78, 70, 61, 53, 44, 35, 29, 24, 21, 18, 16, 15]
};

const caseVisualProfiles = {
  'candle-language': { family: 'PRICE / OHLC', band: '父级观察区', evidence: '实体与影线路径', micro: ['sweepUp', 'spike'] },
  'timeframe-layers': { family: 'MULTI-TIMEFRAME', band: '父级结构', evidence: '低周期路径', micro: ['down', 'conflict'] },
  'order-basics': { family: 'EXECUTION', band: '可成交队列', evidence: '深度与滑点', micro: ['range', 'down'] },
  'data-provenance': { family: 'DATA PROVENANCE', band: '证据边界', evidence: '来源可比性', micro: ['absorbUp', 'conflict'] },
  'risk-r': { family: 'RISK / EXPECTANCY', band: '1R 风险带', evidence: '盈亏贡献', micro: ['up', 'falseUp'] },
  'session-context': { family: 'SESSION PATH', band: '时段边界', evidence: 'ETH / RTH 状态', micro: ['sweepUp', 'conflict'] },
  'martingale-grid': { family: 'EXPOSURE PATH', band: '网格范围', evidence: '累计仓位', micro: ['range', 'exposure'] },
  'smc-map': { family: 'SMC MAP', band: '父级 POI', evidence: '位置与触发', micro: ['retestUp', 'conflict'] },
  'structure-language': { family: 'MARKET STRUCTURE', band: '受保护摆动', evidence: 'BOS / CHoCH', micro: ['up', 'conflict'], textbook: ['down', 'spike', 'conflict'] },
  'liquidity-map': { family: 'LIQUIDITY PATH', band: '外侧流动性', evidence: 'Sweep / Acceptance', micro: ['sweepUp', 'acceptUp'], textbook: ['sweepDown', 'acceptUp', 'conflict'] },
  'pd-arrays': { family: 'ZONE LIFECYCLE', band: 'OB / FVG 区域', evidence: '回访与失效', micro: ['retestUp', 'decay'], textbook: ['retestUp', 'range', 'conflict'] },
  'hybrid-workflow': { family: 'TOP-DOWN FLOW', band: '主时段 POI', evidence: '方向 / 位置 / 时序', micro: ['retestUp', 'conflict'] },
  'liquidity-nesting': { family: 'NESTED LIQUIDITY', band: '父级区间', evidence: '内部 → 外部', micro: ['sweepUp', 'acceptUp'] },
  'dealing-range': { family: 'DEALING RANGE', band: 'Premium / Discount', evidence: '锚点与 EQ', micro: ['retestUp', 'conflict'] },
  'auction-engine': { family: 'AUCTION / DEPTH', band: 'Bid / Ask 队列', evidence: '成交与价格冲击', micro: ['up', 'absorbUp'] },
  'footprint-reading': { family: 'FOOTPRINT', band: '关键价格行', evidence: 'Bid × Ask 不平衡', micro: ['up', 'absorbDown'] },
  'delta-context': { family: 'DELTA / PRICE', band: '结构边界', evidence: 'Delta 与价格进展', micro: ['absorbUp', 'acceptUp'] },
  'confluence-lab': { family: 'CONFLUENCE GATE', band: '预设执行区', evidence: 'Flow 与净风险', micro: ['absorbUp', 'down'], textbook: ['absorbUp', 'absorbDown', 'down'] },
  'volume-profile': { family: 'VOLUME PROFILE', band: 'Value Area', evidence: 'POC / 价值迁移', micro: ['range', 'acceptDown'], textbook: ['acceptUp', 'falseUp', 'conflict'] },
  'footprint-auctions': { family: 'AUCTION EXTREME', band: '拍卖极值', evidence: 'Excess / Imbalance', micro: ['sweepUp', 'down'] },
  'dom-dynamics': { family: 'DOM EVENTS', band: '盘口关键档', evidence: '补单 / 撤单 / 成交', micro: ['absorbUp', 'conflict'] }
};

const glossaryLessonGroups = {
  'candle-language': ['Candlestick', 'OHLC'],
  'timeframe-layers': ['Timeframe'],
  'order-basics': ['Ask', 'Bid', 'Limit Order', 'Market Order', 'Slippage', 'Spread'],
  'data-provenance': ['Tick Volume'],
  'risk-r': ['Break-even Win Rate', 'Expectancy', 'Maximum Drawdown', 'Profit Factor', 'R Multiple', 'Risk/Reward Ratio', 'Stop Price'],
  'session-context': ['ETH', 'RTH', 'Trading Day'],
  'martingale-grid': ['Average Entry', 'Grid Trading', 'Margin Exhaustion', 'Martingale', 'Tail Risk'],
  'structure-language': ['BOS', 'CHoCH', 'MSS'],
  'liquidity-map': ['BSL', 'Liquidity Sweep', 'SSL'],
  'pd-arrays': ['Breaker Block', 'Displacement', 'FVG', 'Order Block', 'POI'],
  'hybrid-workflow': ['Kill Zone'],
  'liquidity-nesting': ['External Liquidity', 'Inducement', 'Internal Liquidity'],
  'dealing-range': ['Dealing Range', 'Discount', 'Equilibrium', 'Premium'],
  'auction-engine': ['Aggressor'],
  'footprint-reading': ['Footprint', 'VPOC'],
  'delta-context': ['Absorption', 'CVD', 'Delta'],
  'volume-profile': ['HVN', 'LVN', 'VAH / VAL', 'Value Area'],
  'footprint-auctions': ['Excess', 'Imbalance', 'Stacked Imbalance', 'Unfinished Auction'],
  'dom-dynamics': ['DOM', 'Pulling / Stacking', 'Replenishment', 'Spoofing']
};

const glossaryLessonIds = new Map(
  Object.entries(glossaryLessonGroups).flatMap(([lessonId, terms]) => terms.map((term) => [term, lessonId]))
);

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function formatDate(value, includeTime = false) {
  if (!value) return '尚未运行';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '未知';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(date);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `请求失败 (${response.status})`);
  return payload;
}

function toast(message, type = 'ok') {
  const element = document.createElement('div');
  element.className = `toast ${type === 'error' ? 'error' : ''}`;
  element.textContent = message;
  toastRegion.append(element);
  setTimeout(() => element.remove(), 3800);
}

function completedSet() {
  return new Set(state.progress.completedLessons || []);
}

function progressPercent() {
  const total = state.content?.lessons.length || 1;
  return Math.round((completedSet().size / total) * 100);
}

function updateHeaderProgress() {
  const percent = progressPercent();
  document.querySelector('#header-progress').textContent = `${percent}%`;
  document.querySelector('#header-progress-ring').style.setProperty('--progress', `${percent}%`);
}

function updateBeginnerToggle() {
  beginnerModeButton.classList.toggle('active', state.beginnerMode);
  beginnerModeButton.setAttribute('aria-pressed', String(state.beginnerMode));
  beginnerModeButton.querySelector('small').textContent = state.beginnerMode ? '白话解释开启' : '专业阅读模式';
}

function toggleBeginnerMode() {
  state.beginnerMode = !state.beginnerMode;
  try { localStorage.setItem('structure-flow-beginner', state.beginnerMode ? 'on' : 'off'); } catch {}
  updateBeginnerToggle();
  toast(state.beginnerMode ? '新手翻译层已开启。' : '已切换为精简专业阅读。');
  route();
}

function toggleCourseSidebar() {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  try { localStorage.setItem('structure-flow-course-sidebar', state.sidebarCollapsed ? 'collapsed' : 'expanded'); } catch {}
  const layout = document.querySelector('.course-layout');
  const button = document.querySelector('#course-sidebar-toggle');
  if (!layout || !button) return;
  layout.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
  button.setAttribute('aria-expanded', String(!state.sidebarCollapsed));
  button.querySelector('span').textContent = state.sidebarCollapsed ? '展开课程目录' : '收起课程目录';
  button.querySelector('i').textContent = state.sidebarCollapsed ? '→' : '←';
  toast(state.sidebarCollapsed ? '已进入专注阅读，课程目录会保持收起。' : '课程目录已展开。');
}

function route() {
  const raw = location.hash.replace(/^#/, '') || 'home';
  const [name, id] = raw.split('/');
  document.querySelectorAll('.main-nav a').forEach((link) => {
    link.classList.toggle('active', link.dataset.route === (name === 'lesson' ? 'course' : name));
  });
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  if (name === 'course') return renderCourse(findNextLesson()?.id);
  if (name === 'lesson') return renderCourse(id);
  if (name === 'cases') return renderCases();
  if (name === 'case') return renderCaseLab(id);
  if (name === 'glossary') return renderGlossary();
  if (name === 'updates') return renderUpdates();
  return renderHome();
}

function findNextLesson() {
  const done = completedSet();
  return state.content.lessons.find((lesson) => !done.has(lesson.id)) || state.content.lessons[0];
}

function sourceById(id) {
  return state.sources.find((source) => source.id === id);
}

function renderHome() {
  const { content, sources } = state;
  const nextLesson = findNextLesson();
  const done = completedSet().size;
  const textbookCases = Object.values(state.textbookChapters.chapters || {}).reduce((total, chapter) => total + chapter.cases.length, 0);
  app.innerHTML = html`
    <div class="page-shell">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">LOCAL LEARNING FIELD MANUAL · ${escapeHtml(content.meta.version)}</p>
          <h1 class="display-title" id="hero-title">
            <span class="hero-title-line">读懂<em>结构</em></span>
            <span class="hero-title-line">看见成交</span>
          </h1>
          <div class="hero-intro">
            <span class="folio">00—A</span>
            <p>先学 K 线、周期、撮合与风险，再用 SMC / ICT 建立假设，最后让 Order Flow 检查成交证据。三层路径，一份可证伪的观察记录。</p>
          </div>
          <div class="hero-actions">
            <a class="primary-button" href="#lesson/${escapeHtml(nextLesson.id)}">${done ? '继续学习' : '开始第一课'} <span>→</span></a>
            <a class="secondary-button" href="#glossary">打开术语地图</a>
          </div>
        </div>
        <div class="hero-board" aria-label="结构与成交示意图">
          <div class="board-head"><span>CASE STUDY · SIMULATED</span><span class="live-dot">LEARNING MODE</span></div>
          <div class="market-sketch">
            ${marketSketchSvg()}
          </div>
          <div class="board-caption">
            <p>结构指出观察地点；成交只回答此刻谁在主动，以及价格是否响应。</p>
            <div><strong>${progressPercent()}%</strong><small>COURSE COMPLETION</small></div>
          </div>
        </div>
      </section>

      <section class="stats-strip" aria-label="课程统计">
        <div class="stat"><strong>${content.lessons.length}</strong><span>结构化学习单元</span></div>
        <div class="stat"><strong>${(state.lessonDepth.meta.caseCount || 0) + textbookCases}+${state.casebook.cases.length}</strong><span>课内案例 + 推演档案</span></div>
        <div class="stat"><strong>${content.glossary.length}</strong><span>核心术语</span></div>
        <div class="stat"><strong>${sources.length}</strong><span>持续检查来源</span></div>
      </section>

      <section class="manifesto">
        <div class="manifesto-aside">
          <span class="index">≠</span>
          <p>形状不等于证据。术语不等于机制。一次漂亮截图，更不等于可重复的交易系统。</p>
        </div>
        <div class="manifesto-copy">
          <h2>最重要的能力不是预测下一根 K 线，而是知道<em>什么事实会证明自己错了</em>。</h2>
        </div>
      </section>

      <section class="learning-path" aria-labelledby="path-title">
        <div class="path-intro">
          <p class="eyebrow">ZERO TO CASE / 3 LAYERS</p>
          <h2 id="path-title">从零开始，<br>按顺序拆开市场。</h2>
          <p>不用先认识 BOS 或 Delta。每一层只回答一个新问题，上一层会成为下一层的词典。</p>
        </div>
        <div class="path-steps">
          <a href="#lesson/candle-language"><span>00</span><small>FOUNDATION</small><h3>市场在说什么？</h3><p>K 线、周期、Bid/Ask、时段、数据血统、1R 与仓位路径</p><i>先修 · 7 课 →</i></a>
          <a href="#lesson/smc-map"><span>01</span><small>FRAMEWORK</small><h3>我该在哪里观察？</h3><p>结构、嵌套流动性、Dealing Range、OB 与 FVG</p><i>框架 · 7 课 →</i></a>
          <a href="#lesson/auction-engine"><span>02</span><small>EVIDENCE</small><h3>成交是否支持假设？</h3><p>撮合、Footprint、Profile、DOM、Delta 与吸收</p><i>证据 · 7 课 →</i></a>
        </div>
      </section>

      <section class="tracks-section">
        <div class="section-heading">
          <div><p class="eyebrow">THREE LAYERS / ONE PROCESS</p><h2>三层学习轨道</h2></div>
          <p>从共同语言进入价格叙事，再把叙事交给成交证据审问。每课都有失效条件、常见误读与小测。</p>
        </div>
        <div class="track-grid">
          ${content.tracks.map((track) => html`
            <a class="track-card ${track.id}" href="#lesson/${escapeHtml(track.lessonIds[0])}" data-number="${escapeHtml(track.number)}">
              <div class="card-top"><span>${escapeHtml(track.eyebrow)}</span><span>${track.lessonIds.length} LESSONS</span></div>
              <span class="arrow">→</span>
              <h3>${escapeHtml(track.title)}</h3>
              <p>${escapeHtml(track.description)}</p>
            </a>
          `).join('')}
        </div>
      </section>

      <section class="case-teaser">
        <div class="case-teaser-copy">
          <p class="eyebrow">CASE LAB / SIMULATED TAPE</p>
          <h2>别看答案，<br><em>先看证据。</em></h2>
          <p>六个模拟市场案例会逐段揭示价格、结构、流动性与成交。每一步都先让你判断，再显示事实、推断、失效与决策。</p>
          <a class="primary-button" href="#cases">进入结构案例室 →</a>
        </div>
        <div class="case-teaser-stack" aria-hidden="true">
          ${state.casebook.cases.slice(0, 3).map((caseItem, index) => `<div class="teaser-sheet" style="--i:${index}"><small>${escapeHtml(caseItem.number)}</small><b>${escapeHtml(caseItem.title)}</b><span>${escapeHtml(caseItem.outcome)}</span></div>`).join('')}
        </div>
      </section>

      <section class="source-band">
        <div class="section-heading">
          <div><p class="eyebrow">SOURCE LEDGER</p><h2>资料不是黑箱</h2></div>
          <p>课程是对来源的中文整理与批判性综合，不复制推广内容，也不把社区脚本当成效果证明。</p>
        </div>
        <div class="source-list">
          ${sources.map((source, index) => html`
            <a class="source-row" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">
              <span>${String(index + 1).padStart(2, '0')}</span>
              <span><b>${escapeHtml(source.title)}</b><small>${escapeHtml(new URL(source.url).hostname)}</small></span>
              <i>↗</i>
            </a>
          `).join('')}
        </div>
      </section>
    </div>
  `;
  scrollToTop();
}

function marketSketchSvg() {
  return html`
    <svg viewBox="0 0 520 500" role="img" aria-label="价格扫取流动性后回到观察区域，并显示成交量差柱状图">
      <g class="sketch-grid">
        ${[60,120,180,240,300,360,420,480].map((x) => `<line x1="${x}" y1="20" x2="${x}" y2="470"/>`).join('')}
        ${[60,120,180,240,300,360,420].map((y) => `<line x1="20" y1="${y}" x2="500" y2="${y}"/>`).join('')}
      </g>
      <line class="sketch-liquidity" x1="36" y1="130" x2="485" y2="130"/>
      <text class="sketch-label" x="36" y="118">BUY-SIDE LIQUIDITY</text>
      <rect class="sketch-zone" x="250" y="258" width="178" height="76" rx="2"/>
      <text class="sketch-label" x="262" y="284">POINT OF INTEREST</text>
      <text class="sketch-note" x="262" y="304">等待成交响应，而非盲目挂单</text>
      <polyline class="sketch-path" points="30,368 82,330 118,342 168,270 210,286 252,210 294,226 338,150 364,105 392,142 420,250 448,280 487,238"/>
      <circle cx="364" cy="105" r="6" fill="#d5f43c"/>
      <text class="sketch-label" x="380" y="98">SWEEP</text>
      <g class="delta-bars" transform="translate(48 420)">
        <rect x="0" y="-25" width="18" height="25"/><rect x="25" y="-48" width="18" height="48"/>
        <rect x="50" y="0" width="18" height="27"/><rect x="75" y="0" width="18" height="42"/>
        <rect x="100" y="-18" width="18" height="18"/><rect x="125" y="-34" width="18" height="34"/>
      </g>
      <text class="sketch-note" x="48" y="482">DELTA RESPONSE</text>
    </svg>
  `;
}

function renderCourse(lessonId) {
  const lesson = state.content.lessons.find((item) => item.id === lessonId) || state.content.lessons[0];
  const complete = completedSet();
  const track = state.content.tracks.find((item) => item.id === lesson.track);
  const depth = state.lessonDepth.lessons?.[lesson.id];
  const textbook = state.textbookChapters.chapters?.[lesson.id];
  const addedMinutes = (state.lessonDepth.meta?.addedMinutesPerLesson || 0) + (textbook?.readingTime || 0);
  const lessonCaseCount = (depth?.cases.length || 0) + (textbook?.cases.length || 0);
  const lessonSourceCount = new Set([
    ...lesson.sourceIds,
    ...(textbook?.sources || []).map((item) => item.sourceId)
  ]).size;
  app.innerHTML = html`
    <div class="page-shell">
      <div class="course-layout ${state.sidebarCollapsed ? 'sidebar-collapsed' : ''}">
        <aside class="course-sidebar" id="course-sidebar" aria-label="课程目录">
          <div class="sidebar-label">COURSE INDEX · ${complete.size}/${state.content.lessons.length} COMPLETE</div>
          ${state.content.tracks.map((trackItem) => html`
            <div class="sidebar-track ${trackItem.id}">${escapeHtml(trackItem.eyebrow)}</div>
            <div class="lesson-nav">
              ${trackItem.lessonIds.map((id) => {
                const item = state.content.lessons.find((candidate) => candidate.id === id);
                return html`
                  <button type="button" data-lesson-id="${escapeHtml(item.id)}" class="${item.id === lesson.id ? 'active' : ''} ${complete.has(item.id) ? 'completed' : ''}">
                    <span class="nav-number">${escapeHtml(item.number)}</span><b>${escapeHtml(item.title)}</b><span class="check" aria-label="${complete.has(item.id) ? '已完成' : '未完成'}"></span>
                  </button>`;
              }).join('')}
            </div>
          `).join('')}
        </aside>
        <article class="course-main ${state.beginnerMode ? 'beginner-reading' : ''}">
          <div class="lesson-focus-bar">
            <span>${state.sidebarCollapsed ? 'FOCUS MODE · 专注阅读' : 'COURSE INDEX · 课程导航'}</span>
            <button id="course-sidebar-toggle" type="button" aria-controls="course-sidebar" aria-expanded="${String(!state.sidebarCollapsed)}"><span>${state.sidebarCollapsed ? '展开课程目录' : '收起课程目录'}</span><i>${state.sidebarCollapsed ? '→' : '←'}</i></button>
          </div>
          <header class="lesson-hero" data-number="${escapeHtml(lesson.number)}">
            <div class="lesson-kicker"><span class="pill">${escapeHtml(lesson.level)}</span><span>${escapeHtml(track.eyebrow)}</span></div>
            <h1>${escapeHtml(lesson.title)}</h1>
            <p class="dek">${escapeHtml(lesson.dek)}</p>
            <div class="lesson-meta"><span>◷ ${lesson.duration + addedMinutes} MIN 深度学习</span><span>§ ${lesson.sections.length} NOTES</span><span>◇ ${lessonCaseCount} CASES</span><span>⌁ ${lessonSourceCount} SOURCES</span></div>
          </header>
          <div class="outcome-strip"><b>学完你可以</b><span>${escapeHtml(lesson.outcome)}</span></div>
          ${state.beginnerMode ? renderBeginnerGuide(lesson) : ''}
          <div class="lesson-body">
            ${renderTextbookChapter(lesson, textbook)}
            ${renderLessonDepth(lesson, depth)}
            ${lesson.sections.map((section, index) => renderLessonSection(section, index)).join('')}
            ${renderQuiz(lesson.quiz)}
            <div class="lesson-actions">
              <button class="complete-button ${complete.has(lesson.id) ? 'completed' : ''}" type="button" data-complete-lesson="${escapeHtml(lesson.id)}">
                ${complete.has(lesson.id) ? '✓ 已完成本课（点击撤销）' : '标记本课完成'}
              </button>
              ${renderNextLessonLink(lesson)}
            </div>
          </div>
        </article>
      </div>
    </div>
  `;

  document.querySelectorAll('[data-lesson-id]').forEach((button) => {
    button.addEventListener('click', () => { location.hash = `lesson/${button.dataset.lessonId}`; });
  });
  document.querySelector('#course-sidebar-toggle').addEventListener('click', toggleCourseSidebar);
  document.querySelector('[data-complete-lesson]').addEventListener('click', () => toggleLesson(lesson.id));
  bindQuiz(lesson.quiz);
  initializeDiagrams();
  scrollToTop();
}

function renderTextbookChapter(lesson, chapter) {
  if (!chapter) return '';
  const sourceItems = chapter.sources.map((item) => {
    const source = sourceById(item.sourceId);
    if (!source) return '';
    return html`<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer"><b>${escapeHtml(source.title)}</b><span>${escapeHtml(item.role)}</span><small>访问于 ${escapeHtml(item.accessedAt)} ↗</small></a></li>`;
  }).join('');
  return html`
    <section class="textbook-chapter" aria-label="${escapeHtml(lesson.title)}教材式理论章节">
      <header class="textbook-masthead">
        <div class="textbook-folio"><span>TEXTBOOK EXPANSION</span><b>DFS · ROUND ${String(chapter.round).padStart(2, '0')} / ${String(state.textbookChapters.meta.plannedRounds).padStart(2, '0')}</b></div>
        <div class="textbook-title"><small>CORE THEORY · ${chapter.readingTime} MIN</small><h2>${escapeHtml(chapter.title)}</h2><p>${escapeHtml(chapter.subtitle)}</p></div>
        <blockquote><span>本章问题</span><p>${escapeHtml(chapter.question)}</p></blockquote>
      </header>

      <nav class="textbook-roadmap" aria-label="本章目录">
        ${['问题导入', '定义', '机制', '模型', '算例', '证据', '三类案例', '练习'].map((item, index) => `<span><b>${String(index + 1).padStart(2, '0')}</b>${item}</span>`).join('')}
      </nav>

      <section class="textbook-prose textbook-opening">
        <div class="textbook-section-label"><span>01</span><b>问题导入</b><small>WHY THIS CONCEPT EXISTS</small></div>
        <div class="textbook-copy">${chapter.lead.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div>
      </section>

      <section class="textbook-prose">
        <div class="textbook-section-label"><span>02</span><b>${escapeHtml(chapter.definition.title)}</b><small>DEFINITION & DISTINCTION</small></div>
        <div class="textbook-copy">
          ${chapter.definition.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
          <aside class="definition-note"><small>${escapeHtml(chapter.definition.note.term)}</small><p>${escapeHtml(chapter.definition.note.body)}</p></aside>
          <div class="term-distinction-grid">${chapter.definition.distinctions.map((item) => `<article><b>${escapeHtml(item.term)}</b><p>${escapeHtml(item.meaning)}</p></article>`).join('')}</div>
        </div>
      </section>

      <section class="textbook-prose">
        <div class="textbook-section-label"><span>03</span><b>${escapeHtml(chapter.mechanism.title)}</b><small>CAUSAL MECHANISM</small></div>
        <div class="textbook-copy">
          ${chapter.mechanism.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
          <ol class="causal-chain">${chapter.mechanism.causalChain.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
        </div>
      </section>

      <section class="textbook-model">
        <header><span>04 · MODEL</span><h3>${escapeHtml(chapter.model.title)}</h3></header>
        <div class="model-copy">${chapter.model.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div>
        <details open><summary>模型假设 <i>展开 / 收起</i></summary><ul>${chapter.model.assumptions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></details>
        <div class="variable-ledger">
          <article><small>ENDOGENOUS · 模型内结果</small>${chapter.model.variables.endogenous.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</article>
          <article><small>EXOGENOUS · 外部冲击</small>${chapter.model.variables.exogenous.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</article>
          <article><small>PROXIES · 代理指标</small>${chapter.model.variables.proxies.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</article>
        </div>
        <p class="model-boundary"><b>模型边界</b>${escapeHtml(chapter.model.boundary)}</p>
      </section>

      <section class="worked-example">
        <header><span>05 · WORK IT OUT</span><h3>${escapeHtml(chapter.workedExample.title)}</h3><p>${escapeHtml(chapter.workedExample.setup)}</p></header>
        <div class="formula-slab"><small>FORMULA</small><code>${escapeHtml(chapter.workedExample.formula)}</code></div>
        <ol>${chapter.workedExample.steps.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
        <footer><b>如何解释</b><p>${escapeHtml(chapter.workedExample.interpretation)}</p></footer>
      </section>

      <section class="comparative-study">
        <header><span>06 · CET. PAR.</span><h3>改变一个条件，结论怎样移动？</h3><p>比较静态不是预测价格，而是强迫我们说清楚结论依赖什么。</p></header>
        <div>${chapter.comparativeScenarios.map((item, index) => `<article><small>SCENARIO ${String(index + 1).padStart(2, '0')}</small><h4>${escapeHtml(item.change)}</h4><b>${escapeHtml(item.effect)}</b><p>${escapeHtml(item.why)}</p></article>`).join('')}</div>
      </section>

      <section class="textbook-evidence">
        <header><span>07 · EVIDENCE LADDER</span><h3>${escapeHtml(chapter.evidence.title)}</h3></header>
        <div class="evidence-copy">${chapter.evidence.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div>
        <div class="evidence-table" role="table" aria-label="不同数据层级的能力与边界">
          ${chapter.evidence.levels.map((item) => `<article role="row"><b role="cell">${escapeHtml(item.level)}</b><p role="cell"><small>能说明</small>${escapeHtml(item.can)}</p><p role="cell"><small>不能说明</small>${escapeHtml(item.cannot)}</p></article>`).join('')}
        </div>
      </section>

      <section class="textbook-casebook">
        <header><span>08 · THREE-WAY CASEBOOK</span><h3>成立、失败、冲突：<br>三种结果都要会读</h3><p>${escapeHtml(state.textbookChapters.meta.caseData)}</p></header>
        ${chapter.cases.map((caseItem, index) => renderTextbookCase(caseItem, index, lesson.id)).join('')}
      </section>

      <section class="misconception-workshop">
        <header><span>09 · CLEAR IT UP</span><h3>常见误解，不只给结论</h3></header>
        <div>${chapter.misconceptions.map((item, index) => `<details ${index === 0 ? 'open' : ''}><summary><small>${String(index + 1).padStart(2, '0')}</small><b>${escapeHtml(item.claim)}</b><i>＋</i></summary><p>${escapeHtml(item.response)}</p></details>`).join('')}</div>
      </section>

      <section class="chapter-summary">
        <header><span>10 · CHAPTER CLOSE</span><h3>把逻辑重新走一遍</h3></header>
        <div>${chapter.summary.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div>
      </section>

      <section class="chapter-questions">
        <header><span>11 · QUESTIONS</span><h3>从记忆走向迁移</h3><p>先独立写答案，再展开对照。参考答案展示的是推理结构，不是唯一措辞。</p></header>
        <div>${chapter.questions.map((item, index) => `<details><summary><small>${escapeHtml(item.level)} · ${String(index + 1).padStart(2, '0')}</small><b>${escapeHtml(item.prompt)}</b><i>查看参考推理</i></summary><p>${escapeHtml(item.answer)}</p></details>`).join('')}</div>
      </section>

      <section class="knowledge-tree">
        <header><span>DFS KNOWLEDGE TREE</span><h3>本轮走到哪里，下一轮往哪深入</h3></header>
        <div class="tree-flow">
          <article><small>PREREQUISITES</small>${chapter.tree.prerequisites.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</article>
          <i>→</i><article class="current"><small>CURRENT NODE</small><b>${escapeHtml(chapter.tree.current)}</b></article>
          <i>→</i><article><small>DIRECT CHILDREN</small>${chapter.tree.children.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</article>
        </div>
        <p><b>NEXT BRANCH</b>${escapeHtml(chapter.tree.nextBranch)}</p>
      </section>

      <section class="textbook-sources">
        <header><span>SOURCE ROLES · 访问日期</span><p>教学结构来源与交易事实来源分开标注；框架词汇不冒充交易所字段。</p></header>
        <ol>${sourceItems}</ol>
      </section>
    </section>`;
}

function caseVisualOutcome(caseItem, index, scope) {
  const label = `${caseItem.type || ''} ${caseItem.title || ''}`;
  if (/冲突|无交易|不可证明|误区|失控/.test(label) || (scope === 'textbook' && index === 2)) return 'conflict';
  if (/失败|反例|衰减|风险放大|越界|尾部/.test(label) || (scope === 'textbook' && index === 1)) return 'failed';
  return 'valid';
}

function shortCaseLabel(value, max = 13) {
  const text = String(value || '').replace(/[，。；：,.]/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function renderCaseFigure(lessonId, caseItem, index, scope = 'micro') {
  const profile = caseVisualProfiles[lessonId] || { family: 'CASE PATH', band: '观察区域', evidence: '路径证据', micro: ['up', 'conflict'] };
  const patternName = (scope === 'textbook' ? profile.textbook : profile.micro)?.[index] || (index === 0 ? 'up' : index === 1 ? 'falseUp' : 'conflict');
  const values = caseVisualPatterns[patternName] || caseVisualPatterns.conflict;
  const outcome = caseVisualOutcome(caseItem, index, scope);
  const accent = outcome === 'valid' ? '#d5f43c' : outcome === 'failed' ? '#e04b32' : '#73b9d0';
  const xAt = (itemIndex) => 48 + itemIndex * 56;
  const yAt = (value) => 210 - value * 1.62;
  const points = values.map((value, itemIndex) => `${xAt(itemIndex)},${yAt(value).toFixed(1)}`).join(' ');
  const deltas = values.map((value, itemIndex) => {
    const previous = itemIndex ? values[itemIndex - 1] : value;
    const base = Math.max(-90, Math.min(90, (value - previous) * 7));
    if (patternName === 'absorbUp' && itemIndex < 7) return -Math.max(22, Math.abs(base));
    if (patternName === 'absorbDown' && itemIndex < 7) return Math.max(22, Math.abs(base));
    if (patternName === 'exposure') return -18 - itemIndex * 6;
    return base || (itemIndex % 2 ? 16 : -13);
  });
  const candles = values.map((value, itemIndex) => {
    const previous = itemIndex ? values[itemIndex - 1] : value - 4;
    const openY = yAt(previous);
    const closeY = yAt(value);
    const top = Math.min(openY, closeY);
    const height = Math.max(3, Math.abs(closeY - openY));
    const fill = value >= previous ? '#d5f43c' : '#e04b32';
    return `<g class="case-candle"><line x1="${xAt(itemIndex)}" y1="${Math.max(34, top - 7)}" x2="${xAt(itemIndex)}" y2="${Math.min(216, top + height + 7)}"></line><rect x="${xAt(itemIndex) - 4}" y="${top.toFixed(1)}" width="8" height="${height.toFixed(1)}" fill="${fill}"></rect></g>`;
  }).join('');
  const flowBars = deltas.map((delta, itemIndex) => {
    const height = Math.max(3, Math.abs(delta) * .28);
    const y = delta >= 0 ? 270 - height : 270;
    return `<rect x="${xAt(itemIndex) - 6}" y="${y.toFixed(1)}" width="12" height="${height.toFixed(1)}" fill="${delta >= 0 ? '#d5f43c' : '#e04b32'}"></rect>`;
  }).join('');
  const firstLabel = shortCaseLabel(caseItem.facts?.[0] || caseItem.setup || caseItem.background);
  const secondLabel = shortCaseLabel(caseItem.reasoning?.at(-1) || caseItem.decision);
  const title = `${caseItem.title}：${profile.family} 教学结构示意`;
  const caption = `图解目的：把“${caseItem.title}”的观察区、关键事件与结果顺序对应到一张图。`;
  return html`
    <figure class="case-instance-figure visual-${outcome}">
      <svg viewBox="0 0 720 300" role="img" aria-label="${escapeHtml(title)}">
        <title>${escapeHtml(title)}；结构示意，不是历史行情。</title>
        <rect class="case-plot-bg" x="0" y="0" width="720" height="300"></rect>
        <g class="case-plot-grid">
          <line x1="36" y1="62" x2="684" y2="62"></line><line x1="36" y1="108" x2="684" y2="108"></line><line x1="36" y1="154" x2="684" y2="154"></line><line x1="36" y1="200" x2="684" y2="200"></line>
          <line x1="148" y1="34" x2="148" y2="218"></line><line x1="316" y1="34" x2="316" y2="218"></line><line x1="484" y1="34" x2="484" y2="218"></line><line x1="652" y1="34" x2="652" y2="218"></line>
        </g>
        <text class="case-plot-kicker" x="36" y="25">${escapeHtml(profile.family)}</text>
        <text class="case-plot-state" x="684" y="25" text-anchor="end">${outcome === 'valid' ? 'CONSTRUCTIVE' : outcome === 'failed' ? 'FAILED / COUNTER' : 'CONFLICT / WAIT'}</text>
        <rect class="case-decision-band" x="36" y="102" width="648" height="44"></rect>
        <text class="case-band-label" x="48" y="119">${escapeHtml(profile.band)}</text>
        <line class="case-structure-line" x1="36" y1="124" x2="684" y2="124"></line>
        <g class="case-candles">${candles}</g>
        <polyline class="case-path-line" points="${points}" style="stroke:${accent}"></polyline>
        <g class="case-event event-a"><circle cx="${xAt(3)}" cy="${yAt(values[3]).toFixed(1)}" r="6"></circle><line x1="${xAt(3)}" y1="${yAt(values[3]).toFixed(1)}" x2="${xAt(3)}" y2="45"></line><text x="${xAt(3) + 8}" y="45">${escapeHtml(firstLabel)}</text></g>
        <g class="case-event event-b"><circle cx="${xAt(8)}" cy="${yAt(values[8]).toFixed(1)}" r="6"></circle><line x1="${xAt(8)}" y1="${yAt(values[8]).toFixed(1)}" x2="${xAt(8)}" y2="207"></line><text x="${xAt(8) + 8}" y="207">${escapeHtml(secondLabel)}</text></g>
        <line class="case-flow-baseline" x1="36" y1="270" x2="684" y2="270"></line>
        <text class="case-flow-label" x="36" y="292">${escapeHtml(profile.evidence)}</text>
        <g class="case-flow-bars">${flowBars}</g>
      </svg>
      <figcaption><b>${scope === 'textbook' ? 'CASE PLATE' : 'INSTANCE MAP'} · ${escapeHtml(profile.family)}</b><span>${escapeHtml(caption)}</span><small>能说明：本案例的路径、区域与证据先后。不能说明：真实市场曾出现、参与者身份或未来收益。</small></figcaption>
    </figure>`;
}

function renderTextbookCase(caseItem, index, lessonId) {
  return html`
    <article class="textbook-case case-${index + 1}">
      <header><span>CASE ${String(index + 1).padStart(2, '0')}</span><b>${escapeHtml(caseItem.type)}</b><h4>${escapeHtml(caseItem.title)}</h4><p>${escapeHtml(caseItem.background)}</p></header>
      ${renderCaseFigure(lessonId, caseItem, index, 'textbook')}
      <div class="textbook-case-grid">
        <section><small>可观察事实</small><ul>${caseItem.facts.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
        <section><small>逐步推理</small><ol>${caseItem.reasoning.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol></section>
      </div>
      <dl><div><dt>决策</dt><dd>${escapeHtml(caseItem.decision)}</dd></div><div><dt>失效</dt><dd>${escapeHtml(caseItem.invalidation)}</dd></div></dl>
      <footer><b>复盘</b><p>${escapeHtml(caseItem.review)}</p></footer>
    </article>`;
}

function lessonVocabulary(lesson, depth) {
  if (depth.vocabulary?.length) return depth.vocabulary;
  const lessonText = JSON.stringify({ title: lesson.title, dek: lesson.dek, tags: lesson.tags, depth }).toLocaleLowerCase();
  return (state.content.glossary || [])
    .filter((entry) => [entry.term, entry.alias]
      .filter(Boolean)
      .some((label) => lessonText.includes(label.toLocaleLowerCase())))
    .slice(0, 8)
    .map((entry) => {
      const aliasHasChinese = /[\u3400-\u9fff]/.test(entry.alias || '');
      return {
        term: aliasHasChinese ? entry.alias : entry.term,
        symbol: aliasHasChinese ? entry.term : (entry.alias || entry.term),
        definition: entry.definition,
        question: '先用这一定义约束标签，再回到图上寻找它对应的事实。'
      };
    });
}

function renderDepthVocabulary(lesson, depth) {
  const vocabulary = lessonVocabulary(lesson, depth);
  if (!vocabulary.length) return '';
  const lastRowStart = Math.floor((vocabulary.length - 1) / 4) * 4;
  return html`
    <section class="depth-vocabulary" aria-labelledby="depth-vocabulary-title">
      <header>
        <span>00 · WORDS BEFORE THEORY</span>
        <h3 id="depth-vocabulary-title">这一页先懂这些词</h3>
        <p>先看中文在图上指什么，再认识英文和缩写。英文只是标签，不是另一套概念。</p>
      </header>
      <div class="depth-vocabulary-grid terms-${Math.min(4, vocabulary.length)}">
        ${vocabulary.map((item, index) => html`
          <article class="${(index + 1) % 4 === 0 || index === vocabulary.length - 1 ? 'row-end' : ''} ${index >= lastRowStart ? 'last-row' : ''}">
            <small>${escapeHtml(item.symbol)}</small>
            <h4>${escapeHtml(item.term)}</h4>
            <p>${escapeHtml(item.definition)}</p>
            <b>${escapeHtml(item.question)}</b>
          </article>`).join('')}
      </div>
    </section>`;
}

function renderDepthWorkedExample(example) {
  if (!example || example.kind !== 'ohlc') return '';
  const values = example.values;
  return html`
    <section class="depth-worked-example" aria-labelledby="depth-example-title">
      <figure>
        <svg viewBox="0 0 420 300" role="img" aria-labelledby="depth-ohlc-title depth-ohlc-desc">
          <title id="depth-ohlc-title">开盘 100、最高 108、最低 97、收盘 106 的上涨 K 线</title>
          <desc id="depth-ohlc-desc">中央蜡烛实体从开盘价 100 上升到收盘价 106，上影线到最高价 108，下影线到最低价 97。</desc>
          <g class="ohlc-example-grid">
            <line x1="28" y1="46" x2="392" y2="46"/><line x1="28" y1="96" x2="392" y2="96"/>
            <line x1="28" y1="184" x2="392" y2="184"/><line x1="28" y1="238" x2="392" y2="238"/>
          </g>
          <g class="ohlc-example-candle">
            <line x1="210" y1="46" x2="210" y2="238"/>
            <rect x="168" y="96" width="84" height="88"/>
          </g>
          <g class="ohlc-example-labels">
            <text x="34" y="39">H · 最高价 ${escapeHtml(values.high)}</text>
            <text x="258" y="90">C · 收盘价 ${escapeHtml(values.close)}</text>
            <text x="258" y="178">O · 开盘价 ${escapeHtml(values.open)}</text>
            <text x="34" y="258">L · 最低价 ${escapeHtml(values.low)}</text>
          </g>
          <text class="ohlc-example-body-label" x="210" y="145" text-anchor="middle">实体</text>
          <text class="ohlc-example-wick-label" x="226" y="69">上影线</text>
          <text class="ohlc-example-wick-label" x="226" y="225">下影线</text>
        </svg>
        <figcaption>这是一张结构示意图；价格轴用于解释四个数字之间的关系。</figcaption>
      </figure>
      <div>
        <span>CONCRETE EXAMPLE · 具体例子</span>
        <h3 id="depth-example-title">${escapeHtml(example.title)}</h3>
        <div class="ohlc-number-strip" aria-label="OHLC 数值">
          <b>O ${escapeHtml(values.open)}</b><b>H ${escapeHtml(values.high)}</b><b>L ${escapeHtml(values.low)}</b><b>C ${escapeHtml(values.close)}</b>
        </div>
        <ol>${example.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
        <aside><b>这四个数字还不能告诉你</b><p>${escapeHtml(example.boundary)}</p></aside>
      </div>
    </section>`;
}

function renderMechanicPoint(point) {
  if (typeof point === 'string') return `<li>${escapeHtml(point)}</li>`;
  return html`<li class="explained-point"><b>${escapeHtml(point.label)}</b><span>${escapeHtml(point.detail)}</span></li>`;
}

function renderLessonDepth(lesson, depth) {
  if (!depth) return '';
  return html`
    <section class="lesson-depth" aria-label="${escapeHtml(lesson.title)}深度讲解与案例">
      <header class="depth-intro">
        <div><span>DEEP STUDY · 第二遍学习</span><h2>把概念走完，<br>再进入图表</h2></div>
        <div><p>${escapeHtml(depth.overview)}</p><small>本课新增 2 个机制章节 · 2 个对照案例 · 3 个独立练习</small></div>
      </header>
      ${renderDepthVocabulary(lesson, depth)}
      ${renderDepthWorkedExample(depth.workedExample)}
      <div class="mechanic-grid">
        ${depth.mechanics.map((chapter, index) => html`
          <article>
            <span>CHAPTER ${String(index + 1).padStart(2, '0')}</span>
            <h3>${escapeHtml(chapter.title)}</h3>
            <p>${escapeHtml(chapter.body)}</p>
            <ul>${chapter.points.map(renderMechanicPoint).join('')}</ul>
          </article>`).join('')}
      </div>
      <section class="microcase-book">
        <header><div><span>WORKED CASES · 教学模拟</span><h2>同一概念，<br>不同结果</h2></div><p>先读事实，再看推理。第二个案例有意安排失败、冲突或无交易，不把课程写成只会成功的图鉴。</p></header>
        <div class="microcase-grid">
          ${depth.cases.map((caseItem, index) => renderLessonMicrocase(caseItem, index, lesson.id)).join('')}
        </div>
        <p class="case-data-note">${escapeHtml(state.lessonDepth.meta.caseData)}</p>
      </section>
      <section class="depth-practice">
        <header><span>SELF PRACTICE · 不看答案</span><h2>轮到你自己判断</h2></header>
        <ol>${depth.practice.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
      </section>
    </section>`;
}

function renderLessonMicrocase(caseItem, index, lessonId) {
  return html`
    <article class="microcase-card">
      <header><span>CASE ${String(index + 1).padStart(2, '0')}</span><b>${escapeHtml(caseItem.type)}</b><h3>${escapeHtml(caseItem.title)}</h3><p>${escapeHtml(caseItem.setup)}</p></header>
      ${renderCaseFigure(lessonId, caseItem, index, 'micro')}
      <div class="case-reasoning">
        <section><small>01 · 可观察事实</small><ul>${caseItem.facts.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
        <section><small>02 · 推理链</small><ol>${caseItem.reasoning.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol></section>
      </div>
      <dl>
        <div><dt>03 · 决策</dt><dd>${escapeHtml(caseItem.decision)}</dd></div>
        <div><dt>04 · 失效</dt><dd>${escapeHtml(caseItem.invalidation)}</dd></div>
      </dl>
      <footer><span>NEWCOMER TAKEAWAY</span><p>${escapeHtml(caseItem.takeaway)}</p></footer>
    </article>`;
}

function renderBeginnerGuide(lesson) {
  const guide = state.beginner.guides?.[lesson.id];
  if (!guide) return '';
  return html`
    <section class="beginner-guide" aria-label="${escapeHtml(lesson.title)}的新手解释">
      <header><span>BEGINNER TRANSLATION</span><b>先用白话搭骨架，再进入专业定义</b></header>
      <div class="beginner-guide-grid">
        <article class="guide-plain"><small>一句白话</small><p>${escapeHtml(guide.plain)}</p></article>
        <article><small>生活类比</small><p>${escapeHtml(guide.analogy)}</p></article>
        <article class="guide-order"><small>读图顺序</small><ol>${guide.readOrder.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol></article>
        <article class="guide-misread"><small>最容易误解</small><p>${escapeHtml(guide.misconception)}</p><span>先修：${escapeHtml(guide.prerequisite)}</span></article>
      </div>
    </section>`;
}

function renderLessonSection(section, index) {
  return html`
    <section class="lesson-section kind-${escapeHtml(section.kind)}">
      <div class="section-index">NOTE ${String(index + 1).padStart(2, '0')}</div>
      <div class="section-content">
        <h2>${escapeHtml(section.title)}</h2>
        ${section.body ? `<p>${escapeHtml(section.body)}</p>` : ''}
        ${section.items ? `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
        ${section.diagram ? `<div class="diagram-host" data-diagram="${escapeHtml(section.diagram)}"></div>` : ''}
      </div>
    </section>
  `;
}

function renderQuiz(quiz) {
  const existing = state.progress.quizResults?.[quiz.id];
  return html`
    <section class="quiz-card" data-quiz="${escapeHtml(quiz.id)}">
      <p class="eyebrow">KNOWLEDGE CHECK ${existing ? '· 已作答' : ''}</p>
      <h2>${escapeHtml(quiz.question)}</h2>
      <div class="quiz-options">
        ${quiz.choices.map((choice, index) => `<button class="quiz-option" type="button" data-answer="${index}">${String.fromCharCode(65 + index)} · ${escapeHtml(choice)}</button>`).join('')}
      </div>
      <p class="quiz-feedback">选择一个答案，系统会解释原因。</p>
    </section>
  `;
}

function bindQuiz(quiz) {
  const card = document.querySelector(`[data-quiz="${quiz.id}"]`);
  card.querySelectorAll('[data-answer]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (card.dataset.answered) return;
      card.dataset.answered = 'true';
      const selected = Number(button.dataset.answer);
      const correct = selected === quiz.answer;
      card.querySelectorAll('[data-answer]').forEach((option) => {
        const index = Number(option.dataset.answer);
        if (index === selected) option.classList.add('selected', correct ? 'correct' : 'wrong');
        if (!correct && index === quiz.answer) option.classList.add('reveal');
      });
      card.querySelector('.quiz-feedback').textContent = `${correct ? '正确。' : '还差一点。'}${quiz.explanation}`;
      try {
        const result = await api('/api/progress', {
          method: 'POST', body: JSON.stringify({ quizId: quiz.id, correct })
        });
        state.progress = result.progress;
      } catch (error) { toast(error.message, 'error'); }
    });
  });
}

async function toggleLesson(lessonId) {
  const completed = completedSet();
  const shouldComplete = !completed.has(lessonId);
  try {
    const result = await api('/api/progress', {
      method: 'POST', body: JSON.stringify({ lessonId, completed: shouldComplete })
    });
    state.progress = result.progress;
    updateHeaderProgress();
    toast(shouldComplete ? '本课已归档到学习进度。' : '已撤销完成标记。');
    renderCourse(lessonId);
  } catch (error) { toast(error.message, 'error'); }
}

function renderNextLessonLink(lesson) {
  const index = state.content.lessons.findIndex((item) => item.id === lesson.id);
  const next = state.content.lessons[index + 1];
  return next
    ? `<a class="secondary-button" href="#lesson/${escapeHtml(next.id)}">下一课：${escapeHtml(next.title)} →</a>`
    : '<a class="secondary-button" href="#home">返回总览 →</a>';
}

function initializeDiagrams() {
  document.querySelectorAll('[data-diagram]').forEach((host) => {
    const type = host.dataset.diagram;
    const builders = {
      'candle-anatomy': buildCandleAnatomy,
      'timeframe-zoom': buildTimeframeZoom,
      'spread-auction': buildSpreadAuction,
      'data-ladder': buildDataLadder,
      'risk-ruler': buildRiskRuler,
      'expectancy-lab': buildExpectancyLab,
      'session-map': buildSessionMap,
      'martingale-ladder': buildMartingaleLadder,
      'hypothesis-stack': buildHypothesis,
      'structure-toggle': buildStructure,
      'liquidity-sweep': buildLiquidity,
      'liquidity-nesting': buildLiquidityNesting,
      'dealing-range': buildDealingRange,
      'fvg-builder': buildFvg,
      'orderbook-sim': buildOrderbook,
      'footprint-grid': buildFootprint,
      'delta-matrix': buildDelta,
      'volume-profile': buildVolumeProfile,
      'auction-extremes': buildAuctionExtremes,
      'dom-motion': buildDomMotion,
      'confluence-builder': buildConfluence
    };
    builders[type]?.(host);
  });
}

function diagramFrame(title, canvas) {
  return html`<div class="diagram-toolbar"><span>INTERACTIVE / ${title}</span><span>点击探索</span></div><div class="diagram-canvas">${canvas}</div>`;
}

function buildCandleAnatomy(host) {
  const render = (direction = 'up', focus = 'all') => {
    const up = direction === 'up';
    const values = up
      ? { open: 100, high: 108, low: 97, close: 106, openY: 188, closeY: 82 }
      : { open: 106, high: 109, low: 98, close: 101, openY: 82, closeY: 176 };
    const active = (name) => focus === 'all' || focus === name;
    host.innerHTML = html`
      <div class="diagram-toolbar candle-toolbar"><span>INTERACTIVE / CANDLE ANATOMY</span><div class="controls"><button data-direction="up" class="${up ? 'active' : ''}">上涨柱</button><button data-direction="down" class="${!up ? 'active' : ''}">下跌柱</button></div></div>
      <div class="diagram-canvas candle-lab">
        <div class="candle-stage">
          <svg viewBox="0 0 420 270" role="img" aria-label="${up ? '上涨' : '下跌'} K 线的开高低收解剖">
            <g class="candle-guide-lines">
              ${[['high',42,values.high,'HIGHEST'],['close',values.closeY,values.close,'CLOSE'],['open',values.openY,values.open,'OPEN'],['low',226,values.low,'LOWEST']].map(([key,y,value,label]) => `<g class="${active(key) ? 'is-active' : 'is-muted'}"><line x1="42" y1="${y}" x2="374" y2="${y}"/><circle cx="54" cy="${y}" r="4"/><text x="64" y="${y - 7}">${label} · ${value}</text></g>`).join('')}
            </g>
            <g class="anatomy-candle ${up ? 'up' : 'down'}">
              <line x1="278" y1="42" x2="278" y2="226"/>
              <rect x="238" y="${Math.min(values.openY, values.closeY)}" width="80" height="${Math.abs(values.closeY - values.openY)}"/>
            </g>
            <text class="candle-body-label" x="278" y="140" text-anchor="middle">实体</text>
            <text class="candle-wick-label" x="295" y="32">上影线</text><text class="candle-wick-label" x="295" y="248">下影线</text>
          </svg>
        </div>
        <div class="candle-facts">
          <small>点一个事实</small>
          <div>${[['all','全部'],['open','O 开盘'],['high','H 最高'],['low','L 最低'],['close','C 收盘']].map(([key,label]) => `<button type="button" data-focus="${key}" class="${focus === key ? 'active' : ''}">${label}</button>`).join('')}</div>
          <p>${focus === 'all' ? '先把 OHLC 当作四个事实；颜色与形态名称放到最后。' : { open: 'Open：这个时间窗口开始时的基准，不一定等于上一根收盘。', high: 'High：窗口内到过的最高价格，不说明为何离开。', low: 'Low：窗口内到过的最低价格，不说明谁在那里买入。', close: 'Close：窗口结束时的价格；未收盘时它仍会变化。' }[focus]}</p>
        </div>
      </div>`;
    host.querySelectorAll('[data-direction]').forEach((button) => button.addEventListener('click', () => render(button.dataset.direction, focus)));
    host.querySelectorAll('[data-focus]').forEach((button) => button.addEventListener('click', () => render(direction, button.dataset.focus)));
  };
  render();
}

function buildTimeframeZoom(host) {
  const views = {
    '4h': { title: '4H · 地图', note: '一根柱压缩四小时：只保留大范围与最终净结果。', bars: [[100,112,96,108]] },
    '1h': { title: '1H · 路径', note: '展开成 4 根柱：你开始看见先跌、再推升、回撤与收高。', bars: [[100,103,96,98],[98,106,97,105],[105,109,102,103],[103,112,102,108]] },
    '15m': { title: '15m · 街景', note: '16 根柱保留更多触发细节，也出现更多容易误判的小摆动。', bars: [[100,102,99,101],[101,102,98,99],[99,100,96,98],[98,100,97,99],[99,102,98,101],[101,105,100,104],[104,106,103,105],[105,106,102,103],[103,105,102,104],[104,105,102,103],[103,104,101,102],[102,104,101,103],[103,106,102,105],[105,109,104,108],[108,112,107,110],[110,111,107,108]] }
  };
  const render = (mode = '4h') => {
    const view = views[mode];
    const min = 94; const max = 114; const left = 50; const right = 560; const top = 26; const bottom = 226;
    const y = (price) => bottom - ((price - min) / (max - min)) * (bottom - top);
    const step = (right - left) / view.bars.length;
    const candleWidth = Math.min(44, step * .48);
    const candles = view.bars.map((bar,index) => {
      const [open,high,low,close] = bar; const x = left + step * (index + .5); const rising = close >= open;
      return `<g class="tf-candle ${rising ? 'up' : 'down'}"><line x1="${x}" y1="${y(high)}" x2="${x}" y2="${y(low)}"/><rect x="${x-candleWidth/2}" y="${Math.min(y(open),y(close))}" width="${candleWidth}" height="${Math.max(3,Math.abs(y(open)-y(close)))}"/></g>`;
    }).join('');
    host.innerHTML = html`
      <div class="diagram-toolbar"><span>INTERACTIVE / TIMEFRAME ZOOM</span><div class="controls">${Object.keys(views).map((key) => `<button data-timeframe="${key}" class="${mode === key ? 'active' : ''}">${key.toUpperCase()}</button>`).join('')}</div></div>
      <div class="diagram-canvas timeframe-lab">
        <svg viewBox="0 0 600 270" role="img" aria-label="${view.title}">${chartGrid()}<rect class="tf-context-zone" x="32" y="${y(100)}" width="546" height="${y(96)-y(100)}"/>${candles}<text class="chart-label" x="42" y="250">同一段 4 小时数据 · ${view.bars.length} 根柱</text></svg>
        <div class="timeframe-caption"><small>${view.title}</small><p>${view.note}</p><span>${mode === '15m' ? '细节 ↑ · 噪声也 ↑' : mode === '1h' ? '位置与路径的折中层' : '轮廓 ↑ · 内部细节 ↓'}</span></div>
      </div>`;
    host.querySelectorAll('[data-timeframe]').forEach((button) => button.addEventListener('click', () => render(button.dataset.timeframe)));
  };
  render();
}

function buildSpreadAuction(host) {
  const render = (type = 'market', size = 8) => {
    const market = type === 'market';
    const large = size === 26;
    const result = market
      ? (large ? ['已跨两档成交', '12 @ 100.25 + 14 @ 100.50', '平均价 100.38 · 出现 0.13 滑点'] : ['在最佳 Ask 成交', '8 @ 100.25', '速度较高 · 价格仍非绝对保证'])
      : ['进入 Bid 排队', `${size} @ 100.00`, '价格受控 · 可能部分或完全不成交'];
    host.innerHTML = html`
      <div class="diagram-toolbar"><span>INTERACTIVE / QUEUE & EXECUTION</span><div class="controls"><button data-order-type="market" class="${market ? 'active' : ''}">市价买入</button><button data-order-type="limit" class="${!market ? 'active' : ''}">限价买入</button></div></div>
      <div class="diagram-canvas auction-lab">
        <div class="auction-book">
          <div class="auction-side ask"><small>ASK · 卖方等待</small>${[[100.75,38],[100.50,18],[100.25,12]].map(([price,depth],index) => `<div class="auction-row ${market && large && index > 0 ? 'consumed' : market && !large && index === 2 ? 'partial' : ''}"><span>${price.toFixed(2)}</span><i style="--depth:${depth*2}%"></i><b>${depth}</b></div>`).join('')}</div>
          <div class="spread-gap"><span>SPREAD</span><b>0.25</b><small>LAST 100.00 ≠ NEXT FILL</small></div>
          <div class="auction-side bid"><small>BID · 买方等待</small>${[[100.00,32],[99.75,26],[99.50,20]].map(([price,depth],index) => `<div class="auction-row ${!market && index === 0 ? 'queued' : ''}"><span>${price.toFixed(2)}</span><i style="--depth:${depth*2}%"></i><b>${index === 0 && !market ? depth + size : depth}</b></div>`).join('')}</div>
        </div>
        <div class="auction-ticket">
          <small>模拟订单 · 抽象单位</small><h3>${result[0]}</h3><p>${result[1]}</p><strong>${result[2]}</strong>
          <div class="size-switch"><button data-order-size="8" class="${!large ? 'active' : ''}">数量 8</button><button data-order-size="26" class="${large ? 'active' : ''}">数量 26</button></div>
          <span>市价：不保证价格　/　限价：不保证执行</span>
        </div>
      </div>`;
    host.querySelectorAll('[data-order-type]').forEach((button) => button.addEventListener('click', () => render(button.dataset.orderType, size)));
    host.querySelectorAll('[data-order-size]').forEach((button) => button.addEventListener('click', () => render(type, Number(button.dataset.orderSize))));
  };
  render();
}

function buildDataLadder(host) {
  const layers = [
    ['trades','01','交易所逐笔成交','最接近“发生了什么”','价格、数量、时间；若分类可靠可构建真实 Bid × Ask。','仍不能直接证明参与者身份或未来方向。'],
    ['book','02','订单簿 / Market Depth','此刻公开在等什么','各价位公开挂单与深度，适合观察流动性供给。','挂单可以撤销，且数据可能只有部分深度。'],
    ['ticks','03','经纪商 / Tick Volume','这个数据源有多活跃','报价更新或该经纪商观察到的活动频率。','不等同于全市场集中成交手数。'],
    ['estimate','04','低周期 K 线估算','用近似方法研究方向分配','按小周期涨跌给 volume 分类，可做方法一致的比较。','不能标成交易所原生 Delta 或 Footprint。']
  ];
  const render = (selected = 'trades') => {
    const item = layers.find((layer) => layer[0] === selected);
    host.innerHTML = diagramFrame('DATA PROVENANCE', html`
      <div class="data-ladder">
        <div class="ladder-steps">${layers.map((layer,index) => `<button type="button" data-data-layer="${layer[0]}" class="${selected === layer[0] ? 'active' : ''}" style="--step:${index}"><span>${layer[1]}</span><b>${layer[2]}</b><small>${layer[3]}</small></button>`).join('')}</div>
        <article class="ladder-readout"><small>当前层级 / ${item[1]}</small><h3>${item[2]}</h3><div><b>可以回答</b><p>${item[4]}</p></div><div><b>不能证明</b><p>${item[5]}</p></div><span>规则：来源名称 + 数据类型 + 聚合方法 + 覆盖限制</span></article>
      </div>`);
    host.querySelectorAll('[data-data-layer]').forEach((button) => button.addEventListener('click', () => render(button.dataset.dataLayer)));
  };
  render();
}

function buildRiskRuler(host) {
  const render = (risk = 2, reward = 4) => {
    const multiple = (reward / risk).toFixed(2).replace(/\.00$/, '');
    const entry = 100; const stop = entry - risk; const target = entry + reward;
    host.innerHTML = diagramFrame('R MULTIPLE RULER', html`
      <div class="risk-lab">
        <div class="risk-ruler-visual">
          <div class="r-price target" style="--position:8%"><span>目标</span><b>${target.toFixed(1)}</b></div>
          <div class="r-price entry" style="--position:48%"><span>入场假设</span><b>${entry.toFixed(1)}</b></div>
          <div class="r-price stop" style="--position:88%"><span>结构失效</span><b>${stop.toFixed(1)}</b></div>
          <div class="r-bracket reward"><span>${reward.toFixed(1)} 回报距离</span></div><div class="r-bracket risk"><span>${risk.toFixed(1)} 风险距离 = 1R</span></div>
        </div>
        <div class="risk-controls">
          <small>抽象训练单位 · 非仓位建议</small><h3>${multiple}R</h3><p>潜在回报距离 ÷ 风险距离<br><b>${reward.toFixed(1)} ÷ ${risk.toFixed(1)} = ${multiple}R</b></p>
          <label>失效距离 <output>${risk.toFixed(1)}</output><input type="range" data-risk min="1" max="5" step="0.5" value="${risk}"></label>
          <label>目标距离 <output>${reward.toFixed(1)}</output><input type="range" data-reward min="1" max="10" step="0.5" value="${reward}"></label>
          <span>先由结构决定失效，再计算 R；不要倒过来移动止损。</span>
        </div>
      </div>`);
    host.querySelector('[data-risk]').addEventListener('input', (event) => render(Number(event.target.value), reward));
    host.querySelector('[data-reward]').addEventListener('input', (event) => render(risk, Number(event.target.value)));
  };
  render();
}

function buildExpectancyLab(host) {
  host.innerHTML = diagramFrame('STRATEGY EXPECTANCY', html`
    <div class="expectancy-lab">
      <section class="expectancy-balance" aria-live="polite">
        <small>EXPECTED VALUE / ABSTRACT R</small>
        <h3 data-expectancy>+0.25R <span>/ 每笔</span></h3>
        <div class="expectancy-contributions" aria-label="期望值贡献拆解">
          <div class="expectancy-bar win"><span>胜率 × 平均盈利</span><b data-win-contribution>+0.90R</b><i data-win-bar></i></div>
          <div class="expectancy-bar loss"><span>败率 × 平均亏损</span><b data-loss-contribution>−0.55R</b><i data-loss-bar></i></div>
          <div class="expectancy-bar cost"><span>平均每笔成本</span><b data-cost-contribution>−0.10R</b><i data-cost-bar></i></div>
        </div>
        <div class="expectancy-metrics">
          <div><small>保本胜率</small><b data-break-even>36.7%</b></div>
          <div><small data-required-label>目标 +0.20R 所需平均盈利</small><b data-required-win>1.89R</b></div>
        </div>
        <p data-expectancy-note>以当前假设，100 笔的算术期望为 +25.00R；真实路径会围绕均值波动，也可能长期偏离。</p>
      </section>
      <div class="expectancy-controls">
        <small>输入历史实现值或更保守的事前假设</small>
        <label>胜率 p <output data-win-rate-output>45%</output><input type="range" data-win-rate min="20" max="80" step="1" value="45"></label>
        <label>平均盈利 W <output data-average-win-output>2.00R</output><input type="range" data-average-win min="0.5" max="5" step="0.1" value="2"></label>
        <label>平均亏损 L <output data-average-loss-output>1.00R</output><input type="range" data-average-loss min="0.5" max="2" step="0.1" value="1"></label>
        <label>平均成本 C <output data-average-cost-output>0.10R</output><input type="range" data-average-cost min="0" max="0.5" step="0.05" value="0.1"></label>
        <label>目标期望 E* <output data-target-expectancy-output>+0.20R</output><input type="range" data-target-expectancy min="0" max="0.5" step="0.05" value="0.2"></label>
        <span>公式使用同一份事前 1R。成本已单列时，不要再把它重复扣进 W 与 L。</span>
      </div>
    </div>`);

  const controls = {
    winRate: host.querySelector('[data-win-rate]'),
    averageWin: host.querySelector('[data-average-win]'),
    averageLoss: host.querySelector('[data-average-loss]'),
    averageCost: host.querySelector('[data-average-cost]'),
    targetExpectancy: host.querySelector('[data-target-expectancy]')
  };
  const signedR = (value) => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}R`;
  const update = () => {
    const p = Number(controls.winRate.value) / 100;
    const averageWin = Number(controls.averageWin.value);
    const averageLoss = Number(controls.averageLoss.value);
    const averageCost = Number(controls.averageCost.value);
    const targetExpectancy = Number(controls.targetExpectancy.value);
    const winContribution = p * averageWin;
    const lossContribution = (1 - p) * averageLoss;
    const expectancy = winContribution - lossContribution - averageCost;
    const breakEven = (averageLoss + averageCost) / (averageWin + averageLoss) * 100;
    const requiredWin = (targetExpectancy + lossContribution + averageCost) / p;
    const contributionScale = Math.max(winContribution, lossContribution, averageCost, 0.01);
    const expectancyNode = host.querySelector('[data-expectancy]');

    expectancyNode.innerHTML = `${signedR(expectancy)} <span>/ 每笔</span>`;
    expectancyNode.className = expectancy > 0.001 ? 'positive' : expectancy < -0.001 ? 'negative' : 'neutral';
    host.querySelector('[data-win-contribution]').textContent = signedR(winContribution);
    host.querySelector('[data-loss-contribution]').textContent = signedR(-lossContribution);
    host.querySelector('[data-cost-contribution]').textContent = signedR(-averageCost);
    host.querySelector('[data-win-bar]').style.width = `${Math.max(4, winContribution / contributionScale * 100)}%`;
    host.querySelector('[data-loss-bar]').style.width = `${Math.max(4, lossContribution / contributionScale * 100)}%`;
    host.querySelector('[data-cost-bar]').style.width = `${Math.max(4, averageCost / contributionScale * 100)}%`;
    host.querySelector('[data-break-even]').textContent = `${breakEven.toFixed(1)}%`;
    host.querySelector('[data-required-label]').textContent = `目标 ${signedR(targetExpectancy)} 所需平均盈利`;
    host.querySelector('[data-required-win]').textContent = `${requiredWin.toFixed(2)}R`;
    host.querySelector('[data-expectancy-note]').textContent = `以当前假设，100 笔的算术期望为 ${signedR(expectancy * 100)}；真实路径会围绕均值波动，也可能长期偏离。`;
    host.querySelector('[data-win-rate-output]').textContent = `${Math.round(p * 100)}%`;
    host.querySelector('[data-average-win-output]').textContent = `${averageWin.toFixed(2)}R`;
    host.querySelector('[data-average-loss-output]').textContent = `${averageLoss.toFixed(2)}R`;
    host.querySelector('[data-average-cost-output]').textContent = `${averageCost.toFixed(2)}R`;
    host.querySelector('[data-target-expectancy-output]').textContent = signedR(targetExpectancy);
  };
  Object.values(controls).forEach((control) => control.addEventListener('input', update));
  update();
}

function buildSessionMap(host) {
  const markets = {
    stock: { label: '股票示意', blocks: [['盘前 / ETH', 4, 9.5, 'eth'], ['常规 / RTH', 9.5, 16, 'rth'], ['盘后 / ETH', 16, 20, 'eth']], note: 'RTH 与 ETH 是交易所/产品规则，不是天然固定的全球时段。' },
    futures: { label: '期货示意', blocks: [['电子时段', 0, 17, 'eth'], ['维护窗口', 17, 18, 'halt'], ['电子时段', 18, 24, 'eth']], note: '某些期货“交易日”跨过午夜；结算日与日历日可能不同。' },
    crypto: { label: '连续市场', blocks: [['24 / 7 连续交易', 0, 24, 'rth']], note: '连续开盘不代表全天流动性相同；地区重叠时段仍会改变参与度。' }
  };
  const render = (market = 'stock', zone = 'exchange') => {
    const view = markets[market];
    host.innerHTML = html`
      <div class="diagram-toolbar"><span>INTERACTIVE / SESSION CONTEXT</span><div class="controls">${Object.keys(markets).map((key) => `<button data-session-market="${key}" class="${market === key ? 'active' : ''}">${markets[key].label}</button>`).join('')}</div></div>
      <div class="diagram-canvas session-lab">
        <div class="session-clock"><div class="clock-scale">${[0,3,6,9,12,15,18,21,24].map((hour) => `<span style="left:${hour / 24 * 100}%">${String(hour).padStart(2,'0')}</span>`).join('')}</div><div class="session-track">${view.blocks.map(([label,start,end,tone]) => `<button class="session-block ${tone}" style="left:${start / 24 * 100}%;width:${(end-start) / 24 * 100}%" title="示意时段：${label}"><b>${label}</b><small>${start}—${end}</small></button>`).join('')}</div><p>示意轴 · 不用于下单前确认</p></div>
        <article class="session-readout"><small>TIME STANDARD</small><h3>${zone === 'exchange' ? '交易所时区' : '固定 GMT 偏移'}</h3><p>${zone === 'exchange' ? '优先保存交易所定义的 IANA 时区；夏令时切换由时区规则处理。' : '固定偏移在夏令时切换后可能整体错一小时。'}</p><div><button data-session-zone="exchange" class="${zone === 'exchange' ? 'active' : ''}">IANA / 交易所</button><button data-session-zone="fixed" class="${zone === 'fixed' ? 'active' : ''}">固定 GMT</button></div><strong>${view.note}</strong></article>
      </div>`;
    host.querySelectorAll('[data-session-market]').forEach((button) => button.addEventListener('click', () => render(button.dataset.sessionMarket, zone)));
    host.querySelectorAll('[data-session-zone]').forEach((button) => button.addEventListener('click', () => render(market, button.dataset.sessionZone)));
  };
  render();
}

function buildMartingaleLadder(host) {
  const multipliers = [1, 1.25, 1.5, 2];
  const render = (multiplier = 1.5, fills = 5, stopGrids = 2, targetGrids = 2) => {
    const prices = Array.from({ length: fills }, (_, index) => 100 - index * 4);
    const sizes = prices.map((_, index) => multiplier ** index);
    const total = sizes.reduce((sum, size) => sum + size, 0);
    const weighted = prices.reduce((sum, price, index) => sum + price * sizes[index], 0) / total;
    const current = prices.at(-1);
    const openPnl = prices.reduce((sum, price, index) => sum + (current - price) * sizes[index], 0);
    const nextGridLoss = total * 4;
    const stop = current - stopGrids * 4;
    const target = weighted + targetGrids * 4;
    const stopRisk = total * (weighted - stop);
    const targetReward = total * (target - weighted);
    const rewardRisk = targetReward / stopRisk;
    const maxSize = Math.max(...sizes);
    const format = (value, digits = 2) => Number(value.toFixed(digits)).toString();
    host.innerHTML = html`
      <div class="diagram-toolbar"><span>INTERACTIVE / MARTINGALE EXPOSURE</span><div class="controls">${multipliers.map((value) => `<button data-martingale-multiplier="${value}" class="${multiplier === value ? 'active' : ''}">${value === 1 ? '等额 1×' : `${value}×`}</button>`).join('')}</div></div>
      <div class="diagram-canvas martingale-lab">
        <div class="martingale-grid">
          <div class="mg-scale"><span>PRICE</span><span>ORDER SIZE · q₀ = 1</span></div>
          ${prices.map((price, index) => `<div class="mg-row ${index === fills - 1 ? 'current' : ''}"><span>${price.toFixed(0)}</span><i style="--size:${(sizes[index] / maxSize) * 100}%"></i><b>${format(sizes[index])}</b><small>${index === fills - 1 ? 'CURRENT' : `L${index + 1}`}</small></div>`).join('')}
          <div class="mg-fill-control"><span>已成交层数</span>${[3,4,5,6].map((value) => `<button data-martingale-fills="${value}" class="${fills === value ? 'active' : ''}">${value}</button>`).join('')}</div>
          <div class="mg-exit-controls">
            <div><span>STOP · 现价下方</span>${[1,2,3].map((value) => `<button data-martingale-stop="${value}" class="${stopGrids === value ? 'active' : ''}">${value} 格</button>`).join('')}</div>
            <div><span>TARGET · 均价上方</span>${[1,2,3].map((value) => `<button data-martingale-target="${value}" class="${targetGrids === value ? 'active' : ''}">${value} 格</button>`).join('')}</div>
          </div>
        </div>
        <article class="martingale-readout">
          <small>${multiplier === 1 ? 'FIXED SIZE / LINEAR' : 'MULTIPLIED SIZE / GEOMETRIC'}</small>
          <h3>${format(total)}<span>累计数量</span></h3>
          <div class="mg-metrics"><p><b>${format(weighted)}</b><span>加权均价 P̄</span></p><p><b>${format(stop)}</b><span>计划止损价 S*</span></p><p><b>−${format(stopRisk)}</b><span>计划止损风险 = 1R*</span></p><p><b>${format(target)}</b><span>计划目标价 T*</span></p><p><b>+${format(targetReward)}</b><span>计划目标回报*</span></p><p><b>${format(rewardRisk)} : 1</b><span>回报 : 风险</span></p></div>
          <strong>当前浮动 P&L ${format(openPnl)}　/　再跌一格新增 P&L −${format(nextGridLoss)}。${rewardRisk < 1 ? '当前目标回报小于计划止损风险。' : '盈亏比合格与否仍需胜率、费用和执行共同验证。'}</strong>
          <p>* 计划值而非保证成交值。普通 Stop 触发后可能产生滑点；未计手续费、Spread、资金费、保证金和强平。</p>
        </article>
      </div>`;
    host.querySelectorAll('[data-martingale-multiplier]').forEach((button) => button.addEventListener('click', () => render(Number(button.dataset.martingaleMultiplier), fills, stopGrids, targetGrids)));
    host.querySelectorAll('[data-martingale-fills]').forEach((button) => button.addEventListener('click', () => render(multiplier, Number(button.dataset.martingaleFills), stopGrids, targetGrids)));
    host.querySelectorAll('[data-martingale-stop]').forEach((button) => button.addEventListener('click', () => render(multiplier, fills, Number(button.dataset.martingaleStop), targetGrids)));
    host.querySelectorAll('[data-martingale-target]').forEach((button) => button.addEventListener('click', () => render(multiplier, fills, stopGrids, Number(button.dataset.martingaleTarget))));
  };
  render();
}

function buildLiquidityNesting(host) {
  const render = (scope = 'parent') => {
    const parent = scope === 'parent';
    host.innerHTML = html`
      <div class="diagram-toolbar"><span>INTERACTIVE / NESTED LIQUIDITY</span><div class="controls"><button data-liquidity-scope="parent" class="${parent ? 'active' : ''}">父级区间</button><button data-liquidity-scope="child" class="${!parent ? 'active' : ''}">子级区间</button></div></div>
      <div class="diagram-canvas nesting-lab">
        <svg viewBox="0 0 600 300" role="img" aria-label="切换父级与子级区间观察内外部流动性">
          ${chartGrid()}<rect class="nest-parent" x="35" y="45" width="530" height="205"/><rect class="nest-child" x="205" y="105" width="245" height="105"/>
          <polyline class="chart-price" points="40,220 110,92 170,172 235,128 300,194 365,118 430,180 505,62 560,108"/>
          <line class="nest-boundary" x1="35" y1="${parent ? 45 : 105}" x2="565" y2="${parent ? 45 : 105}"/><line class="nest-boundary" x1="35" y1="${parent ? 250 : 210}" x2="565" y2="${parent ? 250 : 210}"/>
          <circle class="nest-focus" cx="430" cy="180" r="7"/><text class="chart-label" x="440" y="198">${parent ? '父级内部摆动' : '子级外部流动性'}</text>
          <text class="chart-label" x="44" y="38">${parent ? '外部：父级边界之外' : '范围缩小后，分类改变'}</text>
        </svg>
        <article><small>RELATIVE, NOT ABSOLUTE</small><h3>${parent ? '同一点在父级内部' : '同一点在子级外部'}</h3><p>“内部 / 外部”必须附带参照区间。若没有先声明范围，术语没有可复核含义。</p><strong>Inducement 是对路径的交易者解释，不是交易所数据字段；先记录摆动、突破与成交事实。</strong></article>
      </div>`;
    host.querySelectorAll('[data-liquidity-scope]').forEach((button) => button.addEventListener('click', () => render(button.dataset.liquidityScope)));
  };
  render();
}

function buildDealingRange(host) {
  const render = (price = 62, anchors = 'major') => {
    const position = price > 55 ? 'Premium · 溢价半区' : price < 45 ? 'Discount · 折价半区' : 'Equilibrium · 均衡附近';
    host.innerHTML = diagramFrame('DEALING RANGE COORDINATES', html`
      <div class="range-lab">
        <div class="range-map"><div class="range-band premium"><span>PREMIUM</span></div><div class="range-eq"><span>50% · EQUILIBRIUM</span></div><div class="range-band discount"><span>DISCOUNT</span></div><i style="bottom:${price}%"><b>当前价格</b><small>${price}%</small></i></div>
        <article><small>${anchors === 'major' ? '显著高低点锚定' : '局部摆动锚定'}</small><h3>${position}</h3><p>这是相对于所选区间的坐标，不是“贵就必跌、便宜就必涨”。改变锚点，位置分类也会改变。</p><label>移动当前价格 <input data-range-price type="range" min="5" max="95" value="${price}"></label><div><button data-range-anchor="major" class="${anchors === 'major' ? 'active' : ''}">主区间</button><button data-range-anchor="local" class="${anchors === 'local' ? 'active' : ''}">局部区间</button></div><strong>位置只缩小观察范围；方向、触发与失效仍需独立定义。</strong></article>
      </div>`);
    host.querySelector('[data-range-price]').addEventListener('input', (event) => render(Number(event.target.value), anchors));
    host.querySelectorAll('[data-range-anchor]').forEach((button) => button.addEventListener('click', () => render(price, button.dataset.rangeAnchor)));
  };
  render();
}

function buildHypothesis(host) {
  const nodes = [
    ['01', '方向', '高周期结构指向哪里？下一处明显流动性在哪？'],
    ['02', '位置', '我只在哪个 POI 等待，而不是追逐价格？'],
    ['03', '触发', '扫取、位移、结构与成交需要出现什么？'],
    ['04', '失效', '哪个可观察事实说明原叙事不再成立？']
  ];
  host.innerHTML = diagramFrame('HYPOTHESIS STACK', `<div class="node-flow">${nodes.map((node, index) => `<button type="button" class="${index === 0 ? 'active' : ''}"><small>${node[0]}</small><b>${node[1]}</b><p>${node[2]}</p></button>`).join('')}</div>`);
  host.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
    host.querySelectorAll('button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
  }));
}

function chartGrid() {
  return `<g class="chart-grid">${[45,90,135,180,225].map((y) => `<line x1="20" y1="${y}" x2="580" y2="${y}"/>`).join('')}${[80,160,240,320,400,480,560].map((x) => `<line x1="${x}" y1="20" x2="${x}" y2="250"/>`).join('')}</g>`;
}

function buildStructure(host) {
  const render = (mode = 'bos') => {
    const isBos = mode === 'bos';
    host.innerHTML = html`
      <div class="diagram-toolbar"><span>INTERACTIVE / STRUCTURE</span><div class="controls"><button data-mode="bos" class="${isBos ? 'active' : ''}">BOS 延续</button><button data-mode="choch" class="${!isBos ? 'active' : ''}">CHoCH 警报</button></div></div>
      <div class="diagram-canvas"><svg viewBox="0 0 600 270" role="img" aria-label="${isBos ? '上升结构延续' : '上升结构反向破坏'}">
        ${chartGrid()}
        <polyline class="chart-price" points="30,225 105,175 160,205 250,125 320,170 ${isBos ? '420,82 485,124 570,48' : '405,108 480,212 570,232'}"/>
        <circle cx="250" cy="125" r="5" fill="#e04b32"/><text class="chart-label" x="260" y="115">HH</text>
        <circle cx="320" cy="170" r="5" fill="#164f63"/><text class="chart-label" x="330" y="165">受保护 HL</text>
        <line x1="320" y1="170" x2="575" y2="170" stroke="#e04b32" stroke-dasharray="6 5"/>
        <text class="chart-label" x="430" y="${isBos ? 62 : 244}" fill="#e04b32">${isBos ? 'BOS：突破前高' : 'CHoCH：跌破受保护低点'}</text>
      </svg></div>`;
    host.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => render(button.dataset.mode)));
  };
  render();
}

function buildLiquidity(host) {
  const render = (step = 0) => {
    const paths = [
      '30,210 100,165 165,190 240,125 305,150 375,90 440,112 500,75',
      '30,210 100,165 165,190 240,125 305,150 375,90 440,112 500,48 535,94',
      '30,210 100,165 165,190 240,125 305,150 375,90 440,112 500,48 535,94 570,175'
    ];
    host.innerHTML = html`
      <div class="diagram-toolbar"><span>INTERACTIVE / LIQUIDITY TEST</span><div class="controls">${['接近', '越界', '收回'].map((label, index) => `<button data-step="${index}" class="${index === step ? 'active' : ''}">${label}</button>`).join('')}</div></div>
      <div class="diagram-canvas"><svg viewBox="0 0 600 270">
        ${chartGrid()}<line x1="22" y1="70" x2="578" y2="70" stroke="#e04b32" stroke-dasharray="7 5"/><text class="chart-label" x="28" y="58">等高上方 / BSL</text>
        <polyline class="chart-price" points="${paths[step]}"/>
        ${step > 0 ? '<circle cx="500" cy="48" r="6" fill="#d5f43c"/><text class="chart-label" x="512" y="42">测试外侧流动性</text>' : ''}
        ${step === 2 ? '<text class="chart-label" x="430" y="205">收回 ≠ 自动反转\n等待后续结构/成交</text>' : ''}
      </svg></div>`;
    host.querySelectorAll('[data-step]').forEach((button) => button.addEventListener('click', () => render(Number(button.dataset.step))));
  };
  render();
}

function buildFvg(host) {
  const render = (wide = true) => {
    host.innerHTML = html`
      <div class="diagram-toolbar"><span>INTERACTIVE / FVG BUILDER</span><div class="controls"><button data-wide="true" class="${wide ? 'active' : ''}">强位移</button><button data-wide="false" class="${!wide ? 'active' : ''}">有重叠</button></div></div>
      <div class="diagram-canvas"><svg viewBox="0 0 600 270">
        ${chartGrid()}
        <g stroke="#18231f" stroke-width="2">
          <line x1="165" y1="190" x2="165" y2="105"/><rect x="145" y="128" width="40" height="42" fill="#f5f0e6"/>
          <line x1="300" y1="${wide ? 218 : 188}" x2="300" y2="42"/><rect x="278" y="${wide ? 72 : 105}" width="44" height="${wide ? 105 : 60}" fill="#d5f43c"/>
          <line x1="435" y1="145" x2="435" y2="65"/><rect x="415" y="86" width="40" height="38" fill="#f5f0e6"/>
        </g>
        ${wide ? '<rect x="185" y="105" width="230" height="40" fill="rgba(224,75,50,.2)" stroke="#e04b32" stroke-dasharray="5 4"/><text class="chart-label" x="205" y="130">第一根高点 ↔ 第三根低点未重叠 = FVG</text>' : '<text class="chart-label" x="180" y="232">影线区间重叠：按这一定义不构成 FVG</text>'}
      </svg></div>`;
    host.querySelectorAll('[data-wide]').forEach((button) => button.addEventListener('click', () => render(button.dataset.wide === 'true')));
  };
  render();
}

function buildOrderbook(host) {
  let asks = [18, 30, 44];
  let bids = [40, 28, 20];
  let last = '等待主动订单…';
  const render = () => {
    host.innerHTML = diagramFrame('MINI MATCHING ENGINE', html`
      <div class="orderbook">
        <div class="book-side asks">${asks.map((depth, index) => `<div class="book-row" style="--depth:${depth * 2}%"><span>ASK ${(101.25 + (2-index)*.25).toFixed(2)}</span><span>${depth}</span></div>`).join('')}</div>
        <div class="book-side bids">${bids.map((depth, index) => `<div class="book-row" style="--depth:${depth * 2}%"><span>BID ${(100.75 - index*.25).toFixed(2)}</span><span>${depth}</span></div>`).join('')}</div>
        <div class="book-mid">${escapeHtml(last)}</div>
      </div>
      <div class="sim-actions"><button type="button" class="buy" data-order="buy">主动买入 10</button><button type="button" class="sell" data-order="sell">主动卖出 10</button><button type="button" data-order="reset">重置</button></div>
    `);
    host.querySelectorAll('[data-order]').forEach((button) => button.addEventListener('click', () => {
      if (button.dataset.order === 'reset') { asks = [18,30,44]; bids = [40,28,20]; last = '订单簿已重置'; }
      if (button.dataset.order === 'buy') { asks[2] = Math.max(0, asks[2] - 10); last = '买方抬 Ask：消耗最优卖方挂单'; }
      if (button.dataset.order === 'sell') { bids[0] = Math.max(0, bids[0] - 10); last = '卖方打 Bid：消耗最优买方挂单'; }
      render();
    }));
  };
  render();
}

function buildFootprint(host) {
  const rows = [
    [101.50, 12, 48], [101.25, 26, 92], [101.00, 54, 64], [100.75, 118, 42], [100.50, 76, 28], [100.25, 36, 20]
  ];
  host.innerHTML = diagramFrame('BID × ASK FOOTPRINT', html`
    <div class="footprint">
      <div class="fp-cell head">PRICE</div><div class="fp-cell head">BID</div><div class="fp-cell head">ASK</div>
      ${rows.map((row) => {
        const total = row[1] + row[2];
        const vpoc = total === Math.max(...rows.map((item) => item[1] + item[2]));
        return `<div class="fp-cell price ${vpoc ? 'vpoc' : ''}" data-price="${row[0]}">${row[0].toFixed(2)}</div><div class="fp-cell bid ${row[1] > row[2] * 2 ? 'hot' : ''}" data-side="Bid" data-volume="${row[1]}" data-price="${row[0]}">${row[1]}</div><div class="fp-cell ask ${row[2] > row[1] * 2 ? 'hot' : ''}" data-side="Ask" data-volume="${row[2]}" data-price="${row[0]}">${row[2]}</div>`;
      }).join('')}
    </div><div class="fp-readout">高亮 = 示例阈值下的不平衡；点击一个成交格。</div>
  `);
  host.querySelectorAll('[data-side]').forEach((cell) => cell.addEventListener('click', () => {
    host.querySelector('.fp-readout').textContent = `${cell.dataset.price} · ${cell.dataset.side} 成交量 ${cell.dataset.volume}。这是已成交主动性，不是挂单数量。`;
  }));
}

function buildDelta(host) {
  const cases = [
    ['价格 ↑ / Delta +', '方向一致：主动买入得到价格响应。'],
    ['价格 → / Delta ++', '响应很弱：研究潜在卖方吸收。'],
    ['价格新高 / CVD 低高', '出现分歧：等待确认，不自动反转。'],
    ['价格 ↓ / Delta −', '方向一致：主动卖出得到价格响应。']
  ];
  host.innerHTML = diagramFrame('PRICE × DELTA', `<div class="delta-matrix">${cases.map((item, index) => `<button class="delta-case ${index === 0 ? 'active' : ''}" type="button"><b>${item[0]}</b><span>${item[1]}</span></button>`).join('')}</div>`);
  host.querySelectorAll('.delta-case').forEach((button) => button.addEventListener('click', () => {
    host.querySelectorAll('.delta-case').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
  }));
}

function buildVolumeProfile(host) {
  const profiles = {
    balance: { label: '平衡分布', volumes: [18,32,55,82,100,86,58,34,20], note: '中部形成 HVN：历史上价格在这里停留并成交较多。' },
    double: { label: '双峰分布', volumes: [22,64,92,48,18,38,88,70,24], note: '两个接受区之间夹着 LVN；它描述历史分布，不保证再次快速穿越。' },
    trend: { label: '趋势分布', volumes: [12,20,34,48,66,90,72,45,18], note: '成交重心偏移。仍要与形成过程、时段和后续响应一起阅读。' }
  };
  const render = (mode = 'balance', selected = null) => {
    const view = profiles[mode];
    const pocIndex = view.volumes.indexOf(Math.max(...view.volumes));
    const valueRows = new Set([pocIndex - 2,pocIndex - 1,pocIndex,pocIndex + 1,pocIndex + 2].filter((index) => index >= 0 && index < view.volumes.length));
    const selectedIndex = selected ?? pocIndex;
    host.innerHTML = html`
      <div class="diagram-toolbar"><span>INTERACTIVE / VOLUME PROFILE</span><div class="controls">${Object.keys(profiles).map((key) => `<button data-profile-mode="${key}" class="${mode === key ? 'active' : ''}">${profiles[key].label}</button>`).join('')}</div></div>
      <div class="diagram-canvas profile-lab">
        <div class="profile-chart">${view.volumes.map((volume,index) => `<button data-profile-row="${index}" class="profile-row ${index === pocIndex ? 'poc' : ''} ${valueRows.has(index) ? 'value' : ''} ${index === selectedIndex ? 'selected' : ''}"><span>${(102 - index * .25).toFixed(2)}</span><i style="width:${volume}%"></i><b>${volume}</b>${index === pocIndex ? '<em>POC</em>' : ''}${index === Math.min(...valueRows) ? '<em>VAH</em>' : ''}${index === Math.max(...valueRows) ? '<em>VAL</em>' : ''}</button>`).join('')}</div>
        <article><small>SELECTED PRICE ROW</small><h3>${(102 - selectedIndex * .25).toFixed(2)}</h3><p>该行模拟成交量 ${view.volumes[selectedIndex]}；${selectedIndex === pocIndex ? '它是样本内 POC（最高量价位）。' : valueRows.has(selectedIndex) ? '它落在示例 Value Area 内。' : '它落在示例 Value Area 外。'}</p><strong>${view.note}</strong><span>本图为了教学简化 VA 计算；真实平台的分行与百分比设置会影响结果。</span></article>
      </div>`;
    host.querySelectorAll('[data-profile-mode]').forEach((button) => button.addEventListener('click', () => render(button.dataset.profileMode)));
    host.querySelectorAll('[data-profile-row]').forEach((button) => button.addEventListener('click', () => render(mode, Number(button.dataset.profileRow))));
  };
  render();
}

function buildAuctionExtremes(host) {
  const scenes = {
    diagonal: { label: '对角不平衡', hot: [1,2], top: false, note: '相邻价格的 Ask 与 Bid 按平台阈值比较；高亮是计算结果，不等于方向承诺。' },
    stacked: { label: '连续堆叠', hot: [0,1,2], top: false, note: '连续多档同向不平衡称为 stacked imbalance；必须先写清档数与比例。' },
    excess: { label: '尾部 Excess', hot: [], top: true, note: '极端价位的成交逐步衰竭，可解释为拍卖完成的一种线索，但定义依软件而异。' },
    unfinished: { label: '未完成拍卖', hot: [], top: false, note: '极端价位两侧仍有成交，被部分交易者称为 unfinished auction；它不是必然回补目标。' }
  };
  const rows = [[18,2],[22,7],[31,10],[48,38],[72,64],[96,88]];
  const render = (mode = 'diagonal') => {
    const scene = scenes[mode];
    host.innerHTML = html`
      <div class="diagram-toolbar"><span>INTERACTIVE / AUCTION EXTREMES</span><div class="controls">${Object.keys(scenes).map((key) => `<button data-auction-scene="${key}" class="${mode === key ? 'active' : ''}">${scenes[key].label}</button>`).join('')}</div></div>
      <div class="diagram-canvas auction-extreme-lab">
        <div class="auction-footprint"><div class="af-head"><span>PRICE</span><span>BID × ASK</span></div>${rows.map(([bid,ask],index) => { const topRow = index === 0; const unfinished = mode === 'unfinished' && topRow; return `<div class="af-row ${scene.hot.includes(index) ? 'hot' : ''} ${scene.top && topRow ? 'excess' : ''} ${unfinished ? 'unfinished' : ''}"><span>${(101.5-index*.25).toFixed(2)}</span><b>${scene.top && topRow ? 0 : bid} × ${scene.top && topRow ? 3 : ask}</b><i>${scene.hot.includes(index) ? '≥ 3:1' : unfinished ? '两侧仍成交' : ''}</i></div>`; }).join('')}</div>
        <article><small>OBSERVATION → INTERPRETATION</small><h3>${scene.label}</h3><p>${scene.note}</p><div><b>能确认</b><span>此样本、此聚合方式下的成交分布。</span></div><div><b>不能确认</b><span>参与者身份、下一跳方向，或价格必然回访。</span></div></article>
      </div>`;
    host.querySelectorAll('[data-auction-scene]').forEach((button) => button.addEventListener('click', () => render(button.dataset.auctionScene)));
  };
  render();
}

function buildDomMotion(host) {
  const frames = [
    { name: '初始快照', asks: [30,22,18], bids: [26,34,20], tape: '等待事件', fact: '这是某一瞬间的公开挂单。' },
    { name: 'Stacking', asks: [30,22,18], bids: [26,62,44], tape: '+ 买方深度', fact: 'Bid 侧可见挂单增加。' },
    { name: 'Consumption', asks: [30,22,5], bids: [26,62,44], tape: 'BUY 13 @ ASK', fact: '主动买单消耗最优 Ask。' },
    { name: 'Pulling', asks: [12,8,5], bids: [26,62,44], tape: 'Ask 撤单', fact: 'Ask 侧可见挂单减少；无法仅凭撤单证明动机。' },
    { name: 'Replenishment', asks: [12,8,21], bids: [26,62,44], tape: 'ASK 补回 +16', fact: '同一价位被消耗后重新出现挂单。' }
  ];
  const render = (step = 0) => {
    const frame = frames[step];
    const side = (label, values, tone) => `<div class="dom-side ${tone}"><small>${label}</small>${values.map((value,index) => `<div><span>${tone === 'ask' ? (101.25-index*.25).toFixed(2) : (100.75-index*.25).toFixed(2)}</span><i style="width:${Math.min(100,value/70*100)}%"></i><b>${value}</b></div>`).join('')}</div>`;
    host.innerHTML = diagramFrame('DOM EVENT REPLAY', html`
      <div class="dom-motion-lab"><div class="dom-book">${side('ASK · resting sell', frame.asks, 'ask')}<div class="dom-last"><span>${String(step + 1).padStart(2,'0')} / ${frames.length}</span><b>${frame.name}</b><small>${frame.tape}</small></div>${side('BID · resting buy', frame.bids, 'bid')}</div><article><small>VISIBLE EVENT</small><h3>${frame.name}</h3><p>${frame.fact}</p><strong>${step === 4 ? '持续补单且价格难以上移，才可能支持“吸收”研究；单帧仍不足。' : '把快照改写成事件序列，才能区分新增、成交、撤单与补单。'}</strong><div>${frames.map((item,index) => `<button data-dom-step="${index}" class="${index === step ? 'active' : ''}">${index + 1}</button>`).join('')}</div><span>Spoofing 涉及下单时的取消意图；从几张 DOM 截图不能直接定性。</span></article></div>`);
    host.querySelectorAll('[data-dom-step]').forEach((button) => button.addEventListener('click', () => render(Number(button.dataset.domStep))));
  };
  render();
}

function buildConfluence(host) {
  const selections = { bias: 'bull', location: 'discount', flow: 'confirm' };
  const options = {
    bias: [['bull', '高周期看多'], ['bear', '高周期看空'], ['range', '高周期震荡']],
    location: [['discount', '折价区 / 看涨 POI'], ['premium', '溢价区 / 看跌 POI'], ['middle', '区间中部']],
    flow: [['confirm', '扫低 + 卖方吸收'], ['conflict', '卖方持续推进'], ['none', '没有清晰响应']]
  };
  const verdict = () => {
    if (selections.location === 'middle' || selections.flow === 'none') return ['等待', '位置或执行证据不足；没有交易也是合格结论。'];
    const aligned = (selections.bias === 'bull' && selections.location === 'discount' && selections.flow === 'confirm') || (selections.bias === 'bear' && selections.location === 'premium' && selections.flow === 'conflict');
    return aligned ? ['信息一致', '可以进入风险与触发检查，但一致不等于保证获利。'] : ['信息冲突', '叙事与成交没有对齐；放弃或等待新证据。'];
  };
  const render = () => {
    const result = verdict();
    host.innerHTML = diagramFrame('CONFLUENCE BUILDER', html`
      <div class="confluence-builder">
        ${Object.entries(options).map(([key, items], index) => `<div class="builder-column"><b>0${index + 1} · ${['叙事', '位置', '成交'][index]}</b>${items.map(([value,label]) => `<button type="button" data-key="${key}" data-value="${value}" class="${selections[key] === value ? 'active' : ''}">${label}</button>`).join('')}</div>`).join('')}
        <div class="builder-verdict"><b>${result[0]}</b><span>${result[1]}</span></div>
      </div>`);
    host.querySelectorAll('[data-key]').forEach((button) => button.addEventListener('click', () => { selections[button.dataset.key] = button.dataset.value; render(); }));
  };
  render();
}

function renderCases() {
  const { meta, cases } = state.casebook;
  app.innerHTML = html`
    <div class="page-shell">
      <header class="page-head cases-head">
        <div><p class="eyebrow">${escapeHtml(meta.englishTitle)} / ${cases.length} DOSSIERS</p><h1>结构<br>案例室</h1></div>
        <div class="cases-head-copy"><p>${escapeHtml(meta.subtitle)}</p><small>${escapeHtml(meta.disclaimer)}</small></div>
      </header>
      <section class="case-method" aria-label="案例分析方法">
        ${meta.method.map((item, index) => {
          const [title, description] = item.split('：');
          return `<div><span>0${index + 1}</span><b>${escapeHtml(title)}</b><p>${escapeHtml(description)}</p></div>`;
        }).join('')}
      </section>
      <section class="case-library">
        <div class="case-library-intro"><p class="eyebrow">CHOOSE A DOSSIER</p><h2>从正确、失败和放弃中学习</h2><p>每个案例包含五次信息揭示。建议先回答阶段问题，再打开分析；如果一开始就把所有图层点亮，你训练到的只会是后见之明。</p></div>
        <div class="case-card-grid">
          ${cases.map((caseItem, index) => renderCaseCard(caseItem, index)).join('')}
        </div>
      </section>
    </div>`;
  scrollToTop();
}

function renderCaseCard(caseItem, index) {
  return html`
    <a class="case-card" href="#case/${escapeHtml(caseItem.id)}" data-case-tone="${index % 3}">
      <div class="case-card-top"><span>${escapeHtml(caseItem.number)}</span><span>${escapeHtml(caseItem.difficulty)}</span></div>
      <div class="case-mini-chart">${renderMiniCaseSvg(caseItem)}</div>
      <div class="case-card-body">
        <small>${escapeHtml(caseItem.category)} · ${caseItem.duration} MIN</small>
        <h3>${escapeHtml(caseItem.title)}</h3>
        <p>${escapeHtml(caseItem.subtitle)}</p>
      </div>
      <div class="case-card-foot"><span>${escapeHtml(caseItem.outcome)}</span><i>→</i></div>
    </a>`;
}

function renderMiniCaseSvg(caseItem) {
  const closes = caseItem.bars.map((bar) => bar[3]);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const points = closes.map((price, index) => `${12 + index * (276 / Math.max(1, closes.length - 1))},${82 - ((price - min) / range) * 64}`).join(' ');
  const delta = caseItem.bars.reduce((sum, bar) => sum + bar[4], 0);
  return `<svg viewBox="0 0 300 100" role="img" aria-label="${escapeHtml(caseItem.title)}价格轮廓"><polyline points="${points}"/><line x1="10" y1="88" x2="290" y2="88"/><text x="12" y="97">NET Δ ${delta > 0 ? '+' : ''}${delta}</text></svg>`;
}

function renderCaseLab(caseId) {
  const caseItem = state.casebook.cases.find((item) => item.id === caseId) || state.casebook.cases[0];
  if (!caseItem) return renderCases();
  if (state.caseLab.caseId !== caseItem.id) {
    state.caseLab = { caseId: caseItem.id, stage: 0, reveal: false, layers: { structure: true, liquidity: true, zones: true, flow: true } };
  }
  app.innerHTML = html`
    <div class="case-lab-page">
      <header class="case-masthead page-shell">
        <a href="#cases" class="case-back">← 返回案例目录</a>
        <div class="case-mast-grid">
          <div><p class="eyebrow">${escapeHtml(caseItem.number)} / ${escapeHtml(caseItem.category)}</p><h1>${escapeHtml(caseItem.title)}</h1></div>
          <div><p>${escapeHtml(caseItem.subtitle)}</p><div class="case-tags">${caseItem.skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join('')}</div></div>
        </div>
        <div class="case-setup-strip">
          <span><small>模拟品种</small><b>${escapeHtml(caseItem.setup.instrument)}</b></span>
          <span><small>高周期</small><b>${escapeHtml(caseItem.setup.higherTimeframe)}</b></span>
          <span><small>执行周期</small><b>${escapeHtml(caseItem.setup.executionTimeframe)}</b></span>
          <span><small>事前规则</small><b>${escapeHtml(caseItem.setup.bias)}</b></span>
        </div>
        ${state.beginnerMode ? html`<section class="case-reading-coach"><span>新手读图顺序</span><ol><li>先只看 K 线与明显高低点</li><li>再打开结构、流动性与区域</li><li>到阶段允许后读取 Delta / Footprint</li><li>最后分开写事实、推断与失效</li></ol><p>颜色只帮助定位，不能替你下结论。</p></section>` : ''}
      </header>
      <div id="case-player"></div>
    </div>`;
  updateCasePlayer(caseItem);
  scrollToTop();
}

function updateCasePlayer(caseItem) {
  const player = document.querySelector('#case-player');
  if (!player) return;
  const lab = state.caseLab;
  const stage = caseItem.stages[lab.stage];
  const isFinal = lab.stage === caseItem.stages.length - 1;
  player.innerHTML = html`
    <section class="case-player-shell page-shell">
      <div class="case-stage-rail" aria-label="案例阶段">
        ${caseItem.stages.map((item, index) => `<button type="button" data-case-stage="${index}" class="${index === lab.stage ? 'active' : ''} ${index < lab.stage ? 'visited' : ''}"><span>${String(index + 1).padStart(2, '0')}</span><b>${escapeHtml(item.label)}</b></button>`).join('')}
      </div>
      <div class="case-chart-room">
        <div class="case-chart-toolbar">
          <div><span class="case-live-dot"></span><b>SIMULATED TAPE</b><small>显示至第 ${stage.end} / ${caseItem.bars.length} 根</small></div>
          <div class="layer-toggles" aria-label="图层开关">
            ${[['structure','结构'],['liquidity','流动性'],['zones','区域'],['flow','成交']].map(([key,label]) => `<button type="button" data-layer="${key}" class="${lab.layers[key] ? 'active' : ''}">${label}</button>`).join('')}
          </div>
        </div>
        <div class="case-chart-grid">
          <div class="case-price-chart">${renderCaseChart(caseItem, stage.end, lab.layers)}<span class="mobile-scroll-hint">横向滑动图表 →</span></div>
          <div class="case-flow-panel ${lab.layers.flow ? '' : 'is-hidden'}">${renderCaseFootprint(caseItem, lab.stage)}</div>
        </div>
        <div class="case-chart-legend"><span><i class="legend-up"></i> 上涨柱</span><span><i class="legend-down"></i> 下跌柱</span><span><i class="legend-zone"></i> 候选区域</span><span>Delta = Ask − Bid</span></div>
      </div>
      <aside class="case-evidence-ledger">
        <div class="ledger-folio">EVIDENCE ${String(lab.stage + 1).padStart(2, '0')} / ${String(caseItem.stages.length).padStart(2, '0')}</div>
        <p class="eyebrow">${escapeHtml(stage.label)} / PAUSE & READ</p>
        <h2>${escapeHtml(stage.title)}</h2>
        <div class="case-prompt"><small>在打开分析前先回答</small><p>${escapeHtml(stage.prompt)}</p></div>
        ${lab.reveal ? html`
          <div class="evidence-reveal">
            <div><b>可观察事实</b><p>${escapeHtml(stage.observation)}</p></div>
            <div><b>分析</b><p>${escapeHtml(stage.analysis)}</p></div>
          </div>` : `<button class="reveal-evidence" type="button" id="reveal-evidence">揭示本阶段分析 ↓</button>`}
        <div class="case-stage-actions">
          <button type="button" id="case-prev" ${lab.stage === 0 ? 'disabled' : ''}>← 上一阶段</button>
          <button type="button" id="case-next" ${isFinal ? 'disabled' : ''}>${isFinal ? '已到最终阶段' : '下一阶段 →'}</button>
        </div>
      </aside>
    </section>
    <section class="case-thesis page-shell"><span>CASE THESIS</span><p>${escapeHtml(caseItem.thesis)}</p></section>
    ${isFinal ? renderCaseAnalysis(caseItem) : renderCaseLockedAnalysis(caseItem, lab.stage)}
  `;
  bindCasePlayer(caseItem);
}

function renderCaseChart(caseItem, end, layers) {
  const bars = caseItem.bars;
  const visible = bars.slice(0, end);
  const lows = bars.map((bar) => bar[2]);
  const highs = bars.map((bar) => bar[1]);
  const priceMin = Math.min(...lows);
  const priceMax = Math.max(...highs);
  const pricePad = Math.max((priceMax - priceMin) * 0.1, 0.25);
  const domainMin = priceMin - pricePad;
  const domainMax = priceMax + pricePad;
  const chart = { left: 72, right: 848, top: 24, bottom: 320 };
  const width = chart.right - chart.left;
  const xFor = (index) => chart.left + index * (width / Math.max(1, bars.length - 1));
  const yFor = (price) => chart.bottom - ((price - domainMin) / (domainMax - domainMin)) * (chart.bottom - chart.top);
  const candleWidth = Math.min(24, width / bars.length * 0.5);
  const maxDelta = Math.max(...bars.map((bar) => Math.abs(bar[4])), 1);
  const deltaBase = 425;
  const deltaHeight = 72;
  const zoneMarkup = layers.zones ? caseItem.layers.zones.filter((zone) => zone.start < end).map((zone) => {
    const x1 = xFor(zone.start);
    const x2 = xFor(Math.min(end - 1, zone.end));
    const y1 = yFor(zone.high);
    const y2 = yFor(zone.low);
    return `<g class="case-zone case-zone-${escapeHtml(zone.type)}"><rect x="${x1}" y="${y1}" width="${Math.max(12, x2 - x1)}" height="${Math.max(3, y2 - y1)}"/><text x="${x1 + 6}" y="${Math.max(chart.top + 12, y1 - 6)}">${escapeHtml(zone.label)}</text></g>`;
  }).join('') : '';
  const liquidityMarkup = layers.liquidity ? caseItem.layers.liquidity.filter((level) => level.start < end).map((level) => {
    const x1 = xFor(level.start);
    const x2 = xFor(Math.min(end - 1, level.end));
    const y = yFor(level.price);
    return `<g class="case-liquidity"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/><text x="${x1 + 4}" y="${y - 7}">${escapeHtml(level.label)}</text></g>`;
  }).join('') : '';
  const eventsMarkup = layers.structure ? caseItem.layers.events.filter((event) => event.index < end).map((event, index) => {
    const x = xFor(event.index);
    const y = yFor(event.price);
    const above = index % 2 === 0;
    return `<g class="case-event case-event-${escapeHtml(event.type)}"><circle cx="${x}" cy="${y}" r="5"/><line x1="${x}" y1="${y}" x2="${x}" y2="${above ? y - 34 : y + 34}"/><text x="${x + 6}" y="${above ? y - 38 : y + 46}">${escapeHtml(event.label)}</text></g>`;
  }).join('') : '';
  const candles = visible.map((bar, index) => {
    const [open, high, low, close] = bar;
    const rising = close >= open;
    const x = xFor(index);
    const yOpen = yFor(open);
    const yClose = yFor(close);
    const bodyTop = Math.min(yOpen, yClose);
    const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
    return `<g class="case-candle ${rising ? 'up' : 'down'}"><line x1="${x}" y1="${yFor(high)}" x2="${x}" y2="${yFor(low)}"/><rect x="${x - candleWidth / 2}" y="${bodyTop}" width="${candleWidth}" height="${bodyHeight}"/></g>`;
  }).join('');
  const deltaBars = layers.flow ? visible.map((bar, index) => {
    const delta = bar[4];
    const height = Math.abs(delta) / maxDelta * deltaHeight;
    const y = delta >= 0 ? deltaBase - height : deltaBase;
    return `<rect class="${delta >= 0 ? 'positive' : 'negative'}" x="${xFor(index) - candleWidth / 2}" y="${y}" width="${candleWidth}" height="${height}"/>`;
  }).join('') : '';
  const grid = Array.from({ length: 5 }, (_, index) => {
    const price = domainMax - index * ((domainMax - domainMin) / 4);
    const y = yFor(price);
    return `<line x1="${chart.left}" y1="${y}" x2="${chart.right}" y2="${y}"/><text x="8" y="${y + 4}">${price.toFixed(2)}</text>`;
  }).join('');
  return html`
    <svg class="case-chart-svg" viewBox="0 0 920 500" role="img" aria-label="${escapeHtml(caseItem.title)}，显示前 ${end} 根模拟 K 线">
      <g class="case-chart-gridlines">${grid}<line x1="${chart.left}" y1="${deltaBase}" x2="${chart.right}" y2="${deltaBase}"/><text x="8" y="${deltaBase + 4}">Δ 0</text></g>
      ${zoneMarkup}${liquidityMarkup}<g>${candles}</g>${eventsMarkup}
      ${layers.flow ? `<g class="case-delta-bars">${deltaBars}</g><text class="case-axis-label" x="${chart.left}" y="488">VOLUME DELTA · SIMULATED</text>` : '<text class="case-flow-disabled" x="460" y="420">成交图层已关闭</text>'}
      <line class="case-current-line" x1="${xFor(end - 1)}" y1="${chart.top}" x2="${xFor(end - 1)}" y2="${deltaBase + deltaHeight}"/>
      <text class="case-current-label" x="${Math.min(800, xFor(end - 1) + 8)}" y="18">NOW / ${String(end).padStart(2, '0')}</text>
    </svg>`;
}

function renderCaseFootprint(caseItem, stageIndex) {
  if (stageIndex < caseItem.flowStage) {
    return html`<div class="flow-lock"><span>FLOW LOCKED</span><b>先读价格结构</b><p>到第 ${caseItem.flowStage + 1} 阶段再揭示 Footprint，避免让成交颜色替你先下结论。</p></div>`;
  }
  const rows = caseItem.footprint;
  const maxVolume = Math.max(...rows.flatMap((row) => [row[1], row[2]]));
  return html`
    <div class="case-footprint-head"><span>FOOTPRINT SNAPSHOT</span><small>BID × ASK</small></div>
    <div class="case-footprint-table">
      <div class="cf-cell cf-head">PRICE</div><div class="cf-cell cf-head">BID</div><div class="cf-cell cf-head">ASK</div>
      ${rows.map(([price, bid, ask]) => `<div class="cf-cell cf-price">${price.toFixed(2)}</div><div class="cf-cell cf-bid ${bid > ask * 1.8 ? 'hot' : ''}" style="--strength:${Math.round(bid/maxVolume*100)}%">${bid}</div><div class="cf-cell cf-ask ${ask > bid * 1.8 ? 'hot' : ''}" style="--strength:${Math.round(ask/maxVolume*100)}%">${ask}</div>`).join('')}
    </div>
    <div class="case-footprint-note"><b>读法</b><p>数字表示该价位模拟主动卖出（Bid）与主动买入（Ask）成交量。高亮只代表比例极端，不自动代表方向。</p></div>`;
}

function renderCaseLockedAnalysis(caseItem, stageIndex) {
  const remaining = caseItem.stages.length - stageIndex - 1;
  return html`
    <section class="case-analysis-lock page-shell">
      <span>${String(remaining).padStart(2, '0')}</span>
      <div><p class="eyebrow">FULL DOSSIER LOCKED</p><h2>完整复盘还差 ${remaining} 个证据阶段</h2><p>逐步揭示可以降低后见之明。到达最终阶段后，事实、推断、失效、决策、陷阱与替代路径会同时打开。</p></div>
    </section>`;
}

function renderCaseAnalysis(caseItem) {
  const analysis = caseItem.analysis;
  return html`
    <section class="case-analysis page-shell">
      <header><div><p class="eyebrow">FULL CASE ANALYSIS</p><h2>完整复盘档案</h2></div><p>把事实和解释分栏，是为了防止一个熟悉的标签悄悄变成未经验证的结论。</p></header>
      <div class="analysis-grid">
        <article class="analysis-facts"><span>01 / FACTS</span><h3>直接可见</h3><ul>${analysis.facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('')}</ul></article>
        <article><span>02 / INFERENCE</span><h3>当前推断</h3><p>${escapeHtml(analysis.inference)}</p></article>
        <article><span>03 / INVALIDATION</span><h3>什么会证明错了</h3><p>${escapeHtml(analysis.invalidation)}</p></article>
        <article class="analysis-decision"><span>04 / DECISION</span><h3>执行结论</h3><p>${escapeHtml(analysis.decision)}</p></article>
        <article class="analysis-trap"><span>05 / COMMON TRAP</span><h3>最容易犯的错</h3><p>${escapeHtml(analysis.trap)}</p></article>
        <article><span>06 / ALTERNATIVE</span><h3>另一条解释路径</h3><p>${escapeHtml(analysis.alternative)}</p></article>
      </div>
      ${renderCaseDecisionCheck(caseItem)}
      <div class="case-next-dossier">${renderNextCaseLink(caseItem)}</div>
    </section>`;
}

function renderCaseDecisionCheck(caseItem) {
  const check = caseItem.decisionCheck;
  const existing = state.progress.quizResults?.[`case-${caseItem.id}`];
  return html`
    <div class="case-decision-check" data-case-check="${escapeHtml(caseItem.id)}">
      <div><p class="eyebrow">DECISION CHECK ${existing ? '· 已记录' : ''}</p><h3>${escapeHtml(check.question)}</h3></div>
      <div class="case-check-options">${check.choices.map((choice, index) => `<button type="button" data-case-answer="${index}"><span>${String.fromCharCode(65 + index)}</span>${escapeHtml(choice)}</button>`).join('')}</div>
      <p class="case-check-feedback">选择最符合事前规则的处理。</p>
    </div>`;
}

function renderNextCaseLink(caseItem) {
  const index = state.casebook.cases.findIndex((item) => item.id === caseItem.id);
  const next = state.casebook.cases[index + 1];
  return next
    ? `<a class="primary-button" href="#case/${escapeHtml(next.id)}">下一个案例：${escapeHtml(next.title)} →</a>`
    : '<a class="primary-button" href="#cases">返回案例目录 →</a>';
}

function bindCasePlayer(caseItem) {
  document.querySelectorAll('[data-case-stage]').forEach((button) => button.addEventListener('click', () => {
    state.caseLab.stage = Number(button.dataset.caseStage);
    state.caseLab.reveal = false;
    updateCasePlayer(caseItem);
  }));
  document.querySelectorAll('[data-layer]').forEach((button) => button.addEventListener('click', () => {
    const key = button.dataset.layer;
    state.caseLab.layers[key] = !state.caseLab.layers[key];
    updateCasePlayer(caseItem);
  }));
  document.querySelector('#reveal-evidence')?.addEventListener('click', () => {
    state.caseLab.reveal = true;
    updateCasePlayer(caseItem);
  });
  document.querySelector('#case-prev')?.addEventListener('click', () => {
    if (state.caseLab.stage > 0) {
      state.caseLab.stage -= 1;
      state.caseLab.reveal = false;
      updateCasePlayer(caseItem);
    }
  });
  document.querySelector('#case-next')?.addEventListener('click', () => {
    if (state.caseLab.stage < caseItem.stages.length - 1) {
      state.caseLab.stage += 1;
      state.caseLab.reveal = false;
      updateCasePlayer(caseItem);
    }
  });
  document.querySelectorAll('[data-case-answer]').forEach((button) => button.addEventListener('click', () => answerCaseCheck(caseItem, button)));
}

async function answerCaseCheck(caseItem, button) {
  const container = document.querySelector(`[data-case-check="${caseItem.id}"]`);
  if (!container || container.dataset.answered) return;
  container.dataset.answered = 'true';
  const selected = Number(button.dataset.caseAnswer);
  const correct = selected === caseItem.decisionCheck.answer;
  container.querySelectorAll('[data-case-answer]').forEach((option) => {
    const index = Number(option.dataset.caseAnswer);
    if (index === selected) option.classList.add(correct ? 'correct' : 'wrong');
    if (!correct && index === caseItem.decisionCheck.answer) option.classList.add('correct-answer');
  });
  container.querySelector('.case-check-feedback').textContent = `${correct ? '判断成立。' : '重新检查事前规则。'}${caseItem.decisionCheck.explanation}`;
  try {
    const result = await api('/api/progress', { method: 'POST', body: JSON.stringify({ quizId: `case-${caseItem.id}`, correct }) });
    state.progress = result.progress;
  } catch (error) { toast(error.message, 'error'); }
}

function glossaryTerms() {
  const query = state.glossarySearch.toLowerCase();
  return state.content.glossary.filter((term) => {
    const matchesTrack = state.glossaryFilter === 'all' || term.track === state.glossaryFilter;
    const detail = state.glossaryDetails.details?.[term.term];
    const detailText = detail ? `${detail.mechanism} ${(detail.recognition || []).join(' ')} ${detail.distinction} ${detail.application} ${detail.mistake}` : '';
    const haystack = `${term.term} ${term.alias} ${term.definition} ${detailText}`.toLowerCase();
    return matchesTrack && haystack.includes(query);
  });
}

function glossaryDestination(term) {
  const track = state.content.tracks.find((item) => item.id === term.track);
  const lessonId = glossaryLessonIds.get(term.term) || track?.lessonIds[0] || state.content.lessons[0].id;
  const lesson = state.content.lessons.find((item) => item.id === lessonId) || state.content.lessons[0];
  return lesson;
}

function glossaryRows(terms) {
  if (!terms.length) return '<div class="empty-state"><strong>没有匹配术语</strong><span>换一个关键词或分类。</span></div>';
  return terms.map((term, index) => {
    const lesson = glossaryDestination(term);
    const detail = state.glossaryDetails.details?.[term.term];
    return html`
      <article class="term-row">
        <span class="term-index">${String(index + 1).padStart(2, '0')} / ${term.track.toUpperCase()}</span>
        <h2><a class="term-link" href="#lesson/${escapeHtml(lesson.id)}" aria-label="学习 ${escapeHtml(term.term)}：前往课程《${escapeHtml(lesson.title)}》">${escapeHtml(term.term)}<small>${escapeHtml(term.alias)}</small><span>进入课程 →</span></a></h2>
        <div class="term-definition">
          <p>${escapeHtml(term.definition)}</p>
          ${detail ? html`
            <details class="term-detail">
              <summary><span>展开概念详解</span><small>机制 · 识别 · 区分 · 使用 · 误区</small><i aria-hidden="true">＋</i></summary>
              <div class="term-detail-panel">
                <section class="detail-mechanism"><small>01 · 它在描述什么</small><p>${escapeHtml(detail.mechanism)}</p></section>
                <section><small>02 · 怎么识别或计算</small><ol>${detail.recognition.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol></section>
                <section><small>03 · 和相近概念怎么区分</small><p>${escapeHtml(detail.distinction)}</p></section>
                <section><small>04 · 实际使用时看什么</small><p>${escapeHtml(detail.application)}</p></section>
                <section class="detail-mistake"><small>05 · 最容易误判什么</small><p>${escapeHtml(detail.mistake)}</p></section>
              </div>
            </details>` : ''}
          <a href="#lesson/${escapeHtml(lesson.id)}">相关课程 · ${escapeHtml(lesson.title)} <i>→</i></a>
        </div>
      </article>`;
  }).join('');
}

function updateGlossaryResults() {
  const terms = glossaryTerms();
  const resultCount = document.querySelector('#glossary-result-count');
  const list = document.querySelector('#glossary-list');
  if (resultCount) resultCount.textContent = `显示 ${terms.length} / ${state.content.glossary.length} 条`;
  if (list) list.innerHTML = glossaryRows(terms);
}

function renderGlossary() {
  const terms = glossaryTerms();
  app.innerHTML = html`
    <div class="page-shell glossary-page ${state.beginnerMode ? 'beginner-reading' : ''}">
      <header class="page-head"><div><p class="eyebrow">FIELD GLOSSARY / ${state.content.glossary.length} ENTRIES</p><h1>术语不是<br>护身符</h1></div><p class="head-copy">不同作者可能用不同名字描述相似事件，也可能用同一个名字指不同规则。先固定定义，再研究图表。</p></header>
      <div class="glossary-tools">
        <label class="search-box"><span class="skip-link">搜索术语</span><input id="term-search" type="search" inputmode="search" value="${escapeHtml(state.glossarySearch)}" placeholder="搜索 BOS、Delta、吸收…" autocomplete="off" spellcheck="false" aria-controls="glossary-list" aria-describedby="glossary-result-count"></label>
        <div class="filter-group" aria-label="术语分类">
          ${[['all','全部'],['foundation','零基础'],['smc','SMC / ICT'],['flow','ORDER FLOW']].map(([value,label]) => `<button type="button" data-filter="${value}" class="${state.glossaryFilter === value ? 'active' : ''}">${label}</button>`).join('')}
        </div>
      </div>
      <p class="glossary-result-count" id="glossary-result-count" aria-live="polite">显示 ${terms.length} / ${state.content.glossary.length} 条</p>
      <div class="glossary-list" id="glossary-list">${glossaryRows(terms)}</div>
    </div>`;
  const search = document.querySelector('#term-search');
  let composing = false;
  const applySearch = () => {
    state.glossarySearch = search.value;
    updateGlossaryResults();
  };
  search.addEventListener('compositionstart', () => { composing = true; });
  search.addEventListener('compositionend', () => { composing = false; applySearch(); });
  search.addEventListener('input', (event) => {
    if (composing || event.isComposing) return;
    applySearch();
  });
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    state.glossaryFilter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('active', item === button));
    updateGlossaryResults();
  }));
  scrollToTop();
}

function renderUpdates() {
  const { updates, sources } = state;
  const pending = updates.candidates.filter((item) => item.status === 'pending').length;
  app.innerHTML = html`
    <div class="page-shell">
      <header class="page-head"><div><p class="eyebrow">RESEARCH DESK / REVIEW FIRST</p><h1>知识更新台</h1></div><p class="head-copy">定时检查来源是否变化，把新增目录和正文指纹变化放入审核队列。外部网页不会直接改写课程。</p></header>
      <div class="updates-grid">
        <section class="updates-main">
          <div class="status-panel">
            <div><small>NEXT CHECK · EVERY ${escapeHtml(updates.intervalHours)}H</small><strong>${pending ? `${pending} 条待审核` : '队列已清理'}</strong><small>上次运行：${formatDate(updates.lastRunAt, true)} · ${escapeHtml(updates.lastRunReason || '—')}</small></div>
            <button class="primary-button" id="run-update" type="button" ${updates.running ? 'disabled' : ''}>${updates.running ? '检查中…' : '立即检查全部来源'}</button>
          </div>
          <div class="candidate-list">
            ${updates.candidates.length ? updates.candidates.map(renderCandidate).join('') : '<div class="empty-state"><strong>还没有更新候选</strong><span>第一次检查会建立来源基线；之后的变化才会进入这里。</span></div>'}
          </div>
        </section>
        <aside class="updates-aside">
          <p class="eyebrow">SOURCE HEALTH</p>
          <div class="source-health">
            ${sources.map((source) => {
              const snapshot = updates.snapshots[source.id];
              return html`<div class="health-row"><span class="health-dot ${escapeHtml(snapshot?.status || '')}"></span><b>${escapeHtml(source.title)}</b><small>${snapshot ? formatDate(snapshot.checkedAt) : '未检查'}</small></div>`;
            }).join('')}
          </div>
          <div class="add-source">
            <h3>扩展观察来源</h3>
            <form id="source-form">
              <input name="title" placeholder="来源名称（可选）" maxlength="120">
              <input name="url" type="url" placeholder="https://…" required>
              <button class="secondary-button" type="submit">加入定时检查</button>
            </form>
          </div>
          <div class="update-policy"><b>审核边界</b><br>${escapeHtml(state.content.meta.updatePolicy)}</div>
        </aside>
      </div>
    </div>`;
  document.querySelector('#run-update').addEventListener('click', runUpdates);
  document.querySelector('#source-form').addEventListener('submit', addSource);
  document.querySelectorAll('[data-review]').forEach((button) => button.addEventListener('click', () => reviewCandidate(button.dataset.review, button.dataset.status)));
  scrollToTop();
}

function renderCandidate(candidate) {
  return html`
    <article class="candidate-card">
      <header><div><h3>${escapeHtml(candidate.sourceTitle)}</h3><small>${formatDate(candidate.detectedAt, true)}</small></div><span class="status-badge ${escapeHtml(candidate.status)}">${escapeHtml(candidate.status)}</span></header>
      <p>${escapeHtml(candidate.summary)}</p>
      ${(candidate.addedHeadings?.length || candidate.removedHeadings?.length) ? html`
        <div class="heading-diff">
          <div><b>+ 新增目录</b><ul>${(candidate.addedHeadings || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('') || '<li>无</li>'}</ul></div>
          <div><b>− 移除目录</b><ul>${(candidate.removedHeadings || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('') || '<li>无</li>'}</ul></div>
        </div>` : ''}
      <div class="review-actions">
        <a class="text-button" href="${escapeHtml(candidate.url)}" target="_blank" rel="noreferrer">打开来源 ↗</a>
        ${candidate.status === 'pending' ? `<button class="accept" data-review="${escapeHtml(candidate.id)}" data-status="accepted">接受为写作线索</button><button data-review="${escapeHtml(candidate.id)}" data-status="dismissed">忽略变化</button>` : `<button data-review="${escapeHtml(candidate.id)}" data-status="pending">恢复待审核</button>`}
      </div>
    </article>`;
}

async function refreshBootstrap() {
  const payload = await api('/api/bootstrap');
  Object.assign(state, payload);
  updateHeaderProgress();
  updateBeginnerToggle();
}

async function runUpdates() {
  const button = document.querySelector('#run-update');
  button.disabled = true;
  button.textContent = '正在读取 7+ 个来源…';
  try {
    const result = await api('/api/updates/run', { method: 'POST', body: '{}' });
    await refreshBootstrap();
    const errors = result.results.filter((item) => item.status === 'error').length;
    toast(`来源检查完成${errors ? `，${errors} 个来源暂时无法读取` : ''}。`);
    renderUpdates();
  } catch (error) {
    toast(error.message, 'error');
    button.disabled = false;
    button.textContent = '重新检查';
  }
}

async function reviewCandidate(id, status) {
  try {
    await api(`/api/updates/${encodeURIComponent(id)}/review`, { method: 'POST', body: JSON.stringify({ status }) });
    await refreshBootstrap();
    toast(status === 'accepted' ? '已保留为课程写作线索；课文仍需人工编辑。' : status === 'dismissed' ? '已忽略该页面变化。' : '已恢复到待审核。');
    renderUpdates();
  } catch (error) { toast(error.message, 'error'); }
}

async function addSource(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  try {
    await api('/api/sources', { method: 'POST', body: JSON.stringify({ title: formData.get('title'), url: formData.get('url') }) });
    await refreshBootstrap();
    toast('新来源已加入；下次检查会建立基线。');
    renderUpdates();
  } catch (error) { toast(error.message, 'error'); }
}

function showProgressModal() {
  const percent = progressPercent();
  const done = completedSet();
  const modal = document.createElement('div');
  modal.className = 'progress-modal';
  modal.innerHTML = html`
    <section class="progress-card" role="dialog" aria-modal="true" aria-labelledby="progress-title">
      <header><div><p class="eyebrow">LEARNING RECORD</p><h2 id="progress-title">你的学习进度</h2></div><button class="close" type="button" aria-label="关闭">×</button></header>
      <div class="progress-big"><strong>${percent}%</strong><div><div class="progress-bar" style="--progress:${percent}%"><i></i></div><p>${done.size} / ${state.content.lessons.length} 个单元完成</p></div></div>
      <div class="progress-lessons">${state.content.lessons.map((lesson) => `<span class="${done.has(lesson.id) ? 'done' : ''}">${done.has(lesson.id) ? '✓' : '○'} ${escapeHtml(lesson.number)} ${escapeHtml(lesson.title)}</span>`).join('')}</div>
    </section>`;
  document.body.append(modal);
  const close = () => modal.remove();
  modal.querySelector('.close').addEventListener('click', close);
  modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
  modal.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  modal.querySelector('.close').focus();
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

async function initialize() {
  app.innerHTML = '<div class="loading"><div class="loading-mark">S/F</div></div>';
  try {
    await refreshBootstrap();
    route();
  } catch (error) {
    app.innerHTML = `<div class="fatal-error"><p class="eyebrow">SERVER CONNECTION</p><h1>课程数据没有载入</h1><p>${escapeHtml(error.message)}</p><p>请确认本地服务器仍在运行，然后刷新页面。</p></div>`;
  }
}

window.addEventListener('hashchange', route);
menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
document.querySelector('#open-progress').addEventListener('click', showProgressModal);
beginnerModeButton.addEventListener('click', toggleBeginnerMode);

initialize();
