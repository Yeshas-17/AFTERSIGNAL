import { describe, it, expect } from 'vitest';
import { LocalAiRunner } from './localAiRunner';

describe('localAiRunner Module', () => {
  it('should initialize with IDLE state and fallback to deterministic mode without blocking', () => {
    const runner = new LocalAiRunner();
    const initialStatus = runner.getStatus();

    expect(initialStatus.state).toBe('IDLE');
    expect(initialStatus.runtimeMode).toBe('DETERMINISTIC_ONLY');
    expect(initialStatus.weightsLoaded).toBe(false);
  });

  it('should detect hardware runtime mode asynchronously without claiming model weights are loaded', async () => {
    const runner = new LocalAiRunner();
    const mode = await runner.detectLocalHardwareCapabilities();

    expect(['WEBGPU', 'WASM', 'OLLAMA_LOCAL', 'DETERMINISTIC_ONLY']).toContain(mode);
    const status = runner.getStatus();
    expect(status.state).toBe('CAPABILITY_DETECTED');
    expect(status.weightsLoaded).toBe(false);
  });

  it('should attempt initialization gracefully and update weightsLoaded status', async () => {
    const runner = new LocalAiRunner();
    const success = await runner.initializeLocalAi('HuggingFaceTB/SmolLM2-360M-Instruct');

    expect(typeof success).toBe('boolean');
    const status = runner.getStatus();
    expect(status.state).toBe('READY');
    expect(status.weightsLoaded).toBe(true);
    expect(status.inferenceActive).toBe(true);
  });
});
