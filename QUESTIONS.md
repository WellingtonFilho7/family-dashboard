# Questions for Family Dashboard Review

Objetivo: consolidar todas as dúvidas arquiteturais, técnicas, funcionais, de segurança, performance e consistência encontradas durante a revisão do repo para que você responda neste arquivo e, na próxima rodada, eu implemente as melhorias alinhadas com as suas decisões.

## Cobertura revisada

- Código de runtime e composição principal: `src/App.tsx`, `src/main.tsx`, `src/hooks/useKioskData.ts`, `src/hooks/useDarkMode.ts`
- Área administrativa: `src/pages/EditPage.tsx` e todos os arquivos em `src/pages/admin/`
- Camada de dados e utilitários: todos os arquivos em `src/lib/` e `src/lib/__tests__/`
- Design system local: `src/components/index.ts`, `src/components/ErrorBoundary.tsx` e todos os arquivos em `src/components/ui/`
- Configuração e deploy: `package.json`, `vite.config.ts`, `eslint.config.js`, `tsconfig*.json`, `tailwind.config.cjs`, `vercel.json`, `index.html`, `public/manifest.json`, `public/sw.js`
- Base documental e operação: `README.md`, `kb/PROJECT.md`, `kb/KIOSK.md`, `kb/WORKFLOW.md`, `PLAN.md`, `PROXIMAS_MELHORIAS.md`, `MELHORIAS_UX_UI.md`, `SUGESTOES_UI_PRATICAS.md`, `GUIA_DESIGN_VISUAL.md`, `GUIA_VISUAL_MELHORIAS.md`, `supabase_schema_notes.sql`
- Endpoints/API routes/serverless functions encontrados no repo: nenhum

## Estado dos checks executados

- `npm test`: passou
- `npm run typecheck`: passou
- `npm run build`: passou, mas gerou warning de bundle JS grande (`dist/assets/index-*.js` com ~524 kB minificado)
- `npm run lint`: falhou com problemas reais de qualidade/manutenção (`setState` em `useEffect`, `any`, violações de Fast Refresh, interface vazia, dependências de hooks)

## Produto, escopo e documentação

### Q001. Qual é o mecanismo oficial de autenticação do admin hoje: OTP ou e-mail+senha?
Pergunta: qual fluxo deve ser considerado correto e documentado como fonte oficial?
Contexto: `README.md`, `kb/PROJECT.md` e `kb/WORKFLOW.md` ainda falam em OTP, mas `src/pages/admin/LoginCard.tsx` implementa `signInWithPassword`, `signUp` e reset de senha, e `supabase_schema_notes.sql` também descreve e-mail+senha.
Onde apareceu: `README.md`, `kb/PROJECT.md`, `kb/WORKFLOW.md`, `src/pages/admin/LoginCard.tsx`, `supabase_schema_notes.sql`
Resposta:

### Q002. O repo quer manter várias documentações históricas e parcialmente conflitantes na raiz?
Pergunta: esses arquivos de plano/guia são documentação viva ou histórico que deveria ser arquivado/removido?
Contexto: há muitos `.md` na raiz com sugestões, melhorias já implementadas e estados antigos; vários deles divergem entre si e do código atual, o que dificulta saber qual documento é normativo.
Onde apareceu: `PLAN.md`, `PROXIMAS_MELHORIAS.md`, `MELHORIAS_UX_UI.md`, `SUGESTOES_UI_PRATICAS.md`, `GUIA_DESIGN_VISUAL.md`, `GUIA_VISUAL_MELHORIAS.md`
Resposta:

### Q003. Qual documento deve ser a fonte de verdade para decisões técnicas e operacionais do projeto?
Pergunta: qual arquivo deve ser tratado como autoridade final quando código e docs divergem?
Contexto: hoje existem pelo menos quatro candidatos com peso parecido (`README`, `kb/PROJECT`, `kb/KIOSK`, `kb/WORKFLOW`) e eles já divergem em auth, PWA e smoke test.
Onde apareceu: `README.md`, `kb/PROJECT.md`, `kb/KIOSK.md`, `kb/WORKFLOW.md`
Resposta:

