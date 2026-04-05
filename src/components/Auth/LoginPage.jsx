import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-color)',
      padding: '20px'
    }}>
      <div className="glass-card fade-in" style={{ 
        maxWidth: '450px', 
        width: '100%', 
        padding: '3rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: 'var(--brand-green)', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 8px 16px rgba(96, 227, 24, 0.3)'
          }}>
            <span style={{ color: 'var(--brand-dark)', fontWeight: 'bold', fontSize: '2rem' }}>E</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>EcoGreen ETS</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Secure Sales Order Tracking Portal</p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(229, 57, 53, 0.1)', 
            color: 'var(--error)', 
            padding: '1rem', 
            borderRadius: '12px', 
            marginBottom: '1.5rem',
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            fontSize: '0.9rem',
            border: '1px solid rgba(229, 57, 53, 0.2)'
          }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Corporate Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={iconStyle} />
              <input 
                type="email" 
                required 
                placeholder="admin@ecogreen.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <label style={labelStyle}>Secure Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={iconStyle} />
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ width: '100%', padding: '1.2rem', justifyContent: 'center', fontSize: '1.1rem' }}
          >
            {loading ? <Loader2 className="spin" size={22} /> : <><LogIn size={20} /> Access Portal</>}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          © 2026 EcoGreen Oleochemicals<br/>
          Internal Logistics & CS Management Tool
        </div>
      </div>

      <style jsx>{`
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', padding: '14px 14px 14px 42px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' };
const iconStyle = { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' };

export default LoginPage;
