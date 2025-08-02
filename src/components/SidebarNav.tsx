
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
  CalendarPlus,
  Rocket,
  Code,
  BookOpen,
  Contact,
  CalendarClock,
  Award,
  TrendingUp,
  History,
  Inbox,
  Star,
} from 'lucide-react';
import {SidebarMenu, SidebarMenuItem, SidebarMenuButton} from '@/components/ui/sidebar';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useAuth} from '@/contexts/AuthContext';
import {useSidebar} from '@/components/ui/sidebar';

export const studentNavItems = [
  {href: '/', label: 'Dashboard', icon: LayoutDashboard},
  {href: '/chat', label: 'Campus Connect', icon: MessageSquare},
  {href: '/announcements', label: 'Announcements', icon: Megaphone},
  {href: '/assignments', label: 'Assignments', icon: ListOrdered},
  {href: '/projects', label: 'Projects', icon: BookMarked},
  {href: '/exercises', label: 'Exercises', icon: PencilRuler},
  {href: '/attendance', label: 'Attendance', icon: UserCheck},
  {href: '/grading', label: 'Grading', icon: Award},
  {href: '/100-days-of-code', label: '100 Days of Code', icon: Code},
  {href: '/roadmap', label: 'Roadmap', icon: Map},
  {href: '/materials', label: 'Class Materials', icon: BookCopy},
  {href: '/resources', label: 'Resources Library', icon: BookOpen},
  {href: '/directory', label: 'Directory', icon: Contact},
  {href: '/book-session', label: 'Book a Session', icon: CalendarPlus},
  {href: '/work-ready', label: 'Work Ready', icon: Rocket},
  {href: '/profile', label: 'Profile', icon: User},
];

export const teacherNavItems = [
  {href: '/', label: 'Dashboard', icon: LayoutDashboard},
  {href: '/chat', label: 'Campus Connect', icon: MessageSquare},
  {href: '/submissions', label: 'All Submissions', icon: Inbox},
  {href: '/students', label: 'Student Management', icon: Users},
  {href: '/rankings', label: 'Rankings', icon: TrendingUp},
  {href: '/announcements', label: 'Announcements', icon: Megaphone},
  {href: '/assignments', label: 'Assignments', icon: ListOrdered},
  {href: '/exercises', label: 'Exercises', icon: PencilRuler},
  {href: '/projects', label: 'Projects', icon: BookMarked},
  {href: '/100-days-of-code/submissions', label: '100 Days of Code', icon: Code},
  {href: '/materials', label: 'Class Materials', icon: BookCopy},
  {href: '/roadmap', label: 'Roadmap', icon: Map},
  {href: '/directory', label: 'Directory', icon: Contact},
  {href: '/availability', label: 'Manage Availability', icon: CalendarClock},
  {href: '/temp-update', label: 'Manual Point Entry', icon: History},
  {href: '/profile', label: 'Profile', icon: User},
];

export const adminNavItems = [
  {href: '/', label: 'Dashboard', icon: LayoutDashboard},
  {href: '/users', label: 'User Management', icon: UserCog},
  {href: '/submissions', label: 'All Submissions', icon: Inbox},
  {href: '/students', label: 'Student Management', icon: Users},
  {href: '/rankings', label: 'Rankings', icon: TrendingUp},
  {href: '/announcements', label: 'Manage Announcements', icon: Megaphone},
  {href: '/assignments', label: 'Assignments', icon: ListOrdered},
  {href: '/exercises', label: 'Exercises', icon: PencilRuler},
  {href: '/projects', label: 'Projects', icon: BookMarked},
  {href: '/100-days-of-code/submissions', label: '100 Days of Code', icon: Code},
  {href: '/bookings', label: 'Manage Bookings', icon: CalendarCheck},
  {href: '/availability', label: 'Manage Availability', icon: CalendarClock},
  {href: '/roadmap', label: 'Roadmap', icon: Map},
  {href: '/directory', label: 'Directory', icon: Contact},
  {href: '/career', label: 'Career Module', icon: GraduationCap},
  {href: '/temp-update', label: 'Manual Point Entry', icon: History},
  {href: '/profile', label: 'Profile', icon: User},
];

export function SidebarNav() {
  const pathname = usePathname();
  const {role} = useAuth();
  const {setOpenMobile} = useSidebar();

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
              <Link href={item.href} onClick={() => setOpenMobile(false)}>
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