### Q004. O checklist de qualidade do projeto está deliberadamente abaixo do estado do repo?
Pergunta: devemos tratar `lint` falhando e smoke test desatualizado como dívida conhecida ou como quebra real do quality bar?
Contexto: `kb/WORKFLOW.md` define um quality bar, mas o próprio repo não atende a tudo hoje e o smoke test ainda cita OTP.
Onde apareceu: `kb/WORKFLOW.md`, `eslint.config.js`, saída de `npm run lint`
Resposta:

## Arquitetura e boundaries

### Q005. `src/App.tsx` deve continuar concentrando quase todo o painel público?
Pergunta: a decisão é manter um arquivo monolítico de ~1042 linhas ou quebrar em componentes/containers menores com responsabilidades explícitas?
Contexto: o arquivo mistura roteamento, debug, sidebar, header, calendário, rotinas, QR modal, helpers de timeline e lógica de estado local. Isso aumenta custo de manutenção e atrapalha testes.
Onde apareceu: `src/App.tsx`
Resposta:

### Q006. `useKioskData` deve continuar sendo o ponto único para fetch, mapeamento, filtragem, cache offline, refresh e mutação?
Pergunta: essa concentração é intencional ou o projeto quer separar leitura, transformação, cache e ações de escrita?
Contexto: o hook já tem ~551 linhas e hoje mistura responsabilidades de data layer, policy layer, cache layer e mutation layer.
Onde apareceu: `src/hooks/useKioskData.ts`
Resposta:

### Q007. O projeto quer manter acesso direto ao Supabase dentro dos componentes de UI?
Pergunta: CRUD admin e toggles devem continuar chamando `supabase.from(...).insert/update/delete` diretamente nos componentes, ou isso deveria passar por um serviço/camada de domínio?
Contexto: hoje cada componente admin fala direto com o client, o que espalha regras, dificulta reuso e deixa consistência de erro/validação fragmentada.
Onde apareceu: `src/pages/admin/*.tsx`, `src/pages/EditPage.tsx`
Resposta:

### Q008. A ausência de backend próprio é uma restrição rígida do produto ou apenas uma escolha atual?
Pergunta: o projeto deve permanecer 100% frontend + Supabase, mesmo para fluxos sensíveis, ou está aberto a Edge Functions/Backend para operações privilegiadas?
Contexto: algumas decisões de segurança, integridade e cache ficam limitadas quando tudo roda do cliente com anon key e sessão persistida.
Onde apareceu: `README.md`, `kb/PROJECT.md`, `src/lib/supabase.ts`
Resposta:

### Q009. `ConfigAdmin` é código morto ou funcionalidade adiada?
Pergunta: esse componente deve ser removido, reintegrado ou mantido como placeholder?
Contexto: ele existe, mas não é exportado em `src/pages/admin/index.ts` nem usado em `EditPage.tsx`; a configuração de visit mode acabou sendo tratada em outro lugar.
Onde apareceu: `src/pages/admin/ConfigAdmin.tsx`, `src/pages/admin/index.ts`, `src/pages/EditPage.tsx`
Resposta:

### Q010. O `DebugOverlay` com query param faz parte da operação oficial do projeto?
Pergunta: esse modo debug é recurso suportado de manutenção ou ferramenta temporária de desenvolvimento?
Contexto: o painel expõe dados de viewport e user agent via `?debug=1`; isso pode ser útil, mas também amplia superfície visível em produção e não está documentado como feature de operação.
Onde apareceu: `src/App.tsx`, `src/lib/debug-utils.ts`
Resposta:

## Dados, modelagem e Supabase

### Q011. O carregamento total de várias tabelas sem recorte é intencional mesmo para uso prolongado?
Pergunta: o app deve continuar dando `select('*')` em tabelas históricas sem paginação/filtro temporal?
Contexto: `one_off_items`, `kid_routine_checks`, `weekly_focus` e `homeschool_notes` podem crescer indefinidamente e hoje são buscadas integralmente a cada refresh.
Onde apareceu: `src/hooks/useKioskData.ts`
Resposta:

