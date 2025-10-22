import { describe, it, expect } from 'vitest';
import { offlineScript } from './offlineScript';

describe('offlineScript', () => {
  it('includes tour, community, and valuation steps', () => {
    const actions = offlineScript.map((step) => step.action);
    expect(actions).toContain('moveToHouse');
    expect(actions).toContain('showCommunity');
    expect(actions).toContain('showValuation');
  });

  it('executes within the six-minute target window', () => {
    const totalDuration = Math.max(...offlineScript.map((step) => step.delay));
    expect(totalDuration).toBeLessThan(6 * 60 * 1000);
  });
});
