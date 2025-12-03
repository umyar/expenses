'use client';

import { format } from 'date-fns';
import { PieChart, Pie, LabelList } from 'recharts';

import { MonthlyCategoryTotalT } from '@/app/lib/data';
import { categoriesDictionary } from '@/app/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';

type MonthlyData = MonthlyCategoryTotalT[];

interface MonthlyChartsProps {
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

export function MonthlyCharts({ data }: MonthlyChartsProps) {
  // Group data by year-month, then by category
  const groupedByMonth = data.reduce(
    (acc, item) => {
      const date = new Date(item.year, item.month - 1);
      const monthKey = format(date, 'MMMM yyyy');
      if (!acc[monthKey]) {
        acc[monthKey] = {};
      }
      if (!acc[monthKey][item.category]) {
        acc[monthKey][item.category] = 0;
      }
      acc[monthKey][item.category] += item.total;
      return acc;
    },
    {} as Record<string, Record<string, number>>,
  );

  // Transform grouped data for charts
  const chartData = Object.entries(groupedByMonth)
    .map(([monthKey, categories]) => {
      const chartItems = Object.entries(categories).map(([name, value], catIndex) => ({
        name: categoriesDictionary[name] || name,
        value: value / 100,
        fill: chartColors[catIndex % chartColors.length],
      }));

      const total = chartItems.reduce((acc, item) => acc + item.value, 0);

      // Create chart config for this month's categories
      const config: ChartConfig = {};
      Object.keys(categories).forEach(category => {
        config[category] = { label: category };
      });

      return {
        monthKey,
        chartItems,
        total,
        config,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="grid auto-rows-min gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
      {chartData.map(({ monthKey, chartItems, total, config }) => (
        <Card key={monthKey} className="gap-1">
          <CardHeader className="gap-0">
            <CardTitle className="text-sm font-normal">{monthKey}</CardTitle>
            <CardDescription className="font-bold text-2xl text-foreground">€ {total.toFixed(2)}</CardDescription>
          </CardHeader>
          <CardContent>
            {chartItems.length > 0 ? (
              <ChartContainer config={config} className="h-[300px] w-full">
                <PieChart>
                  {/*<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />*/}
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
      ))}
    </div>
  );
}
