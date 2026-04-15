import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  calculatePriority, 
  getPriorityClass, 
  PRIORITY_LEVELS,
  calculateSIPriority,
  getSIPriorityClass,
  getSIPriorityLabel,
  calculateUrgencyScore
} from '../../logic/priority';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Edit3, Paperclip, X, Save, AlertTriangle, History, Loader2, GripVertical, Truck, Send, ClipboardCheck, FileSpreadsheet,
  ArrowUpDown, Filter, Layers, List
} from 'lucide-react';
import RecordForm from './RecordForm';

const EQUIP_TYPES = ['Container', 'Isotank', 'Flexitank'];
const DANGER_TYPES = ['DG', 'NON-DG'];

const SortableRecord = ({ record, status, handleExport, isExporting, openLogs, handleEditInit, markAsDone, markAsReverted, getField }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: record.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 100, opacity: 0.8, boxShadow: '0 5px 15px rgba(0,0,0,0.15)' } : {})
  };

  const soNumber = getField(record, 'soNumber', 'so_number');
  const customerName = getField(record, 'customerName', 'customer_name');
  const equipmentType = getField(record, 'equipmentType', 'equipment_type');
  const dangerousType = getField(record, 'dangerousType', 'dangerous_type');
  const manualPriority = getField(record, 'manualPriority', 'manual_priority');
  const priority = calculatePriority({ ...record, manualPriority });

  return (
    <div ref={setNodeRef} className="glass-card" style={{
      ...style,
      padding: '1.8rem',
      backgroundColor: 'var(--surface-color)',
      borderTop: `5px solid ${status === 'done' ? 'var(--brand-green)' : priority === PRIORITY_LEVELS.HIGH ? 'var(--error)' : priority === PRIORITY_LEVELS.MEDIUM ? 'var(--warning)' : 'var(--success)'}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          {status === 'done' ? (
            <span className="badge" style={{ background: 'var(--success)', color: 'var(--brand-dark)', marginBottom: '10px', display: 'inline-block' }}>
              Complete
            </span>
          ) : (
            <span className={`badge ${getPriorityClass(priority)}`} style={{ marginBottom: '10px', display: 'inline-block' }}>
              {priority} {manualPriority && '(Manual)'}
            </span>
          )}
          {record.status === 'reverted' && (
            <span className="badge" style={{ background: 'var(--error)', color: 'white', marginBottom: '10px', display: 'inline-block', marginLeft: '8px' }}>
              Reverted
            </span>
          )}
          <h3 style={{ fontSize: '1.3rem', color: 'var(--brand-dark)' }}>
            {soNumber} <span style={{ fontWeight: '400', color: 'var(--text-secondary)' }}>/</span> {customerName}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {status === 'ongoing' && (
            <div {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', padding: '4px', color: 'var(--text-secondary)' }} title="Drag to reorder">
              <GripVertical size={20} />
            </div>
          )}
          <button className="icon-btn" onClick={() => handleExport(record)} title="Export to Excel" disabled={isExporting === record.id}>
            {isExporting === record.id ? <Loader2 size={22} className="spin" /> : <Download size={22} color="var(--brand-dark)" />}
          </button>
        </div>
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

      {(record.lsp_name || record.si_deadline_submit || record.si_deadline_confirm) && (
        <div style={{ marginBottom: '2rem', padding: '1.2rem', background: '#eef3f1', borderRadius: '14px', border: '1px solid rgba(0,71,55,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Truck size={16} color="var(--brand-green)" />
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--brand-dark)', textTransform: 'uppercase' }}>SI Submission Tracking</span>
          </div>
          <div className="grid-card-inner" style={{ gap: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Logistic Partner (LSP)</span>
              <p style={{ fontWeight: '700', marginTop: '2px', fontSize: '0.95rem', color: 'var(--brand-dark)' }}>{record.lsp_name || '—'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>SI Submission Deadline</span>
              <div style={{ marginTop: '2px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Send size={12} color="var(--text-secondary)" /> 
                  <b>Submit:</b> {record.si_deadline_submit ? new Date(record.si_deadline_submit).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                  {record.si_deadline_submit && (
                    <span className={`si-badge ${getSIPriorityClass(calculateSIPriority(record.si_deadline_submit))}`}>
                      {getSIPriorityLabel(calculateSIPriority(record.si_deadline_submit))}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <ClipboardCheck size={12} color="var(--text-secondary)" /> 
                  <b>Confirm:</b> {record.si_deadline_confirm ? new Date(record.si_deadline_confirm).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                  {record.si_deadline_confirm && (
                    <span className={`si-badge ${getSIPriorityClass(calculateSIPriority(record.si_deadline_confirm))}`}>
                      {getSIPriorityLabel(calculateSIPriority(record.si_deadline_confirm))}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(record.po_date || record.sc_deadline) && (
        <div style={{ marginBottom: '2rem', padding: '1.2rem', background: '#f8faf9', borderRadius: '14px', border: '1px solid rgba(0,71,55,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <FileSpreadsheet size={16} color="var(--brand-green)" />
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--brand-dark)', textTransform: 'uppercase' }}>Contract & PO Tracking</span>
          </div>
          <div className="grid-card-inner" style={{ gap: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>PO Date (Received)</span>
              <p style={{ fontWeight: '700', marginTop: '2px', fontSize: '0.95rem', color: 'var(--brand-dark)' }}>{record.po_date ? new Date(record.po_date).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '—'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>SC Deadline</span>
              <div style={{ marginTop: '2px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <b>Target:</b> {record.sc_deadline ? new Date(record.sc_deadline).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '—'}
                  {record.sc_deadline && (
                    <span className={`si-badge ${getSIPriorityClass(calculateSIPriority(record.sc_deadline))}`}>
                      {getSIPriorityLabel(calculateSIPriority(record.sc_deadline))}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
        {status === 'done' && (
          <button className="btn-secondary" style={{ flex: 1.2, padding: '0.7rem', color: 'var(--error)', borderColor: 'rgba(235, 87, 87, 0.3)' }} onClick={() => markAsReverted(record)}>
            Revert Delivery
          </button>
        )}
      </div>
    </div>
  );
};

const RecordsList = ({ status }) => {
  const { user, isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [lsps, setLsps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soOrder, setSoOrder] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editData, setEditData] = useState({});
  const [editMeta, setEditMeta] = useState({ comment: '', attachment: null });
  const [isExporting, setIsExporting] = useState(null);

  // Sorting and Grouping State
  const [sortBy, setBy] = useState('created_at'); // created_at, urgency, etd, po_date, sc_deadline, si_deadline_submit, so_number
  const [sortOrder, setOrder] = useState('desc'); // asc, desc
  const [groupBy, setGroup] = useState('none'); // none, lsp_name, customer_name, equipment_type, dangerous_type

  useEffect(() => {
    if (user) {
      loadData();
      loadPreferences();
    }
  }, [status, user]);

  const loadPreferences = async () => {
    try {
      const res = await api.get('/preferences');
      if (res.soOrder) setSoOrder(res.soOrder);
    } catch(err) {
      console.error('Failed to load preferences:', err.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const recs = await api.get(`/records?status=${status}`);
      setRecords(recs);
      const [custs, lspData] = await Promise.all([
        api.get('/customers'),
        api.get('/lsps')
      ]);
      setCustomers(custs.map(c => c.name));
      setLsps(lspData);
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

  // ── ADVANCED DATA PROCESSING ──
  const processedRecords = useMemo(() => {
    let result = [...records];

    // 1. FILTER by Search Term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.so_number?.toLowerCase().includes(term) ||
        r.customer_name?.toLowerCase().includes(term) ||
        (r.lsp_name || '').toLowerCase().includes(term)
      );
    }

    // 2. SORTING
    result.sort((a, b) => {
      let valA, valB;

      switch (sortBy) {
        case 'urgency':
          valA = calculateUrgencyScore(a);
          valB = calculateUrgencyScore(b);
          break;
        case 'so_number':
          valA = a.so_number;
          valB = b.so_number;
          break;
        default: // Dates
          valA = a[sortBy] || '0';
          valB = b[sortBy] || '0';
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // 3. GROUPING
    if (groupBy !== 'none') {
      const groups = {};
      result.forEach(r => {
        const key = r[groupBy] || 'Uncategorized';
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
      });
      return groups;
    }

    return result;
  }, [records, searchTerm, sortBy, sortOrder, groupBy]);

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

  const markAsReverted = async (record) => {
    const reason = prompt('Please enter the reason for reverting this SO:');
    if (reason === null) return; 
    if (!reason.trim()) {
      alert('A reason is mandatory to revert a shipment.');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/records/${record.id}/status`, { status: 'reverted', comment: reason });
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
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
      lsp_id: record.lsp_id || '',
      si_deadline_submit: record.si_deadline_submit || '',
      si_deadline_confirm: record.si_deadline_confirm || '',
      po_date: record.po_date || '',
      sc_deadline: record.sc_deadline || '',
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
        lsp_id: editData.lsp_id || null,
        si_deadline_submit: editData.si_deadline_submit || null,
        si_deadline_confirm: editData.si_deadline_confirm || null,
        po_date: editData.po_date || null,
        sc_deadline: editData.sc_deadline || null,
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Helper to normalize snake_case from DB
  const getField = (record, camel, snake) => record[camel] ?? record[snake] ?? '';

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredRecords.findIndex(i => i.id === active.id);
    const newIndex = filteredRecords.findIndex(i => i.id === over.id);
    const newArr = arrayMove(filteredRecords, oldIndex, newIndex);
    
    // Create new array of IDs for the items in the current view
    const newOrderIds = newArr.map(r => r.id);
    // Include IDs from previous save (soOrder) that might be filtered out currently
    const mergedOrderIds = [...new Set([...newOrderIds, ...soOrder])];
    
    setSoOrder(mergedOrderIds);
    try {
      await api.put('/preferences', { soOrder: mergedOrderIds });
    } catch (err) {
      console.error('Failed to save order', err);
    }
  };

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

      <div className="list-toolbar">
        <div className="toolbar-group" style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
            <input 
              type="text" 
              placeholder="Search by SO, Customer, or LSP..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', width: '100%', borderRadius: '10px', border: '1px solid var(--border-color)', outline: 'none', background: 'transparent' }}
            />
          </div>
        </div>

        <div className="toolbar-group">
          <ArrowUpDown size={16} color="var(--text-secondary)" />
          <span className="toolbar-label">Sort By</span>
          <select className="toolbar-select" value={sortBy} onChange={(e) => setBy(e.target.value)}>
            <option value="created_at">Order Added</option>
            <option value="urgency">Overall Urgency</option>
            <option value="so_number">SO Number</option>
            <option value="etd">ETD Shipment</option>
            <option value="po_date">PO Received</option>
            <option value="sc_deadline">SC Deadline</option>
            <option value="si_deadline_submit">SI Submission</option>
          </select>
          <button 
            className="icon-btn" 
            style={{ fontWeight: '800', fontSize: '0.75rem', width: '45px' }}
            onClick={() => setOrder(o => o === 'asc' ? 'desc' : 'asc')}
            title="Toggle Sort Order"
          >
            {sortOrder === 'asc' ? 'ASC' : 'DESC'}
          </button>
        </div>

        <div className="toolbar-group">
          <Layers size={16} color="var(--text-secondary)" />
          <span className="toolbar-label">Group By</span>
          <select className="toolbar-select" value={groupBy} onChange={(e) => setGroup(e.target.value)}>
            <option value="none">None (List)</option>
            <option value="customer_name">Customer</option>
            <option value="lsp_name">Logistic Partner</option>
            <option value="equipment_type">Equipment Type</option>
            <option value="dangerous_type">DG Category</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader2 className="spinner" size={48} color="var(--brand-green)" />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading records...</p>
        </div>
      ) : (groupBy === 'none' ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext 
            items={(Array.isArray(processedRecords) ? processedRecords : []).map(r => r.id)} 
            strategy={verticalListSortingStrategy}
          >
            <div className="grid-records-main">
              {processedRecords.map(record => (
                <SortableRecord 
                  key={record.id} 
                  record={record} 
                  status={status} 
                  handleExport={handleExport}
                  isExporting={isExporting}
                  openLogs={openLogs}
                  handleEditInit={handleEditInit}
                  markAsDone={markAsDone}
                  markAsReverted={markAsReverted}
                  getField={getField}
                />
              ))}

              {processedRecords.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem' }}>
                  <AlertTriangle size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>No matching records found.</p>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(processedRecords).map(([groupName, groupRecords]) => (
            <div key={groupName} className="fade-in" style={{ marginBottom: '1rem' }}>
              <div className="group-header">
                {groupBy === 'lsp_name' ? <Truck size={20} /> : <Layers size={20} />}
                <h2 className="group-title">{groupName}</h2>
                <span className="group-count">{groupRecords.length} Items</span>
              </div>
              <div className="grid-records-main">
                {groupRecords.map(record => (
                  <SortableRecord 
                    key={record.id} 
                    record={record} 
                    status={status} 
                    handleExport={handleExport}
                    isExporting={isExporting}
                    openLogs={openLogs}
                    handleEditInit={handleEditInit}
                    markAsDone={markAsDone}
                    markAsReverted={markAsReverted}
                    getField={getField}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

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
                <label style={labelStyle}>Danger Type</label>
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
              
              <div style={{ gridColumn: '1/-1', borderTop: '2px solid #f0f4f3', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <Truck size={18} color="var(--brand-green)" />
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-dark)', margin: 0 }}>Shipping Instructions (SI) Details</h3>
                </div>
                <label style={labelStyle}>Logistics Partner (LSP)</label>
                <select value={editData.lsp_id || ''} onChange={e => setEditData({...editData, lsp_id: e.target.value})} style={inputStyle}>
                  <option value="">Select Logistic Partner...</option>
                  {lsps.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>SI Deadline: To Submit</label>
                <input 
                  type="datetime-local" 
                  value={editData.si_deadline_submit || ''} 
                  onChange={e => setEditData({...editData, si_deadline_submit: e.target.value})} 
                  style={inputStyle} 
                />
              </div>

              <div>
                <label style={labelStyle}>SI Deadline: To Confirm</label>
                <input 
                  type="datetime-local" 
                  value={editData.si_deadline_confirm || ''} 
                  onChange={e => setEditData({...editData, si_deadline_confirm: e.target.value})} 
                  style={inputStyle} 
                />
              </div>

              <div style={{ gridColumn: '1/-1', borderTop: '2px solid #f0f4f3', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <FileSpreadsheet size={18} color="var(--brand-green)" />
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-dark)', margin: 0 }}>Contract & PO Details</h3>
                </div>
              </div>

              <div>
                <label style={labelStyle}>PO Date (Received)</label>
                <input 
                  type="date" 
                  value={editData.po_date || ''} 
                  onChange={e => setEditData({...editData, po_date: e.target.value})} 
                  style={inputStyle} 
                />
              </div>

              <div>
                <label style={labelStyle}>SC Deadline</label>
                <input 
                  type="date" 
                  value={editData.sc_deadline || ''} 
                  onChange={e => setEditData({...editData, sc_deadline: e.target.value})} 
                  style={inputStyle} 
                />
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
