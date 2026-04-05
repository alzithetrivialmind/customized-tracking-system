import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, Download, ChevronRight, CheckCircle, Search, Filter, 
  Edit3, Paperclip, X, Save, AlertTriangle, History, Loader2 
} from 'lucide-react';
import RecordForm from './RecordForm';

const RecordsList = ({ status }) => {
  const { user, isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editData, setEditData] = useState({});
  const [editMeta, setEditMeta] = useState({ comment: '', attachment: null });
  const [isExporting, setIsExporting] = useState(null);

  useEffect(() => {
    if (user) loadData();
  }, [status, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const recs = await api.get(`/records?status=${status}`);
      setRecords(recs);

      const custs = await api.get('/customers');
      setCustomers(custs.map(c => c.name));
    } catch (err) {
      console.error('Fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (record) => {
    setIsExporting(record.id);
    try {
      const data = await api.post('/generate-excel', { 
        so_number: record.so_number || record.soNumber, // Handle both snake/camel
        customer_name: record.customer_name || record.customerName,
        etd: record.etd,
        equipment_type: record.equipment_type || record.equipmentType,
        dangerous_type: record.dangerous_type || record.dangerousType
      });
      
      window.open(data.downloadUrl, '_blank');
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(null);
    }
  };

  const markAsDone = async (record) => {
    if (!confirm('Mark this SO as Completed?')) return;
    try {
      await api.post(`/records/${record.id}/status`, { status: 'done', comment: 'Shipment process finished' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const saveEdit = async () => {
    if (!editMeta.comment) {
      alert('A reason for change (comment) is mandatory.');
      return;
    }
    
    setLoading(true);
    try {
      await api.put(`/records/${editingRecord.id}`, { ...editData, comment: editMeta.comment });
      setEditingRecord(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 2 * 1024 * 1024) {
      alert('File size must be under 2MB.');
      return;
    }
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditMeta({ ...editMeta, attachment: { name: file.name, type: file.type, data: reader.result } });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>{status === 'done' ? 'Completed' : 'Ongoing'} Deliveries</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Tracking activity and SO status with EcoGreen branding.</p>
        </div>
        {status === 'ongoing' && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={20} /> New Shipment
          </button>
        )}
      </div>

      <div className="glass-card" style={{ marginBottom: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'center', background: '#e0e6e454' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search SO Number or Customer Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
        {records
          .filter(r => r.soNumber.includes(searchTerm) || r.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(record => (
          <div key={record.id} className="glass-card" style={{ 
            padding: '1.8rem', 
            borderTop: `5px solid ${calculatePriority(record) === PRIORITY_LEVELS.HIGH ? 'var(--error)' : calculatePriority(record) === PRIORITY_LEVELS.MEDIUM ? 'var(--warning)' : 'var(--success)'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <span className={`badge ${getPriorityClass(calculatePriority(record))}`} style={{ marginBottom: '10px', display: 'inline-block' }}>
                  {calculatePriority(record)} {record.manualPriority && '(Manual)'}
                </span>
                <h3 style={{ fontSize: '1.3rem', color: 'var(--brand-dark)' }}>{record.soNumber} <span style={{ fontWeight: '400', color: 'var(--text-secondary)' }}>/</span> {record.customerName}</h3>
              </div>
              <button className="icon-btn" onClick={() => handleExport(record)} title="Export to Excel">
                <Download size={22} color="var(--brand-dark)" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem', marginBottom: '2rem', padding: '1.2rem', background: '#f8fbf9', borderRadius: '14px', border: '1px solid rgba(0,71,55,0.05)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Equipment</span>
                <p style={{ fontWeight: '700', marginTop: '4px', fontSize: '1rem', color: 'var(--brand-dark)' }}>{record.equipmentType} <span style={{ fontWeight: '400', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>({record.dangerousType})</span></p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>ETD Shipment</span>
                <p style={{ fontWeight: '700', marginTop: '4px', fontSize: '1rem', color: 'var(--brand-dark)' }}>{record.etd}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" style={{ flex: 1, padding: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => setSelectedRecord(record)}>
                <History size={18} /> Logs
              </button>
              {status === 'ongoing' && (
                <>
                  <button className="btn-secondary" style={{ padding: '0.7rem' }} onClick={() => handleEditInit(record)}>
                    <Edit3 size={20} />
                  </button>
                  <button className="btn-primary" style={{ flex: 1.2, padding: '0.7rem' }} onClick={() => markAsDone(record)}>
                    Set Completed
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        
        {records.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem', color: 'var(--text-secondary)' }}>
            <AlertTriangle size={56} style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
            <p style={{ fontSize: '1.1rem' }}>No {status} shipments currently recorded.</p>
          </div>
        )}
      </div>

      {showForm && <RecordForm onClose={() => { setShowForm(false); loadData(); }} />}
      
      {/* Activity Log Modal */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--brand-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>Activity Feed — {selectedRecord.soNumber}</h2>
              <button className="icon-btn" onClick={() => setSelectedRecord(null)}><X size={24} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '20px' }}>
               {selectedRecord.logs.map(log => (
                 <div key={log.id} style={{ padding: '1.5rem', borderLeft: '5px solid var(--brand-green)', marginBottom: '1.5rem', background: '#f9fbf9', borderRadius: '0 16px 16px 0', border: '1px solid rgba(0,71,55,0.05)', borderLeft: '6px solid var(--brand-green)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '800', color: 'var(--brand-dark)', fontSize: '0.9rem' }}>{log.action}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1rem' }}>{log.details}</p>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(0,71,55,0.05)' }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Reason: "{log.comment}"</p>
                    </div>
                    {log.attachment && (
                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--brand-dark)', fontWeight: '600' }}>
                        <Paperclip size={16} /> Attachment: {log.attachment.name}
                      </div>
                    )}
                 </div>
               ))}
            </div>
            <button className="btn-secondary" style={{ marginTop: '2rem', width: '100%', padding: '1rem' }} onClick={() => setSelectedRecord(null)}>Close Activity</button>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingRecord && (
        <div className="modal-overlay" onClick={() => setEditingRecord(null)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>Edit Shipment Detail</h2>
              <button className="icon-btn" onClick={() => setEditingRecord(null)}><X size={26} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>SO Number</label>
                <input type="text" value={editData.soNumber} onChange={e => setEditData({...editData, soNumber: e.target.value})} style={inputStyle} />
              </div>
              
              <div>
                <label style={labelStyle}>Customer Name</label>
                <select value={editData.customerName} onChange={e => setEditData({...editData, customerName: e.target.value})} style={inputStyle}>
                  {customers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>ETD Date</label>
                <input type="date" value={editData.etd} onChange={e => setEditData({...editData, etd: e.target.value})} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Equipment Type</label>
                <select value={editData.equipmentType} onChange={e => setEditData({...editData, equipmentType: e.target.value})} style={inputStyle}>
                  {equipTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Cargo Category</label>
                <select value={editData.dangerousType} onChange={e => setEditData({...editData, dangerousType: e.target.value})} style={inputStyle}>
                  {dangerTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Priority Setting</label>
                <select 
                  value={editData.manualPriority || ''} 
                  onChange={e => setEditData({...editData, manualPriority: e.target.value || null})} 
                  style={{ ...inputStyle, borderLeft: editData.manualPriority ? '6px solid var(--brand-green)' : '1px solid var(--border-color)' }}
                >
                  <option value="">Automatic (Date Based)</option>
                  <option value={PRIORITY_LEVELS.HIGH}>High Priority (Manual Override)</option>
                  <option value={PRIORITY_LEVELS.MEDIUM}>Medium Priority (Manual Override)</option>
                  <option value={PRIORITY_LEVELS.NORMAL}>Normal Priority (Manual Override)</option>
                </select>
              </div>

              <div style={{ gridColumn: '1/-1', borderTop: '2px solid #f0f4f3', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <label style={{ ...labelStyle, color: 'var(--brand-dark)', fontWeight: '900' }}>Reason for Modification (Mandatory Archive) *</label>
                <textarea 
                  required
                  placeholder="Please state exactly why this record is being updated..."
                  value={editMeta.comment}
                  onChange={e => setEditMeta({ ...editMeta, comment: e.target.value })}
                  style={{ ...inputStyle, height: '100px', marginTop: '10px' }}
                />
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Attachment Proof (Max 2MB)</label>
                <label className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', padding: '1rem' }}>
                  <Paperclip size={20} />
                  <span>{editMeta.attachment ? editMeta.attachment.name : 'Upload New Supporting Document'}</span>
                  <input type="file" hidden onChange={handleFileChange} />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button className="btn-primary" style={{ flex: 1.5, padding: '1rem' }} onClick={saveEdit}><Save size={20} /> Submit Update & Archive Log</button>
              <button className="btn-secondary" style={{ flex: 0.5, padding: '1rem' }} onClick={() => setEditingRecord(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,40,31,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(8px); }
        .modal-content { animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' };

export default RecordsList;
