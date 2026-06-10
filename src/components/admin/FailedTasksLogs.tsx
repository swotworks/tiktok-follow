import React from 'react';

const MOCK_LOGS = [
  { id: 1042, worker: 'bot_account_1', target: 'khaby.lame', time: '2 mins ago', error: 'Proxy Timeout (504)' },
  { id: 1045, worker: 'real_user_88', target: 'mrbeast', time: '15 mins ago', error: 'Element Not Found (Selector changed?)' },
  { id: 1048, worker: 'spam_bot_xyz', target: 'charlidamelio', time: '1 hour ago', error: 'Captcha Blocked' },
];

export const FailedTasksLogs = () => {
  return (
    <div className="bg-slate-900 border border-red-500/20 rounded-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
      <div className="p-6 border-b border-white/10 bg-slate-900/50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Failed Verification Logs
          </h2>
          <p className="text-sm text-gray-400 mt-1">Monitor scraper health and proxy blocks.</p>
        </div>
        <button className="text-sm text-red-400 hover:text-red-300 font-medium">Clear All</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-slate-800/30 text-xs uppercase font-semibold text-gray-400">
            <tr>
              <th className="px-6 py-3">Log ID</th>
              <th className="px-6 py-3">Worker</th>
              <th className="px-6 py-3">Target</th>
              <th className="px-6 py-3">Error Reason</th>
              <th className="px-6 py-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {MOCK_LOGS.map((log) => (
              <tr key={log.id} className="hover:bg-red-500/[0.02] transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-gray-500">#{log.id}</td>
                <td className="px-6 py-4 text-white">@{log.worker}</td>
                <td className="px-6 py-4">@{log.target}</td>
                <td className="px-6 py-4">
                  <span className="text-red-400 bg-red-500/10 px-2 py-1 rounded text-xs font-medium">
                    {log.error}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-xs">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
