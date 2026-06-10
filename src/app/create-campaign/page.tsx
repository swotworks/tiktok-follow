'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface UserOption {
  id: string;
  username: string;
  email: string;
}

export default function CreateCampaignPage() {
  const { user, loading, updateCredits } = useAuth();
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [targetFollows, setTargetFollows] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // New targeting states
  const [targetType, setTargetType] = useState<'all' | 'selected'>('all');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!user.is_admin) {
        router.push('/tasks');
      }
    }
  }, [user, loading, router]);

  // Fetch all site users when component mounts
  useEffect(() => {
    if (user && user.is_admin) {
      const fetchUsers = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, email')
          .neq('id', user.id) // Exclude the admin user themselves
          .order('username', { ascending: true });
        
        if (data && !error) {
          setUsers(data as UserOption[]);
        } else if (error) {
          console.error("Error fetching users:", error.message);
        }
      };
      fetchUsers();
    }
  }, [user]);

  if (loading) return null;
  if (!user || !user.is_admin) {
    return null;
  }

  const COST_PER_FOLLOW = 10;
  const totalCost = targetFollows * COST_PER_FOLLOW;
  
  // Admin bypasses credit checking
  const hasEnoughCredits = user.is_admin || user.total_credits >= totalCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasEnoughCredits) return;
    if (targetType === 'selected' && selectedUserIds.length === 0) {
      setError('Please select at least one target user.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      // Call the secure Supabase RPC function (with 3 arguments now)
      const { data, error: rpcError } = await supabase.rpc('create_campaign_securely', {
        p_target_username: username,
        p_target_follows: targetFollows,
        p_target_user_ids: targetType === 'all' ? null : selectedUserIds
      });

      if (rpcError) throw rpcError;

      // Update local context credits if not admin (admin is infinite/unaffected)
      if (!user.is_admin) {
        updateCredits(-totalCost);
      }
      
      // Redirect to tasks pool
      router.push('/tasks');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 mb-4">
          Create New Campaign
        </h1>
        <p className="text-gray-400 text-lg">Target TikTok accounts for follows and choose who completes them.</p>
      </div>

      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl"></div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">Target TikTok Username</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-500 font-bold">@</span>
                <input 
                  type="text" 
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors"
                  placeholder="charlidamelio"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">How many followers do you want?</label>
              <input 
                type="number" 
                min="1"
                max="10000"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors text-xl font-bold"
                value={targetFollows}
                onChange={(e) => setTargetFollows(parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          {/* Target Audience Section */}
          <div className="space-y-4 bg-slate-950/40 p-6 rounded-2xl border border-white/5">
            <label className="block text-gray-300 text-sm font-semibold">Who should see this campaign?</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-300 font-medium">
                <input
                  type="radio"
                  name="targetType"
                  value="all"
                  checked={targetType === 'all'}
                  onChange={() => setTargetType('all')}
                  className="accent-pink-500 w-4.5 h-4.5"
                />
                All Users (Public Pool)
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-300 font-medium">
                <input
                  type="radio"
                  name="targetType"
                  value="selected"
                  checked={targetType === 'selected'}
                  onChange={() => setTargetType('selected')}
                  className="accent-pink-500 w-4.5 h-4.5"
                />
                Selected Users Only
              </label>
            </div>

            {targetType === 'selected' && (
              <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const ids = filteredUsers.map(u => u.id);
                      setSelectedUserIds(prev => {
                        const newSelection = [...prev];
                        ids.forEach(id => {
                          if (!newSelection.includes(id)) newSelection.push(id);
                        });
                        return newSelection;
                      });
                    }}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-white transition-colors whitespace-nowrap"
                  >
                    Select All Filtered
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ids = filteredUsers.map(u => u.id);
                      setSelectedUserIds(prev => prev.filter(id => !ids.includes(id)));
                    }}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-white transition-colors whitespace-nowrap"
                  >
                    Deselect All Filtered
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto border border-white/10 bg-slate-950 rounded-xl divide-y divide-white/5">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(u => {
                      const isChecked = selectedUserIds.includes(u.id);
                      return (
                        <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer text-sm transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                              } else {
                                setSelectedUserIds(prev => [...prev, u.id]);
                              }
                            }}
                            className="accent-pink-500 w-4 h-4 rounded"
                          />
                          <div className="flex flex-col">
                            <span className="text-white font-medium">@{u.username}</span>
                            <span className="text-xs text-gray-500">{u.email}</span>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-gray-500 text-xs italic">
                      No users found matching your search.
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-400 font-medium flex justify-between bg-slate-950/50 p-2 rounded-lg border border-white/5">
                  <span>Selected: {selectedUserIds.length} users</span>
                  <span>Total Users: {users.length}</span>
                </div>
              </div>
            )}
          </div>

          {/* Calculator Section */}
          <div className="bg-slate-950/50 rounded-2xl p-6 border border-white/5">
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-4">Checkout Summary</h3>
            
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-300">Cost per follow</span>
              <span className="text-white font-mono">{COST_PER_FOLLOW} CR</span>
            </div>
            
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
              <span className="text-gray-300">Amount requested</span>
              <span className="text-white font-mono">x {targetFollows || 0}</span>
            </div>
            
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-bold text-white">Total Cost</span>
              <span className="text-2xl font-bold text-pink-400 font-mono">{totalCost.toLocaleString()} CR</span>
            </div>

            {/* Balance Check */}
            <div className="p-4 rounded-xl flex justify-between items-center text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20">
              <span>Your Current Balance:</span>
              <span className="font-mono">{user.total_credits.toLocaleString()} CR {user.is_admin && '(Admin Bypass)'}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={!hasEnoughCredits || isSubmitting || !username || targetFollows < 1 || (targetType === 'selected' && selectedUserIds.length === 0)}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex justify-center items-center space-x-2 bg-gradient-to-r from-pink-500 to-violet-600 text-white hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] border border-pink-500/50"
          >
            {isSubmitting ? (
              <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>Launch Campaign 🚀</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
