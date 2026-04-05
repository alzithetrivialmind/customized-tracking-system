import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Plus, Trash2, Users, Search, Building2, Loader2,
  ChevronDown, ChevronUp, Edit3, Save, X, RefreshCw, StickyNote
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────
const BL_TYPE_OPTIONS = ['OBL', 'SWB'];
const YES_NO_OPTIONS  = ['YES', 'NO'];

// ── CustomerForm (modal for create/edit) ─────────────────────────────────────
const CustomerForm = ({ initial, onSave, onClose, tankOptions, onAddTankOption }) => {
  const [form, setForm] = useState({
    name: '',
    bl_type: '',
    combine_bl: '',
    shipping_mark_on_bl: '',
    tank_requirement: '',
    other_requirement: '',
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [newTankValue, setNewTankValue] = useState('');
  const [addingTank, setAddingTank] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTank = () => {
    if (!newTankValue.trim()) return;
    onAddTankOption(newTankValue.trim());
    setForm(f => ({ ...f, tank_requirement: newTankValue.trim() }));
    setNewTankValue('');
    setAddingTank(false);
  };

  const isEdit = !!initial?.id;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '660px', width: '95%', padding: '2.5rem', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--brand-dark)' }}>
            {isEdit ? 'Edit Customer' : 'Register New Customer'}
          </h2>
          <button className="icon-btn" onClick={onClose}><X size={26} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>

          {/* Company Name */}
          <div>
            <label style={lblStyle}>Company Name *</label>
            <input type="text" required value={form.name} onChange={set('name')} placeholder="e.g. CRODA EUROPE (UK)" style={inpStyle} />
          </div>

          <div className="grid-form-2col">
            {/* B/L Type */}
            <div>
              <label style={lblStyle}>B/L Type</label>
              <select value={form.bl_type} onChange={set('bl_type')} style={inpStyle}>
                <option value="">Select...</option>
                {BL_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Combine B/L */}
            <div>
              <label style={lblStyle}>Combine B/L</label>
              <select value={form.combine_bl} onChange={set('combine_bl')} style={inpStyle}>
                <option value="">Select...</option>
                {YES_NO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Shipping Mark on B/L */}
            <div>
              <label style={lblStyle}>Shipping Mark on B/L</label>
              <select value={form.shipping_mark_on_bl} onChange={set('shipping_mark_on_bl')} style={inpStyle}>
                <option value="">Select...</option>
                {YES_NO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Tank Requirement */}
            <div>
              <label style={lblStyle}>Tank Requirement</label>
              {addingTank ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="text" value={newTankValue} onChange={e => setNewTankValue(e.target.value)} placeholder="Enter value..." style={{ ...inpStyle, flex: 1 }} autoFocus />
                  <button type="button" onClick={handleAddTank} className="btn-primary" style={{ padding: '0 12px' }}><Save size={16} /></button>
                  <button type="button" onClick={() => setAddingTank(false)} className="btn-secondary" style={{ padding: '0 10px' }}><X size={16} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select value={form.tank_requirement} onChange={set('tank_requirement')} style={{ ...inpStyle, flex: 1 }}>
                    <option value="">Select...</option>
                    {tankOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <button type="button" onClick={() => setAddingTank(true)} className="btn-secondary" style={{ padding: '0 12px', flexShrink: 0 }} title="Add new option">
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Other Requirement */}
          <div>
            <label style={{ ...lblStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <StickyNote size={13} /> Other Requirement
              <span style={{ fontWeight: '400', textTransform: 'none', color: 'var(--brand-green)' }}>— auto-fills "Notes" when creating SO</span>
            </label>
            <textarea
              value={form.other_requirement}
              onChange={set('other_requirement')}
              placeholder="e.g. SEND INVOICE BY EMAIL, NEED KOSHER CERT..."
              rows={4}
              style={{ ...inpStyle, resize: 'vertical', minHeight: '90px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
              {saving ? <Loader2 size={18} className="spin" /> : isEdit ? <><Save size={18} /> Save Changes</> : <><Plus size={18} /> Register Customer</>}
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

// ── CustomerRow ──────────────────────────────────────────────────────────────
const CustomerRow = ({ c, isAdmin, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const fields = [
    ['B/L Type', c.bl_type],
    ['Combine B/L', c.combine_bl],
    ['Shipping Mark on B/L', c.shipping_mark_on_bl],
    ['Tank Requirement', c.tank_requirement],
    ['Other Requirement', c.other_requirement],
  ];
  const hasData = fields.some(([, v]) => v && v.trim());

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flex: 1, minWidth: 0 }}>
          <div style={{ width: '42px', height: '42px', background: 'rgba(0,71,55,0.07)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={20} color="var(--brand-dark)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--brand-dark)', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</h4>
            <div style={{ display: 'flex', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
              {c.bl_type && <span style={badgeStyle}>{c.bl_type}</span>}
              {c.combine_bl && <span style={{ ...badgeStyle, background: 'rgba(0,130,80,0.08)', color: '#007a50' }}>Combine: {c.combine_bl}</span>}
              {c.tank_requirement && <span style={{ ...badgeStyle, background: 'rgba(180,100,0,0.08)', color: '#a06000' }}>{c.tank_requirement}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '1rem' }}>
          {hasData && (
            <button className="icon-btn" onClick={() => setExpanded(e => !e)} title={expanded ? 'Collapse' : 'View details'}>
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
          {isAdmin && (
            <button className="icon-btn" style={{ color: 'var(--brand-green)' }} onClick={() => onEdit(c)} title="Edit"><Edit3 size={18} /></button>
          )}
          {isAdmin && (
            <button className="icon-btn" style={{ color: 'var(--error)' }} onClick={() => onDelete(c)} title="Remove"><Trash2 size={18} /></button>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-color)', padding: '1rem 1.6rem 1.4rem', background: 'rgba(0,71,55,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <tbody>
              {fields.map(([label, value]) => (
                <tr key={label} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '7px 10px 7px 0', color: 'var(--text-secondary)', fontWeight: '700', width: '210px', whiteSpace: 'nowrap' }}>{label}</td>
                  <td style={{ padding: '7px 0', color: value ? 'var(--text-primary)' : 'var(--text-secondary)', fontStyle: value ? 'normal' : 'italic', whiteSpace: 'pre-wrap' }}>
                    {value || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const CustomerDatabase = () => {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [tankOptions, setTankOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [custs, tanks] = await Promise.all([
        api.get('/customers'),
        api.get('/tank-requirements'),
      ]);
      setCustomers(custs);
      setTankOptions(tanks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form) => {
    await api.post('/customers', form);
    load();
  };

  const handleUpdate = async (form) => {
    await api.put(`/customers/${form.id}`, form);
    load();
  };

  const handleDelete = async (c) => {
    if (!confirm(`Remove "${c.name}" from the customer database?`)) return;
    await api.delete(`/customers/${c.id}`);
    load();
  };

  const handleEdit = (c) => {
    setEditingCustomer(c);
    setShowForm(true);
  };

  const handleSync = async () => {
    if (!confirm('Sync all customers from the master list? This will add missing ones and update existing ones.')) return;
    setLoading(true);
    try {
      await api.post('/customers/sync');
      await load();
      alert('Master list synchronization successful!');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.bl_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.tank_requirement || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--brand-dark)', marginBottom: '0.4rem' }}>Customer Database</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            {customers.length} verified trading partners · B/L Type, Tank Req, and Shipping requirements.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button className="btn-secondary" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} /> Refresh
          </button>
          {isAdmin && (
            <button className="btn-secondary" onClick={handleSync} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--brand-green)', color: 'var(--brand-green)' }}>
              <RefreshCw size={16} /> Sync Master
            </button>
          )}
          {isAdmin && (
            <button className="btn-primary" onClick={() => { setEditingCustomer(null); setShowForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Register Customer
            </button>
          )}
        </div>
      </header>

      {/* Search */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
        <Search size={18} color="var(--text-secondary)" />
        <input
          type="text"
          placeholder="Search by name, B/L type, or tank requirement..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '0.5rem', border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '1rem' }}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <Loader2 size={48} className="spin" color="var(--brand-green)" />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.8rem' }}>
          {filtered.map(c => (
            <CustomerRow
              key={c.id}
              c={c}
              isAdmin={isAdmin}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
          {filtered.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              {searchTerm ? `No customers match "${searchTerm}".` : 'No customers yet. Register one above.'}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <CustomerForm
          initial={editingCustomer}
          onSave={editingCustomer ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditingCustomer(null); }}
          tankOptions={tankOptions}
          onAddTankOption={(val) => setTankOptions(prev => [...new Set([...prev, val])])}
        />
      )}

      <style>{`
        .spin{animation:rotate 1s linear infinite}@keyframes rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
};

const lblStyle  = { display: 'block', marginBottom: '7px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' };
const inpStyle  = { width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' };
const badgeStyle = { fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '8px', background: 'rgba(0,71,55,0.07)', color: 'var(--brand-dark)' };

export default CustomerDatabase;
