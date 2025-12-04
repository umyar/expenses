'use client';

import { usePathname } from 'next/navigation';
import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

interface SubMenuItem {
  title: string;
  url: string;
}

interface SidebarSubmenuProps {
  items: SubMenuItem[];
}

export function SidebarSubmenu({ items }: SidebarSubmenuProps) {
  const pathname = usePathname();

  return (
    <SidebarMenuSub>
      {items.map(subItem => (
        <SidebarMenuSubItem key={subItem.title}>
          <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
            <a href={subItem.url}>{subItem.title}</a>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );
}

