import { addDays, startOfWeek } from 'date-fns';

import type { FamilyData } from './types';

const today = new Date();
const sunday = startOfWeek(today, { weekStartsOn: 0 });

export const mockData: FamilyData = {
  people: [
    { id: 'benjamin', name: 'Benjamin', color: '#2563EB', type: 'kid' },
    { id: 'jose', name: 'José', color: '#16A34A', type: 'kid' },
    { id: 'judah', name: 'Judah', color: '#DC2626', type: 'kid' },
    { id: 'leia', name: 'Léia', color: '#F97316', type: 'adult' },
    { id: 'pai', name: 'Pai', color: '#0EA5E9', type: 'adult', isPrivate: true },
  ],
  recurringItems: [
    {
      id: 'r1',
      title: 'Devocional manhã',
      dayOfWeek: 2,
      timeText: '07:30',
      personId: 'leia',
      personIds: ['leia'],
    },
    {
      id: 'r2',
      title: 'Jiu-jitsu',
      dayOfWeek: 3,
      timeText: '18:00',
      personId: 'benjamin',
      personIds: ['benjamin'],
    },
    {
      id: 'r3',
      title: 'Aula música',
      dayOfWeek: 5,
      timeText: '16:30',
      personId: 'jose',
      personIds: ['jose'],
      isPrivate: true,
    },
    {
      id: 'r4',
      title: 'Célula família',
      dayOfWeek: 6,
      timeText: '20:00',
      personId: 'pai',
      personIds: ['pai', 'leia'],
    },
  ],
  oneOffItems: [
    {
      id: 'o1',
      title: 'Aniversário vovó',
      date: addDays(sunday, 0).toISOString(),
      timeText: '19:00',
      personId: 'leia',
      personIds: ['leia'],
    },
    {
      id: 'o2',
      title: 'Consulta pediatra',
      date: addDays(sunday, 3).toISOString(),
      timeText: '09:20',
      personId: 'judah',
      personIds: ['judah'],
    },
    {
      id: 'o3',
      title: 'Playdate',
      date: addDays(sunday, 6).toISOString(),
      timeText: '15:00',
      personId: 'benjamin',
      personIds: ['benjamin'],
      isPrivate: true,
    },
  ],
  replenishItems: [
    { id: 'rep1', title: 'Fraldas Judah', urgency: 'now', isActive: true },
    { id: 'rep2', title: 'Leite vegetal', urgency: 'soon', isActive: true },
    { id: 'rep3', title: 'Lápis de cor', urgency: 'soon', isActive: true, isPrivate: true },
    { id: 'rep4', title: 'Pilhas AA', urgency: 'now', isActive: false },
  ],
  kidRoutineTemplates: [
    { id: 'kt1', personId: 'benjamin', title: 'Arrumar cama', isActive: true },
    { id: 'kt2', personId: 'benjamin', title: 'Leitura 15min', isActive: true },
    { id: 'kt3', personId: 'jose', title: 'Devoção', isActive: true },
    { id: 'kt4', personId: 'jose', title: 'Matemática 20min', isActive: true },
    { id: 'kt5', personId: 'judah', title: 'Falar palavras novas', isActive: true },
    { id: 'kt6', personId: 'judah', title: 'Brincar fora', isActive: true },
  ],
  kidRoutineChecks: [],
  weeklyFocus: [
    {
      id: 'wf1',
      text: '“Ensina a criança no caminho em que deve andar...”',
      reference: 'Pv 22:6',
      isActive: true,
    },
  ],
  homeschoolNotes: [
    {
      id: 'h1',
      kidPersonId: 'benjamin',
      notes: [
        'Leitura: capítulo de Nárnia',
        'Copiar 3 frases',
        'Frações simples com pizza',
        'Memorizar Salmo 23:1',
        'Escrita cursiva 2 linhas',
      ],
      createdAt: today.toISOString(),
    },
    {
      id: 'h2',
      kidPersonId: 'jose',
      notes: [
        'Cálculo mental 20 cartas',
        'Inglês: cores e formas',
        'Letras cursivas “la, le, li”',
      ],
      createdAt: today.toISOString(),
    },
    {
      id: 'h3',
      kidPersonId: 'judah',
      notes: ['Brincar de massinha', 'Sons de animais', 'História da arca'],
      createdAt: today.toISOString(),
    },
  ],
  settings: {
    visitMode: false,
  },
};
