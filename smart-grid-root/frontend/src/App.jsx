import React, { useState, useEffect } from 'react';
import DashboardCharts from './DashboardCharts';

export default function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletAddress, setWalletAddress] = useState('0x' + '0'.repeat(40));
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  // Fetch dashboard data from backend API
  const fetchDashboardData = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/dashboard/data?wallet_address=${walletAddress}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and set up polling
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [walletAddress, refreshInterval]);

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-r-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-6 max-w-md rounded-lg">
          <h2 className="font-bold text-lg mb-2">Connection Error</h2>
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-3 text-red-200">
            Ensure the FastAPI backend is running on http://localhost:8000
          </p>
        </div>
      </div>
    );
  }

  const statusColors = {
    NORMAL: { bg: 'bg-green-900', border: 'border-green-500', text: 'text-green-100' },
    ANOMALOUS: { bg: 'bg-yellow-900', border: 'border-yellow-500', text: 'text-yellow-100' },
    DISCONNECTED: { bg: 'bg-red-900', border: 'border-red-500', text: 'text-red-100' },
    UNKNOWN: { bg: 'bg-gray-900', border: 'border-gray-500', text: 'text-gray-100' },
  };

  const currentStatus = dashboardData?.status || 'UNKNOWN';
  const statusStyle = statusColors[currentStatus];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-700 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold">⚡</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Smart Grid Control Panel
              </h1>
            </div>
            <div className="text-sm text-slate-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Status Banner */}
        <div
          className={`mb-8 rounded-lg border-l-4 p-6 ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {currentStatus === 'NORMAL' && '✓ System Normal'}
                {currentStatus === 'ANOMALOUS' && '⚠ Anomaly Detected'}
                {currentStatus === 'DISCONNECTED' && '✗ Disconnected'}
                {currentStatus === 'UNKNOWN' && '? Unknown Status'}
              </h2>
              <p className="text-sm opacity-90">
                {currentStatus === 'NORMAL' && 'All systems operational. Power supply active.'}
                {currentStatus === 'ANOMALOUS' && 'Unusual consumption pattern detected. Investigating...'}
                {currentStatus === 'DISCONNECTED' && 'Supply disconnected. Balance insufficient or anomaly threshold exceeded.'}
                {currentStatus === 'UNKNOWN' && 'Unable to determine system status.'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">
                {currentStatus === 'NORMAL' && '🟢'}
                {currentStatus === 'ANOMALOUS' && '🟡'}
                {currentStatus === 'DISCONNECTED' && '🔴'}
                {currentStatus === 'UNKNOWN' && '⚪'}
              </div>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Current Consumption */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 font-semibold">Current Load</h3>
              <span className="text-2xl">⚡</span>
            </div>
            <p className="text-4xl font-bold text-blue-400 mb-2">
              {(dashboardData?.current_consumption_kw || 0).toFixed(2)}
            </p>
            <p className="text-sm text-slate-400">kilowatts</p>
          </div>

          {/* Balance */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-green-500 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 font-semibold">Balance</h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-4xl font-bold text-green-400 mb-2">
              {(dashboardData?.current_balance_tokens || 0).toFixed(2)}
            </p>
            <p className="text-sm text-slate-400">tokens</p>
          </div>

          {/* Hours Remaining */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-purple-500 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 font-semibold">Time Remaining</h3>
              <span className="text-2xl">⏱</span>
            </div>
            <p className="text-4xl font-bold text-purple-400 mb-2">
              {dashboardData?.hours_remaining !== null && dashboardData?.hours_remaining !== undefined
                ? Math.floor(dashboardData.hours_remaining)
                : '∞'}
            </p>
            <p className="text-sm text-slate-400">hours</p>
          </div>

          {/* Anomaly Score */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-orange-500 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 font-semibold">Anomaly Score</h3>
              <span className="text-2xl">🔍</span>
            </div>
            <p className="text-4xl font-bold text-orange-400 mb-2">
              {((dashboardData?.anomaly_score || 0) * 100).toFixed(1)}
            </p>
            <p className="text-sm text-slate-400">%</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-300">Real-Time Consumption</h2>
            <DashboardCharts type="consumption" />
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-purple-300">24-Hour Forecast</h2>
            <DashboardCharts type="forecast" />
          </div>
        </div>

        {/* Recent Alerts */}
        {dashboardData?.recent_alerts && dashboardData.recent_alerts.length > 0 && (
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-orange-300">Recent Alerts</h2>
            <div className="space-y-3">
              {dashboardData.recent_alerts.map((alert, idx) => (
                <div key={idx} className="bg-slate-800 border border-slate-600 rounded p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-orange-300">{alert.type}</p>
                      <p className="text-sm text-slate-400">{alert.created_at}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          alert.severity === 'HIGH'
                            ? 'bg-red-900 text-red-200'
                            : alert.severity === 'MEDIUM'
                            ? 'bg-yellow-900 text-yellow-200'
                            : 'bg-blue-900 text-blue-200'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Footer */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-slate-300">System Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-800 rounded p-4">
              <p className="text-slate-400 text-sm mb-1">Mean Load</p>
              <p className="text-xl font-bold text-blue-400">
                {(dashboardData?.stats?.mean_consumption || 0).toFixed(2)} kW
              </p>
            </div>
            <div className="bg-slate-800 rounded p-4">
              <p className="text-slate-400 text-sm mb-1">Std Dev</p>
              <p className="text-xl font-bold text-purple-400">
                {(dashboardData?.stats?.std_consumption || 0).toFixed(2)} kW
              </p>
            </div>
            <div className="bg-slate-800 rounded p-4">
              <p className="text-slate-400 text-sm mb-1">Samples</p>
              <p className="text-xl font-bold text-cyan-400">
                {dashboardData?.stats?.total_samples || 0}
              </p>
            </div>
            <div className="bg-slate-800 rounded p-4">
              <p className="text-slate-400 text-sm mb-1">Status</p>
              <p className={`text-xl font-bold ${statusStyle.text}`}>
                {currentStatus}
              </p>
            </div>
            <div className="bg-slate-800 rounded p-4">
              <p className="text-slate-400 text-sm mb-1">Refresh</p>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-slate-700 text-slate-200 rounded px-2 py-1 text-sm border border-slate-600 focus:border-blue-500 outline-none"
              >
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
              </select>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-700 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
          <p>Smart Prepaid Power Grid System © 2026 | Blockchain-Enabled IoT Distribution</p>
        </div>
      </footer>
    </div>
  );
}
