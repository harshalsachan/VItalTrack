import React, { useState } from 'react';
import axios from 'axios';
import { Activity, Heart, AlertTriangle, CheckCircle } from 'lucide-react';

const LogVitalsForm = ({ patientId, onNewReading }) => {
  const [sysBp, setSysBp] = useState('');
  const [diaBp, setDiaBp] = useState('');
  const [heartRate, setHeartRate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [aiAlert, setAiAlert] = useState(null);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAiAlert(null);
    setSuccess('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://auracure-backend.onrender.com/api';
      
      const response = await axios.post(`${API_URL}/vitals/log`, {
        patientId: parseInt(patientId),
        sysBp: parseInt(sysBp),
        diaBp: parseInt(diaBp),
        heartRate: parseInt(heartRate)
      });

      // Clear the form
      setSysBp('');
      setDiaBp('');
      setHeartRate('');
      
      // Handle the AI response
      if (response.data.alert) {
        setAiAlert(response.data.alert);
      } else {
        setSuccess('Vitals logged successfully. Patient is stable.');
      }

      // Trigger any parent component updates (like refreshing the graph)
      if (onNewReading) onNewReading();

    } catch (error) {
      console.error("Error logging vitals:", error);
      setAiAlert("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-slate-800">Log Daily Vitals</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Systolic BP (mmHg)</label>
            <input 
              type="number" 
              required min="50" max="250"
              value={sysBp} onChange={(e) => setSysBp(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. 120"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Diastolic BP (mmHg)</label>
            <input 
              type="number" 
              required min="30" max="150"
              value={diaBp} onChange={(e) => setDiaBp(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. 80"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Heart Rate (BPM)</label>
          <div className="relative">
            <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="number" 
              required min="30" max="200"
              value={heartRate} onChange={(e) => setHeartRate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. 72"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {loading ? 'Analyzing...' : 'Submit & Analyze'}
        </button>
      </form>

      {/* AI Alert Feedback UI */}
      {aiAlert && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 font-medium">{aiAlert}</p>
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <p className="text-sm text-green-800 font-medium">{success}</p>
        </div>
      )}
    </div>
  );
};

export default LogVitalsForm;