import { describe, it, expect } from 'vitest';
import { useAppStore } from '../../store/useAppStore';

describe('Phase 4 Persistence & Privacy Integration Suite', () => {
  it('should initialize with ground-truth benchmark dataset and run deterministic analysis', () => {
    const state = useAppStore.getState();
    expect(state.conversation.messages.length).toBe(50);
    expect(state.analysis.explicitDecisions.length).toBeGreaterThan(0);
    expect(state.analysis.decisionDrift.length).toBeGreaterThan(0);
    expect(state.analysis.openLoops.length).toBeGreaterThan(0);
  });

  it('should allow switching demo datasets dynamically', () => {
    useAppStore.getState().loadDemoDataset('scenario_product_launch');
    const state = useAppStore.getState();
    expect(state.conversation.messages.length).toBe(10);
    expect(state.conversation.messages[0].senderName).toBe('Alice');
  });

  it('should open Evidence Drawer with targeted message ID when clicked', () => {
    useAppStore.getState().openEvidenceDrawer('msg_003', 'finding_1');
    const state = useAppStore.getState();
    expect(state.isEvidenceDrawerOpen).toBe(true);
    expect(state.selectedMessageId).toBe('msg_003');
    expect(state.selectedFindingId).toBe('finding_1');
  });

  it('should set importError when importing invalid or empty content', async () => {
    const success = await useAppStore.getState().importChatContent('');
    expect(success).toBe(false);
    expect(useAppStore.getState().importError).toContain('Cannot parse empty chat content');
  });

  it('should parse custom JSON format and analyze without AI dependencies', async () => {
    const customJson = JSON.stringify([
      { id: 'm100', sender: 'Tester', content: 'We decided on React.' },
    ]);
    const success = await useAppStore.getState().importChatContent(customJson, 'CUSTOM_JSON');
    expect(success).toBe(true);
    const state = useAppStore.getState();
    expect(state.conversation.messages.length).toBe(1);
    expect(state.analysis.explicitDecisions.length).toBe(1);
    expect(state.analysis.explicitDecisions[0].explanation).toBe('We decided on React.');
  });

  it('should control saved conversations modal state', () => {
    useAppStore.getState().setSavedModalOpen(true);
    expect(useAppStore.getState().isSavedModalOpen).toBe(true);

    useAppStore.getState().setSavedModalOpen(false);
    expect(useAppStore.getState().isSavedModalOpen).toBe(false);
  });
});
