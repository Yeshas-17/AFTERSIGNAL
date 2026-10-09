# AFTERSIGNAL — Prompt Engineering Protocol

> **ProtocolX Prompt Engineering Challenge Submission**  
> *Project*: AFTERSIGNAL  
> *Challenge*: "The Unread Problem — What Did I Miss?"  
> *Repository*: `/Users/yeshas/Desktop/AfterSignal`  

---

## 1. Project Objective

In modern asynchronous communication (Slack, WhatsApp, Discord, Teams), team members returning from absence face "The Unread Problem"—wading through hundreds of messages to find critical decisions, modified plans, and pending commitments. Standard AI summaries often suffer from hallucinated conclusions, ungrounded claims, loss of provenance, and privacy concerns when transmitting sensitive work chats to cloud LLM APIs.

**AFTERSIGNAL** addresses this problem as an evidence-first, privacy-conscious conversation intelligence micro-app. It ingests exported chat threads, identifies key conclusions through a deterministic analysis engine (with optional on-device LLM enhancement), grounds every finding directly in original source messages, highlights decision evolution over time (**Decision Drift**), tracks unresolved obligations (**Open Loop Matrix**), and performs analysis locally within the browser application.

---

## 2. Core Product Principles

1. **Evidence-First Grounding**: Every summary statement, decision, drift event, or open loop is strictly linked to explicit source message IDs, original text quotes, senders, and timestamps.
2. **Semantic Separation**: Confirmed decisions, revised decisions (decision drift), and open obligations (pending actions/unanswered questions) are kept semantically distinct. A confirmed decision mentioning a date is never misclassified as an open task.
3. **Deterministic Core with AI Enhancement**: A fast, deterministic JavaScript analysis engine handles pattern recognition, timeline ordering, and evidence extraction, ensuring 100% availability even when local AI models are unavailable or downloading.
4. **Local Payload Processing**: Conversation content remains in browser memory and local storage (`IndexedDB`). No chat text is sent to cloud AI APIs.
5. **Telemetry Transparency & Runtime Monitoring**: Low-confidence inferences are explicitly flagged. The Privacy Inspector audits browser resource activity using `PerformanceObserver`. *Note*: `PerformanceObserver` provides visibility into application-initiated resource calls, but cannot independently prove the total absence of all external network traffic across all browser layers or extensions.
6. **Explicit Execution Classification**: Transparently distinguishes deterministic in-memory JS analysis, client-side WebGPU/WASM inference (`@huggingface/transformers`), local REST endpoints (Ollama on `localhost`), and actual network model downloads.

---

## 3. Master Development Prompt

The following reusable master development prompt was used to guide the AI coding agent throughout the engineering of AFTERSIGNAL.

```markdown
You are pair-programming with the user as an expert AI coding assistant building AFTERSIGNAL, an evidence-first conversation intelligence micro-app.

CRITICAL INSTRUCTIONS:
1. CODE INSPECTION FIRST: Always inspect existing source code, schemas, and test suites before writing or modifying code. Never guess function signatures, variable names, or file paths.
2. PRESERVE WORKING FEATURES: Make minimal, focused modifications. Do not rewrite working ingestion algorithms, parser logic, or component architectures unless explicitly instructed.
3. MODULAR TYPESCRIPT ARCHITECTURE: Keep code strongly typed, modular, and cleanly separated between engine logic (`src/engine/`), state management (`src/store/`), and UI views (`src/components/`).
4. EVIDENCE PROVENANCE: Maintain strict linkage between analysis findings and source message metadata (message ID, sender, timestamp, raw text quote).
5. ACCURATE PRIVACY CLAIMS: Never claim "zero network traffic" or absolute privacy guarantees. Clearly distinguish deterministic JS analysis, client-side model inference, model downloads, and localhost calls. Explain that `PerformanceObserver` logs browser resource activity but cannot independently prove the absence of all external data transmission.
6. ADD REGRESSION TESTS: Every bug fix or engine modification must include automated Vitest regression tests. Never weaken or delete existing tests to pass builds.
7. EMPIRICAL VERIFICATION: Always run `npm run test` and `npm run build` after making changes. Never claim a check passed without executing the command.
```

---

## 4. Phased Development Protocol

AFTERSIGNAL was developed using a structured 5-phase iterative prompt engineering protocol.

> **Note on Reconstructed Prompts**: The prompts in Phases 1–4 are reconstructed development prompts based on the implementation history and design requirements. Phase 5 includes the actual historical prompt from development.

---

### Phase 1 — Foundation and Ingestion

