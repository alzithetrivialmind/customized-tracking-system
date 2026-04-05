import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, UserCog, Mail, Shield, UserPlus, X, Loader2, Search } from 'lucide-react';

const UserManagement = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newUser, setNewUser] = useState({ 
    email: '', 
    fullName: '', 
    password: 'user123',
    role: 'user' 
  });

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const profiles = await api.get('/users');
      setUsers(profiles);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/create-user', newUser);
      alert(`User ${newUser.fullName} created successfully.`);
      setShowAdd(false);
      setNewUser({ email: '', fullName: '', password: 'user123', role: 'user' });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change user to ${newRole}?`)) return;

    try {
      await api.post(`/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!isAdmin) return <div style={{ padding: '2rem', textAlign: 'center' }}>Access Denied</div>;

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--brand-dark)', marginBottom: '0.4rem' }}>User Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage EcoGreen team accounts and access roles.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <UserPlus size={20} /> Create New User
        </button>
      </header>

      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', background: '#e0e6e454', padding: '1.2rem' }}>
        <Search size={20} color="var(--text-secondary)" />
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--brand-dark)', fontSize: '1.1rem' }}
        />
      </div>

      <div style={{ display: 'grid', gap: '1.2rem' }}>
        {users
          .filter(u => u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(user => (
          <div key={user.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                background: user.role === 'admin' ? 'var(--brand-dark)' : 'rgba(0,71,55,0.05)', 
                borderRadius: '14px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Shield size={24} color={user.role === 'admin' ? 'var(--brand-green)' : 'var(--brand-dark)'} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.2rem', color: 'var(--brand-dark)' }}>{user.full_name}</h4>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} /> {user.id.substring(0, 8)}...</span>
                  <span style={{ 
                    color: user.role === 'admin' ? 'var(--brand-dark)' : 'var(--text-secondary)', 
                    fontWeight: '800',
                    textTransform: 'uppercase'
                  }}>Role: {user.role}</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
               <button className="btn-secondary" style={{ fontSize: '0.85rem', padding: '8px 16px' }} onClick={() => toggleRole(user.id, user.role)}>
                  Change Role
               </button>
               <button className="icon-btn" style={{ color: 'var(--error)' }} onClick={() => {/* Delete logic */}}>
                  <Trash2 size={20} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '95%', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>Register Coworker</h2>
              <button className="icon-btn" onClick={() => setShowAdd(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Full Name</label>
                <input type="text" required value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Email Address</label>
                <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Temporary Password</label>
                <input type="text" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={labelStyle}>User Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={inputStyle}>
                  <option value="user">Standard User (CS Executive)</option>
                  <option value="admin">Administrator (Manager)</option>
                </select>
              </div>
              <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <Loader2 className="spin" size={20} /> : <><UserCog size={20} /> Register Account</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' };

export default UserManagement;
