import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Clock, CheckCircle, Users, Settings, LogOut, ShieldCheck, Truck } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, isOpen = true }) => {
  const { user, isAdmin, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(currentTime).replace(/\./g, ':');
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'records', label: 'Ongoing SO (Shipment)', icon: <Clock size={20} /> },
    { id: 'sc-tracking', label: 'SC (Sales Contract)', icon: <LayoutDashboard size={20} /> },
    { id: 'si-tracking', label: 'SI (Shipping Instructions)', icon: <Truck size={20} /> },
    { id: 'completed', label: 'Completed Deliveries', icon: <CheckCircle size={20} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
    { id: 'lsps', label: 'Logistics Partners', icon: <Truck size={20} /> },
    { id: 'settings', label: 'Settings & Templates', icon: <Settings size={20} /> },
    ...(isAdmin ? [{ id: 'users', label: 'User Management', icon: <ShieldCheck size={20} /> }] : []),
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`} style={{ 
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

      <div style={{
        background: 'rgba(0,0,0,0.15)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1.5rem',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--brand-green)', letterSpacing: '1px', fontFamily: 'monospace' }}>
          {formattedTime} <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>WIB</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '6px' }}>
          {formattedDate}
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
          transition: 'all 0.2s',
          marginBottom: '1rem'
        }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
        
        <div style={{ padding: '0 4px', textAlign: 'center' }}>
          <a href="https://portfolio-alzi.netlify.app/" target="_blank" rel="noopener noreferrer" style={{ 
            fontSize: '0.7rem', 
            color: 'rgba(255,255,255,0.2)', 
            textDecoration: 'none',
            transition: 'color 0.2s'
          }} className="watermark-link">
            All rights reserved by Alzi
          </a>
        </div>
      </div>

      <style jsx>{`
        .sidebar-btn:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          color: white !important;
        }
        .watermark-link:hover {
          color: var(--brand-green) !important;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
