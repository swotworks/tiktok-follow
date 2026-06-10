'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface NotificationMessage {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function InboxPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<NotificationMessage[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchNotifications = async () => {
    if (!user) return;
    setFetching(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setMessages(data as NotificationMessage[]);
    }
    setFetching(false);
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Realtime listener to refresh list instantly
      const channel = supabase
        .channel('inbox-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const clearAllNotifications = async () => {
    if (!user || messages.length === 0) return;
    
    const ids = messages.map(m => m.id);
    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', ids);

    if (!error) {
      setMessages([]);
    }
  };

  const deleteSingleNotification = async (id: string) => {
    // Optimistic update
    setMessages(prev => prev.filter(m => m.id !== id));

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Failed to delete notification:", error);
      fetchNotifications();
    }
  };

  if (loading || fetching) {
    return <div className="text-gray-400 text-center p-20 animate-pulse font-medium">Loading Inbox...</div>;
  }

  if (!user) {
    return null;
  }

  const unreadCount = messages.length;

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Inbox Messages ✉️
            {unreadCount > 0 && (
              <span className="text-xs bg-red-500 text-white font-bold px-2 py-0.5 rounded-full animate-bounce">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Review warnings and attention items from the administrators. Click a message to dismiss it.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={clearAllNotifications}
            className="self-start px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            Clear all messages
          </button>
        )}
      </div>

      <div className="space-y-4">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isAttention = msg.message.toLowerCase().includes('need attention');
            return (
              <div
                key={msg.id}
                onClick={() => deleteSingleNotification(msg.id)}
                className="bg-slate-900/90 border border-pink-500/20 shadow-lg shadow-pink-500/5 hover:border-pink-500/40 hover:bg-slate-900 cursor-pointer p-6 rounded-2xl transition-all duration-300 relative group"
                title="Click to dismiss/delete notification"
              >
                <span className="absolute top-4 right-4 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
                </span>

                <div className="flex items-start gap-4">
                  {isAttention ? (
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                  )}

                  <div className="flex-grow space-y-1">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-bold uppercase tracking-wider ${isAttention ? 'text-red-400' : 'text-blue-400'}`}>
                        {isAttention ? 'Attention Required ⚠️' : 'System Notification 📢'}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(msg.created_at).toLocaleDateString()} at {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-200 group-hover:text-white transition-colors">
                      {msg.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center text-gray-500 bg-slate-900/30 rounded-3xl border border-white/5 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Your inbox is empty</h3>
              <p className="text-gray-500 text-sm mt-1">You're all caught up! No notifications at this time.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
