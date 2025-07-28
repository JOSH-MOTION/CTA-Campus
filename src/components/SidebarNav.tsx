'use client';

import {LayoutDashboard, Calendar, FolderKanban, Contact} from 'lucide-react';
import {SidebarMenu, SidebarMenuItem, SidebarMenuButton} from '@/components/ui/sidebar';
import Link from 'next/link';
import {usePathname} from 'next/navigation';

const navItems = [
  {href: '/', label: 'Dashboard', icon: LayoutDashboard},
  {href: '/timetable', label: 'Timetable', icon: Calendar},
  {href: '/resources', label: 'Resources', icon: FolderKanban},
  {href: '/directory', label: 'Directory', icon: Contact},
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu className="mt-8">
      {navItems.map(item => {
        const isActive = (pathname === '/' && item.href === '/') || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <SidebarMenuItem key={item.label}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton isActive={isActive} tooltip={item.label}>
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
