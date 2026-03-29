import type { SupplyItemState } from './types';
import {
  SUPPLY_CATALOG,
  SUPPLY_SECTIONS,
  buildSupplyShoppingList,
  computeSupplySnapshot,
  groupSupplyShoppingList,
  type SupplySection,
  type SupplySectionSummary,
  type SupplySnapshot,
} from './supply-domain';

export interface SupplySectionWithSummary {
  section: SupplySection;
  summary: SupplySectionSummary;
  items: SupplyModuleSnapshot[];
}

export interface SupplyModuleSnapshot extends SupplySnapshot {
  isTracked: boolean;
  estimatedUnitPrice: number | null;
  updatedAt: string | null;
}

export interface SupplyModuleData {
  stockById: Record<string, number>;
  priceById: Record<string, number>;
  snapshots: SupplyModuleSnapshot[];
  trackedSnapshots: SupplyModuleSnapshot[];
  criticalItems: SupplyModuleSnapshot[];
  warningItems: SupplyModuleSnapshot[];
  shoppingList: SupplyModuleSnapshot[];
  shoppingGroups: ReturnType<typeof groupSupplyShoppingList>;
  sectionSummaries: SupplySectionWithSummary[];
  totalEstimatedPurchase: number;
}

export function buildSupplyModuleData(states: SupplyItemState[]): SupplyModuleData {
  const stockById = Object.fromEntries(
    states.map((state) => [state.itemId, state.currentStock]),
  );
  const priceById = Object.fromEntries(
    states
      .filter((state) => (state.estimatedUnitPrice ?? 0) > 0)
      .map((state) => [state.itemId, state.estimatedUnitPrice ?? 0]),
  );
  const stateById = Object.fromEntries(states.map((state) => [state.itemId, state]));
  const trackedItemIds = new Set(states.map((state) => state.itemId));

  const snapshots: SupplyModuleSnapshot[] = SUPPLY_CATALOG.map((item) => ({
    ...computeSupplySnapshot(item, stockById[item.id] ?? 0, priceById[item.id] ?? null),
    isTracked: trackedItemIds.has(item.id),
    estimatedUnitPrice: priceById[item.id] ?? null,
    updatedAt: stateById[item.id]?.updatedAt ?? null,
  }));
  const trackedSnapshots = snapshots.filter((item) => item.isTracked);
  const snapshotById = new Map(snapshots.map((item) => [item.id, item]));
  const shoppingList = buildSupplyShoppingList(stockById, priceById)
    .filter((item) => trackedItemIds.has(item.id))
    .map((item) => snapshotById.get(item.id))
    .filter((item): item is SupplyModuleSnapshot => Boolean(item));
  const shoppingGroups = groupSupplyShoppingList(stockById, priceById).map((group) => ({
    ...group,
    items: group.items
      .filter((item) => trackedItemIds.has(item.id))
      .map((item) => snapshotById.get(item.id))
      .filter((item): item is SupplyModuleSnapshot => Boolean(item)),
  })).filter((group) => group.items.length > 0);
  const criticalItems = shoppingList.filter((item) => item.status === 'alert');
  const warningItems = shoppingList.filter((item) => item.status === 'warn');
  const sectionSummaries = SUPPLY_SECTIONS.map((section) => ({
    section,
    summary: summarizeTrackedSection(section.id, trackedSnapshots),
    items: snapshots.filter((item) => item.categoryId === section.id),
  }));
  const totalEstimatedPurchase = shoppingList.reduce(
    (total, item) => total + (item.estimatedTotalPrice ?? 0),
    0,
  );

  return {
    stockById,
    priceById,
    snapshots,
    trackedSnapshots,
    criticalItems,
    warningItems,
    shoppingList,
    shoppingGroups,
    sectionSummaries,
    totalEstimatedPurchase,
  };
}

function summarizeTrackedSection(sectionId: string, trackedSnapshots: SupplyModuleSnapshot[]): SupplySectionSummary {
  const sectionItems = trackedSnapshots.filter((item) => item.categoryId === sectionId);

  if (sectionItems.length === 0) {
    return {
      total: 0,
      ok: 0,
      warn: 0,
      alert: 0,
      toBuy: 0,
    };
  }

  return {
    total: sectionItems.length,
    ok: sectionItems.filter((item) => item.status === 'ok').length,
    warn: sectionItems.filter((item) => item.status === 'warn').length,
    alert: sectionItems.filter((item) => item.status === 'alert').length,
    toBuy: sectionItems.reduce((total, item) => total + item.targetToBuy, 0),
  };
}
