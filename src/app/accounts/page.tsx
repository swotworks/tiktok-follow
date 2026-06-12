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
  
  // Selection state
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  
  // Custom Modal configuration
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'selected' | 'all';
    targetWorkerId?: string;
    targetWorkerName?: string;
  }>({
    isOpen: false,
    type: 'single',
  });

  // Custom Toast notifications
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

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
        showToast(`@${newUsername} added successfully!`, 'success');
      } else {
        const error = await res.json();
        showToast(error.detail || 'Failed to add account', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error adding account', 'error');
    }
  };

  // Selection handlers
  const handleSelectAccount = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedAccountIds.length === workers.length) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(workers.map((w) => w.id));
    }
  };

  // Trigger custom confirmation modals
  const triggerDeleteSingle = (workerId: string, username: string) => {
    setModal({
      isOpen: true,
      type: 'single',
      targetWorkerId: workerId,
      targetWorkerName: username,
    });
  };

  const triggerDeleteSelected = () => {
    if (selectedAccountIds.length === 0) return;
    setModal({
      isOpen: true,
      type: 'selected',
    });
  };

  const triggerDeleteAll = () => {
    if (workers.length === 0) return;
    setModal({
      isOpen: true,
      type: 'all',
    });
  };

  // API deletion requests
  const confirmDeleteSingle = async (workerId: string) => {
    try {
      const res = await fetchWithAuth(`/worker/${workerId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Account successfully deleted!', 'success');
        setSelectedAccountIds((prev) => prev.filter((id) => id !== workerId));
        fetchWorkers();
      } else {
        const error = await res.json();
        showToast(error.detail || 'Failed to delete account', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error deleting account', 'error');
    }
  };

  const confirmDeleteBatch = async (deleteAll = false) => {
    try {
      const payload = deleteAll
        ? { delete_all: true }
        : { worker_ids: selectedAccountIds, delete_all: false };

      const res = await fetchWithAuth('/worker/delete-batch', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(
          deleteAll
            ? 'All TikTok accounts successfully deleted!'
            : 'Selected TikTok accounts successfully deleted!',
          'success'
        );
        setSelectedAccountIds([]);
        fetchWorkers();
      } else {
        const error = await res.json();
        showToast(error.detail || 'Failed to delete accounts', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error deleting accounts', 'error');
    }
  };

  const handleModalConfirm = async () => {
    const { type, targetWorkerId } = modal;
    setModal((prev) => ({ ...prev, isOpen: false }));
    
    if (type === 'single' && targetWorkerId) {
      await confirmDeleteSingle(targetWorkerId);
    } else if (type === 'selected') {
      await confirmDeleteBatch(false);
    } else if (type === 'all') {
      await confirmDeleteBatch(true);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-3xl relative">
      {/* Dynamic Keyframes Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes modalBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPop {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes toastSlide {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .custom-backdrop-animate {
          animation: modalBackdrop 0.2s ease-out forwards;
        }
        .custom-modal-animate {
          animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-toast-animate {
          animation: toastSlide 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Manage TikTok Accounts</h2>
        <Link href="/tasks" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">Back to Task Pool</Link>
      </div>
      
      <form onSubmit={handleAddWorker} className="flex gap-4 mb-12">
        <input 
          type="text" 
          placeholder="TikTok Username (e.g., khaby.lame)"
          className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
        />
        <button type="submit" className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/10 active:scale-95">
          Add Account
        </button>
      </form>

      {/* Bulk Actions Bar */}
      {workers.length > 0 && (
        <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <label className="flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={workers.length > 0 && selectedAccountIds.length === workers.length} 
                onChange={handleSelectAll} 
                className="sr-only" 
              />
              <div className={`w-5 h-5 border rounded transition-all duration-200 flex items-center justify-center ${workers.length > 0 && selectedAccountIds.length === workers.length ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'bg-slate-950 border-white/20 hover:border-cyan-500/50'}`}>
                {workers.length > 0 && selectedAccountIds.length === workers.length && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                )}
              </div>
              <span className="text-gray-300 ml-2.5 font-medium text-sm">Select All</span>
            </label>
            <span className="text-xs text-gray-500 border-l border-white/10 pl-3">
              {selectedAccountIds.length} of {workers.length} selected
            </span>
          </div>
          
          <div className="flex space-x-3 w-full sm:w-auto justify-end">
            {selectedAccountIds.length > 0 && (
              <button
                type="button"
                onClick={triggerDeleteSelected}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-red-500/20 active:scale-95"
              >
                Delete Selected ({selectedAccountIds.length})
              </button>
            )}
            <button
              type="button"
              onClick={triggerDeleteAll}
              className="px-4 py-2 text-sm border border-red-500/30 hover:border-red-500 bg-red-500/5 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-semibold rounded-lg transition-all active:scale-95"
            >
              Delete All Accounts
            </button>
          </div>
        </div>
      )}

      {/* Workers Accounts List */}
      <div className="space-y-4">
        {workers.map((worker) => (
          <div key={worker.id} className="bg-slate-900 border border-white/10 rounded-xl p-6 flex justify-between items-center hover:border-white/20 transition-all duration-200">
            <div className="flex items-center space-x-4">
              {/* Checkbox */}
              <label className="flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={selectedAccountIds.includes(worker.id)} 
                  onChange={() => handleSelectAccount(worker.id)} 
                  className="sr-only" 
                />
                <div className={`w-5 h-5 border rounded transition-all duration-200 flex items-center justify-center ${selectedAccountIds.includes(worker.id) ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'bg-slate-950 border-white/20 hover:border-cyan-500/50'}`}>
                  {selectedAccountIds.includes(worker.id) && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  )}
                </div>
              </label>
              
              <div>
                <h3 className="text-xl font-semibold text-white">@{worker.tiktok_username}</h3>
                <p className="text-sm text-gray-400 mt-1">Status: {worker.is_active ? <span className="text-green-400">Active</span> : <span className="text-red-400">Banned</span>}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                <span className="text-gray-400 text-sm">Strikes: </span>
                <span className="text-white font-bold">{worker.strikes || 0}/3</span>
              </div>
              <button 
                type="button"
                onClick={() => triggerDeleteSingle(worker.id, worker.tiktok_username)}
                className="p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-colors flex items-center justify-center"
                title="Delete Account"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
        ))}
        {workers.length === 0 && (
          <p className="text-gray-500 text-center py-12 bg-slate-900/30 rounded-xl border border-white/5">No TikTok accounts added yet. Add one above to start earning credits!</p>
        )}
      </div>

      {/* Modern Custom Confirmation Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm custom-backdrop-animate"
            onClick={() => setModal((prev) => ({ ...prev, isOpen: false }))}
          />
          
          {/* Modal box */}
          <div className="relative bg-slate-950 border border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl overflow-hidden custom-modal-animate">
            {/* Glow decorative background elements */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-red-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start space-x-4">
              {/* Warning Icon */}
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex-shrink-0 animate-pulse">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>

              {/* Modal Body */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2 tracking-wide">Confirm Deletion</h3>
                
                <div className="text-gray-300 text-sm space-y-3">
                  {modal.type === 'single' && (
                    <p className="leading-relaxed">
                      Are you sure you want to delete <span className="text-cyan-400 font-semibold font-mono">@{modal.targetWorkerName}</span>?
                    </p>
                  )}
                  {modal.type === 'selected' && (
                    <p className="leading-relaxed">
                      Are you sure you want to delete the <span className="text-cyan-400 font-bold">{selectedAccountIds.length} selected</span> TikTok accounts?
                    </p>
                  )}
                  {modal.type === 'all' && (
                    <p className="leading-relaxed">
                      Are you sure you want to delete <span className="text-red-400 font-bold underline">ALL ({workers.length})</span> registered TikTok accounts?
                    </p>
                  )}
                  
                  <div className="text-xs text-gray-400 bg-white/5 border border-white/5 rounded-lg p-3 leading-relaxed">
                    <span className="text-red-400 font-semibold block mb-1">⚠️ Crucial Warning:</span>
                    This will remove the worker accounts and permanently delete all associated follow history. This cannot be undone.
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 bg-transparent border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleModalConfirm}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 custom-toast-animate ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300 shadow-emerald-950/20'
                : 'bg-red-950/90 border-red-500/30 text-red-300 shadow-red-950/20'
            }`}
          >
            <div className="mr-3 flex-shrink-0">
              {toast.type === 'success' ? (
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              ) : (
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              )}
            </div>
            <p className="text-sm font-semibold flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-4 p-1 hover:bg-white/5 rounded transition-all text-white/40 hover:text-white flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
