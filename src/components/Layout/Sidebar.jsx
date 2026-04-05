import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Clock, CheckCircle, Users, Settings, LogOut, ShieldCheck } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, isAdmin, logout } = useAuth();
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'records', label: 'Ongoing SO', icon: <Clock size={20} /> },
    { id: 'completed', label: 'Completed SO', icon: <CheckCircle size={20} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
    { id: 'settings', label: 'Settings & Templates', icon: <Settings size={20} /> },
    ...(isAdmin ? [{ id: 'users', label: 'User Management', icon: <ShieldCheck size={20} /> }] : []),
  ];

  return (
    <div className="sidebar" style={{ 
      width: '280px', 
      background: 'var(--sidebar-bg)', 
      height: '100vh', 
      position: 'fixed', 
      left: 0, 
      top: 0, 
      display: 'flex', 
      flexDirection: 'column',
      padding: '2rem 1.5rem',
      color: 'var(--sidebar-text)',
      zIndex: 100,
      boxShadow: '4px 0 24px rgba(0, 71, 55, 0.1)'
    }}>
      <div className="sidebar-header" style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '42px', 
          height: '42px', 
          background: 'var(--brand-green)', 
          borderRadius: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(96, 227, 24, 0.4)'
        }}>
          <span style={{ color: 'var(--brand-dark)', fontWeight: 'bold', fontSize: '1.4rem' }}>E</span>
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: 'white', fontWeight: 'bold', lineHeight: 1 }}>EcoGreen</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tracking System</span>
        </div>
      </div>

      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none' }}>
          {menuItems.map((item) => (
            <li key={item.id} style={{ marginBottom: '0.5rem' }}>
              <button
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '12px',
                  background: activeTab === item.id ? 'rgba(96, 227, 24, 0.15)' : 'transparent',
                  color: activeTab === item.id ? 'var(--brand-green)' : 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: activeTab === item.id ? '600' : '400',
                  textAlign: 'left'
                }}
                className="sidebar-btn"
              >
                {item.icon}
                <span style={{ fontSize: '0.95rem' }}>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', padding: '0 4px', marginBottom: '1rem' }}>
          {user?.fullName || user?.email}
        </div>
        <button onClick={logout} style={{ 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '12px 16px', 
          background: 'transparent', 
          border: 'none', 
          color: 'rgba(255,255,255,0.5)', 
          cursor: 'pointer',
          borderRadius: '10px',
          transition: 'all 0.2s'
        }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      <style jsx>{`
        .sidebar-btn:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
