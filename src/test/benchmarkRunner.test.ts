import { describe, it, expect } from 'vitest';
import benchmarkData from './fixtures/benchmark_dataset.json';
import { parseChatContent } from '../engine/ingestion/chatParser';
import { analyzeConversation } from '../engine/analysis/analysisEngine';

describe('Benchmark Ground Truth Evaluation & Precision/Recall Suite', () => {
  it('should contain 50 annotated benchmark messages across 5 scenarios', () => {
    expect(benchmarkData.messages.length).toBe(50);
    expect(benchmarkData.scenarios.length).toBe(5);
  });

  it('should evaluate engine predictions against ground truth and compute Precision and Recall', () => {
    const rawJson = JSON.stringify(benchmarkData.messages);
    const graph = parseChatContent(rawJson, 'CUSTOM_JSON');

    // Run deterministic analysis engine
    const results = analyzeConversation(graph);

    // Ground Truth Annotations
    const gtDecisions = benchmarkData.groundTruth.explicitDecisions;
    const gtDrift = benchmarkData.groundTruth.decisionDrift;

    // 1. Evaluate Explicit Decisions
    const predictedDecMsgIds = new Set(
      results.explicitDecisions.flatMap((f) => f.evidence.map((e) => e.messageId))
    );
    const gtDecMsgIds = new Set(gtDecisions.map((d) => d.messageId));

    let tpDec = 0;
    let fpDec = 0;

    predictedDecMsgIds.forEach((id) => {
      if (gtDecMsgIds.has(id)) {
        tpDec++;
      } else {
        fpDec++;
      }
    });

    const fnDec = gtDecMsgIds.size - tpDec;
    const precisionDec = tpDec + fpDec > 0 ? tpDec / (tpDec + fpDec) : 1;
    const recallDec = tpDec + fnDec > 0 ? tpDec / (tpDec + fnDec) : 0;
    const f1Dec = precisionDec + recallDec > 0 ? (2 * precisionDec * recallDec) / (precisionDec + recallDec) : 0;

    console.log(`\n=== BENCHMARK EVALUATION RESULTS (50 Annotated Messages) ===`);
    console.log(`Explicit Decisions: TP=${tpDec}, FP=${fpDec}, FN=${fnDec}`);
    console.log(`Precision: ${(precisionDec * 100).toFixed(1)}% | Recall: ${(recallDec * 100).toFixed(1)}% | F1: ${(f1Dec * 100).toFixed(1)}%`);

    // 2. Evaluate Decision Drift
    const predictedDriftMutatedIds = new Set(results.decisionDrift.map((d) => d.mutatedDecision.messageId));
    const gtDriftMutatedIds = new Set(gtDrift.map((d) => d.mutatedMessageId));

    let tpDrift = 0;
    let fpDrift = 0;

    predictedDriftMutatedIds.forEach((id) => {
      if (gtDriftMutatedIds.has(id)) {
        tpDrift++;
      } else {
        fpDrift++;
      }
    });

    const fnDrift = gtDriftMutatedIds.size - tpDrift;
    const precisionDrift = tpDrift + fpDrift > 0 ? tpDrift / (tpDrift + fpDrift) : 1;
    const recallDrift = tpDrift + fnDrift > 0 ? tpDrift / (tpDrift + fnDrift) : 0;

    console.log(`Decision Drift: TP=${tpDrift}, FP=${fpDrift}, FN=${fnDrift}`);
    console.log(`Precision: ${(precisionDrift * 100).toFixed(1)}% | Recall: ${(recallDrift * 100).toFixed(1)}%\n`);

    // Expectations for Benchmark Suite
    expect(results.explicitDecisions.length).toBeGreaterThan(0);
    expect(results.decisionDrift.length).toBeGreaterThan(0);
    expect(results.openLoops.length).toBeGreaterThan(0);
    expect(precisionDec).toBeGreaterThanOrEqual(0.7);
    expect(recallDec).toBeGreaterThanOrEqual(0.7);
  });

  it('should not treat suggestions as confirmed decisions', () => {
    const rawJson = JSON.stringify(benchmarkData.messages);
    const graph = parseChatContent(rawJson, 'CUSTOM_JSON');
    const results = analyzeConversation(graph);

    const suggestionIds = new Set(benchmarkData.groundTruth.suggestionsNotDecisions.map((s) => s.messageId));

    results.explicitDecisions.forEach((dec) => {
      dec.evidence.forEach((ev) => {
        expect(suggestionIds.has(ev.messageId)).toBe(false);
      });
    });
  });

  it('should verify 100% of generated findings contain valid evidence pointers matching imported graph', () => {
    const rawJson = JSON.stringify(benchmarkData.messages);
    const graph = parseChatContent(rawJson, 'CUSTOM_JSON');
    const results = analyzeConversation(graph);

    results.explicitDecisions.forEach((finding) => {
      expect(finding.evidence.length).toBeGreaterThan(0);
      finding.evidence.forEach((ptr) => {
        expect(graph.messageMap.has(ptr.messageId)).toBe(true);
        const originalText = graph.messageMap.get(ptr.messageId)!.content;
        expect(originalText.toLowerCase()).toContain(ptr.verbatimQuote.toLowerCase());
      });
    });
  });
});