#### Verified Implementation Details
- **Ingestion Parsers** (`src/engine/ingestion/chatParser.ts`): Implemented modular parsers supporting four input formats:
  - Custom JSON format (`ChatMessage[]` array with id, sender, timestamp, text).
  - Slack Export JSON (`user`, `ts`, `text`, `thread_ts`).
  - WhatsApp Text Exports (`[DD/MM/YY, HH:MM:SS] Sender: Message` and `MM/DD/YY, HH:MM - Sender: Message`).
  - Discord JSON exports (`author.username`, `timestamp`, `content`).
- **Relative Date Engine** (`src/engine/ingestion/chronoParser.ts`): Integrates `chrono-node` to parse expressions like *"tomorrow"*, *"next Friday"*, or *"in 2 hours"* relative to the **message timestamp**, not system clock time.
- **Core Types** (`src/types/index.ts`): Standardized `ChatMessage`, `AnalysisResult`, `DecisionItem`, `DriftItem`, and `OpenLoopItem`.

#### Reconstructed Phase 1 Development Prompt
```markdown
[RECONSTRUCTED DEVELOPMENT PROMPT — PHASE 1]

Goal: Build the foundation and multi-format chat ingestion pipeline for AFTERSIGNAL.

Requirements:
1. Create strong TypeScript interfaces in `src/types/index.ts` for `ChatMessage` (id, sender, timestamp, text, metadata).
2. Implement chat parsers in `src/engine/ingestion/chatParser.ts` supporting Custom JSON, Slack JSON exports, WhatsApp TXT logs, and Discord JSON.
3. Integrate `chrono-node` in `src/engine/ingestion/chronoParser.ts` to convert relative temporal phrases ("next Friday", "tomorrow", "by 5pm") into absolute ISO timestamps relative to the message timestamp.
4. Handle edge cases: malformed JSON, missing timestamps, duplicate message IDs, and empty lines.
5. Add unit test suites in `chatParser.test.ts` and `chronoParser.test.ts` covering all formats and edge cases.
```

---

### Phase 2 — Analysis Engine & Local AI

#### Verified Implementation Details
- **Decision Detection** (`src/engine/analysis/decisionDetector.ts`): Pattern-based heuristic classifier identifying confirmed decisions (e.g. *"We agreed to..."*, *"Let's go with..."*, *"Decision:"*) while filtering out suggestions or clarifying questions.
- **Decision Drift Engine** (`src/engine/analysis/decisionDrift.ts`): Analyzes chronological sequences of related topics to detect superseded decisions, status updates, or explicitly revised agreements.
- **Open Loop Tracker** (`src/engine/analysis/openLoopTracker.ts`): Classifies unresolved items into four quadrants:
  - Unanswered Questions
  - Pending Actions / Commitments
  - Unassigned Tasks
  - Deadlines & Promises
  - *Crucial Rule*: Checks `isExplicitDecision` to prevent confirmed decisions from leaking into open loop lists.
- **Evidence Validator** (`src/engine/evidence/evidenceValidator.ts`): Verifies finding quotes against raw transcript text and computes groundedness scores (0.0 to 1.0).
- **Local AI Layer** (`src/engine/ai/localAiRunner.ts`): Supports local on-device inference using `@huggingface/transformers` (`SmolLM2-360M-Instruct`) via WebGPU/WASM, or optional local Ollama instances (`http://localhost:11434`), falling back seamlessly to the deterministic engine.

#### Reconstructed Phase 2 Development Prompt
```markdown
[RECONSTRUCTED DEVELOPMENT PROMPT — PHASE 2]

Goal: Implement the deterministic analysis engine, evidence validator, and local AI fallback.

Requirements:
1. Create `decisionDetector.ts` to detect explicit decisions vs proposals/questions.
2. Create `decisionDrift.ts` to track chronological decision changes and superseded agreements over time.
3. Create `openLoopTracker.ts` to extract unanswered questions, pending tasks, unassigned needs, and deadlines. Ensure explicit decisions are NOT misclassified as open loops.
4. Create `evidenceValidator.ts` to calculate groundedness confidence scores and verify exact quote matches in raw text.
5. Create `localAiRunner.ts` integrating `@huggingface/transformers` for optional local LLM summarization with fallback to the deterministic engine.
6. Write unit and benchmark test suites in `decisionDetector.test.ts`, `decisionDrift.test.ts`, `openLoopTracker.test.ts`, `evidenceValidator.test.ts`, and `benchmarkRunner.test.ts`.
```

---

### Phase 3 — User Interface & Evidence Workbench

