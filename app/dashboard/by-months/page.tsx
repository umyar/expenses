import { fetchMonthlyTotalsByCategories } from '@/app/lib/data';
import { MonthlyCharts } from './components/monthly-charts';

export const dynamic = 'force-dynamic';

export default async function ByMonthsPage() {
  const data = await fetchMonthlyTotalsByCategories(2025, 10);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <MonthlyCharts data={data} />
    </div>
  );
}
