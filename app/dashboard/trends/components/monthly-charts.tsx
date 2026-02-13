'use client';

import { format, parse } from 'date-fns';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, LabelList } from 'recharts';

import { appRoutes } from '@/components/constants';
import { Button } from '@/components/ui/button';
import { MonthlyCategoryTotalT } from '@/app/lib/data';
import { chartColors } from '@/components/constants';
import { categoriesDictionary } from '@/app/lib/constants';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';

type MonthlyData = MonthlyCategoryTotalT[];

interface IMonthlyChartsProps {
  data: MonthlyData;
}

export function MonthlyCharts({ data }: IMonthlyChartsProps) {
  const router = useRouter();

  // Group data by year-month, then by category
  const groupedByMonth = data.reduce(
    (acc, item) => {
      const date = new Date(item.year, item.month - 1);
      const monthKey = format(date, 'MM-yyyy');

      if (!acc[monthKey]) {
        acc[monthKey] = {};
      }

      if (!acc[monthKey][item.category]) {
        acc[monthKey][item.category] = item.total;
      }

      return acc;
    },
    {} as Record<string, Record<number, number>>,
  );

  // Transform grouped data for charts
  const chartData = Object.entries(groupedByMonth)
    .map(([monthKey, categories]) => {
      const chartItems = Object.entries(categories).map(([categoryId, value], catIndex) => ({
        name: categoriesDictionary[categoryId as any] || categoryId,
        value: value / 100,
        fill: chartColors[catIndex % chartColors.length],
      }));

      const total = chartItems.reduce((acc, item) => acc + item.value, 0);

      // Create chart config for this month's categories
      const config: ChartConfig = {};
      Object.keys(categories).forEach(category => {
        config[category] = { label: category };
      });

      const monthTitle = format(parse(monthKey, 'MM-yyyy', new Date()), 'MMMM yyyy');

      return {
        monthTitle,
        monthKey,
        chartItems,
        total,
        config,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const openDetailedView = (date: string) => {
    const params = new URLSearchParams();
    params.set('month', date);

    router.push(`${appRoutes.monthly.route}?${params.toString()}`);
  };

  return (
    <div className="grid auto-rows-min gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
      {chartData.map(({ monthKey, monthTitle, chartItems, total, config }) => (
        <Card key={monthKey} className="gap-1">
          <CardHeader className="gap-0">
            <CardTitle className="text-sm font-normal">{monthTitle}</CardTitle>
            <CardDescription className="font-bold text-2xl text-foreground">€ {total.toFixed(2)}</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" onClick={() => openDetailedView(monthKey)}>
                Detailed view
              </Button>
            </CardAction>
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
      ))}
    </div>
  );
}
