# Task Plan: SMC / ICT / Order Flow Learning Server

## Goal

Build a polished local web server whose HTML learning interface teaches SMC/ICT and Order Flow from the user-supplied sources, tracks learning state, and supports reviewable scheduled knowledge updates.

## Next Step

Deployment complete on `43.160.244.246`: preserve the non-root systemd service, the `/opt/glearn` runtime checkout, and the local-only default listener for ordinary development.

## Current Phase

Phase 44 — complete (server deployment)

## Phases

### Phase 1: Source research and requirements

- [x] Inspect every supplied source
- [x] Extract concepts, cautions, and source metadata
- [x] Record implementation requirements and constraints
- **Status:** complete

### Phase 2: Architecture and experience design

- [x] Choose the smallest reliable local stack
- [x] Define course data, API, scheduler, and review workflow
- [x] Define the visual direction and responsive information architecture
- **Status:** complete

### Phase 3: Server and content implementation

- [x] Implement local server, APIs, persistence, and scheduling
- [x] Author sourced SMC/ICT and Order Flow learning modules
- [x] Add update-source inspection and approval workflow
- **Status:** complete

### Phase 4: Frontend implementation

- [x] Build responsive learning dashboard and lesson reader
- [x] Add diagrams, glossary, quizzes, progress tracking, and update center
- [x] Add accessibility and interaction polish
- **Status:** complete

### Phase 5: Verification and delivery

- [x] Run automated server/API/content tests
- [x] Render and visually inspect key responsive states
- [x] Fix issues, document setup and operating instructions
- **Status:** complete

### Phase 6: Deep case curriculum

- [x] Define six distinct synthetic market scenarios
- [x] Write fact → inference → invalidation → decision analysis for every scenario
- [x] Add misconceptions and scenario-specific decision checks
- **Status:** complete

### Phase 7: Interactive case laboratory

- [x] Add case-library and case-player routes
- [x] Build staged candlestick, structure, liquidity, zone, Delta, and footprint visual layers
- [x] Add layer toggles, progressive reveal, decision gate, and responsive layout
- **Status:** complete

### Phase 8: Case verification and delivery

- [x] Validate case data and JavaScript
- [x] Exercise every case stage and decision interaction in the browser
- [x] Inspect desktop/mobile visual states and update documentation
- **Status:** complete

### Phase 9: Beginner curriculum and source expansion

- [x] Verify beginner foundations against authoritative sources
- [x] Define a three-layer learning path: foundations → framework → evidence
- [x] Add plain-language explanations, analogies, reading order, and misconceptions
- [x] Reinforce the local-only `127.0.0.1` runtime boundary
- **Status:** complete

### Phase 10: Beginner content and learning aids

- [x] Add foundation lessons for candles, timeframes, order mechanics, data quality, and risk units
- [x] Expand the glossary and prerequisites for new learners
- [x] Add beginner guides to every existing SMC/ICT and Order Flow lesson
- [x] Add a beginner-mode preference without introducing accounts or cloud state
- **Status:** complete

### Phase 11: Interactive visual learning

- [x] Build interactive candle, timeframe, spread, data-quality, and R-multiple diagrams
- [x] Add a homepage roadmap and stronger visual hierarchy for first-time learners
- [x] Preserve the existing editorial market-manual visual language
- **Status:** complete

### Phase 12: Verification and handoff

- [x] Run automated tests and focused API checks
- [x] Verify desktop and mobile flows in the local browser
- [x] Check console health and reset test-induced learning progress
- [x] Update README and project notes
- **Status:** complete

### Phase 13: Advanced expansion research and curriculum design

- [x] Verify session, contract, liquidity, Volume Profile, auction-print, and DOM concepts
- [x] Define six lessons that extend the existing three-layer path without duplicating earlier material
- [x] Preserve the distinction between observable data, interpretive framework, and manipulation claims
- **Status:** complete

### Phase 14: Advanced lesson and glossary expansion

- [x] Expand the curriculum from 14 to 20 lessons
- [x] Add beginner guides and quizzes for all six new lessons
- [x] Expand the glossary and monitored source ledger
- **Status:** complete

### Phase 15: Advanced interactive visualizations

- [x] Build session, liquidity nesting, dealing-range, profile, auction-print, and DOM-motion diagrams
- [x] Integrate the new material into the existing editorial course navigation and homepage counts
- [x] Keep all visuals dependency-free and mobile responsive
- **Status:** complete

### Phase 16: Verification and handoff

