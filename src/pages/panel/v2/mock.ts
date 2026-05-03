export type MockPersonType = 'adult' | 'kid';

export interface MockPerson {
  id: string;
  name: string;
  initial: string;
  color: string;
  type: MockPersonType;
}

export interface MockEvent {
  id: string;
  dayOfWeek: number;
  title: string;
  time: string;
  startMinutes: number | null;
  endMinutes: number | null;
  personIds: string[];
}

export interface MockTask {
  id: string;
  personId: string;
  title: string;
  done: boolean;
}

export interface MockNote {
  id: string;
  kidId: string;
  date: string;
  items: string[];
}

export const mockPeople: MockPerson[] = [
  { id: 'wellington', name: 'Wellington', initial: 'W', color: '#3385CC', type: 'adult' },
  { id: 'amy', name: 'Amy', initial: 'A', color: '#E89A4A', type: 'adult' },
  { id: 'liam', name: 'Liam', initial: 'L', color: '#3F9C6D', type: 'kid' },
  { id: 'olivia', name: 'Olivia', initial: 'O', color: '#B85DA0', type: 'kid' },
];

export const mockEvents: MockEvent[] = [
  { id: 'e01', dayOfWeek: 0, title: 'Culto', time: '9h - 11h', startMinutes: 540, endMinutes: 660, personIds: ['wellington', 'amy', 'liam', 'olivia'] },
  { id: 'e02', dayOfWeek: 0, title: 'Almoço família', time: '12h - 13h', startMinutes: 720, endMinutes: 780, personIds: ['wellington', 'amy', 'liam', 'olivia'] },

  { id: 'e10', dayOfWeek: 1, title: 'Escola', time: '8h - 12h', startMinutes: 480, endMinutes: 720, personIds: ['liam', 'olivia'] },
  { id: 'e11', dayOfWeek: 1, title: 'Prova de matemática', time: '10h - 10:30', startMinutes: 600, endMinutes: 630, personIds: ['olivia'] },
  { id: 'e12', dayOfWeek: 1, title: 'Reunião pais', time: '19h - 20h', startMinutes: 1140, endMinutes: 1200, personIds: ['wellington', 'amy'] },

  { id: 'e20', dayOfWeek: 2, title: 'Dentista', time: '10h - 11h', startMinutes: 600, endMinutes: 660, personIds: ['amy'] },
  { id: 'e21', dayOfWeek: 2, title: 'Mercado', time: '14h - 15h', startMinutes: 840, endMinutes: 900, personIds: ['amy'] },

  { id: 'e30', dayOfWeek: 3, title: 'Aniversário da mãe', time: 'dia todo', startMinutes: null, endMinutes: null, personIds: ['wellington', 'amy', 'liam', 'olivia'] },
  { id: 'e31', dayOfWeek: 3, title: 'Pagar contas', time: '', startMinutes: null, endMinutes: null, personIds: ['amy'] },
  { id: 'e32', dayOfWeek: 3, title: 'Jantar fora', time: '19h - 21h', startMinutes: 1140, endMinutes: 1260, personIds: ['wellington', 'amy'] },

  { id: 'e40', dayOfWeek: 4, title: 'Reunião equipe', time: '10:30 - 11:30', startMinutes: 630, endMinutes: 690, personIds: ['wellington'] },
  { id: 'e41', dayOfWeek: 4, title: 'Almoço', time: '12h - 13h', startMinutes: 720, endMinutes: 780, personIds: ['wellington', 'amy'] },

  { id: 'e50', dayOfWeek: 5, title: 'Field trip', time: '9h - 12h', startMinutes: 540, endMinutes: 720, personIds: ['liam'] },
  { id: 'e51', dayOfWeek: 5, title: 'Almoço família', time: '12h - 13h', startMinutes: 720, endMinutes: 780, personIds: ['wellington', 'amy', 'liam', 'olivia'] },

  { id: 'e60', dayOfWeek: 6, title: 'Aula de piano', time: '10h - 11h', startMinutes: 600, endMinutes: 660, personIds: ['olivia'] },
  { id: 'e61', dayOfWeek: 6, title: 'Aniversário Jenny', time: '15h - 17h', startMinutes: 900, endMinutes: 1020, personIds: ['wellington', 'amy', 'liam', 'olivia'] },
];

export const mockTasks: MockTask[] = [
  { id: 't1', personId: 'liam', title: 'Escovar dentes', done: true },
  { id: 't2', personId: 'liam', title: 'Arrumar a cama', done: true },
  { id: 't3', personId: 'liam', title: 'Ler 15 minutos', done: false },
  { id: 't4', personId: 'olivia', title: 'Lição de matemática', done: true },
  { id: 't5', personId: 'olivia', title: 'Ler 1 capítulo', done: true },
  { id: 't6', personId: 'olivia', title: 'Caligrafia', done: true },
  { id: 't7', personId: 'olivia', title: 'Atividade de ciências', done: false },
  { id: 't8', personId: 'olivia', title: 'Brincar livre 30 min', done: false },
];

export const mockNotes: MockNote[] = [
  {
    id: 'n1',
    kidId: 'olivia',
    date: '2026-05-03',
    items: ['Hoje terminou tabuada do 6 sem ajuda', 'Pediu para ler em voz alta na hora do café'],
  },
  {
    id: 'n2',
    kidId: 'olivia',
    date: '2026-05-02',
    items: ['Relutante na escrita, melhorou após pausa'],
  },
  {
    id: 'n3',
    kidId: 'olivia',
    date: '2026-04-29',
    items: ['Conseguiu somar frações com denominador igual'],
  },
  {
    id: 'n4',
    kidId: 'liam',
    date: '2026-05-01',
    items: ['Leu sozinho um livro inteiro pela primeira vez'],
  },
];

export const mockWeeklyFocus: Record<string, string> = {
  liam: 'Ler 15 minutos por dia, sem ser interrompido',
  olivia: 'Aprender as tabuadas do 6 e do 7',
};

export const mockWeather = { temperatureC: 24, label: 'Ensolarado' };
