import React from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children, activeTab, setActiveTab }) => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main style={{ 
        flex: 1, 
        marginLeft: '280px', 
        padding: '2rem 3rem',
        minHeight: '100vh',
        background: 'var(--bg-color)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
