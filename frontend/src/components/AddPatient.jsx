import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

const AddPatient = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [patientId, setPatientId] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [riskScore, setRiskScore] = useState('');
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });
    const API_URL = import.meta.env.VITE_API_URL || 'https://auracure-backend.onrender.com/api';
    try {
      await axios.post(`${API_URL}/patients`, {
        id: parseInt(patientId),
        name: name,
        age: parseInt(age),
        riskScore: parseInt(riskScore),
        caretakerId: user.id 
      });

      setStatus({ type: 'success', message: `${name} has been added to the system.` });
      
      setPatientId('');
      setName('');
      setAge('');
      setRiskScore('');

      setTimeout(() => navigate('/'), 2000);

    } catch (error) {
      console.error(error);
      setStatus({ 
        type: 'error', 
        message: 'Failed to add patient. Ensure the backend is running.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Register New Patient</h1>
        <p className="text-slate-500 mt-1">Enter patient details to initialize them in the C++ tracking engine.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        
        {status.message && (
          <div className={`p-4 mb-6 rounded-lg flex items-center gap-2 text-sm font-medium ${
            status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Patient ID Number</label>
              <input 
                type="number" 
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 405"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Jane Doe"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Age</label>
              <input 
                type="number" 
                required
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="65"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Initial Risk Score (0-100)</label>
              <input 
                type="number" 
                required
                min="0"
                max="100"
                value={riskScore}
                onChange={(e) => setRiskScore(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="85"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              <UserPlus className="w-5 h-5" />
              {isLoading ? 'Injecting to Engine...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;
