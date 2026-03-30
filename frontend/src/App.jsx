import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PatientProfile from './components/PatientProfile';
import AddPatient from './components/AddPatient';
import PatientDirectory from './components/PatientDirectory';
import Login from './components/Login';
import CaretakerProfile from './components/CaretakerProfile';

import { AuthProvider, AuthContext } from './components/AuthContext';

const AppContent = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      {!isLoginPage && user && <Sidebar />}

      <div className={`flex-1 overflow-y-auto ${isLoginPage ? '' : 'p-8'}`}>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/patients" element={user ? <PatientDirectory /> : <Navigate to="/login" />} />
          <Route path="/add-patient" element={user ? <AddPatient /> : <Navigate to="/login" />} />
          <Route path="/patient/:id" element={user ? <PatientProfile /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <CaretakerProfile /> : <Navigate to="/login" />} />
          
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-full">
              <h1 className="text-4xl font-bold text-gray-400">404</h1>
              <p className="text-gray-500 mt-2">Page not found.</p>
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
