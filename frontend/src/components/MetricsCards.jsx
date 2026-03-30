import React from 'react';
import { HeartPulse, Activity, Footprints, Scale } from 'lucide-react';

const MetricsCards = () => {
  const metrics = [
    {
      title: "Heart Rate",
      value: "72",
      unit: "bpm",
      status: "Normal",
      icon: HeartPulse,
      color: "text-rose-500",
      bgColor: "bg-rose-100",
      alert: false
    },
    {
      title: "Blood Pressure",
      value: "120/80",
      unit: "mmHg",
      status: "Optimal",
      icon: Activity,
      color: "text-indigo-500",
      bgColor: "bg-indigo-100",
      alert: false
    },
    {
      title: "Balance Score",
      value: "85",
      unit: "/100",
      status: "Good",
      icon: Scale,
      color: "text-emerald-500",
      bgColor: "bg-emerald-100",
      alert: false
    },
    {
      title: "Today's Steps",
      value: "1,240",
      unit: "steps",
      status: "Below Target",
      icon: Footprints,
      color: "text-amber-500",
      bgColor: "bg-amber-100",
      alert: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        
        return (
          <div 
            key={index} 
            className={`p-5 rounded-xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md ${
              metric.alert ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <IconComponent className={`w-6 h-6 ${metric.color}`} />
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                metric.alert ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {metric.status}
              </span>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-slate-500">{metric.title}</h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-slate-800">{metric.value}</span>
                <span className="text-sm font-medium text-slate-400">{metric.unit}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricsCards;
