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
