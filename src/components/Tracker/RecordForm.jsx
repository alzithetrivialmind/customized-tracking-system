import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { X, Calendar, Plus, Save, Package, ShieldAlert, UserPlus, Loader2 } from 'lucide-react';

const EQUIP_TYPES = ['Container', 'Isotank', 'Flexitank'];
const DANGER_TYPES = ['DG', 'NON-DG'];

const RecordForm = ({ onClose }) => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    so_number: '',
    customer_name: '',
    equipment_type: EQUIP_TYPES[0],
    dangerous_type: DANGER_TYPES[0],
    etd: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const custs = await api.get('/customers');
      setCustomers(custs); // [{id, name}]
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.so_number || !formData.customer_name || !formData.etd) {
      alert('Please fill all required fields (*)');
      return;
    }
    setLoading(true);
    try {
      await api.post('/records', formData);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addCustomerQuick = async () => {
    const name = prompt('Enter new customer name:');
    if (!name || !name.trim()) return;
    try {
      await api.post('/customers', { name: name.trim() });
      await loadCustomers();
      setFormData(f => ({ ...f, customer_name: name.trim() }));
    } catch (err) {
      alert(err.message);
    }
  };

  const set = (field) => (e) => setFormData(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '95%', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--brand-dark)' }}>Create New SO Tracker</h2>
          <button className="icon-btn" onClick={onClose}><X size={28} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.8rem' }}>
          {/* SO Number */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>SO Number (Sales Order) *</label>
            <input
              type="text"
              required
              value={formData.so_number}
              onChange={set('so_number')}
              placeholder="e.g. SO-2024-001"
              style={inputStyle}
            />
          </div>

          {/* Customer */}
          <div>
            <label style={labelStyle}>Customer Name *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                required
                value={formData.customer_name}
                onChange={set('customer_name')}
                style={inputStyle}
              >
                <option value="">Select Customer...</option>
                {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <button type="button" className="btn-secondary" style={{ padding: '0 14px', flexShrink: 0 }} onClick={addCustomerQuick} title="Add new customer">
                <UserPlus size={18} />
              </button>
            </div>
          </div>

          {/* ETD */}
          <div>
            <label style={labelStyle}>ETD Shipment Date *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                required
                value={formData.etd}
                onChange={set('etd')}
                style={{ ...inputStyle, paddingLeft: '42px' }}
              />
              <Calendar size={18} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          {/* Equipment Type */}
          <div>
            <label style={labelStyle}>Equipment Type</label>
            <select value={formData.equipment_type} onChange={set('equipment_type')} style={inputStyle}>
              {EQUIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Dangerous Type */}
          <div>
            <label style={labelStyle}>Cargo Category</label>
            <select value={formData.dangerous_type} onChange={set('dangerous_type')} style={inputStyle}>
              {DANGER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Submit */}
          <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', display: 'flex', gap: '15px' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '1.2rem', justifyContent: 'center' }}>
              {loading ? <Loader2 size={20} className="spin" /> : <><Save size={20} /> Create Tracking Record</>}
            </button>
            <button type="button" className="btn-secondary" style={{ flex: 0.4 }} onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,40,31,0.55); display: flex; align-items: center; justify-content: center; z-index: 1001; backdrop-filter: blur(8px); }
        .modal-content { animation: scaleIn 0.3s cubic-bezier(0.165, 0.84, 0.44, 1); }
        @keyframes scaleIn { from { transform: scale(0.93); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' };

export default RecordForm;
