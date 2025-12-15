'use client';

import { format } from 'date-fns';
import { PieChart, Pie, LabelList } from 'recharts';

import { MonthlyCategoryTotalT } from '@/app/lib/data';
import { categoriesDictionary } from '@/app/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';

type MonthlyData = MonthlyCategoryTotalT[];

interface IMonthlyChartProps {
  data: MonthlyData;
}

// Generate chart colors using CSS variables
const chartColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
  'var(--chart-9)',
  'var(--chart-10)',
];

export function MonthlyChart({ data }: IMonthlyChartProps) {
  const chartItems: any = [];
  const config: ChartConfig = {};
  let total = 0;
  const date = new Date(data[0].year, data[0].month - 1);
  const monthTitle = format(date, 'MMMM yyyy');

  data.forEach((categoryData, index) => {
    chartItems.push({
      name: categoriesDictionary[categoryData.category] || categoryData.category,
      value: categoryData.total / 100,
      fill: chartColors[index % chartColors.length],
    });
    config[categoryData.category] = { label: categoryData.category };
    total += categoryData.total / 100;
  });

  return (
    <div className="grid auto-rows-min gap-4">
      <Card className="gap-1">
        <CardHeader className="gap-0">
          <CardTitle className="text-sm font-normal">{monthTitle}</CardTitle>
          <CardDescription className="font-bold text-2xl text-foreground">€ {total.toFixed(2)}</CardDescription>
        </CardHeader>
        <CardContent>
          {chartItems.length > 0 ? (
            <ChartContainer config={config} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={chartItems}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label={({ name }) => name}
                  labelLine
                >
                  <LabelList
                    dataKey="value"
                    className="fill-background"
                    stroke="none"
                    fontSize={12}
                    formatter={(value: string) => `€ ${value}`}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No data for this month
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
