import { Suspense } from 'react';
import { parse, isValid, startOfDay } from 'date-fns';

import { StatsCards, StatsCardsSkeleton } from './components/stats-cards';
import { DataTable, DataTableSkeleton } from './components/data-table';

export const dynamic = 'force-dynamic';

interface DashboardPageProps {
  searchParams?: Promise<{
    date?: string;
  }>;
}

export default async function Page({ searchParams }: DashboardPageProps) {
  const receivedSearchParams = await searchParams;
  const parsedDate = parse(String(receivedSearchParams?.date ?? ''), 'dd-MM-yyyy', new Date());

  const selectedDay = isValid(parsedDate) ? startOfDay(parsedDate) : startOfDay(new Date());

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards selectedDay={selectedDay} />
      </Suspense>
      <Suspense fallback={<DataTableSkeleton />}>
        <DataTable selectedDay={selectedDay} />
      </Suspense>
    </div>
  );
}
