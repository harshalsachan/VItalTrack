import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getWaitingRoomTasks = () => API.get('/waiting-room');
export const completeTask = (taskId) => API.post(`/waiting-room/complete/${taskId}`);

export const getHighRiskAlerts = () => API.get('/patients/high-risk');

export const getPatientProfile = (patientId) => API.get(`/patients/${patientId}`);

export const getVisitHistory = (patientId) => API.get(`/patients/${patientId}/visits`);
export const addVisitLog = (patientId, visitData) => API.post(`/patients/${patientId}/visits`, visitData);

export const getMobilityTrend = (patientId) => API.get(`/patients/${patientId}/mobility-prediction`);

export default API;
