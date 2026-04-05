import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Users, Search, Building2, ChevronRight, Loader2 } from 'lucide-react';

const CustomerDatabase = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCust, setNewCust] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) loadCustomers();
  }, [user]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/customers');
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCust) return;
    try {
      await api.post('/customers', { name: newCust });
      setNewCust('');
      loadCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      loadCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  const getRecordCount = (name) => {
    return 0; // Placeholder as records state is missing
  };

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--brand-dark)', marginBottom: '0.4rem' }}>Customer Database</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage your list of verified trading partners and customers.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 2fr', gap: '2.5rem' }}>
        {/* Left: Add New Section */}
        <div className="glass-card" style={{ height: 'fit-content', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <Building2 size={24} color="var(--brand-green)" />
            <h3 style={{ fontSize: '1.2rem' }}>Register Company</h3>
          </div>
          <form onSubmit={handleAdd}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Company Name</label>
              <input 
                type="text" 
                value={newCust}
                onChange={e => setNewCust(e.target.value)}
                placeholder="e.g. EcoGreen Chemicals Ltd."
                style={inputStyle}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={20} /> Add to Verified List
            </button>
          </form>
          
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
             <p>Total Registered: <b>{customers.length}</b></p>
          </div>
        </div>

        {/* Right: List Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#e0e6e454', padding: '1rem' }}>
            <Search size={18} color="var(--text-secondary)" style={{ marginLeft: '8px' }} />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: '0.6rem', border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '1rem' }}
            />
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {customers
              .filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(name => (
              <div key={name} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ width: '45px', height: '45px', background: 'rgba(0,71,55,0.04)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={22} color="var(--brand-dark)" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', color: 'var(--brand-dark)', fontWeight: '700' }}>{name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{getRecordCount(name)} Total SOs Linked</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="icon-btn" style={{ padding: '10px', color: 'var(--error)' }} onClick={() => handleDelete(name)} title="Remove Customer">
                    <Trash2 size={20} />
                  </button>
                  <div style={{ padding: '10px', color: 'rgba(0,0,71,0.1)' }}>
                     <ChevronRight size={22} />
                  </div>
                </div>
              </div>
            ))}
            {customers.length === 0 && (
              <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                No customer data found. Use the form on the left to add one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' };

export default CustomerDatabase;
