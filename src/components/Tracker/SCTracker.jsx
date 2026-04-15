import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  calculateSIPriority,
  getSIPriorityClass,
  getSIPriorityLabel
} from '../../logic/priority';
import { 
  Search, ArrowUpDown, Layers, List, Loader2, AlertTriangle, FileSpreadsheet, CheckCircle, Clock
} from 'lucide-react';
import dayjs from 'dayjs';

const SCStatusBadge = ({ status }) => {
  switch(status) {
    case 'COMPLETED': return <span className="badge badge-success">Completed</span>;
    case 'ON_PROGRESS': return <span className="badge badge-medium">On Progress</span>;
    default: return <span className="badge badge-normal" style={{background: '#e0e0e0', color: '#555'}}>Pending</span>;
  }
};

const SCTrackRecord = ({ record, handleUpdateSC }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [poDate, setPoDate] = useState(record.po_date || '');
  const [scDeadline, setScDeadline] = useState(record.sc_deadline || '');
  const [comment, setComment] = useState('');

  // Auto-calculate deadline
  useEffect(() => {
    if (poDate) {
      let deadline = dayjs(poDate);
      let added = 0;
      while (added < 4) {
        deadline = deadline.add(1, 'day');
        if (deadline.day() !== 0 && deadline.day() !== 6) {
          added++;
        }
      }
      setScDeadline(deadline.format('YYYY-MM-DD'));
    }
  }, [poDate]);

  const onSave = (e) => {
    e.preventDefault();
    if (!comment) return alert("Comment is required!");
    handleUpdateSC(record.id, {
      po_date: poDate,
      sc_deadline: scDeadline,
      sc_status: 'ON_PROGRESS',
      comment
    });
    setIsEditing(false);
  };

  const onMarkCompleted = () => {
    const cmt = prompt("Enter a comment for marking SC as completed:");
    if (!cmt) return;
    handleUpdateSC(record.id, {
      po_date: record.po_date,
      sc_deadline: record.sc_deadline,
      sc_status: 'COMPLETED',
      comment: cmt
    });
  };

  const priorityLevel = calculateSIPriority(record.sc_deadline);

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: `6px solid ${record.sc_status === 'COMPLETED' ? 'var(--success)' : record.sc_status === 'ON_PROGRESS' ? 'var(--warning)' : '#ccc'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--brand-dark)' }}>{record.so_number}</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{record.customer_name}</p>
        </div>
        <div>
          <SCStatusBadge status={record.sc_status} />
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>PO Received Date</span>
          <div style={{ fontWeight: '600', color: 'var(--brand-dark)', marginTop: '4px' }}>
            {record.po_date ? dayjs(record.po_date).format('DD MMM YYYY') : 'Not Set'}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>SC Deadline</span>
          <div style={{ fontWeight: '600', color: 'var(--brand-dark)', marginTop: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            {record.sc_deadline ? dayjs(record.sc_deadline).format('DD MMM YYYY') : 'Not Set'}
            {record.sc_deadline && record.sc_status !== 'COMPLETED' && (
               <span className={`si-badge ${getSIPriorityClass(priorityLevel)}`}>
                 {getSIPriorityLabel(priorityLevel)}
               </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
        {record.sc_status !== 'COMPLETED' && (
          <>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Cancel Edit' : (record.sc_status === 'PENDING' ? 'Set Deadlines' : 'Edit Deadlines')}
            </button>
            <button className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }} onClick={onMarkCompleted} disabled={!record.po_date}>
              <CheckCircle size={16} /> Mark Completed
            </button>
          </>
        )}
      </div>

      {isEditing && (
        <form onSubmit={onSave} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>PO Received Date</label>
            <input type="date" value={poDate} onChange={e => setPoDate(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>SC Deadline (Auto +4 Days)</label>
            <input type="date" value={scDeadline} onChange={e => setScDeadline(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Update Comment *</label>
            <input type="text" value={comment} onChange={e => setComment(e.target.value)} required placeholder="Reason for update..." style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
          <button type="submit" className="btn-primary">Save Changes</button>
        </form>
      )}
    </div>
  );
};


const SCTracker = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroup] = useState('sc_status'); 

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // SC Tracker only cares about SOs that are somewhat active
      const recs = await api.get('/records?status=ongoing');
      setRecords(recs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSC = async (id, payload) => {
    try {
      await api.put(`/records/${id}/sc`, payload);
      loadData();
    } catch (err) {
      alert("Error updating SC: " + err.message);
    }
  };

  const processedRecords = useMemo(() => {
    let result = [...records];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.so_number || '').toLowerCase().includes(term) ||
        (r.customer_name || '').toLowerCase().includes(term)
      );
    }
    
    // Default Sort by Actionable Priority: Pending first, then On Progress (sorted by deadline urgency), then completed
    result.sort((a, b) => {
       const statOrder = { 'PENDING': 1, 'ON_PROGRESS': 2, 'COMPLETED': 3 };
       const orderA = statOrder[a.sc_status || 'PENDING'];
       const orderB = statOrder[b.sc_status || 'PENDING'];
       if (orderA !== orderB) return orderA - orderB;

       // If both on progress, sort by SC deadline
       if (a.sc_status === 'ON_PROGRESS') {
          const wA = calculateSIPriority(a.sc_deadline);
          const wB = calculateSIPriority(b.sc_deadline);
          // High priority strings come out as 'HIGH', 'AWARE', 'NORMAL' -> Map weights
          const wMap = { 'HIGH': 3, 'AWARE': 2, 'NORMAL': 1 };
          return wMap[wB] - wMap[wA];
       }
       return 0;
    });

    if (groupBy === 'sc_status') {
      const groups = {
        'On Progress': [],
        'Pending (Belum dikerjakan)': [],
        'Completed': []
      };
      result.forEach(r => {
        if (r.sc_status === 'COMPLETED') groups['Completed'].push(r);
        else if (r.sc_status === 'ON_PROGRESS') groups['On Progress'].push(r);
        else groups['Pending (Belum dikerjakan)'].push(r);
      });
      return groups;
    }
    return result;
  }, [records, searchTerm, groupBy]);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>Sales Contracts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Track PO receipts and SC deadlines.</p>
        </div>
      </div>

      <div className="list-toolbar">
         <div className="toolbar-group" style={{ flex: 1 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
            <input 
              type="text" 
              placeholder="Search by SO or Customer..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', width: '100%', borderRadius: '10px', border: '1px solid var(--border-color)', outline: 'none', background: 'transparent' }}
            />
          </div>
        </div>
        <div className="toolbar-group">
          <Layers size={16} color="var(--text-secondary)" />
          <span className="toolbar-label">View Mode</span>
          <select className="toolbar-select" value={groupBy} onChange={(e) => setGroup(e.target.value)}>
            <option value="sc_status">Group by Status</option>
            <option value="none">List View</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader2 className="spinner" size={48} color="var(--brand-green)" />
        </div>
      ) : groupBy === 'none' ? (
        <div className="grid-records-main">
          {processedRecords.map(record => (
            <SCTrackRecord key={record.id} record={record} handleUpdateSC={handleUpdateSC} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.entries(processedRecords).map(([groupName, groupRecords]) => {
             if (groupRecords.length === 0) return null;
             return (
               <div key={groupName} className="fade-in">
                 <div className="group-header">
                   <FileSpreadsheet size={20} />
                   <h2 className="group-title">{groupName}</h2>
                   <span className="group-count">{groupRecords.length} Items</span>
                 </div>
                 <div className="grid-records-main">
                   {groupRecords.map(record => (
                     <SCTrackRecord key={record.id} record={record} handleUpdateSC={handleUpdateSC} />
                   ))}
                 </div>
               </div>
             );
          })}
        </div>
      )}
    </div>
  );
};

export default SCTracker;
