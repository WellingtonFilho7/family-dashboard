import { Link } from 'react-router-dom';

import { SectionTitle } from './components/SectionTitle';

export default function SettingsMode() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 pb-12">
      <section>
        <SectionTitle>Configurações</SectionTitle>
        <div className="rounded-2xl border border-border/40 bg-card p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            A v1 do painel mantém a edição completa em{' '}
            <Link to="/editar" className="font-medium text-primary underline-offset-4 hover:underline">
              /editar
            </Link>
            . Esta tela vai concentrar atalhos rápidos do dia-a-dia (tema, modo visitas, e o futuro Modo Descanso).
          </p>
        </div>
      </section>

      <section>
        <SectionTitle>Em breve</SectionTitle>
        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
          <li className="rounded-xl border border-dashed border-border/50 px-4 py-3">Tema (claro / escuro / automático)</li>
          <li className="rounded-xl border border-dashed border-border/50 px-4 py-3">Modo visitas</li>
          <li className="rounded-xl border border-dashed border-border/50 px-4 py-3">Modo Descanso (relógio + foco quando ocioso)</li>
        </ul>
      </section>
    </div>
  );
}