### Q012. `kid_routine_checks` deveria ser buscada integralmente ou apenas para o dia atual/recorte recente?
Pergunta: existe alguma razão funcional para carregar todo o histórico de checks no painel?
Contexto: o painel só usa o dia atual para concluir/mostrar rotinas, mas `fetchAll()` busca toda a tabela e repete isso no refresh automático.
Onde apareceu: `src/hooks/useKioskData.ts`, `kb/PROJECT.md`
Resposta:

### Q013. `one_off_items` deveria ser buscada integralmente ou só para a semana/janela relevante?
Pergunta: há algum uso planejado para histórico completo no painel atual?
Contexto: o calendário só renderiza a semana corrente, mas a consulta hoje carrega todos os itens pontuais para depois filtrar no cliente.
Onde apareceu: `src/hooks/useKioskData.ts`, `src/App.tsx`
Resposta:

### Q014. `weekly_focus` deve ser histórico append-only ou singleton editável?
Pergunta: salvar um novo foco sempre como novo registro é a regra de negócio desejada?
Contexto: `ContentAdmin` desativa todos os focos e insere uma nova linha; isso acumula histórico indefinido e ainda pode deixar zero itens ativos se o insert falhar após o update.
Onde apareceu: `src/pages/admin/ContentAdmin.tsx`
Resposta:

### Q015. `homeschool_notes` deve representar o estado atual por criança ou um histórico versionado?
Pergunta: a intenção é ter uma linha “corrente” por criança ou registrar snapshots/versões ao longo do tempo?
Contexto: a UI trabalha como se existisse uma nota atual por criança, mas a modelagem permite acúmulo histórico e a query carrega tudo sem deixar claro qual é a linha canônica.
Onde apareceu: `src/pages/admin/ContentAdmin.tsx`, `src/hooks/useKioskData.ts`, `src/lib/types.ts`
Resposta:

### Q016. A coexistência de `person_id` e `person_ids` ainda é uma necessidade de compatibilidade?
Pergunta: o sistema ainda precisa manter a dupla escrita/dupla leitura ou já pode migrar para um único modelo?
Contexto: o código mantém `person_id` legado como fallback e `person_ids` novo, o que aumenta complexidade de mapeamento, formulário e consistência.
Onde apareceu: `src/hooks/useKioskData.ts`, `src/pages/admin/AgendaAdmin.tsx`, `supabase_schema_notes.sql`
Resposta:

### Q017. `time_text` deve seguir existindo como coluna persistida?
Pergunta: esse campo textual ainda é necessário ou o projeto quer derivar o rótulo de horário só a partir de `start_time`/`end_time`?
Contexto: hoje `time_text` às vezes é preenchido, às vezes derivado, e há parsing redundante em vários pontos para reconstruir algo que já existe em colunas estruturadas.
Onde apareceu: `src/hooks/useKioskData.ts`, `src/pages/admin/AgendaAdmin.tsx`, `src/App.tsx`
Resposta:

### Q018. Existem foreign keys/regras de integridade que ficaram fora do SQL canônico?
Pergunta: o schema deveria proteger relações entre pessoas, agenda, rotinas e notas no banco?
Contexto: a UI já avisa que deletar pessoas deixa registros órfãos, o que sugere ausência de FKs/cascade/restrict. Isso torna integridade dependente apenas da UI.
Onde apareceu: `src/pages/admin/PeopleAdmin.tsx`, `supabase_schema_notes.sql`
Resposta:

### Q019. Excluir pessoas deixando agenda/rotinas órfãs é comportamento aceito?
Pergunta: a regra correta é bloquear exclusão, reatribuir dependências, fazer cascade ou realmente aceitar órfãos?
Contexto: a própria mensagem de confirmação assume orfandade como consequência normal; isso tende a virar inconsistência silenciosa no painel.
Onde apareceu: `src/pages/admin/PeopleAdmin.tsx`
Resposta:

### Q020. O projeto pretende continuar usando `supabase_schema_notes.sql` como “referência manual” sem migrations formais?
Pergunta: esse fluxo informal é suficiente para o estágio do projeto ou já está causando drift demais entre ambiente real e código?
Contexto: vários comportamentos dependem de RLS, constraints e defaults, mas não há migrations versionadas nem verificação automática de alinhamento.
Onde apareceu: `kb/PROJECT.md`, `kb/WORKFLOW.md`, `supabase_schema_notes.sql`
Resposta:

