import { Suspense } from 'react';

import { StatsCards, StatsCardsSkeleton } from './components/stats-cards';
import { DataTable, DataTableSkeleton } from './components/data-table';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>
      <Suspense fallback={<DataTableSkeleton />}>
        <DataTable />
      </Suspense>
    </div>
  );
}
