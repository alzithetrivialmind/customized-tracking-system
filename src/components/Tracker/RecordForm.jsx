import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { X, Calendar, Save, UserPlus, Loader2, FileSpreadsheet, CheckCircle, AlertCircle, StickyNote } from 'lucide-react';

const RecordForm = ({ onClose }) => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [equipTypes, setEquipTypes] = useState([]);
  const [cargoCategories, setCargoCategories] = useState([]);
  const [templateConfigs, setTemplateConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);

  const [formData, setFormData] = useState({
    so_number: '',
    customer_name: '',
    equipment_type: '',
    dangerous_type: '',
    etd: '',
    notes: '',
  });

  // Auto-selected template config based on equipment + cargo selection
  const [selectedTemplateConfig, setSelectedTemplateConfig] = useState(null);
  const [templateOverride, setTemplateOverride] = useState(''); // user can manually override

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    if (!formData.equipment_type || !formData.dangerous_type) {
      setSelectedTemplateConfig(null);
      setTemplateOverride('');
      return;
    }
    const match = templateConfigs.find(
      t => t.equipment_type === formData.equipment_type && t.cargo_category === formData.dangerous_type
    );
    setSelectedTemplateConfig(match || null);
    setTemplateOverride(match ? match.id : '');
  }, [formData.equipment_type, formData.dangerous_type, templateConfigs]);

  // Auto-fill Notes from customer's other_requirement when customer changes
  useEffect(() => {
    if (!formData.customer_name) return;
    const customer = customers.find(c => c.name === formData.customer_name);
    if (customer && customer.other_requirement) {
      setFormData(f => ({
        ...f,
        notes: f.notes && f.notes !== (customers.find(c => c.name !== formData.customer_name)?.other_requirement || '')
          ? f.notes  // user already typed something different, keep it
          : customer.other_requirement
      }));
    }
  }, [formData.customer_name, customers]);

  const loadMetadata = async () => {
    setMetaLoading(true);
    try {
      const [custs, equip, cargo, configs] = await Promise.all([
        api.get('/customers'),
        api.get('/equipment-types'),
        api.get('/cargo-categories'),
        api.get('/template-configs'),
      ]);
      setCustomers(custs);
      setEquipTypes(equip);
      setCargoCategories(cargo);
      setTemplateConfigs(configs);
      // Set defaults
      if (equip.length > 0) setFormData(f => ({ ...f, equipment_type: equip[0].name }));
      if (cargo.length > 0) setFormData(f => ({ ...f, dangerous_type: cargo[0].name }));
    } catch (err) {
      console.error(err);
    } finally {
      setMetaLoading(false);
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
      await api.post('/records', {
        ...formData,
        template_config_id: templateOverride || null,
      });
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
      const custs = await api.get('/customers');
      setCustomers(custs);
      setFormData(f => ({ ...f, customer_name: name.trim() }));
    } catch (err) {
      alert(err.message);
    }
  };

  const set = (field) => (e) => setFormData(f => ({ ...f, [field]: e.target.value }));

  // Find what template would be used if user overrides
  const effectiveTemplate = templateOverride
    ? templateConfigs.find(t => t.id === templateOverride)
    : selectedTemplateConfig;

  if (metaLoading) return (
    <div className="modal-overlay">
      <div className="modal-content glass-card" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <Loader2 size={40} className="spin" color="var(--brand-green)" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading configuration...</p>
      </div>
      <style>{`
        .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,40,31,.55);display:flex;align-items:center;justify-content:center;z-index:1001;backdrop-filter:blur(8px)}
        .spin{animation:rotate 1s linear infinite}@keyframes rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px', width: '95%', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--brand-dark)' }}>Create New SO Tracker</h2>
          <button className="icon-btn" onClick={onClose}><X size={28} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* SO Number */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>SO Number (Sales Order) *</label>
            <input type="text" required value={formData.so_number} onChange={set('so_number')} placeholder="e.g. SO-2024-001" style={inputStyle} />
          </div>

          {/* Customer */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Customer Name *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select required value={formData.customer_name} onChange={set('customer_name')} style={inputStyle}>
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
              <input type="date" required value={formData.etd} onChange={set('etd')} style={{ ...inputStyle, paddingLeft: '42px' }} />
              <Calendar size={18} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          {/* Equipment Type */}
          <div>
            <label style={labelStyle}>Equipment Type</label>
            <select value={formData.equipment_type} onChange={set('equipment_type')} style={inputStyle}>
              {equipTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>

          {/* Cargo Category */}
          <div>
            <label style={labelStyle}>Cargo Category</label>
            <select value={formData.dangerous_type} onChange={set('dangerous_type')} style={inputStyle}>
              {cargoCategories.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>

          {/* Template Selection */}
          <div style={{ gridColumn: '1/-1', background: effectiveTemplate?.file_exists ? 'rgba(0,150,100,0.06)' : 'rgba(0,0,0,0.03)', borderRadius: '14px', padding: '1.2rem 1.5rem', border: `1px solid ${effectiveTemplate?.file_exists ? 'rgba(0,150,100,0.2)' : 'var(--border-color)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={18} color={effectiveTemplate?.file_exists ? 'var(--success)' : 'var(--text-secondary)'} />
                <label style={{ ...labelStyle, margin: 0 }}>Excel Template</label>
              </div>
              {effectiveTemplate?.file_exists
                ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--success)' }}><CheckCircle size={13} /> Template Ready</span>
                : <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}><AlertCircle size={13} /> No template — will generate basic report</span>
              }
            </div>
            <select
              value={templateOverride}
              onChange={e => setTemplateOverride(e.target.value)}
              style={{ ...inputStyle, fontSize: '0.9rem' }}
            >
              <option value="">
                {selectedTemplateConfig
                  ? `Auto: ${selectedTemplateConfig.template_filename}`
                  : 'Auto (no matching template found)'}
              </option>
              {templateConfigs.filter(t => t.file_exists).map(t => (
                <option key={t.id} value={t.id}>
                  {t.equipment_type} – {t.cargo_category} → {t.template_filename}
                </option>
              ))}
              <option value="">No template (generate from scratch)</option>
            </select>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Auto-selected based on Equipment & Cargo selection. You can override manually.
            </p>
          </div>

          {/* Notes */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <StickyNote size={14} /> Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={set('notes')}
              placeholder="Additional notes for this shipment..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          {/* Submit */}
          <div style={{ gridColumn: '1/-1', marginTop: '0.5rem', display: 'flex', gap: '15px' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '1.2rem', justifyContent: 'center' }}>
              {loading ? <Loader2 size={20} className="spin" /> : <><Save size={20} /> Create Tracking Record</>}
            </button>
            <button type="button" className="btn-secondary" style={{ flex: 0.4 }} onClick={onClose}>Cancel</button>
          </div>

        </form>
      </div>

      <style>{`
        .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,40,31,.55);display:flex;align-items:center;justify-content:center;z-index:1001;backdrop-filter:blur(8px)}
        .modal-content{animation:scaleIn .3s cubic-bezier(.165,.84,.44,1)}
        @keyframes scaleIn{from{transform:scale(.93);opacity:0}to{transform:scale(1);opacity:1}}
        .spin{animation:rotate 1s linear infinite}@keyframes rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', padding: '13px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' };

export default RecordForm;
