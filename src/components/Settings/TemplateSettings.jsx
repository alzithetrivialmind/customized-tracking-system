import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Upload, FileCheck, AlertCircle, FileSearch, Trash, Package, ShieldAlert, BadgeAlert } from 'lucide-react';

const TemplateSettings = () => {
  const { user, isAdmin } = useAuth();
  const [equipTypes, setEquipTypes] = useState(['Container', 'Isotank', 'Flexitank']);
  const [dangerTypes, setDangerTypes] = useState(['DG', 'NON-DG']);
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);

  const templateTypes = [
    { id: 'CON_DG', label: 'Container Dangerous Goods (CON-DG)' },
    { id: 'CON_NON_DG', label: 'Container Non Dangerous Goods (CON-NON-DG)' },
    { id: 'ISO_DG', label: 'Isotank Dangerous Goods (ISO-DG)' },
    { id: 'ISO_NON_DG', label: 'Isotank Non Dangerous Goods (ISO-NON-DG)' }
  ];

  useEffect(() => {
    if (user) loadStatus();
  }, [user]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const status = await api.get('/templates');
      setTemplates(status);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (id, file) => {
    if (!file || !isAdmin) return;
    
    const formData = new FormData();
    formData.append('template', file);

    setLoading(true);
    try {
      const token = localStorage.getItem('ecogreen_token');
      const response = await fetch(`/api/templates/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      
      alert(`${id} master template updated successfully.`);
      loadStatus();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--brand-dark)', marginBottom: '0.4rem' }}>Settings & Repository</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage your master Excel templates and SO categories.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        {templateTypes.map(type => (
          <div key={type.id} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                 <div style={{ padding: '10px', background: 'rgba(0,71,55,0.04)', borderRadius: '10px' }}>
                    <FileSearch size={22} color="var(--brand-dark)" />
                 </div>
                 {templates[type.id] ? 
                    <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '800' }}><FileCheck size={14}/> ACTIVE</span> : 
                    <span style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '800' }}><AlertCircle size={14}/> MISSING</span>
                 }
              </div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-dark)', marginBottom: '0.5rem' }}>{type.label}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Master template for automated report headers.</p>
            </div>
            
            {isAdmin ? (
              <label className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', padding: '1rem' }}>
                <Upload size={18} />
                <span>{templates[type.id] ? 'Replace Master Template' : 'Upload Template File'}</span>
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  hidden 
                  onChange={(e) => handleUpload(type.id, e.target.files[0])} 
                />
              </label>
            ) : (
              <div style={{ padding: '1rem', background: '#f5f7f6', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                <BadgeAlert size={16} /> Only Admins can manage templates
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
             <Package size={22} color="var(--brand-dark)" />
             <h3 style={{ fontSize: '1.2rem' }}>Vehicle & Equipment Types</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {equipTypes.map(t => (
              <span key={t} className="badge" style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'white', border: '1px solid var(--border-color)', color: 'var(--brand-dark)' }}>
                {t}
              </span>
            ))}
          </div>
          <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Standard categorized equipment for EcoGreen logistics.</p>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
             <ShieldAlert size={22} color="var(--brand-dark)" />
             <h3 style={{ fontSize: '1.2rem' }}>Cargo Category / Danger</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {dangerTypes.map(t => (
              <span key={t} className="badge" style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'white', border: '1px solid var(--border-color)', color: 'var(--brand-dark)' }}>
                {t}
              </span>
            ))}
          </div>
          <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hazardous and non-hazardous cargo classification.</p>
        </div>
      </div>
    </div>
  );
};

export default TemplateSettings;
