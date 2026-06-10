'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/api';
import { TaskCard } from '@/components/TaskCard';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TaskPoolPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [completedLogs, setCompletedLogs] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchWithAuth('/tasks/pool')
        .then(res => res.json())
        .then(data => setTasks(data))
        .catch(console.error);

      fetchWithAuth('/worker/')
        .then(res => res.json())
        .then(data => setWorkers(data))
        .catch(console.error);

      // Fetch completed logs to know which worker accounts have completed which tasks
      supabase
        .from('task_logs')
        .select('task_id, worker_id')
        .eq('status', 'Success')
        .then(({ data, error }) => {
          if (data && !error) {
            setCompletedLogs(data);
          }
        });
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="text-gray-400 text-center p-20 animate-pulse font-medium">Loading Tasks...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              FollowSucceed
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/accounts" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Manage Accounts
            </Link>
            
            <div className="flex items-center gap-2 bg-white/5 rounded-full px-5 py-2 border border-white/10 shadow-inner">
              <span className="text-gray-400 text-sm font-medium">Balance</span>
              <span className="text-cyan-400 font-bold tracking-wide animate-pulse">
                {user.total_credits.toLocaleString()} <span className="text-xs">CR</span>
              </span>
            </div>
            
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

      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Active <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Task Pool</span>
          </h2>
          <p className="text-lg text-gray-400">
            Follow the accounts below to earn credits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {tasks.length > 0 ? tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              workers={workers}
              initialCompletedWorkerIds={completedLogs
                .filter(log => log.task_id === task.id)
                .map(log => log.worker_id)
              }
            />
          )) : (
            <div className="col-span-full py-12 text-center text-gray-500 bg-slate-900/50 rounded-2xl border border-white/5">
              No active tasks available right now. Check back later!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