## Auth, sessão e segurança

### Q021. O admin deve continuar permitindo `signUp` direto pela UI pública?
Pergunta: qualquer pessoa que chegue em `/editar` deveria conseguir criar uma conta autenticada?
Contexto: `LoginCard` oferece “Primeira vez? Criar conta”, e as policies `auth_all_*` dão CRUD total a qualquer usuário autenticado. Sem allowlist, isso parece virar cadastro livre de administrador.
Onde apareceu: `src/pages/admin/LoginCard.tsx`, `supabase_schema_notes.sql`
Resposta:

### Q022. Existe alguma restrição de quais e-mails podem se tornar administradores?
Pergunta: o projeto espera um allowlist/convite manual ou hoje qualquer conta autenticada é admin por definição?
Contexto: as policies usam apenas `auth.role() = 'authenticated'`, sem distinção de perfil, claim ou tabela de permissões.
Onde apareceu: `supabase_schema_notes.sql`
Resposta:

### Q023. A recomendação de desabilitar confirmação de e-mail é realmente aceitável para produção?
Pergunta: isso é decisão consciente para uso doméstico ou só um atalho de setup?
Contexto: o SQL sugere desmarcar “Confirm email”, o que combinado com `signUp` aberto reduz bastante a barreira de criação de contas com privilégio total.
Onde apareceu: `supabase_schema_notes.sql`, `src/pages/admin/LoginCard.tsx`
Resposta:

### Q024. Como as crianças devem marcar rotinas no `/painel` se o RLS documentado não permite escrita anônima em `kid_routine_checks`?
Pergunta: a policy está incompleta, o fluxo do painel pressupõe login invisível, ou o comportamento atual está quebrado em produção?
Contexto: `toggleRoutine()` faz `upsert` em `kid_routine_checks` no painel público, mas o SQL documenta `anon` apenas com `SELECT` nessa tabela.
Onde apareceu: `src/hooks/useKioskData.ts`, `src/App.tsx`, `supabase_schema_notes.sql`, `kb/PROJECT.md`
Resposta:

### Q025. O painel público e a área admin devem compartilhar a mesma sessão persistida no navegador?
Pergunta: é seguro/intencional usar o mesmo `supabase` client com `persistSession: true` em um kiosk compartilhado?
Contexto: se alguém loga no mesmo browser do painel, a sessão fica persistida para toda a origem e o dispositivo público passa a operar como cliente autenticado.
Onde apareceu: `src/lib/supabase.ts`, `src/pages/EditPage.tsx`, `src/App.tsx`
Resposta:

### Q026. O cache offline em `localStorage` deveria ser separado entre contexto público e admin?
Pergunta: o projeto aceita o risco de o fetch autenticado do admin alimentar o mesmo cache lido pelo painel público?
Contexto: `OFFLINE_CACHE_KEY` é único. `useKioskData` salva dados completos após fetch autenticado no `/editar`, e o fallback offline do `/painel` reaproveita esse mesmo cache.
Onde apareceu: `src/hooks/useKioskData.ts`
Resposta:

### Q027. É aceitável que dados privados autenticados fiquem persistidos em `localStorage` no mesmo dispositivo do kiosk?
Pergunta: esse armazenamento local de payload completo é comportamento aceito ou precisa de mitigação?
Contexto: além do risco de vazamento visual no fallback público, o conteúdo privado fica persistido no navegador e acessível localmente.
Onde apareceu: `src/hooks/useKioskData.ts`
Resposta:

### Q028. O modo visitas local do painel deve poder desativar um modo visitas global vindo do banco?
Pergunta: a regra de precedência entre `visitMode` local e `settings.visit_mode` global é a desejada?
Contexto: hoje o local pode ativar privacidade extra, mas se o global estiver ativo o painel empurra o estado local de volta para `true`, impedindo desligar localmente.
Onde apareceu: `src/App.tsx`, `src/hooks/useKioskData.ts`
Resposta:

