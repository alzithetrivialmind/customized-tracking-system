import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  calculateSIPriority,
  getSIPriorityClass,
  getSIPriorityLabel
} from '../../logic/priority';
import { 
  Search, Layers, Loader2, Truck, CheckCircle, Send, ClipboardCheck
} from 'lucide-react';
import dayjs from 'dayjs';

const SIStatusBadge = ({ status }) => {
  switch(status) {
    case 'COMPLETED': return <span className="badge badge-success">Completed</span>;
    case 'ON_PROGRESS': return <span className="badge badge-medium">On Progress</span>;
    default: return <span className="badge badge-normal" style={{background: '#e0e0e0', color: '#555'}}>Pending</span>;
  }
};

const SITrackRecord = ({ record, handleUpdateSI, lsps }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [lspId, setLspId] = useState(record.lsp_id || '');
  const [submitDead, setSubmitDead] = useState(record.si_deadline_submit ? record.si_deadline_submit.slice(0, 16) : '');
  const [confirmDead, setConfirmDead] = useState(record.si_deadline_confirm ? record.si_deadline_confirm.slice(0, 16) : '');
  const [comment, setComment] = useState('');

  const onSave = (e) => {
    e.preventDefault();
    if (!comment) return alert("Comment is required!");
    handleUpdateSI(record.id, {
      lsp_id: lspId,
      si_deadline_submit: submitDead,
      si_deadline_confirm: confirmDead,
      si_status: 'ON_PROGRESS',
      comment
    });
    setIsEditing(false);
  };

  const onMarkCompleted = () => {
    const cmt = prompt("Enter a comment for marking SI as completed:");
    if (!cmt) return;
    handleUpdateSI(record.id, {
      lsp_id: record.lsp_id,
      si_deadline_submit: record.si_deadline_submit,
      si_deadline_confirm: record.si_deadline_confirm,
      si_status: 'COMPLETED',
      comment: cmt
    });
  };

  // Determine overall SI priority based on which deadline is closest
  const subLevel = calculateSIPriority(record.si_deadline_submit);
  const confLevel = calculateSIPriority(record.si_deadline_confirm);
  const wMap = { 'HIGH': 3, 'AWARE': 2, 'NORMAL': 1 };
  const priorityLevel = wMap[subLevel] > wMap[confLevel] ? subLevel : confLevel;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: `6px solid ${record.si_status === 'COMPLETED' ? 'var(--success)' : record.si_status === 'ON_PROGRESS' ? 'var(--warning)' : '#ccc'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--brand-dark)' }}>{record.so_number}</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{record.customer_name}</p>
        </div>
        <div>
          <SIStatusBadge status={record.si_status} />
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Logistic Partner (LSP)</span>
          <div style={{ fontWeight: '600', color: 'var(--brand-dark)', marginTop: '4px' }}>
            {record.lsp_name || 'Not Assigned'}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}><Send size={10} /> To Submit</span>
            <div style={{ fontWeight: '600', color: 'var(--brand-dark)', marginTop: '4px' }}>
              {record.si_deadline_submit ? dayjs(record.si_deadline_submit).format('DD MMM, HH:mm') : '—'}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}><ClipboardCheck size={10} /> To Confirm</span>
            <div style={{ fontWeight: '600', color: 'var(--brand-dark)', marginTop: '4px' }}>
              {record.si_deadline_confirm ? dayjs(record.si_deadline_confirm).format('DD MMM, HH:mm') : '—'}
            </div>
          </div>
        </div>
        
        {record.si_status === 'ON_PROGRESS' && priorityLevel !== 'NORMAL' && (
          <div style={{ marginTop: '0.5rem' }}>
             <span className={`si-badge ${getSIPriorityClass(priorityLevel)}`}>
               SI DEADLINE: {getSIPriorityLabel(priorityLevel)}
             </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
        {record.si_status !== 'COMPLETED' && (
          <>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Cancel Edit' : (record.si_status === 'PENDING' ? 'Set Target' : 'Edit Target')}
            </button>
            <button className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }} onClick={onMarkCompleted} disabled={!record.lsp_id}>
              <CheckCircle size={16} /> Mark Completed
            </button>
          </>
        )}
      </div>

      {isEditing && (
        <form onSubmit={onSave} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Logistic Partner (LSP)</label>
            <select value={lspId} onChange={e => setLspId(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="">Select LSP...</option>
              {lsps.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Deadline: To Submit</label>
            <input type="datetime-local" value={submitDead} onChange={e => setSubmitDead(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Deadline: To Confirm</label>
            <input type="datetime-local" value={confirmDead} onChange={e => setConfirmDead(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }} />
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


const SITracker = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [lsps, setLsps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroup] = useState('si_status'); 

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recs, lspData] = await Promise.all([
         api.get('/records?status=ongoing'),
         api.get('/lsps')
      ]);
      setRecords(recs);
      setLsps(lspData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSI = async (id, payload) => {
    try {
      await api.put(`/records/${id}/si`, payload);
      loadData();
    } catch (err) {
      alert("Error updating SI: " + err.message);
    }
  };

  const processedRecords = useMemo(() => {
    let result = [...records];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.so_number || '').toLowerCase().includes(term) ||
        (r.customer_name || '').toLowerCase().includes(term) ||
        (r.lsp_name || '').toLowerCase().includes(term)
      );
    }
    
    result.sort((a, b) => {
       const statOrder = { 'PENDING': 1, 'ON_PROGRESS': 2, 'COMPLETED': 3 };
       const orderA = statOrder[a.si_status || 'PENDING'];
       const orderB = statOrder[b.si_status || 'PENDING'];
       return orderA - orderB;
    });

    if (groupBy === 'si_status') {
      const groups = {
        'On Progress': [],
        'Pending (Belum dikerjakan)': [],
        'Completed': []
      };
      result.forEach(r => {
        if (r.si_status === 'COMPLETED') groups['Completed'].push(r);
        else if (r.si_status === 'ON_PROGRESS') groups['On Progress'].push(r);
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
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>Shipping Instructions</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage LSP assignments and documentation deadlines.</p>
        </div>
      </div>

      <div className="list-toolbar">
         <div className="toolbar-group" style={{ flex: 1 }}>
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
          <Layers size={16} color="var(--text-secondary)" />
          <span className="toolbar-label">View Mode</span>
          <select className="toolbar-select" value={groupBy} onChange={(e) => setGroup(e.target.value)}>
            <option value="si_status">Group by Status</option>
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
            <SITrackRecord key={record.id} record={record} handleUpdateSI={handleUpdateSI} lsps={lsps} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.entries(processedRecords).map(([groupName, groupRecords]) => {
             if (groupRecords.length === 0) return null;
             return (
               <div key={groupName} className="fade-in">
                 <div className="group-header">
                   <Truck size={20} />
                   <h2 className="group-title">{groupName}</h2>
                   <span className="group-count">{groupRecords.length} Items</span>
                 </div>
                 <div className="grid-records-main">
                   {groupRecords.map(record => (
                     <SITrackRecord key={record.id} record={record} handleUpdateSI={handleUpdateSI} lsps={lsps} />
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

export default SITracker;
