'use client';

import {
  LayoutDashboard,
  MessageSquare,
  Megaphone,
  ClipboardList,
  Briefcase,
  BookCopy,
  Upload,
  Users,
  UserCheck,
  CalendarCheck,
  Mail,
  Map,
  GraduationCap,
  ListOrdered,
  BookMarked,
  PencilRuler,
} from 'lucide-react';
import {SidebarMenu, SidebarMenuItem, SidebarMenuButton} from '@/components/ui/sidebar';
import Link from 'next/link';
import {usePathname} from 'next/navigation';

const navItems = [
  {href: '/', label: 'Dashboard', icon: LayoutDashboard},
  {href: '/chat', label: 'Chat', icon: MessageSquare},
  {href: '/announcements', label: 'Announcements', icon: Megaphone},
  {href: '/assignments', label: 'Assignments', icon: ListOrdered},
  {href: '/exercises', label: 'Exercises', icon: PencilRuler},
  {href: '/projects', label: 'Projects', icon: BookMarked},
  {href: '/materials', label: 'Class Materials', icon: BookCopy},
  {href: '/submissions', label: 'Submissions', icon: Upload},
  {href: '/students', label: 'Student Management', icon: Users},
  {href: '/attendance', label: 'Attendance', icon: UserCheck},
  {href: '/bookings', label: 'Manage Bookings', icon: CalendarCheck},
  {href: '/dms', label: 'DMs', icon: Mail},
  {href: '/roadmap', label: 'Roadmap', icon: Map},
  {href: '/career', label: 'Career Module', icon: GraduationCap},
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu className="mt-8">
      {navItems.map(item => {
        const isActive =
          (pathname === '/' && item.href === '/') ||
          (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