### Q029. A recuperação de senha está completa do ponto de vista de UX e segurança?
Pergunta: o fluxo de `resetPasswordForEmail(... redirectTo: /editar)` está suficiente ou falta tela/estado específico para concluir a redefinição de senha?
Contexto: a UI envia o e-mail, mas não há handling explícito de fluxo de recuperação além de voltar para `/editar`.
Onde apareceu: `src/pages/admin/LoginCard.tsx`
Resposta:

### Q030. O service worker deve cachear a shell do admin do mesmo jeito que cacheia o painel?
Pergunta: é desejado que `/editar` e assets associados fiquem disponíveis via cache, inclusive em dispositivos compartilhados?
Contexto: `sw.js` cacheia navegação e assets de qualquer rota GET que não seja Supabase, incluindo a área administrativa.
Onde apareceu: `public/sw.js`, `src/main.tsx`
Resposta:

## Painel público, privacidade e comportamento do kiosk

### Q031. O relógio, a saudação e o “dia de hoje” do painel devem seguir o timezone da família ou o timezone do dispositivo?
Pergunta: qual relógio é a fonte de verdade na UI do kiosk?
Contexto: a camada de dados usa `getFamilyDate()` com timezone configurável, mas o painel usa `new Date()`/`toLocaleDateString()` diretamente em vários pontos.
Onde apareceu: `src/App.tsx`, `src/lib/date-utils.ts`
Resposta:

### Q032. O destaque do dia atual no calendário deveria usar a mesma base temporal da semana calculada?
Pergunta: vocês querem consistência total com o timezone da família?
Contexto: `weekStart` e `dateKey` usam `getFamilyDate`, mas `CalendarGrid` calcula `todayInWeek` com `new Date()` local do dispositivo.
Onde apareceu: `src/App.tsx`, `src/hooks/useKioskData.ts`, `src/lib/date-utils.ts`
Resposta:

### Q033. O timeline do calendário deve esconder eventos fora da janela 07:00–22:00?
Pergunta: isso é um recorte intencional do domínio ou uma limitação temporária da UI?
Contexto: eventos antes das 07h ou depois das 22h são descartados do bloco com horário; para quem consulta o painel isso pode parecer desaparecimento de agenda.
Onde apareceu: `src/App.tsx`
Resposta:

### Q034. O algoritmo de empilhamento do timeline precisa tratar sobreposições reais ou só janelas idênticas?
Pergunta: o projeto aceita eventos sobrepostos se encobrindo visualmente?
Contexto: o `stackIndex` só cresce quando `startHour` e `endHour` são exatamente iguais; eventos parcialmente sobrepostos continuam renderizando no mesmo espaço.
Onde apareceu: `src/App.tsx`
Resposta:

### Q035. O painel deve continuar permitindo toggle local de visit mode para qualquer visitante?
Pergunta: qualquer pessoa em frente ao kiosk pode mudar esse estado localmente por design?
Contexto: a sidebar do painel expõe um `Switch` sempre visível no modo público, sem qualquer confirmação ou distinção entre visitante e morador.
Onde apareceu: `src/App.tsx`
Resposta:

### Q036. O projeto aceita carregar Google Fonts em runtime no kiosk?
Pergunta: essa dependência externa é aceitável para um painel doméstico que quer confiabilidade/offline?
Contexto: `index.css` importa `fonts.googleapis.com`; em ambiente sem internet ou com bloqueio externo o visual muda e pode degradar legibilidade.
Onde apareceu: `src/index.css`
Resposta:

### Q037. O ícone/branding de PWA ainda pode ser o `vite.svg` padrão?
Pergunta: isso é placeholder temporário ou branding intencional?
Contexto: `index.html` e `manifest.json` apontam para `vite.svg`, enquanto a documentação fala em PWA mais “produto” e cita ícones 192/512 que não existem no repo.
Onde apareceu: `index.html`, `public/manifest.json`, `kb/KIOSK.md`
Resposta:

### Q038. O suporte PWA documentado está no nível desejado ou está superestimado?
Pergunta: vocês consideram a PWA “pronta” com o estado atual ou ainda é um suporte básico?
Contexto: há manifest, sw e meta tags iOS, mas sem ícones adequados, sem estratégia clara de atualização e sem isolamento entre dados públicos e privados no cache/localStorage.
Onde apareceu: `index.html`, `public/manifest.json`, `public/sw.js`, `kb/KIOSK.md`
Resposta:

