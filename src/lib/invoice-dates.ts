// Date-only strings stay in calendar time; converting local midnight to UTC can
// move the last day of a billing month to the previous day in Vietnam.
export function invoiceReadingDates(billingMonth: string, startDate: string, endDate: string, today: string) {
  const [year, month] = billingMonth.split('-').map(Number);
  const monthEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  const min = startDate > `${billingMonth}-01` ? startDate : `${billingMonth}-01`;
  const max = [monthEnd, endDate, today].sort()[0];
  return { min, max };
}
