import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Separator,
} from '@/components';
import { supabase } from '@/lib/supabase';
import { buildSupplyModuleData } from '@/lib/supply-module';
import type { SupplyItemState } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { AdminSectionProps } from './shared';
import { DeleteConfirmButton, EmptyState } from './shared';
import { requireAuth } from './auth';

type SupplyDraft = {
  stock: string;
  price: string;
};

const formatDraftNumber = (value: number | null | undefined) => {
  if (value == null) return '';
  return Number.isInteger(value) ? String(value) : String(value).replace('.', ',');
};

const normalizeDecimalInput = (value: string): number | null | 'invalid' => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return 'invalid';
  return parsed;
};

const buildDrafts = (states: SupplyItemState[]) =>
  Object.fromEntries(
    states.map((state) => [
      state.itemId,
      {
        stock: formatDraftNumber(state.currentStock),
        price: formatDraftNumber(state.estimatedUnitPrice),
      },
    ]),
  ) as Record<string, SupplyDraft>;

export function SupplyAdmin({
  states,
  loading,
  refresh,
  disabled,
  hasSession,
}: AdminSectionProps & { states: SupplyItemState[] }) {
  const moduleData = useMemo(() => buildSupplyModuleData(states), [states]);
  const [drafts, setDrafts] = useState<Record<string, SupplyDraft>>(() => buildDrafts(states));
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(buildDrafts(states));
  }, [states]);

  const trackedStateById = useMemo(
    () => new Map(states.map((state) => [state.itemId, state])),
    [states],
  );

  const updateDraft = (itemId: string, patch: Partial<SupplyDraft>) => {
    setDrafts((current) => ({
      ...current,
      [itemId]: {
        stock: current[itemId]?.stock ?? '',
        price: current[itemId]?.price ?? '',
        ...patch,
      },
    }));
  };

  const saveItem = async (itemId: string) => {
    if (!requireAuth(hasSession)) return;
    const draft = drafts[itemId] ?? { stock: '', price: '' };
    const stockValue = normalizeDecimalInput(draft.stock);
    const priceValue = normalizeDecimalInput(draft.price);

    if (stockValue === 'invalid') {
      toast.error('Estoque inválido. Use número inteiro ou decimal.');
      return;
    }
    if (priceValue === 'invalid') {
      toast.error('Preço inválido. Use número inteiro ou decimal.');
      return;
    }
    if (stockValue === null) {
      toast.error('Informe o estoque atual para acompanhar este item.');
      return;
    }

    setSavingItemId(itemId);
    try {
      const { error } = await supabase!.from('supply_item_state').upsert({
        item_id: itemId,
        current_stock: stockValue,
        estimated_unit_price: priceValue,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Acompanhamento atualizado');
      await refresh();
    } finally {
      setSavingItemId((current) => (current === itemId ? null : current));
    }
  };

  const removeTracking = async (itemId: string) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from('supply_item_state').delete().eq('item_id', itemId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Item removido do acompanhamento');
    await refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abastecimento</CardTitle>
        <CardDescription>
          Estoque estruturado da casa com cálculo de compra por ciclo. O catálogo é fixo; aqui você acompanha o estado atual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryStat label="Acompanhados" value={moduleData.trackedSnapshots.length} />
          <SummaryStat label="Críticos" value={moduleData.criticalItems.length} />
          <SummaryStat label="Atenção" value={moduleData.warningItems.length} />
          <SummaryStat
            label="Compra estimada"
            value={
              moduleData.totalEstimatedPurchase > 0
                ? `R$ ${moduleData.totalEstimatedPurchase.toFixed(2).replace('.', ',')}`
                : '—'
            }
          />
        </div>

        <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Lista de compra calculada</p>
              <p className="text-xs text-muted-foreground">
                Mostra apenas itens já acompanhados no módulo.
              </p>
            </div>
            <Badge variant="outline">{moduleData.shoppingList.length}</Badge>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : moduleData.shoppingGroups.length === 0 ? (
            <EmptyState message="Nenhum item acompanhado precisa de compra agora." />
          ) : (
            <div className="space-y-3">
              {moduleData.shoppingGroups.map((group) => (
                <div key={group.cycle} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{group.label}</p>
                    <Badge variant="muted">{group.items.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {group.items.slice(0, 6).map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">
                            Comprar {item.targetToBuyLabel ?? '—'} · atual {item.current} {item.unit}
                          </p>
                        </div>
                        <SupplyStatusBadge status={item.status} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          {moduleData.sectionSummaries.map(({ section, summary, items }) => (
            <div key={section.id} className="space-y-3">
              <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-base font-semibold">{section.title}</p>
                  <p className="text-sm text-muted-foreground text-pretty">{section.subtitle}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="muted">Acompanhados {summary.total}</Badge>
                  <Badge variant="outline">Críticos {summary.alert}</Badge>
                  <Badge variant="outline">Atenção {summary.warn}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item) => {
                  const draft = drafts[item.id] ?? { stock: '', price: '' };
                  const isTracked = trackedStateById.has(item.id);
                  const isSaving = savingItemId === item.id;

                  return (
                    <div key={item.id} className="rounded-xl border p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">{item.label}</p>
                            {isTracked ? <SupplyStatusBadge status={item.status} /> : null}
                            <Badge variant={isTracked ? 'muted' : 'outline'}>
                              {isTracked ? 'Acompanhado' : 'Disponível no catálogo'}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.group} · {item.stockTargetLabel}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground text-pretty">
                            {item.note}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>
                              Cobertura: {isTracked ? item.coverage : 'Preencha o estoque para começar'}
                            </span>
                            <span>
                              Compra sugerida: {isTracked ? item.targetToBuyLabel ?? 'Nada por enquanto' : '—'}
                            </span>
                          </div>
                        </div>

                        <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:w-[320px]">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Estoque atual</p>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="Ex: 4 ou 4,5"
                              value={draft.stock}
                              onChange={(event) => updateDraft(item.id, { stock: event.target.value })}
                              disabled={disabled || isSaving}
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Preço unitário</p>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="Ex: 7,90"
                              value={draft.price}
                              onChange={(event) => updateDraft(item.id, { price: event.target.value })}
                              disabled={disabled || isSaving}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveItem(item.id)}
                          disabled={disabled || isSaving}
                        >
                          {isSaving ? 'Salvando...' : isTracked ? 'Salvar alterações' : 'Começar a acompanhar'}
                        </Button>
                        {isTracked ? (
                          <DeleteConfirmButton
                            itemName={item.label}
                            onConfirm={() => removeTracking(item.id)}
                            disabled={disabled || isSaving}
                            warning={`Ao remover "${item.label}" do acompanhamento, ele sai do resumo de abastecimento e da lista de compra calculada.`}
                          />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SupplyStatusBadge({ status }: { status: 'ok' | 'warn' | 'alert' }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === 'alert' && 'border-destructive/50 text-destructive',
        status === 'warn' && 'border-amber-500/60 text-amber-700 dark:text-amber-400',
        status === 'ok' && 'border-emerald-500/60 text-emerald-700 dark:text-emerald-400',
      )}
    >
      {status === 'alert' ? 'Crítico' : status === 'warn' ? 'Atenção' : 'Ok'}
    </Badge>
  );
}
