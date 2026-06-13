import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardCharts({ type = 'consumption' }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        if (type === 'consumption') {
          // Fetch recent telemetry data for consumption chart
          const response = await fetch('http://localhost:8000/api/telemetry/latest?limit=50', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          if (response.ok) {
            const telemetryLogs = await response.json();

            // Transform telemetry data for Recharts
            const chartData = telemetryLogs
              .reverse()
              .map((log, index) => ({
                time: index,
                consumption: log.power_consumption_kw || 0,
                load: log.load_percentage || 0,
                timestamp: new Date(log.timestamp).toLocaleTimeString(),
              }));

            setChartData(chartData);
          }
        } else if (type === 'forecast') {
          // Fetch consumption forecast for next 24 hours
          const response = await fetch('http://localhost:8000/api/ml/forecast?hours=24', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          if (response.ok) {
            const forecastData = await response.json();

            if (forecastData.success) {
              // Transform forecast data for Recharts
              const chartData = forecastData.forecast.map((consumption, index) => ({
                hour: index,
                forecast: consumption,
                label: `H+${index}`,
              }));

              setChartData(chartData);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Provide sample data on error
        if (type === 'consumption') {
          setChartData(
            Array.from({ length: 20 }, (_, i) => ({
              time: i,
              consumption: Math.random() * 8 + 1,
              load: Math.random() * 80 + 10,
              timestamp: new Date(Date.now() - (20 - i) * 10000).toLocaleTimeString(),
            }))
          );
        } else {
          setChartData(
            Array.from({ length: 24 }, (_, i) => ({
              hour: i,
              forecast: Math.random() * 6 + 2,
              label: `H+${i}`,
            }))
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
    const interval = setInterval(fetchChartData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [type]);

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-slate-800 rounded">
        <p className="text-slate-400 text-center">Insufficient data for chart</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
        <XAxis
          dataKey={type === 'consumption' ? 'timestamp' : 'label'}
          stroke="#94a3b8"
          style={{ fontSize: '12px' }}
        />
        <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#e2e8f0' }}
          formatter={(value) => value.toFixed(2)}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        {type === 'consumption' && (
          <>
            <Line
              type="monotone"
              dataKey="consumption"
              stroke="#0ea5e9"
              name="Power (kW)"
              dot={false}
              isAnimationActive={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="load"
              stroke="#8b5cf6"
              name="Load %"
              dot={false}
              isAnimationActive={false}
              strokeWidth={2}
            />
          </>
        )}
        {type === 'forecast' && (
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#10b981"
            name="Predicted Load (kW)"
            dot={false}
            isAnimationActive={false}
            strokeWidth={2}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
