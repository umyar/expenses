'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { format, subDays, addDays, isAfter, startOfDay, parse, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface DateSelectorProps {
  defaultDate: string;
}

const DATE_FORMAT = 'dd-MM-yyyy';

export function DateSelector({ defaultDate }: DateSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const changeUrl = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('date', value);

    router.replace(`${pathname}?${params.toString()}`);
  };

  // Parse the default date prop
  const parsedDefaultDate = React.useMemo(() => {
    const parsed = parse(defaultDate, DATE_FORMAT, new Date());
    return isValid(parsed) ? startOfDay(parsed) : startOfDay(new Date());
  }, [defaultDate]);

  const [selectedDate, setSelectedDate] = React.useState<Date>(parsedDefaultDate);

  // Update selectedDate when defaultDate prop changes
  React.useEffect(() => {
    const parsed = parse(defaultDate, DATE_FORMAT, new Date());
    if (isValid(parsed)) {
      setSelectedDate(startOfDay(parsed));
    }
  }, [defaultDate]);

  const handlePreviousDay = React.useCallback(() => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
    changeUrl(format(newDate, DATE_FORMAT));
  }, [selectedDate]);

  const handleNextDay = React.useCallback(() => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    changeUrl(format(newDate, DATE_FORMAT));
  }, [selectedDate]);

  const today = startOfDay(new Date());
  const nextDay = addDays(selectedDate, 1);
  const isNextDayAfterToday = isAfter(startOfDay(nextDay), today);

  return (
    <div className="flex items-center">
      <Button variant="outline" size="icon" onClick={handlePreviousDay}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="px-3 py-2 text-sm font-medium min-w-[120px] text-center">
        {format(selectedDate, DATE_FORMAT)}
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={handleNextDay}
        disabled={isNextDayAfterToday}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
