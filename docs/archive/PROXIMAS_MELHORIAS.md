# 🚀 Próximas Melhorias de UX/UI

## 📋 Roadmap Sugerido

---

## Sprint 2: Alta Prioridade (2-3 dias)

### 1. Empty States Informativos ⭐⭐⭐

**Problema atual:**
```tsx
{items.length === 0 ? (
  <p className="text-sm text-muted-foreground">Nada por aqui</p>
) : /* items */}
```

**Solução:**
```tsx
{items.length === 0 ? (
  <div className="flex flex-col items-center gap-4 py-12 text-center">
    <div className="rounded-full bg-muted p-4">
      <CalendarOff className="h-8 w-8 text-muted-foreground" />
    </div>
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Nenhum evento para hoje</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Adicione eventos recorrentes ou pontuais na área administrativa
        para começar a organizar a semana da família.
      </p>
    </div>
    <Button variant="outline" onClick={() => navigate('/editar')}>
      <Plus className="mr-2 h-4 w-4" />
      Adicionar primeiro evento
    </Button>
  </div>
) : /* items */}
```

**Locais para aplicar:**
- CalendarGrid (sem eventos no dia)
- KidsGrid (sem rotinas ativas)
- Reposição (nada pendente)
- Homeschool (sem tópicos)
- Cada seção do admin (listas vazias)

---

### 2. Edição Inline ⭐⭐⭐

**Problema:** Para editar, usuário precisa deletar e recriar

**Solução:**
```tsx
const [editing, setEditing] = useState<string | null>(null);
const [editForm, setEditForm] = useState<Person | null>(null);

{editing === person.id ? (
  <div className="flex gap-2 items-center">
    <Input
      value={editForm.name}
      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
      className="flex-1"
    />
    <Input
      type="color"
      value={editForm.color}
      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
      className="w-16"
    />
    <Button
      size="sm"
      onClick={() => saveEdit(person.id)}
      isLoading={isSaving}
    >
      <Check className="h-4 w-4" />
    </Button>
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setEditing(null)}
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
) : (
  <div className="flex items-center gap-2">
    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: person.color }} />
    <p className="font-semibold">{person.name}</p>
    <Button
      size="sm"
      variant="ghost"
      onClick={() => {
        setEditing(person.id);
        setEditForm(person);
      }}
    >
      <Edit2 className="h-3 w-3" />
    </Button>
  </div>
)}
```

---

### 3. Undo para Exclusões ⭐⭐

**Implementação com Toast Action:**
```tsx
const deletePerson = async (person: Person) => {
  const { error } = await supabase.from('people').delete().eq('id', person.id);

  if (error) {
    toast.error(error.message);
  } else {
    // Guardar cópia para restauração
    const backup = { ...person };

    toast.success('Pessoa removida', {
      action: {
        label: 'Desfazer',
        onClick: async () => {
          // Restaurar usando mesmo UUID
          await supabase.from('people').insert({
            id: backup.id,
            name: backup.name,
            color: backup.color,
            type: backup.type,
            sort_order: backup.sortOrder,
            is_private: backup.isPrivate,
          });
          refresh();
          toast.success('Pessoa restaurada');
        },
      },
      duration: 8000, // 8 segundos para desfazer
    });
    refresh();
  }
};
```

**Benefício:** Usuário pode reverter exclusão acidental

---

### 4. Progress Indicators (Rotinas) ⭐⭐⭐

**Adicionar barra de progresso visual:**
```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">Progresso</span>
    <span className="font-semibold">{completedIds.length}/{kidTemplates.length}</span>
  </div>
  <div className="h-2 bg-muted rounded-full overflow-hidden">
    <div
      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out"
      style={{ width: `${(completedIds.length / kidTemplates.length) * 100}%` }}
    />
  </div>

  {/* Celebração ao completar 100% */}
  {completedIds.length === kidTemplates.length && kidTemplates.length > 0 && (
    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 mt-2">
      <Sparkles className="h-4 w-4 text-emerald-600" />
      <span className="text-sm font-semibold text-emerald-700">
        Todas as rotinas concluídas! 🎉
      </span>
    </div>
  )}
</div>
```

---

### 5. Navegação com Tabs (Admin) ⭐⭐

**Problema:** Botões inline parecem filtros, não navegação

**Solução:**
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Tabs value={category} onValueChange={(v) => setCategory(v as AdminCategory)}>
  <TabsList className="grid w-full grid-cols-6 mb-4">
    <TabsTrigger value="people" className="flex items-center gap-2">
      <Users className="h-4 w-4" />
      <span className="hidden sm:inline">Pessoas</span>
    </TabsTrigger>
    <TabsTrigger value="agenda" className="flex items-center gap-2">
      <Calendar className="h-4 w-4" />
      <span className="hidden sm:inline">Agenda</span>
    </TabsTrigger>
    {/* ... outros tabs */}
  </TabsList>

  <TabsContent value="people">
    <PeopleAdmin {...props} />
  </TabsContent>
  <TabsContent value="agenda">
    <AgendaAdmin {...props} />
  </TabsContent>
  {/* ... outros conteúdos */}
