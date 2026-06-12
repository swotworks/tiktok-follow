'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export const OverviewMetrics = () => {
  const { user: currentUser } = useAuth();
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [activeTasks, setActiveTasks] = useState<number>(0);
  const [systemCredits, setSystemCredits] = useState<number>(0);
  const [totalFollowersGained, setTotalFollowersGained] = useState<number>(0);
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

      // 3. Fetch Verification Logs to calculate Success Rate and Overall Followers Gained
      const { data: logsData, error: logsError } = await supabase
        .from('task_logs')
        .select('status');
        
      if (logsData && !logsError) {
        const successLogs = logsData.filter(log => log.status === 'Success' || log.status === 'Verified_Retained').length;
        const failedLogs = logsData.filter(log => log.status === 'Failed' || log.status === 'Dropped').length;
        
        setTotalFollowersGained(successLogs);

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
    { 
      id: 1, 
      title: 'Total Users', 
      value: loading ? '...' : totalUsers.toLocaleString(), 
      sub: 'Registered members',
      iconPath: "M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"
    },
    { 
      id: 2, 
      title: 'Active Tasks', 
      value: loading ? '...' : activeTasks.toLocaleString(), 
      sub: 'Live campaigns',
      iconPath: "M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"
    },
    { 
      id: 3, 
      title: 'System Credits', 
      value: loading ? '...' : `${systemCredits.toLocaleString()} CR`, 
      sub: 'Total circulation',
      iconPath: "M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
    },
    { 
      id: 4, 
      title: 'Overall Followers Gained', 
      value: loading ? '...' : totalFollowersGained.toLocaleString(), 
      sub: 'Successful follows completed',
      iconPath: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
    },
    { 
      id: 5, 
      title: 'Verification Success', 
      value: loading ? '...' : successRate, 
      sub: 'Completion rate',
      iconPath: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
      {metricsList.map((metric) => (
        <div key={metric.id} className="bg-slate-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg className="w-16 h-16 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
              <path d={metric.iconPath}></path>
            </svg>
          </div>
          <h3 className="text-gray-400 text-sm font-semibold mb-2">{metric.title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white tracking-tight">{metric.value}</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1.5 font-medium">{metric.sub}</p>
        </div>
      ))}
    </div>
  );
};
