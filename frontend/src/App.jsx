import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Employees from './pages/Employees';
import Settings from './pages/Settings';
import FinancialInputs from './pages/FinancialInputs';
import KPI from './pages/KPI';

function App() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout month={month} setMonth={setMonth} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="employees" element={<Employees />} />
          <Route path="kpi" element={<KPI />} />
          <Route path="financial" element={<FinancialInputs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
