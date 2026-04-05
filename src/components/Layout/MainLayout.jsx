import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const MainLayout = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* Mobile Top Navigation */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          height: '60px',
          background: 'var(--brand-dark)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1rem',
          zIndex: 80,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            style={{ background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '5px' }}
          >
            <Menu size={26} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '1rem' }}>
            <div style={{ width: '30px', height: '30px', background: 'var(--brand-green)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--brand-dark)', fontWeight: 'bold', fontSize: '1rem' }}>E</span>
            </div>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>EcoGreen</span>
          </div>
        </div>
      )}

      {/* Sidebar Overlay for Mobile */}
      {isMobile && (
        <div 
          className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        isOpen={isMobile ? isSidebarOpen : true} 
      />

      <main 
        className="main-content"
        style={{ 
          flex: 1, 
          marginLeft: isMobile ? '0' : '280px', 
          padding: isMobile ? '5rem 1rem 2rem' : '2rem 3rem',
          transition: 'margin 0.3s ease, padding 0.3s ease'
        }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
