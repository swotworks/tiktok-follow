'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

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
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* Branding & Logo */}
        <Link href="/tasks" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            FollowSucceed
          </h1>
        </Link>

        {/* Central Navigation Links */}
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link 
            href="/tasks" 
            className={`text-sm font-semibold transition-colors ${
              pathname === '/tasks' ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Task Pool
          </Link>
          <Link 
            href="/accounts" 
            className={`text-sm font-semibold transition-colors ${
              pathname === '/accounts' ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Manage Accounts
          </Link>
          <Link 
            href="/inbox" 
            className={`text-sm font-semibold transition-colors flex items-center gap-1.5 relative ${
              pathname === '/inbox' ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Inbox ✉️
            {unreadCount > 0 && (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute -top-0.5 -right-2"></span>
                <span className="w-2 h-2 rounded-full bg-red-500 absolute -top-0.5 -right-2"></span>
              </>
            )}
          </Link>
        </nav>

        {/* Right Actions & Profile */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Credits Balance */}
          <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 sm:px-5 py-2 border border-white/10 shadow-inner">
            <span className="text-gray-400 text-xs sm:text-sm font-medium">Balance</span>
            <span className="text-cyan-400 text-sm sm:text-base font-bold tracking-wide animate-pulse">
              {user.total_credits.toLocaleString()} <span className="text-xs">CR</span>
            </span>
          </div>

          {/* Create Campaign (Admin Only) */}
          {user.is_admin && (
            <Link 
              href="/create-campaign" 
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white text-sm rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(236,72,153,0.3)]"
            >
              Create Campaign 🚀
            </Link>
          )}

          {/* User Profile Avatar Dropdown */}
          <div className="relative group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 border-2 border-white/20 cursor-pointer flex items-center justify-center text-white font-bold shadow-md hover:scale-105 transition-transform">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="absolute right-0 mt-2 w-56 py-2 bg-slate-900 border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="px-4 py-2 border-b border-white/5 flex flex-col">
                <span className="text-white font-semibold text-sm truncate">@{user.username}</span>
                <span className="text-gray-500 text-xs truncate mb-1">{user.email}</span>
                {user.is_admin && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20 self-start mt-1">
                    Admin
                  </span>
                )}
              </div>
              <button onClick={logout} className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-white/5 text-sm font-medium flex items-center gap-2 mt-1 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
