import type { RecurrenceFrequency, TransactionRecurrence } from '@/types';

const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`);

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const lastDayOfMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

export interface RecurrenceInput {
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

/** Returns every scheduled date between the first compatible day and the inclusive end date. */
export const buildRecurrenceDates = ({
  frequency,
  startDate,
  endDate,
  dayOfWeek,
  dayOfMonth,
}: RecurrenceInput): string[] => {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];

  if (frequency === 'weekly') {
    if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) return [];
    const first = new Date(start);
    first.setDate(first.getDate() + ((dayOfWeek - first.getDay() + 7) % 7));
    const dates: string[] = [];
    for (const date = first; date <= end; date.setDate(date.getDate() + 7)) {
      dates.push(formatLocalDate(date));
    }
    return dates;
  }

  if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) return [];
  const dates: string[] = [];
  let year = start.getFullYear();
  let month = start.getMonth();
  while (true) {
    const date = new Date(year, month, Math.min(dayOfMonth, lastDayOfMonth(year, month)));
    if (date >= start && date <= end) dates.push(formatLocalDate(date));
    if (date > end) break;
    month += 1;
    if (month === 12) {
      month = 0;
      year += 1;
    }
  }
  return dates;
};

export const recurrenceForOccurrence = (
  seriesId: string,
  input: RecurrenceInput,
  occurrenceDate: string,
): TransactionRecurrence => ({
  seriesId,
  frequency: input.frequency,
  dayOfWeek: input.frequency === 'weekly' ? input.dayOfWeek : undefined,
  dayOfMonth: input.frequency === 'monthly' ? input.dayOfMonth : undefined,
  endDate: input.endDate,
  occurrenceDate,
});
