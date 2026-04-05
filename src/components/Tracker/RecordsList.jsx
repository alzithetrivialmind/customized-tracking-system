import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { calculatePriority, getPriorityClass, PRIORITY_LEVELS } from '../../logic/priority';
import { 
  Plus, Download, CheckCircle, Search,
  Edit3, Paperclip, X, Save, AlertTriangle, History, Loader2 
} from 'lucide-react';
import RecordForm from './RecordForm';

const EQUIP_TYPES = ['Container', 'Isotank', 'Flexitank'];
const DANGER_TYPES = ['DG', 'NON-DG'];

const RecordsList = ({ status }) => {
  const { user, isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
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

  const openLogs = async (record) => {
    setSelectedRecord(record);
    setSelectedLogs([]);
    setLogsLoading(true);
    try {
      const logs = await api.get(`/records/${record.id}/logs`);
      setSelectedLogs(logs);
    } catch (err) {
      console.error('Failed to fetch logs:', err.message);
    } finally {
      setLogsLoading(false);
    }
  };

  // SQLite returns snake_case — helper to normalise
  const getField = (record, camel, snake) => record[camel] ?? record[snake] ?? '';

  const handleExport = async (record) => {
    setIsExporting(record.id);
    try {
      const data = await api.post('/generate-excel', {
        so_number: getField(record, 'soNumber', 'so_number'),
        customer_name: getField(record, 'customerName', 'customer_name'),
        etd: record.etd,
        equipment_type: getField(record, 'equipmentType', 'equipment_type'),
        dangerous_type: getField(record, 'dangerousType', 'dangerous_type'),
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

  const handleEditInit = (record) => {
    setEditingRecord(record);
    setEditData({
      soNumber: getField(record, 'soNumber', 'so_number'),
      customerName: getField(record, 'customerName', 'customer_name'),
      etd: record.etd,
      equipmentType: getField(record, 'equipmentType', 'equipment_type'),
      dangerousType: getField(record, 'dangerousType', 'dangerous_type'),
      manualPriority: getField(record, 'manualPriority', 'manual_priority') || '',
    });
    setEditMeta({ comment: '', attachment: null });
  };

  const saveEdit = async () => {
    if (!editMeta.comment) {
      alert('A reason for change (comment) is mandatory.');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/records/${editingRecord.id}`, {
        so_number: editData.soNumber,
        customer_name: editData.customerName,
        etd: editData.etd,
        equipment_type: editData.equipmentType,
        dangerous_type: editData.dangerousType,
        manual_priority: editData.manualPriority || null,
        comment: editMeta.comment,
      });
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

  const filteredRecords = records.filter(r => {
    const soNum = getField(r, 'soNumber', 'so_number').toLowerCase();
    const custName = getField(r, 'customerName', 'customer_name').toLowerCase();
    const term = searchTerm.toLowerCase();
    return soNum.includes(term) || custName.includes(term);
  });

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Loader2 className="spin" size={48} color="var(--brand-green)" />
      <style>{`.spin { animation: rotate 1s linear infinite; } @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>{status === 'done' ? 'Completed' : 'Ongoing'} Deliveries</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Tracking activity and SO status.</p>
        </div>
        {status === 'ongoing' && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={20} /> New Shipment
          </button>
        )}
      </div>

      <div className="glass-card" style={{ marginBottom: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'center', background: '#e0e6e454' }}>
        <Search size={18} style={{ position: 'relative', color: 'var(--text-secondary)' }} />
        <input
          type="text"
          placeholder="Search SO Number or Customer Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '1rem', padding: '0.5rem 0' }}
        />
      </div>

      <div className="grid-records-main">
        {filteredRecords.map(record => {
          const soNumber = getField(record, 'soNumber', 'so_number');
          const customerName = getField(record, 'customerName', 'customer_name');
          const equipmentType = getField(record, 'equipmentType', 'equipment_type');
          const dangerousType = getField(record, 'dangerousType', 'dangerous_type');
          const manualPriority = getField(record, 'manualPriority', 'manual_priority');
          const priority = calculatePriority({ ...record, manualPriority });

          return (
            <div key={record.id} className="glass-card" style={{
              padding: '1.8rem',
              borderTop: `5px solid ${priority === PRIORITY_LEVELS.HIGH ? 'var(--error)' : priority === PRIORITY_LEVELS.MEDIUM ? 'var(--warning)' : 'var(--success)'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <span className={`badge ${getPriorityClass(priority)}`} style={{ marginBottom: '10px', display: 'inline-block' }}>
                    {priority} {manualPriority && '(Manual)'}
                  </span>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--brand-dark)' }}>
                    {soNumber} <span style={{ fontWeight: '400', color: 'var(--text-secondary)' }}>/</span> {customerName}
                  </h3>
                </div>
                <button className="icon-btn" onClick={() => handleExport(record)} title="Export to Excel" disabled={isExporting === record.id}>
                  {isExporting === record.id ? <Loader2 size={22} className="spin" /> : <Download size={22} color="var(--brand-dark)" />}
                </button>
              </div>

              <div className="grid-card-inner" style={{ marginBottom: '2rem', padding: '1.2rem', background: '#f8fbf9', borderRadius: '14px', border: '1px solid rgba(0,71,55,0.05)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Equipment</span>
                  <p style={{ fontWeight: '700', marginTop: '4px', fontSize: '1rem', color: 'var(--brand-dark)' }}>
                    {equipmentType} <span style={{ fontWeight: '400', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>({dangerousType})</span>
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>ETD Shipment</span>
                  <p style={{ fontWeight: '700', marginTop: '4px', fontSize: '1rem', color: 'var(--brand-dark)' }}>{record.etd}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" style={{ flex: 1, padding: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => openLogs(record)}>
                  <History size={18} /> Logs
                </button>
                {status === 'ongoing' && (
                  <>
                    <button className="btn-secondary" style={{ padding: '0.7rem' }} onClick={() => handleEditInit(record)}>
                      <Edit3 size={20} />
                    </button>
                    <button className="btn-primary" style={{ flex: 1.2, padding: '0.7rem' }} onClick={() => markAsDone(record)}>
                      <CheckCircle size={18} /> Set Completed
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {filteredRecords.length === 0 && (
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
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>Activity Feed — {getField(selectedRecord, 'soNumber', 'so_number')}</h2>
              <button className="icon-btn" onClick={() => setSelectedRecord(null)}><X size={24} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
              {logsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <Loader2 size={36} className="spin" color="var(--brand-green)" />
                </div>
              ) : selectedLogs.length > 0 ? selectedLogs.map(log => (
                <div key={log.id} style={{ padding: '1.5rem', marginBottom: '1.5rem', background: '#f9fbf9', borderRadius: '0 16px 16px 0', borderLeft: `6px solid ${log.action === 'Auto-Update' ? 'var(--warning)' : log.action === 'Completed' ? 'var(--success)' : 'var(--brand-green)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontWeight: '800', color: 'var(--brand-dark)', fontSize: '0.9rem' }}>{log.action}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.timestamp + (!log.timestamp.includes('Z') ? 'Z' : '')).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB — <b>{log.modifier_name || log.updated_by || 'System'}</b>
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px', fontStyle: 'italic' }}>Reason: "{log.comment}"</p>
                  {log.old_data && log.new_data && (() => {
                    try {
                      const old = JSON.parse(log.old_data);
                      const nw  = JSON.parse(log.new_data);
                      const changes = Object.keys(nw).filter(k => String(nw[k]) !== String(old[k]));
                      if (changes.length === 0) return null;
                      return (
                        <div style={{ background: 'white', borderRadius: '10px', padding: '0.8rem 1rem', fontSize: '0.82rem' }}>
                          {changes.map(k => (
                            <div key={k} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '700', color: 'var(--brand-dark)', minWidth: '110px', textTransform: 'capitalize' }}>{k.replace(/_/g,' ')}:</span>
                              <span style={{ color: 'var(--error)', textDecoration: 'line-through' }}>{old[k] || '—'}</span>
                              <span style={{ color: 'var(--text-secondary)' }}>→</span>
                              <span style={{ color: 'var(--success)', fontWeight: '700' }}>{nw[k] || '—'}</span>
                            </div>
                          ))}
                        </div>
                      );
                    } catch { return null; }
                  })()}
                  {log.attachment_path && (
                    <div style={{ marginTop: '10px', fontSize: '0.82rem', display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--brand-dark)' }}>
                      <Paperclip size={14} /> <span>{log.attachment_path.split('/').pop()}</span>
                    </div>
                  )}
                </div>
              )) : (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>No activity logs yet.</p>
              )}
            </div>
            <button className="btn-secondary" style={{ marginTop: '1.5rem', width: '100%', padding: '1rem' }} onClick={() => setSelectedRecord(null)}>Close</button>
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

            <div className="grid-form-2col" style={{ marginBottom: '2rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>SO Number</label>
                <input type="text" value={editData.soNumber || ''} onChange={e => setEditData({...editData, soNumber: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Customer Name</label>
                <select value={editData.customerName || ''} onChange={e => setEditData({...editData, customerName: e.target.value})} style={inputStyle}>
                  {customers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>ETD Date</label>
                <input type="date" value={editData.etd || ''} onChange={e => setEditData({...editData, etd: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Equipment Type</label>
                <select value={editData.equipmentType || ''} onChange={e => setEditData({...editData, equipmentType: e.target.value})} style={inputStyle}>
                  {EQUIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Cargo Category</label>
                <select value={editData.dangerousType || ''} onChange={e => setEditData({...editData, dangerousType: e.target.value})} style={inputStyle}>
                  {DANGER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Priority Setting</label>
                <select value={editData.manualPriority || ''} onChange={e => setEditData({...editData, manualPriority: e.target.value || null})} style={inputStyle}>
                  <option value="">Automatic (Date Based)</option>
                  <option value={PRIORITY_LEVELS.HIGH}>High Priority (Manual Override)</option>
                  <option value={PRIORITY_LEVELS.MEDIUM}>Medium Priority (Manual Override)</option>
                  <option value={PRIORITY_LEVELS.NORMAL}>Normal Priority (Manual Override)</option>
                </select>
              </div>
              <div style={{ gridColumn: '1/-1', borderTop: '2px solid #f0f4f3', paddingTop: '1.5rem' }}>
                <label style={{ ...labelStyle, color: 'var(--brand-dark)' }}>Reason for Modification (Mandatory) *</label>
                <textarea
                  required
                  placeholder="State why this record is being updated..."
                  value={editMeta.comment}
                  onChange={e => setEditMeta({ ...editMeta, comment: e.target.value })}
                  style={{ ...inputStyle, height: '100px', marginTop: '10px' }}
                />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Attachment Proof (Max 2MB)</label>
                <label className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', padding: '1rem' }}>
                  <Paperclip size={20} />
                  <span>{editMeta.attachment ? editMeta.attachment.name : 'Upload Supporting Document'}</span>
                  <input type="file" hidden onChange={handleFileChange} />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button className="btn-primary" style={{ flex: 1.5, padding: '1rem' }} onClick={saveEdit}><Save size={20} /> Submit Update</button>
              <button className="btn-secondary" style={{ flex: 0.5, padding: '1rem' }} onClick={() => setEditingRecord(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,40,31,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(8px); }
        .modal-content { animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' };

export default RecordsList;
