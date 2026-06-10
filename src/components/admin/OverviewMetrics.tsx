'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export const OverviewMetrics = () => {
  const { user: currentUser } = useAuth();
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [activeTasks, setActiveTasks] = useState<number>(0);
  const [systemCredits, setSystemCredits] = useState<number>(0);
  const [successRate, setSuccessRate] = useState<string>('0%');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (currentUser?.is_admin) {
      fetchMetrics();
    }
  }, [currentUser]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // 1. Fetch Total Users Count & Sum Credits
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('total_credits');
        
      if (usersData && !usersError) {
        setTotalUsers(usersData.length);
        const totalCredits = usersData.reduce((sum, u) => sum + (u.total_credits || 0), 0);
        setSystemCredits(totalCredits);
      }

      // 2. Fetch Active Tasks Count
      const { count: tasksCount, error: tasksError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');
        
      if (!tasksError) {
        setActiveTasks(tasksCount || 0);
      }

      // 3. Fetch Verification Logs to calculate Success Rate
      const { data: logsData, error: logsError } = await supabase
        .from('task_logs')
        .select('status');
        
      if (logsData && !logsError) {
        const successLogs = logsData.filter(log => log.status === 'Success' || log.status === 'Verified_Retained').length;
        const failedLogs = logsData.filter(log => log.status === 'Failed' || log.status === 'Dropped').length;
        
        const totalFinished = successLogs + failedLogs;
        if (totalFinished > 0) {
          const rate = ((successLogs / totalFinished) * 100).toFixed(1);
          setSuccessRate(`${rate}%`);
        } else {
          setSuccessRate('100%'); // Default if no runs yet
        }
      }
    } catch (e) {
      console.error("Error fetching admin metrics:", e);
    }
    setLoading(false);
  };

  const metricsList = [
    { id: 1, title: 'Total Users', value: loading ? '...' : totalUsers.toLocaleString(), sub: 'Registered members' },
    { id: 2, title: 'Active Tasks', value: loading ? '...' : activeTasks.toLocaleString(), sub: 'Live campaigns' },
    { id: 3, title: 'System Credits', value: loading ? '...' : `${systemCredits.toLocaleString()} CR`, sub: 'Total circulation' },
    { id: 4, title: 'Verification Success', value: loading ? '...' : successRate, sub: 'Scraper completion rate' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metricsList.map((metric) => (
        <div key={metric.id} className="bg-slate-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg className="w-16 h-16 text-cyan-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path></svg>
          </div>
          <h3 className="text-gray-400 text-sm font-semibold mb-2">{metric.title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight">{metric.value}</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1.5 font-medium">{metric.sub}</p>
        </div>
      ))}
    </div>
  );
};
