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
  UserCog,
  User,
} from 'lucide-react';
import {SidebarMenu, SidebarMenuItem, SidebarMenuButton} from '@/components/ui/sidebar';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useAuth} from '@/contexts/AuthContext';

const studentNavItems = [
  {href: '/', label: 'Dashboard', icon: LayoutDashboard},
  {href: '/chat', label: 'Chat', icon: MessageSquare},
  {href: '/announcements', label: 'Announcements', icon: Megaphone},
  {href: '/assignments', label: 'Assignments', icon: ListOrdered},
  {href: '/exercises', label: 'Exercises', icon: PencilRuler},
  {href: '/projects', label: 'Projects', icon: BookMarked},
  {href: '/materials', label: 'Class Materials', icon: BookCopy},
  {href: '/submissions', label: 'Submissions', icon: Upload},
  {href: '/timetable', label: 'Timetable', icon: CalendarCheck},
  {href: '/directory', label: 'Directory', icon: Users},
  {href: '/roadmap', label: 'Roadmap', icon: Map},
];

const teacherNavItems = [
  {href: '/', label: 'Dashboard', icon: LayoutDashboard},
  {href: '/chat', label: 'Campus Connect', icon: MessageSquare},
  {href: '/announcements', label: 'Announcements', icon: Megaphone},
  {href: '/assignments', label: 'Assignments', icon: ListOrdered},
  {href: '/exercises', label: 'Exercises', icon: PencilRuler},
  {href: '/projects', label: 'Projects', icon: BookMarked},
  {href: '/materials', label: 'Class Materials', icon: BookCopy},
  {href: '/submissions', label: 'Submissions', icon: Upload},
  {href: '/attendance', label: 'Attendance', icon: UserCheck},
  {href: '/roadmap', label: 'Roadmap', icon: Map},
  {href: '/profile', label: 'Profile', icon: User},
];

const adminNavItems = [
  {href: '/', label: 'Dashboard', icon: LayoutDashboard},
  {href: '/users', label: 'User Management', icon: UserCog},
  {href: '/announcements', label: 'Manage Announcements', icon: Megaphone},
  {href: '/bookings', label: 'Manage Bookings', icon: CalendarCheck},
  {href: '/roadmap', label: 'Roadmap', icon: Map},
  {href: '/career', label: 'Career Module', icon: GraduationCap},
];

export function SidebarNav() {
  const pathname = usePathname();
  const {role} = useAuth();

  let navItems;
  switch (role) {
    case 'student':
      navItems = studentNavItems;
      break;
    case 'teacher':
      navItems = teacherNavItems;
      break;
    case 'admin':
      navItems = adminNavItems;
      break;
    default:
      navItems = [];
  }

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
