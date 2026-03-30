import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle } from 'lucide-react';

const MobilityTrendChart = () => {
  const data = [
    { day: 'Day 1', actualSteps: 4200 },
    { day: 'Day 5', actualSteps: 4100 },
    { day: 'Day 10', actualSteps: 3800 },
    { day: 'Day 15', actualSteps: 3650 },
    { day: 'Day 20', actualSteps: 3400 },
    { day: 'Day 25', actualSteps: 3100 },
    { day: 'Day 30', actualSteps: 2800, predictedSteps: 2800 },
    { day: 'Day 32', predictedSteps: 2600 },
    { day: 'Day 35', predictedSteps: 2300 },
    { day: 'Day 37', predictedSteps: 2100 },
  ];

  const isDeclining = data[data.length - 1].predictedSteps < 2500;

  return (
    <div className="w-full">
      {isDeclining && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-bold text-sm">AI Alert: Declining Mobility Detected</h3>
            <p className="text-red-600 text-sm mt-1">
              Linear regression analysis indicates this patient's step count will drop below the critical threshold (2500 steps) within the next week. Recommend immediate physical therapy assessment.
            </p>
          </div>
        </div>
      )}

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            
            <Line 
              type="monotone" 
              name="Actual Steps (Past 30 Days)" 
              dataKey="actualSteps" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2 }} 
              activeDot={{ r: 6 }} 
            />
            
            <Line 
              type="monotone" 
              name="AI Prediction (Next 7 Days)" 
              dataKey="predictedSteps" 
              stroke="#ef4444" 
              strokeWidth={3} 
              strokeDasharray="5 5" 
              dot={{ r: 4, strokeWidth: 2 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MobilityTrendChart;