- [x] Run content invariants, syntax checks, tests, and API checks
- [x] Browser-test all six new diagrams on desktop and mobile
- [x] Confirm local-only listener, console health, and clean learning progress
- [x] Update README and project notes
- **Status:** complete

### Phase 17: Martingale-grid research and curriculum boundary

- [x] Separate fixed-size grid, DCA, and Martingale position scaling
- [x] Verify grid-range, multiplier, leverage, liquidation, and funding-risk mechanics
- [x] Define the lesson as risk education rather than a bot recommendation or backtest
- **Status:** complete

### Phase 18: Martingale-grid lesson and visualization

- [x] Add one Foundation lesson, beginner guide, quiz, glossary terms, and source records
- [x] Build an interactive exposure ladder comparing fixed-size and multiplicative sizing
- [x] Update homepage counts and README without changing the local-only architecture
- **Status:** complete

### Phase 19: Martingale-grid verification

- [x] Run content, syntax, test, and bootstrap checks
- [x] Browser-test the simulator on desktop and mobile
- [x] Confirm console health and clean learning progress
- **Status:** complete

### Phase 20: Stop and risk/reward research

- [x] Verify the dependency between stop location, position size, risk budget, and risk/reward ratio
- [x] Record stop-order execution limitations and layered-position formulas
- [x] Define the addition as planned-price math rather than guaranteed execution
- **Status:** complete

### Phase 21: Integrated stop/target visualization

- [x] Add stop and target controls to the existing Martingale ladder
- [x] Show total risk at stop, reward at target, and reward/risk ratio for the full layered position
- [x] Expand lesson, beginner guide, glossary, sources, and README
- **Status:** complete

### Phase 22: Stop/target verification

- [x] Run content, syntax, test, and API checks
- [x] Browser-test stop/target rerenders on desktop and mobile
- [x] Confirm console health, local-only listener, and clean progress
- **Status:** complete

### Phase 23: Glossary interaction diagnosis and design

- [x] Confirm the search input is destroyed and recreated on every `input` event
- [x] Define a stable-input result-update path that waits for IME composition to commit
- [x] Define specific term-to-lesson destinations with track-level fallbacks
- **Status:** complete

### Phase 24: IME-safe search and lesson links

- [x] Keep the search input mounted while filtering result rows
- [x] Add composition-aware event handling and live result feedback
- [x] Make each glossary term a descriptive lesson link with responsive styling
- **Status:** complete

### Phase 25: Glossary verification

- [x] Run syntax, test, and whitespace checks
- [x] Browser-test Chinese search, term navigation, desktop, and mobile layouts
- [x] Confirm unchanged local-only runtime behavior and clean interaction flow
- **Status:** complete

### Phase 26: Strategy evaluation research and curriculum design

- [x] Verify planned reward/risk, costs, performance-claim, and backtest limitations against authoritative sources
- [x] Separate single-trade planned ratio from strategy-level realized expectancy
- [x] Define formulas for expectancy, break-even win rate, minimum required average win, and cost-aware position sizing
- **Status:** complete

### Phase 27: Expectancy lesson and interactive calculator

- [x] Expand the existing `1R` lesson, beginner guide, glossary, and source ledger
- [x] Build a responsive calculator for win rate, average win/loss, costs, and target expectancy
- [x] Show contribution math and conservative pre-trade workflow in the existing editorial visual system
- **Status:** complete

### Phase 28: Expectancy verification

- [x] Run content, syntax, test, API, and whitespace checks
- [x] Browser-test default and stressed calculations on desktop and mobile
- [x] Confirm local-only listener, clean progress, and no horizontal overflow
- **Status:** complete

### Phase 29: Detailed concept model and research

- [x] Define one consistent five-part explanation model for all 62 glossary terms
- [x] Verify order, risk, profile, and order-flow explanations against authoritative references
- [x] Keep framework vocabulary explicitly separated from directly observable market data
- **Status:** complete

### Phase 30: Expand every glossary knowledge point

- [x] Add a curated detail artifact covering every glossary term
- [x] Render expandable mechanism, recognition/calculation, distinction, application, and misconception sections
- [x] Include detailed text in IME-safe search while retaining lesson links
- **Status:** complete

### Phase 31: Beginner reading and focus mode

- [x] Increase lesson and translation-layer typography only while beginner mode is active
- [x] Add an accessible collapsible course directory with a full-width focused reading state
- [x] Persist the directory preference in browser-local storage and support mobile layouts
- **Status:** complete

### Phase 32: Verification and handoff

- [x] Run content coverage, syntax, tests, API, and whitespace checks
- [x] Browser-test detailed terms, Chinese search, sidebar persistence, desktop, and mobile layouts
- [x] Confirm local-only listener and a clean browser console
- **Status:** complete

