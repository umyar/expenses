import { TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardDescription, CardTitle, CardAction, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTodaySpent, fetchMonthSpent } from '@/app/lib/data';

export async function StatsCards() {
  const today = new Date();
  const [todaySpent, monthSpent] = await Promise.all([
    fetchTodaySpent(today),
    fetchMonthSpent(today.getFullYear(), today.getMonth() + 1),
  ]);

  const formatAmount = (amountInCents: number) => {
    const amountInEuros = amountInCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amountInEuros);
  };

  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Spent Today</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatAmount(todaySpent)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp className="size-4" />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">just text</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Spent This Month</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatAmount(monthSpent)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp className="size-4" />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">just text</div>
        </CardFooter>
      </Card>
      <Card className="@container/card" />
      <Card className="@container/card" />
    </div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-[180px] w-full rounded-xl" />
      <Skeleton className="h-[180px] w-full rounded-xl" />
      <Skeleton className="h-[180px] w-full rounded-xl" />
      <Skeleton className="h-[180px] w-full rounded-xl" />
    </div>
  );
}

