'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export const Navbar = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchUnreadCount = async () => {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (!error && count !== null) {
          setUnreadCount(count);
        }
      };

      fetchUnreadCount();

      // Realtime subscription for notifications
      const channel = supabase
        .channel('navbar-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // If there is no user logged in, do not show the navbar at all
  if (!user) return null;

  return (
    <nav className="p-4 flex gap-6 items-center border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
      <Link href="/tasks" className="text-gray-300 hover:text-white transition-colors font-medium">Task Pool</Link>
      <Link href="/accounts" className="text-gray-300 hover:text-white transition-colors font-medium">Manage Accounts</Link>
      <Link href="/inbox" className="text-gray-300 hover:text-white transition-colors font-medium flex items-center gap-1.5 relative">
        Inbox ✉️
        {unreadCount > 0 && (
          <>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute -top-0.5 -right-2"></span>
            <span className="w-2 h-2 rounded-full bg-red-500 absolute -top-0.5 -right-2"></span>
          </>
        )}
      </Link>
      
      {/* Spacer to push remaining items to the right if needed */}
      <div className="flex-grow"></div>
      
      <div className="flex items-center gap-4">
        <span className="text-cyan-400 font-mono text-sm bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20">
          {user.total_credits.toLocaleString()} CR
        </span>
        {user.is_admin && (
          <Link href="/create-campaign" className="px-4 py-1.5 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(236,72,153,0.3)]">
            Create Campaign 🚀
          </Link>
        )}
      </div>
    </nav>
  );
};
