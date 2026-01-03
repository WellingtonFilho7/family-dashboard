# Family Dashboard

Dashboard familiar auto-hospedado para organização doméstica diária, construído com **React + Vite + Supabase**, sem dependência de SaaS ou mensalidades.

O projeto foi pensado para uso real no dia a dia de uma família, com um **painel público estilo kiosk** e uma **área administrativa protegida**.

- `/painel` → visualização pública (kiosk / dashboard familiar)
- `/editar` → área administrativa (login via OTP)

---

## Funcionalidades

- **Painel diário e semanal** (7 colunas, Dom–Sáb) com contagem de eventos.
- **Rotinas das crianças** com check diário e feedback visual (confetti ao concluir).
- **Agenda recorrente** (por dia da semana) e **eventos pontuais**.
- **Foco / versículo da semana** sempre visível.
- **Lista de reposição** com urgência (`now` / `soon`).
- **Modo visitas** (oculta dados privados e nomes sensíveis).
- **Admin mobile-first** em `/editar` com CRUD completo após login OTP.

---

## Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui  
- **Backend:** Supabase (Postgres)
- **Auth:** Supabase Auth (OTP por e-mail) + Row Level Security (RLS)
- **Infra:** Vercel (build/deploy) + Supabase (dados e autenticação)

---

## Estrutura do projeto

```
src/
├─ pages/
│  ├─ EditPage.tsx        # /editar (admin)
│  └─ App.tsx             # /painel + rotas
├─ hooks/
│  └─ useKioskData.ts     # Carregamento de dados (Supabase ou mock em DEV)
├─ components/            # Componentes UI
├─ supabase.ts            # Client Supabase (env-based)
└─ ...
```

Arquivos relevantes:
- `supabase_schema_notes.sql` — SQL com tabelas, constraints, RLS e policies sugeridas.

---

## Configuração local

### Pré-requisitos
- Node.js 20+
- npm

### Instalação

```bash
git clone <repo>
cd family-dashboard
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env.local`:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

### Rodar em desenvolvimento

```bash
npm run dev
```

> Em **DEV**, se as envs não existirem, o app usa **mock** automaticamente.

---

## Configuração do Supabase

1. Criar um projeto no Supabase.
2. Criar as tabelas e colunas conforme `supabase_schema_notes.sql`:

   * `people`
   * `recurring_items`
   * `one_off_items`
   * `kid_routine_templates`
   * `kid_routine_checks`
   * `replenish_items`
   * `weekly_focus`
   * `homeschool_notes`
   * `settings`
3. Ativar **RLS** em todas as tabelas.
4. Aplicar as **policies**:

   * `/painel` (anon): `select` apenas com `is_private = false`
   * `/editar` (authenticated): permissões completas (CRUD)
5. Criar usuário administrador (login via OTP).
6. Configurar **Redirect URLs** de OTP:

   * `https://<seu-deploy>/editar`
   * `http://localhost:5173/editar`

---

## Deploy

1. Conectar o repositório ao **Vercel**.
2. Definir as Environment Variables (build-time):

   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_ANON_KEY`
     (em **Production** e **Preview**).
3. Executar **Redeploy** após qualquer alteração de env.

---

## Segurança

* **Row Level Security (RLS)** habilitado no banco.
* Campo `is_private` filtra dados sensíveis no painel público.
* **Modo visitas** mascara informações adicionais.
* `/editar` só renderiza o CRUD com sessão válida (OTP).

---

## Notas e decisões de design

* Mock **apenas em DEV** se o Supabase não estiver configurado.
* Em **PROD**, sem Supabase configurado → erro explícito (“Supabase não configurado”).
* `settings` tratado como **singleton** (`id = 1`).
* `day_of_week` usa **1–7 (Dom–Sáb)**.
* OTP possui cooldown para reenvio.
* Logs de debug opcionais via `VITE_DEBUG_SUPABASE=true`.

---

## Licença

MIT
