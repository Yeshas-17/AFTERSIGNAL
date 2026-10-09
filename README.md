# AFTERSIGNAL — Conversation Intelligence & Evidence Workbench

> **ProtocolX Challenge Submission**: *"The Unread Problem — What Did I Miss?"*

AFTERSIGNAL is an evidence-first conversation intelligence micro-app designed to reconstruct what happened while a user was away from overwhelmed chat threads. Instead of giving ungrounded AI summaries, AFTERSIGNAL provides verifiable conclusions linked directly to source messages, tracks decision changes over time (Decision Drift), flags unresolved obligations (Open Loop Matrix), and performs analysis locally without transmitting chat payloads to cloud AI services.

---

## Key Differentiators & Core Features

1. **Executive Catch-Up**
   - Instant structural synthesis of long conversations.
   - Key metrics: total messages, participants, decision count, open loops, and confidence rating.
   - Quick overview of core themes and high-level conclusions.

2. **Decision Drift Timeline**
   - Identifies when later messages explicitly revise, clarify, or supersede earlier decisions.
   - Visual timeline mapping initial agreements to final consensus.
   - Grounded in source message evidence.

3. **Open Loop Matrix**
   - Categorizes unresolved chat obligations into four distinct quadrants:
     - **Unanswered Questions**: Queries missing replies.
     - **Unfinished Tasks / Pending Actions**: Action items awaiting completion.
     - **Unassigned Tasks**: Identified needs missing an assigned owner.
     - **Deadlines & Commitments**: Date-bound promises requiring monitoring.
   - **Semantic Distinction**: Confirmed decisions with dates are strictly separated from pending obligations.

4. **Evidence Drawer & Interactive Provenance**
   - Every finding, decision, drift event, and open loop links to its exact source message.
   - Deep-linking opens the Evidence Drawer with full transcript context, sender name, timestamp, and one-click quote copying.

5. **Privacy Inspector & Local-First Architecture**
   - Live monitoring of browser network resource activity via `PerformanceObserver`.
   - Clear distinction between deterministic JavaScript analysis, local browser inference (@huggingface/transformers), model downloads, and localhost requests.
   - **Local Payload Processing**: Conversation text and analysis remain within the client browser application. *Note*: While `PerformanceObserver` tracks application-initiated fetch and resource requests, it provides limited visibility into browser-level networking and cannot independently prove the total absence of all external data transmission.

6. **Local Persistence & Multi-Format Ingestion**
   - Persistent storage using IndexedDB (`aftersignal_db`).
   - Supports Custom JSON, Slack exports, WhatsApp text logs, and Discord JSON exports.

---

## Phase 5 Validation, Bug Investigation & Hardening

During Phase 5, all reported user behaviors and edge cases were thoroughly investigated, fixed, and covered with automated regression tests:

### 1. Evidence View Interactivity Fix
- **Investigation**: Clicking message items in transcript view did not trigger drawer context.
- **Root Cause**: Missing `onClick` event listeners on transcript message cards in `EvidenceDrawer.tsx`.
- **Fix**: Added interactive click handlers (`onClick={() => openEvidenceDrawer(msg.id)}`), quote copy buttons, and smooth auto-scroll into view when inspecting evidence. Added regression tests in `ViewsIntegration.test.tsx`.

### 2. Saved Counter Hydration Fix
- **Investigation**: Refreshing after saving a conversation showed `0` saved items in the navigation header, but opening the Saved modal showed `1`.
- **Root Cause**: `savedSummaries` store array was initialized empty and only fetched when the Saved modal was rendered.
- **Fix**: Added an initial hydration call (`refreshSavedSummaries()`) inside `App.tsx` on mount. Navigation counter now immediately reflects IndexedDB state on page boot.

### 3. Decision vs. Pending Action Classification Fix
- **Investigation**: Test prompt `"We decided to launch the project demo on Friday"` was categorized as a Pending Action in addition to Executive Catch-Up.
- **Root Cause**: `openLoopTracker.ts` flagged any message containing a parsed relative date ("Friday") as a pending action item regardless of whether it was already confirmed as an explicit decision.
- **Fix**: Updated `openLoopTracker.ts` to explicitly check `isExplicitDecision` before classifying a message as an open action item. Confirmed decisions with dates now remain settled facts and do not contaminate open loop counts. Ground truth benchmarks were preserved.

