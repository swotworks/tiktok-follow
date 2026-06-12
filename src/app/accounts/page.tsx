'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AccountsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [workers, setWorkers] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState('');

  const fetchWorkers = async () => {
    try {
      const res = await fetchWithAuth('/worker/');
      const data = await res.json();
      setWorkers(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWorkers();
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (!user) return null;

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername) return;
    try {
      const res = await fetchWithAuth('/worker/add', {
        method: 'POST',
        body: JSON.stringify({ tiktok_username: newUsername }),
      });
      if (res.ok) {
        setNewUsername('');
        fetchWorkers();
      } else {
        const error = await res.json();
        alert(error.detail || 'Failed to add account');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteWorker = async (workerId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete @${username}? This will remove this worker account and delete all associated follow history.`)) {
      return;
    }
    try {
      const res = await fetchWithAuth(`/worker/${workerId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert("Account successfully deleted!");
        fetchWorkers();
      } else {
        const error = await res.json();
        alert(error.detail || 'Failed to delete account');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting account');
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-3xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Manage TikTok Accounts</h2>
        <Link href="/tasks" className="text-cyan-400 hover:text-cyan-300">Back to Task Pool</Link>
      </div>
      
      <form onSubmit={handleAddWorker} className="flex gap-4 mb-12">
        <input 
          type="text" 
          placeholder="TikTok Username (e.g., khaby.lame)"
          className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
        />
        <button type="submit" className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-colors">
          Add Account
        </button>
      </form>

      <div className="space-y-4">
        {workers.map((worker) => (
          <div key={worker.id} className="bg-slate-900 border border-white/10 rounded-xl p-6 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-white">@{worker.tiktok_username}</h3>
              <p className="text-sm text-gray-400 mt-1">Status: {worker.is_active ? <span className="text-green-400">Active</span> : <span className="text-red-400">Banned</span>}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                <span className="text-gray-400 text-sm">Strikes: </span>
                <span className="text-white font-bold">{worker.strikes || 0}/3</span>
              </div>
              <button 
                onClick={() => handleDeleteWorker(worker.id, worker.tiktok_username)}
                className="p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-colors flex items-center justify-center"
                title="Delete Account"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
        ))}
        {workers.length === 0 && (
          <p className="text-gray-500 text-center py-8 bg-slate-900/50 rounded-xl border border-white/5">No TikTok accounts added yet. Add one above to start earning credits!</p>
        )}
      </div>
    </div>
  );
}
