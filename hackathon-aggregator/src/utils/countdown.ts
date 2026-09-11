export function getDaysUntil(deadlineISO: string): { days: number; urgent: boolean } {
  const now = new Date();
  const deadline = new Date(deadlineISO);
  const diffMs = deadline.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return { days: Math.max(days, 0), urgent: days <= 2 };
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
