import { BookOpen, CalendarDays, GraduationCap, LayoutDashboard, BarChart3 } from 'lucide-react';

export type NavDestination = 'weekly_planning' | 'calendar' | 'academic_tracks' | 'ncert' | 'velocity' | 'audit' | 'analytics';

export const destinations = [
  { id: 'weekly_planning', label: 'Weekly Tasks', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'academic_tracks', label: 'Academic Tracks', icon: GraduationCap },
  { id: 'ncert', label: 'NCERT Social Science', icon: BookOpen },
  { id: 'analytics', label: 'Analytics & Velocity', icon: BarChart3 },
] as const;

export function isDestinationActive(destination: NavDestination, current: NavDestination) {
  return destination === current || (destination === 'analytics' && (current === 'velocity' || current === 'audit'));
}
