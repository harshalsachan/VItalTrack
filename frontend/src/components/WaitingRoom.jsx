import React, { useState, useEffect, useContext } from 'react';
import { Clock, CheckCircle2, Plus, X } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from './AuthContext'; // Import



const WaitingRoom = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for the new task form
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTime, setNewTime] = useState('');

 const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks?caretaker_id=${user.id}`);
      setTasks(response.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Dequeue (Remove from front)
 const handleCompleteNextTask = async () => {
    try {
      // Fixed: Using tasks[0].id instead of undefined taskId
      await axios.post(`${API_URL}/tasks/complete?task_id=${tasks[0].id}`);
      fetchTasks();
    } catch (err) {
      console.error("Failed to complete task");
    }
  };

  // Enqueue (Add to back)
  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/tasks`, {
        patientName: newName,
        description: newDesc,
        time: newTime,
        caretakerId: user.id
      });
      setNewName('');
      setNewDesc('');
      setNewTime('');
      setIsAdding(false);
      fetchTasks();
    } catch (err) {
      console.error("Failed to add task");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">Loading Queue...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-800">Waiting Room Queue</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
            {tasks.length} Pending
          </span>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      {/* The Dynamic Queue List */}
      <div className="divide-y divide-slate-50 flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500">All caught up! Queue is empty.</div>
        ) : (
          tasks.map((task, index) => (
            <div key={task.id} className="p-5 hover:bg-slate-50 transition-colors flex justify-between items-center group">
              <div>
                <h4 className="font-semibold text-slate-800">{task.patientName}</h4>
                <p className="text-sm text-slate-500 mt-1">
                  {task.description} • {task.time}
                </p>
              </div>
              
              {/* FIFO Logic: Only the first task can be completed */}
              {index === 0 && (
                <button 
                  onClick={handleCompleteNextTask}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Next
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Inline Form to Add Tasks */}
      {isAdding && (
        <form onSubmit={handleAddTask} className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          <input 
            type="text" required placeholder="Patient Name" 
            value={newName} onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md outline-none focus:border-blue-500"
          />
          <input 
            type="text" required placeholder="Task Description (e.g. Blood Draw)" 
            value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <input 
              type="time" required 
              value={newTime} onChange={(e) => setNewTime(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md outline-none focus:border-blue-500"
            />
            <button type="submit" className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-900 transition-colors">
              Add Task
            </button>
          </div>
        </form>
      )}

    </div>
  );
};

export default WaitingRoom;