#### Verified Implementation Details
- **UI Architecture**: Single Page Application built with React, Vite, Lucide icons, and Tailwind CSS.
- **Five Interactive Views**:
  1. **Executive Catch-Up** (`CatchUpView.tsx`): High-level overview, metric cards, decision list, and confidence ratings.
  2. **Decision Drift** (`DriftView.tsx`): Visual interactive timeline showing initial vs. revised decisions.
  3. **Open Loop Matrix** (`OpenLoopView.tsx`): Four-quadrant matrix displaying unresolved obligations.
  4. **Evidence Drawer** (`EvidenceDrawer.tsx`): Slide-over transcript inspector with deep-linking, quote copying, and smooth auto-scroll to exact source messages.
  5. **Privacy Inspector** (`PrivacyView.tsx`): Live telemetry monitor logging browser resource entries and network status.
- **Navigation & State**: `Navbar.tsx` and Zustand store (`useAppStore.ts`).

#### Reconstructed Phase 3 Development Prompt
```markdown
[RECONSTRUCTED DEVELOPMENT PROMPT — PHASE 3]

Goal: Build a polished, responsive, dark-mode React UI for AFTERSIGNAL.

Requirements:
1. Implement a top navigation shell (`Navbar.tsx`) switching between Executive Catch-Up, Decision Drift, Open Loop Matrix, Evidence Workspace, and Privacy Inspector.
2. Create `CatchUpView.tsx` with high-level summary cards, decision list, and key metrics.
3. Create `DriftView.tsx` displaying decision revision timelines.
4. Create `OpenLoopView.tsx` showing the 4-quadrant open loop matrix.
5. Create `EvidenceDrawer.tsx` to display full transcript context, highlight source messages, allow quote copying, and auto-scroll on item selection.
6. Add integration tests in `ViewsIntegration.test.tsx` verifying navigation and view rendering.
```

---

### Phase 4 — Persistence & Local Storage

#### Verified Implementation Details
- **IndexedDB Storage Wrapper** (`src/engine/storage/indexedDb.ts`): Uses native browser `indexedDB` API with database `aftersignal_db` and object store `summaries`.
- **Saved Conversations**: Persists conversation metadata, raw chat messages, analysis results, and timestamps.
- **Operations**:
  - `saveSummary(summary)`: Saves or updates conversation without duplicate keys.
  - `getSavedSummaries()`: Fetches all saved summaries sorted by timestamp.
  - `deleteSummary(id)`: Deletes specified summary from IndexedDB.
  - `clearAllSummaries()`: Clears store.
- **UI Hydration**: `Navbar.tsx` displays saved summary count; `App.tsx` hydrates store on boot.

#### Reconstructed Phase 4 Development Prompt
```markdown
[RECONSTRUCTED DEVELOPMENT PROMPT — PHASE 4]

Goal: Implement browser-local persistence using IndexedDB.

Requirements:
1. Build `src/engine/storage/indexedDb.ts` to manage database `aftersignal_db` and store `summaries`.
2. Implement save, fetch, delete, and clear operations.
3. Integrate IndexedDB state with `useAppStore.ts` to enable saving active sessions, listing saved conversations in a modal, and restoring full session state.
4. Add confirmation dialogs for destructive deletions.
5. Write storage tests in `indexedDb.test.ts`.
```

---

### Phase 5 — Validation, Bug Investigation, and Final Hardening

#### Historical Development Prompt (Preserved verbatim from Phase 5 execution)

> *"AFTERSIGNAL — PHASE 5: VALIDATION, BUG INVESTIGATION, AND FINAL HARDENING"*
>
> *"Investigate the following observed behaviors before making changes:*
> 
> *1. EVIDENCE VIEW INTERACTIVITY: The Evidence view renders, but clicking anywhere in it produces no response. Inspect the intended UX, component wiring, event handlers, and evidence-selection state. Determine whether the view is intentionally read-only or whether interaction is missing. Implement clear interaction opening source message. Add regression tests.*  
> *2. SAVED COUNTER INCONSISTENCY: After importing Custom JSON and refreshing, navigation counter initially showed 0, but opening Saved showed 1. Investigate IndexedDB loading, app init, store hydration, and counter derivation. Fix and add regression tests.*  
> *3. DECISION VS. PENDING ACTION CLASSIFICATION: Confirmed decision mentioning a date must not automatically become an open obligation. Keep decision detection, decision drift, and open-loop tracking semantically distinct. Add focused tests.*  
> *4. PERSISTENCE AND IMPORT REGRESSION TESTS: Expand IndexedDB and import tests covering save/restore across reload, duplicate save, delete, missing/malformed records, and import format errors.*  
> *5. PRIVACY CLAIMS: Review all network-capable code paths. Clearly distinguish deterministic JS analysis, actual local model inference, model downloads, and localhost requests.*  
> *6. FINAL QUALITY CHECK: Run complete automated test suite and production build. Document results and limitations in README.md.*  
>
> *RULES: Inspect existing code before changing. Make minimal focused changes. Do not redesign UI or remove working features. Add regression tests. Report exact test and build results; never claim a check passed unless run."*