</Tabs>
```

---

## Sprint 3: Melhorias de Experiência (3-4 dias)

### 6. Dark Mode ⭐⭐⭐

**Implementação:**

```tsx
// hooks/useTheme.ts
export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
};
```

```css
/* index.css */
@layer base {
  .dark {
    --background: 224 71% 4%;
    --foreground: 213 31% 91%;
    --card: 224 71% 6%;
    --card-foreground: 213 31% 91%;
    --popover: 224 71% 4%;
    --popover-foreground: 213 31% 91%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 1.2%;
    --secondary: 222.2 47.4% 11.2%;
    --secondary-foreground: 210 40% 98%;
    --muted: 223 47% 11%;
    --muted-foreground: 215.4 16.3% 56.9%;
    --accent: 216 34% 17%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 63% 31%;
    --destructive-foreground: 210 40% 98%;
    --border: 216 34% 17%;
    --input: 216 34% 17%;
    --ring: 224.3 76.3% 48%;
  }
}
```

```tsx
// Adicionar toggle na Sidebar
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-12 w-12 rounded-2xl"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  </TooltipTrigger>
  <TooltipContent>Alternar tema</TooltipContent>
</Tooltip>
```

---

### 7. Animações de Transição ⭐⭐

**Com Framer Motion:**

```bash
npm install framer-motion
```

```tsx
import { AnimatePresence, motion } from 'framer-motion';

// Transição entre views
<AnimatePresence mode="wait">
  {viewMode === 'calendar' ? (
    <motion.div
      key="calendar"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <CalendarGrid {...props} />
    </motion.div>
  ) : (
    <motion.div
      key="kids"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <KidsGrid {...props} />
    </motion.div>
  )}
</AnimatePresence>

// Animação de lista (stagger)
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }}
  initial="hidden"
  animate="show"
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
      }}
    >
      {/* Item content */}
    </motion.div>
  ))}
</motion.div>
```

---

### 8. Drag and Drop para Reordenar ⭐⭐

**Com @dnd-kit:**

```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

```tsx
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortablePerson({ person }: { person: Person }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: person.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 rounded-xl border px-3 py-2">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      {/* Person content */}
    </div>
  );
}

function PeopleAdmin({ people, updatePerson }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de movimento para ativar
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = people.findIndex((p) => p.id === active.id);
      const newIndex = people.findIndex((p) => p.id === over.id);

      const reordered = arrayMove(people, oldIndex, newIndex);

      // Atualizar sort_order de todos afetados
      reordered.forEach((person, index) => {
        updatePerson(person.id, { sort_order: index });
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={people.map(p => p.id)} strategy={verticalListSortingStrategy}>
        {people.map((person) => (
          <SortablePerson key={person.id} person={person} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

---

### 9. Filtros e Busca ⭐⭐

```tsx
function AgendaAdmin({ recurring, oneOff, people }: Props) {
  const [search, setSearch] = useState('');
  const [filterPerson, setFilterPerson] = useState<string>('');
  const [filterPrivacy, setFilterPrivacy] = useState<'all' | 'public' | 'private'>('all');

  const filtered = recurring.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesPerson = !filterPerson || item.personId === filterPerson;
    const matchesPrivacy =
      filterPrivacy === 'all' ||
      (filterPrivacy === 'public' && !item.isPrivate) ||
      (filterPrivacy === 'private' && item.isPrivate);

    return matchesSearch && matchesPerson && matchesPrivacy;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterPerson} onValueChange={setFilterPerson}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por pessoa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as pessoas</SelectItem>
              {people.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPrivacy} onValueChange={(v) => setFilterPrivacy(v as any)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="public">Públicos</SelectItem>
              <SelectItem value="private">Privados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resultado da busca */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filtered.length} eventos encontrados</span>
          {(search || filterPerson || filterPrivacy !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setFilterPerson('');
                setFilterPrivacy('all');
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </CardHeader>
      {/* ... rest */}
    </Card>
  );
}
```

---

## Sprint 4: Features Avançadas (4-5 dias)

### 10. PWA com Notificações ⭐⭐⭐

**vite.config.ts:**
```bash
npm install vite-plugin-pwa -D
```

```ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Family Dashboard',
        short_name: 'Dashboard',
        description: 'Dashboard familiar para organização doméstica',
        theme_color: '#2563EB',
        background_color: '#FFFFFF',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60, // 1 hora
              },
            },
          },
        ],
      },
    }),
  ],
});
```

**Notificações:**
```tsx
// utils/notifications.ts
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Este navegador não suporta notificações');
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    toast.success('Notificações ativadas');
    return true;
  } else {
    toast.error('Permissão de notificação negada');
    return false;
  }
};

