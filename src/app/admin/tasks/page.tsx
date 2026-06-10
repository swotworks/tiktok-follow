'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface Task {
  id: string;
  target_tiktok_username: string;
  target_follows: number;
  current_follows: number;
  reward_credits: number;
  status: string;
  creator_id: string;
  creator_username?: string;
  creator_email?: string;
}

export default function AdminTasksPage() {
  const { user: currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.is_admin) {
      fetchTasks();
    }
  }, [currentUser]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        target_tiktok_username,
        target_follows,
        current_follows,
        reward_credits,
        status,
        creator_id,
        users:creator_id (username, email)
      `)
      .order('status', { ascending: true });

    if (data && !error) {
      const formattedTasks = data.map((task: any) => ({
        ...task,
        creator_username: task.users?.username || 'Unknown',
        creator_email: task.users?.email || 'Unknown'
      }));
      setTasks(formattedTasks);
    } else if (error) {
      console.error("Error fetching admin tasks:", error.message);
    }
    setLoading(false);
  };

  const handleApprove = async (taskId: string) => {
    setProcessingId(taskId);
    const { error } = await supabase.rpc('approve_campaign', { p_task_id: taskId });
    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'Active' } : t));
    } else {
      console.error(error);
      alert("Error approving campaign.");
    }
    setProcessingId(null);
  };

  const handleReject = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to reject this campaign? Credits will be automatically refunded to the creator.")) return;

    setProcessingId(taskId);
    const { error } = await supabase.rpc('reject_campaign_securely', { p_task_id: taskId });
    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'Rejected' } : t));
    } else {
      console.error(error);
      alert("Error rejecting campaign.");
    }
    setProcessingId(null);
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this task? (Note: No automatic refunds will be processed)")) return;

    setProcessingId(taskId);
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId));
    } else {
      console.error(error);
      alert("Error deleting task: " + error.message);
    }
    setProcessingId(null);
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'All') return true;
    return task.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">Active</span>;
      case 'Pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse">Pending Review</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Completed</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">{status}</span>;
    }
  };

  if (!currentUser?.is_admin) {
    return (
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 text-center text-red-400 max-w-lg mx-auto mt-20">
        You do not have permission to view this page. Admin access required.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Campaigns Management</h1>
          <p className="text-gray-400 mt-2">Monitor TikTok campaigns, review submissions, and manage system tasks.</p>
        </div>
        <button 
          onClick={fetchTasks}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white transition-colors"
        >
          Refresh Campaigns
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-900/50 p-1.5 rounded-xl border border-white/5 w-fit">
        {['All', 'Pending', 'Active', 'Completed', 'Rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === status
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-24 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-gray-300 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">Campaign Target</th>
                  <th className="px-6 py-4">Creator</th>
                  <th className="px-6 py-4">Progress / Goal</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTasks.map((task) => {
                  const percent = task.target_follows > 0 
                    ? Math.min(100, Math.round((task.current_follows / task.target_follows) * 100))
                    : 0;

                  return (
                    <tr key={task.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 font-bold text-pink-400">
                        @{task.target_tiktok_username}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-white text-xs font-semibold">@{task.creator_username}</span>
                          <span className="text-[10px] text-gray-500">{task.creator_email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 w-64">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-gray-300 font-mono">{task.current_follows} / {task.target_follows}</span>
                            <span className="text-cyan-400">{percent}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-cyan-400 text-xs font-bold">
                        {(task.target_follows * 10).toLocaleString()} CR
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(task.status)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {task.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleReject(task.id)}
                              disabled={processingId === task.id}
                              className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold disabled:opacity-50"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprove(task.id)}
                              disabled={processingId === task.id}
                              className="px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 text-xs font-bold disabled:opacity-50"
                            >
                              Approve
                            </button>
                          </>
                        )}
                        {task.status !== 'Pending' && (
                          <button
                            onClick={() => handleDelete(task.id)}
                            disabled={processingId === task.id}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-xs font-bold disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-gray-500 text-center py-12 bg-slate-900/50 italic">
                      No campaigns found matching filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
