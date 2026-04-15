import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { calculatePriority, PRIORITY_LEVELS } from '../../logic/priority';
import { 
  LayoutDashboard, Clock, AlertCircle, CheckCircle, 
  TrendingUp, BarChart3, Loader2, Users 
} from 'lucide-react';

const DashboardHome = ({ setActiveTab }) => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({ 
    ongoing: 0, done: 0, high: 0, medium: 0, normal: 0, today: 0, upcoming: [] 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [ongoing, done] = await Promise.all([
        api.get('/records?status=ongoing'),
        api.get('/records?status=done'),
      ]);

      const high = ongoing.filter(r => calculatePriority(r) === PRIORITY_LEVELS.HIGH.id);
      const mdm  = ongoing.filter(r => calculatePriority(r) === PRIORITY_LEVELS.MEDIUM.id);
      const nrm  = ongoing.filter(r => calculatePriority(r) === PRIORITY_LEVELS.NORMAL.id);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayDeliveries = ongoing.filter(r => r.etd === todayStr);

      const upcoming = [...ongoing].sort((a, b) => new Date(a.etd) - new Date(b.etd)).slice(0, 5);

      setStats({
        ongoing: ongoing.length,
        done: done.length,
        high: high.length,
        medium: mdm.length,
        normal: nrm.length,
        today: todayDeliveries.length,
        upcoming,
      });
    } catch (err) {
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Loader2 className="spin" size={48} color="var(--brand-green)" />
    </div>
  );

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--brand-dark)', marginBottom: '0.5rem' }}>
            Welcome Back, {user?.fullName?.split(' ')[0] || 'User'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            {isAdmin ? 'Monitoring progress performance.' : "Here's an overview of your assigned Sales Orders."}
          </p>
        </div>
        {isAdmin && (
          <div style={{ padding: '0.5rem 1rem', background: 'var(--brand-dark)', color: 'white', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
            ADMINISTRATOR MODE
          </div>
        )}
      </header>

      <div className="grid-responsive-cards" style={{ marginBottom: '2.5rem' }}>
        <StatCard title="Ongoing SO" value={stats.ongoing} icon={<Clock size={24} color="var(--brand-dark)" />} color="var(--brand-green)" onClick={() => setActiveTab('records')} />
        <StatCard title="Need to Aware" value={stats.today} icon={<TrendingUp size={24} color="#ef6c00" />} color="#ffb74d" onClick={() => setActiveTab('records')} />
        <StatCard title="High Priority" value={stats.high} icon={<AlertCircle size={24} color="#c62828" />} color="var(--error)" onClick={() => setActiveTab('records')} />
        <StatCard title="Completed" value={stats.done} icon={<CheckCircle size={24} color="#2e7d32" />} color="var(--success)" onClick={() => setActiveTab('completed')} />
      </div>

      <div className="grid-dashboard-main">
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <BarChart3 size={20} color="var(--brand-green)" /> {isAdmin ? 'Global Priority Timeline' : 'Your Nearest Shipments'}
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1rem 0', textAlign: 'left' }}>SO NUMBER</th>
                  <th style={{ padding: '1rem 0', textAlign: 'left' }}>CUSTOMER</th>
                  <th style={{ padding: '1rem 0', textAlign: 'left' }}>ETD DATE</th>
                  <th style={{ padding: '1rem 0', textAlign: 'right' }}>PRIORITY</th>
                </tr>
              </thead>
              <tbody>
                {stats.upcoming.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(0,71,55,0.05)', fontSize: '0.95rem' }}>
                    <td style={{ padding: '1.2rem 0', fontWeight: '700', color: 'var(--brand-dark)' }}>{item.so_number}</td>
                    <td style={{ padding: '1.2rem 0', color: 'var(--text-primary)' }}>{item.customer_name}</td>
                    <td style={{ padding: '1.2rem 0', color: 'var(--text-secondary)' }}>{item.etd}</td>
                    <td style={{ padding: '1.2rem 0', textAlign: 'right' }}>
                      <span className={`badge ${calculatePriority(item) === PRIORITY_LEVELS.HIGH.id ? 'badge-high' : calculatePriority(item) === PRIORITY_LEVELS.MEDIUM.id ? 'badge-medium' : 'badge-normal'}`}>
                        {calculatePriority(item) === PRIORITY_LEVELS.MEDIUM.id ? 'NEED TO AWARE' : calculatePriority(item)}
                      </span>
                    </td>
                  </tr>
                ))}
                {stats.upcoming.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No active shipments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.8rem' }}>Priority Level Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
              <DistributionBar label="High Priority" count={stats.high} total={stats.ongoing} color="var(--error)" />
              <DistributionBar label="Need to Aware" count={stats.medium} total={stats.ongoing} color="var(--warning)" />
              <DistributionBar label="Normal Priority" count={stats.normal} total={stats.ongoing} color="var(--success)" />
            </div>
          </div>
          
          <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--brand-dark)', color: 'white' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={20} color="var(--brand-green)" />
                <h4 style={{ color: 'var(--brand-green)', fontSize: '0.9rem', textTransform: 'uppercase' }}>User Info</h4>
             </div>
             <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5', marginTop: '8px' }}>
               Logged in as <b>{user?.fullName}</b> ({user?.role}).
             </p>
          </div>
        </div>
      </div>
      <style jsx>{`
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, onClick }) => (
  <div className="glass-card" onClick={onClick} style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '0.8rem', 
    cursor: 'pointer',
    borderTop: `4px solid ${color}`
  }}>
     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{title}</span>
        <div style={{ padding: '8px', background: 'rgba(0,71,55,0.03)', borderRadius: '10px' }}>{icon}</div>
     </div>
     <h2 style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--brand-dark)' }}>{value}</h2>
  </div>
);

const DistributionBar = ({ label, count, total, color }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 'bold' }}>{count} ({percentage}%)</span>
      </div>
      <div style={{ width: '100%', height: '8px', background: 'rgba(0, 71, 55, 0.05)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ width: `${percentage}%`, height: '100%', background: color, transition: 'width 0.8s' }}></div>
      </div>
    </div>
  );
};

export default DashboardHome;
