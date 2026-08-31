import { describe, expect, it } from 'vitest';
import { buildRecurrenceDates, recurrenceForOccurrence } from './recurrence';

describe('buildRecurrenceDates', () => {
  it('gera as datas semanais a partir da primeira data compatível, incluindo o fim', () => {
    expect(buildRecurrenceDates({
      frequency: 'weekly', startDate: '2026-01-01', endDate: '2026-01-12', dayOfWeek: 1,
    })).toEqual(['2026-01-05', '2026-01-12']);
  });

  it('usa o último dia em meses sem o dia mensal configurado', () => {
    expect(buildRecurrenceDates({
      frequency: 'monthly', startDate: '2026-01-01', endDate: '2026-03-31', dayOfMonth: 31,
    })).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
  });

  it('mantém os metadados independentes de idioma em cada ocorrência', () => {
    expect(recurrenceForOccurrence('series-a', {
      frequency: 'weekly', startDate: '2026-01-01', endDate: '2026-02-01', dayOfWeek: 1,
    }, '2026-01-05')).toEqual({
      seriesId: 'series-a', frequency: 'weekly', dayOfWeek: 1, dayOfMonth: undefined,
      endDate: '2026-02-01', occurrenceDate: '2026-01-05',
    });
  });
});
