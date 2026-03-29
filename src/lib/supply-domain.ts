import {
  SUPPLY_CATALOG as GENERATED_SUPPLY_CATALOG,
  SUPPLY_PURCHASE_CYCLE_LABELS as GENERATED_SUPPLY_PURCHASE_CYCLE_LABELS,
  SUPPLY_SECTIONS as GENERATED_SUPPLY_SECTIONS,
} from './supply-catalog.generated';

const SUPPLY_STATUS_META = {
  ok: { label: 'Verde', icon: '✓', className: 'badge-ok', rank: 2 },
  warn: { label: 'Amarelo', icon: '▲', className: 'badge-warn', rank: 1 },
  alert: { label: 'Vermelho', icon: '●', className: 'badge-alert', rank: 0 },
} as const;

export type SupplyStatus = keyof typeof SUPPLY_STATUS_META;
export type SupplyPurchaseCycle = keyof typeof GENERATED_SUPPLY_PURCHASE_CYCLE_LABELS;
export type SupplyNumericMap = Record<string, number | string | null | undefined>;

export interface SupplySection {
  id: string;
  label: string;
  icon: string;
  type: string;
  title: string;
  subtitle: string;
  alertBody: string;
}

export interface SupplyCatalogItem {
  id: string;
  categoryId: string;
  group: string;
  label: string;
  note: string;
  unit: string;
  monthlyUsage: number;
  minimumStock: number;
  idealStock: number;
  shelfLife: string;
  purchaseCycle: SupplyPurchaseCycle;
  stockMode: 'recurring' | 'contingency';
  priority: number;
  highlight?: boolean;
  step?: number;
  tags: string[];
}

export interface SupplySnapshot extends SupplyCatalogItem {
  current: number;
  days: number | null;
  coverage: string;
  targetToBuy: number;
  status: SupplyStatus;
  statusLabel: string;
  statusClassName: string;
  statusRank: number;
  purchaseCycleLabel: string;
  stockTargetLabel: string;
  targetToBuyLabel: string | null;
  estimatedTotalPrice: number | null;
}

export interface SupplyShoppingGroup {
  cycle: SupplyPurchaseCycle;
  label: string;
  items: SupplySnapshot[];
}

export interface SupplySectionSummary {
  total: number;
  ok: number;
  warn: number;
  alert: number;
  toBuy: number;
}

export const SUPPLY_CATALOG: SupplyCatalogItem[] = GENERATED_SUPPLY_CATALOG.map((item) => ({
  ...item,
  tags: [...item.tags],
}));
export const SUPPLY_SECTIONS: SupplySection[] = GENERATED_SUPPLY_SECTIONS.map((section) => ({ ...section }));
export const SUPPLY_PURCHASE_CYCLE_LABELS = GENERATED_SUPPLY_PURCHASE_CYCLE_LABELS;

export function normalizeSupplyNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function roundToStep(value: number, step: number) {
  if (!step || step <= 0) return value;
  return Math.ceil(value / step) * step;
}

export function getSupplyInputStep(item: SupplyCatalogItem) {
  if (typeof item.step === 'number') return item.step;
  if (['kg', 'L', 'maços'].includes(item.unit)) return 0.5;
  return 1;
}

export function formatSupplyNumber(value: number) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace('.', ',');
}

export function formatSupplyQuantity(value: number, unit: string) {
  return `${formatSupplyNumber(value)} ${unit}`;
}

export function getSupplyItemById(itemId: string) {
  return SUPPLY_CATALOG.find((item) => item.id === itemId);
}

export function getSupplyItemsBySection(sectionId: string) {
  return SUPPLY_CATALOG.filter((item) => item.categoryId === sectionId);
}

function computeSupplyStatus(current: number, minimum: number, ideal: number): SupplyStatus {
  if (current >= ideal) return 'ok';
  if (current >= minimum) return 'warn';
  return 'alert';
}

