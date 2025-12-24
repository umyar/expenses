import { parse, getYear, getMonth, isValid } from 'date-fns';

import { fetchMonthlyTotalsByCategories } from '@/app/lib/data';
import { MonthSelector } from './components/month-selector';
import { MonthlyTable } from './components/monthly-table';
import { MonthlyChart } from './components/monthly-chart';

export const dynamic = 'force-dynamic';

interface IMonthsPageProps {
  searchParams?: Promise<{
    month?: string;
  }>;
}

export default async function ByMonthsPage({ searchParams }: IMonthsPageProps) {
  const receivedSearchParams = await searchParams;
  const parsedMonth = parse(String(receivedSearchParams?.month), 'MM-yyyy', new Date());

  let year = getYear(new Date());
  let month = getMonth(new Date()) + 1;

  if (isValid(parsedMonth)) {
    year = getYear(parsedMonth);
    month = getMonth(parsedMonth) + 1;
  }

  const data = await fetchMonthlyTotalsByCategories(year, month);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <MonthSelector defaultMonth={`${month}-${year}`} />
      <MonthlyChart data={data} />
      <MonthlyTable month={month} year={year} />
    </div>
  );
}
