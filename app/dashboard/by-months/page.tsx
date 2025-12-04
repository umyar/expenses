import { fetchMonthlyTotalsByCategories } from '@/app/lib/data';
import { MonthlyCharts } from './components/monthly-charts';
import { MonthsToggle } from './components/months-toggle';

export const dynamic = 'force-dynamic';

interface IMonthsPageProps {
  searchParams?: Promise<{
    months?: string;
  }>;
}

export default async function ByMonthsPage({ searchParams }: IMonthsPageProps) {
  const receivedSearchParams = await searchParams;
  const selectedMonths = receivedSearchParams?.months === 'all' ? Infinity : Number(receivedSearchParams?.months) || 1;

  const data = await fetchMonthlyTotalsByCategories(selectedMonths);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <MonthsToggle />
      <MonthlyCharts data={data} />
    </div>
  );
}