### Phase 33: Lesson-depth curriculum design

- [x] Audit all 21 lessons for current section depth and case coverage
- [x] Define one reusable long-form explanation and two-case schema per lesson
- [x] Verify representative case mechanics and preserve fact/inference boundaries
- **Status:** complete

### Phase 34: Twenty-one deep lesson guides

- [x] Add curated deep-dive content for every lesson
- [x] Cover mechanism, reading process, concept boundary, and practice checklist
- [x] Add at least two contrasting synthetic micro-cases per lesson
- **Status:** complete

### Phase 35: Lesson casebook interface

- [x] Integrate long-form explanations and micro-cases into the existing course reader
- [x] Keep cases visually distinct, step-by-step, accessible, and mobile responsive
- [x] Preserve existing interactive diagrams, quizzes, focus mode, and progress behavior
- **Status:** complete

### Phase 36: Deep-course verification

- [x] Validate exact 21-lesson and 42-case coverage
- [x] Run syntax, tests, bootstrap, and local-listener checks
- [x] Browser-test representative Foundation, SMC, and Order Flow lessons on desktop and mobile
- **Status:** complete

### Phase 37: DFS round 1 — liquidity as an execution problem

- [x] Choose the root path: order execution → liquidity → sweep versus acceptance
- [x] Verify liquidity and order-execution mechanics against current CME and Investor.gov material
- [x] Add one textbook-style chapter with at least 1,800 Chinese characters, three case types, misconceptions, exercises, and knowledge-tree navigation
- [x] Integrate the long-form renderer and responsive editorial reading treatment
- [x] Verify content contract, local API, desktop/mobile rendering, and record the next DFS branch
- **Status:** complete

### Phase 38: DFS round 2 — acceptance and rejection evidence

- [x] Follow round 1's next branch without resetting the tree
- [x] Refresh Volume Profile/TPO calculation and data-boundary evidence
- [x] Add one complete textbook-style chapter and three case types
- [x] Verify and log the next branch
- **Status:** complete

### Phase 39: DFS round 3 — structure confirmation after liquidity events

- [x] Continue from acceptance/rejection into BOS, CHoCH, and displacement evidence
- [x] Add one complete textbook-style chapter and three case types
- [x] Verify and log the next branch
- **Status:** complete

### Phase 40: DFS round 4 — zone formation and mitigation

- [x] Continue into Order Block, FVG, breaker, and mitigation boundaries
- [x] Add one complete textbook-style chapter and three case types
- [x] Verify and log the next branch
- **Status:** complete

### Phase 41: DFS round 5 — order-flow confirmation and risk translation

- [x] Connect the full SMC path to Footprint/Delta evidence and explicit risk decisions
- [x] Add one complete textbook-style chapter and three case types
- [x] Run final five-round cross-check and stop the automation
- **Status:** complete

### Phase 42: Worked-case instance diagrams

- [x] Audit the exact `WORKED CASES · 教学模拟` section and all long-chapter casebooks
- [x] Add one reusable, accessible SVG diagram system covering 42 micro-cases and 15 textbook cases
- [x] Verify semantic captions, desktop/mobile layout, visual distinctions, and existing content contracts
- **Status:** complete

### Phase 43: Beginner terminology comprehension

- [x] Rewrite the candle-language chapter overview so every first-use term is explained in Chinese
- [x] Add an inline OHLC numerical example and a plain-language reading sequence
- [x] Turn chapter takeaways into explanatory rows rather than unexplained jargon fragments
- [x] Extend the terminology primer across all 21 lessons using the curated local glossary
- [x] Verify the redesigned chapter overview on desktop and mobile at `127.0.0.1`
- **Status:** complete

### Phase 44: Public server deployment

- [x] Inspect the remote OS, repository state, Node runtime, firewall, service manager, and port 4173
- [x] Add an opt-in host binding and a hardened systemd unit without changing the local default
- [x] Push the deployment revision to GitHub and update the remote checkout
- [x] Install the application under `/opt/glearn` with a dedicated `glearn` system user
- [x] Open TCP 4173, start and enable the service, then verify restart and server-local HTTP access
- [x] Confirm through local SSH that the remote egress address is `43.160.244.246`
- **Status:** complete

## Key Questions

