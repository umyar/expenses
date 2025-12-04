'use client';

import { usePathname } from 'next/navigation';
import { BreadcrumbPage } from '@/components/ui/breadcrumb';

const routeMap: Record<string, string> = {
  '/dashboard': 'Today',
  '/dashboard/by-months': 'By Months',
};

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const pageName = routeMap[pathname] || 'Dashboard';

  return <BreadcrumbPage>{pageName}</BreadcrumbPage>;
}