export const scheduleEventNotifications = (events: OneOffItem[]) => {
  events.forEach((event) => {
    const eventTime = new Date(event.date);
    const notifyTime = new Date(eventTime.getTime() - 15 * 60 * 1000); // 15min antes

    if (notifyTime > new Date()) {
      const timeUntilNotification = notifyTime.getTime() - Date.now();

      setTimeout(() => {
        new Notification('Evento em 15 minutos', {
          body: event.title,
          icon: '/icon-192.png',
          badge: '/icon-badge.png',
          tag: event.id,
          requireInteraction: true,
        });
      }, timeUntilNotification);
    }
  });
};
```

---

### 11. Modo Offline ⭐⭐

**Service Worker para cache:**
```ts
// Já incluído via vite-plugin-pwa

// Adicionar indicador de status offline
function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 shadow-lg">
        <WifiOff className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-semibold text-amber-700">
          Modo offline - algumas funcionalidades limitadas
        </span>
      </div>
    </div>
  );
}
```

---

### 12. Exportar/Importar Dados ⭐⭐

```tsx
// lib/backup.ts
export const exportData = async () => {
  const { data: people } = await supabase.from('people').select('*');
  const { data: recurring } = await supabase.from('recurring_items').select('*');
  const { data: oneOff } = await supabase.from('one_off_items').select('*');
  const { data: templates } = await supabase.from('kid_routine_templates').select('*');
  const { data: replenish } = await supabase.from('replenish_items').select('*');
  const { data: focus } = await supabase.from('weekly_focus').select('*');
  const { data: notes } = await supabase.from('homeschool_notes').select('*');
  const { data: settings } = await supabase.from('settings').select('*');

  const backup = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    data: {
      people,
      recurring,
      oneOff,
      templates,
      replenish,
      focus,
      notes,
      settings,
    },
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `family-dashboard-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  toast.success('Backup criado com sucesso');
};

export const importData = async (file: File) => {
  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    if (backup.version !== '1.0.0') {
      throw new Error('Versão de backup incompatível');
    }

    // Confirmar com usuário
    const confirmed = window.confirm(
      'Importar irá SUBSTITUIR todos os dados atuais. Tem certeza?'
    );

    if (!confirmed) return;

    // Importar dados
    const { data } = backup.data;

    // Limpar tabelas
    await supabase.from('people').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // ... outras tabelas

    // Inserir novos dados
    if (data.people?.length) {
      await supabase.from('people').insert(data.people);
    }
    // ... outras tabelas

    toast.success('Dados importados com sucesso');
    window.location.reload();
  } catch (error) {
    console.error(error);
    toast.error('Erro ao importar backup');
  }
};
```

**UI:**
```tsx
<div className="flex gap-2">
  <Button variant="outline" onClick={exportData}>
    <Download className="mr-2 h-4 w-4" />
    Exportar backup
  </Button>

  <label>
    <input
      type="file"
      accept=".json"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) importData(file);
      }}
      className="hidden"
    />
    <Button variant="outline" asChild>
      <span>
        <Upload className="mr-2 h-4 w-4" />
        Importar backup
      </span>
    </Button>
  </label>
</div>
```

---

## 🎯 Priorização

### Impacto vs Esforço Matrix

```
Alto Impacto, Baixo Esforço (FAZER PRIMEIRO):
✅ Empty states
✅ Progress indicators
✅ Edição inline

Alto Impacto, Alto Esforço (PLANEJAR):
⚠️ Dark mode
⚠️ Drag and drop
⚠️ PWA com notificações

Baixo Impacto, Baixo Esforço (SE SOBRAR TEMPO):
🔵 Animações de transição
🔵 Filtros e busca

Baixo Impacto, Alto Esforço (EVITAR):
🔴 Multi-idioma (i18n)
🔴 Customização de cores
```

---

## 📊 Métricas de Sucesso

Após implementar cada feature, medir:

1. **Feedback do usuário:**
   - NPS (Net Promoter Score)
   - Satisfação por feature

2. **Uso:**
   - % de usuários que usam a feature
   - Frequência de uso

3. **Performance:**
   - Tempo de carregamento
   - Fluidez das animações (60fps)

4. **Erros:**
   - Taxa de erros de validação
   - Taxa de exclusões acidentais

---

## 🚀 Como Começar

1. Escolher 1-2 features de alta prioridade
2. Criar branch: `git checkout -b feature/empty-states`
3. Implementar
4. Testar em todos os breakpoints
5. Commit com mensagem descritiva
6. PR para review

**Boa sorte com as próximas melhorias!** 🎉
