'use client';

import {useAuth} from '@/contexts/AuthContext';
import StudentDashboard from '@/components/dashboards/StudentDashboard';
import TeacherDashboard from '@/components/dashboards/TeacherDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import {useEffect, useState} from 'react';
import type {User} from 'firebase/auth';

export default function DashboardPage() {
  const {user, role} = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // or a loading spinner
  }

  const renderDashboard = () => {
    switch (role) {
      case 'student':
        return <StudentDashboard user={user} />;
      case 'teacher':
        return <TeacherDashboard user={user} />;
      case 'admin':
        return <AdminDashboard user={user} />;
      default:
        return <div>Please select a role.</div>;
    }
  };

  return <>{renderDashboard()}</>;
}
