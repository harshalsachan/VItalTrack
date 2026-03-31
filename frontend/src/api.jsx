import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://auracure-backend.onrender.com/api';

const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getWaitingRoomTasks = (caretakerId) => API.get(`/tasks?cargetaker_id=${caretakerId}`);
export const completeTask = (taskId) => API.post(`/tasks/complete?task_id=${taskId}`);

export const getHighRiskAlerts = (caretakerId) => API.get(`/patients/high-risk?caretaker_id=${caretakerId}`);

export const getPatientProfile = (patientId) => API.get(`/patients/${patientId}`);

export const getVisitHistory = (patientId) => API.get(`/patients/${patientId}/visits`);

export const addVisitLog = (patientId, visitData) => API.post(`/vitals/log`, visitData);

export const getMobilityTrend = (patientId) => API.get(`/ai/predict-risk/${patientId}`);

export default API;
