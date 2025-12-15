'use client';

import { usePathname } from 'next/navigation';

import { appRoutes } from '@/components/constants';
import { BreadcrumbPage } from '@/components/ui/breadcrumb';

const routeMap: Record<string, string> = Object.values(appRoutes).reduce((acc, currentPage) => {
  // @ts-ignore
  acc[currentPage.route] = currentPage.title;

  return acc;
}, {});

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const pageName = routeMap[pathname] || 'Dashboard';

  return <BreadcrumbPage>{pageName}</BreadcrumbPage>;
}
