import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Users, Search, Building2, Loader2 } from 'lucide-react';

const CustomerDatabase = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]); // [{id, name, created_at}]
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) loadCustomers();
  }, [user]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/customers');
      setCustomers(data); // data is [{id, name, ...}]
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await api.post('/customers', { name: newName.trim() });
      setNewName('');
      loadCustomers();
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove "${name}" from the customer list?`)) return;
    try {
      await api.delete(`/customers/${id}`);
      loadCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--brand-dark)', marginBottom: '0.4rem' }}>Customer Database</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage your list of verified trading partners and customers.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: '2.5rem' }}>
        {/* Left: Add New */}
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
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. EcoGreen Chemicals Ltd."
                style={inputStyle}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={adding}>
              {adding ? <Loader2 size={18} className="spin" /> : <><Plus size={20} /> Add to Verified List</>}
            </button>
          </form>
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <p>Total Registered: <b>{customers.length}</b></p>
          </div>
        </div>

        {/* Right: List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#e0e6e454', padding: '1rem' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: '0.5rem', border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '1rem' }}
            />
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <Loader2 size={40} className="spin" color="var(--brand-green)" />
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filtered.map(c => (
                <div key={c.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: '45px', height: '45px', background: 'rgba(0,71,55,0.06)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={22} color="var(--brand-dark)" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', color: 'var(--brand-dark)', fontWeight: '700' }}>{c.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        Added {new Date(c.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button
                    className="icon-btn"
                    style={{ padding: '10px', color: 'var(--error)' }}
                    onClick={() => handleDelete(c.id, c.name)}
                    title="Remove Customer"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                  {searchTerm ? `No customers match "${searchTerm}".` : 'No customers yet. Add one using the form.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' };

export default CustomerDatabase;
