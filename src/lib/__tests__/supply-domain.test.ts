import { describe, expect, it } from 'vitest';

import {
  SUPPLY_CATALOG,
  buildSupplyShoppingList,
  computeSupplySnapshot,
  getSupplyItemById,
  groupSupplyShoppingList,
  summarizeSupplySection,
} from '../supply-domain';

describe('supply-domain', () => {
  it('computes recurring stock with days and warning status', () => {
    const item = getSupplyItemById('arroz-branco');

    expect(item).toBeDefined();

    const snapshot = computeSupplySnapshot(item!, 4);

    expect(snapshot.days).toBe(15);
    expect(snapshot.status).toBe('warn');
    expect(snapshot.targetToBuy).toBe(4);
  });

  it('computes contingency stock without days using min and ideal targets', () => {
    const item = getSupplyItemById('paracetamol');

    expect(item).toBeDefined();

    const snapshot = computeSupplySnapshot(item!, 1);

    expect(snapshot.days).toBeNull();
    expect(snapshot.status).toBe('warn');
    expect(snapshot.targetToBuy).toBe(1);
  });

  it('builds shopping list with quantity deltas and critical items first', () => {
    const baseline = Object.fromEntries(
      SUPPLY_CATALOG.map((item) => [item.id, item.idealStock]),
    );

    const list = buildSupplyShoppingList({
      ...baseline,
      'folhosas-feira': 1,
      paracetamol: 0,
      'arroz-branco': 4,
    });

    expect(list).toHaveLength(3);
    expect(list[0]?.id).toBe('folhosas-feira');
    expect(list[0]?.targetToBuy).toBe(4);
    expect(list[0]?.purchaseCycle).toBe('feira-semanal');
    expect(list[1]?.id).toBe('paracetamol');
    expect(list[1]?.targetToBuy).toBe(2);
    expect(list[2]?.id).toBe('arroz-branco');
    expect(list[2]?.targetToBuy).toBe(4);
  });

  it('keeps the catalog normalized enough for rendering and persistence', () => {
    expect(SUPPLY_CATALOG.length).toBeGreaterThanOrEqual(25);

    for (const item of SUPPLY_CATALOG) {
      expect(item.id).toBeTruthy();
      expect(item.categoryId).toBeTruthy();
      expect(item.unit).toBeTruthy();
      expect(typeof item.idealStock).toBe('number');
      expect(typeof item.minimumStock).toBe('number');
      expect(item.idealStock).toBeGreaterThanOrEqual(item.minimumStock);
      expect(['recurring', 'contingency']).toContain(item.stockMode);
      expect(Array.isArray(item.tags)).toBe(true);
    }
  });

  it('summarizes a section for fast operational decisions', () => {
    const baseline = Object.fromEntries(
      SUPPLY_CATALOG.map((item) => [item.id, item.idealStock]),
    );

    const summary = summarizeSupplySection('pantry', {
      ...baseline,
      'arroz-branco': 4,
      feijao: 0,
    });

    expect(summary.total).toBe(
      SUPPLY_CATALOG.filter((item) => item.categoryId === 'pantry').length,
    );
    expect(summary.alert).toBe(1);
    expect(summary.warn).toBe(1);
    expect(summary.toBuy).toBeGreaterThan(0);
  });

  it('groups shopping list by purchase cycle for execution', () => {
    const baseline = Object.fromEntries(
      SUPPLY_CATALOG.map((item) => [item.id, item.idealStock]),
    );

    const groups = groupSupplyShoppingList({
      ...baseline,
      'folhosas-feira': 1,
      paracetamol: 0,
      'arroz-branco': 4,
    });

    expect(groups).toHaveLength(3);
    expect(groups[0]?.cycle).toBe('feira-semanal');
    expect(groups[1]?.cycle).toBe('contingencia-rural');
    expect(groups[2]?.cycle).toBe('atacado-mensal');
    expect(groups[0]?.items[0]?.id).toBe('folhosas-feira');
  });
});
