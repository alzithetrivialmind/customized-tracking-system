import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Plus, Trash2, Truck, Search, Loader2,
  Edit3, Save, X, RefreshCw
} from 'lucide-react';

const LSPForm = ({ initial, onSave, onClose }) => {
  const [name, setName] = useState(initial?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...initial, name: name.trim() });
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!initial?.id;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '95%', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--brand-dark)' }}>
            {isEdit ? 'Edit LSP' : 'Add New Logistic Partner'}
          </h2>
          <button className="icon-btn" onClick={onClose}><X size={26} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={lblStyle}>Partner Name / LSP Name *</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Kuehne + Nagel, DHL, etc." 
              style={inpStyle} 
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
              {saving ? <Loader2 size={18} className="spin" /> : isEdit ? <><Save size={18} /> Save Changes</> : <><Plus size={18} /> Add Partner</>}
            </button>
            <button type="button" className="btn-secondary" style={{ flex: 0.4 }} onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LSPRow = ({ lsp, isAdmin, onEdit, onDelete }) => {
  return (
    <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.6rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
        <div style={{ width: '42px', height: '42px', background: 'rgba(0,71,55,0.07)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Truck size={20} color="var(--brand-dark)" />
        </div>
        <h4 style={{ fontSize: '1.1rem', color: 'var(--brand-dark)', fontWeight: '700' }}>{lsp.name}</h4>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {isAdmin && (
          <button className="icon-btn" style={{ color: 'var(--brand-green)' }} onClick={() => onEdit(lsp)} title="Edit"><Edit3 size={18} /></button>
        )}
        {isAdmin && (
          <button className="icon-btn" style={{ color: 'var(--error)' }} onClick={() => onDelete(lsp)} title="Remove"><Trash2 size={18} /></button>
        )}
      </div>
    </div>
  );
};

const LSPDatabase = () => {
  const { isAdmin } = useAuth();
  const [lsps, setLsps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLsp, setEditingLsp] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/lsps');
      setLsps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form) => {
    await api.post('/lsps', form);
    load();
  };

  const handleUpdate = async (form) => {
    await api.put(`/lsps/${form.id}`, form);
    load();
  };

  const handleDelete = async (lsp) => {
    if (!confirm(`Remove "${lsp.name}" from the logistics partners?`)) return;
    await api.delete(`/lsps/${lsp.id}`);
    load();
  };

  const filtered = lsps.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--brand-dark)', marginBottom: '0.4rem' }}>Logistics Partners (LSP)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Manage {lsps.length} Logistic Services Providers for SI Submissions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button className="btn-secondary" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} /> Refresh
          </button>
          {isAdmin && (
            <button className="btn-primary" onClick={() => { setEditingLsp(null); setShowForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Add Partner
            </button>
          )}
        </div>
      </header>

      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
        <Search size={18} color="var(--text-secondary)" />
        <input
          type="text"
          placeholder="Search partners by name..."
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

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <Loader2 size={48} className="spin" color="var(--brand-green)" />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.8rem' }}>
          {filtered.map(lsp => (
            <LSPRow
              key={lsp.id}
              lsp={lsp}
              isAdmin={isAdmin}
              onEdit={(l) => { setEditingLsp(l); setShowForm(true); }}
              onDelete={handleDelete}
            />
          ))}
          {filtered.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              {searchTerm ? `No partners match "${searchTerm}".` : 'No logistics partners yet. Add one above.'}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <LSPForm
          initial={editingLsp}
          onSave={editingLsp ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditingLsp(null); }}
        />
      )}

      <style>{`
        .spin{animation:rotate 1s linear infinite}@keyframes rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,40,31,.55);display:flex;align-items:center;justify-content:center;z-index:1001;backdrop-filter:blur(8px)}
        .modal-content{animation:scaleIn .3s cubic-bezier(.165,.84,.44,1)}
        @keyframes scaleIn{from{transform:scale(.93);opacity:0}to{transform:scale(1);opacity:1}}
      `}</style>
    </div>
  );
};

const lblStyle = { display: 'block', marginBottom: '7px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' };
const inpStyle = { width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontSize: '1rem' };

export default LSPDatabase;
