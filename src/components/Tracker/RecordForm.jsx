import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { X, Calendar, Plus, Save, Package, ShieldAlert, UserPlus, Loader2 } from 'lucide-react';

const RecordForm = ({ onClose }) => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [equipTypes, setEquipTypes] = useState(['Container', 'Isotank', 'Flexitank']);
  const [dangerTypes, setDangerTypes] = useState(['DG', 'NON-DG']);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    so_number: '',
    customer_name: '',
    equipment_type: '',
    dangerous_type: '',
    etd: '',
  });

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const custs = await api.get('/customers');
      setCustomers(custs.map(c => c.name));
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

  const addCustomer = async () => {
    const name = prompt('New Customer Name:');
    if (!name) return;

    try {
      await api.post('/customers', { name });
      loadMetadata();
      setFormData({ ...formData, customer_name: name });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '95%', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--brand-dark)' }}>Create New SO Tracker</h2>
          <button className="icon-btn" onClick={onClose}><X size={28} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.8rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>SO Number (Sales Order) *</label>
            <input 
              type="text" 
              required
              value={formData.soNumber}
              onChange={e => setFormData({ ...formData, soNumber: e.target.value })}
              placeholder="e.g. SO-2024-001"
              style={inputStyle}
            />
          </div>

          <div>
             <label style={labelStyle}>Customer Name *</label>
             <div style={{ display: 'flex', gap: '8px' }}>
                <select value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} style={inputStyle}>
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button type="button" className="btn-secondary" style={{ padding: '0 12px' }} onClick={() => {
                  const name = prompt('New Customer Name:');
                  if (name) { setNewCust(name); }
                }}><UserPlus size={18} /></button>
             </div>
             {newCust && <button type="button" onClick={() => addItem('customer')} style={addLinkStyle}>Save "{newCust}" to database</button>}
          </div>

          <div>
            <label style={labelStyle}>ETD Shipment Date *</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="date" 
                required
                value={formData.etd}
                onChange={e => setFormData({ ...formData, etd: e.target.value })}
                style={{ ...inputStyle, paddingLeft: '40px' }}
              />
              <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Equipment Type</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={formData.equipmentType} onChange={e => setFormData({ ...formData, equipmentType: e.target.value })} style={inputStyle}>
                <option value="">Select Type</option>
                {equipTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button type="button" className="btn-secondary" style={{ padding: '0 12px' }} onClick={() => {
                const name = prompt('New Equipment Type:');
                if (name) { setNewEquip(name); }
              }}><Package size={18} /></button>
            </div>
            {newEquip && <button type="button" onClick={() => addItem('equip')} style={addLinkStyle}>Save "{newEquip}" to database</button>}
          </div>

          <div>
            <label style={labelStyle}>Cargo Category</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={formData.dangerousType} onChange={e => setFormData({ ...formData, dangerousType: e.target.value })} style={inputStyle}>
                <option value="">Select Category</option>
                {dangerTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button type="button" className="btn-secondary" style={{ padding: '0 12px' }} onClick={() => {
                const name = prompt('New Danger Category:');
                if (name) { setNewDanger(name); }
              }}><ShieldAlert size={18} /></button>
            </div>
            {newDanger && <button type="button" onClick={() => addItem('danger')} style={addLinkStyle}>Save "{newDanger}" to database</button>}
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '1.5rem', display: 'flex', gap: '15px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, padding: '1.2rem', justifyContent: 'center' }}>
              <Save size={20} /> Create Tracking Record
            </button>
            <button type="button" className="btn-secondary" style={{ flex: 0.5 }} onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
      
      <style jsx>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,40,31,0.5); display: flex; align-items: center; justify-content: center; z-index: 1001; backdrop-filter: blur(8px); }
        .modal-content { animation: scaleIn 0.3s cubic-bezier(0.165, 0.84, 0.44, 1); }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' };
const addLinkStyle = { background: 'transparent', border: 'none', color: 'var(--brand-green)', fontSize: '0.75rem', marginTop: '6px', cursor: 'pointer', textAlign: 'left', fontWeight: '800' };

export default RecordForm;