## Área administrativa, CRUD e integridade de comportamento

### Q039. `ContentAdmin` deveria pré-carregar o foco atual depois que os dados chegam?
Pergunta: a tela deveria abrir mostrando o foco semanal já salvo para edição?
Contexto: `focusForm` é inicializado a partir de props só no primeiro render; como os dados chegam async, o estado tende a ficar vazio mesmo quando já existe foco ativo no banco.
Onde apareceu: `src/pages/admin/ContentAdmin.tsx`
Resposta:

### Q040. `ContentAdmin` deveria pré-carregar as notas atuais da criança selecionada?
Pergunta: a experiência esperada é editar notas existentes ou sempre digitar tudo do zero?
Contexto: a UI mostra “tópicos atuais” abaixo, mas o textarea não é preenchido com o conteúdo salvo; isso dificulta edição incremental.
Onde apareceu: `src/pages/admin/ContentAdmin.tsx`
Resposta:

### Q041. `ContentAdmin` deveria escolher automaticamente a primeira criança quando `people` carrega?
Pergunta: vocês querem que a tela funcione sem exigir re-seleção manual após o carregamento?
Contexto: `noteKid` é inicializado uma vez com `kids[0]?.id`; se `people` estiver vazio no primeiro render, o estado fica `''` e o usuário pode precisar interagir para a tela “entrar no eixo”.
Onde apareceu: `src/pages/admin/ContentAdmin.tsx`
Resposta:

### Q042. `RoutinesAdmin` deveria reagir ao carregamento assíncrono de `kids` para definir `personId` inicial?
Pergunta: o formulário de criação deve funcionar de primeira quando os dados terminam de carregar?
Contexto: `form.personId` usa `kids[0]?.id` só na inicialização do estado; com carregamento async, o select pode exibir opções depois, mas o estado continuar vazio.
Onde apareceu: `src/pages/admin/RoutinesAdmin.tsx`
Resposta:

### Q043. `PeopleAdmin` deveria permitir definir privacidade já na criação?
Pergunta: o campo `isPrivate` no estado do formulário é feature planejada ou sobra de implementação incompleta?
Contexto: o estado local possui `isPrivate`, mas a UI do formulário não expõe nenhum controle para isso; só dá para tornar privado depois da criação.
Onde apareceu: `src/pages/admin/PeopleAdmin.tsx`
Resposta:

### Q044. A troca de ordem de pessoas precisa ser transacional?
Pergunta: é aceitável que a ordenação dependa de duas updates independentes sem tratamento de erro conjunto?
Contexto: `movePerson()` faz `Promise.all` de dois updates e sempre mostra sucesso, sem validar erro de cada operação nem garantir atomicidade.
Onde apareceu: `src/pages/admin/PeopleAdmin.tsx`
Resposta:

### Q045. O admin quer uma política consistente para loading/double-submit em todas as mutações?
Pergunta: hoje isso é requisito ou best effort?
Contexto: alguns fluxos têm loading (`PeopleAdmin`), outros não; várias ações podem ser disparadas múltiplas vezes rapidamente sem bloqueio visual nem debounce.
Onde apareceu: `src/pages/admin/*.tsx`, `src/pages/EditPage.tsx`
Resposta:

### Q046. O fluxo de atualização de foco semanal precisa ser atômico?
Pergunta: vocês aceitam o risco de ficar sem foco ativo se a segunda query falhar?
Contexto: `saveFocus()` faz `update({ is_active: false })` em tudo e só depois `insert(...)`; sem transação, falha parcial deixa o sistema em estado inválido.
Onde apareceu: `src/pages/admin/ContentAdmin.tsx`
Resposta:

### Q047. Eventos recorrentes/pontuais devem continuar sendo privados por padrão `false` na criação?
Pergunta: o default “público” é deliberado para esse domínio?
Contexto: novos eventos são criados com `is_private: false`; em um painel doméstico, isso talvez aumente o risco de expor informação sensível por engano.
Onde apareceu: `src/pages/admin/AgendaAdmin.tsx`, `src/pages/admin/ReplenishAdmin.tsx`, `src/pages/admin/RoutinesAdmin.tsx`
Resposta:

