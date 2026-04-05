import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Plus, Trash2, Upload, FileCheck, AlertCircle, Package,
  ShieldAlert, FileSpreadsheet, Loader2, RefreshCw, ChevronRight
} from 'lucide-react';

const TemplateSettings = () => {
  const { isAdmin } = useAuth();

  const [equipTypes, setEquipTypes] = useState([]);
  const [cargoCategories, setCargoCategories] = useState([]);
  const [templateConfigs, setTemplateConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newEquip, setNewEquip] = useState('');
  const [newCargo, setNewCargo] = useState('');
  const [uploadingFor, setUploadingFor] = useState(null); // {equip, cargo}
  const [addingEquip, setAddingEquip] = useState(false);
  const [addingCargo, setAddingCargo] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eq, ca, tc] = await Promise.all([
        api.get('/equipment-types'),
        api.get('/cargo-categories'),
        api.get('/template-configs'),
      ]);
      setEquipTypes(eq);
      setCargoCategories(ca);
      setTemplateConfigs(tc);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Equipment Types ──────────────────────────────────────────────────────────
  const addEquip = async (e) => {
    e.preventDefault();
    if (!newEquip.trim()) return;
    setAddingEquip(true);
    try {
      await api.post('/equipment-types', { name: newEquip.trim() });
      setNewEquip('');
      load();
    } catch (err) { alert(err.message); }
    finally { setAddingEquip(false); }
  };
  const deleteEquip = async (id, name) => {
    if (!confirm(`Remove equipment type "${name}"? This will not affect existing SO records.`)) return;
    await api.delete(`/equipment-types/${id}`);
    load();
  };

  // ── Cargo Categories ─────────────────────────────────────────────────────────
  const addCargo = async (e) => {
    e.preventDefault();
    if (!newCargo.trim()) return;
    setAddingCargo(true);
    try {
      await api.post('/cargo-categories', { name: newCargo.trim() });
      setNewCargo('');
      load();
    } catch (err) { alert(err.message); }
    finally { setAddingCargo(false); }
  };
  const deleteCargo = async (id, name) => {
    if (!confirm(`Remove cargo category "${name}"? This will not affect existing SO records.`)) return;
    await api.delete(`/cargo-categories/${id}`);
    load();
  };

  // ── Template Configs ─────────────────────────────────────────────────────────
  const getConfig = (equip, cargo) =>
    templateConfigs.find(t => t.equipment_type === equip && t.cargo_category === cargo);

  const handleTemplateUpload = async (equip, cargo, file) => {
    if (!file) return;
    setUploadingFor(`${equip}__${cargo}`);
    try {
      const token = localStorage.getItem('ecogreen_token');
      const formData = new FormData();
      formData.append('template', file);
      formData.append('equipment_type', equip);
      formData.append('cargo_category', cargo);

      const resp = await fetch('/api/template-configs', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Upload failed');
      }
      load();
    } catch (err) { alert(err.message); }
    finally { setUploadingFor(null); }
  };

  const deleteConfig = async (id) => {
    if (!confirm('Remove this template configuration?')) return;
    await api.delete(`/template-configs/${id}`);
    load();
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Loader2 size={48} className="spin" color="var(--brand-green)" />
      <style>{`.spin{animation:rotate 1s linear infinite}@keyframes rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--brand-dark)', marginBottom: '0.4rem' }}>Settings & Repository</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage equipment types, danger types, and Excel templates.</p>
        </div>
        <button className="btn-secondary" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {/* ── SECTION 1: Equipment Types ── */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <Package size={22} color="var(--brand-dark)" />
          <h2 style={{ fontSize: '1.4rem', color: 'var(--brand-dark)' }}>Equipment Types</h2>
        </div>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '1.5rem' }}>
            {equipTypes.map(t => (
              <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px 14px', fontSize: '0.9rem', fontWeight: '700', color: 'var(--brand-dark)' }}>
                {t.name}
                {isAdmin && (
                  <button onClick={() => deleteEquip(t.id, t.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '0', display: 'flex', lineHeight: 1 }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </span>
            ))}
          </div>
          {isAdmin && (
            <form onSubmit={addEquip} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text" value={newEquip} onChange={e => setNewEquip(e.target.value)}
                placeholder="Add new equipment type (e.g. Flexitank)"
                style={inputStyle} required
              />
              <button type="submit" className="btn-primary" style={{ padding: '0 20px', flexShrink: 0 }} disabled={addingEquip}>
                {addingEquip ? <Loader2 size={18} className="spin" /> : <Plus size={18} />}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── SECTION 2: Cargo Categories ── */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <ShieldAlert size={22} color="var(--brand-dark)" />
          <h2 style={{ fontSize: '1.4rem', color: 'var(--brand-dark)' }}>Danger Type</h2>
        </div>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '1.5rem' }}>
            {cargoCategories.map(t => (
              <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px 14px', fontSize: '0.9rem', fontWeight: '700', color: 'var(--brand-dark)' }}>
                {t.name}
                {isAdmin && (
                  <button onClick={() => deleteCargo(t.id, t.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '0', display: 'flex', lineHeight: 1 }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </span>
            ))}
          </div>
          {isAdmin && (
            <form onSubmit={addCargo} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text" value={newCargo} onChange={e => setNewCargo(e.target.value)}
                placeholder="Add new danger type (e.g. Hazmat)"
                style={inputStyle} required
              />
              <button type="submit" className="btn-primary" style={{ padding: '0 20px', flexShrink: 0 }} disabled={addingCargo}>
                {addingCargo ? <Loader2 size={18} className="spin" /> : <Plus size={18} />}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── SECTION 3: Template Configurations Matrix ── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
          <FileSpreadsheet size={22} color="var(--brand-dark)" />
          <h2 style={{ fontSize: '1.4rem', color: 'var(--brand-dark)' }}>Template Configurations</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', paddingLeft: '34px' }}>
          Each combination of Equipment × Danger Type can have its own Excel master template.
          When generating a report, the system will auto-select the matching template.
        </p>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {equipTypes.map(equip => (
            cargoCategories.map(cargo => {
              const config = getConfig(equip.name, cargo.name);
              const uploading = uploadingFor === `${equip.name}__${cargo.name}`;
              const key = `${equip.name}__${cargo.name}`;

              return (
                <div key={key} className="glass-card" style={{
                  padding: '1.5rem 2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  borderLeft: `5px solid ${config?.file_exists ? 'var(--success)' : 'var(--border-color)'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <FileSpreadsheet size={28} color={config?.file_exists ? 'var(--success)' : 'var(--text-secondary)'} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--brand-dark)' }}>{equip.name}</span>
                        <ChevronRight size={16} color="var(--text-secondary)" />
                        <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--brand-dark)' }}>{cargo.name}</span>
                      </div>
                      {config?.file_exists ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FileCheck size={13} /> {config.template_filename}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={13} /> No template — will generate from scratch
                        </span>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                      <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                        {uploading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                        {config ? 'Replace' : 'Upload'} Template
                        <input
                          type="file" accept=".xlsx,.xls" hidden
                          onChange={e => handleTemplateUpload(equip.name, cargo.name, e.target.files[0])}
                          disabled={uploading}
                        />
                      </label>
                      {config && (
                        <button className="btn-secondary" style={{ padding: '0.6rem', color: 'var(--error)' }} onClick={() => deleteConfig(config.id)} title="Remove config">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>

        {equipTypes.length === 0 || cargoCategories.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Add equipment types and danger types above to configure templates.
          </div>
        ) : null}
      </section>

      <style>{`.spin{animation:rotate 1s linear infinite}@keyframes rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

const inputStyle = { flex: 1, padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' };

export default TemplateSettings;
