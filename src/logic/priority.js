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

export const SI_PRIORITY_LEVELS = {
  NORMAL: 'NORMAL',
  AWARE: 'AWARE',
  HIGH: 'HIGH'
};

export const calculateSIPriority = (deadlineStr) => {
  if (!deadlineStr) return SI_PRIORITY_LEVELS.NORMAL;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deadline = new Date(deadlineStr);
  deadline.setHours(0, 0, 0, 0);
  
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return SI_PRIORITY_LEVELS.HIGH;
  if (diffDays === 1) return SI_PRIORITY_LEVELS.AWARE;
  return SI_PRIORITY_LEVELS.NORMAL;
};

export const getSIPriorityClass = (priority) => {
  switch (priority) {
    case SI_PRIORITY_LEVELS.HIGH: return 'si-badge-high';
    case SI_PRIORITY_LEVELS.AWARE: return 'si-badge-aware';
    default: return 'si-badge-normal';
  }
};

export const getSIPriorityLabel = (priority) => {
  switch (priority) {
    case SI_PRIORITY_LEVELS.HIGH: return 'HIGH';
    case SI_PRIORITY_LEVELS.AWARE: return 'NEED TO AWARE';
    default: return 'NORMAL';
  }
};