---

## 5. Testing and Evaluation

AFTERSIGNAL incorporates a benchmark evaluation suite (`src/test/benchmarkRunner.test.ts`) that runs 50 annotated synthetic conversation messages to evaluate precision, recall, and F1 metrics for decision detection and decision drift tracking.

### Benchmark Methodology
- **Ground Truth Corpus**: 50 pre-annotated test messages covering explicit decisions, proposals, ambiguous statements, decision revisions, questions, and open tasks.
- **Evaluation Engine**: Compares engine output against ground truth classifications without modifying ground truth labels.

### Measured Benchmark Results
*(Measured via `npm run test` on node v20.18.0 / Vitest)*

```text
=== BENCHMARK EVALUATION RESULTS (50 Annotated Messages) ===
Explicit Decisions: TP=7, FP=3, FN=0
Precision: 70.0% | Recall: 100.0% | F1: 82.4%

Decision Drift: TP=5, FP=2, FN=0
Precision: 71.4% | Recall: 100.0% | F1: 83.3%
```

> **Evaluation Disclaimer**: The reported metrics represent measured execution results on the 50-message benchmark corpus. They are diagnostic metrics for algorithm evaluation, not guaranteed accuracy rates for all real-world chat inputs.

---

## 6. Privacy Architecture & Telemetry Disclosures

AFTERSIGNAL distinguishes five distinct operational modes:

### Classification Matrix
1. **Deterministic JS Processing**: Operates entirely in browser memory. Initiates zero network requests.
2. **Actual Local Model Inference**: Runs client-side `@huggingface/transformers` in WebGPU or WebAssembly worker threads on the user's local hardware.
3. **Model Weight Downloads**: When local model mode is activated, model files are fetched over HTTPS from Hugging Face Hub (`huggingface.co`) into browser cache.
4. **Localhost Endpoint Requests**: Optional user-configured REST connections to local services (e.g. Ollama at `http://localhost:11434`).
5. **External Cloud Transmission**: The application design processes conversation text on-device without posting chat content to cloud LLM APIs.

### Telemetry & Monitoring Boundaries
- The Privacy Inspector uses browser `PerformanceObserver` APIs to track resource timing entries for fetch and XHR calls initiated within the page context.
- *Technical Disclosure*: `PerformanceObserver` provides visibility into page-level resource requests, but it cannot observe low-level browser networking, operating system sockets, or third-party browser extension activity, and therefore cannot independently establish the complete absence of all network transmission.

---

## 7. Lessons from Iterative Prompting

1. **Phase Isolation Prevents Scope Creep**: Breaking development into 5 strict phases (Ingestion $\rightarrow$ Engine $\rightarrow$ UI $\rightarrow$ Persistence $\rightarrow$ Hardening) prevented UI changes from distorting underlying data models.
2. **Explicit Verification Constraints**: Mandating that the AI assistant run `npm run test` and `npm run build` after every modification eliminated unverified success claims.
3. **Semantic Disambiguation Rules**: Adding explicit classification rules (e.g., checking `isExplicitDecision` in `openLoopTracker.ts`) prevented confirmed decisions from leaking into pending tasks.
4. **Interactive Evidence Traceability**: Requiring every finding to carry source message IDs enabled deep-linking and visual highlight scrolling in `EvidenceDrawer.tsx`.

---

## 8. Reusable Final Validation Prompt

The following prompt can be reused prior to any future release of AFTERSIGNAL to verify system integrity, persistence, privacy disclosures, and build quality.

```markdown
Run a complete pre-release validation audit for AFTERSIGNAL:

1. TEST SUITE EXECUTION: Run `npm run test`. Confirm all 40+ unit, integration, storage, and benchmark tests pass without failure.
2. PRODUCTION BUILD: Run `npm run build`. Confirm TypeScript compilation (`tsc`) and Vite bundling succeed with zero errors.
3. PERSISTENCE VERIFICATION: Verify IndexedDB save, hydration on boot, counter accuracy, restored state integrity, and deletion.
4. EVIDENCE INTEGRITY: Verify that all findings in Executive Catch-Up, Decision Drift, and Open Loop Matrix link to valid source message IDs and display raw quotes accurately in EvidenceDrawer.
5. PRIVACY AUDIT & DISCLOSURE: Confirm Privacy Inspector logs accurately distinguish deterministic JS, local WASM/WebGPU model inference, model weight downloads, and localhost calls, while documenting telemetry boundaries.
6. REPORT: List exact test results, build bundle sizes, and any unverified edge cases.
```

---

*AFTERSIGNAL — ProtocolX Prompt Engineering Challenge Submission*
