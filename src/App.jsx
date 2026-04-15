import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/Auth/LoginPage';
import ForcePasswordChange from './components/Auth/ForcePasswordChange';
import MainLayout from './components/Layout/MainLayout';
import DashboardHome from './components/Dashboard/DashboardHome';
import RecordsList from './components/Tracker/RecordsList';
import CustomerDatabase from './components/Customers/CustomerDatabase';
import TemplateSettings from './components/Settings/TemplateSettings';
import UserManagement from './components/Admin/UserManagement';
import LSPDatabase from './components/LSPs/LSPDatabase';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)' }}>
      <Loader2 className="spin" size={48} color="var(--brand-green)" />
      <style jsx>{`
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  if (!user) {
    return <LoginPage />;
  }

  if (user.forcePasswordChange) {
    return <ForcePasswordChange />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardHome setActiveTab={setActiveTab} />;
      case 'records': return <RecordsList status="ongoing" />;
      case 'completed': return <RecordsList status="done" />;
      case 'customers': return <CustomerDatabase />;
      case 'lsps': return <LSPDatabase />;
      case 'settings': return <TemplateSettings />;
      case 'users': return <UserManagement />;
      default: return <DashboardHome setActiveTab={setActiveTab} />;
    }
  };

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </MainLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
