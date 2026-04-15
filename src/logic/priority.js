export const PRIORITY_LEVELS = {
  NORMAL: { id: 'NORMAL', weight: 1 },
  MEDIUM: { id: 'MEDIUM', weight: 2 },
  HIGH: { id: 'HIGH', weight: 3 }
};

export const calculatePriority = (record) => {
  if (record.manualPriority) return record.manualPriority;
  if (!record.etd) return PRIORITY_LEVELS.NORMAL.id;
  
  const today = new Date();
  const etd = new Date(record.etd);
  const diffTime = etd - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 10) return PRIORITY_LEVELS.HIGH.id;
  if (diffDays <= 14) return PRIORITY_LEVELS.MEDIUM.id;
  return PRIORITY_LEVELS.NORMAL.id;
};

export const getPriorityClass = (priority) => {
  switch (priority) {
    case PRIORITY_LEVELS.HIGH.id: return 'badge-high';
    case PRIORITY_LEVELS.MEDIUM.id: return 'badge-medium';
    default: return 'badge-normal';
  }
};

export const SI_PRIORITY_LEVELS = {
  NORMAL: { id: 'NORMAL', weight: 1 },
  AWARE: { id: 'AWARE', weight: 2 },
  HIGH: { id: 'HIGH', weight: 3 }
};

export const calculateSIPriority = (deadlineStr) => {
  if (!deadlineStr) return SI_PRIORITY_LEVELS.NORMAL.id;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deadline = new Date(deadlineStr);
  deadline.setHours(0, 0, 0, 0);
  
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return SI_PRIORITY_LEVELS.HIGH.id;
  if (diffDays === 1) return SI_PRIORITY_LEVELS.AWARE.id;
  return SI_PRIORITY_LEVELS.NORMAL.id;
};

export const getSIPriorityClass = (priority) => {
  switch (priority) {
    case SI_PRIORITY_LEVELS.HIGH.id: return 'si-badge-high';
    case SI_PRIORITY_LEVELS.AWARE.id: return 'si-badge-aware';
    default: return 'si-badge-normal';
  }
};

export const getSIPriorityLabel = (priority) => {
  switch (priority) {
    case SI_PRIORITY_LEVELS.HIGH.id: return 'HIGH';
    case SI_PRIORITY_LEVELS.AWARE.id: return 'NEED TO AWARE';
    default: return 'NORMAL';
  }
};

/**
 * Calculates a total urgency score for a record based on all deadlines.
 * Used for sorting by "Overall Urgency".
 */
export const calculateUrgencyScore = (record) => {
  const siSubmit = SI_PRIORITY_LEVELS[calculateSIPriority(record.si_deadline_submit)]?.weight || 0;
  const siConfirm = SI_PRIORITY_LEVELS[calculateSIPriority(record.si_deadline_confirm)]?.weight || 0;
  const scDeadline = SI_PRIORITY_LEVELS[calculateSIPriority(record.sc_deadline)]?.weight || 0;
  const soPriority = PRIORITY_LEVELS[calculatePriority(record)]?.weight || 0;
  
  // Weights: SI/SC urgency is often more immediate than ETD priority
  return (siSubmit * 1.5) + (siConfirm * 1.2) + (scDeadline * 1.3) + (soPriority * 1.0);
};
