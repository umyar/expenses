interface IPageMeta {
  route: string;
  title: string;
}

export const appRoutes: Record<string, IPageMeta> = {
  dashboard: {
    route: '/dashboard',
    title: 'Daily Expenses',
  },
  monthly: {
    route: '/dashboard/monthly',
    title: 'Monthly Expenses',
  },
  trends: {
    route: '/dashboard/trends',
    title: 'Trends',
  },
};

export const chartColors = [
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
