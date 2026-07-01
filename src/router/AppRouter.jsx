import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import Login from '@/pages/auth/Login';
import Students from '@/pages/admin/Students';
import Teachers from '@/pages/admin/Teachers';
import Advisories from '@/pages/admin/Advisories';
import AdvisoryDetail from '@/pages/admin/AdvisoryDetail';
import Reports from '@/pages/admin/Reports';
import Scan from '@/pages/teacher/Scan';
import Attendance from '@/pages/teacher/Attendance';
import QRGenerator from '@/pages/teacher/QRGenerator';
import AdvisoryList from '@/pages/teacher/AdvisoryList';

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(o => !o)} />
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 p-4 md:p-6 bg-gray-50 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function DashboardLayout() {
  return (
    <AppLayout>
      <Routes>
        <Route path="students" element={<Students />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="advisories" element={<Advisories />} />
        <Route path="advisories/:id" element={<AdvisoryDetail />} />
        <Route path="reports" element={<Reports />} />
      </Routes>
    </AppLayout>
  );
}

function TeacherLayout() {
  return (
    <AppLayout>
      <Routes>
        <Route path="scan" element={<Scan />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="advisory-list" element={<AdvisoryList />} />
        <Route path="qr-generator" element={<QRGenerator />} />
      </Routes>
    </AppLayout>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin/*" element={<DashboardLayout />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
        <Route path="/teacher/*" element={<TeacherLayout />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<div className="flex items-center justify-center h-screen"><h1 className="text-2xl">404 - Page Not Found</h1></div>} />
    </Routes>
  );
}
