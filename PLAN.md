# Plano de implementação — Sprint 5: Kiosk Polish + Admin UX

## Visão geral

Duas frentes: (A) tornar o painel legível e tocável num kiosk de 20" 1080p, (B) limpar a página de administração para uso humano.

---

## Parte A — Painel Kiosk (/painel)

### A1. Destaque do dia atual no calendário
CalendarGrid recebe `weekDays` mas não sabe qual é hoje. Adicionar comparação `isToday(date, new Date())` e aplicar fundo/borda diferenciada na coluna do dia atual (ex: `ring-2 ring-primary/40 bg-primary/5`).

**Arquivo:** `src/App.tsx` → `CalendarGrid`

### A2. Escala tipográfica xl para kiosk
Adicionar `xl:` overrides em TODOS os textos. Referência (KIOSK.md diz clock 48px+, events 18px+, routines 18px+):

| Elemento | Atual | Meta xl |
|----------|-------|---------|
| Relógio | `xl:text-4xl` (36px) | `xl:text-5xl` (48px) |
| Data no header | `text-xs` (12px) | `xl:text-lg` (18px) |
| Nº do dia no calendário | `text-2xl` (24px) | `xl:text-3xl` (30px) |
| Nome do dia (dom, seg) | `text-xs` (12px) | `xl:text-sm` (14px) |
| Eventos do calendário | `text-sm` (14px) | `xl:text-base` (16px) |
| Versículo no header | `text-sm` (14px) | `xl:text-base` (16px) |
| Nome do kid | `text-base` (16px) | `xl:text-lg` (18px) |
| Texto da rotina | `text-sm` (14px) | `xl:text-base` (16px) |
| Títulos seção (Reposição, Homeschool) | `text-base` (16px) | `xl:text-lg` (18px) |
| Items reposição | `text-sm` (14px) | `xl:text-base` (16px) |
| Tópicos homeschool | `text-sm` (14px) | `xl:text-base` (16px) |

**Arquivo:** `src/App.tsx` — CalendarGrid, KidsGrid, RightColumn, PanelPage header

### A3. Touch targets das rotinas
Botões de rotina: `py-2` → `xl:py-3` (altura ~52px). Gap entre botões: `gap-1.5` → `xl:gap-2.5` (10px). Círculo de check: `h-6 w-6` → `xl:h-8 xl:w-8`.

**Arquivo:** `src/App.tsx` → `KidsGrid`

### A4. Header: data legível + saudação no lugar de texto inútil
- Remover label "Família" (10px, sem valor)
- Substituir "Painel semanal" por saudação contextual: "Bom dia" / "Boa tarde" / "Boa noite" (baseado na hora)
- Mover data para posição de destaque: `xl:text-lg` capitalize, acima do relógio
- Versículo: `xl:text-base` com `max-w-[50%]` (mais espaço)

**Arquivo:** `src/App.tsx` → header dentro de `PanelPage`

### A5. Dots de cor das pessoas maiores
Person color dots: `h-2 w-2` → `xl:h-3 xl:w-3` nos eventos. `h-3 w-3` → `xl:h-4 xl:w-4` nos kid cards. Homeschool/right column idem.

**Arquivo:** `src/App.tsx` → CalendarGrid, KidsGrid, RightColumn

### A6. Progresso visual por kid
Substituir o texto `2/6` por dots preenchidos (pequenos círculos). Ex: para 2/5 → ●●○○○. Legível instantaneamente de longe, sem precisar ler números.

**Arquivo:** `src/App.tsx` → `KidsGrid` (CardHeader de cada kid)

### A7. Remover ruído visual
- Remover label "Família" acima do título (10px, decorativo)
- Remover contador de eventos por dia (10px, ilegível)
- Remover tooltips da sidebar (hover não funciona em touch)
- Corrigir "kids" → "crianças" no header Homeschool

**Arquivo:** `src/App.tsx` → PanelPage, CalendarGrid, Sidebar, RightColumn

---

## Parte B — Admin (/editar)

### B1. Remover textos técnicos das descrições
Substituir CardDescription developer-facing por texto humano:

| Atual | Novo |
|-------|------|
| "Recorrentes (day_of_week 1=Dom...7=Sáb) e pontuais." | "Eventos que se repetem toda semana e eventos únicos." |
| "Checks gravados com unique(template_id, date)." | "Tarefas diárias das crianças. Checks resetam a cada dia." |
| "Urgência: now / soon" | "Itens para comprar ou repor." |
| "Visit_mode singleton id=1." | "Configurações gerais do painel." |
| "Ordem controlada por sort_order." | "Membros da família exibidos no painel." |
| "Versículo/foco e homeschool por criança." | "Versículo da semana e tópicos de homeschool." |

**Arquivos:** AgendaAdmin, RoutinesAdmin, ReplenishAdmin, ConfigAdmin, PeopleAdmin, ContentAdmin

### B2. Selects nativos → estilizados
Os `<select>` usam HTML nativo (sem estilo do design system). Trocar para classe consistente: `rounded-lg border bg-background px-3 text-sm` + dark mode support (`bg-background text-foreground`). Não precisa de componente shadcn Select — basta adicionar as classes de tema.

**Arquivos:** AgendaAdmin, PeopleAdmin, RoutinesAdmin, ReplenishAdmin, ContentAdmin

### B3. Indicador de contagem nas tabs de categoria
Mostrar badge com contagem em cada tab: "Agenda (7)", "Rotinas (6)", "Reposição (3)". Ajuda o usuário a saber onde tem conteúdo.

**Arquivo:** `src/pages/EditPage.tsx`

---

## Parte C — KIOSK.md atualização
Atualizar a seção "Current layout" para refletir o layout lado-a-lado, remover "Known issues" de Sprint 4 (já resolvidos), atualizar "Target state" para refletir o que foi implementado.

**Arquivo:** `kb/KIOSK.md`

---

## Fora de escopo (futuro)
- **Clima:** útil mas requer API externa (OpenWeatherMap / wttr.in). Pode ser adicionado depois como card no right panel.
- **"Próximo" event indicator:** mostraria o próximo evento do dia. Útil, mas precisa de parsing de horários que hoje são texto livre. Considerar depois.

---

## Ordem de execução

1. A7 (remover ruído) — limpeza simples
2. A1 (today highlight) — fix funcional mais impactante
3. A4 (header: saudação + data) — melhora percepção de qualidade
4. A2 (escala tipográfica xl) — fix de legibilidade
5. A3 (touch targets) — fix de usabilidade
6. A5 (dots maiores) — complemento visual
7. A6 (progresso visual) — melhoria incremental
8. B1 (textos técnicos) — limpeza admin
9. B2 (selects estilizados) — consistência visual admin
10. B3 (contagem nas tabs) — qualidade de vida admin
11. C (KIOSK.md) — documentação

Todos os passos no mesmo commit ou em 2-3 commits lógicos (painel + admin + docs).
