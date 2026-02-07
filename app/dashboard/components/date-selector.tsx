'use client';

import { format, subDays, addDays, isAfter, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DateSelectorProps {
  value: Date;
  onChange: (date: Date) => void;
}

export function DateSelector({ value, onChange }: DateSelectorProps) {
  const today = startOfDay(new Date());
  const nextDay = addDays(value, 1);
  const isNextDayAfterToday = isAfter(startOfDay(nextDay), today);

  return (
    <div className="flex items-center">
      <Button variant="outline" size="icon" onClick={() => onChange(subDays(value, 1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="px-3 py-2 text-sm font-medium min-w-[120px] text-center">
        {format(value, 'dd-MM-yyyy')}
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(addDays(value, 1))}
        disabled={isNextDayAfterToday}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
