export type PersonType = 'kid' | 'adult' | 'guest';

export interface Person {
  id: string;
  name: string;
  color: string;
  type: PersonType;
  isPrivate?: boolean;
  sortOrder?: number;
}

export interface RecurringItem {
  id: string;
  title: string;
  dayOfWeek: number; // 1 = Sunday ... 7 = Saturday
  timeText: string;
  endTimeText?: string;
  personId: string;
  personIds: string[]; // always populated; falls back to [personId]
  isPrivate?: boolean;
}

export interface OneOffItem {
  id: string;
  title: string;
  date: string; // ISO date
  timeText: string;
  endTimeText?: string;
  personId: string;
  personIds: string[]; // always populated; falls back to [personId]
  isPrivate?: boolean;
}

export interface CalendarItem {
  id: string;
  title: string;
  timeText: string;
  endTimeText?: string;
  date: Date;
  personIds: string[];
  personColors: string[];
}

export interface ReplenishItem {
  id: string;
  title: string;
  urgency: 'now' | 'soon';
  isActive: boolean;
  isPrivate?: boolean;
}

export interface WeeklyFocus {
  id: string;
  text: string;
  reference?: string;
  isActive: boolean;
}

export interface KidRoutineTemplate {
  id: string;
  personId: string;
  title: string;
  isActive: boolean;
  isPrivate?: boolean;
}

export interface KidRoutineCheck {
  id: string;
  templateId: string;
  date: string; // ISO date
  completed: boolean;
}

export interface Settings {
  visitMode: boolean;
}

export interface HomeschoolNote {
  id: string;
  kidPersonId: string;
  notes: string[];
  createdAt: string;
  isPrivate?: boolean;
}

export interface FamilyData {
  people: Person[];
  recurringItems: RecurringItem[];
  oneOffItems: OneOffItem[];
  replenishItems: ReplenishItem[];
  kidRoutineTemplates: KidRoutineTemplate[];
  kidRoutineChecks: KidRoutineCheck[];
  weeklyFocus: WeeklyFocus[];
  homeschoolNotes: HomeschoolNote[];
  settings: Settings;
}
