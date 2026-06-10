'use client';

import React from 'react';
import { UserManagementTable } from '@/components/admin/UserManagementTable';

export default function AdminUsersPage() {
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
        <p className="text-gray-400 mt-2">Manage all system users, their credits, worker accounts, and created campaigns.</p>
      </div>

      <UserManagementTable />
    </div>
  );
}
