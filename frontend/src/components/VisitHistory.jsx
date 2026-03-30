import React, { useState, useEffect } from 'react';
import { Calendar, PlusCircle, Activity } from 'lucide-react';

const VisitHistory = ({ patientId }) => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setTimeout(() => {
          setVisits([
            { id: 1, date: "Oct 12, 2026", doctor: "Dr. Smith", notes: "Reported slight dizziness. Adjusted BP meds." },
            { id: 2, date: "Sep 28, 2026", doctor: "Dr. Adams", notes: "Routine checkup. Vitals stable." },
            { id: 3, date: "Sep 05, 2026", doctor: "Dr. Smith", notes: "Fall assessment. Prescribed walking aid." },
            { id: 4, date: "Aug 14, 2026", doctor: "Dr. Adams", notes: "Initial intake and baseline mobility test." }
          ]);
          setLoading(false);
        }, 600);
      } catch (error) {
        console.error("Failed to fetch visit history", error);
        setLoading(false);
      }
    };

    fetchHistory();
  }, [patientId]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-800">Visit History</h2>
        </div>
        <button className="flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
          <PlusCircle className="w-4 h-4" />
          Log Visit
        </button>
      </div>
      
      <div className="p-6 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-slate-400 gap-2">
            <Activity className="w-5 h-5 animate-pulse" />
            Loading records...
          </div>
        ) : (
          <div className="space-y-6 border-l-2 border-slate-100 ml-3">
            {visits.map((visit) => (
              <div key={visit.id} className="relative pl-6">
                <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-bold text-slate-700">{visit.date}</p>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {visit.doctor}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{visit.notes}</p>
              </div>
            ))}
            
            {visits.length === 0 && (
              <p className="text-sm text-slate-400 italic">No previous visits recorded.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitHistory;
