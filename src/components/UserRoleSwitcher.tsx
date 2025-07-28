'use client';

import {useAuth, UserRole} from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Label} from '@/components/ui/label';

export function UserRoleSwitcher() {
  const {role, setRole, user} = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="role-switcher" className="text-sm font-medium">
        Role:
      </Label>
      <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
        <SelectTrigger id="role-switcher" className="w-[120px]">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="student">Student</SelectItem>
          <SelectItem value="teacher">Teacher</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
