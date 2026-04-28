import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAuth } from './contexts/AuthContext';

import AdminLayout from './layouts/AdminLayout';
import Login from './pages/auth/Login';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import Archives from './pages/patients/Archives';
import Patients from './pages/patients/Patients';
import PatientHistory from './pages/patients/PatientHistory';
import Agenda from './pages/appointments/Agenda';
import Documents from './pages/documents/Documents';
import Stock from './pages/inventory/Stock';
import Billing from './pages/billing/Billing';
import Messages from './pages/messages/Messages';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

export const CustomRouters = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          } 
        >
           <Route index element={<DashboardOverview />} />
           <Route path="patients" element={<Patients />} />
           <Route path="archives" element={<Archives />} />
           <Route path="patients/:id/history" element={<PatientHistory />} />
           <Route path="agenda" element={<Agenda />} />
           <Route path="documents" element={<Documents />} />
           <Route path="stock" element={<Stock />} />
           <Route path="billing" element={<Billing />} />
           <Route path="messages" element={<Messages />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
