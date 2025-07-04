'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Trophy, 
  Users, 
  PlusCircle, 
  Home, 
  ChevronRight, 
  LogOut,
  Settings,
  HelpCircle,
  User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [activeEvents, setActiveEvents] = useState(0);

  useEffect(() => {
    fetchUser();
    fetchActiveEvents();
  }, []);

  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
    }
  };

  const fetchActiveEvents = async () => {
    try {
      const { data } = await supabase
        .from('events')
        .select('id');
      
      if (data) {
        setActiveEvents(data.length);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const routes = [
    {
      label: 'Dashboard',
      icon: Home,
      href: '/dashboard',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      activeColor: 'bg-blue-500/20'
    },
    {
      label: 'Events',
      icon: Trophy,
      href: '/events',
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
      activeColor: 'bg-violet-500/20'
    },
    {
      label: 'Players',
      icon: Users,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      activeColor: 'bg-pink-500/20',
      href: '/players',
    },
    {
      label: 'Create Event',
      icon: PlusCircle,
      href: '/events/create',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      activeColor: 'bg-emerald-500/20',
    },
  ];

  const version = "v1.0.0";

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="relative flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white shadow-xl">
      {/* App Logo */}
      <div className="px-5 py-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">TMS</h1>
            <p className="text-xs font-medium text-blue-300">Tournament Management</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="px-3 py-2 flex-1 overflow-y-auto">
        <nav className="space-y-1.5">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  'group flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 font-medium',
                  isActive 
                    ? `${route.activeColor} text-white` 
                    : `text-gray-300 hover:text-white hover:${route.bgColor}`
                )}
              >
                <div className="flex items-center">
                  <div className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-lg mr-3 transition-colors",
                    isActive ? route.bgColor : 'bg-gray-800 group-hover:bg-gray-700'
                  )}>
                    <route.icon className={cn('h-5 w-5', route.color)} />
                  </div>
                  <span className="text-sm">{route.label}</span>
                </div>
                
                <div className="flex items-center">
                  {isActive && <ChevronRight className="h-4 w-4 text-gray-400" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Additional Navigation Section */}
        <div className="mt-10">
          <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Support
          </h3>
          <div className="mt-2 space-y-1">
            <Link 
              href="/settings" 
              className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <Settings className="h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-300" />
              Settings
            </Link>
            <Link 
              href="/help" 
              className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <HelpCircle className="h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-300" />
              Help & Support
            </Link>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-3 border-t border-gray-800 mt-auto">
        <div 
          className="flex items-center px-2 py-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer"
          onClick={handleSignOut}
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
            {user ? (
              <span className="text-white font-medium">{getUserInitials()}</span>
            ) : (
              <User className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.email?.split('@')[0] || 'Admin User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.email || 'Sign in to manage events'}
            </p>
          </div>
          <LogOut className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
        </div>
        
        {/* App Version */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">{version}</p>
        </div>
      </div>
    </div>
  );
}