export function computeSupplySnapshot(
  item: SupplyCatalogItem,
  rawCurrent: unknown,
  rawEstimatedUnitPrice?: unknown,
): SupplySnapshot {
  const current = normalizeSupplyNumber(rawCurrent);
  const estimatedUnitPrice = normalizeSupplyNumber(rawEstimatedUnitPrice);
  const status = computeSupplyStatus(current, item.minimumStock, item.idealStock);
  const targetToBuy = roundToStep(Math.max(item.idealStock - current, 0), getSupplyInputStep(item));
  const meta = SUPPLY_STATUS_META[status];

  let days: number | null = null;
  let coverage = 'Reserva manual';

  if (item.stockMode === 'recurring' && item.monthlyUsage > 0) {
    days = Math.round((current / item.monthlyUsage) * 30);
    coverage = current > 0 ? `${days}d` : '0d';
  } else {
    coverage = `${formatSupplyQuantity(current, item.unit)} em casa`;
  }

  return {
    ...item,
    current,
    days,
    coverage,
    targetToBuy,
    status,
    statusLabel: `${meta.icon} ${meta.label}`,
    statusClassName: meta.className,
    statusRank: meta.rank,
    purchaseCycleLabel: SUPPLY_PURCHASE_CYCLE_LABELS[item.purchaseCycle] ?? item.purchaseCycle,
    stockTargetLabel: `${formatSupplyQuantity(item.minimumStock, item.unit)} min · ${formatSupplyQuantity(item.idealStock, item.unit)} ideal`,
    targetToBuyLabel: targetToBuy > 0 ? formatSupplyQuantity(targetToBuy, item.unit) : null,
    estimatedTotalPrice: estimatedUnitPrice > 0 && targetToBuy > 0 ? estimatedUnitPrice * targetToBuy : null,
  };
}

export function buildSupplyShoppingList(stockById: SupplyNumericMap, priceById: SupplyNumericMap = {}) {
  return SUPPLY_CATALOG
    .map((item) => computeSupplySnapshot(item, stockById[item.id] ?? 0, priceById[item.id] ?? null))
    .filter((item) => item.status !== 'ok' && item.targetToBuy > 0)
    .sort((left, right) => {
      if (left.statusRank !== right.statusRank) return left.statusRank - right.statusRank;
      if (left.priority !== right.priority) return right.priority - left.priority;
      return left.label.localeCompare(right.label, 'pt-BR');
    });
}

export function groupSupplyShoppingList(stockById: SupplyNumericMap, priceById: SupplyNumericMap = {}): SupplyShoppingGroup[] {
  const cycleRank: Record<SupplyPurchaseCycle, number> = {
    'feira-semanal': 0,
    'contingencia-rural': 1,
    'atacado-mensal': 2,
  };

  const groups = buildSupplyShoppingList(stockById, priceById).reduce<Record<string, SupplyShoppingGroup>>((accumulator, item) => {
    if (!accumulator[item.purchaseCycle]) {
      accumulator[item.purchaseCycle] = {
        cycle: item.purchaseCycle,
        label: item.purchaseCycleLabel,
        items: [],
      };
    }

    accumulator[item.purchaseCycle]?.items.push(item);
    return accumulator;
  }, {});

  return Object.values(groups).sort(
    (left, right) => (cycleRank[left.cycle] ?? 99) - (cycleRank[right.cycle] ?? 99),
  );
}

export function summarizeSupplySection(sectionId: string, stockById: SupplyNumericMap): SupplySectionSummary {
  const snapshots = getSupplyItemsBySection(sectionId).map((item) =>
    computeSupplySnapshot(item, stockById[item.id] ?? 0),
  );

  return {
    total: snapshots.length,
    ok: snapshots.filter((item) => item.status === 'ok').length,
    warn: snapshots.filter((item) => item.status === 'warn').length,
    alert: snapshots.filter((item) => item.status === 'alert').length,
    toBuy: snapshots.reduce((total, item) => total + item.targetToBuy, 0),
  };
}
