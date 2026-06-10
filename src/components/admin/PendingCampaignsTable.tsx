'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface PendingTask {
  id: string;
  target_tiktok_username: string;
  target_follows: number;
  reward_credits: number;
  creator_id: string;
  creator_username?: string;
}

export const PendingCampaignsTable = () => {
  const { user: currentUser } = useAuth();
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.is_admin) {
      fetchPendingTasks();
    }
  }, [currentUser]);

  const fetchPendingTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        target_tiktok_username,
        target_follows,
        reward_credits,
        creator_id,
        users:creator_id (username)
      `)
      .eq('status', 'Pending');
      
    if (data && !error) {
      const formattedData = data.map((task: any) => ({
        ...task,
        creator_username: task.users?.username || 'Unknown'
      }));
      setTasks(formattedData);
    }
    setLoading(false);
  };

  const handleApprove = async (taskId: string) => {
    setProcessingId(taskId);
    const { error } = await supabase.rpc('approve_campaign', { p_task_id: taskId });
    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId));
    } else {
      console.error(error);
      alert("Error approving campaign. Make sure you ran the SQL functions.");
    }
    setProcessingId(null);
  };

  const handleReject = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to reject this campaign? The credits will be automatically refunded to the creator.")) return;
    
    setProcessingId(taskId);
    const { error } = await supabase.rpc('reject_campaign_securely', { p_task_id: taskId });
    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId));
    } else {
      console.error(error);
      alert("Error rejecting campaign. Make sure you ran the SQL functions.");
    }
    setProcessingId(null);
  };

  if (!currentUser?.is_admin || (tasks.length === 0 && !loading)) {
    return null; // Don't render anything if no pending tasks or not admin
  }

  return (
    <div className="bg-slate-900 border border-yellow-500/30 rounded-2xl overflow-hidden mb-8 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-yellow-500/5">
        <h2 className="text-xl font-bold text-yellow-500 flex items-center">
          <span className="mr-2">⏳</span> Pending Campaigns Review
        </h2>
        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">
          {tasks.length} Action Required
        </span>
      </div>
      
      {loading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-gray-300">
              <tr>
                <th className="px-6 py-4">Creator</th>
                <th className="px-6 py-4">Target TikTok</th>
                <th className="px-6 py-4">Requested Follows</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">@{task.creator_username}</td>
                  <td className="px-6 py-4 font-medium text-pink-400">@{task.target_tiktok_username}</td>
                  <td className="px-6 py-4">{task.target_follows}</td>
                  <td className="px-6 py-4 font-mono text-cyan-400">{(task.target_follows * 10).toLocaleString()} CR</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button 
                      onClick={() => handleReject(task.id)}
                      disabled={processingId === task.id}
                      className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors text-sm font-bold disabled:opacity-50"
                    >
                      Reject & Refund
                    </button>
                    <button 
                      onClick={() => handleApprove(task.id)}
                      disabled={processingId === task.id}
                      className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-colors text-sm font-bold disabled:opacity-50 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                    >
                      {processingId === task.id ? 'Processing...' : 'Approve ✅'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
