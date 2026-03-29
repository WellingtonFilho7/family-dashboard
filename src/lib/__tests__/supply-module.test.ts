import { describe, expect, it } from 'vitest';

import type { SupplyItemState } from '../types';
import { buildSupplyModuleData } from '../supply-module';

describe('supply-module', () => {
  it('builds shopping, section summaries and highlights from persisted state', () => {
    const states: SupplyItemState[] = [
      {
        itemId: 'folhosas-feira',
        currentStock: 1,
        estimatedUnitPrice: 7.5,
        updatedAt: '2026-03-28T12:00:00.000Z',
      },
      {
        itemId: 'paracetamol',
        currentStock: 0,
        estimatedUnitPrice: 12,
        updatedAt: '2026-03-28T12:00:00.000Z',
      },
      {
        itemId: 'arroz-branco',
        currentStock: 4,
        estimatedUnitPrice: 6.5,
        updatedAt: '2026-03-28T12:00:00.000Z',
      },
    ];

    const moduleData = buildSupplyModuleData(states);

    expect(moduleData.shoppingGroups).toHaveLength(3);
    expect(moduleData.shoppingGroups[0]?.cycle).toBe('feira-semanal');
    expect(moduleData.criticalItems[0]?.id).toBe('folhosas-feira');
    expect(moduleData.criticalItems[1]?.id).toBe('paracetamol');
    expect(moduleData.warningItems.some((item) => item.id === 'arroz-branco')).toBe(true);
    expect(
      moduleData.sectionSummaries.find((summary) => summary.section.id === 'pantry')?.summary.warn,
    ).toBeGreaterThan(0);
    expect(moduleData.totalEstimatedPurchase).toBeGreaterThan(0);
  });
});
