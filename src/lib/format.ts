// Currency formatting utility
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}

// Date formatting
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(date));
}

// Status calculation
export function getInstallmentStatus(dueDate: string, isPaid: boolean): 'paid' | 'upcoming' | 'due' | 'overdue' {
  if (isPaid) return 'paid';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 7) return 'due';
  return 'upcoming';
}

export function getStatusLabel(status: 'paid' | 'upcoming' | 'due' | 'overdue'): string {
  const labels = {
    paid: 'Paid',
    upcoming: 'Upcoming',
    due: 'Due Soon',
    overdue: 'Overdue',
  };
  return labels[status];
}

// Days until due
export function getDaysUntilDue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDaysMessage(dueDate: string, isPaid: boolean): string {
  if (isPaid) return 'Payment received';
  
  const days = getDaysUntilDue(dueDate);
  
  if (days < 0) {
    const absDays = Math.abs(days);
    return `${absDays} day${absDays > 1 ? 's' : ''} overdue`;
  }
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `Due in ${days} days`;
  return `Due ${formatDate(dueDate)}`;
}