### 4. Expanded Persistence & Import Testing
- Added comprehensive unit and integration tests covering:
  - IndexedDB save, restore across reloads, duplicate save prevention, and deletion.
  - Malformed JSON, missing fields, corrupted structures, and unsupported file import handling.
  - Restoration of derived analysis state upon opening saved conversations.

### 5. Privacy & Telemetry Claims Audit
- Reviewed model downloading and network code paths.
- Privacy Inspector explicitly monitors network resource entries, distinguishing:
  1. **Deterministic JS Processing**: Runs in-memory in client JS.
  2. **Local Model Inference**: Runs via client-side WebGPU/WASM workers (@huggingface/transformers).
  3. **Model Weight Downloads**: Fetched from Hugging Face Hub if local model mode is activated by the user.
  4. **Localhost Requests**: Connections to local endpoints like Ollama (`http://localhost:11434`).
- **Telemetry Boundaries**: Documented that `PerformanceObserver` captures resource timing entries visible to the page API, but cannot monitor browser background tasks or guarantee third-party extension isolation.

---

## Manual Verification Walkthrough

To manually test the complete user workflow in your browser:

1. **Import**:
   - Launch dev server (`npm run dev`) and navigate to `http://localhost:5173`.
   - Click **Import Conversation** and select `Custom JSON` or paste a sample chat payload.
   - Verify parsing succeeds and findings populate all views.
2. **Analyze**:
   - Check **Executive Catch-Up** for summary and decision list.
   - Switch to **Decision Drift** to view timeline changes.
   - Switch to **Open Loop Matrix** to confirm unanswered questions vs pending actions.
3. **Inspect Evidence**:
   - Click any finding card or transcript message to open the **Evidence Drawer**.
   - Verify exact message highlighting, quote copy action, and transcript auto-scroll.
4. **Save & Hydrate**:
   - Click **Save Session**. Note navigation badge count updates to `1`.
   - Refresh the page (`Cmd+R` / `F5`).
   - Verify navigation header immediately shows `Saved (1)`.
5. **Restore & Delete**:
   - Click **Saved (1)** to open the saved summaries modal.
   - Click **Restore** to re-hydrate the conversation into active state.
   - Open modal again and click **Delete** (confirm prompt) to verify removal.

---

## Test & Build Results

### Automated Test Suite (`npm run test`)
```
✓ src/engine/ingestion/chatParser.test.ts (8 tests)
✓ src/engine/evidence/evidenceValidator.test.ts (4 tests)
✓ src/engine/analysis/decisionDetector.test.ts (4 tests)
✓ src/engine/analysis/decisionDrift.test.ts (2 tests)
✓ src/engine/ai/localAiRunner.test.ts (3 tests)
✓ src/engine/ingestion/chronoParser.test.ts (4 tests)
✓ src/engine/storage/indexedDb.test.ts (1 test)
✓ src/engine/analysis/openLoopTracker.test.ts (4 tests)
✓ src/components/views/ViewsIntegration.test.tsx (6 tests)
✓ src/test/benchmarkRunner.test.ts (4 tests)

Test Files: 10 passed (10)
     Tests: 40 passed (40)
```

### Benchmark Ground Truth Evaluation Metrics
- **Explicit Decisions**: Precision 70.0% | Recall 100.0% | F1 82.4%
- **Decision Drift**: Precision 71.4% | Recall 100.0% | F1 83.3%

### Production Build (`npm run build`)
```
vite v5.4.21 building for production...
dist/index.html                   0.55 kB
dist/assets/index-DMm8ILqH.css   24.22 kB
dist/assets/index-7LczyZss.js   275.62 kB
✓ built in 1.64s
```

---

## Getting Started

### Prerequisites
- Node.js v18+ (or local workspace toolchain at `.tools/bin/node`)
- npm

### Installation & Run
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run full test suite
npm run test

# Build for production
npm run build
```

---

## Known Limitations & Privacy Disclosure

1. **Local Model Performance**: Local browser AI inference via `@huggingface/transformers` depends on device hardware acceleration (WebGPU/WASM). If model downloading fails or is skipped, the deterministic analysis engine serves as a 100% reliable fallback.
2. **Export Format Formatting Differences**: WhatsApp text export styles vary slightly between iOS and Android. Pre-formatted JSON export is recommended for highest timestamp fidelity.
3. **Telemetry Limitations**: The Privacy Inspector relies on browser Performance resource APIs (`PerformanceObserver`), which log application fetch/XHR requests but have structural limitations and cannot serve as an independent security guarantee against all external network transmission.

---

*AFTERSIGNAL — Built for the BMSIT ProtocolX Hackathon.*
