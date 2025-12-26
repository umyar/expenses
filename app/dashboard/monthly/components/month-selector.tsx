'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { format, subMonths, addMonths, isAfter, startOfMonth, parse, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface MonthSelectorProps {
  defaultMonth: string;
}

// TODO: review the component
export function MonthSelector({ defaultMonth }: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const changeUrl = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('month', value);

    router.push(`${pathname}?${params.toString()}`);
  };

  // Parse the default month prop
  const parsedDefaultMonth = React.useMemo(() => {
    const parsed = parse(defaultMonth, 'MM-yyyy', new Date());
    return isValid(parsed) ? parsed : new Date();
  }, [defaultMonth]);

  const [selectedMonth, setSelectedMonth] = React.useState<Date>(parsedDefaultMonth);

  // Update selectedMonth when defaultMonth prop changes
  React.useEffect(() => {
    const parsed = parse(defaultMonth, 'MM-yyyy', new Date());
    if (isValid(parsed)) {
      setSelectedMonth(parsed);
    }
  }, [defaultMonth]);

  const handlePreviousMonth = React.useCallback(() => {
    const newMonth = subMonths(selectedMonth, 1);
    setSelectedMonth(newMonth);
    changeUrl(format(newMonth, 'MM-yyyy'));
  }, [selectedMonth]);

  const handleNextMonth = React.useCallback(() => {
    const newMonth = addMonths(selectedMonth, 1);
    setSelectedMonth(newMonth);
    changeUrl(format(newMonth, 'MM-yyyy'));
  }, [selectedMonth]);

  const currentMonth = startOfMonth(new Date());
  const nextMonth = addMonths(selectedMonth, 1);
  const isNextMonthAfterCurrent = isAfter(startOfMonth(nextMonth), currentMonth);

  return (
    <div className="flex items-center">
      <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="px-3 py-2 text-sm font-medium min-w-[140px] text-center">
        {format(selectedMonth, 'MMMM yyyy')}
      </div>
      <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={isNextMonthAfterCurrent}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