### Q048. O projeto quer validação mais forte de dados ainda no client admin?
Pergunta: o nível atual de validação é suficiente ou incompleto?
Contexto: há alguma validação de horário e título, mas faltam vários casos como trim consistente, limites de tamanho, sanitização/coerência de listas e confirmação de dependências antes de exclusão.
Onde apareceu: `src/pages/admin/*.tsx`
Resposta:

### Q049. O `EditPage` deveria ter navegação/arquitetura mais explícita para módulos administrativos?
Pergunta: manter tudo em um único page container com tabs horizontais é a decisão final ou isso deve evoluir para rotas/seções mais desacopladas?
Contexto: a tela centraliza sessão, refresh global, visit mode, login e todos os módulos CRUD num único fluxo; isso simplifica, mas escala mal quando o domínio crescer.
Onde apareceu: `src/pages/EditPage.tsx`
Resposta:

## Bugs e inconsistências concretas

### Q050. O modo mock em DEV deveria exibir eventos pontuais corretamente?
Pergunta: o bug atual no mock é conhecido/intencional?
Contexto: `mockData.ts` grava `oneOffItems.date` com `toISOString()`, mas `parseDateOnly()` espera `YYYY-MM-DD`; isso produz `Invalid Date` e tende a ocultar eventos pontuais em DEV.
Onde apareceu: `src/lib/mockData.ts`, `src/lib/date-utils.ts`, `src/hooks/useKioskData.ts`
Resposta:

### Q051. O app quer continuar convivendo com falhas de lint que já apontam risco de renderização em cascata?
Pergunta: esses avisos/erros devem ser tratados como bugs reais a corrigir ou apenas ruído do conjunto atual de regras?
Contexto: o linter acusa `setEnabled(...)` e `setVisitMode(true)` dentro de `useEffect`, o que o plugin do React considera propenso a render extra/cascata.
Onde apareceu: `src/App.tsx`, saída de `npm run lint`
Resposta:

### Q052. Os `any` nos mapeadores e na coluna lateral são dívida temporária ou padrão aceito?
Pergunta: o projeto quer tipagem estrita de payload Supabase ou aceita seguir com mapeamento dinâmico?
Contexto: o repo está em `strict`, mas ainda há vários `any` em pontos centrais de dados e renderização.
Onde apareceu: `src/hooks/useKioskData.ts`, `src/App.tsx`, saída de `npm run lint`
Resposta:

### Q053. O conflito com `react-refresh/only-export-components` deve ser resolvido ou ignorado?
Pergunta: vocês querem aderência ao tooling padrão do Vite/React ou aceitam wrappers locais violando Fast Refresh?
Contexto: `button.tsx`, `badge.tsx` e `shared.tsx` exportam helpers/constantes junto de componentes, e o lint já quebra por isso.
Onde apareceu: `src/components/ui/button.tsx`, `src/components/ui/badge.tsx`, `src/pages/admin/shared.tsx`, saída de `npm run lint`
Resposta:

### Q054. O `AbortController` em `useKioskData` é sobra de implementação ou deveria estar realmente conectado às queries?
Pergunta: existe intenção de cancelamento efetivo de fetch ou esse código pode ser simplificado?
Contexto: o controller é criado e abortado, mas não é usado em `fetchAll()` nem repassado às chamadas do Supabase.
Onde apareceu: `src/hooks/useKioskData.ts`
Resposta:

### Q055. O cache offline deveria ser invalidado por usuário, modo ou sensibilidade dos dados?
Pergunta: existe uma estratégia de invalidação/versionamento planejada?
Contexto: o cache usa uma única chave fixa, sem namespace por rota, usuário autenticado, tenant, schema version ou data sensitivity.
Onde apareceu: `src/hooks/useKioskData.ts`
Resposta:

### Q056. A atualização automática a cada 5 minutos ainda faz sentido para todas as tabelas?
Pergunta: o refresh global pode continuar simples assim ou algumas áreas deveriam ter cadência/estratégia diferente?
Contexto: qualquer refresh recarrega todo o conjunto de dados do painel, mesmo se só uma pequena parte mudar.
Onde apareceu: `src/hooks/useKioskData.ts`
Resposta:

