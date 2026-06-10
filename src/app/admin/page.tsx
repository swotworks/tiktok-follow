import React from 'react';
import { OverviewMetrics } from '@/components/admin/OverviewMetrics';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { FailedTasksLogs } from '@/components/admin/FailedTasksLogs';
import { PendingCampaignsTable } from '@/components/admin/PendingCampaignsTable';

export default function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-400 mt-2">Welcome back to the admin control panel.</p>
      </div>

      <OverviewMetrics />
      
      <div className="grid grid-cols-1 gap-8">
        <PendingCampaignsTable />
        <UserManagementTable />
        <FailedTasksLogs />
      </div>
    </div>
  );
}
