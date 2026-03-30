import React, { useState, useEffect ,useContext } from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from './AuthContext';

const HighRiskAlerts = () => {
  
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
  const fetchHighRiskPatients = async () => {
    try {
    const API_URL = import.meta.env.VITE_API_URL || 'https://auracure-backend.onrender.com/api';
    const response = await axios.get(`${API_URL}/patients/high-risk?caretaker_id=${user.id}`);
    setAlerts(response.data);
    } catch (err) {
    console.error("Error fetching alerts:", err);
    setError('Failed to connect to the backend.');
    } finally {
    setLoading(false);
    }
  };

  fetchHighRiskPatients();
  }, [user.id]);

  if (loading) {
  return <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">Syncing with C++ Engine...</div>;
  }

  if (error) {
  return <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-200">{error}</div>;
  }

  return (
  <div className="bg-red-50/30 rounded-xl border border-red-100 overflow-hidden">
    <div className="px-6 py-4 border-b border-red-100 flex items-center gap-2 bg-white">
    <AlertCircle className="w-5 h-5 text-red-600" />
    <h3 className="font-bold text-slate-800">High-Risk Patients</h3>
    </div>
    
    <div className="divide-y divide-red-50 bg-white">
    {alerts.length === 0 ? (
      <div className="p-6 text-center text-slate-500">No high-risk patients currently in the BST.</div>
    ) : (
      alerts.map((alert) => (
      <Link 
        key={alert.id}
        to={`/patient/${alert.id}`} 
        className="block p-5 hover:bg-slate-50 transition-colors group"
      >
        <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-800">{alert.name}</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
            alert.riskLevel === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {alert.riskLevel}
          </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{alert.reason}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </div>
      </Link>
      ))
    )}
    </div>
  </div>
  );
};

export default HighRiskAlerts;