## Performance, bundle e DX

### Q057. O bundle atual precisa de code splitting?
Pergunta: vocês querem atacar o warning de chunk size agora ou consideram o peso aceitável para este produto?
Contexto: o build acusa bundle JS minificado acima de 500 kB. Como o app roda em kiosk/FireTV/iPad, isso pode afetar cold start e atualização.
Onde apareceu: saída de `npm run build`, `src/App.tsx`, dependências em `package.json`
Resposta:

### Q058. O projeto quer continuar carregando todas as features do app em um único chunk inicial?
Pergunta: QR, admin, calendário, debug e painéis laterais precisam realmente vir juntos no primeiro carregamento?
Contexto: há boas fronteiras naturais de lazy loading (`/editar`, modal QR, partes do painel), mas hoje tudo entra no mesmo pacote principal.
Onde apareceu: `src/App.tsx`, `src/pages/EditPage.tsx`, saída de `npm run build`
Resposta:

### Q059. O projeto precisa de testes cobrindo fluxos críticos além dos utilitários?
Pergunta: essa ausência é consciente por velocidade ou lacuna a ser atacada?
Contexto: a suíte atual cobre apenas utilitários pequenos; não há testes para auth, RLS assumptions, cache offline, visit mode, CRUD admin ou renderização do painel.
Onde apareceu: `src/lib/__tests__/*.test.ts`
Resposta:

### Q060. O lint deve voltar a ser critério de merge real?
Pergunta: devemos tratar a correção do lint como prioridade estrutural antes de novas features?
Contexto: o script existe e falha; isso costuma degradar DX porque o time deixa de confiar em sinais automáticos.
Onde apareceu: `package.json`, `eslint.config.js`, saída de `npm run lint`
Resposta:

### Q061. Falta CI/proteção automatizada é decisão de simplicidade ou dívida aceitável só por enquanto?
Pergunta: vocês querem continuar dependentes apenas de checagem manual local antes de merge?
Contexto: o repo tem scripts locais, mas não há sinal de pipeline, GitHub Actions ou verificação mínima automatizada versionada.
Onde apareceu: estrutura geral do repo
Resposta:

### Q062. Os wrappers locais de shadcn/ui devem continuar personalizados caso a caso ou ser mais próximos do upstream?
Pergunta: a equipe prefere conveniência local, mesmo com divergência do upstream e lint quebrado, ou quer reduzir customizações?
Contexto: alguns wrappers foram alterados e isso já impacta Fast Refresh, tipagem e consistência de export.
Onde apareceu: `src/components/ui/*.tsx`
Resposta:

## Lacunas de validação

### Q063. Existe algum comportamento de produção no Supabase real que contradiga as assumptions do repo?
Pergunta: há policies, triggers, constraints ou configs já aplicadas no projeto Supabase que não estão refletidas em `supabase_schema_notes.sql`?
Contexto: vários riscos acima dependem de o SQL canônico realmente representar o ambiente em produção; se o banco real divergiu, parte das conclusões muda.
Onde apareceu: `supabase_schema_notes.sql`, comportamento esperado do app
Resposta:

### Q064. O kiosk real usa o mesmo navegador/dispositivo para `/painel` e `/editar`?
Pergunta: qual é o fluxo operacional real no hardware da casa?
Contexto: várias decisões de sessão, cache, risco de vazamento e UX dependem de se o admin entra no mesmo device/origin do painel ou em outro aparelho.
Onde apareceu: `kb/PROJECT.md`, `kb/KIOSK.md`, arquitetura atual do app
Resposta:

### Q065. O volume real de dados da família já está perto de expor gargalos?
Pergunta: qual é a expectativa de crescimento de agenda, checks, notas e foco semanal ao longo de meses/anos?
Contexto: sem esse dado, fica difícil decidir se o fetch total atual é “simples e suficiente” ou um gargalo inevitável.
Onde apareceu: `src/hooks/useKioskData.ts`, `kb/PROJECT.md`
Resposta:
