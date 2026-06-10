'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface Task {
  id: string;
  target_tiktok_username: string;
  reward_credits: number;
  target_follows: number;
  current_follows: number;
  status: string;
}

interface TaskLog {
  id: string;
  status: string;
  created_at: string;
  tasks: {
    target_tiktok_username: string;
  } | null;
}

interface Worker {
  id: string;
  tiktok_username: string;
  is_active: boolean;
  strikes: number;
  task_logs?: TaskLog[];
}

interface UserData {
  id: string;
  username: string;
  email: string;
  total_credits: number;
  is_admin: boolean;
  worker_accounts: Worker[];
  tasks: Task[];
}

export const UserManagementTable = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.is_admin) {
      fetchUsers();
    } else {
      setLoading(false); // They shouldn't be here if not admin, but handle it gracefully
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        worker_accounts (
          *,
          task_logs (
            *,
            tasks (*)
          )
        ),
        tasks (*)
      `)
      .order('total_credits', { ascending: false });
      
    if (data && !error) {
      setUsers(data as UserData[]);
    } else if (error) {
      console.error("Error fetching admin users:", error.message);
    }
    setLoading(false);
  };

  const toggleExpand = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const handleRejectSubmission = async (logId: string) => {
    if (!confirm("Are you sure you want to reject this submission? This will deduct the user's credits and send an attention alert to their inbox.")) {
      return;
    }

    try {
      const { error } = await supabase.rpc('reject_user_submission', {
        p_task_log_id: logId
      });

      if (error) throw error;
      
      alert("Submission successfully rejected and user notified!");
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to reject submission.");
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user @${username}? This will permanently delete their account, TikTok worker accounts, campaigns, and logs, and cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase.rpc('delete_user_securely', {
        p_user_id: userId
      });

      if (error) throw error;

      alert(`User @${username} has been successfully deleted.`);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete user.");
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-12 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser?.is_admin) {
    return (
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 text-center text-red-400">
        You do not have permission to view this page. Admin access required.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden mb-8">
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
        <h2 className="text-xl font-bold text-white">Live User Management</h2>
        <button 
          onClick={fetchUsers}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
          Refresh Data
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-gray-300">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Credits</th>
              <th className="px-6 py-4">Workers / Tasks</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => {
              // Collect all task logs from all worker accounts
              const submittedTasks: any[] = [];
              user.worker_accounts?.forEach(worker => {
                worker.task_logs?.forEach((log: any) => {
                  submittedTasks.push({
                    id: log.id,
                    workerName: worker.tiktok_username,
                    targetUsername: log.tasks?.target_tiktok_username || 'Unknown',
                    status: log.status,
                    createdAt: new Date(log.created_at).toLocaleString()
                  });
                });
              });

              return (
                <React.Fragment key={user.id}>
                  {/* Main Row */}
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">@{user.username} {user.is_admin && <span className="text-pink-400 text-xs ml-1">(Admin)</span>}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-cyan-400">{user.total_credits.toLocaleString()} CR</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-3 text-xs">
                        <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-md border border-purple-500/20">
                          {user.worker_accounts?.length || 0} Workers
                        </span>
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20">
                          {user.tasks?.length || 0} Tasks
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => toggleExpand(user.id)}
                        className="px-3 py-1.5 rounded bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors text-xs font-medium">
                        {expandedUserId === user.id ? 'Hide Details' : 'View Details'}
                      </button>
                      {user.id !== currentUser?.id && (
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="px-3 py-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/25 transition-colors text-xs font-semibold animate-pulse hover:animate-none"
                          title="Delete User">
                          Delete User 🗑️
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Details Row */}
                  {expandedUserId === user.id && (
                    <tr className="bg-slate-950/50">
                      <td colSpan={5} className="p-6 border-b border-white/5">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          
                          {/* Worker Accounts Box */}
                          <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
                            <h4 className="text-white font-bold mb-3 flex items-center">
                              <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                              Added TikTok Accounts
                            </h4>
                            {user.worker_accounts?.length > 0 ? (
                              <ul className="space-y-2">
                                {user.worker_accounts.map(worker => (
                                  <li key={worker.id} className="flex justify-between items-center text-sm p-2 rounded-lg bg-white/5">
                                    <span className="text-gray-300 font-medium">@{worker.tiktok_username}</span>
                                    <div className="flex items-center space-x-3">
                                      <span className="text-xs text-red-400">{worker.strikes}/3 Strikes</span>
                                      {worker.is_active ? 
                                        <span className="w-2 h-2 rounded-full bg-green-500" title="Active"></span> : 
                                        <span className="w-2 h-2 rounded-full bg-red-500" title="Banned"></span>
                                      }
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-gray-500 italic">No TikTok accounts added yet.</p>
                            )}
                          </div>

                          {/* Campaigns/Tasks Box */}
                          <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
                            <h4 className="text-white font-bold mb-3 flex items-center">
                              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                              Created Campaigns (Tasks)
                            </h4>
                            {user.tasks?.length > 0 ? (
                              <ul className="space-y-2">
                                {user.tasks.map(task => (
                                  <li key={task.id} className="flex justify-between items-center text-sm p-2 rounded-lg bg-white/5">
                                    <span className="text-gray-300 font-medium">@{task.target_tiktok_username}</span>
                                    <div className="flex items-center space-x-3">
                                      <span className="text-xs font-mono text-cyan-400">{task.current_follows}/{task.target_follows}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${task.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        {task.status}
                                      </span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-gray-500 italic">No campaigns created yet.</p>
                            )}
                          </div>

                          {/* Submitted Tasks Box */}
                          <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
                            <h4 className="text-white font-bold mb-3 flex items-center">
                              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                              Submitted Tasks (Logs)
                            </h4>
                            {submittedTasks.length > 0 ? (
                              <ul className="space-y-2 max-h-48 overflow-y-auto">
                                {submittedTasks.map(log => (
                                  <li key={log.id} className="flex justify-between items-center text-sm p-2 rounded-lg bg-white/5">
                                    <div className="flex flex-col">
                                      <span className="text-gray-300 font-medium">@{log.workerName} followed @{log.targetUsername}</span>
                                      <span className="text-[10px] text-gray-500">{log.createdAt}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                        log.status === 'Success' ? 'bg-green-500/20 text-green-400' :
                                        log.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                      }`}>
                                        {log.status}
                                      </span>
                                      {log.status === 'Success' && (
                                        <button
                                          onClick={() => handleRejectSubmission(log.id)}
                                          className="text-xs px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded border border-red-500/25 font-semibold transition-colors flex items-center gap-1"
                                          title="Reject & Deduct Credits"
                                        >
                                          Remove ❌
                                        </button>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-gray-500 italic">No tasks submitted yet.</p>
                            )}
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
