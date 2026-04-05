const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Tracker/RecordsList.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add Drag and Drop imports
content = content.replace(
  "import { \n  Plus, Download, CheckCircle, Search,\n  Edit3, Paperclip, X, Save, AlertTriangle, History, Loader2 \n} from 'lucide-react';",
  `import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, Download, CheckCircle, Search,
  Edit3, Paperclip, X, Save, AlertTriangle, History, Loader2, GripVertical
} from 'lucide-react';`
);

// 2. Add SortableRecord component above RecordsList
const sortableCode = `
const SortableRecord = ({ record, status, handleExport, isExporting, openLogs, handleEditInit, markAsDone, getField }) => {
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
    <div ref={setNodeRef} style={style} className="glass-card" style={{
      ...style,
      padding: '1.8rem',
      backgroundColor: 'var(--surface-color)',
      borderTop: \`5px solid \${priority === PRIORITY_LEVELS.HIGH ? 'var(--error)' : priority === PRIORITY_LEVELS.MEDIUM ? 'var(--warning)' : 'var(--success)'}\`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <span className={\`badge \${getPriorityClass(priority)}\`} style={{ marginBottom: '10px', display: 'inline-block' }}>
            {priority} {manualPriority && '(Manual)'}
          </span>
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
};
`;
content = content.replace('const EQUIP_TYPES =', sortableCode + '\nconst EQUIP_TYPES =');

// 3. Add state and data loading
content = content.replace(
  'const [loading, setLoading] = useState(true);',
  \`const [loading, setLoading] = useState(true);
  const [soOrder, setSoOrder] = useState([]);\`
);

content = content.replace(
  \`  useEffect(() => {
    if (user) loadData();
  }, [status, user]);\`,
  \`  useEffect(() => {
    if (user) {
      loadData();
      loadPreferences();
    }
  }, [status, user]);

  const loadPreferences = async () => {
    try {
      const res = await api.get('/preferences');
      if (res.soOrder) setSoOrder(res.soOrder);
    } catch(err) { console.error('Failed to load preferences:', err); }
  };\`
);

// 4. Add sorting algorithm and Drag handler
const searchCode = \`  const filteredRecords = records.filter(r => {
    const soNum = getField(r, 'soNumber', 'so_number').toLowerCase();
    const custName = getField(r, 'customerName', 'customer_name').toLowerCase();
    const term = searchTerm.toLowerCase();
    return soNum.includes(term) || custName.includes(term);
  });\`;

const sortAndFilterCode = \`
  const sortedRecords = [...records].sort((a, b) => {
    if (status !== 'ongoing' || soOrder.length === 0) return 0;
    const idxA = soOrder.indexOf(a.id);
    const idxB = soOrder.indexOf(b.id);
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const filteredRecords = sortedRecords.filter(r => {
    const soNum = getField(r, 'soNumber', 'so_number').toLowerCase();
    const custName = getField(r, 'customerName', 'customer_name').toLowerCase();
    const term = searchTerm.toLowerCase();
    return soNum.includes(term) || custName.includes(term);
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredRecords.findIndex(i => i.id === active.id);
    const newIndex = filteredRecords.findIndex(i => i.id === over.id);
    const newArr = arrayMove(filteredRecords, oldIndex, newIndex);
    
    const newOrderIds = newArr.map(r => r.id);
    // Merge new order with previous items not in view due to filtering
    const mergedOrderIds = [...new Set([...newOrderIds, ...soOrder])];
    
    setSoOrder(mergedOrderIds);
    try {
      await api.put('/preferences', { soOrder: mergedOrderIds });
    } catch (err) {
      console.error('Failed to save order', err);
    }
  };
\`;

content = content.replace(searchCode, sortAndFilterCode);

// 5. Replace Grid List with DndContext
const originalMapStart = \`        {filteredRecords.map(record => {\`;
const originalMapEndReg = /<\\/div>\\s*\\);\\s*\\}\\)\\}\\s*\\{filteredRecords\\.length === 0/gm;
const originalMapBlock = content.substring(content.indexOf(originalMapStart), content.indexOf('{filteredRecords.length === 0'));

const sortedMapBlock = \`
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredRecords.map(r => r.id)} strategy={verticalListSortingStrategy}>
          <div className="grid-records-main">
            {filteredRecords.map(record => (
              <SortableRecord 
                key={record.id} 
                record={record} 
                status={status} 
                handleExport={handleExport} 
                isExporting={isExporting} 
                openLogs={openLogs} 
                handleEditInit={handleEditInit} 
                markAsDone={markAsDone} 
                getField={getField} 
              />
            ))}

            \`;

content = content.replace(originalMapStart, '<div className="grid-records-main">'); // to allow simple replace
content = content.replace(/<div className="grid-records-main">[\s\S]*?(?=\{filteredRecords\.length === 0)/, sortedMapBlock);

// close the dnd context tags
content = content.replace(
  \`            <p style={{ fontSize: '1.1rem' }}>No {status} shipments currently recorded.</p>
          </div>
        )}
      </div>\`,
  \`            <p style={{ fontSize: '1.1rem' }}>No {status} shipments currently recorded.</p>
          </div>
        )}
          </div>
        </SortableContext>
      </DndContext>\`
);

fs.writeFileSync(file, content);
console.log('Successfully updated RecordsList.jsx constraints.');
