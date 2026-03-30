import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Activity, BrainCircuit, AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import LogVitalsForm from './LogVitalsForm';

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [aiResult, setAiResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchPatientData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://auracure-backend.onrender.com/api';
      const response = await axios.get(`${API_URL}/patients/${id}`);
      setPatient(response.data);
    } catch (err) {
      console.error(err);
      setError('Patient not found in the C++ Engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const runAIPrediction = async () => {
    setIsAnalyzing(true);
    setAiResult(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://auracure-backend.onrender.com/api';
      const response = await axios.get(`${API_URL}/ai/predict-risk/${patient.id}`);
      
      if (response.data.error) {
        alert(response.data.error);
      } else {
        setAiResult(response.data);
      }
    } catch (err) {
      console.error("AI Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Retrieving O(1) Profile from Hash Map...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{patient.name}</h1>
          <p className="text-slate-500">Patient ID: {patient.id} • {patient.age} Years Old</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Activity className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">Current Vitals</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-500 font-medium">Risk Score</p>
                  <p className="text-2xl font-bold text-slate-800">{patient.riskScore}/100</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-500 font-medium">Status</p>
                  <p className={`text-lg font-bold mt-1 ${
                    patient.status === 'Critical' ? 'text-red-600' : 
                    patient.status === 'High Risk' ? 'text-orange-600' : 
                    'text-green-600'
                  }`}>
                    {patient.status}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-6 text-white space-y-4 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 opacity-10">
                <BrainCircuit className="w-48 h-48" />
              </div>

              <div className="relative z-10 flex items-center gap-2 border-b border-slate-700 pb-3">
                <BrainCircuit className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">AI Predictive Analysis</h2>
              </div>
              
              <div className="relative z-10">
                {!aiResult ? (
                  <div className="text-center py-6">
                    <p className="text-slate-400 mb-4 text-sm">Run Linear Regression on personalized mobility data to forecast future risk trajectory.</p>
                    <button 
                      onClick={runAIPrediction}
                      disabled={isAnalyzing}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors w-full"
                    >
                      {isAnalyzing ? 'Processing Math Engine...' : 'Run Personalized Prediction'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className={`p-3 rounded-lg flex items-center gap-3 ${
                      aiResult.trajectory_slope < -5 ? 'bg-red-500/20 text-red-200 border border-red-500/30' : 
                      aiResult.trajectory_slope < 0 ? 'bg-orange-500/20 text-orange-200 border border-orange-500/30' : 
                      'bg-green-500/20 text-green-200 border border-green-500/30'
                    }`}>
                      {aiResult.trajectory_slope < 0 ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                      <span className="font-medium">{aiResult.ai_warning}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-sm">Projected Sys BP</p>
                        <p className="text-2xl font-bold">{aiResult.predicted_value}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Slope (m)</p>
                        <p className={`text-xl font-mono ${aiResult.trajectory_slope < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {aiResult.trajectory_slope > 0 ? '+' : ''}{aiResult.trajectory_slope}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <LogVitalsForm patientId={patient.id} onNewReading={fetchPatientData} />
        </div>

      </div>
    </div>
  );
};

export default PatientProfile;
