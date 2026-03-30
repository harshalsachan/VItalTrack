import React from 'react';
import WaitingRoom from './WaitingRoom';
import HighRiskAlerts from './HighRiskAlerts';

const Dashboard = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Overview</h1>
        <p className="text-slate-500 mt-1">Monitor daily tasks and critical patient alerts.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <WaitingRoom />
        </section>

        <section>
          <HighRiskAlerts />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