1. Which supplied pages are accessible and what concepts can be responsibly synthesized from them?
2. How can periodic updates remain useful without automatically publishing unverified financial content?
3. What dependency footprint best fits a local-first learning server?

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Updates enter a review queue before publication | External source changes should not silently alter educational material |
| Educational material includes explicit risk and data limitations | SMC/ICT and Order Flow are interpretive frameworks, not guaranteed signals |
| Use Node's built-in HTTP server and fetch | Keeps local installation dependency-free while supporting static assets, JSON persistence, and source checks |
| Bind to `127.0.0.1` by default | The learning and review APIs should not be exposed to the network accidentally |
| Use an editorial “market field manual” visual system | Differentiates the product from generic neon trading dashboards and supports sustained reading |
| Use synthetic, explicitly labeled case data | Teaches repeatable reasoning without implying that cherry-picked historical charts validate a strategy |
| Separate facts, interpretations, and decisions in each case | Prevents SMC labels from being presented as direct evidence and makes alternative readings visible |
| Progressive chart reveal with optional layers | Forces observation before hindsight and lets learners isolate structure, liquidity, zones, and flow |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| Browser local runner does not support the `networkidle` wait state | 1 | Use the supported `load` state and a fresh DOM snapshot |
| Browser locator wait missed elements replaced by the update-page rerender | 1 | Read the fresh DOM and row classes after completion; all seven sources were `ok` |
| Browser scroll point landed outside the narrow in-app viewport | 1 | Retarget scrolling to the center of the visible content area |
| Semantic locator “流动性” matched both a stage and a layer toggle | 1 | Target the explicit `data-layer="liquidity"` control |
| Mobile SVG geometry evaluation timed out although the fresh DOM exposed the chart | 2 | Stop using SVG `evaluate`; use DOM presence plus visual screenshots and horizontal-scroll CSS inspection |
| Combined test/README patch used a README line that did not exist verbatim | 1 | Inspect the actual README section and split the additions into exact patches |
| One broad semantic browser interaction timed out while chaining several rerenders | 1 | Resolve fresh `data-*` locators after each rerender and verify each interaction independently |
| Batched web `find` against stale source references returned an internal error | 1 | Stop using stale result IDs; open the supplied source URLs directly or rely on already verified summaries |
| Browser range-control keyboard and coordinate attempts did not change values | 4 | Use the browser's supported `fill()` operation for native range inputs; it dispatches the input event and verifies exact values |
| Browser locator did not expose `boundingBox()` or `scrollIntoViewIfNeeded()` | 2 | Let the supported form interaction bring the control into view, then use a screenshot for visual inspection |
| Browser scroll call used `deltaY` instead of the local API's `scrollY` field | 1 | Use the required `x`, `y`, `scrollX`, and `scrollY` fields for subsequent mobile inspection |
| Browser page object did not expose a `domcontentloaded()` helper | 1 | Let navigation complete, pause briefly for the local bootstrap render, then evaluate the resulting DOM |
| Final `jq -e` expression applied `length` to a boolean because the case-count subexpression lacked parentheses | 1 | Parenthesize `(.chapters[\"structure-language\"].cases | length) == 3` and rerun the final contract check |
| Phase 43 planning patch assumed `progress.md` started with `# Progress` | 1 | Read the actual headings and reapplied small patches against exact file context |
| Browser element screenshot helper required coordinates instead of a CSS selector | 1 | Scrolled the target section into view and captured the viewport with the supported tab screenshot method |
| First terminology route sweep queried `data-lesson` but the directory uses `data-lesson-id` | 1 | Inspected one rendered navigation button and reran the sweep with the real attribute |
| One browser inspection expression missed a closing parenthesis | 1 | Split the value into a named variable, emitted it separately, and continued with the corrected selector |
| Browser locator did not provide an `allInnerTexts()` convenience method | 1 | Read the representative term cards individually with `nth(i).innerText()` |
| The first service launch returned `203/EXEC` for `/usr/local/bin/node` | 1 | The path was a symlink into root-only `/root/.hermes`; stop the restart loop, install the CentOS Node 22 system package, and use `/usr/bin/node` for the non-root service |
| Whole-host `systemd-analyze verify` reported an unrelated malformed `wg-performance.service` | 1 | Leave the pre-existing unrelated service untouched and validate Glearn through its own status, journal, security report, listener, and HTTP responses |
| Initial external HTTP checks connected but received no response, while the server's public-IP self-check timed out | 2 | Confirmed the application and host firewall locally; user then removed external reachability from scope, so cloud-path diagnosis was stopped without changing cloud networking |
| First post-restart check reached `active` before the Node listener was ready | 1 | Use a bounded local HTTP readiness loop, then verify listener, page, API, process identity, and Git revision together |

## Notes

- Preserve source attribution and summarize rather than copying long passages.
- Keep core local use operational without paid APIs or external databases.
