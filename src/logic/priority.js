export const PRIORITY_LEVELS = {
  NORMAL: 'NORMAL',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

export const calculatePriority = (record) => {
  if (record.manualPriority) return record.manualPriority;
  if (!record.etd) return PRIORITY_LEVELS.NORMAL;
  
  const today = new Date();
  const etd = new Date(record.etd);
  const diffTime = etd - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 10) return PRIORITY_LEVELS.HIGH;
  if (diffDays <= 14) return PRIORITY_LEVELS.MEDIUM;
  return PRIORITY_LEVELS.NORMAL;
};

export const getPriorityClass = (priority) => {
  switch (priority) {
    case PRIORITY_LEVELS.HIGH: return 'badge-high';
    case PRIORITY_LEVELS.MEDIUM: return 'badge-medium';
    default: return 'badge-normal';
  }
};
