'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export const MonthsToggle = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentPage = searchParams.get('months') || '3';

  const changeUrl = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('months', value);

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-4 items-center text-neutral-500">
      <span className="text-sm">Months:</span>
      <ToggleGroup type="single" value={currentPage} onValueChange={changeUrl} variant="outline">
        <ToggleGroupItem value="3">Last 3</ToggleGroupItem>
        <ToggleGroupItem value="6">Last 6</ToggleGroupItem>
        <ToggleGroupItem value="all">All</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};
