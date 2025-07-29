'use client';

import {useAuth} from '@/contexts/AuthContext';
import StudentDashboard from '@/components/dashboards/StudentDashboard';
import TeacherDashboard from '@/components/dashboards/TeacherDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import {useEffect, useState} from 'react';
import type {User} from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const {user, role, loading} = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
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
