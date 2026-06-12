'use client';

import React, { useState, useEffect } from 'react';
import { Spinner } from './ui/Spinner';
import { fetchWithAuth } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export type TaskStatus = 'idle' | 'ready_to_verify' | 'verifying' | 'completed' | 'failed' | 'submitted';

interface TaskCardProps {
  task: {
    id: string;
    target_tiktok_username: string;
    reward_credits: number;
  };
  workers: any[];
  initialCompletedWorkerIds?: string[];
  initialPendingWorkerIds?: string[];
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, workers, initialCompletedWorkerIds, initialPendingWorkerIds }) => {
  const [status, setStatus] = useState<TaskStatus>('idle');
  const [taskLogId, setTaskLogId] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | ''>('');
  const [completedWorkerIds, setCompletedWorkerIds] = useState<string[]>(initialCompletedWorkerIds || []);
  const [pendingWorkerIds, setPendingWorkerIds] = useState<string[]>(initialPendingWorkerIds || []);
  const { updateCredits } = useAuth();

  useEffect(() => {
    if (initialCompletedWorkerIds) {
      setCompletedWorkerIds(initialCompletedWorkerIds);
    }
  }, [initialCompletedWorkerIds]);

  useEffect(() => {
    if (initialPendingWorkerIds) {
      setPendingWorkerIds(initialPendingWorkerIds);
    }
  }, [initialPendingWorkerIds]);

  // Reset completed or submitted status after 3 seconds to let them pick other workers
  useEffect(() => {
    if (status === 'completed' || status === 'submitted') {
      const timer = setTimeout(() => {
        setStatus('idle');
        setSelectedWorkerId('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleFollowClick = () => {
    window.open(`https://www.tiktok.com/@${task.target_tiktok_username}`, '_blank');
    setStatus('ready_to_verify');
  };

  const handleVerifyClick = async () => {
    if (!selectedWorkerId) {
      alert("Please select the TikTok account you used to follow.");
      return;
    }
    
    setStatus('verifying');
    
    try {
      if (selectedWorkerId === 'all') {
        const promises = availableWorkers.map(async (worker) => {
          const res = await fetchWithAuth('/tasks/verify', {
            method: 'POST',
            body: JSON.stringify({
              task_id: task.id,
              worker_id: worker.id
            })
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || `Failed for @${worker.tiktok_username}`);
          }

          const data = await res.json();
          if (data.status === 'Success' || data.status === 'Pending') {
            return { id: worker.id, status: data.status };
          }
          throw new Error(`Failed verification for @${worker.tiktok_username}`);
        });

        const results = await Promise.allSettled(promises);
        const succeededCompletedIds: string[] = [];
        const succeededPendingIds: string[] = [];
        const errors: string[] = [];

        results.forEach((r) => {
          if (r.status === 'fulfilled') {
            if (r.value.status === 'Success') {
              succeededCompletedIds.push(r.value.id);
            } else {
              succeededPendingIds.push(r.value.id);
            }
          } else if (r.status === 'rejected') {
            errors.push(r.reason.message || 'Error');
          }
        });

        if (succeededCompletedIds.length > 0 || succeededPendingIds.length > 0) {
          if (succeededCompletedIds.length > 0) {
            setCompletedWorkerIds(prev => [...prev, ...succeededCompletedIds]);
            updateCredits(task.reward_credits * succeededCompletedIds.length);
          }
          if (succeededPendingIds.length > 0) {
            setPendingWorkerIds(prev => [...prev, ...succeededPendingIds]);
          }
          
          if (succeededPendingIds.length > 0) {
            setStatus('submitted');
          } else {
            setStatus('completed');
          }
        } else {
          setStatus('failed');
          alert("Failed to submit: " + errors.join(', '));
        }
      } else {
        const res = await fetchWithAuth('/tasks/verify', {
          method: 'POST',
          body: JSON.stringify({
            task_id: task.id,
            worker_id: selectedWorkerId
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to start verification');
        }

        const data = await res.json();
        setTaskLogId(data.task_log_id);
        if (data.status === 'Success') {
          setStatus('completed');
          updateCredits(task.reward_credits);
          setCompletedWorkerIds(prev => [...prev, selectedWorkerId]);
        } else if (data.status === 'Pending') {
          setStatus('submitted');
          setPendingWorkerIds(prev => [...prev, selectedWorkerId]);
        }
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Verification failed');
      setStatus('failed');
    }
  };

  // Filter out workers that have already completed or submitted this task
  const availableWorkers = workers.filter(w => !completedWorkerIds.includes(w.id) && !pendingWorkerIds.includes(w.id));
  const allWorkersCompleted = workers.length > 0 && availableWorkers.length === 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/5 p-6 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-cyan-500/20 group">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-white tracking-wide truncate pr-2">
              @{task.target_tiktok_username}
            </h3>
            <span className="shrink-0 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-semibold border border-cyan-500/30">
              +{task.reward_credits} CR
            </span>
          </div>
          <p className="text-gray-400 text-sm">Follow this user on TikTok to earn credits.</p>
        </div>

        <div className="mt-auto pt-4 border-t border-white/10">
          {allWorkersCompleted ? (
            <button disabled className="w-full py-3 px-4 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl font-medium flex items-center justify-center space-x-2 cursor-default">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              <span>Completed (All Accounts)</span>
            </button>
          ) : (
            <>
              {status === 'idle' && (
                <button
                  onClick={handleFollowClick}
                  className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-xl font-medium transition-all transform active:scale-95 shadow-[0_0_15px_rgba(236,72,153,0.5)]"
                >
                  Follow User
                </button>
              )}

              {(status === 'ready_to_verify' || status === 'failed') && (
                <div className="space-y-3">
                  <select 
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none"
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                  >
                    <option value="" disabled>Select your account...</option>
                    {availableWorkers.length > 1 && (
                      <option value="all">All Accounts ({availableWorkers.length})</option>
                    )}
                    {availableWorkers.map(w => (
                      <option key={w.id} value={w.id}>@{w.tiktok_username}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={handleVerifyClick}
                    className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-medium transition-all transform active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                  >
                    Follow Done
                  </button>
                </div>
              )}

              {status === 'verifying' && (
                <button disabled className="w-full py-3 px-4 bg-white/10 text-gray-300 rounded-xl font-medium flex items-center justify-center space-x-2 cursor-not-allowed">
                  <Spinner />
                  <span>Submitting to Admin...</span>
                </button>
              )}

              {status === 'submitted' && (
                <button disabled className="w-full py-3 px-4 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-medium flex items-center justify-center space-x-2 cursor-default">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>Submitted to Admin</span>
                </button>
              )}

              {status === 'completed' && (
                <button disabled className="w-full py-3 px-4 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl font-medium flex items-center justify-center space-x-2 cursor-default">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span>Completed!</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
